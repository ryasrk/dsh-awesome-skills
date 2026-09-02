# Retrieval round 3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Push the canonical bench toward the ceiling — n=150 with gold hygiene, selective alias enrichment (probe-then-ship), conditional es-family stem probe; bar R@1 ≥ 78% AND R@3 ≥ 92% on n=150 with ≥3 vocabulary-gap labels closed.

**Architecture:** Same harness family as rounds 1-2 (`/tmp/opencode/bench*.mjs` against the shipped CLI). Label growth is programmatic with live-gold verification at authoring time. The alias lever is the precision correction for two rejected indiscriminate levers: a hand-curated `ALIASES` table in `rebuild2.js` matching rows by path fragment, each entry per-probed (vector-override re-rank) before shipping, gated by the full bench. The es-family probe touches only `src/search.ts`. Embcache prune rides the alias ship.

**Tech Stack:** unchanged (tsc, rebuild2.js + embcache + embcore, bench scripts).

## Global Constraints

- Bar: R@1 ≥ 78% AND R@3 ≥ 92% on n=150 (ceiling 148/150 — 2 carried dead labels).
- Lever gate (unchanged): a lever ships only if bench R@3 ≥ standing AND R@1 ≥ standing; failure → revert that lever, re-bench, record rejected, next lever.
- Frozen 100 labels stay verbatim. 50 new labels: 10 per corner, golds verified LIVE before the baseline freezes the set; prefer distinctive fragments; dead fragments replaced at authoring time only.
- Alias table discipline: entries `{ frag, words }`; `frag` = path fragment; `words` = genuine vocabulary synonyms (record a one-line rationale per entry); table lives in `rebuild2.js`; per-entry probe must show the gold strictly improving into top-3 or the entry is dropped; the other ~140 labels are the generalization check.
- Alias enrichment appends one segment `. ` + words.join(', ') for matching rows only; everything else byte-identical → cache hits.
- Bench rule for bands unchanged (median < 0.55 OR R@3 < 0.80 → 0.6/0.35 else 0.7/0.4).
- Ship flow unchanged: sanity zeros → preflight → artifact copy → derived caches removed → commit → push → sync BOTH dirs to the profile → deployed CLI verify.
- Bench assets live in `/tmp/opencode` (working) with gitignored mirrors in `/home/ryasr/dsh-awesome-skills/.superpowers/sdd/bench-assets/` — after any label-set change, re-mirror the assets.
- es-family probe (lever 3) runs ONLY if the bar is unmet after lever 2; whole-family change (es/ies/ves unify) as one pre-registered probe, same gate.
- Repo files end with exactly one trailing newline; lib/ commits with source; no token in tracked files; runtime files never committed.
- Stop: bar met, or all levers adjudicated. Residual recorded in Outcome-3.

---

### Task 1: Labels 100 → 150 (gold-hygienic) + [base-150] baseline

**Files:**
- Create: `/tmp/opencode/labels150.json`, `/tmp/opencode/bench150.mjs`
- Evidence: task report (no repo changes)

**Interfaces:**
- Consumes: frozen `/tmp/opencode/labels100.json`, live `skills.json`, shipped CLI.
- Produces: `node /tmp/opencode/bench150.mjs [--phase TAG]` → same output shape; the `[base-150]` line is the standing baseline for all gates this round.

- [ ] **Step 1: Build labels150.json with live-gold verification at authoring time**

