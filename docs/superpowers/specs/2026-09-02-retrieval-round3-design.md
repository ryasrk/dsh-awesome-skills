# Design addendum: retrieval round 3 — selective enrichment toward the ceiling

Date: 2026-09-02
Status: approved (user: "Lanjutkan"; levers pre-adjudicated in Outcome-2 + round-2 final review)
Scope: label growth 100→150 with gold hygiene, selective vocabulary enrichment (probe-then-ship), conditional es-family stem probe, records upkeep.
Parent: 2026-09-02-retrieval-round2-design.md + Outcome-2.

## Standing

`[final]` on n=100: R@1 76% / R@3 92% / median 0.581 (commit a3bec6b + f1cf90f artifacts).
Ceiling on the current set: 98/100 (2 all-dead-gold labels: pre-commit, pagination).
Round-1/2 rejections (bigram boost, indiscriminate path/H1 enrichment) are settled
evidence: indiscriminate levers have negative EV; precision is the constraint.

## Definition of done

On the canonical 150-label bench, shipped repo index: **R@1 ≥ 78% AND R@3 ≥ 92%**
(no-regression floor on both), stretch 80/94, with every lever adjudicated
(shipped or rejected-by-benchmark) and ≥3 of the 6 known vocabulary-gap labels
closed. Residual recorded honestly; the loop stops after the levers below.

## Levers (order fixed)

### 1. Labels 100 → 150, with gold hygiene

- Frozen 100 stay verbatim (first 50 + round-2's 50, untouched).
- 50 new labels, 10 per corner, BUT this time gold hygiene is enforced at
  authoring: every gold fragment must be verified live (appears in ≥1 indexed
  path) BEFORE the baseline freezes the set; dead fragments are replaced with
  verified live ones at authoring time (never mid-flight). Prefer distinctive
  fragments over generic tokens (no bare "test"/"design" golds) — generic-gold
  leniency inflates absolute numbers.
- The 2 carried dead labels (pre-commit, pagination) stay dead — frozen; ceiling
  on 150 is 148.

### 2. Selective vocabulary enrichment (probe-then-ship)

The mechanism correction from two rejections: inject NOTHING globally; inject
hand-curated alias words ONLY into rows whose path matches a known gap
fragment, and only after a per-row probe proves the win.

- **Discovery:** for each known gap label (accessibility/a11y, sensor-fusion,
  brainstorming, api-docs/technical-documentation, translation, tdd-family,
  plus any new gap the 150-baseline exposes), list the gold rows' current index
  text and the query words they lack.
- **Curation:** a small `ALIASES` table in `rebuild2.js` — entries
  `{ frag, words }` where `frag` is a path fragment and `words` are genuine
  vocabulary synonyms (e.g. a11y ↔ accessible/accessibility/aria). Each entry
  records its rationale. Curation is justified by vocabulary need, NOT by label
  identity — the other ~140 labels are the generalization check.
- **Probe (per entry, before any rebuild):** override the live vectors of the
  matching rows with embeddings of their enriched text (embcore), re-rank that
  label's query over the overridden index, and require the gold's rank to
  strictly improve into top-3. Losers are dropped from the table.
- **Ship:** one rebuild with the surviving alias table (cache re-embeds only
  matching rows — tens of rows, not thousands), standard ship flow, full-bench
  gate (R@3 ≥ standing AND R@1 ≥ standing). The full bench is the collateral-
  damage guard.
- **Embcache prune (rides this ship):** rewrite the append-only cache keeping
  only keys of the shipped index texts (~115MB → ~55MB; two rounds of dead
  vectors have accumulated).

### 3. es/ies/ves full-family stem probe (conditional)

Only if the bar is still unmet after lever 2. Pre-registered: extend the
stemmer's `es`-branch to unify e-final singular/plural pairs (trace/traces,
state/states, resource/resources) as a whole-family probe with the same
conjunctive gate. Currently a measured win — as likely to lose as gain; the
bench decides.

## Gates

- Lever gate (unchanged, now n=150): a lever ships only if bench R@3 ≥ standing
  AND R@1 ≥ standing. Failure → revert that lever, re-bench, record, next lever.
- Bands rule unchanged (median < 0.55 OR R@3 < 0.80 → 0.6/0.35 else 0.7/0.4).
- Stop: bar met, or all levers adjudicated.

## Records upkeep (rides the final docs commit)

- Fold the round-2 erratum (lever-numbering inconsistency) into the round-2 plan doc.
- Add the deployed-profile state line to Outcome-2.
- New Outcome-3 section with final numbers, lever verdicts, alias table, residuals.

## Non-goals

- Bigram boost in any form; indiscriminate segments (path/H1 wholesale); editing
  upstream SKILL.md files; ANN/model swap; labels beyond 150 this round;
  committing bench assets to the repo (they stay in gitignored .superpowers/sdd
  archives + /tmp working copies).
