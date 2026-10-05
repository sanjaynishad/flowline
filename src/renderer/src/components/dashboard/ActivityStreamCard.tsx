import type { ActivityEvent } from '@shared/types'
import { Card } from '../Card'
import { Icon } from '../Icon'
import { formatDuration, formatTime } from '../../lib/format'

export function ActivityStreamCard({ events }: { events: ActivityEvent[] }): JSX.Element {
  return (
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
  )
}
