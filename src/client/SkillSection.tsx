/**
 * The Skills section's three submenus: Search, Priority, Config.
 *
 * Tab state is local to the section (dsh-market's pattern) rather than a
 * nested slot, because the three panes share state — the explorer's hits
 * feed the priority picker, and the config card and the priority list both
 * write the same settings document.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import css from './SectionTabs.module.css'
import { SkillExplorer, type SkillExplorerProps } from './SkillExplorer.tsx'
import { SettingsCard, type SettingsCardProps } from './SettingsCard.tsx'
import { PrioritySkills, type PriorityState } from './PrioritySkills.tsx'

/** Shape of the priority route's response. */
interface PriorityResponse {
  ok: boolean
  prio?: string[]
  blacklist?: string[]
  whitelist?: string[]
  whitelistOnly?: boolean
  error?: string
}

/** Resolve an absolute route against the page the bundle runs in. */
function api(path: string): string {
  const relative = path.replace(/^\/+/, '')
  if (typeof document === 'undefined') return `/${relative}`
  return new URL(relative, document.baseURI).pathname
}

export type SectionTab = 'search' | 'priority' | 'config'

export interface SkillSectionProps {
  t: (key: string) => string
  /** The bound settings scope for the plugin's namespace (config card). */
  scope: SettingsCardProps['scope']
  /** Locale copy for the tab labels, keyed by tab id, plus the section name
      for the tablist's accessible label. */
  labels: Record<SectionTab, string> & { section: string }
  /** Explorer props, forwarded; its hits feed the priority picker. */
  explorer: Omit<SkillExplorerProps, 'onHits'>
}

/**
 * Render the tabbed Skills section.
 * @param props - locale, scope, labels, and the forwarded pane props.
 */
