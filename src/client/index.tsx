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
import { SkillExplorer } from './SkillExplorer.tsx'
import { SkillPickDetails } from './SkillPickDetails.tsx'
import { en, zh } from './locales.ts'

/** Dictionary namespace owned by this plugin. */
const NS = 'dsh-awesome-skills'

/** Required browser services (cordis fiber inject). */
export const inject = ['locale', 'slots', 'settingsScope'] as const

/** Sidebar order for the Skills section: after the Market section (40). */
const SECTION_ORDER = 45

/**
 * Shadows the shipped details renderer: single-slot cells elect the lowest
 * priority, and ui-tool occupies the default (0) cell, so this registration
 * wins without clashing at that priority.
 */
const DETAILS_PRIORITY = -1

/**
 * Mount the plugin's browser surfaces.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'dsh-awesome-skills: dictionaries')

  const t = ctx.locale.bind(NS)

  // Chat details panel: a rich card for skill picks, a generic fallback for
  // every other tool. Session-scoped slot, so it rides the chat session's
  // locale seat rather than a per-render injection of our own.
  ctx.slots.inject('conversation.details.tool', () =>
    ctx.slots.register(
      {
        name: 'conversation.details.tool',
        id: 'dsh-awesome-skills-skill-pick',
        priority: DETAILS_PRIORITY,
        locale: NS,
        inject: () => ({ t }),
      },
      (owner) => {
        const o = (owner ?? {}) as { block?: unknown; cwd?: unknown }
        return <SkillPickDetails block={o.block} cwd={o.cwd} t={t} />
      },
    ))

  // The Skills section stands on its own: it needs only the locale, not the
  // settingsScope, so it registers even where the plugin-configuration card
  // cannot.
  ctx.inject(['slots'], (scoped) => {
    const slotsCtx = scoped as unknown as {
      slots: {
        inject(name: string, register: () => () => void): void
        register(entry: Record<string, unknown>, render: (owner: unknown) => unknown): (() => void) | void
      }
    }
    const t = ctx.locale.bind(NS)
    slotsCtx.slots.inject('settings.section', () =>
      slotsCtx.slots.register(
        {
          name: 'settings.section',
          id: 'skills',
          order: SECTION_ORDER,
          label: () => t('sectionTitle'),
          locale: NS,
          inject: () => ({ t }),
        },
        () => <SkillExplorer t={t} />,
      ))
  })

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
