import { useState } from 'react'
import type { LiveStatus, RangePreset } from '@shared/types'
import { RangeSelector } from '../RangeSelector'
import { Icon } from '../Icon'

export function DashboardHeader({
  status,
  range,
  onRangeChange,
  onExport
}: {
  status: LiveStatus
  range: RangePreset
  onRangeChange: (r: RangePreset) => void
  onExport: (format: 'csv' | 'json') => void
}): JSX.Element {
  const [exportOpen, setExportOpen] = useState(false)

  function handleExport(format: 'csv' | 'json'): void {
    setExportOpen(false)
    onExport(format)
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-high text-primary shadow-[0_0_12px_rgba(0,240,118,0.18)]">
          <Icon name="sensors" size={20} />
        </div>
        <div>
          <h1 className="font-headline-lg text-headline-lg tracking-tight font-bold">
            Live Overview
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {status.tracking
              ? status.isAfk
                ? 'You are idle — time is paused.'
                : `Tracking ${status.current?.domain ?? status.current?.appName ?? 'active window'}`
              : 'Tracking paused'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <RangeSelector value={range} onChange={onRangeChange} />
        <div
          className="relative"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setExportOpen(false)
            }
          }}
        >
          <button
            onClick={() => setExportOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={exportOpen}
            className="flex items-center gap-1 px-2.5 py-2 rounded font-label-caps text-label-caps uppercase text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
          >
            <Icon name="file_download" size={16} />
            Export
            <Icon name="expand_more" size={14} />
          </button>
          {exportOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-36 rounded-xl bg-surface-container-lowest/95 backdrop-blur-xl border border-surface-variant/40 py-1.5 z-50 shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
            >
              <button
                role="menuitem"
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 w-full px-3 py-2 text-left font-body-sm text-body-sm hover:bg-surface-container-high transition-colors"
              >
                <Icon name="table_view" size={16} /> CSV
              </button>
              <button
                role="menuitem"
                onClick={() => handleExport('json')}
                className="flex items-center gap-2 w-full px-3 py-2 text-left font-body-sm text-body-sm hover:bg-surface-container-high transition-colors"
              >
                <Icon name="data_object" size={16} /> JSON
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
