/**
 * Details-panel body for the selected Tool call: a rich card for `skill`
 * picks and a safe generic fallback for every other tool. The
 * `conversation.details.tool` slot is `single`, so this one registration
 * replaces the shipped Tool details renderer for all tools; the generic
 * fallback carries what the shipped no-registration fallback shows (tool
 * name, arguments, running state, output text, error) so no other tool
 * loses its details body.
 */

import type { ReactNode } from 'react'
import { en } from './locales.ts'
import css from './SkillPickDetails.module.css'

/** Localized copy seat for the details card. */
type Translate = (key: keyof typeof en) => string

/** Structural slice of a running call — the fields this card reads. */
interface RunningToolBlock {
  name: string
  argsRaw: string
}

/** Structural slice of a settled call — the fields this card reads. */
interface ToolResultBlock {
  kind: 'tool-result'
  /** Call head; null when window truncation left the call outside. */
  call: { name: string; argsRaw: string } | null
  /** Unix epoch ms of the paired tool/call; null while running. */
  callTime: number | null
  /** Unix epoch ms of the result event. */
  time: number
  content: readonly unknown[]
  isError: boolean
  error?: { name: string; code: string }
}

/** Owner props of the `conversation.details.tool` slot plus the copy seat. */
interface SkillPickDetailsProps {
  /** Running or settled call block; `unknown` keeps a malformed block non-fatal. */
  block: unknown
  /** Workspace root from the owner; reserved for path rendering. */
  cwd: unknown
  /** Copy seat bound to the plugin's dictionary namespace. */
  t: Translate
}

/** Longest rendered arguments text before truncation in the generic fallback. */
const ARGS_LIMIT = 2000

/**
 * Render the selected call: the skill card for `skill` picks, the generic
 * fallback for every other tool, and a one-line placeholder when the block
 * itself is unusable.
 * @param props - call block, workspace root, and the copy seat.
 * @returns the details output body.
 */
export function SkillPickDetails(props: SkillPickDetailsProps): ReactNode {
  const { block, t } = props
  if (block === null || typeof block !== 'object') return <div className={css.root}><p className={css.fallback}>{t('detailUnknownTool')}</p></div>

  const result = isResultBlock(block) ? block : null
  const running = result === null && isRunningBlock(block) ? block : null
  if (result === null && running === null) return <div className={css.root}><p className={css.fallback}>{t('detailUnknownTool')}</p></div>

  const toolName = result ? (result.call === null ? undefined : result.call.name) : running?.name
  const argsRaw = result ? (result.call === null ? undefined : result.call.argsRaw) : running?.argsRaw
  const pretty = prettyJson(argsRaw)
  const duration = result === null ? undefined : formatDuration(result, t)

  if (toolName !== 'skill') {
    return (
      <div className={css.root}>
        <div className={css.head}>
          <p className={css.name}>{toolName ?? t('detailUnknownTool')}</p>
          {result === null
            ? <span className={css.stateRunning}>{t('detailRunning')}</span>
            : duration !== undefined ? <span className={css.duration}>{duration}</span> : null}
        </div>
        {pretty !== undefined ? <pre className={css.pre}>{truncate(pretty, t('detailTruncated'))}</pre> : null}
        {result !== null ? (
          <pre className={css.pre} data-error={result.isError || undefined}>
            {resultText(result.content)}
          </pre>
        ) : null}
        {result !== null && result.isError ? <p className={css.fallback} role="alert">{errorLine(result, t)}</p> : null}
      </div>
    )
  }

  const skillName = parseSkillName(argsRaw)
  return (
    <div className={css.root}>
      <div className={css.head}>
        <p className={css.name}>{skillName !== undefined ? skillName : t('detailUnknownName')}</p>
        {result === null
          ? <span className={css.stateRunning}>{t('detailRunning')}</span>
          : result.isError
            ? <span className={css.stateError}>{t('detailError')}</span>
            : duration !== undefined ? <span className={css.duration}>{duration}</span> : null}
      </div>
      {pretty !== undefined ? (
        <section>
          <p className={css.sectionLabel}>{t('detailArgs')}</p>
          <pre className={css.pre}>{pretty}</pre>
        </section>
      ) : null}
      {result !== null && result.isError ? <p className={css.fallback} role="alert">{errorLine(result, t)}</p> : null}
      {result !== null ? (
        <section>
          <p className={css.sectionLabel}>{t('detailOutput')}</p>
          <pre className={css.pre} data-error={result.isError || undefined}>
            {resultText(result.content)}
          </pre>
        </section>
      ) : null}
    </div>
  )
}

