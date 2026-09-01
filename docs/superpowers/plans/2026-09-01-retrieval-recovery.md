# Retrieval recovery — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lift canonical-set retrieval (50 labels, pre-B baseline R@1 60% / R@3 88% / median 0.592) via Phase B index enrichment (`graph:` frontmatter keywords into the embedding index text) and Phase A lexical-lane recovery (guarded stems + capped bigram boost in `src/search.ts`), then re-derive the router score bands. Phase order B→A (controller probes: enrichment adds +130–160e-3 cosine on the losing cases; stemming alone does not flip the zustand case).

**Architecture:** Phase B changes only the standalone rebuild script's index-text composition (`~/.dsh/awesome-skills/runtime/rebuild2.js`), so the SHA1-keyed embedding cache re-embeds exactly the ~2,100 rows whose text changed. Phase A changes only `src/search.ts` ranking math against the already-enriched index. The canonical benchmark already exists at `/tmp/opencode/labels6k.json` (validated, 50 labels) + `/tmp/opencode/bench6k.mjs` (runner); Task 1 only records the baseline. Band rule is the same mechanical rule as the previous plan.

**Tech Stack:** TypeScript (tsc), standalone Node runtime (`rebuild2.js` + `embcache.json` + `embcore.js`), ONNX MiniLM, /tmp/opencode bench scripts (already written and validated).

## Global Constraints

- Zero npm dependencies; brute-force exact scoring preserved; `search()`/`SkillsSearch` public surface unchanged; `skills_search`/`skills_read` tools untouched.
- Phase B cleaning rules: strip `domain:`/`specialization:`/`skill-area:`/`workflow:`/`role:`/`topic:` prefixes; kebab/hyphens → spaces; drop tokens ≤2 chars; dedupe; cap 12 keywords per skill; field order skillAreas, topics, roles, workflows, domains, specializations; keyword segment = `. ` + comma-space-joined keywords appended after the existing `[name, name, hyphen-keywords, description]` index-text segments.
- Legacy rows (no `graph:`) keep byte-identical index text → embcache hits, zero re-embed. Acceptance: rebuild reports `embeddings: N cached, ~2100 computed`.
- All validation rebuilds write to `DSH_AWESOME_SKILLS_OUT=/tmp/opencode/rebuild-out`; only the ship rebuild writes the real `~/.dsh/awesome-skills/` OUT.
- Phase A stemmer: one suffix per token; `ment` when token ≥9 chars and remainder ≥5; `ing` when ≥7 and remainder ≥4; `es`/`ed` when ≥6 and remainder ≥4; bare `s` when ≥5 and remainder ≥4; `SURVIVE` set `['used','based','docs','e2e']` untouched. Applied identically to query and document tokens.
- Phase A bigram boost: adjacent RAW query-token pairs (post-STOP, pre-stem), max 2 pairs; word-boundary substring match against the document's raw `name + ' ' + description` lowercased; +0.15 per pair capped at 0.3 total; added AFTER the fused base score; regex-escaped against non-alphanumerics.
- Phase A ships only if the canonical bench after A is not worse than the post-B bench (R@3 within ±0 and R@1 not below).
- Benchmark: gold match = case-insensitive substring of any gold fragment in the hit path; labels file is `/tmp/opencode/labels6k.json` (frozen 50 labels); `bench6k.mjs --phase TAG` reports R@1/R@3/median + band verdict.
- Band rule (unchanged): median < 0.55 OR R@3 < 0.8 → 0.6/0.35, else 0.7/0.4.
- Ship flow per ship: sanity one-liner (0 missing, 0 short desc, 0 lark) → `node scripts/preflight.mjs` → copy `~/.dsh/awesome-skills/{skills.json,vectors.f32}` into repo `skills/` → `rm -f skills/gramcache.json skills/gramcache.fp.json skills/qcache.json` → commit → `GIT_TERMINAL_PROMPT=0 git push origin main`.
- Repo files end with exactly one trailing newline; lib/ is tracked (rebuilt artifacts commit with their source); no token in tracked files; runtime files under `~/.dsh/awesome-skills/` never committed.
- Fold-in (previous final-review minor): while Task 2 touches `rebuild2.js`, add the literal-`null` guard after the embcache parse: `if (!cache || typeof cache !== 'object') cache = {}`.

