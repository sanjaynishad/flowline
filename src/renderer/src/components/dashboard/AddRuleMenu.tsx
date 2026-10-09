import { useEffect, useRef, useState } from 'react'
import type { ActivityEvent, Category, MatchType } from '@shared/types'
import { Icon } from '../Icon'
import { categoryLabel, exeMatcher } from '../../lib/format'

const PICKABLE: Category[] = ['productive', 'distracted']

export function AddRuleMenu({
  event,
  onAdded
}: {
  event: ActivityEvent
  onAdded?: () => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const onDoc = (ev: MouseEvent): void => {
      if (ref.current && !ref.current.contains(ev.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const matchType: MatchType = event.domain ? 'domain' : 'exe'
  const matcher = event.domain ?? exeMatcher(event.exePath, event.appName)

  async function add(category: Category): Promise<void> {
    if (busy) {
      return
    }

    setBusy(true)
    const created = await window.api.addRule({ matcher, matchType, category })
    setBusy(false)
    setFeedback(created ? 'Added' : 'Already a rule')

    if (created) {
      onAdded?.()
    }

    setTimeout(() => {
      setFeedback(null)
      setOpen(false)
    }, 1200)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={`Add rule for ${matcher}`}
        className="flex items-center justify-center w-6 h-6 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
      >
        <Icon name="add_circle" size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-10 min-w-[180px] rounded-lg border border-surface-variant/30 bg-surface-container-high shadow-lg p-1">
          {feedback ? (
            <div
              role="status"
              className="px-3 py-2 font-body-sm text-body-sm text-on-surface-variant"
            >
              {feedback}
            </div>
          ) : (
            <>
              <div className="px-3 py-1.5 font-label-caps text-label-caps text-on-surface-variant truncate">
                Categorize {matcher}
              </div>
              {PICKABLE.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={busy}
                  onClick={() => add(c)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      c === 'productive' ? 'bg-primary-container' : 'bg-tertiary-fixed-dim'
                    }`}
                  />
                  <span className="font-body-sm text-body-sm">{categoryLabel[c]}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
