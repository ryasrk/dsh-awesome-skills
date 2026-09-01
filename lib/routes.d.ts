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
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { SkillsSearch } from './search.js';
/**
 * Structural subset of the host webServer this module uses. `register` takes
 * one route and returns its disposer; `kind: 'exact'` matches the literal
 * path, `kind: 'prefix'` everything under it. Matches the shape dsh-market
 * observes on the same service.
 */
export interface WebServerService {
    register(route: {
        kind: 'exact' | 'prefix';
        path: string;
        handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>;
    }): () => void;
}
/**
 * The host-side context a mounted route set needs: the webServer to register
 * on, plus an `effect` that ties route disposal to the fiber lifecycle.
 * Structural on purpose (see cordis-types.ts) — the loader passes the real
 * context and only these members are touched.
 */
export interface SkillRoutesHost {
    webServer: WebServerService;
    effect(callback: () => (() => void | Promise<void>), label: string): void;
    logger?: {
        info?(message: string): void;
        warn(message: string): void;
    };
}
/**
 * Mount the query/status routes on the host webServer.
 * @param host - Acquired webServer host (see SkillRoutesHost).
 * @param search - The search service; its live knobs drive every answer.
 * @param corpusDir - Absolute corpus directory, surfaced by the status route.
 * @returns Disposer removing every registered route.
 */
export declare function mountSkillRoutes(host: SkillRoutesHost, search: SkillsSearch, corpusDir: string, getKnobs: () => {
    prio: string[];
    blacklist: string[];
    whitelist: string[];
    whitelistOnly: boolean;
}, setKnobs: (next: {
    prio?: string[];
    blacklist?: string[];
    whitelist?: string[];
    whitelistOnly?: boolean;
}) => void): () => void;
/**
 * Acquire the webServer and mount the routes, no-op on a host without one.
 * Registration happens inside the inject callback (dsh-market's shape) so a
 * host that never provides the webServer skips the mount entirely instead of
 * crashing `apply`.
 * @param ctx - Plugin context that may resolve `webServer` and `effect`.
 * @param search - The search service the routes call.
 * @param corpusDir - Corpus directory reported by the status route.
 */
export declare function mountSkillRoutesOnContext(ctx: {
    inject?: unknown;
    logger?: {
        warn(message: string): void;
    };
}, search: SkillsSearch, corpusDir: string, getKnobs: () => {
    prio: string[];
    blacklist: string[];
    whitelist: string[];
    whitelistOnly: boolean;
}, setKnobs: (next: {
    prio?: string[];
    blacklist?: string[];
    whitelist?: string[];
    whitelistOnly?: boolean;
}) => void): void;
//# sourceMappingURL=routes.d.ts.map