---

### Task 1: Record the pre-B baseline (bench harness already built)

**Files:**
- Evidence only: task report (no repo changes)

**Interfaces:**
- Consumes: `/tmp/opencode/labels6k.json` (50 labels, validated) + `/tmp/opencode/bench6k.mjs` + shipped CLI.
- Produces: the `[pre-B]` numbers every later task gates against.

- [ ] **Step 1: Run the baseline**

```bash
node /tmp/opencode/bench6k.mjs --phase pre-B
```

(Already run by the controller: `[pre-B] R@1 30/50 (60%)  R@3 44/50 (88%)  median 0.592  BANDS: keep 0.7 / 0.4`. Re-run to confirm reproducibility; save the per-label output to the report.)

- [ ] **Step 2: Record baseline numbers in the report** — exact `[pre-B]` line + the 6 weakest labels (MISS/r3 rows) as the watch-list for later tasks.

- [ ] **Step 3: No repo changes** — `git -C /home/ryasr/dsh-awesome-skills status --short` must be clean.

---

### Task 2: Phase B — `graph:` enrichment in `rebuild2.js` + null-guard fold-in

**Files:**
- Modify: `~/.dsh/awesome-skills/runtime/rebuild2.js` (outside the repo)
- Regenerates (validation): `/tmp/opencode/rebuild-out/{skills.json,vectors.f32}`

**Interfaces:**
- Consumes: SKILL.md `graph:` frontmatter (2,102 babysitter files), `embcache.json` (warm), `embcore.js` (DIM 384).
- Produces: enriched index text for graph-bearing rows; legacy rows byte-identical. `graphKeywords(text): string[]` lives in rebuild2.js only.

- [ ] **Step 1: Edit `rebuild2.js`** — three changes:

(a) After the embcache parse block, add the null-guard:

```js
if (!cache || typeof cache !== 'object') cache = {}
```

(b) Above the `;(async () => {` main block, add:

```js
const GRAPH_FIELDS = ['skillAreas', 'topics', 'roles', 'workflows', 'domains', 'specializations']

/** Cleaned keywords from a SKILL.md `graph:` frontmatter block (spec Phase B). */
function graphKeywords(text) {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!fm) return []
  const lines = fm[1].split(/\r?\n/)
  const gi = lines.findIndex(l => /^graph:[ \t]*$/.test(l))
  if (gi < 0) return []
  const block = []
  for (let i = gi + 1; i < lines.length && /^[ \t]/.test(lines[i]); i++) block.push(lines[i])
  const words = []
  for (const field of GRAPH_FIELDS) {
    const line = block.find(l => new RegExp('^[ \\t]+' + field + ':').test(l))
    if (!line) continue
    const items = /\[(.*)\]/.exec(line)
    if (!items) continue
    for (const item of items[1].split(',')) {
      const cleaned = item.trim()
        .replace(/^(domain|specialization|skill-area|workflow|role|topic):/, '')
        .replace(/-/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2)
      words.push(...cleaned)
    }
  }
  return [...new Set(words)].slice(0, 12)
}
```

(c) Two one-line edits inside the main block:

- After the `meta.push({ name: nameOf(fm, dir), path: rel, description: desc })` line, add:
  `meta[meta.length - 1].graphKw = graphKeywords(text)`
- Replace the `texts` derivation's return expression with:

```js
  const texts = meta.map(m => {
    const kws = m.name.split(/[-_]/).filter(w => w.length > 2).join(' ')
    const base = [m.name, m.name, kws, m.description].join('. ')
    return m.graphKw && m.graphKw.length > 0 ? base + '. ' + m.graphKw.join(', ') : base
  })
```

- [ ] **Step 2: Validation rebuild into the scratch OUT**

```bash
mkdir -p /tmp/opencode/rebuild-out
cd ~/.dsh/awesome-skills/runtime && DSH_AWESOME_SKILLS_OUT=/tmp/opencode/rebuild-out node rebuild2.js
```

Expected: `embeddings: ~4000 cached, ~2100 computed`, final line `wrote skills.json + vectors.f32 (…, 6097 rows)`. Record exact counts.

- [ ] **Step 3: Verify legacy-text invariance**

