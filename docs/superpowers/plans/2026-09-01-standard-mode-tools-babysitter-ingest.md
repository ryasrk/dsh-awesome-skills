# Standard-mode corpus tools + babysitter ingest — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the skill corpus usable in standard permission mode by registering two model-facing tools (`skills_search`, `skills_read`) on the host's `tools` service, and ingest the 2,102-skill a5c-ai/babysitter pack into the corpus with a cached rebuild.

**Architecture:** The plugin is a static cordis bundle (plain ESM, no sandbox), so it registers tools directly via `ctx.tools.register(plainObject)` — no `@deepseek-ai/dsh-tools` import; the `ToolDefinition` subset is declared structurally in `cordis-types.ts` (same pattern as `routes.ts` for webServer). Tools execute in-process with host authority, so the agent never needs Bash or out-of-workspace Read. The router skill flips tool-first with a one-paragraph bash fallback. `rebuild2.js` gains a SHA1-keyed embedding cache.

**Tech Stack:** TypeScript (tsc + tsdown), cordis plugin protocol, existing MiniLM search service, Node one-off scripts in `/tmp/opencode/`.

## Global Constraints

- Zero npm dependencies added; all host services accessed structurally (`ctx.inject([...], cb)` / `ctx.get`), degrade-with-warning, never crash `apply` (pattern: `routes.ts`, `priority-loader.ts`).
- Tool execute MUST never throw across the seam: guards and unexpected errors return `{ ok: false, error }` (spec error-handling section).
- `skills_read` guards, all in one audit point in `src/tools.ts`: resolved path must stay under `corpusDir` (no `..`, no absolute injection); extension allowlist `.md .txt .json .js .mjs .ts .py .sh .html .css .yaml .yml .toml`; 64 KiB per-read cap.
- Search `k`: default 5, clamp to [1, 20] (service hard cap is 25 — stay below).
- Corpus target layout: `~/.dsh/awesome-skills/skills/a5c-ai/babysitter/<specialization-or-methodology>/<skill>/` with companion files verbatim; no manual frontmatter fixes (rebuild2.js body-derived fallback covers the 31 no-frontmatter skills).
- Embedding cache file: `~/.dsh/awesome-skills/embcache.json` (runtime dir, beside skills.json — NOT in the repo, NOT copied to the package).
- Ship flow per ship: `node rebuild2.js` → sanity → `node scripts/preflight.mjs` → `cp ~/.dsh/awesome-skills/{skills.json,vectors.f32}` into repo `skills/` → `rm -f skills/gramcache.json skills/gramcache.fp.json skills/qcache.json` → commit → `GIT_TERMINAL_PROMPT=0 git push origin main`.
- Router score bands stay 0.7/0.4 unless the new benchmark median top-1 score < 0.55 or R@3 < 80% — then drop to 0.6/0.35.
- GitHub token lives in `~/.git-credentials` / remote URL only; never write it into tracked files.
- Files end with exactly one trailing newline.

---

### Task 1: Structural tool contracts in `cordis-types.ts`

**Files:**
- Modify: `src/cordis-types.ts`

