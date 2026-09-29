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
import { PLUGIN_SETTINGS_BASE, SETTINGS_NAMESPACE } from './settings-schema.js';
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
export function installSettingsSection(ctx, search) {
    const inject = ctx.inject;
    inject?.(['settings'], (scoped) => {
        const sctx = scoped;
        const apply = () => {
            const descriptor = sctx.settings
                .describe({ redactSecrets: true })
                .find(candidate => candidate.ns === SETTINGS_NAMESPACE);
            const value = { ...PLUGIN_SETTINGS_BASE, ...descriptor?.value };
            search.setKnobs({
                semantic: value.semantic,
                defaultK: value.defaultK,
                pool: value.pool,
                wLex: value.wLex,
                wGram: value.wGram,
                prio: value.prio ?? [],
                blacklist: value.blacklist ?? [],
                whitelist: value.whitelist ?? [],
                whitelistOnly: value.whitelistOnly ?? false,
            });
            ctx.logger.info(`dsh-awesome-skills: settings applied (semantic=${value.semantic} k=${value.defaultK} pool=${value.pool})`);
        };
        apply();
    });
}
//# sourceMappingURL=settings-wiring.js.map