import type { RangePreset, DateRange } from './types'

export function rangeFromPreset(preset: RangePreset): DateRange {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dayMs = 24 * 60 * 60 * 1000

  switch (preset) {
    case 'today':
      return { start: startOfDay, end: startOfDay + dayMs }
    case 'yesterday':
      return { start: startOfDay - dayMs, end: startOfDay }
    case 'last7':
      return { start: startOfDay - 6 * dayMs, end: startOfDay + dayMs }
    default:
      return { start: startOfDay, end: startOfDay + dayMs }
  }
}