**Interfaces:**
- Produces: `ToolDefinition`, `ToolsService` types (consumed by Task 2's `src/tools.ts`). Structural only — no runtime code.

- [ ] **Step 1: Add the tool contract types**

Append to `src/cordis-types.ts` (keep the existing file header comment intact):

```ts
/**
 * Structural subset of a host tool definition this plugin registers. The
 * host's `tools.register` validates `output.render`, `output.schema` (against
 * its enforced JSON-Schema subset: type object/array/string/number/integer/
 * boolean/null + oneOf — the author-only `type: 'json'` DSL node is NOT valid
 * here), and the reserved-name/timeout rules at registration time. A plain
 * object is accepted without importing the harness's `defineTool` DSL (which
 * is not published to npm). `parameters` is passed through to the LLM wire
 * verbatim (`function.parameters`), so it MUST be raw JSON Schema
 * (object-rooted, `required` as an array of names) — never the DSL's
 * per-property `required: true` style, which the runtime's argument validator
 * would silently ignore.
 */
export interface ToolDefinition {
  /** Unique tool name shown to the model. */
  name: string
  /** Description sent to the model. */
  description: string
  /** Raw JSON Schema for the arguments (object-rooted). */
  parameters: Record<string, unknown>
  output: {
    /** Value schema for the execute result, in the host's supported subset. */
    schema: Record<string, unknown>
    /** Model-facing content for one validated result value. */
    render(args: unknown, value: unknown): Array<{ type: 'text'; text: string }>
  }
}

/** Structural subset of the host `tools` service registry. */
export interface ToolsService {
  /** Register one tool; returns its disposer. Throws on invalid definitions. */
  register(definition: ToolDefinition): () => void
}
```

- [ ] **Step 2: Build to verify types compile**

Run: `cd /home/ryasr/dsh-awesome-skills && npm run build`
Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
cd /home/ryasr/dsh-awesome-skills
git add src/cordis-types.ts
git commit -m "feat: structural tool-definition contracts for host tools service"
```

---

### Task 2: `src/tools.ts` — the two tools with guards

**Files:**
- Create: `src/tools.ts`

**Interfaces:**
- Consumes: `SkillsSearch` from `./search.js` (`search(query, k)`, `count()`, `skillDir(path)`), `ToolDefinition`, `ToolsService` from `./cordis-types.js`.
- Produces: `registerSkillsTools(ctx, search, corpusDir): void` — mounts both tools through `ctx.inject(['tools'], ...)`; no-op with a warning when the host lacks the seam.

- [ ] **Step 1: Write `src/tools.ts` in full**

```ts
/**
 * Model-facing corpus tools: `skills_search` and `skills_read`.
 *
 * These are the standard-permission-mode access path to the corpus. Both run
 * in-process with host authority — the agent never needs Bash or a Read
 * outside its workspace, which standard permission mode blocks. Registration
 * goes through the host `tools` service observed structurally (see
 * cordis-types.ts); on a host without it the router's bash fallback covers
 * the gap, so a missing seam degrades, never fails.
 *
 * `execute` never throws across the seam: every failure returns
 * `{ ok: false, error }`, including unexpected ones, so the model can correct
 * course (e.g. re-ask with a fixed path) instead of dead-ending.
 */

import { statSync, readFileSync } from 'node:fs'
import { isAbsolute, join, resolve, sep, extname } from 'node:path'
import type { PluginContext, ToolDefinition, ToolsService } from './cordis-types.js'
import type { SkillsSearch } from './search.js'

/** Upper bound of one file body returned by `skills_read`. */
const MAX_READ_BYTES = 64 * 1024
/** Result count clamp for `skills_search` (service hard cap is 25). */
const MAX_K = 20
const DEFAULT_K = 5
/** File extensions `skills_read` will return. */
const READABLE_EXTENSIONS = new Set([
  '.md', '.txt', '.json', '.js', '.mjs', '.ts', '.py', '.sh',
  '.html', '.css', '.yaml', '.yml', '.toml',
])

/** One guard failure or hit, shared by both tools. */
type ToolOutcome =
  | { ok: true; [key: string]: unknown }
  | { ok: false; error: string }

/**
 * Resolve `subpath` under `corpusDir` and reject traversal: the resolved
 * location must remain inside the corpus. Returns the error string on
 * failure, or the absolute path on success.
 */
function resolveInsideCorpus(corpusDir: string, subpath: string): { path: string } | { error: string } {
  const root = resolve(corpusDir)
  const target = resolve(isAbsolute(subpath) ? subpath : join(root, subpath))
  if (target !== root && !target.startsWith(root + sep)) {
    return { error: `path escapes the corpus: ${subpath}` }
  }
  return { path: target }
}

/** Validate one `skills_read` request; returns the absolute file path or an error. */
function resolveReadTarget(corpusDir: string, path: string, file?: string): { path: string } | { error: string } {
  if (typeof path !== 'string' || path.trim() === '') return { error: '`path` must be a non-empty skill path' }
  if (file !== undefined && (typeof file !== 'string' || file.trim() === '')) {
    return { error: '`file` must be a non-empty file name when present' }
  }
  const rel = file === undefined ? join(path, 'SKILL.md') : join(path, file)
  const resolved = resolveInsideCorpus(corpusDir, rel)
  if ('error' in resolved) return resolved
  const ext = extname(resolved.path).toLowerCase()
  if (!READABLE_EXTENSIONS.has(ext)) {
    return { error: `extension "${ext || '(none)'}" is not readable; allowed: ${[...READABLE_EXTENSIONS].join(' ')}` }
  }
  try {
    const size = statSync(resolved.path).size
    if (size > MAX_READ_BYTES) {
      return { error: `file is ${size} bytes; the read cap is ${MAX_READ_BYTES}` }
    }
  } catch {
    return { error: `not found: ${path}${file === undefined ? '' : `/${file}`}` }
  }
  return resolved
}

/** Build the `skills_search` definition. */
function searchTool(search: SkillsSearch): ToolDefinition {
  return {
    name: 'skills_search',
    description:
      'Search a local, vector-indexed corpus of ~6,000 curated agent skills '
      + '(testing, frontend, backend, cloud, data, writing, security, research, media). '
      + 'Returns ranked hits with path, name, score, and a one-line description. '
      + 'Use before any concrete build/fix/test/deploy/configure/review task; follow up with skills_read on the best hit.',
    parameters: {
      type: 'object',
      additionalProperties: true,
      properties: {
        query: { type: 'string', description: 'The task goal in plain words (a goal, not a keyword list).' },
        k: { type: 'integer', description: 'How many results to return (1-20, default 5).' },
      },
      required: ['query'],
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          ok: { type: 'boolean' },
          error: { type: 'string' },
          count: { type: 'integer' },
          results: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
              properties: {
                name: { type: 'string' },
                path: { type: 'string' },
                score: { type: 'number' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    async execute(args): Promise<ToolOutcome> {
      try {
        const { query, k } = args as { query?: unknown; k?: unknown }
        if (typeof query !== 'string' || query.trim() === '') return { ok: false, error: '`query` must be a non-empty string' }
        const limit = k === undefined ? DEFAULT_K : Math.min(MAX_K, Math.max(1, Math.floor(Number(k) || DEFAULT_K)))
        const results = await search.search(query, limit)
        return { ok: true, count: search.count(), results }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) }
      }
    },
  }
}

/** Build the `skills_read` definition. */
function readTool(corpusDir: string): ToolDefinition {
  return {
    name: 'skills_read',
    description:
      'Read a skill file from the local skill corpus searched by skills_search. '
      + 'Pass the hit\'s `path` to load its SKILL.md playbook, or add `file` for a '
      + 'reference file inside that skill\'s directory (templates, examples, scripts).',
    parameters: {
      type: 'object',
      additionalProperties: true,
      properties: {
        path: { type: 'string', description: "A skill path exactly as returned by skills_search." },
        file: { type: 'string', description: 'A file inside the skill directory (defaults to SKILL.md).' },
      },
      required: ['path'],
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          ok: { type: 'boolean' },
          error: { type: 'string' },
          path: { type: 'string' },
          file: { type: 'string' },
          content: { type: 'string' },
        },
      },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    async execute(args): Promise<ToolOutcome> {
      try {
        const { path, file } = args as { path?: unknown; file?: unknown }
        if (typeof path !== 'string') return { ok: false, error: '`path` must be a string' }
        if (file !== undefined && typeof file !== 'string') return { ok: false, error: '`file` must be a string when present' }
        const target = resolveReadTarget(corpusDir, path, file)
        if ('error' in target) return { ok: false, error: target.error }
        return { ok: true, path, file: file ?? 'SKILL.md', content: readFileSync(target.path, 'utf8') }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) }
      }
    },
  }
}

