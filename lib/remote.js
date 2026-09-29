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
import { INVOCATIONS, PACKAGE, SERVICE, SETTINGS_NAMESPACE } from './contract.js';
/**
 * The Typert contribution.
 *
 * The invocation descriptors come from the shared contract module rather than
 * being written here, so the ids the gateway routes and the ids the client
 * mounts cannot drift apart.
 */
const TYPERT = {
    package: PACKAGE,
    face: 'host',
    schemas: [],
    model: { services: [], events: [], objects: [] },
    invocations: INVOCATIONS,
};
/** Live knob values, or `undefined` when the entry is not mounted. */
function storedKnobs(settings) {
    const descriptor = settings.describe({ redactSecrets: true })
        .find(candidate => candidate.ns === SETTINGS_NAMESPACE);
    return descriptor?.value;
}
/**
 * The plugin's knob back-end, keyed by the search service it drives.
 *
 * Constructed by `apply` rather than exported as a plugin: this row owns no
 * catalog or tools, and the Typert Remote base class is what the gateway
 * discovers.
 */
export class SkillsSettingsRemote {
    ctx;
    read;
    write;
    /** The Cordis service key the gateway routes this row under. */
    static serviceKey = SERVICE;
    /**
     * @param ctx - the owning context.
     * @param read - current knob values.
     * @param write - apply changed knobs to the live search service.
     */
    constructor(ctx, read, write) {
        this.ctx = ctx;
        this.read = read;
        this.write = write;
        const typert = ctx.typert;
        if (typert !== undefined)
            typert.register(TYPERT);
        // This row ships its own settings page, so the generic schema-generated
        // form must stay off: both would claim the same entry. `inject` keeps the
        // plugin running when Settings is absent or mounts later.
        ctx.inject(['settings'], (scoped) => {
            const child = scoped;
            const claim = () => child.settings.configure({ auto: false }, ctx.fiber);
            if (typeof child.effect === 'function')
                child.effect(() => claim(), 'dsh-awesome-skills: settings policy');
            else
                claim();
        });
    }
    /** The current knobs plus the revision a writer must echo back. */
    async getState() {
        return { knobs: this.read(), revision: this.revision() };
    }
    /**
     * Replace the knobs, rejecting the write if the stored revision moved.
     *
     * Unknown fields are ignored rather than stored, so a stale client cannot
     * introduce one.
     */
    async setKnobs(knobs, expectedRevision) {
        await this.ctx.settings.mutate(SETTINGS_NAMESPACE, [{ op: 'set', path: ['knobs'], value: knobs }], expectedRevision);
        this.write(knobs);
        return await this.getState();
    }
    /** The current revision of this plugin's settings entry. */
    revision() {
        try {
            const descriptor = this.ctx.settings
                .describe({ redactSecrets: true })
                .find(candidate => candidate.ns === SETTINGS_NAMESPACE);
            return descriptor?.revision ?? 0;
        }
        catch {
            return 0;
        }
    }
}
/** Read the entry's knobs, or `undefined` when the entry is not mounted. */
export function readStoredKnobs(settings) {
    return storedKnobs(settings);
}
//# sourceMappingURL=remote.js.map