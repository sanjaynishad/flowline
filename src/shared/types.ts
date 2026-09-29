export type Category = 'productive' | 'neutral' | 'distracted'

export type MatchType = 'exe' | 'domain' | 'title'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface Rule {
  id: number
  matcher: string
  matchType: MatchType
  category: Category
  thresholdSec: number | null
  createdAt: number
}

export interface ActivityEvent {
  id: number
  appName: string
  exePath: string | null
  windowTitle: string | null
  url: string | null
  domain: string | null
  category: Category
  startTs: number
  endTs: number
  durationSec: number
  isAfk: number
}

export interface FocusSession {
  id: number
  startTs: number
  endTs: number | null
  plannedMin: number
  type: 'focus' | 'break'
  completed: number
}

export interface Goal {
  id: number
  metric: 'deep_work_min' | 'distraction_max_min'
  target: number
  period: 'daily'
}

export interface CategoryTotals {
  productive: number
  neutral: number
  distracted: number
}

export interface DashboardSummary {
  rangeStart: number
  rangeEnd: number
  totals: CategoryTotals
  totalTrackedSec: number
  deepWorkSec: number
  distractionSec: number
  contextSwitches: number
  topApps: AppUsage[]
}

export interface AppUsage {
  appName: string
  domain: string | null
  category: Category
  durationSec: number
  share: number
}

export interface TimelinePoint {
  ts: number
  productive: number
  neutral: number
  distracted: number
}

export interface LiveStatus {
  tracking: boolean
  isAfk: boolean
  current: {
    appName: string
    windowTitle: string | null
    domain: string | null
    category: Category
    startTs: number
  } | null
  activeSessionSec: number
  browserConnected: boolean
}

export interface Settings {
  idleThresholdSec: number
  heartbeatSec: number
  distractionThresholdSec: number
  theme: ThemeMode
  autostart: boolean
  wsPort: number
  notificationsEnabled: boolean
  deepWorkTargetMin: number
  distractionLimitMin: number
}

export type RangePreset = 'today' | 'yesterday' | 'last7'

export interface DateRange {
  start: number
  end: number
}

export interface DailyTotal {
  day: string
  productive: number
  neutral: number
  distracted: number
}
