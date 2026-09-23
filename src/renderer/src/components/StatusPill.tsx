import { useLiveStatus } from '../hooks/useLiveStatus'
import { formatClock } from '../lib/format'
import { Icon } from './Icon'

export function StatusPill(): JSX.Element {
  const status = useLiveStatus()

  const state = !status.tracking
    ? { label: 'Paused', color: 'text-on-surface-variant', dot: 'bg-outline' }
    : status.isAfk
      ? { label: 'Idle', color: 'text-secondary', dot: 'bg-secondary' }
      : { label: 'Tracking', color: 'text-primary', dot: 'bg-primary-container' }

  return (
    <div className="flex items-center gap-space-md">
      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container">
        <Icon
          name={status.browserConnected ? 'link' : 'link_off'}
          size={15}
          className={status.browserConnected ? 'text-primary' : 'text-on-surface-variant'}
        />
        <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          {status.browserConnected ? 'Browser Linked' : 'No Extension'}
        </span>
      </div>
      <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container">
        <span className={`relative flex h-2 w-2`}>
          {!status.isAfk && status.tracking && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${state.dot} opacity-75`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${state.dot}`} />
        </span>
        <span className={`font-label-caps text-label-caps uppercase tracking-wider font-semibold ${state.color}`}>
          {state.label}
        </span>
        {status.current && !status.isAfk && (
          <span className="font-code-data text-code-data text-on-surface-variant hidden lg:inline">
            {formatClock(status.activeSessionSec)} · {status.current.domain ?? status.current.appName}
          </span>
        )}
      </div>
    </div>
  )
}
