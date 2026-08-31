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
  boosted: string[]
  muted: string[]
  /** pin = hold the exact list order; boost = a scoring delta by position. */
  pinMode: 'pin' | 'boost'
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
  const { t, state, onChange, suggestions, onApply, applied } = props
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const isDirty = applied !== undefined
    && (applied.boosted.length !== state.boosted.length || applied.muted.length !== state.muted.length
      || applied.boosted.some((p, i) => state.boosted[i] !== p)
      || applied.muted.some((p, i) => state.muted[i] !== p))

  const move = useCallback((list: string[], from: number, delta: number): string[] => {
    const to = from + delta
    if (to < 0 || to >= list.length) return list
    const next = [...list]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    return next
  }, [])

  const removeFrom = (key: 'boosted' | 'muted', index: number): void => {
    const next = state[key].filter((_, i) => i !== index)
    onChange({ ...state, [key]: next })
  }

  const add = (key: 'boosted' | 'muted', path: string): void => {
    const value = path.trim()
    if (value === '') return
    if (state.boosted.includes(value) || state.muted.includes(value)) return
    onChange({ ...state, [key]: [...state[key], value] })
    setDraft('')
  }

  const available = suggestions.filter(s =>
    !state.boosted.includes(s.path) && !state.muted.includes(s.path))

  return (
    <div className={css.root}>
      <section className={css.block}>
        <h3 className={css.heading}>{t('priorityModeTitle')}</h3>
        <div className={css.modeRow} role="radiogroup" aria-label={t('priorityModeTitle')}>
          <label className={state.pinMode === 'pin' ? css.modeOn : css.mode}>
            <input
              type="radio"
              name="dshas-pin-mode"
              checked={state.pinMode === 'pin'}
              onChange={() => onChange({ ...state, pinMode: 'pin' })}
            />
            <span>{t('modePin')}</span>
          </label>
          <label className={state.pinMode === 'boost' ? css.modeOn : css.mode}>
            <input
              type="radio"
              name="dshas-pin-mode"
              checked={state.pinMode === 'boost'}
              onChange={() => onChange({ ...state, pinMode: 'boost' })}
            />
            <span>{t('modeBoost')}</span>
          </label>
        </div>
        <p className={css.hint}>{state.pinMode === 'pin' ? t('modePinHint') : t('modeBoostHint')}</p>
      </section>

      <section className={css.block}>
        <h3 className={css.heading}>{t('priorityBoostTitle')}</h3>
        <p className={css.hint}>{state.pinMode === 'pin' ? t('priorityPinHint') : t('priorityBoostHint')}</p>

        {state.boosted.length === 0
          ? <p className={css.empty}>{t('priorityBoostEmpty')}</p>
          : (
            <ol className={css.list}>
              {state.boosted.map((path, index) => (
                <li className={css.row} key={path}>
                  <span className={css.rank}>{index + 1}</span>
                  <code className={css.path}>{path}</code>
                  <span className={css.controls}>
                    <button type="button" className={css.ctl} disabled={index === 0}
                      onClick={() => onChange({ ...state, boosted: move(state.boosted, index, -1) })}
                      aria-label={t('moveUp')}>↑</button>
                    <button type="button" className={css.ctl}
                      disabled={index === state.boosted.length - 1}
                      onClick={() => onChange({ ...state, boosted: move(state.boosted, index, 1) })}
                      aria-label={t('moveDown')}>↓</button>
                    <button type="button" className={css.ctl} onClick={() => removeFrom('boosted', index)}
                      aria-label={t('remove')}>×</button>
                  </span>
                </li>
              ))}
            </ol>
          )}

        {available.length > 0 && (
          <select
            className={css.picker}
            value=""
            onChange={e => add('boosted', e.target.value)}
            aria-label={t('addBoost')}
          >
            <option value="">{t('addBoost')}</option>
            {available.map(s => <option key={s.path} value={s.path}>{s.name}</option>)}
          </select>
        )}
      </section>

      <section className={css.block}>
        <h3 className={css.heading}>{t('priorityMuteTitle')}</h3>
        <p className={css.hint}>{t('priorityMuteHint')}</p>

        {state.muted.length === 0
          ? <p className={css.empty}>{t('priorityMuteEmpty')}</p>
          : (
            <ul className={css.list}>
              {state.muted.map((path, index) => (
                <li className={css.row} key={path}>
                  <code className={css.path}>{path}</code>
                  <span className={css.controls}>
                    <button type="button" className={css.ctl} onClick={() => removeFrom('muted', index)}
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
              if (e.key === 'Enter') {
                if (e.shiftKey) add('muted', draft)
                else add('boosted', draft)
              }
            }}
          />
          <button type="button" className={css.primary} disabled={draft.trim() === ''}
            onClick={() => add('boosted', draft)}>{t('addBoost')}</button>
          <button type="button" className={css.button} disabled={draft.trim() === ''}
            onClick={() => add('muted', draft)}>{t('addMute')}</button>
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