```bash
node -e "
const fs = require('fs')
const a = JSON.parse(fs.readFileSync(process.env.HOME + '/.dsh/awesome-skills/skills.json', 'utf8'))
const b = JSON.parse(fs.readFileSync('/tmp/opencode/rebuild-out/skills.json', 'utf8'))
const changed = a.filter(m => !m.path.includes('a5c-ai/babysitter')).filter(m => {
  const nb = b.find(x => x.path === m.path)
  return !nb || nb.description !== m.description
})
console.log('legacy changed:', changed.length)
if (changed.length) for (const c of changed.slice(0, 5)) console.log('CHANGED:', c.path)
"
```

Expected: `legacy changed: 0`.

- [ ] **Step 4: Cosine-lift probe (acceptance test)**

```bash
node -e "
const fs = require('fs')
const H = process.env.HOME
const emb = require(H + '/.dsh/awesome-skills/runtime/embcore.js')
const meta = JSON.parse(fs.readFileSync('/tmp/opencode/rebuild-out/skills.json', 'utf8'))
const buf = fs.readFileSync('/tmp/opencode/rebuild-out/vectors.f32')
const packed = new Float32Array(buf.buffer, buf.byteOffset, meta.length * 384)
;(async () => {
  await emb.init(H + '/.dsh/awesome-skills/model')
  const cos = (a, b) => { let d = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { d += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i] } return d / (Math.sqrt(na) * Math.sqrt(nb) || 1) }
  const find = f => meta.findIndex(m => m.path.includes(f))
  const cases = [
    ['manage react app state with a tiny store', ['web-development/zustand'], ['app-store-connect']],
    ['validate request payloads with schema parsing', ['web-development/zod'], ['schema-markup', 'json-schema']],
    ['set up end-to-end browser tests', ['qa-testing-automation/playwright-e2e'], ['ux-ui-design/browser-stack']],
  ]
  for (const [q, wins, loses] of cases) {
    const qv = await emb.embed(q)
    const w = Math.max(...wins.map(f => cos(qv, packed.subarray(find(f)*384, (find(f)+1)*384))))
    const l = Math.max(...loses.map(f => cos(qv, packed.subarray(find(f)*384, (find(f)+1)*384))))
    console.log(q.slice(0, 40).padEnd(42), 'win', w.toFixed(3), 'vs lose', l.toFixed(3), w > l ? 'WIN' : 'LOSE')
  }
})()
"
```

Gate: **zustand and zod must WIN** (controller probe: +161e-3/+130e-3). playwright-e2e may stay marginal (+8.6e-3) — acceptable if it does not regress. If zustand or zod LOSEs, STOP → BLOCKED with numbers.

- [ ] **Step 5: No repo changes** — `git status --short` clean.

---

### Task 3: Ship Phase B + bench attribution

**Files:**
- Regenerate + commit: `skills/skills.json`, `skills/vectors.f32`

**Interfaces:**
- Consumes: validated rebuild (Task 2).
- Produces: shipped enriched index; `[post-B]` vs `[pre-B]` numbers.

- [ ] **Step 1: Real rebuild + sanity + preflight + ship**

```bash
cd ~/.dsh/awesome-skills/runtime && node rebuild2.js
node -e "
const fs = require('fs')
const m = JSON.parse(fs.readFileSync(process.env.HOME + '/.dsh/awesome-skills/skills.json', 'utf8'))
console.log('rows:', m.length)
console.log('missing bodies:', m.filter(s => !fs.existsSync(process.env.HOME + '/.dsh/awesome-skills/skills/' + s.path + '/SKILL.md')).length)
console.log('short descriptions:', m.filter(s => (s.description || '').trim().length < 20).length)
console.log('lark leftovers:', m.filter(s => s.path.toLowerCase().includes('lark')).length)
"
cd /home/ryasr/dsh-awesome-skills && node scripts/preflight.mjs
cp ~/.dsh/awesome-skills/skills.json ~/.dsh/awesome-skills/vectors.f32 /home/ryasr/dsh-awesome-skills/skills/
rm -f /home/ryasr/dsh-awesome-skills/skills/gramcache.json /home/ryasr/dsh-awesome-skills/skills/gramcache.fp.json /home/ryasr/dsh-awesome-skills/skills/qcache.json
```

Expected: all zeros; `preflight ok: dsh-awesome-skills`; only the two artifacts modified in the repo.

