import { useEffect, useState } from 'react'
import type { Settings as SettingsType } from '@shared/types'
import { Card } from '../components/Card'
import { Icon } from '../components/Icon'

function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}): JSX.Element {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-primary-container' : 'bg-surface-container-highest'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface-container-lowest transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}

function Row({
  title,
  desc,
  children
}: {
  title: string
  desc: string
  children: React.ReactNode
}): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="font-body-md text-body-md font-semibold">{title}</div>
        <div className="font-body-sm text-body-sm text-on-surface-variant">{desc}</div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

const numberInput =
  'w-24 bg-surface-container-lowest text-on-surface font-code-data text-code-data px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-primary text-right'

export function Settings(): JSX.Element {
  const [settings, setSettings] = useState<SettingsType | null>(null)

  useEffect(() => {
    window.api.getSettings().then(setSettings)
  }, [])

  async function save(patch: Partial<SettingsType>): Promise<void> {
    const next = await window.api.setSettings(patch)
    setSettings(next)
  }

  if (!settings) {
    return <div className="font-body-md text-on-surface-variant">Loading…</div>
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-high text-primary">
          <Icon name="settings" size={20} />
        </div>
        <div>
          <h1 className="font-headline-lg text-headline-lg tracking-tight font-bold">Settings</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Tune tracking, alerts, and daily goals
          </p>
        </div>
      </div>

      <Card className="p-6 divide-y divide-surface-variant/20">
        <div className="pb-2">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-widest">
            Tracking
          </span>
        </div>
        <Row title="Idle threshold" desc="Stop counting after this many minutes of no input">
          <input
            type="number"
            min={1}
            className={numberInput}
            value={Math.round(settings.idleThresholdSec / 60)}
            onChange={(e) => save({ idleThresholdSec: Math.max(1, Number(e.target.value)) * 60 })}
          />
        </Row>
        <Row title="Heartbeat interval" desc="How often idle and duration are checked (seconds)">
          <input
            type="number"
            min={5}
            max={60}
            className={numberInput}
            value={settings.heartbeatSec}
            onChange={(e) => save({ heartbeatSec: Math.max(5, Number(e.target.value)) })}
          />
        </Row>
        <Row title="Distraction alert" desc="Notify after this many continuous minutes off-task">
          <input
            type="number"
            min={1}
            className={numberInput}
            value={Math.round(settings.distractionThresholdSec / 60)}
            onChange={(e) =>
              save({ distractionThresholdSec: Math.max(1, Number(e.target.value)) * 60 })
            }
          />
        </Row>

        <div className="pt-4 pb-2">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-widest">
            Goals
          </span>
        </div>
        <Row title="Deep work target" desc="Daily productive-time goal (minutes) — drives your streak">
          <input
            type="number"
            min={0}
            className={numberInput}
            value={settings.deepWorkTargetMin}
            onChange={(e) => save({ deepWorkTargetMin: Math.max(0, Number(e.target.value)) })}
          />
        </Row>
        <Row title="Distraction limit" desc="Daily cap for distracted time (minutes)">
          <input
            type="number"
            min={0}
            className={numberInput}
            value={settings.distractionLimitMin}
            onChange={(e) => save({ distractionLimitMin: Math.max(0, Number(e.target.value)) })}
          />
        </Row>

        <div className="pt-4 pb-2">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-widest">
            System
          </span>
        </div>
        <Row title="Notifications" desc="Distraction alerts and session reminders">
          <Toggle
            label="Notifications"
            checked={settings.notificationsEnabled}
            onChange={(v) => save({ notificationsEnabled: v })}
          />
        </Row>
        <Row title="Launch on login" desc="Start Flowline automatically and track in the tray">
          <Toggle
            label="Launch on login"
            checked={settings.autostart}
            onChange={(v) => save({ autostart: v })}
          />
        </Row>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="extension" size={20} className="text-secondary" />
          <span className="font-headline-md text-headline-md">Browser Extension</span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">
          For accurate per-site tracking, load the Flowline Bridge extension. Without it, browser
          time is attributed by window title only.
        </p>
        <ol className="font-body-sm text-body-sm text-on-surface-variant space-y-1.5 list-decimal list-inside">
          <li>
            Open <span className="font-code-data">chrome://extensions</span> and enable Developer mode.
          </li>
          <li>
            Click <strong>Load unpacked</strong> and select the{' '}
            <span className="font-code-data">browser-extension</span> folder.
          </li>
          <li>
            It connects to <span className="font-code-data">ws://127.0.0.1:{settings.wsPort}</span>{' '}
            automatically.
          </li>
        </ol>
      </Card>
    </>
  )
}
