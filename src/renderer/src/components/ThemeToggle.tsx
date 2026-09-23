import { useState } from 'react'
import type { ThemeMode } from '@shared/types'
import { useTheme } from '../theme/ThemeProvider'
import { Icon } from './Icon'

const OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'light_mode' },
  { value: 'dark', label: 'Dark', icon: 'dark_mode' },
  { value: 'system', label: 'System', icon: 'desktop_windows' }
]

export function ThemeToggle(): JSX.Element {
  const { mode, setMode } = useTheme()
  const [open, setOpen] = useState(false)
  const current = OPTIONS.find((o) => o.value === mode) ?? OPTIONS[1]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-all"
      >
        <Icon name={current.icon} size={18} className="text-primary" />
        <span className="font-label-caps text-label-caps uppercase tracking-wider font-semibold hidden sm:inline">
          {current.label}
        </span>
        <Icon name="expand_more" size={16} className="text-on-surface-variant" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-surface-container-lowest/95 backdrop-blur-xl border border-surface-variant/40 py-1.5 z-50 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onMouseDown={() => {
                setMode(o.value)
                setOpen(false)
              }}
              className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-surface-container-high transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  name={o.icon}
                  size={18}
                  className={o.value === mode ? 'text-primary' : 'text-on-surface-variant'}
                />
                <span className="font-body-sm text-body-sm">{o.label}</span>
              </span>
              {o.value === mode && <Icon name="check" size={16} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
