/**
 * The plugin's own settings namespace: the fields users may own from the
 * plugin-configuration card instead of hand-editing `cordis.yml`.
 *
 * Every field maps onto a value `SkillIndex` already reads. `semantic`,
 * `defaultK`, `pool`, `wLex`, and `wGram` take effect live; `autoRoute`
 * regenerates the installed router skill on save.
 *
 * The namespace is the pairing key for the browser card: the Host registers
 * this section, the client registers a card keyed to the same string, and the
 * configurable-plugins tab pairs the two without learning what either means.
 */
/** Minimal schemastery surface this schema uses. */
interface ZodField {
    default(value: unknown): ZodField;
    min(n: number): ZodField;
    max(n: number): ZodField;
    step(n: number): ZodField;
}
/** Settings namespace owned by this plugin. Lowercase kebab-case. */
export declare const SETTINGS_NAMESPACE: string;
/** The fields a user may edit from the plugin-configuration card. */
export interface PluginSettings {
    /** Score with the semantic lane (requires the vendored wasm runtime). */
    semantic: boolean;
    /** Results returned per search, clamped to 1..25. */
    defaultK: number;
    /** Candidate pool fed to the reranker before ranking. */
    pool: number;
    /** Weight of the lexical lane: score = (1-wLex)*vector + wLex*lex + wGram*gram. */
    wLex: number;
    /** Weight of the char-3-gram lane. */
    wGram: number;
    /** Rewrite the installed router skill whenever these values change. */
    autoRoute: boolean;
}
/** Schema the settings service renders and resolves through. */
export declare const PluginSettingsSchema: ZodField;
/**
 * Composition-layer defaults, identical to the schema defaults, so a user
 * layer can clear a field and the composition still answers.
 */
export declare const PLUGIN_SETTINGS_BASE: PluginSettings;
export {};
//# sourceMappingURL=settings-schema.d.ts.map