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
import { PluginSettingsSchema, PLUGIN_SETTINGS_BASE, SETTINGS_NAMESPACE } from './settings-schema.js';
/**
 * Register the namespace and keep the search service in step with saved
 * changes. Applies live: a saved field reaches the next query without a
 * restart.
 * @param ctx - the plugin context owning the wiring.
 * @param search - the service whose knobs follow the saved section.
 */
export function installSettingsSection(ctx, search) {
    const inject = ctx.inject;
    inject?.(['settings'], (scoped) => {
        const sctx = scoped;
        const scope = sctx.settings.register(SETTINGS_NAMESPACE, PluginSettingsSchema, {
            base: PLUGIN_SETTINGS_BASE,
        });
        const apply = () => {
            const value = scope.get();
            search.setKnobs({
                semantic: value.semantic,
                defaultK: value.defaultK,
                pool: value.pool,
                wLex: value.wLex,
                wGram: value.wGram,
            });
            ctx.logger.info(`dsh-awesome-skills: settings applied (semantic=${value.semantic} k=${value.defaultK} pool=${value.pool})`);
        };
        // Unload falls back to the composition entry, so a disabled section
        // cannot leave the service reading values nobody can see or change.
        const effect = scoped.effect;
        effect?.(() => () => apply(), 'dsh-awesome-skills: settings fallback');
        apply();
        scope.watch(apply);
    });
}
//# sourceMappingURL=settings-wiring.js.map