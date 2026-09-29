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
/** Package name, stamped into every invocation id. */
export const PACKAGE = 'dsh-awesome-skills';
/** The service name, which is also its Remote namespace. */
export const SERVICE = 'skillsSettings';
/**
 * The profile entry id this plugin's settings form claims.
 *
 * It is an entry id rather than a settings namespace: 0.2.0 removed
 * `settings.register`, so a form is the projection of one profile entry's
 * volatile Config fields and the entry id is its only address.
 */
export const SETTINGS_NAMESPACE = 'dsh-awesome-skills';
/**
 * Wrap a value-bearing schema in the `{ parse }` shape a codec requires.
 *
 * The wire contract only needs `parse`, and this plugin's schemas are defined
 * once in `settings-schema.ts` for the Config itself. Validating at the
 * boundary with a second hand-written copy is the failure this avoids.
 */
function parser(schema) {
    return {
        parse(value) {
            const standard = schema['~standard'];
            if (standard !== undefined) {
                const result = standard.validate(value);
                if ('issues' in result) {
                    throw new TypeError(`dsh-awesome-skills codec rejected a value: ${JSON.stringify(result.issues)}`);
                }
                return result.value;
            }
            const parse = schema.parse;
            if (typeof parse !== 'function') {
                throw new TypeError('dsh-awesome-skills codec has no parser');
            }
            return parse.call(schema, value);
        },
    };
}
/**
 * One strict codec over a schema.
 *
 * The boundary schema is materialized on first use, not at module load: a
 * codec carries the *recipe* so each process realm builds the schema it
 * validates with. 0.2.0 made `create` mandatory and dropped the eager
 * `schema` field, so a codec carrying only `schema` fails registration.
 */
function codec(schema) {
    let cached;
    return {
        mode: 'strict',
        typeSymbol: 'AwesomeSkillsPayload',
        create() {
            return (cached ??= parser(schema));
        },
    };
}
/** The codec for the complete knob set. */
export const knobsCodec = codec({
    parse: (value) => value,
});
/** The codec for a revision number. */
export const revisionCodec = codec({
    parse: (value) => {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
            throw new TypeError('dsh-awesome-skills: revision must be a non-negative integer');
        }
        return value;
    },
});
/** The codec for the full settings payload. */
export const stateCodec = codec({ parse: (value) => value });
/**
 * The invocation descriptors, defined once for both halves.
 *
 * The Host registers them so the gateway can route calls; the client mounts
 * them so the `remote.skillsSettings` namespace exists. Identical ids on both
 * sides are what pair them, so a typo here fails as an unroutable call rather
 * than as silently mismatched methods.
 */
export const INVOCATIONS = [
    {
        id: `${PACKAGE}#${SERVICE}/getState`,
        service: SERVICE,
        namespace: SERVICE,
        method: 'getState',
        invocation: { kind: 'direct' },
        parameters: [],
        result: stateCodec,
    },
    {
        id: `${PACKAGE}#${SERVICE}/setKnobs`,
        service: SERVICE,
        namespace: SERVICE,
        method: 'setKnobs',
        invocation: { kind: 'direct' },
        parameters: [
            { name: 'knobs', wire: 'knobs', source: 'json', codec: knobsCodec },
            {
                name: 'expectedRevision',
                wire: 'expectedRevision',
                source: 'json',
                codec: revisionCodec,
            },
        ],
        result: stateCodec,
    },
];
//# sourceMappingURL=contract.js.map