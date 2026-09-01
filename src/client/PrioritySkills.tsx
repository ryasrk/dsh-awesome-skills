/**
 * Priority skills: the boost and mute lists, edited as ordered lists.
 *
 * Boost order is meaningful — the top of the list climbs highest — so the
 * editor is a vertical list with explicit move controls rather than a
 * checkbox grid. Mute is a flat exclusion list. Both are edited as staged
 * drafts and committed through the priority route, which is the same source
 * the search service reads.
 *
 * One canonical add affordance: a single typeahead combobox (the explorer's
 * recent hits, filtered by what is typed) plus a list-target choice. The
 * manual path input stays as the direct route for paths search has not
 * surfaced. Adding an already-listed path is refused with an inline message,
 * never a silent no-op.
 */

import { useCallback, useMemo, useState } from 'react'
import css from './PrioritySkills.module.css'
import { IconChevronDown, IconChevronUp, IconClose, IconSpinner } from './icons.tsx'

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
   *  skill to boost does not require retyping its path. */
  suggestions: { path: string; name: string }[]
  /** Commit the staged lists; undefined leaves edits staged until the tab
   *  shell saves them. */
  onApply?: () => Promise<void>
  /** The applied lists, shown as the baseline the staged edits modify. */
  applied?: PriorityState
  /** True when the last save attempt failed; Retry is the apply button. */
  saveFailed?: boolean
  /** Reset staged edits back to the applied lists (the Discard button). */
  onDiscard?: () => void
  /** When search scope is whitelist-only, an empty whitelist hides the whole
   *  corpus; the editor warns inline instead of leaving the effect a surprise. */
  whitelistOnly?: boolean
}

/** One row of the staged-diff line: a list and how the staged edit moves it. */
interface DiffRow {
  label: string
  added: number
  removed: number
  /** Same membership, different order — meaningful for the ranked list. */
  reordered: boolean
}

/** List-target choice for the add combobox, in stable display order. */
const TARGETS = ['prio', 'blacklist', 'whitelist'] as const

type Target = (typeof TARGETS)[number]

/**
 * Render the priority editor.
 * @param props - locale, staged state, change handler, picker suggestions.
 */
