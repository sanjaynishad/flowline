import type { CategoryTotals, LiveStatus } from '@shared/types'
import { StatTile } from '../StatTile'
import { formatClock, formatDuration, percent } from '../../lib/format'

export function DashboardStats({
  totals,
  totalSec,
  contextSwitches,
  distractionLimitSec,
  distractionLimitMin,
  overDistractionLimit,
  status,
  liveSession
}: {
  totals: CategoryTotals
  totalSec: number
  contextSwitches: number
  distractionLimitSec: number
  distractionLimitMin: number | null
  overDistractionLimit: boolean
  status: LiveStatus
  liveSession: number
}): JSX.Element {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatTile
        label="Deep Work"
        value={formatDuration(totals.productive)}
        suffix="productive"
        progress={percent(totals.productive, totalSec)}
        footerLeft={`${percent(totals.productive, totalSec)}% of tracked`}
      />
      <StatTile
        label="Distraction Time"
        value={formatDuration(totals.distracted)}
        suffix="off-task"
        badge={overDistractionLimit ? 'over limit' : totals.distracted > 0 ? 'flagged' : 'clean'}
        badgeTone="tertiary"
        progress={
          distractionLimitSec > 0
            ? percent(totals.distracted, distractionLimitSec)
            : percent(totals.distracted, totalSec)
        }
        progressTone="tertiary"
        footerLeft={
          distractionLimitSec > 0
            ? `${percent(totals.distracted, distractionLimitSec)}% of ${distractionLimitMin}m limit`
            : `${percent(totals.distracted, totalSec)}% of tracked`
        }
      />
      <StatTile
        label="Context Switches"
        value={String(contextSwitches)}
        suffix="window changes"
        progressTone="secondary"
        progress={Math.min(100, contextSwitches / 1.5)}
        footerLeft="Lower is calmer"
      />
      <StatTile
        label="Active Session"
        value={status.isAfk ? 'Idle' : formatClock(liveSession)}
        suffix={status.current ? `in ${status.current.appName}` : 'no window'}
        badge={status.isAfk ? 'idle' : status.tracking ? 'live' : 'paused'}
        badgeTone={status.isAfk ? 'secondary' : 'primary'}
        footerLeft={status.browserConnected ? 'Browser linked' : 'No extension'}
      />
    </div>
  )
}
