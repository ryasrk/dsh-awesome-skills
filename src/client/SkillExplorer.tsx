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
import { IconClose, IconSearch } from './icons.tsx'

/** One dictionary of the plugin's locale, whichever language is active. */
export type Dict = typeof en

/** Props the section injects into the explorer. */
export interface SkillExplorerProps {
  /** Locale lookup bound to the plugin's namespace. */
  t: (key: keyof Dict) => string
  /** Called with each successful search's hits, for downstream pickers. */
  onHits?: (hits: { path: string; name: string }[]) => void
  /** Current list membership, so hits show their state and actions resolve. */
  membership?: { prio: string[]; blacklist: string[]; whitelist: string[] }
  /** Add a skill path to one of the lists. */
  onAssign?: (key: 'prio' | 'blacklist' | 'whitelist', path: string) => void
  /** Remove a skill path from one of the lists. */
  onUnassign?: (key: 'prio' | 'blacklist' | 'whitelist', path: string) => void
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
  const { t, onHits, onAssign, onUnassign } = props
  // Same normalization rule as PrioritySkills: list fields arrive over the
  // wire, so trust nothing about their shape.
  const membership = props.membership === undefined ? undefined : {
    prio: Array.isArray(props.membership.prio) ? props.membership.prio : [],
    blacklist: Array.isArray(props.membership.blacklist) ? props.membership.blacklist : [],
    whitelist: Array.isArray(props.membership.whitelist) ? props.membership.whitelist : [],
  }
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchHit[] | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [count, setCount] = useState(0)
  const [copied, setCopied] = useState<string | undefined>(undefined)
  /** Which membership slice the results show; 'all' is the unfiltered view. */
  const [filter, setFilter] = useState<'all' | 'prio' | 'blacklist' | 'whitelist'>('all')
  // Sequence-stamps each response so a slow earlier request can never
  // overwrite the answer to a newer query.
  const seqRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const inputRef = useRef<HTMLInputElement>(undefined)
  useEffect(() => {
    void fetchCount().then(setCount)
    // search-ux: focus the input when the search view opens
    inputRef.current?.focus()
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

  const list = useMemo(() => {
    const hits = results ?? []
    if (filter === 'all' || membership === undefined) return hits
    const set = new Set(membership[filter])
    return hits.filter(h => set.has(h.path))
  }, [results, filter, membership])

  return (
    <div className={css.section}>
      <div className={css.searchRow}>
        <span className={css.searchIcon}><IconSearch /></span>
        <input
          ref={inputRef}
          className={css.search}
          value={query}
          placeholder={t('searchPlaceholder')}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Escape') setQuery('') }}
          aria-label={t('searchPlaceholder')}
        />
        {query !== '' && (
          <button type="button" className={css.clear} onClick={() => setQuery('')} aria-label={t('clear')}>
            ×
          </button>
        )}
      </div>
      <p className={css.hint}>{t('searchHint')}</p>

      {membership !== undefined && (
        <div className={css.filterBar} role="group" aria-label={t('scopeLabel')}>
          {(['all', 'prio', 'blacklist', 'whitelist'] as const).map(key => (
            <button
              key={key}
              type="button"
              className={filter === key ? css.filterOn : css.filterBtn}
              onClick={() => setFilter(key)}
            >
              {t(key === 'all' ? 'filterAll' : key === 'prio' ? 'filterPrio' : key === 'blacklist' ? 'filterBlack' : 'filterWhite')}
            </button>
          ))}
        </div>
      )}

      {failed && <p className={css.error} role="alert">{t('error')}</p>}
      {loading && <p className={css.state}>{t('loading')}</p>}

      {!loading && !failed && results !== undefined && (
        <>
          <p className={css.meta}>
            {template(t('results'), list.length)}
            {count > 0 && ` · ${template(t('corpusCount'), count)}`}
          </p>
          {list.length === 0 && query.trim() !== '' && (
            <div className={css.empty}>
              <p className={css.emptyTitle}>{t('noResultsTitle')}</p>
              <p className={css.emptyBody}>{t('noResults')}</p>
            </div>
          )}
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
                <div className={css.rowActions}>
                  {membership !== undefined && onAssign !== undefined && onUnassign !== undefined ? (
                    <>
                      {(['prio', 'blacklist', 'whitelist'] as const).map(key => {
                        const inList = membership[key].includes(hit.path)
                        return inList ? (
                          <button
                            key={key}
                            type="button"
                            className={css.chipOn}
                            onClick={() => onUnassign(key, hit.path)}
                            title={t('remove')}
                          >
                            {t(key === 'prio' ? 'chipPrio' : key === 'blacklist' ? 'chipBlack' : 'chipWhite')}
                            <IconClose size={10} />
                          </button>
                        ) : (
                          <button
                            key={key}
                            type="button"
                            className={key === 'prio' ? css.chipPrimary : css.chip}
                            onClick={() => onAssign(key, hit.path)}
                            title={t(key === 'prio' ? 'addPrio' : key === 'blacklist' ? 'blacklistTitle' : 'whitelistTitle')}
                          >
                            {t(key === 'prio' ? 'addPrio' : key === 'blacklist' ? 'addBlack' : 'addWhite')}
                          </button>
                        )
                      })}
                    </>
                  ) : null}
                  {copied === hit.path && <span className={css.path}>{hit.path}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
