/**
 * Semantic search over the bundled skill corpus.
 *
 * Ported from the standalone `~/.dsh/awesome-skills/runtime` scripts, keeping
 * the calibrated hybrid ranking (semantic + lexical IDF + char 3-gram) and the
 * lazy gram cache. The corpus is NOT a skill discovery root, so 16,000 skills
 * never enter the per-turn model catalog.
 */
import { readFileSync, existsSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadOrt } from './ort-loader.js';
/** Package root: this file compiles to <root>/lib/search.js. */
const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/** Directory holding the vendored .wasm binaries (adjacent to the bundle). */
const ORT_WASM_DIR = join(PKG_ROOT, 'vendor', 'ort');
/** Embedding dimensionality of all-MiniLM-L6-v2. */
export const DIM = 384;
/** Candidate pool fed to the reranker. 50 was tuned for a 677-skill corpus. */
export const POOL = 1200;
/** Hybrid weights: score = (1-W)*vector + W*lexical + G*gram. */
const WEIGHT = 0.55;
const GRAM_WEIGHT = 0.5;
/** Max results a caller may request. */
const MAX_K = 25;
/** Query-embedding cache size. */
const MAX_CACHE = 2000;
const STOP = new Set('a an the for to of on in with my our this that is are be how what why when do i you it and or build set up write plan create new'.split(' '));
const GRAM = 3;
const toks = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(w => w.length > 2 && !STOP.has(w));
/** An index over one corpus. Build once, query many times. */
export class SkillIndex {
    opts;
    meta = [];
    packed = new Float32Array(0);
    session;
    ort;
    vocab;
    unk = '[UNK]';
    df;
    docGrams = [];
    docGramNorms = [];
    gramsDirty = false;
    gramsFromCache = false;
    qcache = new Map();
    files;
    constructor(opts) {
        this.opts = opts;
        this.files = {
            meta: join(opts.indexDir, 'skills.json'),
            vectors: join(opts.indexDir, 'vectors.f32'),
            model: join(opts.modelDir, 'model_quantized.onnx'),
            tokenizer: join(opts.modelDir, 'tokenizer.json'),
            grams: join(opts.cacheDir, 'gramcache.json'),
            fp: join(opts.cacheDir, 'gramcache.fp.json'),
            qcache: join(opts.cacheDir, 'qcache.json'),
        };
    }
    /** Number of indexed skills. */
    count() {
        return this.meta.length;
    }
    /** Load the corpus files if they are not loaded yet. Idempotent. */
    ensureLoaded() {
        this.loadCorpus();
    }
    loadCorpus() {
        if (this.meta.length > 0)
            return;
        this.meta = JSON.parse(readFileSync(this.files.meta, 'utf8'));
        const buf = readFileSync(this.files.vectors);
        this.packed = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
        this.docGrams = new Array(this.meta.length).fill(null);
        this.docGramNorms = new Array(this.meta.length).fill(0);
    }
    async ensureModel() {
        if (this.session)
            return;
        if (this.ort === undefined)
            this.ort = await loadOrt(ORT_WASM_DIR);
        const ort = this.ort;
        // ort.wasm treats a path argument as a URL in Node ESM; hand it bytes instead.
        this.session = await ort.InferenceSession.create(new Uint8Array(readFileSync(this.files.model)), { executionProviders: ['wasm'] });
        const tk = JSON.parse(readFileSync(this.files.tokenizer, 'utf8'));
        // Null prototype: skill text legitimately contains tokens like
        // 'constructor', 'toString', '__proto__' - a normal object would resolve
        // those up the prototype chain and yield a FUNCTION, which BigInt() rejects.
        this.vocab = Object.assign(Object.create(null), tk.model.vocab);
        this.unk = tk.model.unk_token || '[UNK]';
        if (typeof this.vocab[this.unk] !== 'number')
            this.vocab[this.unk] = 100;
    }
    wordpiece(word) {
        const out = [];
        let start = 0;
        while (start < word.length) {
            let end = word.length;
            let cur = null;
            while (start < end) {
                const cand = (start > 0 ? '##' : '') + word.slice(start, end);
                if (this.vocab[cand] !== undefined) {
                    cur = cand;
                    break;
                }
                end--;
            }
            if (cur === null)
                return [this.unk];
            out.push(cur);
            start = end;
        }
        return out;
    }
    encode(text) {
        const toksOut = ['[CLS]'];
        for (const w of String(text).trim().split(/\s+/)) {
            for (const t of this.wordpiece(w.toLowerCase()))
                toksOut.push(t);
            if (toksOut.length >= 127)
                break;
        }
        toksOut.push('[SEP]');
        const n = toksOut.length;
        const ids = new BigInt64Array(n);
        const att = new BigInt64Array(n).fill(1n);
        const tt = new BigInt64Array(n);
        for (let i = 0; i < n; i++) {
            const v = this.vocab[toksOut[i]];
            ids[i] = BigInt(typeof v === 'number' ? v : this.vocab[this.unk]);
        }
        return { ids, att, tt, n };
    }
    static pool(out, n) {
        const v = new Float32Array(DIM);
        for (let i = 0; i < n; i++)
            for (let d = 0; d < DIM; d++)
                v[d] += out[i * DIM + d];
        for (let d = 0; d < DIM; d++)
            v[d] /= n;
        let nr = 0;
        for (let d = 0; d < DIM; d++)
            nr += v[d] * v[d];
        nr = Math.sqrt(nr) || 1;
        for (let d = 0; d < DIM; d++)
            v[d] /= nr;
        return v;
    }
    /** Embed one text. L2-normalized mean pooling. */
    async embed(text) {
        await this.ensureModel();
        const ort = this.ort;
        const e = this.encode(text);
        const feeds = {
            input_ids: new ort.Tensor('int64', e.ids, [1, e.n]),
            attention_mask: new ort.Tensor('int64', e.att, [1, e.n]),
            token_type_ids: new ort.Tensor('int64', e.tt, [1, e.n]),
        };
        const r = await this.session.run(feeds);
        const out = (r.last_hidden_state ? r.last_hidden_state.data : r[Object.keys(r)[0]].data);
        return SkillIndex.pool(out, e.n);
    }
    // ---- lanes ----------------------------------------------------------
    buildDf() {
        const df = new Map();
        for (const m of this.meta)
            for (const t of new Set(toks(m.name + '. ' + m.description)))
                df.set(t, (df.get(t) || 0) + 1);
        df.set('__n', this.meta.length);
        return df;
    }
    idf(t) {
        const n = this.df.get('__n');
        return Math.log(n / (1 + (this.df.get(t) || 0)));
    }
    lexical(qt, dm) {
        let dot = 0;
        let qn = 0;
        let dn = 0;
        for (const [t, qc] of qt) {
            const w = this.idf(t);
            const qw = qc * w;
            qn += qw * qw;
            const dc = dm.get(t);
            if (dc)
                dot += qw * (dc * w);
        }
        for (const [t, v] of dm) {
            const w = this.idf(t);
            dn += (v * w) * (v * w);
        }
        return dot / ((Math.sqrt(qn) * Math.sqrt(dn)) || 1);
    }
    static grams(s) {
        const t = '  ' + String(s).toLowerCase().replace(/\s+/g, ' ') + '  ';
        const m = new Map();
        for (let i = 0; i + GRAM <= t.length; i++) {
            const g = t.slice(i, i + GRAM);
            m.set(g, (m.get(g) || 0) + 1);
        }
        return m;
    }
    static gramCos(qg, dg, qn, dn) {
        let dot = 0;
        const small = qg.size < dg.size ? qg : dg;
        const big = small === qg ? dg : qg;
        for (const [g, c] of small) {
            const o = big.get(g);
            if (o)
                dot += c * o;
        }
        return dot / ((qn * dn) || 1);
    }
    // ---- gram cache -----------------------------------------------------
    corpusFingerprint() {
        const h = createHash('sha1');
        h.update(String(this.meta.length));
        for (const m of this.meta)
            h.update(m.name || '').update('\u0000').update(m.description || '').update('\u0000');
        return h.digest('hex');
    }
    loadGramCache() {
        try {
            const fp = JSON.parse(readFileSync(this.files.fp, 'utf8'));
            if (fp.fp !== this.corpusFingerprint())
                return;
            const raw = JSON.parse(readFileSync(this.files.grams, 'utf8'));
            if (!Array.isArray(raw) || raw.length !== this.meta.length)
                return;
            this.docGrams = raw.map(a => (a ? new Map(a) : null));
            this.gramsFromCache = true;
        }
        catch {
            /* absent or unreadable cache -> rebuild lazily */
        }
    }
    saveGramCache() {
        try {
            const plain = this.docGrams.map(g => (g ? Array.from(g) : null));
            const tmp = this.files.grams + '.' + process.pid + '.tmp';
            writeFileSync(tmp, JSON.stringify(plain));
            renameSync(tmp, this.files.grams);
            const fpt = this.files.fp + '.' + process.pid + '.tmp';
            writeFileSync(fpt, JSON.stringify({ fp: this.corpusFingerprint(), t: Date.now(), n: this.meta.length }));
            renameSync(fpt, this.files.fp);
        }
        catch {
            try {
                unlinkSync(this.files.grams + '.' + process.pid + '.tmp');
            }
            catch { }
            /* a failed cache write must never break a query */
        }
    }
    gramsFor(i) {
        let g = this.docGrams[i];
        if (g === null) {
            g = SkillIndex.grams(this.meta[i].name + '. ' + this.meta[i].description);
            this.docGrams[i] = g;
            this.gramsDirty = true;
        }
        let nrm = this.docGramNorms[i];
        if (!nrm) {
            let x = 0;
            for (const c of g.values())
                x += c * c;
            nrm = Math.sqrt(x) || 1;
            this.docGramNorms[i] = nrm;
        }
        return [g, nrm];
    }
    // ---- query ----------------------------------------------------------
    cacheGet(key) {
        const e = this.qcache.get(key);
        if (!e)
            return undefined;
        const a = Buffer.from(e.v, 'base64');
        return new Float32Array(a.buffer, a.byteOffset, a.byteLength / 4);
    }
    cacheSet(key, vec) {
        this.qcache.set(key, { v: Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength).toString('base64'), t: Date.now() });
        if (this.qcache.size > MAX_CACHE) {
            const oldest = [...this.qcache.entries()].sort((a, b) => a[1].t - b[1].t).slice(0, this.qcache.size - MAX_CACHE);
            for (const [k] of oldest)
                this.qcache.delete(k);
        }
        try {
            const tmp = this.files.qcache + '.' + process.pid + '.tmp';
            writeFileSync(tmp, JSON.stringify(Object.fromEntries(this.qcache)));
            renameSync(tmp, this.files.qcache);
        }
        catch { }
    }
    /**
     * Search the corpus.
     * @param query - a plain-language description of the goal.
     * @param k - number of results, clamped to 25.
     * @returns ranked hits, best first.
     */
    async search(query, k = 5) {
        this.loadCorpus();
        const q = String(query ?? '');
        const want = Math.min(Math.max(1, Math.floor(k) || 5), MAX_K);
        const key = createHash('sha1').update(q).digest('hex');
        let vec = this.cacheGet(key);
        if (!vec) {
            vec = await this.embed(q);
            this.cacheSet(key, vec);
        }
        if (!this.df)
            this.df = this.buildDf();
        if (this.docGrams.length === 0)
            this.loadGramCache();
        const n = this.meta.length;
        const s = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const o = i * DIM;
            let x = 0;
            for (let d = 0; d < DIM; d++)
                x += vec[d] * this.packed[o + d];
            s[i] = x;
        }
        const order = Array.from(s.keys()).sort((a, b) => s[b] - s[a]).slice(0, POOL);
        const qt = new Map();
        for (const w of toks(q))
            qt.set(w, (qt.get(w) || 0) + 1);
        const qg = SkillIndex.grams(q);
        let qn = 0;
        for (const c of qg.values())
            qn += c * c;
        qn = Math.sqrt(qn) || 1;
        if (qt.size === 0 && qg.size === 0) {
            return order.slice(0, want).map(i => this.hit(i, s[i]));
        }
        const scored = order.map(i => {
            const m = this.meta[i];
            const dm = new Map();
            for (const w of toks(m.name + '. ' + m.description))
                dm.set(w, (dm.get(w) || 0) + 1);
            for (const w of toks(m.name))
                dm.set(w, (dm.get(w) || 0) + 2);
            const [dg, dgn] = this.gramsFor(i);
            const gsim = SkillIndex.gramCos(qg, dg, qn, dgn);
            const lex = this.lexical(qt, dm);
            return { i, score: (1 - WEIGHT) * s[i] + WEIGHT * lex + GRAM_WEIGHT * gsim };
        });
        scored.sort((a, b) => b.score - a.score);
        if (this.gramsDirty && !this.gramsFromCache) {
            this.saveGramCache();
            this.gramsDirty = false;
            this.gramsFromCache = false;
        }
        return scored.slice(0, want).map(h => this.hit(h.i, h.score));
    }
    hit(i, score) {
        const m = this.meta[i];
        return { name: m.name, path: m.path || m.name, score: +score.toFixed(4), description: this.clip(m.description, 300) };
    }
    clip(s, max) {
        if (!s)
            return '';
        if (s.length <= max)
            return s;
        const cut = s.slice(0, max);
        const sp = cut.lastIndexOf(' ');
        return (sp > max * 0.6 ? cut.slice(0, sp) : cut) + '\u2026';
    }
    /** Absolute path of a skill's directory, for reading its SKILL.md. */
    skillDir(path) {
        return join(this.opts.corpusDir, path);
    }
}
/**
 * Register the search service on the host context.
 * @returns the service, for callers that want it directly.
 */
export function registerSearchService(ctx, opts) {
    const bundledModel = join(opts.runtimeDir, '..', 'model');
    const index = new SkillIndex({
        corpusDir: opts.corpusDir,
        indexDir: opts.indexDir,
        modelDir: existsSync(join(bundledModel, 'model_quantized.onnx'))
            ? bundledModel
            : join(process.env.HOME ?? '', '.dsh', 'awesome-skills', 'model'),
        cacheDir: opts.corpusDir,
    });
    const service = {
        count: () => {
            index.ensureLoaded();
            return index.count();
        },
        search: (query, k) => index.search(query, k),
        skillDir: (path) => index.skillDir(path),
    };
    ctx['skills-search'] = service;
    ctx.logger.info(`dsh-awesome-skills: indexDir=${opts.indexDir} corpus=${opts.corpusDir}`);
    return service;
}
//# sourceMappingURL=search.js.map