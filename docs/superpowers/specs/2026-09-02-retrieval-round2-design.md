# Design addendum: retrieval round 2 — reach and hold the accuracy bar

Date: 2026-09-02
Status: approved (user: "Lanjutkan, sampai akurat")
Scope: canonical label growth, stemming-only probe, enrichment round 2, band/docs upkeep.
Parent: 2026-09-01-retrieval-recovery-design.md + its plan's Outcome record.

## Definition of done ("akurat")

Measured on the canonical 100-label bench (`bench6k.mjs` against the shipped repo
index): **R@1 ≥ 70% AND R@3 ≥ 90%**. If the bar is not met after all three levers,
the residual is recorded honestly (README + Outcome) and the loop stops — no
fourth lever is improvised.

## Why these three levers (evidence carried from round 1)

1. **Grow the label set 50 → 100.** The old gate was a coin-flip on 2 labels
   (1 label = 2 pts). n=100 makes 1 label = 1 pt and per-domain slices legible.
   Composition: the 50 frozen labels (verbatim, golds untouched) + 50 new
   labels written once into one corner each (babysitter, legacy-awesome, ECC,
   UI/design, data/ops). Missing-domain check is part of the task, not an
   afterthought.
2. **Stemming-only probe.** All Phase A losses traced to the bigram boost; the
   stemmer itself never got a solo run. Cherry-pick `stem/S2_ENDS/SURVIVE/toks`
   from `277252e`, no bigrams, re-gate under the same conjunctive rule.
3. **Enrichment round 2 (same safe ship path as Phase B).** Two additive
   index-text inputs:
   a. **Path taxonomy segment** for EVERY row: `path/a5c-ai/babysitter/web-development/zustand`
      contributes `web development zustand` — 4,017 legacy rows change text this
      time (re-embed ~4,000 + 2,080 = ~6,097; full embed ≈ 25–30 min, one time).
   b. **Body-H1 heading segment** for rows whose heading differs from the name
      (max 12 words, kebab→spaces), drawn from the already-read SKILL.md body.
   Cleaning/caps identical to Phase B's rules. This is the vocabulary lever the
   postmortem named: the 6 hard misses lack the gold words in candidate text.

## Gates (mechanical, pre-registered)

- Bench rule (unchanged): median < 0.55 OR R@3 < 0.80 → bands 0.6/0.35, else 0.7/0.4.
- Lever gate (same conjunctive shape as round 1, now on n=100): a lever SHIPS
  only if R@3 ≥ standing R@3 AND R@1 ≥ standing R@1. On failure: revert that
  lever's commit, re-bench, record rejected-by-benchmark, move to the next lever.
- Each lever is measured independently (one bench run per lever) so attribution
  stays clean.
- Stop condition: bar met, OR all levers adjudicated. Residual reported either way.

## Ship flow

Unchanged from the parent plan (sanity zeros → preflight → artifact copy →
derived caches removed → commit → push). One rebuild-and-ship after the last
standing lever (levers that only touch `src/search.ts` need no rebuild).

## Non-goals

- Bigram boost in any form (rejected in round 1; revisit only with
  position-aware IDF weighting, which stays out of scope).
- Editing upstream SKILL.md files.
- ANN, model swap, LLM rerank.
- Growing the label set beyond 100 this round.