```bash
node -e "
const fs = require('fs')
const H = process.env.HOME
const frozen = JSON.parse(fs.readFileSync('/tmp/opencode/labels100.json', 'utf8'))
if (frozen.length !== 100) throw new Error('frozen must be 100, got ' + frozen.length)
const meta = JSON.parse(fs.readFileSync(H + '/.dsh/awesome-skills/skills.json', 'utf8'))
const corpus = meta.map(m => m.path.toLowerCase()).join('\n')
const live = g => corpus.includes(g.toLowerCase())
// 50 new labels, 10 per corner. Draft golds first; DEAD ones get replaced below before freezing.
const drafts = [
  // babysitter (10)
  ['write kubernetes manifests for a deployment', ['kubernetes', 'yaml']],
  ['design a graphql schema with resolvers', ['graphql', 'schema']],
  ['instrument distributed tracing with opentelemetry', ['tracing', 'opentelemetry', 'observability']],
  ['build a rest client with retries', ['rest', 'client', 'api']],
  ['write chrome extension manifest v3', ['extension', 'chrome', 'browser']],
  ['set up s3 bucket lifecycle policies', ['s3', 'aws', 'storage']],
  ['implement websocket reconnection logic', ['websocket', 'reconnect']],
  ['profile memory leaks in node', ['memory', 'leak', 'profiling']],
  ['create a cli progress bar', ['cli', 'progress', 'terminal']],
  ['write database indexes for slow queries', ['index', 'database', 'query']],
  // legacy awesome (10)
  ['prepare a release with semantic version tags', ['semver', 'release', 'version']],
  ['build a notification center ui', ['notification', 'ui', 'component']],
  ['convert markdown to pdf', ['markdown', 'pdf', 'convert']],
  ['set up ssh tunneling for a remote db', ['ssh', 'tunnel', 'remote']],
  ['write a rfc-style design document', ['rfc', 'design', 'doc']],
  ['make an interactive data map', ['map', 'data', 'visualization']],
  ['audit iam policies for least privilege', ['iam', 'policy', 'security']],
  ['automate browser form filling', ['form', 'automation', 'browser']],
  ['schedule social posts with media', ['social', 'media', 'schedule']],
  ['write api integration tests with fixtures', ['fixtures', 'integration', 'api']],
  // ecc (10)
  ['run lighthouse audits on a page', ['lighthouse', 'audit', 'performance']],
  ['set up preview deployments per pr', ['preview', 'deployment', 'pr']],
  ['write load tests with k6', ['load', 'k6', 'test']],
  ['triage a production incident', ['incident', 'triage', 'postmortem']],
  ['design a feature rollout plan', ['rollout', 'feature', 'plan']],
  ['review database migration safety', ['migration', 'database', 'review']],
  ['onboard a new engineer with docs', ['onboarding', 'docs', 'engineer']],
  ['set up circuit breakers for services', ['circuit', 'breaker', 'resilience']],
  ['write acceptance criteria for a story', ['acceptance', 'criteria', 'story']],
  ['map a service dependency graph', ['dependency', 'graph', 'service']],
  // ui/design (10)
  ['design a data table with sorting', ['table', 'sort', 'data']],
  ['write alt text guidelines for images', ['alt', 'image', 'accessibility']],
  ['design a multi-step form flow', ['form', 'steps', 'flow']],
  ['create an icon system from scratch', ['icon', 'system', 'design']],
  ['audit spacing and layout rhythm', ['spacing', 'layout', 'rhythm']],
  ['design skeleton loading states', ['skeleton', 'loading', 'state']],
  ['improve focus states for keyboards', ['focus', 'keyboard', 'a11y']],
  ['design toast and inline notifications', ['toast', 'notification', 'inline']],
  ['write ui error messages that help', ['error', 'message', 'ux']],
  ['design an empty cart experience', ['empty', 'cart', 'state']],
  // data/ops (10)
  ['write a kafka consumer group setup', ['kafka', 'consumer', 'stream']],
  ['tune jvm heap for a service', ['jvm', 'heap', 'tuning']],
  ['set up blue-green deployments', ['blue-green', 'deployment', 'release']],
  ['build a feature usage dashboard', ['usage', 'dashboard', 'analytics']],
  ['write sql window functions for reports', ['sql', 'window', 'report']],
  ['normalize a messy address dataset', ['address', 'normalize', 'data']],
  ['set up terraform remote state', ['terraform', 'state', 'remote']],
  ['design a clickstream event schema', ['clickstream', 'event', 'schema']],
  ['cache api responses with redis', ['redis', 'cache', 'api']],
  ['write runbooks for on-call rotation', ['runbook', 'oncall', 'ops']],
].map(([q, golds]) => ({ q, golds }))
if (drafts.length !== 50) throw new Error('drafts must be 50, got ' + drafts.length)
// Authoring-time gold hygiene: replace dead golds with verified-live fragments per label.
const report = []
for (const d of drafts) {
  const checked = d.golds.map(g => ({ g, ok: live(g) }))
  const dead = checked.filter(c => !c.ok).map(c => c.g)
  if (dead.length) report.push({ q: d.q, dead })
}
console.log('draft dead-gold report (must be resolved before freezing):')
console.log(JSON.stringify(report, null, 1))
// The implementer resolves each dead gold below (replace with a live fragment from the SAME domain,
// verified with the live() helper), then re-runs this script until the report is EMPTY, then freezes.
fs.writeFileSync('/tmp/opencode/labels150-draft.json', JSON.stringify(drafts, null, 1) + '\n')
console.log('draft written: /tmp/opencode/labels150-draft.json')
"
```

