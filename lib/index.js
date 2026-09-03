/**
 * dsh-awesome-skills host entry.
 *
 * Registers the corpus as a durable host service and installs the model-facing
 * `skill-router` skill so agents can search the corpus semantically.
 *
 * The corpus is deliberately NOT a skill discovery root: ~6,000 skills in the
 * catalog cost a large per-turn token bill. Instead this plugin owns the
 * vector index and exposes two things:
 *   1. a `skills-search` service with `search()` for other plugins and tools,
 *   2. a bundled `skill-router` skill installed into the user's agents home,
 *      which is how an agent is told the search exists at all.
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { registerSearchService } from './search.js';
import { installSettingsSection } from './settings-wiring.js';
import { mountSkillRoutesOnContext } from './routes.js';
import { installPriorityLoader } from './priority-loader.js';
import { registerSkillsTools } from './tools.js';
export const name = 'dsh-awesome-skills';
/** Package root: this file lives at `<root>/src/index.ts` or `<root>/lib/index.js`. */
const PKG_ROOT = (() => {
    const here = dirname(fileURLToPath(import.meta.url));
    // src/index.ts -> ..   |   lib/index.js -> ..
    return join(here, '..');
})();
/**
 * The one thing an agent cannot discover on its own: that a 6,000-skill
 * corpus exists at all. Installing a single small skill into the agents home
 * is what makes the corpus reachable, and it is the only skill this plugin
 * puts into the model-facing catalog - the rest stay out of it.
 */
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

Calibrated on labeled task queries against this corpus: strong-band top hits
were relevant nearly every time; mid-band hits are plausible but need a skim;
weak-band hits rarely help. Trust the bands:

- **0.7+** strong match - read it.
- **0.4-0.7** plausible - read the top 2-3 descriptions, not
  just the first line; the best playbook for the task is often at rank 2-3.
- **< 0.4** weak - likely no good playbook for this exact task.

### When one query is not enough

- **Broad request** ("build me a dashboard") → run 2-3 queries for its
  distinct facets (e.g. "frontend dashboard layout", "charts data
  visualization", "deploy static site") and take the best hit from each.
- **First results all score < 0.4** → rephrase ONCE with different
  wording ("auth" → "login session cookie"). A second miss means the corpus
  likely has nothing; move on without guilt.
- **Multiple hits with the same trailing name** from different sources
  (e.g. several \`tdd\` skills, or duplicates across
  \`a5c-ai/babysitter/<domain>/\` specializations) → they are alternative
  takes. The full \`path\` distinguishes them. Prefer the one whose
  description fits the user's stack; when they look equivalent, prefer the
  higher score and read just one.

### Decision points, don't drift

- Task is one clear domain and a hit scores 0.7+ → read exactly one
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
`;
export function apply(ctx, config) {
    const home = config?.home ?? process.env.HOME ?? '';
    // The ~6k skill bodies stay in their canonical corpus directory and are
    // referenced, not copied: the package ships the index (skills.json +
    // vectors.f32) and points `corpusDir` at the tree those bodies live in.
    const corpusDir = config?.corpusDir
        ?? process.env.DSH_AWESOME_SKILLS_CORPUS
        ?? join(process.env.HOME ?? '', '.dsh', 'awesome-skills', 'skills');
    const queryBin = join(PKG_ROOT, 'lib', 'query.js');
    const search = registerSearchService(ctx, {
        corpusDir,
        indexDir: join(PKG_ROOT, 'skills'),
        runtimeDir: join(PKG_ROOT, 'lib'),
    });
    ctx.logger.info(`dsh-awesome-skills: corpus=${corpusDir} skills=${search.count()}`);
    // Settings: the user layer over these defaults is what the plugin-
    // configuration card edits. `installSettingsSection` injects ['settings'],
    // so on a host without the settings service nothing here runs and the
    // composed defaults above simply stand — degradation, not failure.
    installSettingsSection(ctx, search);
    // Browser RPC for the Skill Explorer settings section. Injects ['webServer'],
    // so on a host without one this is a quiet no-op and the CLI-only
    // `lib/query.js` path keeps serving agents.
    // The priority routes read and write the same knobs the settings document
    // drives, so the UI and a hand-edited cordis.yml cannot disagree.
    const getKnobs = () => {
        const k = search.getKnobs();
        return { prio: k.prio, blacklist: k.blacklist, whitelist: k.whitelist, whitelistOnly: k.whitelistOnly };
    };
    const setKnobs = (next) => search.setKnobs(next);
    mountSkillRoutesOnContext(ctx, search, corpusDir, getKnobs, setKnobs);
    // Standard-permission-mode corpus access: the model-facing tools run
    // in-process with host authority, so routing needs no Bash or
    // out-of-workspace Read. Missing seam -> warn; the router's bash
    // fallback paragraph covers that host.
    registerSkillsTools(ctx, search, corpusDir);
    // "Wajib diload dari awal" made literal: the priority list's skill bodies
    // are injected into every model turn. The knobs are read live through the
    // same closure the routes write, so a settings save changes the next turn
    // without a restart.
    installPriorityLoader(ctx, corpusDir, () => ({ prio: search.getKnobs().prio }), ctx.logger);
    if (config?.installSkillRouter === false || !home)
        return;
    try {
        const dir = join(home, '.agents', 'skills', 'skill-router');
        if (!existsSync(dir))
            mkdirSync(dir, { recursive: true });
        const file = join(dir, 'SKILL.md');
        // Refresh on every apply: the shipped copy is the source of truth for the
        // router's *behaviour*, and a stale one silently changes when the model
        // routes. A user's manual tweak would be lost, which is the tradeoff the
        // old install-if-absent rule made — but that rule shipped a description so
        // passive that the router almost never fired, which is the worse failure.
        // The live copy is regenerated from ROUTER_SKILL here; paths stay correct
        // because they are substituted at write time, never baked into the source.
        writeFileSync(file, ROUTER_SKILL.replaceAll('__QUERY_BIN__', queryBin).replaceAll('__CORPUS_DIR__', corpusDir));
        ctx.logger.info(`dsh-awesome-skills: installed skill-router into ${dir}`);
    }
    catch (error) {
        ctx.logger.warn(`dsh-awesome-skills: could not install skill-router skill: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=index.js.map