/**
 * Register both tools on the host `tools` service.
 * @param ctx - Plugin context; the `tools` service is injected structurally.
 * @param search - The live search service (its knobs apply to every query).
 * @param corpusDir - Absolute corpus root guarding `skills_read`.
 */
export function registerSkillsTools(ctx: PluginContext, search: SkillsSearch, corpusDir: string): void {
  const inject = ctx.inject as
    | ((deps: readonly string[], cb: (scoped: unknown) => void) => void)
    | undefined
  if (typeof inject !== 'function') {
    ctx.logger.warn('dsh-awesome-skills: no inject() on context; corpus tools unavailable (router bash fallback applies)')
    return
  }
  inject(['tools'], (scoped: unknown) => {
    const tools = (scoped as Record<string, unknown> | undefined)?.tools as ToolsService | undefined
    if (typeof tools?.register !== 'function') {
      ctx.logger.warn('dsh-awesome-skills: host tools service missing or lacks register(); corpus tools unavailable')
      return
    }
    tools.register(searchTool(search))
    tools.register(readTool(corpusDir))
    ctx.logger.info('dsh-awesome-skills: corpus tools registered (skills_search, skills_read)')
  })
}
```

- [ ] **Step 2: Build**

Run: `cd /home/ryasr/dsh-awesome-skills && npm run build`
Expected: exit 0.

- [ ] **Step 3: Exercise the guards directly (unit-level, no host needed)**

The guard helpers are module-private by design; test them through the tool definitions. Run:

```bash
cd /home/ryasr/dsh-awesome-skills && node --input-type=module -e "
import { registerSkillsTools } from './lib/tools.js'
const tools = []
const fakeCtx = {
  logger: { info: () => {}, warn: m => console.log('WARN:', m) },
  inject(deps, cb) { cb({ tools: { register: t => tools.push(t) } }) },
}
registerSkillsTools(fakeCtx, { search: async () => [], count: () => 0 }, '/home/ryasr/.dsh/awesome-skills/skills')
console.log('registered:', tools.map(t => t.name))
const read = tools[1]
const corpus = '/home/ryasr/.dsh/awesome-skills/skills'
const cases = [
  ['valid',       { path: 'mattpocock/skills/tdd' }],
  ['traversal',   { path: '../../../etc' }],
  ['absolute',    { path: '/etc' }],
  ['bad ext',     { path: 'mattpocock/skills/tdd', file: 'x.bin' }],
  ['missing',     { path: 'no/such/skill' }],
  ['bad args',    { path: 42 }],
]
for (const [label, args] of cases) console.log(label, '->', (await read.execute(args)).ok === false ? 'blocked: ' + (await read.execute(args)).error.slice(0, 60) : 'ok, ' + (await read.execute(args)).content.length + ' chars')
"
```

Expected: `valid -> ok, N chars` (tdd skill exists in the 4,017 corpus); every other case -> `blocked:` with the matching guard message.

- [ ] **Step 4: Commit**

```bash
cd /home/ryasr/dsh-awesome-skills
git add src/tools.ts
git commit -m "feat: skills_search + skills_read model-facing corpus tools"
```

---

### Task 3: Wire tools into `apply()` and regenerate the client bundle

**Files:**
- Modify: `src/index.ts` (in `apply()`, after `mountSkillRoutesOnContext(...)`, ~line 191)
- Regenerate: `lib/` (tsdown client bundle) and `lib/tools.js` (tsc)

**Interfaces:**
- Consumes: `registerSkillsTools(ctx, search, corpusDir)` from Task 2.

- [ ] **Step 1: Call `registerSkillsTools` from `apply`**

In `src/index.ts`, add the import next to the other relative imports:

```ts
import { registerSkillsTools } from './tools.js'
```

Then insert after the `mountSkillRoutesOnContext(...)` call (line ~191):

```ts
  // Standard-permission-mode corpus access: the model-facing tools run
  // in-process with host authority, so routing needs no Bash or
  // out-of-workspace Read. Missing seam -> warn; the router's bash
  // fallback paragraph covers that host.
  registerSkillsTools(ctx, search, corpusDir)