- [ ] **Step 2: Bench + attribution + regression queries**

```bash
node /tmp/opencode/bench6k.mjs --phase post-B
printf '%s' '{"query":"send email to team","k":3}' | node /home/ryasr/dsh-awesome-skills/lib/query.js
```

Gate: `[post-B]` R@3 ≥ `[pre-B]` (88%) and R@1 > 60%; the email query still returns email-* hits. If R@3 regressed: STOP → BLOCKED (revert = delete graphKw lines from rebuild2.js, rebuild, re-ship — cheap via cache).

- [ ] **Step 3: Commit + push**

```bash
cd /home/ryasr/dsh-awesome-skills
git add skills/skills.json skills/vectors.f32
git commit -m "data: enrich index text with graph frontmatter keywords (retrieval recovery, phase B)"
GIT_TERMINAL_PROMPT=0 git push origin main
```

---

### Task 4: Phase A — lexical lane in `src/search.ts`

**Files:**
- Modify: `src/search.ts` (module scope near `toks` ~line 48; `search()` rerank section ~lines 381-405)
- Rebuild: `lib/` via `npm run build`

**Interfaces:**
- Produces: module-private `S2_ENDS`, `SURVIVE`, `stem(w: string): string`, `bigrams(q: string): string[]`; `toks` keeps signature `(s: string) => string[]`, now applying `stem` after the filter. Rerank adds the boost after the fused `base`. Public surface unchanged.

- [ ] **Step 1: Implement the stemmer + tokenizer change**

Add next to `toks`, then replace `toks` with:

```ts
const S2_ENDS = new Set(['es', 'ed'])
/** Tokens the stemmer must never touch (probe-verified meaningful as-is). */
const SURVIVE = new Set(['used', 'based', 'docs', 'e2e'])
/** Light suffix stemming with length guards (one suffix per token). */
const stem = (w: string): string => {
  if (SURVIVE.has(w)) return w
  if (w.length >= 9 && w.endsWith('ment') && w.length - 4 >= 5) return w.slice(0, -4)
  if (w.length >= 7 && w.endsWith('ing') && w.length - 3 >= 4) return w.slice(0, -3)
  if (w.length >= 6 && S2_ENDS.has(w.slice(-2)) && w.length - 2 >= 4) return w.slice(0, -2)
  if (w.length >= 5 && w.endsWith('s') && w.length - 1 >= 4) return w.slice(0, -1)
  return w
}
const toks = (s: string): string[] =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(w => w.length > 2 && !STOP.has(w)).map(stem)
```

- [ ] **Step 2: Implement the bigram boost**

Add the helper next to `stem`:

```ts
/** Adjacent raw query-token pairs (post-STOP, pre-stem), capped at 2. */
const bigrams = (q: string): string[] => {
  const t = String(q).toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(w => w.length > 2 && !STOP.has(w))
  return t.length >= 2 ? t.slice(0, -1).map((w, i) => w + ' ' + t[i + 1]).slice(0, 2) : []
}
```

In `search()`, after the `qt` construction line, add:

```ts
    const qBigrams = bigrams(q)
```

Inside the `scored = order.map(...)` loop, after the `base` computation, add:

```ts
      // Bigram tie-breaker: surface phrase evidence in raw name+description.
      let boost = 0
      if (qBigrams.length > 0) {
        const docText = (m.name + ' ' + m.description).toLowerCase()
        for (const b of qBigrams) {
          if (boost >= 0.3) break
          if (new RegExp('\\b' + b.replace(/[^a-z0-9 ]/g, '') + '\\b').test(docText)) boost += 0.15
        }
      }
      return { i, score: base + boost }
```

(replacing the current `return { i, score: base }`).

- [ ] **Step 3: Build + stem unit assertions (via the live index)**

```bash
cd /home/ryasr/dsh-awesome-skills && npm run build && node --input-type=module -e "
import { SkillIndex } from './lib/search.js'
const H = process.env.HOME
const idx = new SkillIndex({ corpusDir: H + '/.dsh/awesome-skills/skills', indexDir: H + '/dsh-awesome-skills/skills', modelDir: H + '/.dsh/awesome-skills/model', cacheDir: '/tmp/opencode/stemprobe-cache' })
// Guard cases: these must not change shape (top hit path recorded, no crash):
for (const q of ['json', 'zod', 'zustand', 'e2e testing', 'used books docs']) {
  const r = await idx.search(q, 3)
  console.log(q.padEnd(20), '->', r.map(h => h.path.split('/').pop()).join(', '))
}
"
```

