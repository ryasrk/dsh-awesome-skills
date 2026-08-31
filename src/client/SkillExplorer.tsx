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

/** One dictionary of the plugin's locale, whichever language is active. */
export type Dict = typeof en

/** Props the section injects into the explorer. */
export interface SkillExplorerProps {
  /** Locale lookup bound to the plugin's namespace. */
  t: (key: keyof Dict) => string
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
  const { t } = props
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '6px 10px',
    fontSize: 13,
    borderRadius: 6,
    border: '1px solid rgba(128,128,128,0.4)',
    background: 'transparent',
    color: 'inherit',
  }
  const rowStyle: React.CSSProperties = {
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid rgba(128,128,128,0.25)',
    marginBottom: 6,
  }
  const mutedStyle: React.CSSProperties = { opacity: 0.65, fontSize: 12, margin: '4px 0 8px' }

  return (
    <div style={{ padding: '4px 0' }}>
      <input
        style={inputStyle}
        value={query}
        placeholder={t('searchPlaceholder')}
        onChange={(event) => setQuery(event.target.value)}
        aria-label={t('searchPlaceholder')}
      />
      <p style={mutedStyle}>{t('searchHint')}</p>

      {failed && <p style={{ color: 'inherit', margin: '8px 0' }}>⚠ {t('error')}</p>}
      {loading && <p style={mutedStyle}>{t('loading')}</p>}

      {!loading && !failed && results !== undefined && (
        <>
          <p style={mutedStyle}>
            {template(t('results'), list.length)}
            {count > 0 && ` · ${template(t('corpusCount'), count)}`}
          </p>
          {list.length === 0 && query.trim() !== '' && <p style={mutedStyle}>{t('noResults')}</p>}
          <div>
            {list.map((hit) => (
              <div key={hit.path} style={rowStyle}>
                <button
                  type="button"
                  onClick={() => copyPath(hit.path)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    display: 'block',
                    fontWeight: 600,
                    fontSize: 13,
                    width: '100%',
                  }}
                  title={t('copyPath')}
                >
                  {hit.name}
                  <span style={{ float: 'right', fontWeight: 400, opacity: 0.6 }}>
                    {hit.score.toFixed(3)}
                  </span>
                </button>
                <div style={{ fontSize: 12, marginTop: 2, opacity: 0.8 }}>{hit.description}</div>
                {copied === hit.path && (
                  <div style={{ fontSize: 12, marginTop: 2, opacity: 0.9 }}>
                    {copied}: {hit.path}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
