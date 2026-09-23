import { dialog } from 'electron'
import { writeFileSync } from 'fs'
import { getRecentEvents } from './db/repositories'
import type { DateRange } from '../shared/types'

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) {
    return ''
  }

  const headers = Object.keys(rows[0])
  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','))
  }

  return lines.join('\n')
}

export async function exportData(
  range: DateRange,
  format: 'csv' | 'json'
): Promise<{ ok: boolean; path?: string }> {
  const events = getRecentEvents(range, 100000)
  const defaultName = `flowline-export-${new Date().toISOString().slice(0, 10)}.${format}`

  const result = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: [
      format === 'csv'
        ? { name: 'CSV', extensions: ['csv'] }
        : { name: 'JSON', extensions: ['json'] }
    ]
  })

  if (result.canceled || !result.filePath) {
    return { ok: false }
  }

  const content =
    format === 'csv' ? toCsv(events as unknown as Record<string, unknown>[]) : JSON.stringify(events, null, 2)
  writeFileSync(result.filePath, content, 'utf-8')

  return { ok: true, path: result.filePath }
}
