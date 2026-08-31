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
// Vendored schemastery (see vendor/): the harness vendors it too and does not
// publish it to npm, so a real dependency would break the zero-config install.
// Loaded through createRequire because it ships a CJS bundle.
import { createRequire } from 'node:module';
const z = createRequire(import.meta.url)('../vendor/schemastery/index.cjs');
import { settingsNamespace } from './namespace.js';
/** Settings namespace owned by this plugin. Lowercase kebab-case. */
export const SETTINGS_NAMESPACE = settingsNamespace('dsh-awesome-skills');
/** Schema the settings service renders and resolves through. */
export const PluginSettingsSchema = z
    .object({
    semantic: z.boolean().default(true),
    boosted: z.array(z.string()).default([]),
    muted: z.array(z.string()).default([]),
    // schemastery has no z.enum; union of const literals is its enum idiom.
    pinMode: z.union([z.const('pin'), z.const('boost')]).default('pin'),
    defaultK: z.number().min(1).max(25).step(1).default(5),
    pool: z.number().min(50).max(3000).step(50).default(1200),
    wLex: z.number().min(0).max(1).default(0.55),
    wGram: z.number().min(0).max(1).default(0.5),
    autoRoute: z.boolean().default(true),
});
/**
 * Composition-layer defaults, identical to the schema defaults, so a user
 * layer can clear a field and the composition still answers.
 */
export const PLUGIN_SETTINGS_BASE = {
    semantic: true,
    boosted: [],
    muted: [],
    pinMode: 'pin',
    defaultK: 5,
    pool: 1200,
    wLex: 0.55,
    wGram: 0.5,
    autoRoute: true,
};
//# sourceMappingURL=settings-schema.js.map