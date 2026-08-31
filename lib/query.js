/**
 * Command-line entry point for the bundled `skill-router` skill.
 *
 * Reads `{"query":"...","k":5}` on stdin, writes one JSON line on stdout.
 * Deliberately a thin wrapper: the skill's instructions only need a process
 * that speaks JSON on both ends.
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillIndex } from './search.js';
const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Index (skills.json / vectors.f32) ships with the package; the skill bodies
// live in the canonical corpus directory, which may be overridden per host.
const INDEX_DIR = process.env.DSH_AWESOME_SKILLS_INDEX ?? join(PKG_ROOT, 'skills');
const CORPUS = process.env.DSH_AWESOME_SKILLS_CORPUS
    ?? join(process.env.HOME ?? '', '.dsh', 'awesome-skills', 'skills');
const MODEL = join(PKG_ROOT, 'model');
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => {
    input += c;
});
process.stdin.on('end', async () => {
    const t0 = Date.now();
    try {
        const req = JSON.parse(input);
        const index = new SkillIndex({
            corpusDir: CORPUS,
            indexDir: INDEX_DIR,
            modelDir: MODEL,
            cacheDir: INDEX_DIR,
        });
        const hits = await index.search(String(req.query ?? ''), Number(req.k) || 5);
        process.stdout.write(JSON.stringify({ ok: true, ms: Date.now() - t0, count: index.count(), results: hits }) + '\n');
    }
    catch (error) {
        process.stdout.write(JSON.stringify({ ok: false, ms: Date.now() - t0, error: error instanceof Error ? error.message : String(error) }) + '\n');
    }
});
//# sourceMappingURL=query.js.map