export function PrioritySkills(props: PrioritySkillsProps) {
  const { t, onChange, suggestions, onApply, applied, saveFailed, onDiscard, whitelistOnly } = props
  // Every list is read off the wire; a host or an older cached response can
  // hand us a shape missing a field, so normalize once instead of guarding
  // at each of a dozen read sites. Memoized on the prop's identity so the
  // downstream memos actually track it.
  const state: PriorityState = useMemo(() => ({
    prio: Array.isArray(props.state?.prio) ? props.state.prio : [],
    blacklist: Array.isArray(props.state?.blacklist) ? props.state.blacklist : [],
    whitelist: Array.isArray(props.state?.whitelist) ? props.state.whitelist : [],
  }), [props.state])
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  /** The list the combobox's pick (or the manual input's Enter) lands in. */
  const [target, setTarget] = useState<Target>('prio')
  /** Refusal message for a duplicate or empty add; cleared on the next edit. */
  const [addNote, setAddNote] = useState<string | undefined>(undefined)
  /** Keyboard focus index inside the open combobox listbox. */
  const [activeIndex, setActiveIndex] = useState(-1)
  const [open, setOpen] = useState(false)

  const isDirty = applied !== undefined
    && (['prio', 'blacklist', 'whitelist'] as const).some(key => {
      const a = Array.isArray(applied[key]) ? applied[key] : []
      const b = state[key]
      return a.length !== b.length || a.some((p, i) => b[i] !== p)
    })

  /**
   * The staged diff: per list, how the staged edit moves the list against
   * the applied baseline. Zero-effect rows are dropped, so the line reads
   * as what actually changes when Save is pressed; a same-set reorder of
   * prio is reported as Reordered, since rank is that list's whole point.
   */
  const diff = useMemo<DiffRow[]>(() => {
    if (applied === undefined) return []
    return TARGETS
      .map(key => {
        const before = Array.isArray(applied[key]) ? applied[key] : []
        const after = state[key]
        const added = after.filter(p => !before.includes(p)).length
        const removed = before.filter(p => !after.includes(p)).length
        const reordered = added === 0 && removed === 0
          && before.length === after.length
          && before.length > 1
          && before.some((p, i) => p !== after[i])
        return {
          label: t(key === 'prio' ? 'filterPrio' : key === 'blacklist' ? 'filterBlack' : 'filterWhite'),
          added,
          removed,
          reordered,
        }
      })
      .filter(row => row.added > 0 || row.removed > 0 || row.reordered)
  }, [applied, state, t])

  /** One diff row as display text ("+2 Priority", "−1 Black", "Reordered"). */
  const diffText = (row: DiffRow): string => {
    const parts: string[] = []
    if (row.added > 0) parts.push(`+${row.added} ${row.label}`)
    if (row.removed > 0) parts.push(`−${row.removed} ${row.label}`)
    if (row.reordered) parts.push(t('diffReordered'))
    return parts.join(' ')
  }

  const move = useCallback((list: string[], from: number, delta: number): string[] => {
    const to = from + delta
    if (to < 0 || to >= list.length) return list
    const next = [...list]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    return next
  }, [])

  const removeFrom = (key: Target, index: number): void => {
    const next = state[key].filter((_, i) => i !== index)
    onChange({ ...state, [key]: next })
    // The refusal named a path that may be the one just removed.
    setAddNote(undefined)
  }

  const add = (key: Target, path: string): void => {
    const value = path.trim()
    if (value === '') return
    if (state.prio.includes(value) || state.blacklist.includes(value) || state.whitelist.includes(value)) {
      // A duplicate add is refused out loud: the draft stays for correction,
      // and the note names the list that already holds the path.
      const holder = state.prio.includes(value) ? 'filterPrio' : state.blacklist.includes(value) ? 'filterBlack' : 'filterWhite'
      setAddNote(t('duplicateSkill').replace('{list}', t(holder)))
      return
    }
    onChange({ ...state, [key]: [...state[key], value] })
    setDraft('')
    setAddNote(undefined)
  }

  /** Combobox options: recent hits not already in any list, filtered by the
   *  typed text (name or path, case-insensitive). */
  const options = useMemo(() => {
    const query = draft.trim().toLowerCase()
    const pool = suggestions.filter(s =>
      !state.prio.includes(s.path) && !state.blacklist.includes(s.path) && !state.whitelist.includes(s.path))
    const matches = query === ''
      ? pool
      : pool.filter(s => s.name.toLowerCase().includes(query) || s.path.toLowerCase().includes(query))
    return matches.slice(0, 6)
  }, [suggestions, state, draft])

  const pick = (path: string): void => {
    add(target, path)
    setOpen(false)
    setActiveIndex(-1)
  }

  const onPickerKeyDown = (event: React.KeyboardEvent): void => {
    // IME composition: arrows and Enter belong to the candidate window until
    // the composition commits; intercepting them breaks zh input.
    if (event.nativeEvent.isComposing) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex(i => Math.min(i + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (open && activeIndex >= 0 && options[activeIndex] !== undefined) pick(options[activeIndex].path)
      else if (draft.trim() !== '') add(target, draft)
    } else if (event.key === 'Escape') {
      if (open) { event.stopPropagation(); setOpen(false); setActiveIndex(-1) }
    }
  }

  const targetLabel = (key: Target): string =>
    t(key === 'prio' ? 'filterPrio' : key === 'blacklist' ? 'filterBlack' : 'filterWhite')

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
                  <code className={css.path} title={path}>{path}</code>
                  <span className={css.controls}>
                    <button type="button" className={css.ctl} disabled={index === 0}
                      onClick={() => onChange({ ...state, prio: move(state.prio, index, -1) })}
                      aria-label={t('moveUp')}><IconChevronUp /></button>
                    <button type="button" className={css.ctl}
                      disabled={index === state.prio.length - 1}
                      onClick={() => onChange({ ...state, prio: move(state.prio, index, 1) })}
                      aria-label={t('moveDown')}><IconChevronDown /></button>
                    <button type="button" className={css.ctl} onClick={() => removeFrom('prio', index)}
                      aria-label={t('remove')}><IconClose /></button>
                  </span>
                </li>
              ))}
            </ol>
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
                  <code className={css.path} title={path}>{path}</code>
                  <span className={css.controls}>
                    <button type="button" className={css.ctl} onClick={() => removeFrom('blacklist', index)}
                      aria-label={t('remove')}><IconClose /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
      </section>

      <section className={css.block}>
        <h3 className={css.heading}>{t('whitelistTitle')}</h3>
        <p className={css.hint}>{t('whitelistHint')}</p>
        {whitelistOnly && state.whitelist.length === 0 && (
          <p className={css.warn} role="alert">{t('whitelistEmptyWarn')}</p>
        )}

        {state.whitelist.length === 0
          ? <p className={css.empty}>{t('whitelistEmpty')}</p>
          : (
            <ul className={css.list}>
              {state.whitelist.map((path, index) => (
                <li className={css.row} key={path}>
                  <code className={css.path} title={path}>{path}</code>
                  <span className={css.controls}>
                    <button type="button" className={css.ctl} onClick={() => removeFrom('whitelist', index)}
                      aria-label={t('remove')}><IconClose /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
      </section>

      {/* The one canonical add affordance: typeahead over the explorer's
          recent hits plus a list-target choice. */}
      <section className={css.block}>
        <h3 className={css.heading} id="dshas-add-heading">{t('priorityAddManual')}</h3>
        <div className={css.addRow}>
          <div className={css.combo}>
            <input
              id="dshas-combo-input"
              className={css.input}
              value={draft}
              placeholder={t('pathPlaceholder')}
              role="combobox"
              aria-labelledby="dshas-add-heading"
              aria-expanded={open && options.length > 0}
              aria-controls="dshas-combo-list"
              aria-autocomplete="list"
              aria-activedescendant={open && activeIndex >= 0 && options[activeIndex] !== undefined ? `dshas-combo-opt-${activeIndex}` : undefined}
              autoComplete="off"
              spellCheck={false}
              onChange={e => { setDraft(e.target.value); setOpen(true); setActiveIndex(-1); setAddNote(undefined) }}
              onFocus={() => setOpen(true)}
              onBlur={() => { setOpen(false); setActiveIndex(-1) }}
              onKeyDown={onPickerKeyDown}
            />
            {open && options.length > 0 && (
              <ul className={css.options} id="dshas-combo-list" role="listbox">
                {options.map((option, index) => (
                  <li key={option.path} role="presentation">
                    <button
                      type="button"
                      role="option"
                      id={`dshas-combo-opt-${index}`}
                      aria-selected={index === activeIndex}
                      className={index === activeIndex ? css.optionOn : css.option}
                      onMouseDown={(event) => { event.preventDefault(); pick(option.path) }}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      {option.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {open && options.length === 0 && suggestions.length > 0 && draft.trim() !== '' && (
              <p className={css.noMatch} role="status">{t('noMatch')}</p>
            )}
          </div>
          <div className={css.segGroup} role="radiogroup" aria-label={t('targetLabel')}>
            {TARGETS.map(key => (
              <label key={key} className={target === key ? css.segOn : css.seg}>
                <input
                  type="radio"
                  name="dshas-target"
                  checked={target === key}
                  onChange={() => { setTarget(key); setAddNote(undefined) }}
                />
                {targetLabel(key)}
              </label>
            ))}
          </div>
        </div>
        {addNote !== undefined && <p className={css.warn} role="alert">{addNote}</p>}
        <p className={css.hint}>{t('manualHint')}</p>
      </section>

      {onApply !== undefined && (
        <div className={css.actions}>
          <button
            type="button"
            className={saveFailed ? css.danger : css.primary}
            disabled={!isDirty || saving}
            onClick={() => { setSaving(true); void onApply().finally(() => setSaving(false)) }}
          >
            {saving ? <IconSpinner /> : saveFailed ? t('retry') : t('save')}
          </button>
          {onDiscard !== undefined && (
            <button
              type="button"
              className={css.button}
              disabled={!isDirty || saving}
              onClick={onDiscard}
            >
              {t('priorityDiscard')}
            </button>
          )}
          <span className={css.grow} />
          {isDirty && diff.length > 0 && (
            <span className={css.diff}>{diff.map(diffText).join(' · ')}</span>
          )}
          <span className={css.state} aria-live="polite">
            {saveFailed
              ? t('prioritySaveFailed')
              : isDirty
                ? (diff.length > 0
                    ? <>
                        {t('priorityUnsaved')}
                        {/* The counts are already visible in the diff span;
                            the live region repeats them for AT only. */}
                        <span className={css.vh}>: {diff.map(diffText).join(' · ')}</span>
                      </>
                    : t('priorityUnsaved'))
                : t('prioritySaved')}
          </span>
        </div>
      )}
    </div>
  )
}
