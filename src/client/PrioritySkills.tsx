/**
 * Priority skills: the boost and mute lists, edited as ordered lists.
 *
 * Boost order is meaningful — the top of the list climbs highest — so the
 * editor is a vertical list with explicit move controls rather than a
 * checkbox grid. Mute is a flat exclusion list. Both are edited as staged
 * drafts and committed through the priority route, which is the same source
 * the search service reads.
 */

import { useCallback, useEffect, useState } from 'react'
import css from './PrioritySkills.module.css'

/** One ordered list's shape as the route returns it. */
export interface PriorityState {
  /** Loaded into context at the start of every turn, in order. */
  prio: string[]
  /** Hidden from search results. */
  blacklist: string[]
  /** When whitelistOnly is set, only these are visible. */
  whitelist: string[]
}

export interface PrioritySkillsProps {
  /** Locale lookup bound to the plugin's namespace. */
  t: (key: string) => string
  /** The staged state, owned by the shared tab shell so tab switches keep it. */
  state: PriorityState
  onChange(next: PriorityState): void
  /** Skills offered by the picker: the explorer's recent hits, so picking a
      skill to boost does not require retyping its path. */
  suggestions: { path: string; name: string }[]
  /** Commit the staged lists; undefined leaves edits staged until the tab
      shell saves them. */
  onApply?: () => Promise<void>
  /** The applied lists, shown as the baseline the staged edits modify. */
  applied?: PriorityState
}

/**
 * Render the priority editor.
 * @param props - locale, staged state, change handler, picker suggestions.
 */
