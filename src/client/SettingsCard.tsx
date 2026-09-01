/**
 * The plugin's settings card in Settings → Plugins → Plugin configuration.
 *
 * Layout follows the harness's own plugin-card and field conventions (see
 * SettingsCard.module.css): a title band, a stack of label-over-control rows
 * separated by hairlines, then an action band — three visual bands, so the
 * six fields scan instead of reading as a wall of boxes. Numeric fields are
 * bounded inputs so an out-of-range value is unrepresentable rather than
 * something a save has to reject; booleans are switches.
 */

import { useEffect, useState } from 'react'
import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import css from './SettingsCard.module.css'
import { IconSpinner } from './icons.tsx'

/** Namespace both the Host registration and this card key themselves to. */
const NS = 'dsh-awesome-skills'

/** One field's staged state: draft text plus whether it started overridden. */
interface FieldState {
  draft: string
  overridden: boolean
}

/**
 * Field descriptor: key, copy keys, control kind, and numeric bounds.
 * Both `key` and the copy keys are typed so a missing dictionary key or a
 * key/FieldKey mismatch is a compile error, not a blank control at runtime.
 */
type FieldDescriptor = {
  key: FieldKey
  label: keyof typeof DICT['en']
  hint: keyof typeof DICT['en']
  kind: 'toggle' | 'number' | 'scope'
  min?: number
  max?: number
  step?: number
}

const FIELDS: readonly FieldDescriptor[] = [
  { key: 'semantic', label: 'fieldSemantic', hint: 'fieldSemanticHint', kind: 'toggle' },
  { key: 'defaultK', label: 'fieldDefaultK', hint: 'fieldDefaultKHint', kind: 'number', min: 1, max: 25, step: 1 },
  { key: 'pool', label: 'fieldPool', hint: 'fieldPoolHint', kind: 'number', min: 50, max: 3000, step: 50 },
  { key: 'wLex', label: 'fieldWLex', hint: 'fieldWLexHint', kind: 'number', min: 0, max: 1, step: 0.05 },
  { key: 'wGram', label: 'fieldWGram', hint: 'fieldWGramHint', kind: 'number', min: 0, max: 1, step: 0.05 },
  { key: 'autoRoute', label: 'fieldAutoRoute', hint: 'fieldAutoRouteHint', kind: 'toggle' },
  { key: 'whitelistOnly', label: 'scopeLabel', hint: 'scopeHint', kind: 'scope' },
]

type FieldKey = 'semantic' | 'defaultK' | 'pool' | 'wLex' | 'wGram' | 'autoRoute' | 'whitelistOnly'

