import type { SVGProps } from 'react'

type Props = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & { size?: number }

// Tabler icons named in the Figma file (Tickets Add/Merge 4118:13817 and 4118:14585); the HOT set has neither.
// Drawn on a 24px grid like ArrowMerge, stroke 2 (~1.3 at 16px, like HOT's 16px icons).

/** Tabler "layout-sidebar-right": hides the right panel. */
export function LayoutSidebarRight({ size = 16, ...rest }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
      <path d="M15 4l0 16" />
    </svg>
  )
}

/** Tabler "arrow-bar-to-left": brings the right panel back. */
export function ArrowBarToLeft({ size = 16, ...rest }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d="M10 12l10 0" />
      <path d="M10 12l4 4" />
      <path d="M10 12l4 -4" />
      <path d="M4 4l0 16" />
    </svg>
  )
}
