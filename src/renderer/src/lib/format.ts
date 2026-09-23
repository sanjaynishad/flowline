import type { Category } from '@shared/types'

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)

  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m`
  }

  if (m > 0) {
    return `${m}m`
  }

  return `${s}s`
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60

  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m`
  }

  return `${m}m ${sec.toString().padStart(2, '0')}s`
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) {
    return 0
  }

  return Math.round((part / whole) * 100)
}

export const categoryLabel: Record<Category, string> = {
  productive: 'Productive',
  neutral: 'Neutral',
  distracted: 'Distracted'
}

export const categoryColorVar: Record<Category, string> = {
  productive: 'rgb(var(--md-primary-container))',
  neutral: 'rgb(var(--md-secondary))',
  distracted: 'rgb(var(--md-tertiary-fixed-dim))'
}

export const categoryTextClass: Record<Category, string> = {
  productive: 'text-primary',
  neutral: 'text-secondary',
  distracted: 'text-tertiary-fixed-dim'
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
