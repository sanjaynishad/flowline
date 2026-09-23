import { getDb } from './database'
import type {
  ActivityEvent,
  AppUsage,
  Category,
  CategoryTotals,
  DailyTotal,
  DashboardSummary,
  DateRange,
  FocusSession,
  Goal,
  MatchType,
  Rule,
  Settings,
  ThemeMode,
  TimelinePoint
} from '../../shared/types'

interface RuleRow {
  id: number
  matcher: string
  match_type: MatchType
  category: Category
  threshold_sec: number | null
  created_at: number
}

function mapRule(row: RuleRow): Rule {
  return {
    id: row.id,
    matcher: row.matcher,
    matchType: row.match_type,
    category: row.category,
    thresholdSec: row.threshold_sec,
    createdAt: row.created_at
  }
}

// ---------- Rules ----------

export function getRules(): Rule[] {
  const rows = getDb().prepare('SELECT * FROM rules ORDER BY category, matcher').all() as RuleRow[]
  return rows.map(mapRule)
}

export function addRule(input: {
  matcher: string
  matchType: MatchType
  category: Category
  thresholdSec?: number | null
}): Rule {
  const db = getDb()
  const info = db
    .prepare(
      'INSERT INTO rules (matcher, match_type, category, threshold_sec, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .run(input.matcher.trim(), input.matchType, input.category, input.thresholdSec ?? null, Date.now())
  const row = db.prepare('SELECT * FROM rules WHERE id = ?').get(info.lastInsertRowid) as RuleRow
  return mapRule(row)
}

export function updateRule(
  id: number,
  patch: Partial<Pick<Rule, 'matcher' | 'matchType' | 'category' | 'thresholdSec'>>
): void {
  const current = getDb().prepare('SELECT * FROM rules WHERE id = ?').get(id) as RuleRow | undefined
  if (!current) {
    return
  }

  getDb()
    .prepare('UPDATE rules SET matcher = ?, match_type = ?, category = ?, threshold_sec = ? WHERE id = ?')
    .run(
      patch.matcher ?? current.matcher,
      patch.matchType ?? current.match_type,
      patch.category ?? current.category,
      patch.thresholdSec !== undefined ? patch.thresholdSec : current.threshold_sec,
      id
    )
}

export function deleteRule(id: number): void {
  getDb().prepare('DELETE FROM rules WHERE id = ?').run(id)
}

// ---------- Activity events ----------

export function insertEvent(e: Omit<ActivityEvent, 'id'>): number {
  const info = getDb()
    .prepare(
      `INSERT INTO activity_events
        (app_name, exe_path, window_title, url, domain, category, start_ts, end_ts, duration_sec, is_afk)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      e.appName,
      e.exePath,
      e.windowTitle,
      e.url,
      e.domain,
      e.category,
      e.startTs,
      e.endTs,
      e.durationSec,
      e.isAfk
    )
  return Number(info.lastInsertRowid)
}

export function updateEventEnd(id: number, endTs: number, durationSec: number): void {
  getDb()
    .prepare('UPDATE activity_events SET end_ts = ?, duration_sec = ? WHERE id = ?')
    .run(endTs, durationSec, id)
}

export function deleteEmptyEvent(id: number): void {
  getDb().prepare('DELETE FROM activity_events WHERE id = ? AND duration_sec = 0').run(id)
}

// ---------- Aggregates ----------

interface SpanRow {
  category: Category
  label: string
  domain: string | null
  start_ts: number
  end_ts: number
}

// Spans that overlap [start, end); a single foreground window is one span and may cross boundaries.
function overlappingSpans(range: DateRange): SpanRow[] {
  return getDb()
    .prepare(
      `SELECT category, COALESCE(domain, app_name) AS label, domain, start_ts, end_ts
       FROM activity_events
       WHERE is_afk = 0 AND start_ts < ? AND end_ts > ?`
    )
    .all(range.end, range.start) as SpanRow[]
}

function clippedSec(s: SpanRow, range: DateRange): number {
  const start = Math.max(s.start_ts, range.start)
  const end = Math.min(s.end_ts, range.end)
  return Math.max(0, (end - start) / 1000)
}

function nextLocalMidnight(ms: number): number {
  const d = new Date(ms)
  d.setHours(24, 0, 0, 0)
  return d.getTime()
}

// Splits a [startMs, endMs) span into per-local-day segments so midnight crossings land on the right day.
function forEachLocalDaySegment(
  startMs: number,
  endMs: number,
  fn: (dayKey: string, seconds: number) => void
): void {
  let cur = startMs
  while (cur < endMs) {
    const boundary = Math.min(endMs, nextLocalMidnight(cur))
    fn(toLocalDateKey(new Date(cur)), (boundary - cur) / 1000)
    cur = boundary
  }
}

function categoryTotals(range: DateRange): CategoryTotals {
  const totals: CategoryTotals = { productive: 0, neutral: 0, distracted: 0 }
  for (const s of overlappingSpans(range)) {
    totals[s.category] += clippedSec(s, range)
  }

  totals.productive = Math.round(totals.productive)
  totals.neutral = Math.round(totals.neutral)
  totals.distracted = Math.round(totals.distracted)
  return totals
}

export function getTopApps(range: DateRange, limit = 5): AppUsage[] {
  const spans = overlappingSpans(range)
  const byLabel = new Map<string, { label: string; domain: string | null; category: Category; sec: number }>()
  let grand = 0

  for (const s of spans) {
    const sec = clippedSec(s, range)
    grand += sec
    const key = `${s.label}|${s.category}`
    const entry = byLabel.get(key) ?? { label: s.label, domain: s.domain, category: s.category, sec: 0 }
    entry.sec += sec
    byLabel.set(key, entry)
  }

  const denom = grand || 1
  return Array.from(byLabel.values())
    .sort((a, b) => b.sec - a.sec)
    .slice(0, limit)
    .map((e) => ({
      appName: e.label,
      domain: e.domain,
      category: e.category,
      durationSec: Math.round(e.sec),
      share: e.sec / denom
    }))
}

export function getContextSwitches(range: DateRange): number {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS c
       FROM activity_events
       WHERE is_afk = 0 AND start_ts < ? AND end_ts > ?`
    )
    .get(range.end, range.start) as { c: number }
  return row.c
}

export function getDashboardSummary(range: DateRange): DashboardSummary {
  const totals = categoryTotals(range)
  const totalTrackedSec = totals.productive + totals.neutral + totals.distracted

  return {
    rangeStart: range.start,
    rangeEnd: range.end,
    totals,
    totalTrackedSec,
    deepWorkSec: totals.productive,
    distractionSec: totals.distracted,
    contextSwitches: getContextSwitches(range),
    topApps: getTopApps(range, 5)
  }
}

export function getTimeline(range: DateRange, buckets = 24): TimelinePoint[] {
  const span = range.end - range.start
  const bucketMs = Math.max(1, Math.floor(span / buckets))
  const spans = overlappingSpans(range)

  const acc: { productive: number; neutral: number; distracted: number }[] = Array.from(
    { length: buckets },
    () => ({ productive: 0, neutral: 0, distracted: 0 })
  )

  for (const s of spans) {
    let cur = Math.max(s.start_ts, range.start)
    const end = Math.min(s.end_ts, range.end)
    while (cur < end) {
      const idx = Math.min(buckets - 1, Math.floor((cur - range.start) / bucketMs))
      const bucketEnd = range.start + (idx + 1) * bucketMs
      const segEnd = Math.min(end, bucketEnd)
      acc[idx][s.category] += (segEnd - cur) / 1000 / 60
      cur = segEnd
    }
  }

  return acc.map((a, i) => ({
    ts: range.start + i * bucketMs,
    productive: Math.round(a.productive),
    neutral: Math.round(a.neutral),
    distracted: Math.round(a.distracted)
  }))
}

export function getAppMetrics(range: DateRange, limit = 50): AppUsage[] {
  return getTopApps(range, limit)
}

export function getRecentEvents(range: DateRange, limit = 40): ActivityEvent[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM activity_events
       WHERE start_ts >= ? AND start_ts < ?
       ORDER BY start_ts DESC LIMIT ?`
    )
    .all(range.start, range.end, limit) as Array<{
    id: number
    app_name: string
    exe_path: string | null
    window_title: string | null
    url: string | null
    domain: string | null
    category: Category
    start_ts: number
    end_ts: number
    duration_sec: number
    is_afk: number
  }>

  return rows.map((r) => ({
    id: r.id,
    appName: r.app_name,
    exePath: r.exe_path,
    windowTitle: r.window_title,
    url: r.url,
    domain: r.domain,
    category: r.category,
    startTs: r.start_ts,
    endTs: r.end_ts,
    durationSec: r.duration_sec,
    isAfk: r.is_afk
  }))
}

// ---------- Weekly / streaks ----------

export function getDailyTotals(range: DateRange): DailyTotal[] {
  const map = new Map<string, DailyTotal>()

  for (const s of overlappingSpans(range)) {
    const start = Math.max(s.start_ts, range.start)
    const end = Math.min(s.end_ts, range.end)
    forEachLocalDaySegment(start, end, (day, seconds) => {
      const entry = map.get(day) ?? { day, productive: 0, neutral: 0, distracted: 0 }
      entry[s.category] += seconds
      map.set(day, entry)
    })
  }

  return Array.from(map.values())
    .map((e) => ({
      day: e.day,
      productive: Math.round(e.productive),
      neutral: Math.round(e.neutral),
      distracted: Math.round(e.distracted)
    }))
    .sort((a, b) => a.day.localeCompare(b.day))
}

export function getDeepWorkStreak(targetMin: number): number {
  const rows = getDb()
    .prepare(
      `SELECT start_ts, end_ts FROM activity_events WHERE is_afk = 0 AND category = 'productive'`
    )
    .all() as { start_ts: number; end_ts: number }[]

  const perDay = new Map<string, number>()
  for (const r of rows) {
    forEachLocalDaySegment(r.start_ts, r.end_ts, (day, seconds) => {
      perDay.set(day, (perDay.get(day) ?? 0) + seconds)
    })
  }

  const targetSec = targetMin * 60
  const metDays = new Set(
    Array.from(perDay.entries())
      .filter(([, sec]) => sec >= targetSec)
      .map(([day]) => day)
  )

  let streak = 0
  const cursor = new Date()
  // Today can still be pending, so start from today without breaking when it isn't met yet.
  for (let i = 0; i < 366; i++) {
    const key = toLocalDateKey(cursor)
    if (metDays.has(key)) {
      streak++
    } else if (i !== 0) {
      break
    }

    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ---------- Focus sessions ----------

export function startSession(plannedMin: number, type: 'focus' | 'break'): number {
  const info = getDb()
    .prepare('INSERT INTO focus_sessions (start_ts, planned_min, type, completed) VALUES (?, ?, ?, 0)')
    .run(Date.now(), plannedMin, type)
  return Number(info.lastInsertRowid)
}

export function endSession(id: number, completed: boolean): void {
  getDb()
    .prepare('UPDATE focus_sessions SET end_ts = ?, completed = ? WHERE id = ?')
    .run(Date.now(), completed ? 1 : 0, id)
}

export function getSessions(range: DateRange): FocusSession[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM focus_sessions WHERE start_ts >= ? AND start_ts < ? ORDER BY start_ts DESC`
    )
    .all(range.start, range.end) as Array<{
    id: number
    start_ts: number
    end_ts: number | null
    planned_min: number
    type: 'focus' | 'break'
    completed: number
  }>

  return rows.map((r) => ({
    id: r.id,
    startTs: r.start_ts,
    endTs: r.end_ts,
    plannedMin: r.planned_min,
    type: r.type,
    completed: r.completed
  }))
}