The script prints a dead-gold report and writes the draft. The implementer then edits `/tmp/opencode/labels150-draft.json` — replacing each dead fragment with a verified-live one from the same domain (verify candidates with: `node -e "const c=...paths...; console.log(c.includes('<candidate>'))"`) — and re-runs the build script (now reading the draft's golds as final) until the dead report is EMPTY. Then freeze:

```bash
node -e "
const fs = require('fs')
const frozen100 = JSON.parse(fs.readFileSync('/tmp/opencode/labels100.json', 'utf8'))
const fresh = JSON.parse(fs.readFileSync('/tmp/opencode/labels150-draft.json', 'utf8'))
if (fresh.length !== 50) throw new Error('fresh must be 50')
const all = [...frozen100, ...fresh]
const meta = JSON.parse(require('fs').readFileSync(process.env.HOME + '/.dsh/awesome-skills/skills.json', 'utf8'))
const corpus = meta.map(m => m.path.toLowerCase()).join('\n')
// carried-dead allowance: the 2 frozen labels (pre-commit, pagination) may stay dead; ALL new golds must be live.
const newDead = fresh.flatMap(d => d.golds).filter(g => !corpus.includes(g.toLowerCase()))
if (newDead.length) throw new Error('new golds must all be live: ' + newDead.join(', '))
fs.writeFileSync('/tmp/opencode/labels150.json', JSON.stringify(all, null, 1) + '\n')
console.log('labels150 frozen:', all.length)
"
```

- [ ] **Step 2: Derive bench150.mjs + re-mirror assets**

```bash
sed 's|labels100.json|labels150.json|' /tmp/opencode/bench100.mjs > /tmp/opencode/bench150.mjs
node -e "if(!require('fs').readFileSync('/tmp/opencode/bench150.mjs','utf8').includes('labels150.json')) throw new Error('sed failed')"
cp /tmp/opencode/labels150.json /tmp/opencode/bench150.mjs /home/ryasr/dsh-awesome-skills/.superpowers/sdd/bench-assets/
```

- [ ] **Step 3: Baseline run**

```bash
node /tmp/opencode/bench150.mjs --phase base-150
```

(~5-6 min; timeout 10 min.) Record the `[base-150]` line verbatim + the 12 weakest labels (the gap list for lever 2). Confirm the 2 carried dead labels are the only structurally-doomed ones.

- [ ] **Step 4: No repo changes** — `git status --short` clean.

---

### Task 2: Lever 1 — selective alias enrichment (probe-then-ship)

**Files:**
- Modify: `~/.dsh/awesome-skills/runtime/rebuild2.js` (ALIASES table + matching segment)
- Modify (on PASS): `skills/skills.json`, `skills/vectors.f32` (ship)

**Interfaces:**
- Consumes: live vectors + embcore for probes; labels150 gap list; corpus paths.
- Produces: `ALIASES` table (surviving entries), enriched shipped artifacts, pruned embcache.

- [ ] **Step 1: Gap analysis (per weak label: what words do the gold rows lack?)**

For each weak label from Task 1 (expect the round-2 carryovers accessibility/a11y, sensor-fusion, brainstorming, api-docs/technical-documentation, translation + new ones), print the gold rows' current index text and identify missing query vocabulary:

```bash
node -e "
const fs = require('fs')
const H = process.env.HOME
const meta = JSON.parse(fs.readFileSync(H + '/.dsh/awesome-skills/skills.json', 'utf8'))
const labels = JSON.parse(fs.readFileSync('/tmp/opencode/labels150.json', 'utf8'))
// paste the weak-label queries from Task 1's watch-list here:
const weak = ['<fill from Task 1>']
for (const wq of weak) {
  const label = labels.find(l => l.q === wq)
  console.log('===', wq, 'golds:', label.golds.join(', '))
  for (const g of label.golds) {
    const rows = meta.filter(m => m.path.toLowerCase().includes(g.toLowerCase()))
    for (const r of rows.slice(0, 2)) console.log('   ', r.path, '|', (r.description || '').slice(0, 110))
  }
}
"
```

- [ ] **Step 2: Curate the ALIASES table (in scratch first)**

Draft entries `{ frag, words, why }`. Rules: `frag` matches rows by path substring; `words` are genuine synonyms the rows' text lacks (e.g. frag 'accessib', words 'accessibility aria screen reader keyboard', why 'a11y label vocabulary absent'); 1-4 entries expected per gap; AVOID generic words (web, development, data). Write the draft table to the report for review before touching rebuild2.js.

- [ ] **Step 3: Per-entry probe (vector override, before any rebuild)**

```bash
node -e "
const fs = require('fs')
const H = process.env.HOME
const emb = require(H + '/.dsh/awesome-skills/runtime/embcore.js')
const meta = JSON.parse(fs.readFileSync(H + '/.dsh/awesome-skills/skills.json', 'utf8'))
const buf = fs.readFileSync(H + '/.dsh/awesome-skills/vectors.f32')
const packed = new Float32Array(buf.buffer, buf.byteOffset, meta.length * 384)
const ALIASES = [ /* paste the draft table: { frag, words } */ ]
;(async () => {
  await emb.init(H + '/.dsh/awesome-skills/model')
  const cos = (a, b) => { let d = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { d += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i] } return d / (Math.sqrt(na) * Math.sqrt(nb) || 1) }
  const find = f => meta.findIndex(m => m.path.toLowerCase().includes(f.toLowerCase()))
  const kws = m => { const k = m.name.split(/[-_]/).filter(w => w.length > 2).join(' '); let base = [m.name, m.name, k, m.description].join('. '); if (m.graphKw && m.graphKw.length) base += '. ' + m.graphKw.join(', '); return base }
  for (const { frag, words } of ALIASES) {
    const i = find(frag)
    if (i < 0) { console.log('NO MATCH for', frag); continue }
    const enriched = kws(meta[i]) + '. ' + words
    const vec = await emb.embed(enriched)
    // probe: for each label whose golds include frag, does the gold rank improve into top-3?
    const labels = JSON.parse(fs.readFileSync('/tmp/opencode/labels150.json', 'utf8'))
    for (const { q, golds } of labels) {
      if (!golds.some(g => g.toLowerCase().includes(frag.toLowerCase()))) continue
      const qv = await emb.embed(q)
      const rankWith = (vecOverride) => {
        const scored = []
        for (let j = 0; j < meta.length; j++) {
          const v = j === i && vecOverride ? vecOverride : packed.subarray(j*384, (j+1)*384)
          scored.push({ j, s: cos(qv, v) })
        }
        scored.sort((a, b) => b.s - a.s)
        const gi = meta[i].path
        return scored.findIndex(x => meta[x.j].path === gi) + 1
      }
      const before = rankWith(null)
      const after = rankWith(vec)
      console.log((after < before && after <= 3 ? 'PROBE-PASS' : after < before ? 'improve' : 'NO-GAIN'), frag, '|', q.slice(0, 44), '| rank', before, '->', after)
    }
  }
})()
"
```

Entries that do not improve their label's gold rank are DROPPED from the table. Record every probe line in the report.

- [ ] **Step 4: Implement survivors in rebuild2.js + validation rebuild**

Add above the main block:

```js
// Selective vocabulary aliases (round 3): curated synonyms injected ONLY into
// rows whose path matches frag. Each entry carries its rationale. Survivors of
// the per-entry rank probe only — indiscriminate enrichment is proven harmful.
const ALIASES = [
  // { frag: 'accessib', words: 'accessibility aria screen reader keyboard', why: 'a11y gap label' },
]
```

(populated with the surviving entries), and in the texts derivation, after the graphKw line:

```js
    const alias = ALIASES.filter(a => rel.toLowerCase().includes(a.frag.toLowerCase()))
    if (alias.length > 0) base += '. ' + [...new Set(alias.flatMap(a => a.words.split(', ').map(w => w.trim())))].join(', ')
```

(inside the existing map — adjust to the file's actual structure; the segment appends after graphKw). Validation rebuild with a SEEDED scratch cache:

```bash
mkdir -p /tmp/opencode/rebuild-out3 && cp ~/.dsh/awesome-skills/embcache.json /tmp/opencode/rebuild-out3/embcache.json
cd ~/.dsh/awesome-skills/runtime && DSH_AWESOME_SKILLS_OUT=/tmp/opencode/rebuild-out3 node rebuild2.js
```

Expected: `embeddings: ~6090 cached, <tens> computed` (only alias-matching rows change). Record counts.

- [ ] **Step 5: Ship rebuild + sanity + preflight + embcache prune**

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

Embcache prune (ride-along; run AFTER the ship rebuild, BEFORE the bench):

```bash
node -e "
const fs = require('fs')
const H = process.env.HOME
const meta = JSON.parse(fs.readFileSync(H + '/.dsh/awesome-skills/skills.json', 'utf8'))
// rebuild the key set exactly as rebuild2.js does: sha1 of the index text
const crypto = require('crypto')
const texts = meta.map(m => {
  const k = m.name.split(/[-_]/).filter(w => w.length > 2).join(' ')
  let base = [m.name, m.name, k, m.description].join('. ')
  if (m.graphKw && m.graphKw.length) base += '. ' + m.graphKw.join(', ')
  return base
})
const keep = new Set(texts.map(t => crypto.createHash('sha1').update(t).digest('hex')))
const cache = JSON.parse(fs.readFileSync(H + '/.dsh/awesome-skills/embcache.json', 'utf8'))
const out = {}
for (const k of keep) if (cache[k]) out[k] = cache[k]
fs.writeFileSync(H + '/.dsh/awesome-skills/embcache.json', JSON.stringify(out))
console.log('pruned embcache:', Object.keys(cache).length, '->', Object.keys(out).length)
"
```

Expected: pruned size ≈ row count (6097 ± alias duplicates). Record before/after.

- [ ] **Step 6: Bench + gate**

```bash
node /tmp/opencode/bench150.mjs --phase alias
```

Standing: Task 1's [base-150]. Gate: R@3 ≥ standing AND R@1 ≥ standing. ALSO count gap closures: how many of the watch-list labels flipped to R1/r3.

- PASS: commit `git add skills/skills.json skills/vectors.f32` with message `data: selective vocabulary aliases (round 3, probe-surviving entries)`; push; sync profile BOTH dirs; deployed verify.
- FAIL: restore repo artifacts (`git checkout -- skills/`), remove the ALIASES additions from rebuild2.js (keep round-1 graphKw), re-run live rebuild (expect full cache hits), re-verify sanity, record rejected.

- [ ] **Step 7: Re-mirror bench assets** (unchanged this task, but confirm mirror current).

---

### Task 3: Lever 2 (conditional) — es/ies/ves family stem probe

**Run ONLY if the bar (R@1 ≥ 78% AND R@3 ≥ 92% on n=150) is unmet after Task 2.**

**Files:**
- Modify: `src/search.ts` (stemmer only) + rebuilt `lib/`

- [ ] **Step 1: Extend the stemmer (whole family, one probe)**

Modify the `es`-branch in `src/search.ts` to unify e-final singular/plural pairs:

```ts
const E_FINAL = new Set(['trace', 'state', 'resource', 'store', 'note', 'file', 'table', 'cache', 'type', 'scale'])
const stem = (w: string): string => {
  if (SURVIVE.has(w)) return w
  if (w.length >= 9 && w.endsWith('ment') && w.length - 4 >= 5) return w.slice(0, -4)
  if (w.length >= 7 && w.endsWith('ing') && w.length - 3 >= 4) return w.slice(0, -3)
  if (w.length >= 6 && S2_ENDS.has(w.slice(-2)) && w.length - 2 >= 4) {
    const cut = w.slice(0, -2)
    if (cut.length >= 4 && !E_FINAL.has(cut)) return cut + 'e'  // traces->trace, states->state
    if (E_FINAL.has(cut)) return cut                             // unify to the e-final singular
    return w.slice(0, -2)                                        // legacy behavior for non-e-final
  }
  if (w.length >= 5 && w.endsWith('s') && w.length - 1 >= 4) return w.slice(0, -1)
  return w
}
```

Wait — the two branches conflict. The correct whole-family rule: `traces`→`trace` (append e), `states`→`state`, `resources`→`resource`; non-e-final cuts keep legacy (`stores`→`stor`? NO — `store` is e-final too). The implementer must derive the rule carefully: for `es`-ending tokens, if the cut (token minus `es`) + `e` forms a plausible singular (cut is in E_FINAL or cut+e appears in the corpus vocabulary), return cut+e; else legacy cut. Simplest pre-registered version: ALWAYS return cut+e for the es-branch (traces→trace, states→state, resources→resource, stores→store, notes→note, files→file, tables→table, caches→cache, types→type, scales→scale) — this also changes `makes`→`make`, `likes`→`like` etc., which is the family-consistent behavior. Keep SURVIVE first. That is the probe.

- [ ] **Step 2: Build + guard probe + bench + gate**

```bash
cd /home/ryasr/dsh-awesome-skills && npm run build && node --input-type=module -e "
import { SkillIndex } from './lib/search.js'
const H = process.env.HOME
const idx = new SkillIndex({ corpusDir: H + '/.dsh/awesome-skills/skills', indexDir: H + '/dsh-awesome-skills/skills', modelDir: H + '/.dsh/awesome-skills/model', cacheDir: '/tmp/opencode/stemprobe-cache3' })
for (const q of ['json', 'zod', 'e2e testing', 'trace distributed requests', 'state management stores', 'used books docs']) {
  const r = await idx.search(q, 3)
  console.log(q.padEnd(34), '->', r.map(h => h.path.split('/').pop()).join(', '))
}
"
node /tmp/opencode/bench150.mjs --phase es-family
```

Gate vs the post-Task-2 standing. PASS → commit `git add src/search.ts lib` with message `feat: es-family singular/plural unification in the stemmer (probe)`; FAIL → `git checkout -- src/search.ts lib`, record rejected.

- [ ] **Step 3: If skipped (bar already met), record that explicitly** in the report.

---

### Task 4: Final bench, records upkeep, push

**Files:**
- Modify: `README.md` (one sentence), `docs/superpowers/plans/2026-09-01-retrieval-recovery.md` (Outcome-3 + round-2 erratum + Outcome-2 deployed line), possibly `src/index.ts` (bands only if verdict changed)

**Interfaces:**
- Consumes: standing bench from Tasks 2-3.
- Produces: final records + push.

- [ ] **Step 1: Final bench + regression**

```bash
node /tmp/opencode/bench150.mjs --phase final
printf '%s' '{"query":"send email to team","k":3}' | node /home/ryasr/dsh-awesome-skills/lib/query.js
```

- [ ] **Step 2: Band verdict** — mechanical rule on the [final] line; shipped 0.7/0.4 expected to stand (median ~0.58, R@3 ≥ 80%). Edit src/index.ts only if the verdict differs; rebuild+sync if so.

- [ ] **Step 3: Records**

- README Ranking sentence → final n=150 numbers.
- Round-2 plan doc (`docs/superpowers/plans/2026-09-02-retrieval-round2.md`): add one erratum line at the end noting the lever-numbering inconsistency (Global Constraints' "Lever 2/3" vs tasks' "Lever 1/2") — cosmetic, recorded.
- Recovery plan doc: append the deployed-profile line to Outcome-2 ("deployed profile synced to a3bec6b artifacts + stem lib, CLI-verified 2026-09-02"), then a new `## Outcome 3` section: final n=150 numbers vs bar, lever verdicts with commits, the surviving ALIASES table with rationales, gap-closure count, residuals (dead-gold labels, embcache state), next-lever note.

- [ ] **Step 4: Commit + push**

```bash
cd /home/ryasr/dsh-awesome-skills
git add README.md docs/superpowers/plans/2026-09-01-retrieval-recovery.md docs/superpowers/plans/2026-09-02-retrieval-round2.md src/index.ts lib
git commit -m "docs: retrieval round 3 final numbers and outcome record"
GIT_TERMINAL_PROMPT=0 git push origin main
```

(Trim the add-list to what actually changed.)

---

## Self-review notes

- Spec coverage: label growth with authoring-time gold hygiene (Task 1), selective alias enrichment with per-entry probe + full-bench gate + embcache prune (Task 2), conditional es-family probe with a precise family rule (Task 3), records upkeep including both round-2 errata (Task 4). Bar, gates, stop condition, ship flow, profile sync — from the spec addendum verbatim.
- Consistency: `ALIASES`/`frag`/`words` named identically across Task 2 steps; bench flags `--phase base-150|alias|es-family|final`; E_FINAL only inside Task 3's probe code.
- Precision corrections honored: no global segments, no bigrams; the probe step makes entry-level evidence mandatory before any re-embed; the ~140 non-gap labels are the generalization check.
- Known simplification: the Task 2 Step 3 probe script is a template — the implementer pastes their curated ALIASES draft and weak-label list; the acceptance rule (strict improvement into top-3) is mechanical, not vibes.
