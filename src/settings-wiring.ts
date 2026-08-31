/**
 * Host-side settings wiring for the plugin's own namespace.
 *
 * The shape mirrors `installSettingsSection` from @deepseek-ai/dsh-settings,
 * inlined deliberately: that package is not published to npm (like cordis and
 * schemastery, both vendored), and dsh-market's own notes record how a named
 * import from an unpublished package became a hard SyntaxError that stopped
 * the host booting. An `inject` degrades quietly; a missing named export
 * kills the process.
 */

import type { PluginContext } from './cordis-types.js'
import type { SkillsSearch } from './search.js'
import { PluginSettingsSchema, PLUGIN_SETTINGS_BASE, SETTINGS_NAMESPACE, type PluginSettings } from './settings-schema.js'

/** The slice of the host's settings service this module uses. */
interface SettingsScope {
  get(): PluginSettings
  watch(listener: () => void): () => void
}
interface SettingsService {
  register(ns: string, schema: unknown, options: { base: PluginSettings }): SettingsScope
}

/** Live search knobs the settings layer pushes into the search service. */
export interface SearchKnobs {
  semantic: boolean
  defaultK: number
  pool: number
  wLex: number
  wGram: number
}

/**
 * Register the namespace and keep the search service in step with saved
 * changes. Applies live: a saved field reaches the next query without a
 * restart.
 * @param ctx - the plugin context owning the wiring.
 * @param search - the service whose knobs follow the saved section.
 */
export function installSettingsSection(ctx: PluginContext, search: SkillsSearch): void {
  const inject = ctx.inject as
    | ((deps: readonly string[], cb: (scoped: Record<string, unknown>) => void) => void)
    | undefined
  inject?.(['settings'], (scoped: Record<string, unknown>) => {
    const sctx = scoped as unknown as { settings: SettingsService }
    const scope = sctx.settings.register(SETTINGS_NAMESPACE, PluginSettingsSchema, {
      base: PLUGIN_SETTINGS_BASE,
    })

    const apply = (): void => {
      const value = scope.get()
      search.setKnobs({
        semantic: value.semantic,
        defaultK: value.defaultK,
        pool: value.pool,
        wLex: value.wLex,
        wGram: value.wGram,
        boosted: value.boosted ?? [],
        muted: value.muted ?? [],
        pinMode: value.pinMode ?? 'pin',
      })
      ctx.logger.info(
        `dsh-awesome-skills: settings applied (semantic=${value.semantic} k=${value.defaultK} pool=${value.pool})`,
      )
    }

    // Unload falls back to the composition entry, so a disabled section
    // cannot leave the service reading values nobody can see or change.
    const effect = scoped.effect as
      | ((cb: () => () => void, label: string) => void)
      | undefined
    effect?.(() => () => apply(), 'dsh-awesome-skills: settings fallback')
    apply()
    scope.watch(apply)
  })
}

