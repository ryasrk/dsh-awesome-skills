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
import type { PluginContext } from './cordis-types.js';
export declare const name = "dsh-awesome-skills";
/** `cordis.yml` configuration. Every field is optional. */
export interface Config {
    /** Absolute corpus directory. Defaults to the bundled `skills/`. */
    corpusDir?: string;
    /** Home directory of the running user, for installing the router skill. */
    home?: string;
    /** Install the bundled skill-router skill into `<home>/.agents/skills`. */
    installSkillRouter?: boolean;
}
export declare function apply(ctx: PluginContext, config?: Config): void;
//# sourceMappingURL=index.d.ts.map