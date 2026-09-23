import type { RangePreset, DateRange } from './types'

export function rangeFromPreset(preset: RangePreset): DateRange {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  // Build each boundary from a local calendar date so DST transitions don't shift it by an hour.
  const dayStart = (offset: number): number => new Date(y, m, d + offset).getTime()

  switch (preset) {
    case 'today':
      return { start: dayStart(0), end: dayStart(1) }
    case 'yesterday':
      return { start: dayStart(-1), end: dayStart(0) }
    case 'last7':
      return { start: dayStart(-6), end: dayStart(1) }
    default:
      return { start: dayStart(0), end: dayStart(1) }
  }
}
