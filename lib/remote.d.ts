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
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { Context } from '@deepseek-ai/cordis';
import { type PluginSettings } from './settings-schema.js';
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
    read(): PluginSettings;
    /** Push changed knobs into the live search service. */
    write(next: Partial<PluginSettings>): void;
}
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
export declare function setKnobBridge(next: KnobBridge): void;
export default class SkillsSettingsRemote extends TypertRemoteService {
    static inject: string[];
    constructor(ctx: Context);
    /** The current knobs plus the revision a writer must echo back. */
    getState(): Promise<{
        knobs: PluginSettings;
        revision: number;
    }>;
    /**
     * Replace the knobs, rejecting the write if the stored revision moved.
     *
     * @param knobs - the complete next knob set.
     * @param expectedRevision - the revision the client read.
     * @returns the committed state.
     */
    setKnobs(knobs: PluginSettings, expectedRevision: number): Promise<{
        knobs: PluginSettings;
        revision: number;
    }>;
    /** The live knobs: the bridge's values, or schema defaults without one. */
    private knobs;
    /** The current revision of this plugin's settings entry. */
    private revision;
}
//# sourceMappingURL=remote.d.ts.map