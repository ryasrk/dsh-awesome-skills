/**
 * The plugin's own settings namespace: the fields users may own from the
 * plugin-configuration card instead of hand-editing `cordis.yml`.
 *
 * Every field maps onto a value `SkillIndex` already reads. `semantic`,
 * `defaultK`, `pool`, `wLex`, and `wGram` take effect live; `autoRoute`
 * regenerates the installed router skill on save.
 *
 * The namespace is the pairing key for the browser card: the Host registers
 * this section, the client registers a card keyed to the same string, and the
 * configurable-plugins tab pairs the two without learning what either means.
 */

// Vendored schemastery (see vendor/): the harness vendors it too and does not
// publish it to npm, so a real dependency would break the zero-config install.
// Loaded through createRequire because it ships a CJS bundle.
import { createRequire } from 'node:module'

/** Minimal schemastery surface this schema uses. */
interface ZodField {
  default(value: unknown): ZodField
  min(n: number): ZodField
  max(n: number): ZodField
  step(n: number): ZodField
}
interface Zod {
  object(shape: Record<string, ZodField>): ZodField
  boolean(): ZodField
  number(): ZodField
  string(): ZodField
}
const z = createRequire(import.meta.url)('../vendor/schemastery/index.cjs') as unknown as Zod

import { settingsNamespace } from './namespace.js'

/** Settings namespace owned by this plugin. Lowercase kebab-case. */
export const SETTINGS_NAMESPACE = settingsNamespace('dsh-awesome-skills')

/** The fields a user may edit from the plugin-configuration card. */
export interface PluginSettings {
  /** Score with the semantic lane (requires the vendored wasm runtime). */
  semantic: boolean
  /** Results returned per search, clamped to 1..25. */
  defaultK: number
  /** Candidate pool fed to the reranker before ranking. */
  pool: number
  /** Weight of the lexical lane: score = (1-wLex)*vector + wLex*lex + wGram*gram. */
  wLex: number
  /** Weight of the char-3-gram lane. */
  wGram: number
  /** Rewrite the installed router skill whenever these values change. */
  autoRoute: boolean
}

/** Schema the settings service renders and resolves through. */
export const PluginSettingsSchema: ZodField = z
  .object({
    semantic: z.boolean().default(true),
    defaultK: z.number().min(1).max(25).step(1).default(5),
    pool: z.number().min(50).max(3000).step(50).default(1200),
    wLex: z.number().min(0).max(1).default(0.55),
    wGram: z.number().min(0).max(1).default(0.5),
    autoRoute: z.boolean().default(true),
  })
  

/**
 * Composition-layer defaults, identical to the schema defaults, so a user
 * layer can clear a field and the composition still answers.
 */
export const PLUGIN_SETTINGS_BASE: PluginSettings = {
  semantic: true,
  defaultK: 5,
  pool: 1200,
  wLex: 0.55,
  wGram: 0.5,
  autoRoute: true,
}
