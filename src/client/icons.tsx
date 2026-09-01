/**
 * Authored SVG icons for the plugin's controls, in one consistent stroke and
 * weight. The craft floor bans Unicode glyphs standing in for an icon system:
 * arrows and × marks read as text, inherit font metrics, and cannot be
 * stroked to match a real icon set.
 */

import type { JSX } from 'react'

interface IconProps {
  size?: number
}

const base = (size: number): JSX.IntrinsicElements['svg'] => ({
  width: size,
  height: size,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
})

export function IconChevronUp({ size = 14 }: IconProps): JSX.Element {
  return <svg {...base(size)}><path d="M4 10l4-4 4 4" /></svg>
}

export function IconChevronDown({ size = 14 }: IconProps): JSX.Element {
  return <svg {...base(size)}><path d="M4 6l4 4 4-4" /></svg>
}

export function IconClose({ size = 12 }: IconProps): JSX.Element {
  return <svg {...base(size)}><path d="M4 4l8 8M12 4l-8 8" /></svg>
}

export function IconSpinner({ size = 12 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} className="dshas-spin">
      <path d="M8 1.5a6.5 6.5 0 1 1-6.5 6.5" />
    </svg>
  )
}

export function IconSearch({ size = 14 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L13.5 13.5" />
    </svg>
  )
}
