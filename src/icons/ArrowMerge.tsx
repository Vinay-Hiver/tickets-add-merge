import type { SVGProps } from 'react'

/** Tabler "arrow-merge" (the HOT icon set has no merge icon). Drawn on a 24px grid; stroke 2 scales to ~1.3 at 16px, like HOT's 16px icons. */
export function ArrowMerge({ size = 16, ...rest }: Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d="M8 7l4 -4l4 4" />
      <path d="M12 3v5.394a6.737 6.737 0 0 1 -3 5.606a6.737 6.737 0 0 0 -3 5.606v1.394" />
      <path d="M12 3v5.394a6.737 6.737 0 0 0 3 5.606a6.737 6.737 0 0 1 3 5.606v1.394" />
    </svg>
  )
}
