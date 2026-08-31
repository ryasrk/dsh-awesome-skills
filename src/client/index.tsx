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
import { SkillSection } from './SkillSection.tsx'
import { SkillPickDetails } from './SkillPickDetails.tsx'
import { en, zh } from './locales.ts'

/** Dictionary namespace owned by this plugin. */
const NS = 'dsh-awesome-skills'

/** Required browser services (cordis fiber inject). */
export const inject = ['locale', 'slots', 'settingsScope'] as const

/** Sidebar order for the Skills section: after the Market section (40). */
const SECTION_ORDER = 45

/**
 * Shadows the shipped details renderer: a single-slot cell renders its
 * lowest live priority (ui-slots register doc, index.ts:716-722, and the
 * ascending sort at 860-866 feeding entriesOfSlot 934-947), and ui-tool
 * occupies the default cell (0), so -1 both avoids the same-priority
 * load-time throw and wins the election.
 */
const DETAILS_PRIORITY = -1

/** Shape of the priority route's response. */
interface PriorityResponse {
  ok: boolean
  boosted?: string[]
  muted?: string[]
  error?: string
}

/**
 * Mount the plugin's browser surfaces.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'dsh-awesome-skills: dictionaries')

  // Chat details panel: a rich card for skill picks, a generic fallback for
  // every other tool. Declaring the locale namespace puts the framework `t`
  // seat on the component props (ui-renderer scoped-slots.tsx:432-441), the
  // same wiring ToolDetails uses.
  ctx.slots.inject('conversation.details.tool', () =>
    ctx.slots.register(
      { name: 'conversation.details.tool', priority: DETAILS_PRIORITY, locale: NS },
      SkillPickDetails,
    ))

  // The Skills section owns both surfaces: the explorer (frequent action)
  // and the configuration card (occasional), composed as one column. It
  // needs settingsScope for the card; without it the card cannot bind, so
  // the section degrades to explorer-only rather than failing the mount.
  ctx.inject(['slots', 'settingsScope'], (scoped) => {
    const slotsCtx = scoped as unknown as {
      settingsScope: { bind(spec: { namespace: string }): unknown }
      slots: {
        inject(name: string, register: () => () => void): void
        register(entry: Record<string, unknown>, render: (owner: unknown) => unknown): (() => void) | void
      }
    }
    const t = ctx.locale.bind(NS)
    const scope = slotsCtx.settingsScope.bind({ namespace: NS }) as never
    slotsCtx.slots.inject('settings.section', () =>
      slotsCtx.slots.register(
        {
          name: 'settings.section',
          id: 'skills',
          order: SECTION_ORDER,
          label: () => t('sectionTitle'),
          locale: NS,
          inject: () => ({ t, scope }),
        },
        () => (
          <SkillSection
            t={t}
            scope={scope}
            labels={{
              section: t('sectionTitle'),
              search: t('tabSearch'),
              priority: t('tabPriority'),
              config: t('tabConfig'),
            }}
            explorer={{ t: t as never }}

            priority={{ }}
          />
        ),
      ))
  })
}
