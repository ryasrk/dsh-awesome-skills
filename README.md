---
description: "Semantic vector search over a 6,097-skill local corpus (skills.sh top 100 + the a5c-ai/babysitter library), installed as a DeepSeek Harness bundle"
kind: "package-reference"
---

# dsh-awesome-skills

A DeepSeek Harness bundle that gives agents semantic access to a curated local
skill corpus — the skills.sh top 100 (83 GitHub-hosted skills) plus the full
a5c-ai/babysitter library (~2,100 skills) — **6,097 skills total** — without
ever putting that corpus into the per-turn model catalog.

## Why

A skill directory that DeepSeek Harness discovers becomes a catalog entry, and
every catalog entry is injected into the model's context on every turn. A
large corpus there is a very large per-turn token bill for something almost
never needed on a given turn.

This plugin inverts that. The corpus stays out of the catalog; a single small
`skill-router` skill is installed instead, and it teaches the agent to search
the corpus on demand.

## The corpus

The corpus is organized by source, one directory per owner/repo, with each
skill directory carrying its complete content — `SKILL.md` plus every
reference file it points at (examples, templates, scripts):

```
skills/
├── a5c-ai/babysitter/            # ~2,100 skills (specializations + methodologies incl. the domains tree)
├── mattpocock/skills/            # 17 skills (tdd, grilling, code-review, ...)
├── microsoft/azure-skills/       # 20 skills (incl. microsoft-foundry: 191 files)
├── anthropics/skills/frontend-design/
├── vercel-labs/agent-skills/     # vercel-react-best-practices (62 rules)
├── obra/superpowers/             # brainstorming, systematic-debugging, ...
└── ...                           # 157 owner/repo groups, 6,097 skills, 17,600+ files
```

The 17 site-only entries on the skills.sh leaderboard (the open.feishu.cn
lark suite and similar, which have no public repository) are excluded — there
is nothing to fetch from.

| Path | Contents |
|---|---|
| `lib/` | Compiled plugin host + search service + `query.js` CLI |
| `skills/skills.json` | Corpus index: name, path, description per skill |
| `skills/vectors.f32` | 384-dim L2-normalized embeddings, one row per skill |
| `model/` | `all-MiniLM-L6-v2`, quantized ONNX + tokenizer |

The index ships prebuilt and is committed. Skill *bodies* live in the
canonical corpus directory (`~/.dsh/awesome-skills/skills`), referenced — not
copied — by the package: search results return paths into it, so there is
exactly one copy of the corpus on disk.

## Install

```sh
dsh plugin --profile web add github:ryasrk/dsh-awesome-skills
```

The plugin mounts as a cordis bundle (see `cordis.patch.yml`) and, on `apply`,
installs the bundled `skill-router` skill into `~/.agents/skills/skill-router`.
An existing `skill-router` is never overwritten, so a hand-tuned router
survives reinstall.

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

`WEIGHT` 0.55, `GRAM_WEIGHT` 0.5, pool 1200. These were calibrated on the
16k-skill corpus the plugin originally shipped (45 held-out cases, R@5 51%,
MRR 0.376), then re-checked on the shipped corpus (Task 7 recalibration,
10 new + 4 regression domain labels); the weights carry over unchanged, and
brute-force scoring makes pool size moot at any realistic k.

## Speed

Measured on the shipped 6,097-skill corpus (brute force still scores every
row; the per-process model load dominates):

| Path | Latency |
|---|---|
| Cold (model load) | ~0.7s |
| Warm (query cache hit) | ~0.6s |

Derived caches (per-skill char grams, query embeddings) live next to the
corpus and are keyed by a corpus fingerprint, so a corpus change invalidates
them automatically.

## Service surface

Other plugins and tools can use the search service directly:

```ts
const search = ctx.get('skills-search')
const hits = await search.search('set up end-to-end browser tests', 5)
const dir = search.skillDir(hits[0].path) // e.g. .../skills/mattpocock/skills/tdd
```

A hit's `path` is the subpath under the corpus root (`owner/repo/skill`), and
every consumer joins `corpusDir + path + /SKILL.md` — the priority loader, the
`skill-router` template, and the settings UI all share that one convention.
Reference files live beside the `SKILL.md`, so a hit's directory is the whole
playbook.

## Configuration

All fields optional, via a `cordis.patch.yml` row:

| Field | Default | Meaning |
|---|---|---|
| `corpusDir` | `~/.dsh/awesome-skills/skills` | Skill bodies (`<path>/SKILL.md`) |
| `home` | `$HOME` | Where the router skill is installed |
| `installSkillRouter` | `true` | Install the router skill on `apply` |

Environment: `DSH_AWESOME_SKILLS_CORPUS` (corpus), `DSH_AWESOME_SKILLS_INDEX`
(index directory for the CLI).

## Rebuilding the index

The index ships prebuilt. After changing the corpus, rebuild it with the
standalone runtime's walker, which reads the corpus recursively and rewrites
`skills.json` and `vectors.f32`:

```sh
cd ~/.dsh/awesome-skills/runtime
node rebuild2.js
# then copy skills.json + vectors.f32 into the package's skills/
```

A skill directory is any directory holding a `SKILL.md`; directories nested
inside one (a sub-skill shipped as reference material) are not indexed
separately. Regenerate the client bundle after pulling source changes:
`npx tsdown -c tsdown.client.ts`, then run `node scripts/preflight.mjs`.

## License

MIT
