import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { CategoryTotals } from '@shared/types'
import { categoryColorVar, formatDuration, percent } from '../lib/format'

export function DonutRing({
  totals,
  totalSec
}: {
  totals: CategoryTotals
  totalSec: number
}): JSX.Element {
  const data = [
    { name: 'Productive', value: totals.productive, key: 'productive' as const },
    { name: 'Neutral', value: totals.neutral, key: 'neutral' as const },
    { name: 'Distracted', value: totals.distracted, key: 'distracted' as const }
  ].filter((d) => d.value > 0)

  const flow = percent(totals.productive, totalSec)

  return (
    <div className="relative w-52 h-52 flex-shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.length ? data : [{ name: 'none', value: 1, key: 'neutral' as const }]}
            dataKey="value"
            innerRadius={70}
            outerRadius={92}
            startAngle={90}
            endAngle={-270}
            paddingAngle={data.length > 1 ? 2 : 0}
            stroke="none"
          >
            {(data.length ? data : [{ key: 'neutral' as const }]).map((d, i) => (
              <Cell key={i} fill={categoryColorVar[d.key]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
          Total Tracked
        </span>
        <span className="font-headline-xl text-headline-xl font-bold tracking-tight">
          {formatDuration(totalSec)}
        </span>
        <span className="font-label-caps text-label-caps text-primary mt-0.5 font-semibold">
          {flow}% FLOW
        </span>
      </div>
    </div>
  )
}
