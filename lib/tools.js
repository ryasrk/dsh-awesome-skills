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
import { statSync, readFileSync } from 'node:fs';
import { isAbsolute, join, resolve, sep, extname } from 'node:path';
/** Upper bound of one file body returned by `skills_read`. */
const MAX_READ_BYTES = 64 * 1024;
/** Result count clamp for `skills_search` (service hard cap is 25). */
const MAX_K = 20;
const DEFAULT_K = 5;
/** File extensions `skills_read` will return. */
const READABLE_EXTENSIONS = new Set([
    '.md', '.txt', '.json', '.js', '.mjs', '.ts', '.py', '.sh',
    '.html', '.css', '.yaml', '.yml', '.toml',
]);
/**
 * Resolve `subpath` under `corpusDir` and reject traversal: the resolved
 * location must remain inside the corpus. Returns the error string on
 * failure, or the absolute path on success.
 */
function resolveInsideCorpus(corpusDir, subpath) {
    const root = resolve(corpusDir);
    const target = resolve(isAbsolute(subpath) ? subpath : join(root, subpath));
    if (target !== root && !target.startsWith(root + sep)) {
        return { error: `path escapes the corpus: ${subpath}` };
    }
    return { path: target };
}
/** Validate one `skills_read` request; returns the absolute file path or an error. */
function resolveReadTarget(corpusDir, path, file) {
    if (typeof path !== 'string' || path.trim() === '')
        return { error: '`path` must be a non-empty skill path' };
    if (file !== undefined && (typeof file !== 'string' || file.trim() === '')) {
        return { error: '`file` must be a non-empty file name when present' };
    }
    const rel = file === undefined ? join(path, 'SKILL.md') : join(path, file);
    const resolved = resolveInsideCorpus(corpusDir, rel);
    if ('error' in resolved)
        return resolved;
    const ext = extname(resolved.path).toLowerCase();
    if (!READABLE_EXTENSIONS.has(ext)) {
        return { error: `extension "${ext || '(none)'}" is not readable; allowed: ${[...READABLE_EXTENSIONS].join(' ')}` };
    }
    try {
        const size = statSync(resolved.path).size;
        if (size > MAX_READ_BYTES) {
            return { error: `file is ${size} bytes; the read cap is ${MAX_READ_BYTES}` };
        }
    }
    catch (error) {
        if (error?.code === 'ENOENT') {
            return { error: `not found: ${path}${file === undefined ? '' : `/${file}`}` };
        }
        return { error: `unreadable: ${error instanceof Error ? error.message : String(error)}` };
    }
    return resolved;
}
/** Build the `skills_search` definition. */
function searchTool(search) {
    return {
        name: 'skills_search',
        description: 'Search a local, vector-indexed corpus of ~6,000 curated agent skills '
            + '(testing, frontend, backend, cloud, data, writing, security, research, media). '
            + 'Returns ranked hits with path, name, score, and a one-line description. '
            + 'Use before any concrete build/fix/test/deploy/configure/review task; follow up with skills_read on the best hit.',
        parameters: {
            type: 'object',
            additionalProperties: true,
            properties: {
                query: { type: 'string', description: 'The task goal in plain words (a goal, not a keyword list).' },
                k: { type: 'integer', description: 'How many results to return (1-20, default 5).' },
            },
            required: ['query'],
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: true,
                properties: {
                    ok: { type: 'boolean' },
                    error: { type: 'string' },
                    count: { type: 'integer' },
                    results: {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: true,
                            properties: {
                                name: { type: 'string' },
                                path: { type: 'string' },
                                score: { type: 'number' },
                                description: { type: 'string' },
                            },
                        },
                    },
                },
            },
            render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
        },
        async execute(args) {
            try {
                const { query, k } = args;
                if (typeof query !== 'string' || query.trim() === '')
                    return { ok: false, error: '`query` must be a non-empty string' };
                const limit = k === undefined ? DEFAULT_K : Math.min(MAX_K, Math.max(1, Math.floor(Number(k) || DEFAULT_K)));
                const results = await search.search(query, limit);
                return { ok: true, count: search.count(), results };
            }
            catch (error) {
                return { ok: false, error: error instanceof Error ? error.message : String(error) };
            }
        },
    };
}
/** Build the `skills_read` definition. */
function readTool(corpusDir) {
    return {
        name: 'skills_read',
        description: 'Read a skill file from the local skill corpus searched by skills_search. '
            + 'Pass the hit\'s `path` to load its SKILL.md playbook, or add `file` for a '
            + 'reference file inside that skill\'s directory (templates, examples, scripts).',
        parameters: {
            type: 'object',
            additionalProperties: true,
            properties: {
                path: { type: 'string', description: "A skill path exactly as returned by skills_search." },
                file: { type: 'string', description: 'A file inside the skill directory (defaults to SKILL.md).' },
            },
            required: ['path'],
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: true,
                properties: {
                    ok: { type: 'boolean' },
                    error: { type: 'string' },
                    path: { type: 'string' },
                    file: { type: 'string' },
                    content: { type: 'string' },
                },
            },
            render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
        },
        async execute(args) {
            try {
                const { path, file } = args;
                if (typeof path !== 'string')
                    return { ok: false, error: '`path` must be a string' };
                if (file !== undefined && typeof file !== 'string')
                    return { ok: false, error: '`file` must be a string when present' };
                const target = resolveReadTarget(corpusDir, path, file);
                if ('error' in target)
                    return { ok: false, error: target.error };
                return { ok: true, path, file: file ?? 'SKILL.md', content: readFileSync(target.path, 'utf8') };
            }
            catch (error) {
                return { ok: false, error: error instanceof Error ? error.message : String(error) };
            }
        },
    };
}
/**
 * Register both tools on the host `tools` service.
 * @param ctx - Plugin context; the `tools` service is injected structurally.
 * @param search - The live search service (its knobs apply to every query).
 * @param corpusDir - Absolute corpus root guarding `skills_read`.
 */
export function registerSkillsTools(ctx, search, corpusDir) {
    const inject = ctx.inject;
    if (typeof inject !== 'function') {
        ctx.logger.warn('dsh-awesome-skills: no inject() on context; corpus tools unavailable (router bash fallback applies)');
        return;
    }
    inject(['tools'], (scoped) => {
        const tools = scoped?.tools;
        if (typeof tools?.register !== 'function') {
            ctx.logger.warn('dsh-awesome-skills: host tools service missing or lacks register(); corpus tools unavailable');
            return;
        }
        try {
            tools.register(searchTool(search));
            tools.register(readTool(corpusDir));
            ctx.logger.info('dsh-awesome-skills: corpus tools registered (skills_search, skills_read)');
        }
        catch (error) {
            ctx.logger.warn(`dsh-awesome-skills: tool registration failed; corpus tools unavailable (${error instanceof Error ? error.message : String(error)})`);
        }
    });
}
//# sourceMappingURL=tools.js.map