// Mock of the Electron `window.api` bridge for the browser demo build, so the real
// renderer runs outside Electron with demo data — it never touches the main process or SQLite.
import type {
  ActivityEvent,
  AppUsage,
  Category,
  DailyTotal,
  DashboardSummary,
  DateRange,
  FocusSession,
  Goal,
  LiveStatus,
  MatchType,
  Rule,
  Settings,
  TimelinePoint
} from '@shared/types'

const HOUR = 3600
const MIN = 60

const now = Date.now()
const startOfToday = new Date(now)
startOfToday.setHours(0, 0, 0, 0)
const dayStart = startOfToday.getTime()

function ts(hour: number, minute = 0): number {
  return dayStart + hour * HOUR * 1000 + minute * MIN * 1000
}

const apps: AppUsage[] = [
  {
    appName: 'Visual Studio Code',
    domain: null,
    category: 'productive',
    durationSec: 2 * HOUR + 40 * MIN,
    share: 0
  },
  {
    appName: 'Chrome',
    domain: 'github.com',
    category: 'productive',
    durationSec: 1 * HOUR + 15 * MIN,
    share: 0
  },
  {
    appName: 'Figma',
    domain: 'figma.com',
    category: 'productive',
    durationSec: 55 * MIN,
    share: 0
  },
  { appName: 'Slack', domain: null, category: 'neutral', durationSec: 38 * MIN, share: 0 },
  {
    appName: 'Chrome',
    domain: 'stackoverflow.com',
    category: 'productive',
    durationSec: 32 * MIN,
    share: 0
  },
  { appName: 'Notion', domain: 'notion.so', category: 'neutral', durationSec: 26 * MIN, share: 0 },
  {
    appName: 'Chrome',
    domain: 'youtube.com',
    category: 'distracted',
    durationSec: 42 * MIN,
    share: 0
  },
  { appName: 'Chrome', domain: 'x.com', category: 'distracted', durationSec: 18 * MIN, share: 0 },
  { appName: 'Spotify', domain: null, category: 'neutral', durationSec: 14 * MIN, share: 0 }
]

const totalAppSec = apps.reduce((sum, a) => sum + a.durationSec, 0)
apps.forEach((a) => {
  a.share = a.durationSec / totalAppSec
})

// Match the production API's duration-sorted ordering so "top" slices are correct.
apps.sort((a, b) => b.durationSec - a.durationSec)

function sumBy(cat: Category): number {
  return apps.filter((a) => a.category === cat).reduce((s, a) => s + a.durationSec, 0)
}

const totals = {
  productive: sumBy('productive'),
  neutral: sumBy('neutral'),
  distracted: sumBy('distracted')
}

const dashboard: DashboardSummary = {
  rangeStart: dayStart,
  rangeEnd: now,
  totals,
  totalTrackedSec: totalAppSec,
  deepWorkSec: totals.productive,
  distractionSec: totals.distracted,
  contextSwitches: 47,
  topApps: apps.slice(0, 6)
}

function buildTimeline(): TimelinePoint[] {
  const points: TimelinePoint[] = []
  // 9am -> 6pm working day, one point per 30 min.
  const shape: [number, number, number][] = [
    [9, 20, 2],
    [9.5, 25, 0],
    [10, 28, 1],
    [10.5, 26, 3],
    [11, 24, 5],
    [11.5, 18, 10],
    [12, 8, 18],
    [12.5, 6, 20],
    [13, 22, 6],
    [13.5, 27, 1],
    [14, 29, 0],
    [14.5, 25, 4],
    [15, 20, 9],
    [15.5, 15, 13],
    [16, 24, 3],
    [16.5, 28, 1],
    [17, 23, 5],
    [17.5, 17, 11]
  ]
  for (const [hour, prod, dist] of shape) {
    points.push({
      ts: ts(Math.floor(hour), (hour % 1) * 60),
      productive: prod * MIN,
      neutral: Math.max(0, 30 - prod - dist) * MIN,
      distracted: dist * MIN
    })
  }

  return points
}