```

- [ ] **Step 2: Build + regenerate the client bundle + preflight**

```bash
cd /home/ryasr/dsh-awesome-skills
npm run build
npx tsdown -c tsdown.client.ts
node scripts/preflight.mjs
```

Expected: build exits 0; preflight prints `preflight ok: dsh-awesome-skills`.

- [ ] **Step 3: Restart-check via the installed profile (host smoke)**

The profile mounts the plugin from `~/.dsh/profiles/web/node_modules/dsh-awesome-skills` (a symlink/copy of the repo). Sync and confirm the tools log line appears on next harness boot:

```bash
rsync -a --delete /home/ryasr/dsh-awesome-skills/lib/ ~/.dsh/profiles/web/node_modules/dsh-awesome-skills/lib/
```

Expected: rsync succeeds (the runtime picks it up on next boot; no live verification needed in this task — Task 8's end-to-end query check covers behavior).

- [ ] **Step 4: Commit**

```bash
cd /home/ryasr/dsh-awesome-skills
git add src/index.ts lib
git commit -m "feat: register corpus tools on the host tools service at apply"
```

---

### Task 4: Embedding cache in `rebuild2.js`

**Files:**
- Modify: `~/.dsh/awesome-skills/runtime/rebuild2.js` (runtime file, NOT in the repo)

**Interfaces:**
- Produces: `~/.dsh/awesome-skills/embcache.json` — map of SHA1(index-text) → 384-float array. Later rebuilds reuse it; corrupt/missing cache degrades to full re-embed.

- [ ] **Step 1: Add the cache read/write around the embed loop**

In `rebuild2.js`, add `const crypto = require('crypto')` to the top requires, then replace the embed section:

```js
  await emb.init(path.join(H, '.dsh/awesome-skills/model'))
  const packed = new Float32Array(meta.length * emb.DIM)
  for (let i = 0; i < texts.length; i++) {
    packed.set(await emb.embed(texts[i]), i * emb.DIM)
  }
```

with:

```js
  await emb.init(path.join(H, '.dsh/awesome-skills/model'))
  // Append-only embedding cache keyed by the exact index text: unchanged
  // skills skip re-embedding, so repeat rebuilds cost seconds. A missing or
  // corrupt cache only costs time — it is an optimization, never a
  // dependency.
  const CACHE = path.join(OUT, 'embcache.json')
  let cache = {}
  try {
    cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'))
  } catch (e) {
    if (e.code !== 'ENOENT') console.log('embcache unreadable, rebuilding it from scratch:', e.message)
  }
  const packed = new Float32Array(meta.length * emb.DIM)
  let hits = 0
  for (let i = 0; i < texts.length; i++) {
    const key = crypto.createHash('sha1').update(texts[i]).digest('hex')
    const cached = cache[key]
    if (Array.isArray(cached) && cached.length === emb.DIM) {
      packed.set(cached, i * emb.DIM)
      hits++
      continue
    }
    const vec = await emb.embed(texts[i])
    cache[key] = Array.from(vec)
    packed.set(vec, i * emb.DIM)
  }
  fs.writeFileSync(CACHE, JSON.stringify(cache))
  console.log('embeddings: ' + hits + ' cached, ' + (texts.length - hits) + ' computed')
