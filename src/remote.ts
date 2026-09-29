/**
 * Remote half: the Host service the Skills settings page reads and writes.
 *
 * The client cannot read Host state directly. It calls a Remote service, and
 * the api-gateway routes that call by looking the service up in the ROOT
 * service table. That is why `cordis.patch.yml` registers this as its own
 * top-level row rather than nesting it inside the main plugin: a Remote
 * registration inside another plugin's scope is invisible to the gateway, and
 * the settings page then reports a service it cannot reach.
 *
 * The knobs live in this entry's volatile Config rather than in a settings
 * namespace, so the choice persists across restarts, is revisioned for
 * conflict detection, and can be edited by hand in `cordis.yml`.
 *
 * @module dsh-awesome-skills/remote
 */

import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { Context } from '@deepseek-ai/cordis'
// Type-only: pulls the `ctx.settings` and `ctx.typert` augmentations.
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-typert-registry'
import type { TypertContribution } from '@deepseek-ai/dsh-typert-registry'
import { INVOCATIONS, PACKAGE, SERVICE, SETTINGS_NAMESPACE } from './contract.js'
import { PLUGIN_SETTINGS_BASE, type PluginSettings } from './settings-schema.js'

/**
 * The Typert contribution.
 *
 * The invocation descriptors come from the shared contract module rather than
 * being written here, so the ids the gateway routes and the ids the client
 * mounts cannot drift apart.
 */
const TYPERT: TypertContribution = {
  package: PACKAGE,
  face: 'host',
  schemas: [],
  model: { services: [], events: [], objects: [] },
  invocations: INVOCATIONS,
}

/**
 * The knobs this row reports and writes.
 *
 * Supplied by `apply` rather than read from a module-level singleton: the
 * Remote row and the plugin row are separate Cordis entries with no shared
 * handle, and a mismatch here would show the user one set of values while
 * search ran on another.
 */
export interface KnobBridge {
  /** Current knob values, with schema defaults already applied. */
  read(): PluginSettings
  /** Push changed knobs into the live search service. */
  write(next: Partial<PluginSettings>): void
}

/** Module-level bridge, set by `apply` before this row is mounted. */
let bridge: KnobBridge | undefined

/**
 * Hand the Remote row its knob back-end.
 *
 * Called by the plugin row's `apply`; the Remote row is mounted first as its
 * own top-level entry, so the bridge must be installed before this row starts
 * answering calls. A missing bridge degrades to schema defaults rather than
 * throwing: an unreadable panel is worse than one showing the defaults.
 *
 * @param next - the knob reader and writer.
 */
export function setKnobBridge(next: KnobBridge): void {
  bridge = next
}

/**
 * The entry's stored knobs, read through `describe`.
 *
 * Same source the generic form uses, so this row and any hand edit of
 * `cordis.yml` cannot disagree.
 *
 * @param settings - the Host settings service.
 * @returns the stored knobs, or `undefined` when the entry is absent.
 */
function storedKnobs(settings: {
  describe(options?: { redactSecrets?: boolean }): readonly { ns: string; value: unknown }[]
}): PluginSettings | undefined {
  const descriptor = settings.describe({ redactSecrets: true })
    .find(candidate => candidate.ns === SETTINGS_NAMESPACE)
  return descriptor?.value as PluginSettings | undefined
}

export default class SkillsSettingsRemote extends TypertRemoteService {
  static inject = ['settings', 'typert']

  constructor(ctx: Context) {
    super(ctx, SERVICE)
    ctx.typert.register(TYPERT)
  }

  /** The current knobs plus the revision a writer must echo back. */
  @Remote
  async getState(): Promise<{ knobs: PluginSettings; revision: number }> {
    return { knobs: this.knobs(), revision: this.revision() }
  }

  /**
   * Replace the knobs, rejecting the write if the stored revision moved.
   *
   * @param knobs - the complete next knob set.
   * @param expectedRevision - the revision the client read.
   * @returns the committed state.
   */
  @Remote
  async setKnobs(
    knobs: PluginSettings,
    expectedRevision: number,
  ): Promise<{ knobs: PluginSettings; revision: number }> {
    await this.ctx.settings.mutate(
      SETTINGS_NAMESPACE,
      [{ op: 'set', path: ['knobs'], value: knobs }],
      expectedRevision,
    )
    // Apply locally too: the entry's volatile reference updates on the profile
    // write, but the search service is owned by the other row, which has no
    // handle on this one.
    bridge?.write(knobs)
    return await this.getState()
  }

  /** The live knobs: the bridge's values, or schema defaults without one. */
  private knobs(): PluginSettings {
    const live = bridge?.read()
    if (live !== undefined) return live
    const stored = storedKnobs(this.ctx.settings)
    return { ...PLUGIN_SETTINGS_BASE, ...(stored ?? {}) }
  }

  /** The current revision of this plugin's settings entry. */
  private revision(): number {
    const descriptor = this.ctx.settings
      .describe({ redactSecrets: true })
      .find((candidate: { ns: string }) => candidate.ns === SETTINGS_NAMESPACE)
    // The entry is absent until it mounts with a volatile field; revision 0 is
    // correct for that state, and a read must not fail over it.
    return descriptor?.revision ?? 0
  }
}
