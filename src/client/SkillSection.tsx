/**
 * The Skills section's three submenus: Search, Priority, Config.
 *
 * Tab state is local to the section (dsh-market's pattern) rather than a
 * nested slot, because the three panes share state — the explorer's hits
 * feed the priority picker, and the config card and the priority list both
 * write the same settings document.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import css from './SectionTabs.module.css'
import { SkillExplorer, type SkillExplorerProps } from './SkillExplorer.tsx'
import { SettingsCard, type SettingsCardProps } from './SettingsCard.tsx'
import { PrioritySkills, type PrioritySkillsProps, type PriorityState } from './PrioritySkills.tsx'

/** Shape of the priority route's response. */
interface PriorityResponse {
  ok: boolean
  prio?: string[]
  blacklist?: string[]
  whitelist?: string[]
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
  /** Locale copy for the tab labels, keyed by tab id. */
  labels: Record<SectionTab, string>
  /** Explorer props, forwarded; its hits feed the priority picker. */
  explorer: Omit<SkillExplorerProps, 'onHits'>
  /** Priority props, forwarded. */
  priority: Omit<PrioritySkillsProps, 't'>
}

/**
 * Render the tabbed Skills section.
 * @param props - locale, scope, labels, and the forwarded pane props.
 */
export function SkillSection(props: SkillSectionProps) {
  const { t, scope, labels, explorer, priority } = props
  const [tab, setTab] = useState<SectionTab>('search')
  const [pending, setPending] = useState(false)
  /** The explorer's latest hits, offered to the priority picker. */
  const [hits, setHits] = useState<{ path: string; name: string }[]>([])
  const onHits = useCallback((next: { path: string; name: string }[]) => setHits(next), [])
  /** Applied priority lists, as the route returns them. */
  const [applied, setApplied] = useState<PriorityState>({ prio: [], blacklist: [], whitelist: [] })
  /** Staged edits on top of `applied`, until Save commits them. */
  const [staged, setStaged] = useState<PriorityState | undefined>(undefined)

  useEffect(() => {
    let live = true
    void (async () => {
      try {
        const response = await fetch(api('/dsh-awesome-skills/priority'))
        const body = (await response.json()) as PriorityResponse
        if (live && body.ok && Array.isArray(body.prio) && Array.isArray(body.blacklist) && Array.isArray(body.whitelist)) {
          setApplied({ prio: body.prio, blacklist: body.blacklist, whitelist: body.whitelist })
        }
      } catch { /* the empty defaults stand; the tab still works */ }
    })()
    return () => { live = false }
  }, [])

  const onPriorityChange = useCallback((next: PriorityState): void => {
    setStaged(next)
  }, [])

  const savePriority = useCallback(async (): Promise<void> => {
    if (staged === undefined) return
    try {
      const response = await fetch(api('/dsh-awesome-skills/priority'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(staged),
      })
      const body = (await response.json()) as PriorityResponse
      if (body.ok && Array.isArray(body.prio) && Array.isArray(body.blacklist) && Array.isArray(body.whitelist)) {
        setApplied({ prio: body.prio, blacklist: body.blacklist, whitelist: body.whitelist })
        setStaged(undefined)
      }
    } catch { /* keep the staged edits; a retry re-posts them */ }
  }, [staged])

  /**
   * One skill, one list, one click: add or remove a path in a single list and
   * commit it immediately. The POST is the same writer the Priority tab's Save
   * uses, so the two surfaces cannot disagree; the applied state updates from
   * the route's answer, and a failed call leaves the optimistic edit in place
   * for a retry.
   */
  const assign = useCallback(async (
    key: 'prio' | 'blacklist' | 'whitelist',
    path: string,
    remove: boolean,
  ): Promise<void> => {
    const base = staged ?? applied
    const current = Array.isArray(base[key]) ? base[key] : []
    const nextList = remove ? current.filter(p => p !== path) : [...current, path]
    // Optimistic: paint the new chip state before the round trip.
    setApplied({ ...base, [key]: nextList })
    setStaged(undefined)
    try {
      const response = await fetch(api('/dsh-awesome-skills/priority'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ [key]: nextList }),
      })
      const body = (await response.json()) as PriorityResponse
      if (body.ok && Array.isArray(body.prio) && Array.isArray(body.blacklist) && Array.isArray(body.whitelist)) {
        setApplied({ prio: body.prio, blacklist: body.blacklist, whitelist: body.whitelist })
      }
    } catch { /* the optimistic state stands; a retry re-posts it */ }
  }, [applied, staged])


  const tabs = useMemo(() => ([
    { id: 'search' as const, label: labels.search },
    { id: 'priority' as const, label: labels.priority, pending },
    { id: 'config' as const, label: labels.config },
  ]), [labels, pending])

  return (
    <div>
      <div className={css.tabs} role="tablist" aria-label={labels.section}>
        {tabs.map(entry => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={tab === entry.id ? css.tabOn : css.tab}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
            {entry.pending && tab !== 'priority' && <span className={css.dot} aria-hidden />}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <SkillExplorer
          {...explorer}
          onHits={onHits}
          membership={applied}
          onAssign={(key, path) => { void assign(key, path, false) }}
          onUnassign={(key, path) => { void assign(key, path, true) }}
        />
      )}
      {tab === 'priority' && (
        <PrioritySkills
          t={t}
          state={staged ?? applied}
          onChange={(next) => { setStaged(next); setPending(true) }}
          suggestions={hits}
          onApply={savePriority}
          applied={applied}
        />
      )}
      {tab === 'config' && <SettingsCard scope={scope} />}
    </div>
  )
}