/** Localized copy. zh mirrors en key-for-key so a missing key is a typo, not a gap. */
const DICT: { en: Record<string, string>; zh: Record<keyof typeof DICT['en'], string> } = {
  en: {
    cardTitle: 'dsh-awesome-skills',
    cardDescription: 'Semantic search over the local 16,000-skill corpus',
    fieldSemantic: 'Semantic lane',
    fieldSemanticHint: 'Vector similarity (wasm). Off falls back to lexical + n-gram only',
    fieldDefaultK: 'Results per search',
    fieldDefaultKHint: 'How many hits search() returns (1-25)',
    fieldPool: 'Candidate pool',
    fieldPoolHint: 'Candidates re-ranked before the top results are chosen (50-3000)',
    fieldWLex: 'Lexical weight',
    fieldWLexHint: 'Weight of the keyword-overlap lane (0-1)',
    fieldWGram: 'N-gram weight',
    fieldWGramHint: 'Weight of the character-trigram lane (0-1)',
    fieldAutoRoute: 'Keep skill-router in step',
    fieldAutoRouteHint: 'Rewrite the installed skill-router when these values change',
    scopeLabel: 'Search scope',
    scopeAll: 'All skills',
    scopeWhitelist: 'Whitelist only',
    scopeHint: 'Whitelist only hides everything not whitelisted — no effect while the whitelist is empty',
    save: 'Save', discard: 'Discard', saved: 'Saved', failed: 'Save failed — retry',
    overridden: 'overridden', revert: 'revert',
  },
  zh: {
    cardTitle: 'dsh-awesome-skills',
    cardDescription: '对本地 1.6 万技能语料进行语义检索',
    fieldSemantic: '语义通道',
    fieldSemanticHint: '向量相似度（wasm）。关闭后仅用词法 + n-gram',
    fieldDefaultK: '每次搜索结果数',
    fieldDefaultKHint: 'search() 返回的条数（1-25）',
    fieldPool: '候选池大小',
    fieldPoolHint: '重排前的候选数量（50-3000）',
    fieldWLex: '词法权重',
    fieldWLexHint: '关键词重合通道的权重（0-1）',
    fieldWGram: 'n-gram 权重',
    fieldWGramHint: '字符三元组通道的权重（0-1）',
    fieldAutoRoute: '同步 skill-router',
    fieldAutoRouteHint: '这些值变化时重写已安装的 skill-router',
    scopeLabel: '搜索范围',
    scopeAll: '全部技能',
    scopeWhitelist: '仅白名单',
    scopeHint: '“仅白名单”会隐藏所有未列入白名单的技能 — 白名单为空时无效果',
    save: '保存', discard: '放弃', saved: '已保存', failed: '保存失败 — 重试',
    overridden: '已覆盖', revert: '还原',
  },
}

export interface SettingsCardProps {
  /** The bound settings scope for this plugin's namespace. */
  scope: SettingsScope<Record<string, unknown>>
}

/**
 * Render the plugin's configuration card.
 * @param props - the bound settings scope.
 */
