/**
 * The awesome-skills wire contract, shared by both halves.
 *
 * The Host declares these schemas to validate what leaves the service; the
 * client declares the same ones to validate what arrives. Both derive from one
 * definition, so a field added here cannot be validated on one side and
 * silently dropped on the other.
 *
 * This module is imported by the Node half and the browser half. It must stay
 * free of `node:` imports and of any Host-only service for that reason, and it
 * must stay free of `@deepseek-ai/cordis` types — cordis is vendored inside the
 * harness and not published to npm, so depending on it would make this package
 * uninstallable.
 *
 * @module dsh-awesome-skills/contract
 */
import type { PluginSettings } from './settings-schema.js';
/** Package name, stamped into every invocation id. */
export declare const PACKAGE = "dsh-awesome-skills";
/** The service name, which is also its Remote namespace. */
export declare const SERVICE = "skillsSettings";
/**
 * The profile entry id this plugin's settings form claims.
 *
 * It is an entry id rather than a settings namespace: 0.2.0 removed
 * `settings.register`, so a form is the projection of one profile entry's
 * volatile Config fields and the entry id is its only address.
 */
export declare const SETTINGS_NAMESPACE = "dsh-awesome-skills";
/** The codec for the complete knob set. */
export declare const knobsCodec: {
    readonly mode: "strict";
    readonly typeSymbol: string;
    readonly create: () => {
        parse(value: unknown): PluginSettings;
    };
};
/** The codec for a revision number. */
export declare const revisionCodec: {
    readonly mode: "strict";
    readonly typeSymbol: string;
    readonly create: () => {
        parse(value: unknown): number;
    };
};
/** The codec for the full settings payload. */
export declare const stateCodec: {
    readonly mode: "strict";
    readonly typeSymbol: string;
    readonly create: () => {
        parse(value: unknown): {
            knobs: PluginSettings;
            revision: number;
        };
    };
};
/**
 * The invocation descriptors, defined once for both halves.
 *
 * The Host registers them so the gateway can route calls; the client mounts
 * them so the `remote.skillsSettings` namespace exists. Identical ids on both
 * sides are what pair them, so a typo here fails as an unroutable call rather
 * than as silently mismatched methods.
 */
export declare const INVOCATIONS: {
    id: string;
    service: string;
    namespace: string;
    method: string;
    invocation: {
        kind: "direct";
    };
    parameters: ({
        name: string;
        wire: string;
        source: "json";
        codec: {
            readonly mode: "strict";
            readonly typeSymbol: string;
            readonly create: () => {
                parse(value: unknown): PluginSettings;
            };
        };
    } | {
        name: string;
        wire: string;
        source: "json";
        codec: {
            readonly mode: "strict";
            readonly typeSymbol: string;
            readonly create: () => {
                parse(value: unknown): number;
            };
        };
    })[];
    result: {
        readonly mode: "strict";
        readonly typeSymbol: string;
        readonly create: () => {
            parse(value: unknown): {
                knobs: PluginSettings;
                revision: number;
            };
        };
    };
}[];
//# sourceMappingURL=contract.d.ts.map