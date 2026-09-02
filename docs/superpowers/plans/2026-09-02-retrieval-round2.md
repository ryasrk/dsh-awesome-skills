# Retrieval round 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reach and hold the accuracy bar — canonical 100-label bench R@1 ≥ 70% AND R@3 ≥ 90% — via label growth (50→100), a stemming-only probe, and enrichment round 2 (path taxonomy + body-H1 segments), each gated mechanically.

**Architecture:** The bench harness (`/tmp/opencode/bench6k.mjs`) already exists; the label file grows to 100 (frozen 50 verbatim + 50 new in one corner each). Lever 2 touches only `src/search.ts` (no rebuild). Lever 3 touches only the runtime `rebuild2.js` index-text composition (full re-embed ~25–30 min via the cache's SHA1 keys) followed by the standard ship flow. Every lever gets its own bench run for attribution; failures revert that lever only.

**Tech Stack:** unchanged from round 1 (tsc, rebuild2.js + embcache, embcore, /tmp/opencode bench scripts).

## Global Constraints

- Accuracy bar (definition of done): R@1 ≥ 70% AND R@3 ≥ 90% on the shipped repo index, n=100.
- Lever gate (conjunctive, pre-registered): a lever ships only if bench R@3 ≥ standing R@3 AND R@1 ≥ standing R@1. Failure → `git revert` that lever's commit, rebuild if needed, re-bench, record rejected-by-benchmark, proceed to the next lever.
- The frozen 50 labels keep their exact `q` and `golds` — never edited. New labels: exactly 50, ten per corner, written once; adding a label after the first [base-100] run is forbidden (that would reset the baseline).
- Gold matching: case-insensitive substring of any gold fragment in the hit path (bench rule unchanged).
- Bench rule for bands (unchanged): median < 0.55 OR R@3 < 0.80 → 0.6/0.35 else 0.7/0.4.
- Lever 2 (stems): cherry-pick ONLY `S2_ENDS`, `SURVIVE`, `stem`, and the `.map(stem)` in `toks` from `277252e` — no `bigrams`, no `qBigrams`, no boost block; `toks` keeps signature; public surface unchanged.
- Lever 3 cleaning/caps (same as Phase B): prefixes stripped (`domain:|specialization:|skill-area:|workflow:|role:|topic:` — for path taxonomy the separators are path slashes), tokens >2 chars, dedupe, cap 12 keywords per segment; path-taxonomy segment uses the path's group segments minus the owner/repo prefix and the trailing skill name; body-H1 segment max 12 words, only when the heading differs from the name; segments appended in fixed order: existing base → graphKw (babysitter rows) → pathTaxonomy → bodyH1.
- Lever 3 must not change legacy rows' existing segments — their base text is unchanged; the taxonomy/heading segments are APPENDED (this is why legacy rows re-embed).
- Sanity chain before every ship: node one-liner (0 missing bodies, 0 short desc, 0 lark) → `node scripts/preflight.mjs` → copy `~/.dsh/awesome-skills/{skills.json,vectors.f32}` to repo `skills/` → `rm -f skills/gramcache.json skills/gramcache.fp.json skills/qcache.json` → commit → `GIT_TERMINAL_PROMPT=0 git push origin main`.
- After any shipped change: sync BOTH `lib/` and `skills/` into the installed profile (`rsync -a --delete`), verify deployed CLI reports `"count":6097` (README runbook line from af348d0).
- Validation rebuilds use `DSH_AWESOME_SKILLS_OUT=/tmp/opencode/rebuild-out2` AND seed that dir's embcache from the live one first (`cp ~/.dsh/awesome-skills/embcache.json /tmp/opencode/rebuild-out2/embcache.json`) — the cache is OUT-relative (round-1 lesson).
- Repo files end with exactly one trailing newline; lib/ commits with its source; no token in tracked files; runtime files never committed.
- Stop condition: bar met, OR all levers adjudicated (shipped or rejected). The residual is recorded in README + an Outcome-2 section in the plan doc either way.

---

### Task 1: Label set 100 + [base-100] baseline

**Files:**
- Create: `/tmp/opencode/labels100.json` (100 labels), `/tmp/opencode/bench100.mjs`
- Evidence: task report (no repo changes)

**Interfaces:**
- Consumes: shipped CLI `~/dsh-awesome-skills/lib/query.js`; frozen `/tmp/opencode/labels6k.json`.
- Produces: `node /tmp/opencode/bench100.mjs [--phase TAG]` → same output shape as bench6k (per-label lines, `[TAG] R@1/R@3/median`, BANDS verdict); the `[base-100]` line is the standing baseline for all gates in this plan.

- [ ] **Step 1: Build `labels100.json` programmatically (never hand-edit the frozen 50)**

```bash
node -e "
const fs = require('fs')
const frozen = JSON.parse(fs.readFileSync('/tmp/opencode/labels6k.json', 'utf8'))
if (frozen.length !== 50) throw new Error('frozen set must be 50, got ' + frozen.length)
// 50 new labels, 10 per corner. Golds are path fragments (case-insensitive substring).
const fresh = [
  // babysitter (10)
  ['lint my python code with ruff', ['ruff', 'python']],
  ['set up a monorepo build pipeline', ['monorepo', 'build']],
  ['write sql migrations for postgres', ['postgres', 'migration']],
  ['optimize slow react renders with memoization', ['react', 'memo', 'performance']],
  ['create a slack notification integration', ['slack', 'notification']],
  ['design a mobile app onboarding flow', ['mobile', 'onboarding']],
  ['implement oauth2 login flow', ['oauth', 'auth', 'login']],
  ['set up feature flags safely', ['feature-flag', 'flags']],
  ['write an architecture decision record', ['adr', 'architecture', 'decision']],
  ['add pagination to a list endpoint', ['pagination']],
  // legacy awesome packs (10)
  ['scan my aws account for unused resources', ['aws', 'cost', 'unused']],
  ['scrape a website into structured json', ['scrape', 'scraping', 'crawl']],
  ['make a pitch deck for investors', ['pitch', 'deck', 'investor']],
  ['plan a content calendar for a blog', ['content', 'calendar', 'blog']],
  ['build a webhook receiver endpoint', ['webhook']],
  ['animate a css transition on scroll', ['css', 'animation', 'transition']],
  ['recover a corrupted git branch', ['git', 'recover']],
  ['write a technical spec for review', ['spec', 'prd', 'technical']],
  ['convert a figma design to react components', ['figma', 'react', 'design']],
  ['set up structured logging for a service', ['logging', 'logs', 'observability']],
  // ECC (10)
  ['run a security audit before release', ['security', 'audit', 'review']],
  ['triage incoming bug reports', ['triage', 'bug']],
  ['write e2e tests with playwright', ['playwright', 'e2e', 'browser-qa']],
  ['review a pull request for quality', ['code-review', 'review', 'pr']],
  ['plan a sprint from a backlog', ['sprint', 'backlog', 'planning']],
  ['document an api with openapi', ['openapi', 'api-docs', 'swagger']],
  ['debug a flaky test in ci', ['flaky', 'test', 'ci']],
  ['refactor duplicated helper functions', ['refactor', 'duplicate']],
  ['benchmark the latency of an endpoint', ['benchmark', 'latency', 'performance']],
  ['set up sentry error tracking', ['sentry', 'error', 'monitoring']],
  // UI/design (10)
  ['design a dark mode color system', ['dark-mode', 'color', 'theme', 'design']],
  ['improve the empty states of an app', ['empty-state', 'ux', 'ui']],
  ['write microcopy for a checkout flow', ['microcopy', 'copy', 'ux-writing']],
  ['audit color contrast for accessibility', ['contrast', 'a11y', 'accessibility']],
  ['create a design token system', ['design-token', 'token', 'design']],
  ['build a responsive nav bar', ['nav', 'responsive', 'layout']],
  ['sketch wireframes for a settings page', ['wireframe', 'ux']],
  ['choose fonts for a marketing site', ['typography', 'font', 'design']],
  ['design table patterns for dense data', ['table', 'data', 'design']],
  ['prototype an interactive onboarding tour', ['prototype', 'onboarding', 'tour']],
  // data/ops (10)
  ['write a cron schedule for backups', ['cron', 'backup', 'schedule']],
  ['migrate a mysql database to a new host', ['mysql', 'migrate', 'database']],
  ['build an etl pipeline with airflow', ['airflow', 'etl', 'pipeline']],
  ['visualize sales data in a dashboard', ['dashboard', 'chart', 'visualize']],
  ['clean a dataset with pandas', ['pandas', 'data', 'clean']],
  ['set up grafana alerts', ['grafana', 'alert', 'monitoring']],
  ['tune postgres query performance', ['postgres', 'query', 'performance']],
  ['version a data schema safely', ['schema', 'version', 'migration']],
  ['export analytics to a warehouse', ['warehouse', 'analytics', 'etl']],
  ['write unit tests for pandas transforms', ['pandas', 'test', 'unit']],
].map(([q, golds]) => ({ q, golds }))
if (fresh.length !== 50) throw new Error('fresh must be 50, got ' + fresh.length)
const all = [...frozen, ...fresh]
fs.writeFileSync('/tmp/opencode/labels100.json', JSON.stringify(all, null, 1) + '\n')
console.log('labels100 written:', all.length)
"
```

- [ ] **Step 2: Validate + coverage check**

```bash
node -e "
const l = JSON.parse(require('fs').readFileSync('/tmp/opencode/labels100.json', 'utf8'))
if (l.length !== 100) throw new Error('want 100, got ' + l.length)
const qs = new Set(l.map(x => x.q))
if (qs.size !== 100) throw new Error('duplicate queries')
if (l.some(x => !x.q || !Array.isArray(x.golds) || x.golds.length === 0)) throw new Error('malformed')
// coverage probe: every gold fragment must appear in at least one indexed path (else it is a dead gold — report, do not edit)
const meta = JSON.parse(require('fs').readFileSync(process.env.HOME + '/.dsh/awesome-skills/skills.json', 'utf8'))
const paths = meta.map(m => m.path.toLowerCase()).join('\n')
const dead = [...new Set(l.flatMap(x => x.golds))].filter(g => !paths.includes(g.toLowerCase()))
console.log('dead gold fragments (report-only):', dead.length ? dead.join(', ') : 'none')
"
```

Expected: `labels100 written: 100`, then `dead gold fragments (report-only): none` — if any dead fragments are listed, RECORD them in the report (they cap that label's max score; do not edit the file).

- [ ] **Step 3: Write `bench100.mjs`** — copy `bench6k.mjs` with two line changes:

```bash
sed -e "s|labels6k.json|labels100.json|" -e "s|/labels.length)|/labels.length)|" /tmp/opencode/bench6k.mjs > /tmp/opencode/bench100.mjs
chmod +x /tmp/opencode/bench100.mjs
node -e "const s=require('fs').readFileSync('/tmp/opencode/bench100.mjs','utf8'); if(!s.includes('labels100.json')) throw new Error('sed failed')"
```

- [ ] **Step 4: Baseline run**

```bash
node /tmp/opencode/bench100.mjs --phase base-100
```

(~3-4 min; save full per-label output to the report.) Record the `[base-100]` line verbatim — it is the standing baseline for every gate in this plan. Also list the 10 weakest labels as the round-2 watch-list.

- [ ] **Step 5: No repo changes** — `git status --short` clean.

---

### Task 2: Lever 1 — stemming-only probe

**Files:**
- Modify: `src/search.ts` (module scope near `toks` ~line 48) + rebuilt `lib/`

**Interfaces:**
- Produces: stemmed tokens in both lanes; NO bigrams/boost. Public surface unchanged.

- [ ] **Step 1: Apply the stemmer (exact code from 277252e, minus bigrams)**

In `src/search.ts`, add next to `toks`, then replace `toks` with:

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

Do NOT add `bigrams`, `qBigrams`, or any boost block — that is the rejected mechanism.

- [ ] **Step 2: Build + guard probe + bench**

```bash
cd /home/ryasr/dsh-awesome-skills && npm run build && node --input-type=module -e "
import { SkillIndex } from './lib/search.js'
const H = process.env.HOME
const idx = new SkillIndex({ corpusDir: H + '/.dsh/awesome-skills/skills', indexDir: H + '/dsh-awesome-skills/skills', modelDir: H + '/.dsh/awesome-skills/model', cacheDir: '/tmp/opencode/stemprobe-cache2' })
for (const q of ['json', 'zod', 'zustand', 'e2e testing', 'used books docs', 'manage deployment management documents']) {
  const r = await idx.search(q, 3)
  console.log(q.padEnd(38), '->', r.map(h => h.path.split('/').pop()).join(', '))
}
"
node /tmp/opencode/bench100.mjs --phase stems-only
```

- [ ] **Step 3: Evaluate the lever gate (vs [base-100])**

- PASS (R@3 ≥ base AND R@1 ≥ base): commit `git add src/search.ts lib` with message `feat: guarded suffix stemming in the lexical lane (stems-only, no boost)` and KEEP.
- FAIL: `git checkout -- src/search.ts lib` (discard), record rejected-by-benchmark with both bench lines, move on.

Record the decision + numbers in the report either way.

---

### Task 3: Lever 2 — enrichment round 2 (path taxonomy + body H1) + ship + gate

**Files:**
- Modify: `~/.dsh/awesome-skills/runtime/rebuild2.js`
- Regenerate + commit (on PASS): `skills/skills.json`, `skills/vectors.f32`

**Interfaces:**
- Consumes: corpus paths + SKILL.md bodies, embcache (live, warm), embcore.
- Produces: enriched index text for ALL rows (segments appended: base → graphKw → pathTaxonomy → bodyH1).

- [ ] **Step 1: Implement the two segments in `rebuild2.js`**

(a) Above the main block, next to `graphKeywords`, add:

```js
const STOP_PATH = new Set(['skills', 'cli', 'specializations', 'methodologies', 'domains', 'contrib', 'examples', 'shared'])

/** Path-taxonomy keywords: group segments of the corpus path, minus owner/repo and skill name. */
function pathKeywords(rel) {
  const parts = rel.split('/')
  const core = parts.slice(1, -1).filter(p => !STOP_PATH.has(p) && p.length > 2)
  const words = []
  for (const p of core) for (const w of p.replace(/-/g, ' ').split(/\s+/)) if (w.length > 2) words.push(w)
  return [...new Set(words)].slice(0, 12)
}

/** First H1 heading of the body, kebab-to-words, only when it differs from the skill name. */
function bodyHeading(text, name) {
  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---/, '')
  const h = /^#[ \t]+(.+?)[ \t]*$/m.exec(body)
  if (!h) return []
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
  if (norm(h[1]) === norm(name)) return []
  return h[1].toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(w => w.length > 2).slice(0, 12)
}
```

(b) In the meta loop, after the `graphKw` attachment line, add:

```js
    meta[meta.length - 1].pathKw = pathKeywords(rel)
    meta[meta.length - 1].h1Kw = bodyHeading(text, meta[meta.length - 1].name)
```

(c) Extend the `texts` derivation (replace the round-1 version):

```js
  const texts = meta.map(m => {
    const kws = m.name.split(/[-_]/).filter(w => w.length > 2).join(' ')
    let base = [m.name, m.name, kws, m.description].join('. ')
    if (m.graphKw && m.graphKw.length > 0) base += '. ' + m.graphKw.join(', ')
    if (m.pathKw && m.pathKw.length > 0) base += '. ' + m.pathKw.join(', ')
    if (m.h1Kw && m.h1Kw.length > 0) base += '. ' + m.h1Kw.join(', ')
    return base
  })
```

- [ ] **Step 2: Validation rebuild (seeded scratch cache)**

```bash
mkdir -p /tmp/opencode/rebuild-out2 && cp ~/.dsh/awesome-skills/embcache.json /tmp/opencode/rebuild-out2/embcache.json
cd ~/.dsh/awesome-skills/runtime && DSH_AWESOME_SKILLS_OUT=/tmp/opencode/rebuild-out2 node rebuild2.js
```

Expected: `embeddings: 0 cached, 6097 computed` (every row's text changed — taxonomy touches all rows). ~25–30 min; timeout 45 min. Record counts.

- [ ] **Step 3: Spot-check enrichment content**

```bash
node -e "
const fs = require('fs')
const b = JSON.parse(fs.readFileSync('/tmp/opencode/rebuild-out2/skills.json', 'utf8'))
for (const frag of ['web-development/zustand', 'affaan-m/ecc/email-ops', 'Infrasity-Labs/dev-gtm-claude-skills/test-driven-development']) {
  const m = b.find(x => x.path.includes(frag))
  console.log(m.path, JSON.stringify({ graphKw: m.graphKw, pathKw: m.pathKw, h1Kw: m.h1Kw }))
}
"
```

Expected: zustand has pathKw like `['web','development']`; ecc rows have pathKw; legacy rows have pathKw (new!) and often h1Kw; graphKw still only on babysitter rows.

- [ ] **Step 4: Ship rebuild + sanity + preflight + artifacts**

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

Note: the ship rebuild uses the live OUT whose cache lacks the new texts — expect `embeddings: 0 cached, 6097 computed` here too (the validation seeding only pre-warmed the scratch copy; both runs compute the same vectors from the same texts, so determinism makes the validation run's numbers authoritative).

- [ ] **Step 5: Bench + gate**

```bash
node /tmp/opencode/bench100.mjs --phase enrich2
```

Standing baseline for this gate: the best standing numbers so far (base-100, possibly improved by Task 2's stems if that lever PASSED). Gate: R@3 ≥ standing AND R@1 ≥ standing.

- PASS: commit `git add skills/skills.json skills/vectors.f32` with message `data: enrich index text with path taxonomy + body headings (round 2)`; push; then sync profile: `rsync -a --delete skills/ ~/.dsh/profiles/web/node_modules/dsh-awesome-skills/skills/ && rsync -a --delete lib/ ~/.dsh/profiles/web/node_modules/dsh-awesome-skills/lib/` (lib only changed if Task 2 kept stems) and verify deployed CLI `count:6097`.
- FAIL: restore the shipped artifacts (`git checkout -- skills/`), restore `rebuild2.js` by removing the three additions (keep round-1 graphKw code intact), re-run the live rebuild to regenerate the standing index, re-verify sanity, record rejected-by-benchmark, move on.

Record the decision + numbers either way.

---

### Task 4: Final bench, bands/README/Outcome-2, push

**Files:**
- Modify: `src/index.ts` (band bullets ONLY if verdict differs), `README.md` (one sentence), plan doc (Outcome-2)

**Interfaces:**
- Consumes: standing bench numbers from Tasks 2-3.
- Produces: final shipped state + records.

- [ ] **Step 1: Final bench + regressions**

```bash
node /tmp/opencode/bench100.mjs --phase final
printf '%s' '{"query":"send email to team","k":3}' | node /home/ryasr/dsh-awesome-skills/lib/query.js
```

- [ ] **Step 2: Band verdict**

Apply the mechanical rule to the final line: `keep 0.7 / 0.4` + shipped is already 0.7/0.4 → no edit. `drop` → edit the band bullets (0.7→0.6, 0.4→0.35), rebuild, rsync profile lib.

- [ ] **Step 3: README + Outcome-2**

- README Ranking sentence: replace the current "Re-checked … 62% / 88%." sentence with the final numbers.
- Append `## Outcome 2 (recorded 2026-09-02)` to `docs/superpowers/plans/2026-09-01-retrieval-recovery.md`: final numbers vs bar (met/not met), each lever's verdict with commits, the residual miss list, next-lever note.

- [ ] **Step 4: Commit + push**

```bash
cd /home/ryasr/dsh-awesome-skills
git add README.md docs/superpowers/plans/2026-09-01-retrieval-recovery.md src/index.ts lib
git commit -m "docs: retrieval round 2 final numbers, outcome record"
GIT_TERMINAL_PROMPT=0 git push origin main
```

(Adjust the `git add` list if src/index.ts was untouched.)

---

## Self-review notes

- Spec coverage: label growth (Task 1, frozen-50 preserved programmatically), stems-only probe (Task 2, exact 277252e stemmer minus boost), enrichment round 2 (Task 3, two additive segments, seeded-cache validation, full ship+gate), final records (Task 4). Bar, gates, stop condition, ship flow, profile-sync runbook — all from the spec addendum verbatim.
- Type consistency: `pathKeywords`/`bodyHeading`/`pathKw`/`h1Kw` named consistently in Task 3; `stem`/`S2_ENDS`/`SURVIVE` match 277252e exactly; bench flags `--phase base-100|stems-only|enrich2|final` consistent.
- Cache mechanics honored: scratch OUT seeded before validation (round-1 lesson); ship rebuild expected to compute all 6,097 (texts changed globally) — determinism makes the validation numbers authoritative for the ship run.
- Honesty: dead-gold check is report-only (no mid-flight gold edits); lever failures revert cleanly (Task 2 discards working tree, Task 3 restores artifacts + rebuild code); no bigram revival.

## Erratum (recorded 2026-09-02)

The Global Constraints above number the levers "Lever 2 (stems)" / "Lever 3
(enrichment)", while the task headings use "Lever 1 — stems" / "Lever 2 —
enrichment" (label growth not counted as a lever). Two numbering schemes, zero
decision impact; recorded here so later round-3/4 prose is not misread.