```

- [ ] **Step 2: Verify cache behavior (two cold runs on the CURRENT 4,017 corpus — no ingest yet)**

```bash
cd ~/.dsh/awesome-skills/runtime
node rebuild2.js
node rebuild2.js
```

Expected: first run prints `embeddings: 0 cached, 4017 computed`; second run prints `embeddings: 4017 cached, 0 computed`; both end with the same `wrote skills.json + vectors.f32 (6170112 bytes, 4017 rows)` line. Second run should finish in seconds.

- [ ] **Step 3: No commit (runtime file, outside the repo)**

Confirm `git -C ~/dsh-awesome-skills status --short` is clean.

---

### Task 5: Ingest the babysitter pack

**Files:**
- Create (one-off): `/tmp/opencode/ingest-babysitter.js`
- Populate: `~/.dsh/awesome-skills/skills/a5c-ai/babysitter/**`

**Interfaces:**
- Consumes: clone at `/tmp/opencode/babysitter-src` (re-clone with `git clone --depth 1 https://github.com/a5c-ai/babysitter` if absent).
- Produces: corpus skill dirs under `a5c-ai/babysitter/<specialization-or-methodology>/<skill>/`.

- [ ] **Step 1: Write and run the ingest script**

```bash
cat > /tmp/opencode/ingest-babysitter.js <<'EOF'
/* One-off: copy every babysitter skill dir (a dir holding SKILL.md) from the
 * cloned repo's library/ into the corpus under a5c-ai/babysitter/<group>/<skill>/.
 * Companion files ride along verbatim; no frontmatter normalization. */
const fs = require('fs')
const path = require('path')
const SRC = '/tmp/opencode/babysitter-src/library'
const DEST = path.join(process.env.HOME, '.dsh/awesome-skills/skills/a5c-ai/babysitter')
let count = 0
const groups = [
  ...fs.readdirSync(path.join(SRC, 'specializations')).map(s => ['specializations', s]),
  ...fs.readdirSync(path.join(SRC, 'methodologies')).map(s => ['methodologies', s]),
]
for (const [kind, name] of groups) {
  const skillsDir = path.join(SRC, kind, name, 'skills')
  if (!fs.existsSync(skillsDir)) continue
  for (const skill of fs.readdirSync(skillsDir)) {
    const src = path.join(skillsDir, skill)
    if (!fs.statSync(src).isDirectory() || !fs.existsSync(path.join(src, 'SKILL.md'))) continue
    fs.cpSync(src, path.join(DEST, name, skill), { recursive: true })
    count++
  }
}
console.log('ingested skill dirs:', count)
EOF
node /tmp/opencode/ingest-babysitter.js
```

Expected: `ingested skill dirs: N` where N is close to 2,102 (dirs not under `<group>/skills/` are skipped by design; the walker count in Task 6 is the authoritative number).

- [ ] **Step 2: Verify corpus layout and counts**

```bash
find ~/.dsh/awesome-skills/skills/a5c-ai/babysitter -name SKILL.md | wc -l
find ~/.dsh/awesome-skills/skills/a5c-ai/babysitter -name SKILL.md | head -3
du -sh ~/.dsh/awesome-skills/skills/a5c-ai
```

Expected: ~2,100 SKILL.md files; paths like `.../babysitter/web-development/zustand/SKILL.md`; tree under ~5 MB.

- [ ] **Step 3: No commit (corpus lives outside the repo)**

---

### Task 6: Rebuild the index and ship artifacts

**Files:**
- Regenerate: `~/.dsh/awesome-skills/{skills.json,vectors.f32}` (via rebuild2.js)
- Modify: `skills/skills.json`, `skills/vectors.f32` in the repo (committed artifacts)

**Interfaces:**
- Consumes: cached rebuild (Task 4) + ingested corpus (Task 5).
- Produces: repo index with ~6,119 rows; `skills/count` reported by the service at boot.

- [ ] **Step 1: Rebuild with the cache (only new skills embed)**

```bash
cd ~/.dsh/awesome-skills/runtime && node rebuild2.js
```

Expected: `embeddings: 4017 cached, ~2100 computed`, final line `wrote skills.json + vectors.f32 (~9.4MB bytes, ~6119 rows)` — record the exact row count for the README in Task 8.

- [ ] **Step 2: Sanity checks**

```bash
node -e "
const m = JSON.parse(require('fs').readFileSync(process.env.HOME + '/.dsh/awesome-skills/skills.json', 'utf8'))
console.log('rows:', m.length)
console.log('missing bodies:', m.filter(s => !require('fs').existsSync(process.env.HOME + '/.dsh/awesome-skills/skills/' + s.path + '/SKILL.md')).length)
console.log('short descriptions:', m.filter(s => (s.description || '').trim().length < 20).length)
console.log('lark leftovers:', m.filter(s => s.path.toLowerCase().includes('lark')).length)
"
cd /home/ryasr/dsh-awesome-skills && node scripts/preflight.mjs
```

Expected: `missing bodies: 0`, `short descriptions: 0`, `lark leftovers: 0`, `preflight ok: dsh-awesome-skills`.

- [ ] **Step 3: Ship artifacts into the repo and drop derived caches**

```bash
cp ~/.dsh/awesome-skills/skills.json ~/.dsh/awesome-skills/vectors.f32 /home/ryasr/dsh-awesome-skills/skills/
rm -f /home/ryasr/dsh-awesome-skills/skills/gramcache.json /home/ryasr/dsh-awesome-skills/skills/gramcache.fp.json /home/ryasr/dsh-awesome-skills/skills/qcache.json
cd /home/ryasr/dsh-awesome-skills && git add skills/skills.json skills/vectors.f32 && git status --short
```

Expected: staged index + vectors diff (vectors grows ~6.2MB → ~9.4MB).

- [ ] **Step 4: Commit**

```bash
cd /home/ryasr/dsh-awesome-skills
git commit -m "data: ingest the a5c-ai/babysitter skill pack (~2,100 skills)"
```

---

### Task 7: Rewrite the router tool-first + recalibrate the score bands

**Files:**
- Modify: `src/index.ts` — replace the whole `ROUTER_SKILL` template (lines ~49–154)
- Rebuild: `lib/`, and re-apply to the profile (Task 3 Step 3's rsync)

**Interfaces:**
- Consumes: `skills_search` / `skills_read` (Task 2); `__QUERY_BIN__` / `__CORPUS_DIR__` substitution retained for the fallback path.
- Produces: the shipped router text with the calibrated bands (0.7/0.4 or 0.6/0.35 per the benchmark rule below).

- [ ] **Step 1: Write the recalibration benchmark first (before editing the template)**

```bash
cat > /tmp/opencode/bench2.mjs <<'EOF'
/* Recalibration: 10 babysitter-domain labels + 4 regression labels.
 * Checks top-1 exact prefix hit rate, R@3, and the median top-1 score of the
 * domain labels (the old bands' anchor). Uses the repo's lib/query.js. */