/** Settled-call discriminator: only the result node carries `kind`. */
function isResultBlock(value: object): value is ToolResultBlock {
  return (value as { kind?: unknown }).kind === 'tool-result'
}

/** Running-call discriminator: its `name` and `argsRaw` are both strings. */
function isRunningBlock(value: object): value is RunningToolBlock {
  const candidate = value as Partial<RunningToolBlock>
  return typeof candidate.name === 'string' && typeof candidate.argsRaw === 'string'
}

/**
 * Extract the skill name from the call arguments, accepting both the JSON
 * form the tool schema produces and a bare name.
 * @param argsRaw - verbatim arguments text; may be absent or non-JSON.
 * @returns the skill name, or undefined when nothing name-like is present.
 */
function parseSkillName(argsRaw: string | undefined): string | undefined {
  if (argsRaw === undefined) return undefined
  try {
    const parsed: unknown = JSON.parse(argsRaw)
    const name = parsed !== null && typeof parsed === 'object'
      ? (parsed as { name?: unknown }).name
      : undefined
    if (typeof name === 'string' && name.trim() !== '') return name
  } catch {
    // argsRaw is not JSON; fall through and treat the text itself as the name.
  }
  const trimmed = argsRaw.trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * Re-render the arguments as indented JSON, or verbatim when they are not
 * JSON (a parse failure must not hide the arguments).
 * @param argsRaw - verbatim arguments text; may be absent.
 * @returns pretty JSON, verbatim text, or undefined when there is nothing to show.
 */
function prettyJson(argsRaw: string | undefined): string | undefined {
  if (argsRaw === undefined || argsRaw.trim() === '') return undefined
  try {
    return JSON.stringify(JSON.parse(argsRaw), null, 2)
  } catch {
    return argsRaw
  }
}

/**
 * Flatten the result content blocks to displayable text, mirroring the
 * shipped fallback: text blocks verbatim, everything else as JSON.
 * @param content - result content blocks; tolerated non-array input yields ''.
 * @returns the joined text ('' when the result carries no content).
 */
function resultText(content: readonly unknown[]): string {
  if (!Array.isArray(content)) return ''
  const parts: string[] = []
  for (const block of content) {
    const text = block !== null && typeof block === 'object'
      && (block as { type?: unknown }).type === 'text'
      ? (block as { text?: unknown }).text
      : undefined
    if (typeof text === 'string') {
      parts.push(text)
      continue
    }
    try {
      parts.push(JSON.stringify(block, null, 2) ?? '')
    } catch {
      // The block is circular or otherwise unstringable; a stable placeholder
      // is the only lossless-enough rendering available.
      parts.push(String(block))
    }
  }
  return parts.join('\n')
}

/**
 * Human-readable wall-clock duration of the settled call.
 * @param result - the settled block whose call and result events are timed.
 * @param t - copy seat for the unit symbols.
 * @returns the formatted duration, or undefined when the call time is absent.
 */
function formatDuration(result: ToolResultBlock, t: Translate): string | undefined {
  if (result.callTime === null) return undefined
  const start = Number(result.callTime)
  const end = Number(result.time)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return undefined
  const ms = Math.max(0, end - start)
  if (ms < 1000) return `${Math.round(ms)} ${t('unitMs')}`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} ${t('unitS')}`
  return `${Math.floor(ms / 60_000)} ${t('unitMin')} ${Math.round((ms % 60_000) / 1000)} ${t('unitS')}`
}

/**
 * Truncate overlong arguments text for the generic fallback.
 * @param text - the rendered arguments.
 * @param label - localized truncation marker.
 * @returns the text unchanged within the limit, else the head plus the marker.
 */
function truncate(text: string, label: string): string {
  return text.length <= ARGS_LIMIT ? text : `${text.slice(0, ARGS_LIMIT)}… ${label}`
}

/**
 * Error line for a failed call: badge text plus the recorded error identity.
 * @param result - the settled block carrying the error.
 * @param t - copy seat for the badge label.
 * @returns the full error line.
 */
function errorLine(result: ToolResultBlock, t: Translate): string {
  const detail = result.error !== undefined ? ` — ${result.error.name}: ${result.error.code}` : ''
  return `${t('detailError')}${detail}`
}