export function SkillSection(props: SkillSectionProps) {
  const { t, scope, labels, explorer } = props
  const [tab, setTab] = useState<SectionTab>('search')
  const [pending, setPending] = useState(false)
  /** The explorer's latest hits, offered to the priority picker. */
  const [hits, setHits] = useState<{ path: string; name: string }[]>([])
  const onHits = useCallback((next: { path: string; name: string }[]) => setHits(next), [])
  /** Applied priority lists, as the route returns them. */
  const [applied, setApplied] = useState<PriorityState>({ prio: [], blacklist: [], whitelist: [] })
  /** Search scope from the same route: when true, only whitelisted skills
   *  are visible, which makes an empty whitelist a whole-corpus blackout. */
  const [whitelistOnly, setWhitelistOnly] = useState(false)
  /** True once the initial load has answered (ok or failed), so optimistic
   *  edits never build on an unloaded base (lost-update hole). */
  const [loaded, setLoaded] = useState(false)
  /** Initial-load failure: editing pauses until Retry succeeds. */
  const [loadFailed, setLoadFailed] = useState(false)
  /** Save failure on the staged Priority edits; Retry re-posts them. */
  const [saveFailed, setSaveFailed] = useState(false)
  /** Staged edits on top of `applied`, until Save commits them. */
  const [staged, setStaged] = useState<PriorityState | undefined>(undefined)

  const onPriorityChange = useCallback((next: PriorityState): void => {
    setStaged(next)
  }, [])

  const discardPriority = useCallback((): void => {
    setStaged(undefined)
    setSaveFailed(false)
    setPending(false)
  }, [])

  /** The one loader for the applied lists: used by the mount effect and the
   *  Retry button, so their success predicate and error handling cannot
   *  drift. Sequence-guarded, so a stale answer never paints. */
  const loadSeq = useRef(0)
  const loadPriority = useCallback(async (): Promise<void> => {
    const seq = ++loadSeq.current
    setLoadFailed(false)
    try {
      const response = await fetch(api('/dsh-awesome-skills/priority'))
      const body = (await response.json()) as PriorityResponse
      if (seq !== loadSeq.current) return
      if (!response.ok || !body.ok || !Array.isArray(body.prio) || !Array.isArray(body.blacklist) || !Array.isArray(body.whitelist)) {
        throw new Error(body.ok === false && typeof body.error === 'string' ? body.error : `HTTP ${response.status}`)
      }
      setApplied({ prio: body.prio, blacklist: body.blacklist, whitelist: body.whitelist })
      setWhitelistOnly(body.whitelistOnly === true)
      setLoaded(true)
    } catch {
      if (seq === loadSeq.current) setLoadFailed(true)
    }
  }, [])

  useEffect(() => { void loadPriority() }, [loadPriority])

  /**
   * Every write to the priority route — Save and chip assigns — draws from
   * one sequence counter, so a slow earlier write can never overwrite the
   * answer to a newer one, whichever surface issued it.
   */
  const writeSeq = useRef(0)
  const [assignFailed, setAssignFailed] = useState(false)
  const assign = useCallback(async (
    key: 'prio' | 'blacklist' | 'whitelist',
    path: string,
    remove: boolean,
  ): Promise<void> => {
    if (!loaded) return
    const prevApplied = applied
    const current = Array.isArray(applied[key]) ? applied[key] : []
    const nextList = remove ? current.filter(p => p !== path) : [...current, path]
    const body = { ...applied, [key]: nextList }
    const seq = ++writeSeq.current
    // Optimistic: paint the new chip state before the round trip. Staged
    // edits are untouched — this surface commits only its own change.
    setApplied(body)
    setAssignFailed(false)
    try {
      const response = await fetch(api('/dsh-awesome-skills/priority'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = (await response.json()) as PriorityResponse
      if (seq !== writeSeq.current) return // a newer write owns the state now
      if (!response.ok || !result.ok || !Array.isArray(result.prio) || !Array.isArray(result.blacklist) || !Array.isArray(result.whitelist)) {
        throw new Error(result.ok === false && typeof result.error === 'string' ? result.error : `HTTP ${response.status}`)
      }
      setApplied({ prio: result.prio, blacklist: result.blacklist, whitelist: result.whitelist })
      setWhitelistOnly(result.whitelistOnly === true)
    } catch {
      if (seq !== writeSeq.current) return
      // Roll the optimistic paint back to the pre-click applied truth; the
      // staged pane is untouched, so nothing unsaved reads as applied.
      setApplied(prevApplied)
      setAssignFailed(true)
    }
  }, [applied, loaded])

  const savePriority = useCallback(async (): Promise<void> => {
    if (staged === undefined || !loaded) return
    setSaveFailed(false)
    const seq = ++writeSeq.current
    try {
      const response = await fetch(api('/dsh-awesome-skills/priority'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(staged),
      })
      const body = (await response.json()) as PriorityResponse
      if (seq !== writeSeq.current) return // a newer write owns the state now
      if (!response.ok || !body.ok || !Array.isArray(body.prio) || !Array.isArray(body.blacklist) || !Array.isArray(body.whitelist)) {
        throw new Error(body.ok === false && typeof body.error === 'string' ? body.error : `HTTP ${response.status}`)
      }
      setApplied({ prio: body.prio, blacklist: body.blacklist, whitelist: body.whitelist })
      setWhitelistOnly(body.whitelistOnly === true)
      setStaged(undefined)
      setPending(false)
      setLoaded(true)
    } catch {
      if (seq !== writeSeq.current) return
      // The staged edits stand so Retry re-posts them unchanged.
      setSaveFailed(true)
    }
  }, [staged, loaded])


  const tabs = useMemo(() => ([
    { id: 'search' as const, label: labels.search },
    { id: 'priority' as const, label: labels.priority, pending },
    { id: 'config' as const, label: labels.config },
  ]), [labels, pending])

  /** Whole-corpus blackout: whitelist-only scope with an empty whitelist hides
   *  every skill. Raised as a focusable summary that links to the Config scope
   *  field, so the user can see *and* reach the one switch that lifts it. */
  const blackout = loaded && whitelistOnly && applied.whitelist.length === 0

  return (
    <div>
      {blackout && (
        <div className={css.summary} role="alert" tabIndex={-1}>
          <span>{t('whitelistEmptyWarn')}</span>
          <button type="button" className={css.summaryLink} onClick={() => setTab('config')}>
            {t('gotoScope')}
          </button>
        </div>
      )}
      <div className={css.tabs} role="tablist" aria-label={labels.section}>
        {tabs.map(entry => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            aria-label={entry.pending && tab !== 'priority' ? `${entry.label} — ${t('priorityUnsaved')}` : undefined}
            className={tab === entry.id ? css.tabOn : css.tab}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
            {entry.pending && tab !== 'priority' && <span className={css.dot} aria-hidden />}
          </button>
        ))}
      </div>

      {loadFailed && (
        <div className={css.loadError} role="alert">
          <span>{t('priorityLoadFailed')}</span>
          <button type="button" className={css.retryBtn} onClick={() => { void loadPriority() }}>{t('retry')}</button>
        </div>
      )}
      {assignFailed && <div className={css.loadError} role="alert">{t('priorityAssignFailed')}</div>}

      {tab === 'search' && (
        <SkillExplorer
          {...explorer}
          onHits={onHits}
          membership={loaded ? applied : undefined}
          onAssign={(key, path) => { void assign(key, path, false) }}
          onUnassign={(key, path) => { void assign(key, path, true) }}
        />
      )}
      {tab === 'priority' && (loaded
        ? (
          <PrioritySkills
            t={t}
            state={staged ?? applied}
            onChange={(next) => { setStaged(next); setPending(true) }}
            suggestions={hits}
            onApply={savePriority}
            applied={applied}
            saveFailed={saveFailed}
            onDiscard={discardPriority}
            whitelistOnly={whitelistOnly}
          />
        )
        : <p className={css.state}>{loadFailed ? t('priorityLoadFailed') : t('loading')}</p>
      )}
      {tab === 'config' && <SettingsCard scope={scope} />}
    </div>
  )
}