// ---------- Goals ----------

export function getGoals(): Goal[] {
  const rows = getDb().prepare('SELECT * FROM goals').all() as Array<{
    id: number
    metric: Goal['metric']
    target: number
    period: Goal['period']
  }>
  return rows.map((r) => ({ id: r.id, metric: r.metric, target: r.target, period: r.period }))
}

export function setGoal(metric: Goal['metric'], target: number): void {
  getDb()
    .prepare(
      `INSERT INTO goals (metric, target, period) VALUES (?, ?, 'daily')
       ON CONFLICT(metric, period) DO UPDATE SET target = excluded.target`
    )
    .run(metric, target)
}

// ---------- Settings ----------

export function getSettings(): Settings {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as {
    key: string
    value: string
  }[]
  const map = new Map(rows.map((r) => [r.key, r.value]))

  return {
    idleThresholdSec: Number(map.get('idleThresholdSec') ?? 120),
    heartbeatSec: Number(map.get('heartbeatSec') ?? 20),
    distractionThresholdSec: Number(map.get('distractionThresholdSec') ?? 600),
    theme: (map.get('theme') as ThemeMode) ?? 'dark',
    autostart: map.get('autostart') === 'true',
    wsPort: Number(map.get('wsPort') ?? 7413),
    notificationsEnabled: map.get('notificationsEnabled') !== 'false',
    deepWorkTargetMin: Number(map.get('deepWorkTargetMin') ?? 360),
    distractionLimitMin: Number(map.get('distractionLimitMin') ?? 60)
  }
}

export function setSettings(patch: Partial<Settings>): Settings {
  const insert = getDb().prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  )
  const tx = getDb().transaction(() => {
    for (const [key, value] of Object.entries(patch)) {
      insert.run(key, String(value))
    }
  })
  tx()
  return getSettings()
}
