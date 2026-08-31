/**
 * Settings namespace validation, matching the Host's own rule
 * (packages/settings/settings: lowercase kebab-case). Inlined rather than
 * imported: the settings package is not published to npm.
 */
const NAMESPACE_PATTERN = /^[a-z][a-z0-9-]*$/;
/** @returns the validated namespace string. */
export function settingsNamespace(value) {
    if (!NAMESPACE_PATTERN.test(value)) {
        throw new TypeError(`settings namespace "${value}" must match ${String(NAMESPACE_PATTERN)}`);
    }
    return value;
}
//# sourceMappingURL=namespace.js.map