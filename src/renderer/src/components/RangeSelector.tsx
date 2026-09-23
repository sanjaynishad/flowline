import type { RangePreset } from '@shared/types'

const OPTIONS: { id: RangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 Days' }
]

export function RangeSelector({
  value,
  onChange
}: {
  value: RangePreset
  onChange: (r: RangePreset) => void
}): JSX.Element {
  return (
    <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg">
      {OPTIONS.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`px-3 py-1.5 rounded font-label-caps text-label-caps uppercase tracking-wider transition-all ${
              active
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_10px_rgba(0,240,118,0.3)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
