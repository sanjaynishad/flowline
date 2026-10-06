import type { AppUsage } from '@shared/types'
import { Card } from '../Card'
import { Icon } from '../Icon'
import { categoryLabel, categoryTextClass, formatDuration } from '../../lib/format'

export function TopApplicationsCard({ apps }: { apps: AppUsage[] }): JSX.Element {
  return (
    <Card className="lg:col-span-5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="layers" size={20} className="text-secondary" />
        <span className="font-headline-md text-headline-md">Top Applications</span>
      </div>
      <div className="space-y-3.5">
        {apps.map((app, i) => (
          <div
            key={i}
            className="p-2.5 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded bg-surface-container flex items-center justify-center flex-shrink-0">
                  <Icon
                    name={app.domain ? 'public' : 'desktop_windows'}
                    size={16}
                    className={categoryTextClass[app.category]}
                  />
                </div>
                <div className="font-code-data text-code-data font-semibold truncate">
                  {app.appName}
                </div>
              </div>
              <div
                className={`font-code-metric-md text-code-metric-md font-bold ml-2 flex-shrink-0 ${categoryTextClass[app.category]}`}
              >
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
        {apps.length === 0 && (
          <p className="font-body-sm text-body-sm text-on-surface-variant py-8 text-center">
            No activity recorded yet. Start using your apps and it will appear here.
          </p>
        )}
      </div>
    </Card>
  )
}
