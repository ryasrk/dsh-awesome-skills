# Design: Fix Pass — dsh-awesome-skills client UI

Date: 2026-09-01
Source: Impeccable critique (dual-agent), score 25/40. Snapshot:
`~/.impeccable/critique/2026-09-01T04-54-08Z__dsh-awesome-skills-src-client-skillexplorer-tsx.md`

## Goal

Fix all 5 priority issues (1×P0, 3×P1, 1×P2) plus minor observations from the
critique, in three sequential work packages, each reviewed by a separate
code-reviewer subagent before the next begins.

## Constraints

- Preserve the host-native look: all styling continues through `--dsw-alias-*`
  / `--dsw-font-*` tokens. No new raw hex, no `!important`, no inline styles.
- Keep the staged/applied architecture in `SkillSection` as the single writer
  to the priority route.
- en/zh dictionaries stay key-for-key mirrors.
- Detector (`detect.mjs`) must stay clean; reduced-motion guards on any new
  keyframe animation.
- YAGNI: no virtualization, no drag-reorder, no new tabs; the critique's
  structural questions (tab consolidation, context preview) are explicitly out
  of scope.

## Work Package 1 — Bugs & Trust (audit + harden + clarify)

Files: `SettingsCard.tsx`, `SkillSection.tsx`, `SkillExplorer.tsx`,
`SkillExplorer.module.css`, `locales.ts`

1. P0: add `scopeLabel`/`scopeAll`/`scopeWhitelist`/`scopeHint` to the
   SettingsCard DICT (en + zh) and `noResultsTitle` to `en`; remove the
   `as keyof` casts so the compiler catches missing keys.
2. P1 silent failures:
   - `savePriority` renders an error line + Retry instead of swallowing
     network errors and `ok:false`.
   - Clipboard copy distinguishes "Copied" from "Copy failed" (reuse the
     existing `copied` locale key; add `copyFailed`).
   - Initial `/priority` load failure sets a visible error state and blocks
     optimistic assigns until `applied` is truly loaded (anti lost-update).
   - `setPending(false)` in the save success branch; sequence-guard racing
     assign POSTs.
   - SettingsCard partial-commit: surface which fields failed via the
     existing `failed` alert rather than a silent partial state.
3. P1 a11y state: `aria-pressed` on filter buttons and membership chips;
   visually-hidden text for the pending dot (tab `aria-label`); wrap loading,
   result count, and save status in `aria-live="polite"`.

## Work Package 2 — Priority Surface Consolidation (distill + clarify)

Files: `PrioritySkills.tsx`, `PrioritySkills.module.css`, `SkillSection.tsx`
(props for discard), `locales.ts`

1. Replace the three `<select>` pickers with one typeahead/combobox offering
   recent explorer hits plus a list-target choice; the manual-add input stays
   as the direct-path route.
2. Add a Discard button to the Priority action band (mirrors SettingsCard),
   enabled while dirty; `SkillSection` supplies the reset.
3. Staged diff line at Save: "+2 Priority · −1 Blacklisted" (aria-live).
4. Duplicate-add guard becomes an inline message, not a silent no-op; draft
   preserved for correction.
5. whitelist-only + empty whitelist renders an inline warning in Priority and
   the Search empty state links the cause to the Config tab.
6. Label consistency: one noun system (Boost/Blacklisted/Whitelisted chips),
   localize zh `'+ Prio'`.

## Work Package 3 — Cleanup & Polish (polish)

Files: CSS modules, `locales.ts`, `SkillExplorer.tsx`

1. Verify-by-grep then delete dead CSS: `.pin`, `.divider`,
   `.configHeading`, `.mode*`, `.output`, `.truncated`, `.footer`, and
   `craft.module.css` (imported by nothing).
2. Remove unused locale keys (`pinnedBadge`; keep `copied` — WP1 uses it).
3. Replace the `.hint` magic negative margin with explicit sibling spacing.
4. Result score to one decimal.

## Review protocol

After each WP: a code-reviewer subagent reviews that WP's diff; findings are
fixed before the next WP starts. Commits follow the repo style
(`fix:`/`design:`), one per WP.

## Final verification

`tsc` typecheck, client bundle build (`tsdown.client.ts`), `detect.mjs --json`
clean over `src/client/`, and a short re-critique to confirm the score moves
out of the Acceptable band.
