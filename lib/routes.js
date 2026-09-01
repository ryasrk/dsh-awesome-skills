/**
 * HTTP routes bridging the browser Skill Explorer to the host's search
 * service. This layer only parses requests, calls the search service, and
 * serializes responses — ranking lives in search.ts and is never re-implemented
 * here, so the routes answer with whatever the live settings knobs produce.
 *
 * Mount shape mirrors dsh-market: a structural `WebServerService` subset with
 * `register({ kind, path, handler })` returning a disposer, acquired through
 * `ctx.inject(['webServer'], ...)` and installed with `host.effect(...)` so a
 * fiber unload retires every route. No import from harness host packages —
 * the real webServer is accepted by structure only.
 */
/** Write a JSON payload with no-store caching. */
function sendJson(response, status, payload) {
    response.writeHead(status, {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
    });
    response.end(JSON.stringify(payload));
}
/** True when the request's Origin matches its Host — required on the POST route. */
function sameOrigin(request) {
    const origin = request.headers.origin;
    const host = request.headers.host;
    if (origin === undefined || host === undefined)
        return false;
    try {
        return new URL(origin).host === host;
    }
    catch {
        return false;
    }
}
/** Read and parse a JSON request body, rejecting anything over 4 KiB. */
async function readJsonBody(request, maxBytes = 4096) {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > maxBytes)
            throw new Error('request body too large');
        chunks.push(buffer);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
/** Narrow an unknown body to the query route's accepted shape. */
function parseQueryBody(body) {
    if (body === null || typeof body !== 'object')
        return undefined;
    const raw = body;
    if (typeof raw.query !== 'string' || raw.query.trim() === '')
        return undefined;
    if (raw.k !== undefined && (typeof raw.k !== 'number' || !Number.isFinite(raw.k)))
        return undefined;
    return { query: raw.query, k: raw.k };
}
/**
 * Mount the query/status routes on the host webServer.
 * @param host - Acquired webServer host (see SkillRoutesHost).
 * @param search - The search service; its live knobs drive every answer.
 * @param corpusDir - Absolute corpus directory, surfaced by the status route.
 * @returns Disposer removing every registered route.
 */
export function mountSkillRoutes(host, search, corpusDir, getKnobs, setKnobs) {
    const disposers = [
        // Priority skills: list the current boost/mute order, and replace either
        // list. The search service owns the values; these routes are a thin
        // read/write door over it so the UI and the settings document agree.
        host.webServer.register({
            kind: 'exact',
            path: '/dsh-awesome-skills/priority',
            handler: async (request, response) => {
                if (request.method === 'GET') {
                    const k = getKnobs();
                    sendJson(response, 200, { ok: true, prio: k.prio, blacklist: k.blacklist, whitelist: k.whitelist, whitelistOnly: k.whitelistOnly });
                    return;
                }
                if (request.method !== 'POST') {
                    sendJson(response, 405, { ok: false, error: 'method not allowed' });
                    return;
                }
                if (!sameOrigin(request)) {
                    sendJson(response, 403, { ok: false, error: 'cross-origin request' });
                    return;
                }
                let raw;
                try {
                    raw = await readJsonBody(request);
                }
                catch (error) {
                    sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
                    return;
                }
                const parsed = (raw ?? {});
                const next = {};
                for (const key of ['prio', 'blacklist', 'whitelist']) {
                    const value = parsed[key];
                    if (value === undefined)
                        continue;
                    if (!Array.isArray(value) || value.some(v => typeof v !== 'string')) {
                        sendJson(response, 400, { ok: false, error: `${key} must be an array of skill paths` });
                        return;
                    }
                    next[key] = value;
                }
                if (parsed.whitelistOnly !== undefined) {
                    if (typeof parsed.whitelistOnly !== 'boolean') {
                        sendJson(response, 400, { ok: false, error: 'whitelistOnly must be a boolean' });
                        return;
                    }
                    next.whitelistOnly = parsed.whitelistOnly;
                }
                setKnobs(next);
                const k = getKnobs();
                sendJson(response, 200, { ok: true, prio: k.prio, blacklist: k.blacklist, whitelist: k.whitelist, whitelistOnly: k.whitelistOnly });
            },
        }),
        host.webServer.register({
            kind: 'exact',
            path: '/dsh-awesome-skills/query',
            handler: async (request, response) => {
                if (request.method !== 'POST') {
                    sendJson(response, 405, { ok: false, error: 'method not allowed' });
                    return;
                }
                if (!sameOrigin(request)) {
                    sendJson(response, 403, { ok: false, error: 'cross-origin request' });
                    return;
                }
                let raw;
                try {
                    raw = await readJsonBody(request);
                }
                catch (error) {
                    sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
                    return;
                }
                const parsed = parseQueryBody(raw);
                if (parsed === undefined) {
                    sendJson(response, 400, { ok: false, error: 'body must be { query: string, k?: number }' });
                    return;
                }
                try {
                    const results = await search.search(parsed.query, parsed.k ?? 8);
                    sendJson(response, 200, { ok: true, count: search.count(), results });
                }
                catch (error) {
                    sendJson(response, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
                }
            },
        }),
        host.webServer.register({
            kind: 'exact',
            path: '/dsh-awesome-skills/status',
            handler: (request, response) => {
                sendJson(response, 200, { ok: true, count: search.count(), corpusDir });
            },
        }),
    ];
    host.logger?.info?.('dsh-awesome-skills: http routes mounted (query, status, priority)');
    return () => {
        for (const dispose of disposers)
            dispose();
    };
}
/**
 * Acquire the webServer and mount the routes, no-op on a host without one.
 * Registration happens inside the inject callback (dsh-market's shape) so a
 * host that never provides the webServer skips the mount entirely instead of
 * crashing `apply`.
 * @param ctx - Plugin context that may resolve `webServer` and `effect`.
 * @param search - The search service the routes call.
 * @param corpusDir - Corpus directory reported by the status route.
 */
export function mountSkillRoutesOnContext(ctx, search, corpusDir, getKnobs, setKnobs) {
    const inject = ctx.inject;
    inject?.(['webServer'], (scoped) => {
        const host = scoped;
        if (typeof host?.webServer?.register !== 'function') {
            ctx.logger?.warn('dsh-awesome-skills: webServer present but register() missing; routes skipped');
            return;
        }
        const effect = typeof host.effect === 'function'
            ? host.effect
            : undefined;
        if (effect) {
            effect.call(host, () => mountSkillRoutes(host, search, corpusDir, getKnobs, setKnobs), 'dsh-awesome-skills: http routes');
            return;
        }
        ctx.logger?.warn('dsh-awesome-skills: webServer present but effect() missing; routes mounted without disposal');
        mountSkillRoutes(host, search, corpusDir, getKnobs, setKnobs);
    });
}
//# sourceMappingURL=routes.js.map