/**
 * dsh-awesome-skills host entry.
 *
 * Registers the corpus as a durable host service and installs the model-facing
 * `skill-router` skill so agents can search the corpus semantically.
 *
 * The corpus is deliberately NOT a skill discovery root: 16,000 skills in the
 * catalog cost a large per-turn token bill. Instead this plugin owns the
 * vector index and exposes two things:
 *   1. a `skills-search` service with `search()` for other plugins and tools,
 *   2. a bundled `skill-router` skill installed into the user's agents home,
 *      which is how an agent is told the search exists at all.
 */

import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { registerSearchService, type SkillsSearch } from './search.js'
import { installSettingsSection } from './settings-wiring.js'
import { mountSkillRoutesOnContext } from './routes.js'
import type { PluginContext } from './cordis-types.js'

export const name = 'dsh-awesome-skills'

/** `cordis.yml` configuration. Every field is optional. */
export interface Config {
  /** Absolute corpus directory. Defaults to the bundled `skills/`. */
  corpusDir?: string
  /** Home directory of the running user, for installing the router skill. */
  home?: string
  /** Install the bundled skill-router skill into `<home>/.agents/skills`. */
  installSkillRouter?: boolean
}

/** Package root: this file lives at `<root>/src/index.ts` or `<root>/lib/index.js`. */
const PKG_ROOT = (() => {
  const here = dirname(fileURLToPath(import.meta.url))
  // src/index.ts -> ..   |   lib/index.js -> ..
  return join(here, '..')
})()

/**
 * The one thing an agent cannot discover on its own: that a 16k-skill corpus
 * exists at all. Installing a single small skill into the agents home is what
 * makes the corpus reachable, and it is the only skill this plugin puts into
 * the model-facing catalog - the other 16,000 stay out of it.
 */
const ROUTER_SKILL = `---
name: skill-router
description: Route every task through the local 16k-skill corpus FIRST - this is a default-first reflex, not an opt-in. Before writing or planning anything for a concrete request (build, fix, test, deploy, configure, refactor, review), query the corpus from the conversation's context and follow the best match. Call this skill at the START of a task, unprompted, whenever the message contains an actionable request - do not wait for the user to name a skill or for the task to look specialized.
disable-model-invocation: false
user-invocable: true
---

# Skill router

You have access to a local corpus of **~16,000 specialized skills** that is NOT in
your catalog. It is vector-indexed and searchable. Before doing real work, search
it - a vetted playbook almost always beats improvising from general knowledge.

## When to route (it flows from context, not from the user naming a skill)

Route by reading the conversation. A skill lookup is triggered by the SHAPE of
the message, not by an explicit skill name:

- The user describes something they want built, fixed, tested, deployed,
  configured, refactored, reviewed, or explained with intent to act.
- The user names a tool, framework, library, cloud, or database.
- The user asks "how do I / can we / please do".
- The conversation is mid-task and the next step is a concrete action.

Route FIRST, before reasoning about the approach. The lookup is cheap (~1s)
and it happens before planning, not after: reading the matched playbook is
what makes the plan good.

Skip routing only when the turn is purely conversational: a greeting, a
thanks, a clarification question, a status report, or when you are already
following a skill loaded this turn.

Default is ROUTE. If you are unsure whether a turn counts, route anyway - a
miss costs one second. Silence after an actionable message is the failure
mode this skill exists to prevent.

## How

Pipe a plain-language description of the goal into the bundled search binary.
Write it the way you would explain the request to a colleague; semantic
similarity does the matching. If the first query misses, rephrase once.

\`\`\`bash
printf '%s' '{"query":"<what the user asked for>","k":5}' \\
  | node "__QUERY_BIN__"
\`\`\`

Read the best match using its \`path\` field (**not** its display \`name\`):

\`\`\`bash
sed -n '1,260p' "__CORPUS_DIR__/<path>/SKILL.md"
\`\`\`

## Rules

- Read only the selected file, and follow it. Do not load several skills and
  blend them unless the task genuinely spans them.
- Never paste a whole skill file into the chat - read it, then act on it.
- If nothing relevant comes back, continue normally. A miss costs one second and
  is not a failure.
`

export function apply(ctx: PluginContext, config?: Config): void {
  const home = config?.home ?? process.env.HOME ?? ''
  // The 16k skill bodies stay in their canonical corpus directory and are
  // referenced, not copied: the package ships the index (skills.json +
  // vectors.f32) and points `corpusDir` at the tree those bodies live in.
  const corpusDir = config?.corpusDir
    ?? process.env.DSH_AWESOME_SKILLS_CORPUS
    ?? join(process.env.HOME ?? '', '.dsh', 'awesome-skills', 'skills')
  const queryBin = join(PKG_ROOT, 'lib', 'query.js')

  const search: SkillsSearch = registerSearchService(ctx, {
    corpusDir,
    indexDir: join(PKG_ROOT, 'skills'),
    runtimeDir: join(PKG_ROOT, 'lib'),
  })

  ctx.logger.info(`dsh-awesome-skills: corpus=${corpusDir} skills=${search.count()}`)

  // Settings: the user layer over these defaults is what the plugin-
  // configuration card edits. `installSettingsSection` injects ['settings'],
  // so on a host without the settings service nothing here runs and the
  // composed defaults above simply stand — degradation, not failure.
  installSettingsSection(ctx, search)

  // Browser RPC for the Skill Explorer settings section. Injects ['webServer'],
  // so on a host without one this is a quiet no-op and the CLI-only
  // `lib/query.js` path keeps serving agents.
  // The priority routes read and write the same knobs the settings document
  // drives, so the UI and a hand-edited cordis.yml cannot disagree.
  const getKnobs = (): { boosted: string[]; muted: string[]; pinMode: 'pin' | 'boost' } => {
    const k = search.getKnobs()
    return { boosted: k.boosted, muted: k.muted, pinMode: k.pinMode }
  }
  const setKnobs = (next: { boosted?: string[]; muted?: string[]; pinMode?: 'pin' | 'boost' }): void =>
    search.setKnobs(next)
  mountSkillRoutesOnContext(ctx, search, corpusDir, getKnobs, setKnobs)

  if (config?.installSkillRouter === false || !home) return

  try {
    const dir = join(home, '.agents', 'skills', 'skill-router')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const file = join(dir, 'SKILL.md')
    // Refresh on every apply: the shipped copy is the source of truth for the
    // router's *behaviour*, and a stale one silently changes when the model
    // routes. A user's manual tweak would be lost, which is the tradeoff the
    // old install-if-absent rule made — but that rule shipped a description so
    // passive that the router almost never fired, which is the worse failure.
    // The live copy is regenerated from ROUTER_SKILL here; paths stay correct
    // because they are substituted at write time, never baked into the source.
    writeFileSync(file, ROUTER_SKILL.replace('__QUERY_BIN__', queryBin).replace('__CORPUS_DIR__', corpusDir))
    ctx.logger.info(`dsh-awesome-skills: installed skill-router into ${dir}`)
  } catch (error) {
    ctx.logger.warn(
      `dsh-awesome-skills: could not install skill-router skill: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}
