/**
 * The plugin's settings card in Settings → Plugins → Plugin configuration.
 *
 * Follows the shared card contract: staged edits, one save, an overridden
 * badge per field, and a render-nothing when the namespace is unavailable
 * (a deployment without this plugin's settings section shows no trace).
 */

import { useEffect, useState } from 'react'
import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import { en, zh } from './locales.ts'

/** Namespace both the Host registration and this card key themselves to. */
const NS = 'dsh-awesome-skills'

/** One card field's rendering state. */
interface FieldState {
  draft: string
  overridden: boolean
}

/** Fields the card edits, in display order. */
const FIELDS = [
  { key: 'semantic', labelKey: 'fieldSemantic', hintKey: 'fieldSemanticHint', type: 'toggle' },
  { key: 'defaultK', labelKey: 'fieldDefaultK', hintKey: 'fieldDefaultKHint', type: 'number' },
  { key: 'pool', labelKey: 'fieldPool', hintKey: 'fieldPoolHint', type: 'number' },
  { key: 'wLex', labelKey: 'fieldWLex', hintKey: 'fieldWLexHint', type: 'number' },
  { key: 'wGram', labelKey: 'fieldWGram', hintKey: 'fieldWGramHint', type: 'number' },
  { key: 'autoRoute', labelKey: 'fieldAutoRoute', hintKey: 'fieldAutoRouteHint', type: 'toggle' },
] as const

/** The card's own props. */
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
  const [drafts, setDrafts] = useState<Record<string, FieldState>>({})
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => scope.subscribe(() => { setSnapshot(scope.getSnapshot()) }), [scope])

  // Locale: pick the dictionary matching the browser's active language, else
  // English. The card registers no namespace of its own because its strings
  // are static once shipped.
  const t = (key: keyof typeof en): string => {
    void zh
    return en[key]
  }

  const value = snapshot.value
  const user = snapshot.user as Record<string, unknown> | undefined
  if (snapshot.status !== 'ready' || value === undefined) return null

  const field = (key: string): FieldState => {
    const staged = drafts[key]
    const current = value[key]
    return staged ?? {
      draft: current === undefined ? '' : String(current),
      overridden: user?.[key] !== undefined,
    }
  }

  const dirty = FIELDS.some(f => f.key in drafts)
  const anyInvalid = FIELDS.some(f => {
    const d = drafts[f.key]?.draft
    if (d === undefined) return false
    return !isValid(f.type, d)
  })

  const stage = (key: string, draft: string): void => {
    setFailed(false)
    setDrafts(prev => ({ ...prev, [key]: { draft, overridden: prev[key]?.overridden ?? user?.[key] !== undefined } }))
  }

  const save = async (): Promise<void> => {
    setSaving(true)
    setFailed(false)
    try {
      for (const f of FIELDS) {
        const staged = drafts[f.key]
        if (staged === undefined) continue
        if (!isValid(f.type, staged.draft)) continue
        await scope.set(f.key, parse(f.type, staged.draft))
      }
      setDrafts({})
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  const discard = (): void => { setDrafts({}); setFailed(false) }

  return (
    <div>
      <h4>{t('cardTitle')}</h4>
      <p>{t('cardDescription')}</p>
      {FIELDS.map(f => {
        const state = field(f.key)
        return (
          <label key={f.key}>
            <span>{t(f.labelKey as keyof typeof en)}</span>
            {f.type === 'toggle'
              ? <input type="checkbox" checked={state.draft === 'true'} onChange={e => stage(f.key, e.target.checked ? 'true' : 'false')} />
              : <input type="text" value={state.draft} onChange={e => stage(f.key, e.target.value)} />}
            <small>{t(f.hintKey as keyof typeof en)}</small>
            {state.overridden && <em>overridden</em>}
          </label>
        )
      })}
      <button disabled={!dirty || anyInvalid || saving || !snapshot.writable} onClick={() => { void save() }}>Save</button>
      <button disabled={!dirty || saving} onClick={discard}>Discard</button>
      {failed && <span role="alert">Save failed — retry</span>}
    </div>
  )
}

function isValid(type: 'toggle' | 'number', draft: string): boolean {
  if (type === 'toggle') return draft === 'true' || draft === 'false'
  const n = Number(draft)
  return draft !== '' && Number.isFinite(n)
}

function parse(type: 'toggle' | 'number', draft: string): unknown {
  return type === 'toggle' ? draft === 'true' : Number(draft)
}
