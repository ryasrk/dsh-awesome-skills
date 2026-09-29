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
import type { PluginSettings } from './settings-schema.js';
/** Minimal Typert registration surface, structurally typed (see cordis-types). */
interface TypertService {
    register(contribution: unknown): unknown;
}
/** Minimal slice of the settings service this row uses. */
interface SettingsService {
    configure(presentation: {
        auto?: boolean;
    }, owner: unknown): () => void;
    describe(options?: {
        redactSecrets?: boolean;
    }): readonly {
        ns: string;
        value: unknown;
        revision: number;
    }[];
    mutate(ns: string, ops: readonly unknown[], expectedRevision?: number): Promise<void>;
}
/**
 * The plugin's knob back-end, keyed by the search service it drives.
 *
 * Constructed by `apply` rather than exported as a plugin: this row owns no
 * catalog or tools, and the Typert Remote base class is what the gateway
 * discovers.
 */
export declare class SkillsSettingsRemote {
    private readonly ctx;
    private readonly read;
    private readonly write;
    /** The Cordis service key the gateway routes this row under. */
    static readonly serviceKey = "skillsSettings";
    /**
     * @param ctx - the owning context.
     * @param read - current knob values.
     * @param write - apply changed knobs to the live search service.
     */
    constructor(ctx: {
        typert: TypertService;
        settings: SettingsService;
        fiber: unknown;
        inject(deps: readonly string[], cb: (scoped: Record<string, unknown>) => void): void;
        logger: {
            info(message: string): void;
            warn(message: string): void;
        };
    }, read: () => PluginSettings, write: (next: Partial<PluginSettings>) => void);
    /** The current knobs plus the revision a writer must echo back. */
    getState(): Promise<{
        knobs: PluginSettings;
        revision: number;
    }>;
    /**
     * Replace the knobs, rejecting the write if the stored revision moved.
     *
     * Unknown fields are ignored rather than stored, so a stale client cannot
     * introduce one.
     */
    setKnobs(knobs: PluginSettings, expectedRevision: number): Promise<{
        knobs: PluginSettings;
        revision: number;
    }>;
    /** The current revision of this plugin's settings entry. */
    private revision;
}
/** Read the entry's knobs, or `undefined` when the entry is not mounted. */
export declare function readStoredKnobs(settings: {
    describe(options?: {
        redactSecrets?: boolean;
    }): readonly {
        ns: string;
        value: unknown;
    }[];
}): PluginSettings | undefined;
export {};
//# sourceMappingURL=remote.d.ts.map