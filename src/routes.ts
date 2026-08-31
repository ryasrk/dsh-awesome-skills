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

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { SkillsSearch } from './search.js'

/**
 * Structural subset of the host webServer this module uses. `register` takes
 * one route and returns its disposer; `kind: 'exact'` matches the literal
 * path, `kind: 'prefix'` everything under it. Matches the shape dsh-market
 * observes on the same service.
 */
export interface WebServerService {
  register(route: {
    kind: 'exact' | 'prefix'
    path: string
    handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>
  }): () => void
}

/**
 * The host-side context a mounted route set needs: the webServer to register
 * on, plus an `effect` that ties route disposal to the fiber lifecycle.
 * Structural on purpose (see cordis-types.ts) — the loader passes the real
 * context and only these members are touched.
 */
export interface SkillRoutesHost {
  webServer: WebServerService
  effect(callback: () => (() => void | Promise<void>), label: string): void
  logger?: { info?(message: string): void; warn(message: string): void }
}

/** Write a JSON payload with no-store caching. */
function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
}

/** True when the request's Origin matches its Host — required on the POST route. */
function sameOrigin(request: IncomingMessage): boolean {
  const origin = request.headers.origin
  const host = request.headers.host
  if (origin === undefined || host === undefined) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/** Read and parse a JSON request body, rejecting anything over 4 KiB. */
async function readJsonBody(request: IncomingMessage, maxBytes = 4096): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > maxBytes) throw new Error('request body too large')
    chunks.push(buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
}

/** Narrow an unknown body to the query route's accepted shape. */
function parseQueryBody(body: unknown): { query: string; k?: number } | undefined {
  if (body === null || typeof body !== 'object') return undefined
  const raw = body as Record<string, unknown>
  if (typeof raw.query !== 'string' || raw.query.trim() === '') return undefined
  if (raw.k !== undefined && (typeof raw.k !== 'number' || !Number.isFinite(raw.k))) return undefined
  return { query: raw.query, k: raw.k }
}

/**
 * Mount the query/status routes on the host webServer.
 * @param host - Acquired webServer host (see SkillRoutesHost).
 * @param search - The search service; its live knobs drive every answer.
 * @param corpusDir - Absolute corpus directory, surfaced by the status route.
 * @returns Disposer removing every registered route.
 */
export function mountSkillRoutes(
  host: SkillRoutesHost,
  search: SkillsSearch,
  corpusDir: string,
  getKnobs: () => { boosted: string[]; muted: string[]; pinMode: 'pin' | 'boost' },
  setKnobs: (next: { boosted?: string[]; muted?: string[]; pinMode?: 'pin' | 'boost' }) => void,
): () => void {
  const disposers = [
    // Priority skills: list the current boost/mute order, and replace either
    // list. The search service owns the values; these routes are a thin
    // read/write door over it so the UI and the settings document agree.
    host.webServer.register({
      kind: 'exact',
      path: '/dsh-awesome-skills/priority',
      handler: async (request, response) => {
        if (request.method === 'GET') {
          sendJson(response, 200, { ok: true, boosted: getKnobs().boosted, muted: getKnobs().muted, pinMode: getKnobs().pinMode })
          return
        }
        if (request.method !== 'POST') {
          sendJson(response, 405, { ok: false, error: 'method not allowed' })
          return
        }
        if (!sameOrigin(request)) {
          sendJson(response, 403, { ok: false, error: 'cross-origin request' })
          return
        }
        let raw: unknown
        try {
          raw = await readJsonBody(request)
        } catch (error) {
          sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
          return
        }
        const parsed = (raw ?? {}) as { boosted?: unknown; muted?: unknown; pinMode?: unknown }
        const next: { boosted?: string[]; muted?: string[]; pinMode?: 'pin' | 'boost' } = {}
        if (parsed.boosted !== undefined) {
          if (!Array.isArray(parsed.boosted) || parsed.boosted.some(v => typeof v !== 'string')) {
            sendJson(response, 400, { ok: false, error: 'boosted must be an array of skill paths' })
            return
          }
          next.boosted = parsed.boosted as string[]
        }
        if (parsed.muted !== undefined) {
          if (!Array.isArray(parsed.muted) || parsed.muted.some(v => typeof v !== 'string')) {
            sendJson(response, 400, { ok: false, error: 'muted must be an array of skill paths' })
            return
          }
          next.muted = parsed.muted as string[]
        }
        if (parsed.pinMode !== undefined) {
          if (parsed.pinMode !== 'pin' && parsed.pinMode !== 'boost') {
            sendJson(response, 400, { ok: false, error: "pinMode must be 'pin' or 'boost'" })
            return
          }
          next.pinMode = parsed.pinMode
        }
        setKnobs(next)
        sendJson(response, 200, {
          ok: true,
          boosted: getKnobs().boosted,
          muted: getKnobs().muted,
          pinMode: getKnobs().pinMode,
        })
      },
    }),
    host.webServer.register({
      kind: 'exact',
      path: '/dsh-awesome-skills/query',
      handler: async (request, response) => {
        if (request.method !== 'POST') {
          sendJson(response, 405, { ok: false, error: 'method not allowed' })
          return
        }
        if (!sameOrigin(request)) {
          sendJson(response, 403, { ok: false, error: 'cross-origin request' })
          return
        }
        let raw: unknown
        try {
          raw = await readJsonBody(request)
        } catch (error) {
          sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
          return
        }
        const parsed = parseQueryBody(raw)
        if (parsed === undefined) {
          sendJson(response, 400, { ok: false, error: 'body must be { query: string, k?: number }' })
          return
        }
        try {
          const results = await search.search(parsed.query, parsed.k ?? 8)
          sendJson(response, 200, { ok: true, count: search.count(), results })
        } catch (error) {
          sendJson(response, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
        }
      },
    }),
    host.webServer.register({
      kind: 'exact',
      path: '/dsh-awesome-skills/status',
      handler: (request, response) => {
        sendJson(response, 200, { ok: true, count: search.count(), corpusDir })
      },
    }),
  ]
  host.logger?.info?.('dsh-awesome-skills: http routes mounted (query, status, priority)')
  return () => {
    for (const dispose of disposers) dispose()
  }
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
export function mountSkillRoutesOnContext(
  ctx: { inject?: unknown; logger?: { warn(message: string): void } },
  search: SkillsSearch,
  corpusDir: string,
  getKnobs: () => { boosted: string[]; muted: string[]; pinMode: 'pin' | 'boost' },
  setKnobs: (next: { boosted?: string[]; muted?: string[]; pinMode?: 'pin' | 'boost' }) => void,
): void {
  const inject = ctx.inject as
    | ((deps: readonly string[], cb: (scoped: unknown) => void) => void)
    | undefined
  inject?.(['webServer'], (scoped: unknown) => {
    const host = scoped as unknown as SkillRoutesHost & Record<string, unknown>
    if (typeof host?.webServer?.register !== 'function') {
      ctx.logger?.warn('dsh-awesome-skills: webServer present but register() missing; routes skipped')
      return
    }
    const effect = typeof host.effect === 'function'
      ? host.effect
      : undefined
    if (effect) {
      effect.call(host, () => mountSkillRoutes(host, search, corpusDir, getKnobs, setKnobs), 'dsh-awesome-skills: http routes')
      return
    }
    ctx.logger?.warn('dsh-awesome-skills: webServer present but effect() missing; routes mounted without disposal')
    mountSkillRoutes(host, search, corpusDir, getKnobs, setKnobs)
  })
}
