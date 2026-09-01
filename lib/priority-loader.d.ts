/**
 * Priority-skill auto-load: injects the corpus SKILL.md bodies of the
 * priority list into every model turn, so "must be loaded from the start"
 * is literal rather than a suggestion the model may ignore.
 *
 * Injection rides the host's `agent/pre-step` hook (the same seam
 * compaction-basic and the Claude/Codex hook adapters use), folding its
 * messages onto the downstream decision the way hooks-codex does — DELEGATE,
 * never veto: a failed load must not block the turn.
 *
 * A per-agent visibility check decides when to inject, mirroring how the
 * harness's own skill catalog avoids both duplication and disappearance: the
 * payload is re-injected when its content changed OR when the earlier copy
 * has scrolled out of the session's visible surface. Injecting every turn
 * unconditionally would duplicate; keying on content alone would let the
 * instructions fall out of a sliding window and silently stop applying.
 */
/** The downstream decision a pre-step listener either returns or delegates to. */
export type PreStepDecision = {
    kind: 'reject';
} | {
    kind: 'enter';
    messages: Array<{
        content: unknown;
        id?: string;
    }>;
};
/**
 * Structural pre-step contract this module needs (no harness imports).
 * The hook is a Cordis waterfall: each listener is `(payload, next)`, where
 * `next` is a separate second argument, not a method on the payload. `agent` is
 * what the payload carries; its session surface and event log are how the
 * visibility check mirrors the harness's own catalog history logic.
 */
/** The knob subset the loader reads. */
export interface PriorityKnobs {
    prio: string[];
}
/** One injected message as the pre-step decision expects. */
export interface InjectedMessage {
    content: ReadonlyArray<{
        type: 'text';
        text: string;
    }>;
    /** Durable source marker carrying the payload digest for visibility checks. */
    source?: {
        kind: 'priority-skills';
        digest: string;
    };
}
/**
 * Install the auto-load hook.
 * @param ctx - Plugin context that may expose `on('agent/pre-step')`.
 * @param corpusDir - Directory holding `<path>/SKILL.md`.
 * @param getKnobs - Reads the live priority list (the settings layer owns it).
 * @param log - Logger for warnings; injection itself is silent.
 * @returns A disposer removing the hook, or undefined when the host lacks it.
 */
export declare function installPriorityLoader(ctx: {
    on?: unknown;
    logger?: {
        warn(message: string): void;
    };
}, corpusDir: string, getKnobs: () => PriorityKnobs, log: {
    warn(message: string): void;
}): (() => void) | undefined;
//# sourceMappingURL=priority-loader.d.ts.map