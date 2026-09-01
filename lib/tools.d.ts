/**
 * Model-facing corpus tools: `skills_search` and `skills_read`.
 *
 * These are the standard-permission-mode access path to the corpus. Both run
 * in-process with host authority — the agent never needs Bash or a Read
 * outside its workspace, which standard permission mode blocks. Registration
 * goes through the host `tools` service observed structurally (see
 * cordis-types.ts); on a host without it the router's bash fallback covers
 * the gap, so a missing seam degrades, never fails.
 *
 * `execute` never throws across the seam: every failure returns
 * `{ ok: false, error }`, including unexpected ones, so the model can correct
 * course (e.g. re-ask with a fixed path) instead of dead-ending.
 */
import type { PluginContext } from './cordis-types.js';
import type { SkillsSearch } from './search.js';
/**
 * Register both tools on the host `tools` service.
 * @param ctx - Plugin context; the `tools` service is injected structurally.
 * @param search - The live search service (its knobs apply to every query).
 * @param corpusDir - Absolute corpus root guarding `skills_read`.
 */
export declare function registerSkillsTools(ctx: PluginContext, search: SkillsSearch, corpusDir: string): void;
//# sourceMappingURL=tools.d.ts.map