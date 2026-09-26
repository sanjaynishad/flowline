import { useEffect, useState } from 'react'
import type { DailyTotal, FocusSession } from '@shared/types'
import { rangeFromPreset } from '@shared/range'
import { Card } from '../components/Card'
import { Icon } from '../components/Icon'

const FOCUS_PRESETS = [15, 25, 50]

export function Sessions(): JSX.Element {
  const [active, setActive] = useState<FocusSession | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [streak, setStreak] = useState(0)
  const [week, setWeek] = useState<DailyTotal[]>([])

  function reload(): void {
    const today = rangeFromPreset('today')
    window.api.listSessions(today).then(setSessions)
    window.api.getStreak().then(setStreak)
    window.api.getDailyTotals(rangeFromPreset('last7')).then(setWeek)
  }

  useEffect(() => {
    reload()
    // Restore a session already running in the main process (e.g. started from the tray).
    window.api.getActiveSession().then((s) => {
      if (s) {
        setActive(s)
        setRemaining(Math.max(0, Math.round((s.startTs + s.plannedMin * 60 * 1000 - Date.now()) / 1000)))
      }
    })
  }, [])

  useEffect(() => {
    if (!active || !active.startTs) {
      return
    }

    const endAt = active.startTs + active.plannedMin * 60 * 1000
    const id = setInterval(() => {
      const left = Math.round((endAt - Date.now()) / 1000)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(id)
        setActive(null)
        reload()
      }
    }, 1000)

    return () => clearInterval(id)
  }, [active])

  async function start(min: number, type: 'focus' | 'break'): Promise<void> {
    const session = await window.api.startSession(min, type)
    setActive(session)
    setRemaining(min * 60)
  }

  async function stop(): Promise<void> {
    await window.api.stopSession()
    setActive(null)
    reload()
  }

  const mm = Math.floor(Math.max(0, remaining) / 60)
  const ss = Math.max(0, remaining) % 60
  const maxWeek = Math.max(1, ...week.map((d) => (d.productive + d.neutral + d.distracted) / 3600))

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-high text-primary">
          <Icon name="timer" size={20} />
        </div>
        <div>
          <h1 className="font-headline-lg text-headline-lg tracking-tight font-bold">Focus Sessions</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Time-boxed focus blocks with break reminders
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 flex flex-col items-center justify-center gap-6">
          <div className="font-code-metric-lg text-[64px] leading-none font-bold tracking-tight tabular-nums">
            {active ? `${mm}:${ss.toString().padStart(2, '0')}` : '25:00'}
          </div>
          <div className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant">
            {active ? `${active.type} block running` : 'Ready to focus'}
          </div>
          {active ? (
            <button
              onClick={stop}
              className="flex items-center gap-2 px-space-xl py-2.5 rounded bg-error-container text-on-error-container font-body-md font-semibold transition-all hover:opacity-90"
            >
              <Icon name="stop" size={18} />
              Stop
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-2">
                {FOCUS_PRESETS.map((m) => (
                  <button
                    key={m}
                    onClick={() => start(m, 'focus')}
                    className="px-space-lg py-2 rounded bg-primary-container text-on-primary-container font-body-md font-semibold shadow-[0_0_12px_rgba(0,240,118,0.25)] hover:shadow-[0_0_18px_rgba(0,240,118,0.4)] transition-all"
                  >
                    {m} min
                  </button>
                ))}
              </div>
              <button
                onClick={() => start(5, 'break')}
                className="px-space-lg py-2 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-body-sm transition-all"
              >
                5 min break
              </button>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="local_fire_department" size={20} className="text-tertiary-fixed-dim" />
              <span className="font-headline-md text-headline-md">Streak &amp; Sessions</span>
            </div>
            <span className="font-code-metric-md text-code-metric-md text-primary font-bold">
              {streak} day{streak === 1 ? '' : 's'}
            </span>
          </div>
          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container/50"
              >
                <div className="flex items-center gap-2">
                  <Icon
                    name={s.type === 'focus' ? 'psychology' : 'coffee'}
                    size={16}
                    className={s.completed ? 'text-primary' : 'text-on-surface-variant'}
                  />
                  <span className="font-code-data text-code-data capitalize">{s.type}</span>
                </div>
                <div className="flex items-center gap-3 font-label-caps text-label-caps uppercase text-on-surface-variant">
                  <span>{s.plannedMin}m</span>
                  <span className={s.completed ? 'text-primary' : 'text-on-surface-variant'}>
                    {s.completed ? 'done' : 'ended early'}
                  </span>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="font-body-sm text-body-sm text-on-surface-variant py-6 text-center">
                No sessions today yet.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="calendar_view_week" size={20} className="text-secondary" />
          <span className="font-headline-md text-headline-md">Last 7 Days</span>
        </div>
        <div className="flex items-end justify-between gap-3 h-40">
          {week.map((d) => {
            const prod = d.productive / 3600
            const neutral = d.neutral / 3600
            const dist = d.distracted / 3600
            const scale = 100 / maxWeek
            return (
              <div key={d.day} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full flex flex-col-reverse items-center h-32 justify-start gap-0.5">
                  <div
                    className="w-6 bg-primary-container rounded-b"
                    style={{ height: `${prod * scale}%` }}
                  />
                  <div className="w-6 bg-secondary" style={{ height: `${neutral * scale}%` }} />
                  <div
                    className="w-6 bg-tertiary-fixed-dim rounded-t"
                    style={{ height: `${dist * scale}%` }}
                  />
                </div>
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  {new Date(d.day).toLocaleDateString([], { weekday: 'short' })}
                </span>
              </div>
            )
          })}
          {week.length === 0 && (
            <p className="font-body-sm text-body-sm text-on-surface-variant w-full text-center">
              No data for the last 7 days yet.
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 mt-4 font-label-caps text-label-caps uppercase text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-primary-container" /> Productive
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-secondary" /> Neutral
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-tertiary-fixed-dim" /> Distracted
          </span>
        </div>
      </Card>
    </>
  )
}
