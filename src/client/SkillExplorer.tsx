/**
 * The Skill Explorer: a live semantic search box over the host's 16k corpus,
 * rendered inside the plugin's own "Skills" settings section.
 *
 * Queries the host RPC route with a 300ms debounce and never throws — every
 * failure lands in the error state. Styling is minimal/inline on purpose; a
 * CSS module can come later without moving any of this logic.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SearchHit } from '../search.js'
import type { en } from './locales.ts'
import css from './SkillExplorer.module.css'

/** One dictionary of the plugin's locale, whichever language is active. */
export type Dict = typeof en

/** Props the section injects into the explorer. */
export interface SkillExplorerProps {
  /** Locale lookup bound to the plugin's namespace. */
  t: (key: keyof Dict) => string
  /** Called with each successful search's hits, for downstream pickers. */
  onHits?: (hits: { path: string; name: string }[]) => void
}

/** Shape of the query route's success response. */
interface QueryResponse {
  ok: true
  count: number
  results: SearchHit[]
}

/** Shape of any route failure response. */
interface ErrorResponse {
  ok: false
  error: string
}

/** Resolve an absolute route against the page the bundle runs in (dsh-market's api() shape). */
function api(path: string): string {
  const relative = path.replace(/^\/+/, '')
  if (typeof document === 'undefined') return `/${relative}`
  return new URL(relative, document.baseURI).pathname
}

/**
 * Run one search against the host route.
 * @returns the parsed response, or an error object; never throws.
 */
async function runQuery(query: string, k: number): Promise<QueryResponse | ErrorResponse> {
  try {
    const response = await fetch(api('/dsh-awesome-skills/query'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, k }),
    })
    const body = (await response.json()) as QueryResponse | ErrorResponse
    if (!response.ok || body.ok !== true) {
      return { ok: false, error: body.ok === false && typeof body.error === 'string' ? body.error : `HTTP ${response.status}` }
    }
    return body
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/** Ask the status route how many skills the corpus holds; 0 on any failure. */
async function fetchCount(): Promise<number> {
  try {
    const response = await fetch(api('/dsh-awesome-skills/status'))
    if (!response.ok) return 0
    const body = (await response.json()) as { ok?: boolean; count?: number }
    return typeof body.count === 'number' && Number.isFinite(body.count) ? body.count : 0
  } catch {
    return 0
  }
}

/** Fill a dictionary template's {n} placeholder. */
function template(text: string, n: number): string {
  return text.replace('{n}', String(n))
}

/**
 * Render the explorer section.
 * @param props - the injected locale lookup.
 */
export function SkillExplorer(props: SkillExplorerProps) {
  const { t, onHits } = props
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchHit[] | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [count, setCount] = useState(0)
  const [copied, setCopied] = useState<string | undefined>(undefined)
  // Sequence-stamps each response so a slow earlier request can never
  // overwrite the answer to a newer query.
  const seqRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    void fetchCount().then(setCount)
    return () => clearTimeout(debounceRef.current)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    clearTimeout(debounceRef.current)
    if (trimmed === '') {
      setResults(undefined)
      setLoading(false)
      setFailed(false)
      return
    }
    setLoading(true)
    const seq = ++seqRef.current
    debounceRef.current = setTimeout(() => {
      void runQuery(trimmed, 8).then((body) => {
        // Only the latest issued query may paint.
        if (seq !== seqRef.current) return
        if (body.ok) {
          setResults(body.results)
          setCount(body.count)
          setFailed(false)
          onHits?.(body.results.map(r => ({ path: r.path, name: r.name })))
        } else {
          setFailed(true)
        }
        setLoading(false)
      })
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const copyPath = useCallback((path: string) => {
    const done = (): void => {
      setCopied(path)
      setTimeout(() => {
        setCopied((current) => (current === path ? undefined : current))
      }, 1500)
    }
    if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
      void navigator.clipboard.writeText(path).then(done, done)
      return
    }
    done()
  }, [])

  const list = useMemo(() => results ?? [], [results])

  return (
    <div className={css.section}>
      <input
        className={css.search}
        value={query}
        placeholder={t('searchPlaceholder')}
        onChange={(event) => setQuery(event.target.value)}
        aria-label={t('searchPlaceholder')}
      />
      <p className={css.hint}>{t('searchHint')}</p>

      {failed && <p className={css.error} role="alert">{t('error')}</p>}
      {loading && <p className={css.state}>{t('loading')}</p>}

      {!loading && !failed && results !== undefined && (
        <>
          <p className={css.meta}>
            {template(t('results'), list.length)}
            {count > 0 && ` · ${template(t('corpusCount'), count)}`}
          </p>
          {list.length === 0 && query.trim() !== '' && <p className={css.state}>{t('noResults')}</p>}
          <div className={css.results}>
            {list.map((hit) => (
              <div className={css.result} key={hit.path}>
                <div className={css.resultHead}>
                  <button
                    type="button"
                    className={css.name}
                    onClick={() => copyPath(hit.path)}
                    title={t('copyPath')}
                  >
                    {hit.name}
                  </button>
                  <span className={css.score}>{hit.score.toFixed(3)}</span>
                </div>
                <p className={css.description}>{hit.description}</p>
                {copied === hit.path && <p className={css.path}>{hit.path}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
