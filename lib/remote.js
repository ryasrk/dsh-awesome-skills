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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { INVOCATIONS, PACKAGE, SERVICE, SETTINGS_NAMESPACE } from './contract.js';
import { PLUGIN_SETTINGS_BASE } from './settings-schema.js';
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
/** Module-level bridge, set by `apply` before this row is mounted. */
let bridge;
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
export function setKnobBridge(next) {
    bridge = next;
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
function storedKnobs(settings) {
    const descriptor = settings.describe({ redactSecrets: true })
        .find(candidate => candidate.ns === SETTINGS_NAMESPACE);
    return descriptor?.value;
}
let SkillsSettingsRemote = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _getState_decorators;
    let _setKnobs_decorators;
    return class SkillsSettingsRemote extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _getState_decorators = [Remote];
            _setKnobs_decorators = [Remote];
            __esDecorate(this, null, _getState_decorators, { kind: "method", name: "getState", static: false, private: false, access: { has: obj => "getState" in obj, get: obj => obj.getState }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setKnobs_decorators, { kind: "method", name: "setKnobs", static: false, private: false, access: { has: obj => "setKnobs" in obj, get: obj => obj.setKnobs }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static inject = ['settings', 'typert'];
        constructor(ctx) {
            super(ctx, SERVICE);
            __runInitializers(this, _instanceExtraInitializers);
            ctx.typert.register(TYPERT);
        }
        /** The current knobs plus the revision a writer must echo back. */
        async getState() {
            return { knobs: this.knobs(), revision: this.revision() };
        }
        /**
         * Replace the knobs, rejecting the write if the stored revision moved.
         *
         * @param knobs - the complete next knob set.
         * @param expectedRevision - the revision the client read.
         * @returns the committed state.
         */
        async setKnobs(knobs, expectedRevision) {
            await this.ctx.settings.mutate(SETTINGS_NAMESPACE, [{ op: 'set', path: ['knobs'], value: knobs }], expectedRevision);
            // Apply locally too: the entry's volatile reference updates on the profile
            // write, but the search service is owned by the other row, which has no
            // handle on this one.
            bridge?.write(knobs);
            return await this.getState();
        }
        /** The live knobs: the bridge's values, or schema defaults without one. */
        knobs() {
            const live = bridge?.read();
            if (live !== undefined)
                return live;
            const stored = storedKnobs(this.ctx.settings);
            return { ...PLUGIN_SETTINGS_BASE, ...(stored ?? {}) };
        }
        /** The current revision of this plugin's settings entry. */
        revision() {
            const descriptor = this.ctx.settings
                .describe({ redactSecrets: true })
                .find((candidate) => candidate.ns === SETTINGS_NAMESPACE);
            // The entry is absent until it mounts with a volatile field; revision 0 is
            // correct for that state, and a read must not fail over it.
            return descriptor?.revision ?? 0;
        }
    };
})();
export default SkillsSettingsRemote;
//# sourceMappingURL=remote.js.map