import { useEffect, useState } from 'react'
import type { DashboardSummary, RangePreset, ActivityEvent } from '@shared/types'
import { rangeFromPreset } from '@shared/range'
import { Card } from '../components/Card'
import { RangeSelector } from '../components/RangeSelector'
import { StatTile } from '../components/StatTile'
import { DonutRing } from '../components/DonutRing'
import { Icon } from '../components/Icon'
import { useRangeQuery } from '../hooks/useRangeQuery'
import { useLiveStatus } from '../hooks/useLiveStatus'
import {
  categoryLabel,
  categoryTextClass,
  formatClock,
  formatDuration,
  formatTime,
  percent
} from '../lib/format'
import type { Category } from '@shared/types'

const CATEGORY_META: { key: Category; sub: string }[] = [
  { key: 'productive', sub: 'Core work & building' },
  { key: 'neutral', sub: 'Comms & admin' },
  { key: 'distracted', sub: 'Entertainment & feeds' }
]

export function Dashboard({
  range,
  onRangeChange
}: {
  range: RangePreset
  onRangeChange: (r: RangePreset) => void
}): JSX.Element {
  const status = useLiveStatus()
  const { data } = useRangeQuery<DashboardSummary>(range, (r) => window.api.getDashboard(r))
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [liveSession, setLiveSession] = useState(status.activeSessionSec)

  useEffect(() => {
    const r = rangeFromPreset(range)
    const load = (): void => {
      window.api.getRecentEvents(r, 12).then(setEvents)
    }

    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [range])

  useEffect(() => {
    setLiveSession(status.activeSessionSec)
    if (status.isAfk || !status.tracking) {
      return
    }

    const id = setInterval(() => setLiveSession((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [status.activeSessionSec, status.isAfk, status.tracking])

  const totals = data?.totals ?? { productive: 0, neutral: 0, distracted: 0 }
  const totalSec = data?.totalTrackedSec ?? 0

  async function handleExport(): Promise<void> {
    await window.api.exportData(rangeFromPreset(range), 'csv')
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-high text-primary shadow-[0_0_12px_rgba(0,240,118,0.18)]">
            <Icon name="sensors" size={20} />
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg tracking-tight font-bold">Live Overview</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {status.tracking
                ? status.isAfk
                  ? 'You are idle — time is paused.'
                  : `Tracking ${status.current?.domain ?? status.current?.appName ?? 'active window'}`
                : 'Tracking paused'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RangeSelector value={range} onChange={onRangeChange} />
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-2 rounded font-label-caps text-label-caps uppercase text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
          >
            <Icon name="file_download" size={16} />
            Export
          </button>
        </div>
      </div>

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
          badge={totals.distracted > 0 ? 'flagged' : 'clean'}
          badgeTone="tertiary"
          progress={percent(totals.distracted, totalSec)}
          progressTone="tertiary"
          footerLeft={`${percent(totals.distracted, totalSec)}% of tracked`}
        />
        <StatTile
          label="Context Switches"
          value={String(data?.contextSwitches ?? 0)}
          suffix="window changes"
          progressTone="secondary"
          progress={Math.min(100, (data?.contextSwitches ?? 0) / 1.5)}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="donut_large" size={20} className="text-primary" />
              <span className="font-headline-md text-headline-md">Time Allocation</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-8">
            <DonutRing totals={totals} totalSec={totalSec} />
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {CATEGORY_META.map(({ key, sub }) => (
                <div
                  key={key}
                  className="p-3 rounded-lg bg-surface-container/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded ${
                        key === 'productive'
                          ? 'bg-primary-container'
                          : key === 'neutral'
                            ? 'bg-secondary'
                            : 'bg-tertiary-fixed-dim'
                      }`}
                    />
                    <div>
                      <div className="font-body-md text-body-md font-semibold">
                        {categoryLabel[key]}
                      </div>
                      <div className="font-label-caps text-label-caps text-on-surface-variant">{sub}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-code-metric-md text-code-metric-md font-bold ${categoryTextClass[key]}`}>
                      {formatDuration(totals[key])}
                    </div>
                    <div className="font-label-caps text-label-caps text-on-surface-variant">
                      {percent(totals[key], totalSec)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="layers" size={20} className="text-secondary" />
            <span className="font-headline-md text-headline-md">Top Applications</span>
          </div>
          <div className="space-y-3.5">
            {(data?.topApps ?? []).map((app, i) => (
              <div key={i} className="p-2.5 rounded-lg hover:bg-surface-container-high transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded bg-surface-container flex items-center justify-center flex-shrink-0">
                      <Icon
                        name={app.domain ? 'public' : 'desktop_windows'}
                        size={16}
                        className={categoryTextClass[app.category]}
                      />
                    </div>
                    <div className="font-code-data text-code-data font-semibold truncate">{app.appName}</div>
                  </div>
                  <div className={`font-code-metric-md text-code-metric-md font-bold ml-2 flex-shrink-0 ${categoryTextClass[app.category]}`}>
                    {formatDuration(app.durationSec)}
                  </div>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      app.category === 'productive'
                        ? 'bg-primary-container'
                        : app.category === 'neutral'
                          ? 'bg-secondary'
                          : 'bg-tertiary-fixed-dim'
                    }`}
                    style={{ width: `${Math.round(app.share * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1 font-label-caps text-label-caps text-on-surface-variant">
                  <span>{categoryLabel[app.category]}</span>
                  <span>{Math.round(app.share * 100)}%</span>
                </div>
              </div>
            ))}
            {(data?.topApps.length ?? 0) === 0 && (
              <p className="font-body-sm text-body-sm text-on-surface-variant py-8 text-center">
                No activity recorded yet. Start using your apps and it will appear here.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="bolt" size={20} className="text-primary" />
          <span className="font-headline-md text-headline-md">Activity Stream</span>
        </div>
        <div className="divide-y divide-surface-variant/20">
          {events.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    e.category === 'productive'
                      ? 'bg-primary-container'
                      : e.category === 'neutral'
                        ? 'bg-secondary'
                        : 'bg-tertiary-fixed-dim'
                  }`}
                />
                <div className="min-w-0">
                  <div className="font-code-data text-code-data truncate">
                    {e.domain ?? e.appName}
                    {e.windowTitle && (
                      <span className="text-on-surface-variant"> — {e.windowTitle}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  {formatDuration(e.durationSec)}
                </span>
                <span className="font-code-data text-code-data text-on-surface-variant">
                  {formatTime(e.startTs)}
                </span>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <p className="font-body-sm text-body-sm text-on-surface-variant py-8 text-center">
              Activity will stream here as you switch windows and tabs.
            </p>
          )}
        </div>
      </Card>
    </>
  )
}
