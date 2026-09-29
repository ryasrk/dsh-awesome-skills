/**
 * Host-side settings wiring for the plugin's own entry.
 *
 * 0.2.0 removed `settings.register` and the namespace it registered. A form is
 * now the projection of one profile entry's volatile Config fields, so this
 * module no longer registers anything: it reads that entry's resolved value
 * through `describe` and pushes it into the search service.
 *
 * The shape mirrors the host's `settings` service but is inlined deliberately:
 * @deepseek-ai/dsh-settings is not published to npm (like cordis and
 * schemastery, both vendored), and dsh-market's own notes record how a named
 * import from an unpublished package became a hard SyntaxError that stopped
 * the host booting. An `inject` degrades quietly; a missing named export kills
 * the process.
 */
import type { PluginContext } from './cordis-types.js';
import type { SkillsSearch } from './search.js';
/** Live search knobs the settings layer pushes into the search service. */
export interface SearchKnobs {
    semantic: boolean;
    defaultK: number;
    pool: number;
    wLex: number;
    wGram: number;
}
/**
 * Keep the search service in step with the entry's stored knobs.
 *
 * Reads through `describe` rather than holding a scope: the value is whatever
 * the profile composition currently resolves to, so a save reaches the next
 * query without a restart and an unmounted entry cannot leave the service
 * reading values nobody can see or change.
 *
 * @param ctx - the plugin context owning the wiring.
 * @param search - the service whose knobs follow the stored section.
 */
export declare function installSettingsSection(ctx: PluginContext, search: SkillsSearch): void;
//# sourceMappingURL=settings-wiring.d.ts.map