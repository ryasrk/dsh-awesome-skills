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

import type { Context } from '@deepseek-ai/cordis'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { registerSearchService, type SkillsSearch } from './search.js'

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
description: Search a 16k-skill local corpus and load the matching workflow before doing the task yourself. Use for essentially any concrete implementation request - building, fixing, configuring, deploying, testing, or reviewing anything - so the work follows a vetted playbook instead of improvised steps.
disable-model-invocation: false
user-invocable: true
---

# Skill router

You have access to a local corpus of **~16,000 specialized skills** that is NOT in
your catalog. It is vector-indexed and searchable. Before doing real work, search
it - a vetted playbook almost always beats improvising from general knowledge.

## When to search (default: yes)

Search for any concrete task: building a feature, fixing a bug, configuring or
deploying a service, writing tests, reviewing code, refactoring, setting up
infra, integrating an API or library, optimizing performance, or working with a
framework, database, cloud provider, or language ecosystem.

Skip it only for trivial or purely conversational turns (acknowledgements,
clarifying questions, "thanks", greetings), or when you are already following a
skill you loaded this turn.

Do not wait for a crisis. If the task has a noun and a verb, search.

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

export function apply(ctx: Context, config?: Config): void {
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

  if (config?.installSkillRouter === false || !home) return

  try {
    const dir = join(home, '.agents', 'skills', 'skill-router')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const file = join(dir, 'SKILL.md')
    // Never overwrite: a hand-tuned router must survive plugin reinstalls.
    if (existsSync(file)) return
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
