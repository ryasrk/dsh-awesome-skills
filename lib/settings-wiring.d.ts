/**
 * Host-side settings wiring for the plugin's own namespace.
 *
 * The shape mirrors `installSettingsSection` from @deepseek-ai/dsh-settings,
 * inlined deliberately: that package is not published to npm (like cordis and
 * schemastery, both vendored), and dsh-market's own notes record how a named
 * import from an unpublished package became a hard SyntaxError that stopped
 * the host booting. An `inject` degrades quietly; a missing named export
 * kills the process.
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
 * Register the namespace and keep the search service in step with saved
 * changes. Applies live: a saved field reaches the next query without a
 * restart.
 * @param ctx - the plugin context owning the wiring.
 * @param search - the service whose knobs follow the saved section.
 */
export declare function installSettingsSection(ctx: PluginContext, search: SkillsSearch): void;
//# sourceMappingURL=settings-wiring.d.ts.map