---
description: "Semantic vector search over a 16,000-skill local corpus, installed as a DeepSeek Harness bundle"
kind: "package-reference"
---

# dsh-awesome-skills

A DeepSeek Harness bundle that gives agents semantic access to a **16,334-skill
local corpus** without ever putting that corpus into the per-turn model catalog.

## Why

A skill directory that DeepSeek Harness discovers becomes a catalog entry, and
every catalog entry is injected into the model's context on every turn. 16,000
skills there is a very large per-turn token bill for something almost never
needed on a given turn.

This plugin inverts that. The corpus stays out of the catalog; a single small
`skill-router` skill is installed instead, and it teaches the agent to search
the corpus on demand.

## Install

```sh
dsh plugin --profile web add /path/to/dsh-awesome-skills
```

The plugin mounts as a cordis bundle (see `cordis.patch.yml`) and, on `apply`,
installs the bundled `skill-router` skill into `~/.agents/skills/skill-router`.
An existing `skill-router` is never overwritten, so a hand-tuned router
survives reinstall.

## What ships

| Path | Contents |
|---|---|
| `lib/` | Compiled plugin host + search service + `query.js` CLI |
| `skills/skills.json` | Corpus index: name, path, description per skill |
| `skills/vectors.f32` | 384-dim L2-normalized embeddings, one row per skill |
| `model/` | `all-MiniLM-L6-v2`, quantized ONNX + tokenizer |

The **skill bodies** (`SKILL.md` files) are *not* copied into the package. The
plugin references the canonical corpus directory and returns paths into it, so
there is exactly one copy of the 134MB corpus on disk.

## Ranking

Three lanes are fused, then re-ranked over a candidate pool:

```
score = (1 - WEIGHT) * semantic + WEIGHT * lexical + GRAM_WEIGHT * char-3-gram
```

- **Semantic** — MiniLM cosine, brute force over all rows. Exact; no
  quantization drift.
- **Lexical** — IDF-weighted token overlap.
- **Char 3-gram** — script-agnostic, so CJK/Cyrillic queries and technical
  identifiers still discriminate.

`WEIGHT` 0.55, `GRAM_WEIGHT` 0.5, pool 1200, calibrated on 45 held-out cases
against the previous values (`W` 0.4, `G` 0.45, pool 50, tuned when the corpus
was 677 skills):

| | R@1 | R@3 | R@5 | MRR |
|---|---|---|---|---|
| previous | 27% | 33% | 44% | 0.333 |
| current | 27% | 40% | 51% | 0.376 |

Leave-one-out MRR equals full-set MRR, so the values are not fitted to that
eval set; a 2000-resample bootstrap prefers the current values in 95.8% of
resamples.

## Speed

Measured on the 16,334-skill corpus:

| Path | Latency |
|---|---|
| Cold (no caches) | ~0.44s |
| Warm (query cache hit) | ~0.37s |

Derived caches (per-skill char grams, query embeddings) live next to the
corpus and are keyed by a corpus fingerprint, so a corpus change invalidates
them automatically. Grams are computed lazily per candidate: only the ~1200
pool members are ever scored, not all 16,334.

## Service surface

Other plugins and tools can use the search service directly:

```ts
const search = ctx.get('skills-search')
const hits = await search.search('set up end-to-end browser tests', 5)
const dir = search.skillDir(hits[0].path) // directory holding SKILL.md
```

## Configuration

All fields optional, via a `cordis.patch.yml` row:

| Field | Default | Meaning |
|---|---|---|
| `corpusDir` | `~/.dsh/awesome-skills/skills` | Skill bodies (`<path>/SKILL.md`) |
| `home` | `$HOME` | Where the router skill is installed |
| `installSkillRouter` | `true` | Install the router skill on `apply` |

Environment: `DSH_AWESOME_SKILLS_CORPUS` (corpus), `DSH_AWESOME_SKILLS_INDEX`
(index directory for the CLI).

## Relation to other plugins

`dsh-skills-hub` browses, enables and imports skills that are already
installed. This plugin is different: it searches a large corpus that is
deliberately *not* installed as skills, and returns which one to read. The two
are complementary.

## Rebuilding the index

The index ships prebuilt. To rebuild it after changing the corpus, use the
standalone runtime's `rebuild.js`, which reads the corpus and rewrites
`skills.json` and `vectors.f32`.

## License

MIT
