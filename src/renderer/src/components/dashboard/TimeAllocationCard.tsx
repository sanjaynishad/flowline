import type { Category, CategoryTotals } from '@shared/types'
import { Card } from '../Card'
import { DonutRing } from '../DonutRing'
import { Icon } from '../Icon'
import { categoryLabel, categoryTextClass, formatDuration, percent } from '../../lib/format'

const CATEGORY_META: { key: Category; sub: string }[] = [
  { key: 'productive', sub: 'Core work & building' },
  { key: 'neutral', sub: 'Comms & admin' },
  { key: 'distracted', sub: 'Entertainment & feeds' }
]

export function TimeAllocationCard({
  totals,
  totalSec
}: {
  totals: CategoryTotals
  totalSec: number
}): JSX.Element {
  return (
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
                  <div className="font-label-caps text-label-caps text-on-surface-variant">
                    {sub}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-code-metric-md text-code-metric-md font-bold ${categoryTextClass[key]}`}
                >
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
  )
}