export function PrioritySkills(props: PrioritySkillsProps) {
  const { t, onChange, suggestions, onApply, applied } = props
  // Every list is read off the wire; a host or an older cached response can
  // hand us a shape missing a field, so normalize once instead of guarding
  // at each of a dozen read sites.
  const state: PriorityState = {
    prio: Array.isArray(props.state?.prio) ? props.state.prio : [],
    blacklist: Array.isArray(props.state?.blacklist) ? props.state.blacklist : [],
    whitelist: Array.isArray(props.state?.whitelist) ? props.state.whitelist : [],
  }
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const isDirty = applied !== undefined
    && (['prio', 'blacklist', 'whitelist'] as const).some(key => {
      const a = Array.isArray(applied[key]) ? applied[key] : []
      const b = state[key]
      return a.length !== b.length || a.some((p, i) => b[i] !== p)
    })

  const move = useCallback((list: string[], from: number, delta: number): string[] => {
    const to = from + delta
    if (to < 0 || to >= list.length) return list
    const next = [...list]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    return next
  }, [])

  const removeFrom = (key: 'prio' | 'blacklist' | 'whitelist', index: number): void => {
    const next = state[key].filter((_, i) => i !== index)
    onChange({ ...state, [key]: next })
  }

  const add = (key: 'prio' | 'blacklist' | 'whitelist', path: string): void => {
    const value = path.trim()
    if (value === '') return
    if (state.prio.includes(value) || state.blacklist.includes(value) || state.whitelist.includes(value)) return
    onChange({ ...state, [key]: [...state[key], value] })
    setDraft('')
  }

  const available = suggestions.filter(s =>
    !state.prio.includes(s.path) && !state.blacklist.includes(s.path) && !state.whitelist.includes(s.path))

  return (
    <div className={css.root}>
      <section className={css.block}>
        <h3 className={css.heading}>{t('prioTitle')}</h3>
        <p className={css.hint}>{t('prioHint')}</p>

        {state.prio.length === 0
          ? <p className={css.empty}>{t('prioEmpty')}</p>
          : (
            <ol className={css.list}>
              {state.prio.map((path, index) => (
                <li className={css.row} key={path}>
                  <span className={css.rank}>{index + 1}</span>
                  <code className={css.path}>{path}</code>
                  <span className={css.controls}>
                    <button type="button" className={css.ctl} disabled={index === 0}
                      onClick={() => onChange({ ...state, prio: move(state.prio, index, -1) })}
                      aria-label={t('moveUp')}>↑</button>
                    <button type="button" className={css.ctl}
                      disabled={index === state.prio.length - 1}
                      onClick={() => onChange({ ...state, prio: move(state.prio, index, 1) })}
                      aria-label={t('moveDown')}>↓</button>
                    <button type="button" className={css.ctl} onClick={() => removeFrom('prio', index)}
                      aria-label={t('remove')}>×</button>
                  </span>
                </li>
              ))}
            </ol>
          )}

        {available.length > 0 && (
          <div className={css.pickers}>
            {(['prio', 'blacklist', 'whitelist'] as const).map(key => (
              <select
                key={key}
                className={css.picker}
                value=""
                onChange={e => add(key, e.target.value)}
                aria-label={t(key === 'prio' ? 'addPrio' : key === 'blacklist' ? 'blacklistTitle' : 'whitelistTitle')}
              >
                <option value="">{t(key === 'prio' ? 'addPrio' : key === 'blacklist' ? 'blacklistTitle' : 'whitelistTitle')}</option>
                {available.map(s => <option key={s.path} value={s.path}>{s.name}</option>)}
              </select>
            ))}
          </div>
        )}
      </section>

      <section className={css.block}>
        <h3 className={css.heading}>{t('blacklistTitle')}</h3>
        <p className={css.hint}>{t('blacklistHint')}</p>

        {state.blacklist.length === 0
          ? <p className={css.empty}>{t('blacklistEmpty')}</p>
          : (
            <ul className={css.list}>
              {state.blacklist.map((path, index) => (
                <li className={css.row} key={path}>
                  <code className={css.path}>{path}</code>
                  <span className={css.controls}>
                    <button type="button" className={css.ctl} onClick={() => removeFrom('blacklist', index)}
                      aria-label={t('remove')}>×</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
      </section>

      <section className={css.block}>
        <h3 className={css.heading}>{t('whitelistTitle')}</h3>
        <p className={css.hint}>{t('whitelistHint')}</p>

        {state.whitelist.length === 0
          ? <p className={css.empty}>{t('whitelistEmpty')}</p>
          : (
            <ul className={css.list}>
              {state.whitelist.map((path, index) => (
                <li className={css.row} key={path}>
                  <code className={css.path}>{path}</code>
                  <span className={css.controls}>
                    <button type="button" className={css.ctl} onClick={() => removeFrom('whitelist', index)}
                      aria-label={t('remove')}>×</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
      </section>

      <section className={css.block}>
        <h3 className={css.heading}>{t('priorityAddManual')}</h3>
        <div className={css.addRow}>
          <input
            className={css.input}
            value={draft}
            placeholder={t('pathPlaceholder')}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key !== 'Enter') return
              if (e.altKey) add('whitelist', draft)
              else if (e.shiftKey) add('blacklist', draft)
              else add('prio', draft)
            }}
          />
          <button type="button" className={css.primary} disabled={draft.trim() === ''}
            onClick={() => add('prio', draft)}>{t('addPrio')}</button>
          <button type="button" className={css.button} disabled={draft.trim() === ''}
            onClick={() => add('blacklist', draft)}>{t('addBlack')}</button>
          <button type="button" className={css.button} disabled={draft.trim() === ''}
            onClick={() => add('whitelist', draft)}>{t('addWhite')}</button>
        </div>
        <p className={css.hint}>{t('manualHint')}</p>
      </section>

      {onApply !== undefined && (
        <div className={css.actions}>
          <button
            type="button"
            className={css.primary}
            disabled={!isDirty || saving}
            onClick={() => { setSaving(true); void onApply().finally(() => setSaving(false)) }}
          >
            {saving ? '…' : t('save')}
          </button>
          <span className={css.grow} />
          <span className={css.state}>{isDirty ? t('priorityUnsaved') : t('prioritySaved')}</span>
        </div>
      )}
    </div>
  )
}
