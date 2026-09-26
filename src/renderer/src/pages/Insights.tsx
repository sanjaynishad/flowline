import type { AppUsage, RangePreset, TimelinePoint } from '@shared/types'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { Card } from '../components/Card'
import { RangeSelector } from '../components/RangeSelector'
import { Icon } from '../components/Icon'
import { useRangeQuery } from '../hooks/useRangeQuery'
import { categoryLabel, categoryTextClass, formatDuration } from '../lib/format'
import type { Category } from '@shared/types'

function FluxTooltip({ active, payload, label }: any): JSX.Element | null {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg bg-surface-container-lowest/95 border border-surface-variant/40 px-3 py-2 shadow-lg">
      <div className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
        {new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="font-code-data text-code-data flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.dataKey}: {p.value}m
        </div>
      ))}
    </div>
  )
}

export function Insights({
  range,
  onRangeChange
}: {
  range: RangePreset
  onRangeChange: (r: RangePreset) => void
}): JSX.Element {
  const { data: timeline } = useRangeQuery<TimelinePoint[]>(range, (r) =>
    window.api.getTimeline(r, 24)
  )
  const { data: apps } = useRangeQuery<AppUsage[]>(range, (r) => window.api.getAppMetrics(r, 40))

  const grouped: Record<Category, AppUsage[]> = { productive: [], neutral: [], distracted: [] }
  for (const a of apps ?? []) {
    grouped[a.category].push(a)
  }

  const categories: { key: Category; icon: string }[] = [
    { key: 'productive', icon: 'code' },
    { key: 'neutral', icon: 'forum' },
    { key: 'distracted', icon: 'smart_display' }
  ]

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-high text-secondary">
            <Icon name="insights" size={20} />
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg tracking-tight font-bold">
              Insights &amp; Analytics
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              How your focus flows through the day
            </p>
          </div>
        </div>
        <RangeSelector value={range} onChange={onRangeChange} />
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="show_chart" size={20} className="text-primary" />
          <span className="font-headline-md text-headline-md">Intra-Day Focus Flux</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--md-primary-container))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="rgb(var(--md-primary-container))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--md-tertiary-fixed-dim))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="rgb(var(--md-tertiary-fixed-dim))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgb(var(--md-surface-variant))" strokeOpacity={0.3} vertical={false} />
              <XAxis
                dataKey="ts"
                tickFormatter={(ts) =>
                  new Date(ts).toLocaleTimeString([], { hour: '2-digit' })
                }
                tick={{ fontSize: 10, fill: 'rgb(var(--md-on-surface-variant))' }}
                stroke="rgb(var(--md-surface-variant))"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'rgb(var(--md-on-surface-variant))' }}
                stroke="rgb(var(--md-surface-variant))"
              />
              <Tooltip content={<FluxTooltip />} />
              <Area
                type="monotone"
                dataKey="productive"
                stroke="rgb(var(--md-primary-container))"
                fill="url(#prodGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="distracted"
                stroke="rgb(var(--md-tertiary-fixed-dim))"
                fill="url(#distGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="apps" size={20} className="text-secondary" />
          <span className="font-headline-md text-headline-md">Applications by Category</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {categories.map(({ key, icon }) => (
            <div key={key} className="rounded-lg bg-surface-container/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name={icon} size={18} className={categoryTextClass[key]} />
                <span className={`font-label-caps text-label-caps uppercase tracking-wider ${categoryTextClass[key]}`}>
                  {categoryLabel[key]}
                </span>
              </div>
              <div className="space-y-2.5">
                {grouped[key].slice(0, 8).map((a, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="font-code-data text-code-data truncate">{a.appName}</span>
                    <span className="font-code-data text-code-data text-on-surface-variant flex-shrink-0">
                      {formatDuration(a.durationSec)}
                    </span>
                  </div>
                ))}
                {grouped[key].length === 0 && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">None yet</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
