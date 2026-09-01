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
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
/** Escape text embedded in model-facing markup (harness renderSkillContent idiom). */
function escapeText(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function escapeAttr(value) {
    return escapeText(value).replace(/"/g, '&quot;');
}
/** Strip YAML frontmatter so the injected body is instructions only. */
function stripFrontmatter(raw) {
    const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(raw);
    return m ? raw.slice(m[0].length) : raw;
}
/**
 * Render one priority skill the way the harness renders a loaded skill, plus
 * a line stating why it is present without the user asking.
 */
function renderPrioritySkill(name, content) {
    return [
        `<skill_content name="${escapeAttr(name)}">`,
        '<skill_instructions>',
        stripFrontmatter(content).trim(),
        '</skill_instructions>',
        '</skill_content>',
    ].join('\n');
}
/**
 * Install the auto-load hook.
 * @param ctx - Plugin context that may expose `on('agent/pre-step')`.
 * @param corpusDir - Directory holding `<path>/SKILL.md`.
 * @param getKnobs - Reads the live priority list (the settings layer owns it).
 * @param log - Logger for warnings; injection itself is silent.
 * @returns A disposer removing the hook, or undefined when the host lacks it.
 */
export function installPriorityLoader(ctx, corpusDir, getKnobs, log) {
    if (typeof ctx.on !== 'function') {
        log.warn('dsh-awesome-skills: agent/pre-step unavailable; priority skills will not auto-load');
        return undefined;
    }
    const on = ctx.on;
    let warnedMissing = new Set();
    /**
     * The last injection this agent saw, if any: its payload digest and whether
     * that message is still visible. Mirrors the harness catalog's history scan
     * (walk the durable event log backwards for the newest injection, then check
     * its seq against the visible surface), plus a payload digest so a *changed*
     * priority list re-injects even while the old copy is still on screen.
     */
    const lastInjection = (agent) => {
        const events = agent?.session?.events;
        const visible = agent?.session?.surface?.nodes;
        if (events === undefined || visible === undefined)
            return undefined;
        for (let index = events.length - 1; index >= 0; index -= 1) {
            const event = events[index];
            if (event === undefined)
                continue;
            if (event.type !== 'user/message')
                continue;
            const source = event.data?.source;
            if (source?.kind !== 'priority-skills')
                continue;
            return {
                digest: typeof source.digest === 'string' ? source.digest : '',
                visible: visible.has(event.seq),
            };
        }
        return undefined;
    };
    const dispose = on.call(ctx, 'agent/pre-step', async (event) => {
        const downstream = await event.next();
        if (downstream.kind === 'reject')
            return downstream;
        const prio = getKnobs().prio;
        if (prio.length === 0)
            return downstream;
        const parts = [];
        for (const path of prio) {
            const file = join(corpusDir, path, 'SKILL.md');
            if (!existsSync(file)) {
                if (!warnedMissing.has(path)) {
                    warnedMissing.add(path);
                    log.warn(`dsh-awesome-skills: priority skill not found in corpus: ${path}`);
                }
                continue;
            }
            let raw;
            try {
                raw = readFileSync(file, 'utf8');
            }
            catch (error) {
                if (!warnedMissing.has(path)) {
                    warnedMissing.add(path);
                    log.warn(`dsh-awesome-skills: priority skill unreadable (${path}): ${error instanceof Error ? error.message : String(error)}`);
                }
                continue;
            }
            parts.push(renderPrioritySkill(path, raw));
        }
        if (parts.length === 0)
            return downstream;
        const text = [
            '<system-reminder>',
            'The following priority skills are loaded at the start of every turn by the dsh-awesome-skills plugin. They are already in effect: follow them for this turn without calling the `skill` tool for them, and do not load them again.',
            '',
            ...parts,
            '</system-reminder>',
        ].join('\n');
        // Skip only when the payload is unchanged AND its earlier copy is still on
        // screen. Either a changed priority list or a scrolled-out message means
        // the model is no longer seeing what it should.
        const digest = createHash('sha1').update(text).digest('hex');
        const previous = lastInjection(event.agent);
        if (previous !== undefined && previous.digest === digest && previous.visible) {
            return downstream;
        }
        return {
            ...downstream,
            messages: [
                ...downstream.messages,
                {
                    content: [{ type: 'text', text }],
                    source: { kind: 'priority-skills', digest },
                },
            ],
        };
    });
    return typeof dispose === 'function' ? dispose : undefined;
}
//# sourceMappingURL=priority-loader.js.map