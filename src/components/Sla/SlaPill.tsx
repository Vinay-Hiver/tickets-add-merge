import type { HTMLAttributes } from 'react'
import { Icon } from '../../icons/Icon'
import { slaNames } from './sla'
import type { SlaKind, SlaStatus } from './sla'
import './Sla.css'

export type SlaPillProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  /** Which time the pill is about: first response time (`frt`) or resolution time (`rt`). */
  kind: SlaKind
  /** Where that time stands. Sets the colour. */
  status: SlaStatus
  /** How many items the pill stands for, shown after a dot ("FRT • 2"), for example a ticket's overdue conversations. */
  count?: number
}

const labels: Record<SlaKind, string> = { frt: 'FRT', rt: 'RT' }

export function SlaPill({ kind, status, count, className, ...rest }: SlaPillProps) {
  return (
    <span className={['hot-sla-pill', `hot-sla-pill--${status}`, className].filter(Boolean).join(' ')} role="img" aria-label={`${slaNames[kind]}: ${status}${count ? `, ${count}` : ''}`} {...rest}>
      <Icon name="boltfilled" className="hot-sla-pill__icon" />
      <span aria-hidden="true">{labels[kind]}</span>
      {count !== undefined && <span aria-hidden="true">• {count}</span>}
    </span>
  )
}
