import { useCallback, useEffect, useState } from 'react'
import type { DashboardSummary, RangePreset, ActivityEvent } from '@shared/types'
import { rangeFromPreset } from '@shared/range'
import { useRangeQuery } from '../hooks/useRangeQuery'
import { useLiveStatus } from '../hooks/useLiveStatus'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { DashboardStats } from '../components/dashboard/DashboardStats'
import { TimeAllocationCard } from '../components/dashboard/TimeAllocationCard'
import { TopApplicationsCard } from '../components/dashboard/TopApplicationsCard'
import { ActivityStreamCard } from '../components/dashboard/ActivityStreamCard'

export function Dashboard({
  range,
  onRangeChange
}: {
  range: RangePreset
  onRangeChange: (r: RangePreset) => void
}): JSX.Element {
  const status = useLiveStatus()
  const { data, refresh } = useRangeQuery<DashboardSummary>(range, (r) =>
    window.api.getDashboard(r)
  )
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [liveSession, setLiveSession] = useState(status.activeSessionSec)
  const [distractionLimitMin, setDistractionLimitMin] = useState<number | null>(null)

  useEffect(() => {
    window.api.getSettings().then((s) => setDistractionLimitMin(s.distractionLimitMin))
  }, [])

  // Rebuild the range on each load so the stream follows the current day past midnight.
  const loadEvents = useCallback((): void => {
    window.api.getRecentEvents(rangeFromPreset(range), 12).then(setEvents)
  }, [range])

  useEffect(() => {
    loadEvents()
    const id = setInterval(loadEvents, 5000)
    return () => clearInterval(id)
  }, [loadEvents])

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
  // The distraction limit is a daily cap, so only apply it to single-day ranges.
  const singleDayRange = range === 'today' || range === 'yesterday'
  const distractionLimitSec = singleDayRange ? (distractionLimitMin ?? 0) * 60 : 0
  const overDistractionLimit = distractionLimitSec > 0 && totals.distracted >= distractionLimitSec

  async function handleExport(format: 'csv' | 'json'): Promise<void> {
    await window.api.exportData(rangeFromPreset(range), format)
  }

  return (
    <>
      <DashboardHeader
        status={status}
        range={range}
        onRangeChange={onRangeChange}
        onExport={handleExport}
      />

      <DashboardStats
        totals={totals}
        totalSec={totalSec}
        contextSwitches={data?.contextSwitches ?? 0}
        distractionLimitSec={distractionLimitSec}
        distractionLimitMin={distractionLimitMin}
        overDistractionLimit={overDistractionLimit}
        status={status}
        liveSession={liveSession}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <TimeAllocationCard totals={totals} totalSec={totalSec} />
        <TopApplicationsCard apps={data?.topApps ?? []} />
      </div>

      <ActivityStreamCard
        events={events}
        onRuleAdded={() => {
          refresh()
          loadEvents()
        }}
      />
    </>
  )
}
