import type Database from 'better-sqlite3'
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

function categoryTotals(db: Database.Database, range: DateRange): CategoryTotals {
  const rows = db
    .prepare(
      `SELECT category, SUM(duration_sec) AS total
       FROM activity_events
       WHERE is_afk = 0 AND start_ts >= ? AND start_ts < ?
       GROUP BY category`
    )
    .all(range.start, range.end) as { category: Category; total: number }[]

  const totals: CategoryTotals = { productive: 0, neutral: 0, distracted: 0 }
  for (const r of rows) {
    totals[r.category] = r.total
  }

  return totals
}

export function getTopApps(range: DateRange, limit = 5): AppUsage[] {
  const rows = getDb()
    .prepare(
      `SELECT
         COALESCE(domain, app_name) AS label,
         domain,
         category,
         SUM(duration_sec) AS total
       FROM activity_events
       WHERE is_afk = 0 AND start_ts >= ? AND start_ts < ?
       GROUP BY label, category
       ORDER BY total DESC
       LIMIT ?`
    )
    .all(range.start, range.end, limit) as {
    label: string
    domain: string | null
    category: Category
    total: number
  }[]

  const grand = rows.reduce((sum, r) => sum + r.total, 0) || 1
  return rows.map((r) => ({
    appName: r.label,
    domain: r.domain,
    category: r.category,
    durationSec: r.total,
    share: r.total / grand
  }))
}

export function getContextSwitches(range: DateRange): number {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS c
       FROM activity_events
       WHERE is_afk = 0 AND start_ts >= ? AND start_ts < ?`
    )
    .get(range.start, range.end) as { c: number }
  return row.c
}

export function getDashboardSummary(range: DateRange): DashboardSummary {
  const db = getDb()
  const totals = categoryTotals(db, range)
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
  const db = getDb()
  const span = range.end - range.start
  const bucketMs = Math.max(1, Math.floor(span / buckets))
  const rows = db
    .prepare(
      `SELECT category, start_ts, duration_sec
       FROM activity_events
       WHERE is_afk = 0 AND start_ts >= ? AND start_ts < ?`
    )
    .all(range.start, range.end) as { category: Category; start_ts: number; duration_sec: number }[]

  const points: TimelinePoint[] = Array.from({ length: buckets }, (_, i) => ({
    ts: range.start + i * bucketMs,
    productive: 0,
    neutral: 0,
    distracted: 0
  }))

  for (const r of rows) {
    const idx = Math.min(buckets - 1, Math.floor((r.start_ts - range.start) / bucketMs))
    points[idx][r.category] += Math.round(r.duration_sec / 60)
  }

  return points
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
  const rows = getDb()
    .prepare(
      `SELECT
         date(start_ts / 1000, 'unixepoch', 'localtime') AS day,
         category,
         SUM(duration_sec) AS total
       FROM activity_events
       WHERE is_afk = 0 AND start_ts >= ? AND start_ts < ?
       GROUP BY day, category
       ORDER BY day`
    )
    .all(range.start, range.end) as { day: string; category: Category; total: number }[]

  const map = new Map<string, DailyTotal>()
  for (const r of rows) {
    const entry = map.get(r.day) ?? { day: r.day, productive: 0, neutral: 0, distracted: 0 }
    entry[r.category] = r.total
    map.set(r.day, entry)
  }

  return Array.from(map.values())
}

export function getDeepWorkStreak(targetMin: number): number {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT
         date(start_ts / 1000, 'unixepoch', 'localtime') AS day,
         SUM(duration_sec) AS total
       FROM activity_events
       WHERE is_afk = 0 AND category = 'productive'
       GROUP BY day
       ORDER BY day DESC`
    )
    .all() as { day: string; total: number }[]

  const metDays = new Set(rows.filter((r) => r.total >= targetMin * 60).map((r) => r.day))
  let streak = 0
  const cursor = new Date()
  // A streak still counts if today's goal isn't met yet, so start from today and allow today to be pending.
  for (let i = 0; i < 366; i++) {
    const key = toLocalDateKey(cursor)
    if (metDays.has(key)) {
      streak++
    } else if (i === 0) {
      // today not yet met — keep looking back from yesterday without breaking
    } else {
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