Expected: no crash, sensible hits, no empty result arrays.

- [ ] **Step 4: Commit (code only; no index change)**

```bash
cd /home/ryasr/dsh-awesome-skills
git add src/search.ts lib
git commit -m "feat: guarded suffix stemming + capped bigram boost in the lexical lane (phase A)"
```

---

### Task 5: Final bench, band application, ship code, push

**Files:**
- Modify: `src/index.ts` (band numbers ONLY if the verdict differs from shipped 0.6/0.35; plus re-sync `lib/`)
- Verify + push everything

**Interfaces:**
- Consumes: post-A shipped index (Task 3) + Phase A code (Task 4).
- Produces: final canonical numbers, final bands in the router.

- [ ] **Step 1: Post-A bench + regression queries**

```bash
node /tmp/opencode/bench6k.mjs --phase post-A
printf '%s' '{"query":"manage react app state","k":3}' | node /home/ryasr/dsh-awesome-skills/lib/query.js
printf '%s' '{"query":"send email to team","k":3}' | node /home/ryasr/dsh-awesome-skills/lib/query.js
```

Gate (Phase A ship rule): R@3 ≥ post-B's R@3 and R@1 ≥ post-B's R@1. If violated: revert Task 4's commit (`git revert <sha>`, rebuild, re-verify) and record A as rejected-by-benchmark.

- [ ] **Step 2: Band verdict application**

Read the bench verdict line. If `keep 0.7 / 0.4` while the router ships 0.6/0.35: edit `ROUTER_SKILL`'s band bullets in `src/index.ts` (0.6→0.7, 0.35→0.4 in the three band mentions), then `npm run build` and `rsync -a --delete lib/ ~/.dsh/profiles/web/node_modules/dsh-awesome-skills/lib/`. If the verdict stays `drop to 0.6 / 0.35`: no edit (already shipped).

- [ ] **Step 3: README numbers**

Update the README Ranking section's calibration sentence with the final canonical numbers (one sentence, e.g. "re-checked on the shipped corpus with a 50-label canonical set: R@1 X%, R@3 Y%."). No other README changes.

- [ ] **Step 4: Commit + push**

```bash
cd /home/ryasr/dsh-awesome-skills
git add README.md src/index.ts lib
git commit -m "docs+feat: retrieval recovery final numbers and router bands"
GIT_TERMINAL_PROMPT=0 git push origin main
```

(If Step 2 made no src change, commit README.md only and adjust the message to `docs: retrieval recovery final numbers`.)

---

## Self-review notes

- Spec coverage: Phase B enrichment (Tasks 2-3, cleaning rules verbatim), Phase A stems+bigrams (Task 4, guards verbatim), canonical bench (Task 1 baseline; Tasks 3/5 attribution), band re-derivation (Task 5 Step 2, same mechanical rule), sanity+ship+push (Tasks 3/5), null-guard fold-in (Task 2 Step 1a). Targets: spec's R@1 ≥ 65% / R@3 ≥ 85% become the Task 5 success read-out (with the spec's +10pts escape hatch if B+A land short).
- Type consistency: `stem`/`bigrams`/`S2_ENDS`/`SURVIVE` names consistent between Task 4 steps; `graphKw`/`graphKeywords` between Task 2 steps; bench flags `--phase pre-B|post-B|post-A` consistent.
- No placeholders: all code blocks are complete and transcribable; the bench harness and labels file ALREADY EXIST and are validated (50 labels; baseline line recorded in the header).
- Honesty note: the plan's Task 2 Step 4 gate reflects real probe evidence (+161e-3/+130e-3 zustand/zod), and Task 4's boost block was derived from the verified probe logic; the stemmer's exact guard values (9/7/6/5) are the probe's, restated verbatim.
- Prior drafting failure (two corrupted plan attempts) is corrected by this rewrite; the labels JSON corruption that motivated the rewrite is fixed at the real file (`/tmp/opencode/labels6k.json` validated separately from this document).