const recentEvents: ActivityEvent[] = [
  {
    app: 'Visual Studio Code',
    title: 'mockApi.ts — flowline',
    url: null,
    domain: null,
    cat: 'productive',
    h: 17,
    m: 42,
    dur: 18
  },
  {
    app: 'Chrome',
    title: 'sanjaynishad/flowline · Pull Requests',
    url: 'https://github.com/sanjaynishad/flowline/pulls',
    domain: 'github.com',
    cat: 'productive',
    h: 17,
    m: 30,
    dur: 12
  },
  {
    app: 'Slack',
    title: '#engineering',
    url: null,
    domain: null,
    cat: 'neutral',
    h: 17,
    m: 18,
    dur: 8
  },
  {
    app: 'Chrome',
    title: 'How to center a div — Stack Overflow',
    url: 'https://stackoverflow.com',
    domain: 'stackoverflow.com',
    cat: 'productive',
    h: 17,
    m: 4,
    dur: 14
  },
  {
    app: 'Chrome',
    title: 'Lofi beats to code to — YouTube',
    url: 'https://youtube.com/watch',
    domain: 'youtube.com',
    cat: 'distracted',
    h: 16,
    m: 40,
    dur: 22
  },
  {
    app: 'Figma',
    title: 'Flowline — Dashboard',
    url: 'https://figma.com/file',
    domain: 'figma.com',
    cat: 'productive',
    h: 16,
    m: 0,
    dur: 40
  }
].map((e, i) => ({
  id: i + 1,
  appName: e.app,
  exePath: null,
  windowTitle: e.title,
  url: e.url,
  domain: e.domain,
  category: e.cat as Category,
  startTs: ts(e.h, e.m),
  endTs: ts(e.h, e.m + e.dur),
  durationSec: e.dur * MIN,
  isAfk: 0
}))

const dailyTotals: DailyTotal[] = (() => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const prod = [210, 245, 190, 265, 220, 90, 60]
  const neu = [60, 75, 55, 80, 70, 40, 30]
  const dist = [55, 40, 70, 35, 60, 80, 45]
  return days.map((day, i) => ({
    day,
    productive: prod[i] * MIN,
    neutral: neu[i] * MIN,
    distracted: dist[i] * MIN
  }))
})()

let sessions: FocusSession[] = [
  { id: 1, startTs: ts(9, 10), endTs: ts(9, 35), plannedMin: 25, type: 'focus', completed: 1 },
  { id: 2, startTs: ts(9, 35), endTs: ts(9, 40), plannedMin: 5, type: 'break', completed: 1 },
  { id: 3, startTs: ts(10, 5), endTs: ts(10, 55), plannedMin: 50, type: 'focus', completed: 1 },
  { id: 4, startTs: ts(13, 15), endTs: ts(13, 40), plannedMin: 25, type: 'focus', completed: 1 },
  { id: 5, startTs: ts(14, 30), endTs: ts(15, 20), plannedMin: 50, type: 'focus', completed: 1 },
  { id: 6, startTs: ts(16, 10), endTs: ts(16, 35), plannedMin: 25, type: 'focus', completed: 0 }
]

let rules: Rule[] = [
  {
    id: 1,
    matcher: 'Code.exe',
    matchType: 'exe',
    category: 'productive',
    thresholdSec: null,
    createdAt: now
  },
  {
    id: 2,
    matcher: 'github.com',
    matchType: 'domain',
    category: 'productive',
    thresholdSec: null,
    createdAt: now
  },
  {
    id: 3,
    matcher: 'figma.com',
    matchType: 'domain',
    category: 'productive',
    thresholdSec: null,
    createdAt: now
  },
  {
    id: 4,
    matcher: 'stackoverflow.com',
    matchType: 'domain',
    category: 'productive',
    thresholdSec: null,
    createdAt: now
  },
  {
    id: 5,
    matcher: 'youtube.com',
    matchType: 'domain',
    category: 'distracted',
    thresholdSec: 600,
    createdAt: now
  },
  {
    id: 6,
    matcher: 'x.com',
    matchType: 'domain',
    category: 'distracted',
    thresholdSec: null,
    createdAt: now
  },
  {
    id: 7,
    matcher: 'reddit.com',
    matchType: 'domain',
    category: 'distracted',
    thresholdSec: null,
    createdAt: now
  },
  {
    id: 8,
    matcher: 'Slack.exe',
    matchType: 'exe',
    category: 'neutral',
    thresholdSec: null,
    createdAt: now
  },
  {
    id: 9,
    matcher: 'Spotify.exe',
    matchType: 'exe',
    category: 'neutral',
    thresholdSec: null,
    createdAt: now
  },
  {
    id: 10,
    matcher: 'Standup',
    matchType: 'title',
    category: 'neutral',
    thresholdSec: null,
    createdAt: now
  }
]