import { execFileSync } from 'node:child_process'
const H = process.env.HOME
const BIN = H + '/dsh-awesome-skills/lib/query.js'
const labels = [
  { query: 'manage react app state with a tiny store', expect: 'web-development/zustand' },
  { query: 'validate request payloads with schema parsing', expect: 'web-development/zod' },
  { query: 'combine lidar and camera measurements', expect: 'robotics-simulation/sensor-fusion' },
  { query: 'analyze semver bump from commit history', expect: 'sdk-platform-development/semver-analyzer' },
  { query: 'diff two api specs for breaking changes', expect: 'sdk-platform-development/api-diff-analyzer' },
  { query: 'thermal simulation of a pcb enclosure', expect: 'thermal-analysis' },
  { query: 'capture research findings during planning', expect: 'planning-with-files/findings-capture' },
  { query: 'websocket server with rooms and broadcast', expect: 'web-development/websocket' },
  { query: 'process yaml config safely', expect: 'web-development/yaml' },
  { query: 'reduce bundle size for webpack', expect: 'web-development/webpack' },
  { query: 'send email to team', expect: 'email' },
  { query: 'set up end-to-end browser tests', expect: 'e2e' },
  { query: 'implement authentication with tests', expect: 'tdd' },
  { query: 'write a design doc before building', expect: 'brainstorming' },
]
let r1 = 0, r3 = 0, scores = []
for (const { query, expect } of labels) {
  const out = JSON.parse(execFileSync('node', [BIN], { input: JSON.stringify({ query, k: 5 }) }))
  const top = out.results[0]
  const hit3 = out.results.slice(0, 3).some(r => r.path.includes(expect))
  if (top.path.includes(expect)) r1++
  if (hit3) r3++
  scores.push(top.score)
  console.log((hit3 ? 'PASS' : 'MISS'), top.score.toFixed(2), top.path.padEnd(55), '<-', query)
}
scores.sort((a, b) => a - b)
const median = scores[Math.floor(scores.length / 2)]
console.log(`\nR@1 ${r1}/${labels.length}  R@3 ${r3}/${labels.length}  median top-1 score ${median.toFixed(3)}`)
console.log(median < 0.55 || r3 / labels.length < 0.8 ? 'BANDS: drop to 0.6 / 0.35' : 'BANDS: keep 0.7 / 0.4')
EOF
node /tmp/opencode/bench2.mjs
```

Expected: run against the NEW index (already shipped in Task 6). Record the verdict line — it selects the band numbers in Step 2.

- [ ] **Step 2: Replace `ROUTER_SKILL` in `src/index.ts`**

Replace the entire template with (substitute `<BAND_STRONG>` / `<BAND_MID>` with the verdict from Step 1):

```ts
const ROUTER_SKILL = `---
name: skill-router
description: Search a local corpus of ~6,000 curated agent skills (testing, frontend, backend, cloud, data, writing, security, research, media) BEFORE doing any concrete task. Use at the START of any build/fix/test/deploy/configure/refactor/review request, unprompted - call skills_search with the task's goal, read the best-matching playbook with skills_read, and follow it. Default is ROUTE; skip only for pure chat.
disable-model-invocation: false
user-invocable: true
---

# Skill router

You have access to a local corpus of **~6,000 specialized agent skills** that
is NOT in your catalog. It is vector-indexed and searchable in about a second.
A vetted playbook almost always beats improvising from general knowledge - so
search BEFORE planning, not after.

## When to route

Route by reading the conversation. A lookup is triggered by the SHAPE of the
message, not by the user naming a skill:

- The user describes something they want built, fixed, tested, deployed,
  configured, refactored, reviewed, or explained with intent to act.
- The user names a tool, framework, library, cloud, or database.
- The user asks "how do I / can we / please do".
- The conversation is mid-task and the next step is a concrete action.

Skip only when the turn is purely conversational: a greeting, thanks, a
clarification question, a status report - or you are already following a
skill loaded this turn.

Default is ROUTE. If unsure whether a turn counts, route anyway - a miss
costs one second. Silence after an actionable message is the failure mode
this skill exists to prevent.

## How to search

Write the query the way you would explain the task to a colleague - a goal,
not a keyword list. Semantic matching does the rest.

Call the \`skills_search\` tool with \`query\` (and \`k\` if you want more than
5 hits). Each result carries \`path\`, \`score\` (0-1), \`name\`, and a one-line
\`description\`.

If this host has no \`skills_search\` tool, fall back to the CLI once:

\`\`\`bash
printf '%s' '{"query":"<goal in plain words>","k":5}' | node "__QUERY_BIN__"
\`\`\`

### Reading the scores

Calibrated on labeled task queries: top hits at <BAND_STRONG>+ were relevant
nearly every time, mid-band hits ~85%, weak-band hits rarely. Trust the bands:

- **<BAND_STRONG>+** strong match - read it.
- **<BAND_MID>-<BAND_STRONG>** plausible - read the top 2-3 descriptions, not
  just the first line; the best playbook for the task is often at rank 2-3.
- **< <BAND_MID>** weak - likely no good playbook for this exact task.

### When one query is not enough

- **Broad request** ("build me a dashboard") → run 2-3 queries for its
  distinct facets (e.g. "frontend dashboard layout", "charts data
  visualization", "deploy static site") and take the best hit from each.
- **First results all score < <BAND_MID>** → rephrase ONCE with different
  wording ("auth" → "login session cookie"). A second miss means the corpus
  likely has nothing; move on without guilt.
- **Multiple hits with the same trailing name** from different sources
  (e.g. several \`tdd\` skills, or duplicates across
  \`a5c-ai/babysitter/<domain>/\` specializations) → they are alternative
  takes. The full \`path\` distinguishes them. Prefer the one whose
  description fits the user's stack; when they look equivalent, prefer the
  higher score and read just one.

### Decision points, don't drift

- Task is one clear domain and a hit scores <BAND_STRONG>+ → read exactly one
  skill and follow it.
- Task genuinely spans domains (e.g. "add OAuth to my FastAPI app") → read at
  most two skills (one per domain), name which is primary, and follow the
  primary for the overall shape.

## How to read a hit

Call the \`skills_read\` tool with the hit's \`path\` (**never** the display
\`name\` - paths are unique) to load its SKILL.md. If this host has no
\`skills_read\` tool, fall back:

\`\`\`bash
sed -n '1,260p' "__CORPUS_DIR__/<path>/SKILL.md"
\`\`\`

A skill's directory holds its complete playbook: reference files, templates,
examples, and scripts live beside the SKILL.md. When the SKILL.md says "read
tests.md" or points at \`references/\` or \`scripts/\`, load those with
\`skills_read\` (path + \`file\`) too - they are part of the skill, not optional
decoration. If \`skills_read\` is unavailable, list them first:

\`\`\`bash
ls "__CORPUS_DIR__/<path>/"
\`\`\`

## Rules

- Read before acting: search → read the match → then plan. Quoting a skill's
  title from memory is not following it.
- Never paste a whole skill file into the chat - read it, then act on it.
- Follow the playbook, adapt the details. If a step genuinely does not fit
  the user's context, say so and adapt rather than silently skipping.
- If nothing relevant comes back after one rephrase, continue normally. A
  miss costs one second and is not a failure.
\``
```

- [ ] **Step 3: Build, re-apply to the profile, confirm the live copy**

```bash
cd /home/ryasr/dsh-awesome-skills
npm run build
rsync -a --delete lib/ ~/.dsh/profiles/web/node_modules/dsh-awesome-skills/lib/
node -e "
const s = require('fs').readFileSync(process.env.HOME + '/.agents/skills/skill-router/SKILL.md', 'utf8')
console.log('mentions tools:', s.includes('skills_search') && s.includes('skills_read'))
console.log('no stale placeholders:', !s.includes('__QUERY_BIN__') || s.includes('node \"'), !s.includes('<BAND_'))
"
```

Expected: `mentions tools: true`, `no stale placeholders: true`. (The live `~/.agents/skills/skill-router/SKILL.md` refreshes on the next harness `apply`; if the current copy still shows the old bash-first text, regenerate it by running the plugin's apply path once more or note that boot will refresh it.)

- [ ] **Step 4: Commit**

```bash
cd /home/ryasr/dsh-awesome-skills
git add src/index.ts lib
git commit -m "feat: tool-first skill router with bash fallback, bands recalibrated on the 6k corpus"
```

---

### Task 8: README update, sanity queries, push

**Files:**
- Modify: `README.md` (corpus tree lines 30–39, counts in lines 8–9/38/44/82–85/89, new tools section)

**Interfaces:**
- Consumes: exact row count from Task 6 Step 1.

- [ ] **Step 1: Update README**

1. Line ~9: "top 100 skills on skills.sh" description → reword the corpus sentence to include the babysitter pack: `a curated local corpus — the skills.sh top 100 (83 GitHub-hosted skills) plus the full a5c-ai/babysitter library (~2,100 skills) — with <N> skills total` (use the exact Task 6 count for `<N>`).
2. Corpus tree block (lines 31–39): replace the `larksuite/cli/` line with `a5c-ai/babysitter/` + a comment `# ~2,100 skills (49 specializations + methodologies)`; update the `...` line to the new totals (`<N> skills`, keep "1,500+ files" → recompute with `find ~/.dsh/awesome-skills/skills -type f | wc -l`).
3. Line ~44 sentence about "17 site-only entries ... excluded": keep, still accurate.
4. Add a new `## Model-facing tools` section right before `## Ranking`:

```markdown
## Model-facing tools

On hosts that expose the `tools` service, the plugin registers two tools that
run in-process with host authority — the standard-permission-mode path to the
corpus, since the agent needs no Bash or out-of-workspace Read:

- `skills_search(query, k?)` — the calibrated hybrid search; settings knobs
  (prio/blacklist/whitelist) apply.
- `skills_read(path, file?)` — one file from a hit's directory, guarded to the
  corpus root (no traversal), text extensions only, 64 KiB cap.

The `skill-router` skill teaches the tool-first flow and keeps the
`printf | node query.js` CLI as a one-paragraph fallback for hosts without
the tools service.
```

5. Ranking/Speed sections: replace "83-skill corpus" latency claims with a measured number on the new size IF a quick re-measure is cheap (`time` one warm query); otherwise drop the absolute count from the sentence ("measured on the shipped corpus"). Keep WEIGHT/GRAM_WEIGHT text as-is (unchanged math).

- [ ] **Step 2: Final sanity queries through the shipped CLI**

```bash
printf '%s' '{"query":"manage react app state","k":3}' | node /home/ryasr/dsh-awesome-skills/lib/query.js
printf '%s' '{"query":"send email to team","k":3}' | node /home/ryasr/dsh-awesome-skills/lib/query.js
```

