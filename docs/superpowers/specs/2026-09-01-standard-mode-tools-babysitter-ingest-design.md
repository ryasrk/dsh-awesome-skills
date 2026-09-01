# Design: Standard-mode corpus access + babysitter pack ingest

Date: 2026-09-01
Status: approved (design discussion 2026-09-01)
Scope: dsh-awesome-skills plugin — new model-facing tools, babysitter corpus ingest, rebuild vector cache, router rewrite, recalibration, ship.

## Problem

Two problems, one design.

1. **Standard mode cannot reach the corpus.** The only corpus access path today
   is the `skill-router` skill: the agent runs `printf ... | node query.js`
   (Bash, outside the workspace) and then reads the matched `SKILL.md` with
   Read (outside the workspace). Standard permission mode blocks both, so the
   corpus is silently unusable unless the user runs with bypass/full auth.
2. **The a5c-ai/babysitter pack is missing.** The user asked to add
   https://github.com/a5c-ai/babysitter — 2,102 skills under `library/`
   (49 `specializations/*` + `methodologies/*`), ~1,055 companion files,
   31 skills without `name:`/`description:` frontmatter, duplicate skill names
   across specializations.

## Decisions already made (from the design discussion)

- **Mechanism: the plugin registers tools.** dsh exposes a tool-registration
  seam to plugins; tools run in-process with full authority, so the agent never
  touches Bash or out-of-workspace Read. Confirmed available by the user.
- **Ingest everything:** all 2,102 skills. No domain curation. The index is
  path-based, so duplicate names are harmless; the router already documents
  duplicate-name handling.
- **Efficiency/speed/accuracy tuning** (user: "sesuaikan metode paling
  efisien, paling cepat, dan akurat"):
  - vector cache in the rebuild so repeat rebuilds are seconds, not minutes;
  - keep brute-force query (sub-10ms over 6k rows; ANN would trade exact
    accuracy for no perceptible gain);
  - no normalization or per-file fixing during ingest (fallback handles it);
  - benchmark gains a handful of babysitter-domain labels so score bands are
    calibrated on the new corpus, not just the old one.

## Architecture

### 1. Model-facing tools (`src/tools.ts`, new)

Two tools registered on the host's tool seam, executed in-process by the
plugin (host authority, no permission prompts):

| Tool | Parameters | Behavior |
|---|---|---|
| `skills_search` | `query: string`, `k?: number` (default 5, max 20) | Calls the existing search service → `{ count, results: [{ path, name, description, score }] }`. Settings knobs (prio/blacklist/whitelist) apply automatically because the service owns them. |
| `skills_read` | `path: string`, `file?: string` | Returns the text of `<corpusDir>/<path>/SKILL.md`, or of `file` (relative to the skill dir) when given. |

**`skills_read` guards (single audit point):**
- Resolve the joined path; it must stay under `corpusDir` (blocks `..` and
  absolute-path injection).
- Text-extension allowlist: `.md .txt .json .js .mjs .ts .py .sh .html .css
  .yaml .yml .toml`.
- 64 KiB per-read cap (largest skill body today is ~20 KiB).

**Registration contract:** a locally declared structural interface in
`cordis-types.ts`, same pattern as `routes.ts` uses for `webServer`. If the
host lacks the seam, log a warning and continue — the router's bash fallback
covers that host.

**Names may be adjusted to harness conventions at implementation time** (e.g.
if the harness namespaces plugin tools); behavior is what matters.

### 2. Babysitter ingest (one-off, ECC pattern)

- One-off copy script in `/tmp/opencode/`: every directory holding a
  `SKILL.md` under `library/` →
  `~/.dsh/awesome-skills/skills/a5c-ai/babysitter/<specialization>/<skill>/`,
  companion files copied verbatim. Layout derived from the path (no
  assumption of a `skills/` intermediate directory).
- 31 skills without frontmatter name/description: covered by `rebuild2.js`'s
  existing body-derived fallback (ECC pattern). No manual fixes (YAGNI); if
  the benchmark shows a weak area, per-file fixing is the lever then.
- `graph:` frontmatter is not indexed for now (YAGNI). Recorded as a future
  enhancement if recall measurably suffers.
- Walker skips skill dirs nested inside other skill dirs (existing rule).
- Result: 4,017 → **~6,119** skills (exact count reported by the script);
  `vectors.f32` 6.2MB → ~9.4MB; 3-level paths verified compatible (nested
  paths already work in every consumer).

### 3. Rebuild vector cache (small change, big win)

- `rebuild2.js` gains an append-only cache: key = SHA1 of the index text
  (`name + keywords + description`), value = the 384-float embedding. Unchanged
  skills hit the cache and are never re-embedded.
- First rebuild pays once (~3–6 min for 6k embeddings); every later rebuild is
  seconds, which makes benchmark iteration cheap.
- Zero accuracy impact: identical text → identical vector.
- Cache file lives in the runtime directory (`~/.dsh/awesome-skills/`), beside
  `skills.json` — outside the repo, so the package ship flow never sees it.
  Regenerating from scratch is always valid, so a stale or corrupt cache only
  ever costs re-embedding, never correctness.

### 4. Router rewrite (`ROUTER_SKILL` in `src/index.ts`)

- Tool-first: search with `skills_search`, read with `skills_read`.
- The `printf | node query.js` pipeline shrinks to a one-paragraph fallback
  ("if the tools are unavailable on this host…").
- Duplicate-name section stays; add one sentence: hits from
  `a5c-ai/babysitter/...` and other sources can share names — the path
  distinguishes them.
- Score bands 0.7 / 0.4 are revalidated after the rebuild against the expanded
  benchmark; bands adjusted if the distribution shifted.

### 5. Calibration + verification (proven chain)

1. Node sanity: 0 missing bodies, 0 short descriptions.
2. `node scripts/preflight.mjs`.
3. Benchmark: the existing 45 labeled queries + **10 new babysitter-domain
   labels** (e.g. "zustand store patterns", "sensor fusion") written once into
   `/tmp/opencode/labels.json`; bands tuned from results.
4. Manual sample queries: babysitter topics ("zustand store patterns",
   "sensor fusion") plus regression queries ("send email to team").
5. Ship: copy `skills.json` + `vectors.f32` into the package, drop derived
   caches, README update (corpus tree + counts + new tools section — also
   clears the pending lark line `larksuite/cli/ # 22 skills` and the 4,040
   count), regenerate client bundle if needed, commit + push.

## Error handling

- Tool seam missing → warn + router fallback stays bash-first for that host
  (the template's fallback paragraph is unconditional text; harmless when the
  tools exist).
- `skills_read` guard failure → tool returns a structured error, never throws
  across the seam; the agent can re-ask with a corrected path.
- Rebuild cache corrupted/unreadable → rebuild proceeds uncached (cache is an
  optimization, never a dependency).
- Priority loader / routes / search knobs: untouched — tools call the same
  service, so UI knobs keep working on the new corpus size.

## Testing

- Unit-ish sanity via existing chain (missing bodies, short descriptions,
  preflight).
- Benchmark is the accuracy gate; regression queries guard old domains.
- Tool guards get spot checks during implementation (traversal attempt,
  disallowed extension, oversized file, missing path) via direct invocation in
  a scratch harness session — the host's tool registry is exercised for real.

## Non-goals

- Indexing `graph:` frontmatter (future enhancement if recall suffers).
- Curating the babysitter pack by domain.
- ANN/quantized search structures.
- Fixing upstream babysitter frontmatter.
- Changes to priority-loader, routes, or search ranking math.
