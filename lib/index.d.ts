/**
 * dsh-awesome-skills host entry.
 *
 * Registers the corpus as a durable host service and installs the model-facing
 * `skill-router` skill so agents can search the corpus semantically.
 *
 * The corpus is deliberately NOT a skill discovery root: ~6,000 skills in the
 * catalog cost a large per-turn token bill. Instead this plugin owns the
 * vector index and exposes two things:
 *   1. a `skills-search` service with `search()` for other plugins and tools,
 *   2. a bundled `skill-router` skill installed into the user's agents home,
 *      which is how an agent is told the search exists at all.
 */
import { type PluginSettings } from './settings-schema.js';
import type { PluginContext } from './cordis-types.js';
export declare const name = "dsh-awesome-skills";
/** `cordis.yml` configuration. Every field is optional. */
export interface Config {
    /** Absolute corpus directory. Defaults to the bundled `skills/`. */
    corpusDir?: string;
    /** Home directory of the running user, for installing the router skill. */
    home?: string;
    /**
     * Explicit agents home — the directory that holds the harness's `skills/`
     * catalog root. Overrides the default `<home>/.agents` and `$DSH_AGENTS_HOME`.
     */
    agentsHome?: string;
    /** Install the bundled skill-router skill into `<agentsHome>/skills`. */
    installSkillRouter?: boolean;
    /**
     * Live search knobs.
     *
     * Volatile so the Skills settings page can own them: the form is the
     * projection of these fields, and the Remote row reads and writes the same
     * values. 0.2.0 removed `settings.register` and the namespace it registered,
     * so these live in Config — one owner per value, the profile entry — and the
     * revision guarding concurrent writes is derived from them.
     *
     * Typed structurally rather than with cordis's `Volatile<T>`: cordis is
     * vendored inside the harness and not published to npm, so importing its
     * types would make this package uninstallable outside a Harness checkout.
     */
    knobs: {
        get(): PluginSettings;
    };
}
/**
 * The Config schema the Loader resolves.
 *
 * `knobs` is volatile so the Skills settings page owns it: the form is the
 * projection of that one field, and the Remote row reads and writes the same
 * value. The deployment fields stay ordinary — changing them remounts.
 */
export declare const Config: unknown;
export declare function apply(ctx: PluginContext, config?: Config): void;
//# sourceMappingURL=index.d.ts.map