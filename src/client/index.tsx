/**
 * Browser half of dsh-awesome-skills: registers the settings card keyed to
 * the plugin's namespace, so the configurable-plugins tab pairs it with the
 * Host section without learning what either means.
 *
 * Everything here degrades quietly on a host without a settingsScope: the
 * inject callback never runs, and no card appears — the composed settings
 * still apply, only the UI is absent.
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { SettingsCard } from './SettingsCard.tsx'
import { en, zh } from './locales.ts'

/** Dictionary namespace owned by this plugin. */
const NS = 'dsh-awesome-skills'

/** Required browser services (cordis fiber inject). */
export const inject = ['locale', 'slots', 'settingsScope'] as const

/**
 * Mount the plugin's browser surfaces.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'dsh-awesome-skills: dictionaries')

  ctx.inject(['settingsScope'], (scoped) => {
    const scopeCtx = scoped as unknown as {
      settingsScope: { bind(spec: { namespace: string }): unknown }
      slots: {
        inject(name: string, register: () => () => void): void
        register(entry: Record<string, unknown>, render: (owner: unknown) => unknown): (() => void) | void
      }
    }
    const scope = scopeCtx.settingsScope.bind({ namespace: NS }) as never

    scopeCtx.slots.inject('settings.plugin.item', () =>
      scopeCtx.slots.register(
        {
          name: 'settings.plugin.item',
          key: NS,
          locale: NS,
          inject: () => ({}),
        },
        () => <SettingsCard scope={scope} />,
      ))
  })
}