let settings: Settings = {
  idleThresholdSec: 180,
  heartbeatSec: 20,
  distractionThresholdSec: 600,
  theme: 'dark',
  autostart: true,
  wsPort: 7413,
  notificationsEnabled: true,
  deepWorkTargetMin: 240,
  distractionLimitMin: 90
}

let goals: Goal[] = [
  { id: 1, metric: 'deep_work_min', target: 240, period: 'daily' },
  { id: 2, metric: 'distraction_max_min', target: 90, period: 'daily' }
]

const liveStatus: LiveStatus = {
  tracking: true,
  isAfk: false,
  current: {
    appName: 'Visual Studio Code',
    windowTitle: 'mockApi.ts — flowline',
    domain: null,
    category: 'productive',
    startTs: now - 18 * MIN * 1000
  },
  activeSessionSec: 18 * MIN,
  browserConnected: true
}

const resolved = <T>(value: T): Promise<T> => Promise.resolve(value)

export const mockApi = {
  getSettings: () => resolved(settings),
  setSettings: (patch: Partial<Settings>) => {
    settings = { ...settings, ...patch }
    return resolved(settings)
  },

  listRules: () => resolved(rules),
  addRule: (input: {
    matcher: string
    matchType: MatchType
    category: Category
    thresholdSec?: number | null
  }) => {
    const rule: Rule = {
      id: Math.max(0, ...rules.map((r) => r.id)) + 1,
      matcher: input.matcher,
      matchType: input.matchType,
      category: input.category,
      thresholdSec: input.thresholdSec ?? null,
      createdAt: Date.now()
    }
    rules = [rule, ...rules]
    return resolved(rule)
  },
  updateRule: (id: number, patch: Partial<Omit<Rule, 'id' | 'createdAt'>>) => {
    rules = rules.map((r) => (r.id === id ? { ...r, ...patch } : r))
    return resolved(rules)
  },
  deleteRule: (id: number) => {
    rules = rules.filter((r) => r.id !== id)
    return resolved(rules)
  },

  getDashboard: (_range: DateRange) => resolved(dashboard),
  getTimeline: (_range: DateRange, _buckets: number) => resolved(buildTimeline()),
  getAppMetrics: (_range: DateRange, limit: number) => resolved(apps.slice(0, limit)),
  getRecentEvents: (_range: DateRange, limit: number) => resolved(recentEvents.slice(0, limit)),

  getDailyTotals: (_range: DateRange) => resolved(dailyTotals),
  getStreak: () => resolved(12),

  getStatus: () => resolved(liveStatus),

  startSession: (plannedMin: number, type: 'focus' | 'break') => {
    const session: FocusSession = {
      id: Math.max(0, ...sessions.map((s) => s.id)) + 1,
      startTs: Date.now(),
      endTs: null,
      plannedMin,
      type,
      completed: 0
    }
    sessions = [session, ...sessions]
    return resolved(session)
  },
  stopSession: () => resolved({ ok: true }),
  listSessions: (_range: DateRange) => resolved(sessions),
  getActiveSession: () => resolved(null),

  listGoals: () => resolved(goals),
  setGoal: (metric: Goal['metric'], target: number) => {
    goals = goals.map((g) => (g.metric === metric ? { ...g, target } : g))
    return resolved(goals)
  },

  exportData: (_range: DateRange, _format: 'csv' | 'json') =>
    resolved({ ok: true, path: 'C:/Users/you/Downloads/flowline-export.csv' }),

  onStatusUpdate: (_cb: (status: LiveStatus) => void) => {
    return () => {}
  }
}

export type MockApi = typeof mockApi
