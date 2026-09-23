import type { ReactNode } from 'react'
import { Icon } from './Icon'

export function StatTile({
  label,
  value,
  suffix,
  badge,
  badgeTone = 'primary',
  progress,
  progressTone = 'primary',
  footerLeft,
  footerRight
}: {
  label: string
  value: string
  suffix?: string
  badge?: string
  badgeIcon?: string
  badgeTone?: 'primary' | 'tertiary' | 'secondary'
  progress?: number
  progressTone?: 'primary' | 'tertiary' | 'secondary'
  footerLeft?: ReactNode
  footerRight?: ReactNode
}): JSX.Element {
  const barColor =
    progressTone === 'tertiary'
      ? 'bg-tertiary-fixed-dim'
      : progressTone === 'secondary'
        ? 'bg-secondary'
        : 'bg-primary-container'

  const badgeColor =
    badgeTone === 'tertiary'
      ? 'text-tertiary-fixed-dim bg-error-container/40'
      : badgeTone === 'secondary'
        ? 'text-secondary bg-secondary/10'
        : 'text-primary bg-primary-container/10'

  return (
    <div className="relative overflow-hidden rounded-xl bg-surface-container-low/90 border border-surface-variant/30 p-4 flex flex-col justify-between hover:bg-surface-container-high transition-all">
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
          {label}
        </span>
        {badge && (
          <span className={`font-label-caps text-label-caps px-2 py-0.5 rounded ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="my-3 flex items-baseline gap-2">
        <span className="font-code-metric-lg text-code-metric-lg font-bold tracking-tight">{value}</span>
        {suffix && <span className="font-body-sm text-body-sm text-on-surface-variant">{suffix}</span>}
      </div>
      <div className="space-y-1.5">
        {progress !== undefined && (
          <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} rounded-full transition-all`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
        <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant">
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </div>
      </div>
    </div>
  )
}

export function TileIcon({ name }: { name: string }): JSX.Element {
  return <Icon name={name} size={16} />
}
