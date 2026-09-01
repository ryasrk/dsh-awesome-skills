# Design: Retrieval-quality recovery (lexical lane + graph enrichment)

Date: 2026-09-01
Status: approved (approach C, phase-ordered)
Scope: dsh-awesome-skills ranking lane (`src/search.ts`), index text enrichment (`~/.dsh/awesome-skills/runtime/rebuild2.js`), benchmark consolidation, band re-derivation.
Parent: 2026-09-01-standard-mode-tools-babysitter-ingest-design.md (final-review follow-up).

## Problem

After the corpus grew 4,017 → 6,097, the 14-label benchmark reads R@1 50% / R@3
64% (median top-1 0.614). Diagnosis (reproduced):

1. **Lexical collisions win ties.** "manage react app state" → `app-store-connect`
   (0.562) beats `zustand` (absent from top-8): tokens `app`+`store` surface-match
   "App Store", and the tokenizer has no stemming (`manage` ≠ `management`),
   so zustand's real signal never fires lexically.
2. **Terse descriptions weaken the semantic lane.** babysitter descriptions
   average 102 chars vs legacy 388 (285 of 2,080 are <60 chars) → weaker MiniLM
   vectors → tie-breaks fall to surface lexical overlap.
3. **Crowding.** Six babysitter e2e variants + legacy e2e skills compete; the
   generic "set up end-to-end browser tests" surfaces `browser-stack` over
   `playwright-e2e`.
4. **Untapped structure.** babysitter's `graph:` frontmatter already carries the
   right tags (zustand: `skill-area:react-state-management, application-state-
   management`, `topic:flux-pattern`) — deliberately not indexed (YAGNI then;
   now the measured lever).

The old 45-label set is not a fair baseline on the new corpus (golds now compete
with better siblings), so it is rebuilt into a canonical set rather than trusted.

## Approach (C, phased)

### Phase A — lexical lane recovery (runtime-only, zero re-embed)

`src/search.ts`, ranking math only; index artifacts unchanged:

1. **Light suffix stemming** in `toks()` with length guards:
   strip `ment` when the remainder is ≥5 chars (`management`→`manage`,
   `deployment`→`deploy`; `document`→ kept), strip `ing`/`ed`/`es`/`s` when the
   remainder is ≥4 chars. Applied to query and document tokens alike, so IDF
   and overlap both see normalized forms. Guards keep `e2e`, `json`, `zod`,
   `zustand` intact.
2. **Phrase (bigram) boost.** For each adjacent token pair in the query, boost
   documents whose raw `name + description` text contains the pair as a
   word-boundary substring (`\breact app\b`, `\bstate management\b`). Boost is
   capped and modest (0.15 per matched pair, max 2 pairs) — a tie-breaker, not
   a lane. Meta strings are already in memory; no new persistence.
3. Nothing else changes: WEIGHT/GRAM_WEIGHT, POOL, brute force, output shape.

Phase A must be benchmarked alone before Phase B starts (attribution).

### Phase B — index-text enrichment from `graph:` frontmatter (partial re-embed)

`rebuild2.js` only; `skills.json`/`vectors.f32` re-shipped:

1. Extract `graph:` frontmatter fields (`domains`, `specializations`,
   `skillAreas`, `topics`, `roles`); strip `domain:`/`skill-area:`/etc. type
   prefixes; kebab-case → space-separated keywords; dedupe; append to the
   index text as one `keywords.` segment. Skills without `graph:` (all legacy
   packs) get unchanged index text → **embcache hits**, zero re-embed.
2. Expected re-embed: the ~2,100 babysitter rows (~3 minutes); total rebuild
   stays dominated by cache.
3. This is the description-length-bias lever the final review named: it feeds
   the semantic lane real signal regardless of description verbosity.

### Benchmark consolidation (runs after A and after B)

One canonical labels file `/tmp/opencode/labels6k.json`: the 14 current labels
plus the old 45 re-adjudicated against the 6,097 corpus (golds corrected to the
best surviving equivalent family, e.g. e2e → {playwright-e2e, cypress-e2e,
ecc/e2e-testing, browser-qa, webapp-testing}; dead golds dropped, never
counted as misses). Report R@1, R@3, per-band top-1 precision (band = the
score of the top-1 hit), and median score. n≈45–55 keeps per-band estimates
directional, not authoritative — the router text stays qualitative ("nearly
every time", "need a skim") regardless.

### Band re-derivation (after B)

Mechanical rule unchanged: median < 0.55 OR R@3 < 0.8 → 0.6/0.35, else 0.7/0.4.
Applied to the post-B distribution; `src/index.ts` updated only if the verdict
differs from the shipped 0.6/0.35.

## Targets

Canonical set, post-B: R@1 ≥ 65%, R@3 ≥ 85%. If Phase B lands short of R@3 85%
but improves on 64% meaningfully (+10pts), ship and record the residual as a
known limitation — further levers (per-file description fixes) stay parked.

## Error handling / risks

- Stemming over-normalization (e.g. two distinct skills collapsing): guarded by
  min-length rules; benchmark is the gate — ship A only if canonical R@3 does
  not regress vs 64%.
- Bigram boost noise (common-word pairs like "how to"): STOP list already
  filters query tokens; bigrams built from surviving tokens only.
- Graph keywords can only help recall, not hurt legacy rows (their text is
  untouched → identical vectors, byte-identical cache round-trip already proven).
- `skills_search`/`skills_read` surfaces unchanged; no re-verification needed
  beyond the standing sanity chain.

## Testing / verification

Per phase: canonical bench (A/B attribution), sanity one-liner (0 missing, 0
short desc, 0 lark), `preflight.mjs`, regression queries ("send email to team"
stays email-*; "manage react app state" now expected to hit `zustand` or a
react-state sibling in top-3), warm-latency spot check (unchanged expected:
brute force over 6,097 rows). Ship flow per parent spec (artifacts copy, drop
derived caches, commit, push).

## Non-goals

- ANN/quantization; re-ranking by an LLM; embedding-model swap.
- Editing babysitter SKILL.md files (upstream stays verbatim).
- Persisting graph keywords outside the index text (no new UI/knobs).
- Making per-band percentages model-facing (router stays qualitative).
