import { useState } from 'react'
import type { RangePreset } from '@shared/types'
import { Icon } from './components/Icon'
import { ThemeToggle } from './components/ThemeToggle'
import { StatusPill } from './components/StatusPill'
import { Dashboard } from './pages/Dashboard'
import { Insights } from './pages/Insights'
import { Rules } from './pages/Rules'
import { Sessions } from './pages/Sessions'
import { Settings } from './pages/Settings'

type Page = 'dashboard' | 'insights' | 'rules' | 'sessions' | 'settings'

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
  { id: 'insights', label: 'Insights', icon: 'insights' },
  { id: 'rules', label: 'Rules', icon: 'rule' },
  { id: 'sessions', label: 'Focus Sessions', icon: 'timer' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
]

export default function App(): JSX.Element {
  const [page, setPage] = useState<Page>('dashboard')
  const [range, setRange] = useState<RangePreset>('today')

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-space-lg bg-surface-container-lowest/95 backdrop-blur-xl border-b border-surface-variant/40">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-container/15 text-primary shadow-[0_0_16px_rgba(0,240,118,0.25)]">
            <Icon name="blur_on" size={22} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-headline-md text-headline-md tracking-tight">Flowline</span>
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-widest">
              Local Focus Tracker
            </span>
          </div>
        </div>
        <div className="flex items-center gap-space-md">
          <StatusPill />
          <div className="h-5 w-px bg-surface-variant hidden sm:block" />
          <ThemeToggle />
        </div>
      </header>

      <aside className="fixed left-0 top-16 bottom-0 w-60 z-40 flex flex-col justify-between py-margin bg-surface-container-lowest/95 backdrop-blur-xl border-r border-surface-variant/30">
        <div className="flex flex-col gap-space-md px-space-md">
          <span className="px-space-md font-label-caps text-label-caps uppercase text-on-surface-variant tracking-widest">
            Navigation
          </span>
          <nav className="flex flex-col gap-space-xs">
            {NAV.map((item) => {
              const active = page === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`flex items-center gap-space-md px-space-md py-space-sm rounded transition-all text-left ${
                    active
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-[0_0_16px_rgba(0,240,118,0.2)]'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <Icon name={item.icon} size={20} />
                  <span className="font-body-md text-body-md">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
        <div className="px-space-lg">
          <p className="font-label-caps text-label-caps uppercase text-on-surface-variant/70 tracking-wider">
            All data stays on this device.
          </p>
        </div>
      </aside>

      <main className="pl-60 pt-16 min-h-screen">
        <div className="p-space-xl max-w-[1400px] mx-auto space-y-6">
          {page === 'dashboard' && <Dashboard range={range} onRangeChange={setRange} />}
          {page === 'insights' && <Insights range={range} onRangeChange={setRange} />}
          {page === 'rules' && <Rules />}
          {page === 'sessions' && <Sessions />}
          {page === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  )
}