export function SettingsCard(props: SettingsCardProps) {
  const { scope } = props
  const [snapshot, setSnapshot] = useState<SettingsScopeSnapshot<Record<string, unknown>>>(
    () => scope.getSnapshot(),
  )
  const [drafts, setDrafts] = useState<Partial<Record<FieldKey, FieldState>>>({})
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [savedTick, setSavedTick] = useState(false)

  useEffect(() => scope.subscribe(() => { setSnapshot(scope.getSnapshot()) }), [scope])

  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'en'
  const dict = lang.startsWith('zh') ? DICT.zh : DICT.en
  const t = (key: keyof typeof DICT['en']): string => dict[key]

  const value = snapshot.value
  const user = (snapshot.user ?? {}) as Record<string, unknown>
  if (snapshot.status !== 'ready' || value === undefined || typeof value !== 'object') return null

  const stateOf = (key: FieldKey): FieldState => {
    const staged = drafts[key]
    if (staged !== undefined) return staged
    const current = value[key]
    return { draft: current === undefined ? '' : String(current), overridden: user?.[key] !== undefined }
  }

  const dirty = FIELDS.some(f => drafts[f.key] !== undefined)
  const invalid = FIELDS.some(f => {
    if (f.kind !== 'number') return false
    const d = drafts[f.key]?.draft
    return d !== undefined && !validNumber(d, f.min, f.max)
  })

  const stage = (key: FieldKey, draft: string, wasOverridden: boolean): void => {
    setFailed(false)
    setSavedTick(false)
    setDrafts(prev => ({ ...prev, [key]: { draft, overridden: wasOverridden } }))
  }

  const save = async (): Promise<void> => {
    setSaving(true); setFailed(false)
    try {
      for (const f of FIELDS) {
        const staged = drafts[f.key]
        if (staged === undefined) continue
        if (f.kind === 'toggle' || f.kind === 'scope') {
          const next = staged.draft === 'true'
          if (next === value[f.key]) continue
          await scope.set(f.key, next)
        } else {
          if (!validNumber(staged.draft, f.min, f.max)) continue
          const n = Number(staged.draft)
          if (n === value[f.key]) continue
          await scope.set(f.key, n)
        }
      }
      setDrafts({})
      setSavedTick(true)
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  const discard = (): void => { setDrafts({}); setFailed(false); setSavedTick(false) }

  // Revert drops one field's staged edit: the stored value wins again.
  const revert = (key: FieldKey): void => {
    setDrafts(prev => { const next = { ...prev }; delete next[key]; return next })
  }

  return (
    <div className={css.card}>
      <div className={css.header}>
        <div className={css.name}>{t('cardTitle')}</div>
        <div className={css.description}>{t('cardDescription')}</div>
      </div>

      <div className={css.body}>
        {FIELDS.map(f => {
          const state = stateOf(f.key)
          const isInvalid = f.kind === 'number' && drafts[f.key] !== undefined
            && !validNumber(state.draft, f.min, f.max)
          const id = `dshas-${f.key}`
          return (
            <div className={css.field} key={f.key}>
              <div className={css.head}>
                <label className={css.label} htmlFor={id}>{t(f.label)}</label>
                {state.overridden && <span className={css.badge}>{t('overridden')}</span>}
                {drafts[f.key] !== undefined && (
                  <button type="button" className={css.revert} onClick={() => revert(f.key)}>{t('revert')}</button>
                )}
              </div>

              {f.kind === 'scope' ? (
                <div className={css.segmented} role="radiogroup" aria-label={t('scopeLabel')}>
                  {[
                    { value: 'false', label: t('scopeAll') },
                    { value: 'true', label: t('scopeWhitelist') },
                  ].map(option => (
                    <label key={option.value} className={state.draft === option.value ? css.segOn : css.seg}>
                      <input
                        type="radio"
                        name={`dshas-${f.key}`}
                        checked={state.draft === option.value}
                        disabled={!snapshot.writable || saving}
                        onChange={() => stage(f.key, option.value, state.overridden)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              ) : f.kind === 'toggle' ? (
                <input
                  id={id}
                  type="checkbox"
                  className={css.toggle}
                  role="switch"
                  disabled={!snapshot.writable || saving}
                  checked={state.draft === 'true'}
                  onChange={e => stage(f.key, e.target.checked ? 'true' : 'false', state.overridden)}
                />
              ) : (
                <div className={css.control}>
                  <input
                    id={id}
                    type="number"
                    className={isInvalid ? css.inputInvalid : css.input}
                    disabled={!snapshot.writable || saving}
                    min={f.min} max={f.max} step={f.step}
                    value={state.draft}
                    aria-invalid={isInvalid || undefined}
                    onChange={e => stage(f.key, e.target.value, state.overridden)}
                  />
                </div>
              )}

              {isInvalid
                ? <p className={css.invalid}>{`${t(f.label)}: ${f.min} – ${f.max}`}</p>
                : <p className={css.hint}>{t(f.hint)}</p>}
            </div>
          )
        })}
      </div>

      <div className={css.actions}>
        <button
          type="button"
          className={css.primary}
          disabled={!dirty || invalid || saving || !snapshot.writable}
          onClick={() => { void save() }}
        >
          {saving ? <IconSpinner /> : t('save')}
        </button>
        <button type="button" className={css.button} disabled={!dirty || saving} onClick={discard}>{t('discard')}</button>
        <span className={css.spacer} />
        {failed && <span className={css.alert} role="alert">{t('failed')}</span>}
        {!failed && savedTick && !dirty && <span className={css.saved}>{t('saved')}</span>}
      </div>
    </div>
  )
}

/** A number is valid when it parses, is finite, and sits inside its bounds.
    Bounds are only meaningful on number-kind fields; other kinds pass. */
function validNumber(draft: string, min?: number, max?: number): boolean {
  if (min === undefined || max === undefined) return true
  if (draft.trim() === '') return false
  const n = Number(draft)
  return Number.isFinite(n) && n >= min && n <= max
}