Expected: first returns a `a5c-ai/babysitter/web-development/zustand` (or similar babysitter hit); second still returns email-* hits (no regression).

- [ ] **Step 3: Commit and push**

```bash
cd /home/ryasr/dsh-awesome-skills
git add README.md
git commit -m "docs: corpus tools, babysitter pack in the tree, counts refreshed"
GIT_TERMINAL_PROMPT=0 git push origin main
```

Expected: push succeeds (`33481a6..HEAD` or later).

---

## Self-review notes

- Spec coverage: tools+guards (Tasks 1–3), ingest (Task 5), vector cache (Task 4), rebuild+ship (Task 6), router rewrite+recalibration (Task 7), README+push (Task 8). All spec sections map to a task; error-handling and testing sections are covered inside Tasks 2 (guard cases), 6 (sanity), 7 (band rule).
- Type consistency: `registerSkillsTools(ctx, search, corpusDir)` matches the Task 3 call; `ToolDefinition`/`ToolsService` names match between Tasks 1/2; `expect` prefixes in bench2.mjs match corpus paths produced by Task 5 (`a5c-ai/babysitter/` + `<group>/<skill>`, matched via `.includes`).
- Known simplification: bench2.mjs uses 10 new domain labels + 4 regression labels instead of re-running the full historical 45-label set (which lives in disposable /tmp state and may not survive sessions); the band rule is explicit and mechanical.
- **Plan revision after harness-source verification (controller):** the harness passes `parameters` to the LLM wire verbatim and validates `output.schema` against an enforced JSON-Schema subset that rejects the author-only `type: 'json'`. Tool definitions therefore use raw JSON Schema (object-rooted; `required` as an array; `additionalProperties: true`) instead of the DSL's per-property `required: true` style, and `output.schema` is a concrete object schema per tool. Verified against `packages/core/tools/src/{index,json-schema,types}.ts`, `packages/llm/llm-deepseek/src/serialize.ts`, and `packages/extensions/cordis-host-runner/src/guard.ts`.
