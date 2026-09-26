import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import type { Category, MatchType } from '../../shared/types'

let db: Database.Database

const SCHEMA = `
CREATE TABLE IF NOT EXISTS activity_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  app_name      TEXT NOT NULL,
  exe_path      TEXT,
  window_title  TEXT,
  url           TEXT,
  domain        TEXT,
  category      TEXT NOT NULL DEFAULT 'neutral',
  start_ts      INTEGER NOT NULL,
  end_ts        INTEGER NOT NULL,
  duration_sec  INTEGER NOT NULL DEFAULT 0,
  is_afk        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_events_start ON activity_events(start_ts);
CREATE INDEX IF NOT EXISTS idx_events_category ON activity_events(category);

CREATE TABLE IF NOT EXISTS rules (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  matcher      TEXT NOT NULL,
  match_type   TEXT NOT NULL,
  category     TEXT NOT NULL,
  threshold_sec INTEGER,
  created_at   INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rules_unique ON rules(matcher, match_type);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  start_ts    INTEGER NOT NULL,
  end_ts      INTEGER,
  planned_min INTEGER NOT NULL,
  type        TEXT NOT NULL DEFAULT 'focus',
  completed   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS goals (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  metric  TEXT NOT NULL,
  target  INTEGER NOT NULL,
  period  TEXT NOT NULL DEFAULT 'daily'
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_unique ON goals(metric, period);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`

interface DefaultRule {
  matcher: string
  matchType: MatchType
  category: Category
  thresholdSec?: number
}

const DEFAULT_RULES: DefaultRule[] = [
  { matcher: 'Code.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'Code - Insiders.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'cursor.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'devenv.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'idea64.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'pycharm64.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'webstorm64.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'rider64.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'goland64.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'clion64.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'sublime_text.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'notepad++.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'WindowsTerminal.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'wt.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'pwsh.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'powershell.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'wsl.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'figma.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'Photoshop.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'Illustrator.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'Blender.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'Postman.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'dbeaver.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'obsidian.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'Docker Desktop.exe', matchType: 'exe', category: 'productive' },
  { matcher: 'github.com', matchType: 'domain', category: 'productive' },
  { matcher: 'gitlab.com', matchType: 'domain', category: 'productive' },
  { matcher: 'bitbucket.org', matchType: 'domain', category: 'productive' },
  { matcher: 'stackoverflow.com', matchType: 'domain', category: 'productive' },
  { matcher: 'stackexchange.com', matchType: 'domain', category: 'productive' },
  { matcher: 'developer.mozilla.org', matchType: 'domain', category: 'productive' },
  { matcher: 'learn.microsoft.com', matchType: 'domain', category: 'productive' },
  { matcher: 'npmjs.com', matchType: 'domain', category: 'productive' },
  { matcher: 'pypi.org', matchType: 'domain', category: 'productive' },
  { matcher: 'figma.com', matchType: 'domain', category: 'productive' },
  { matcher: 'chatgpt.com', matchType: 'domain', category: 'productive' },
  { matcher: 'claude.ai', matchType: 'domain', category: 'productive' },
  { matcher: 'leetcode.com', matchType: 'domain', category: 'productive' },
  { matcher: 'localhost', matchType: 'domain', category: 'productive' },
  { matcher: '127.0.0.1', matchType: 'domain', category: 'productive' },
  { matcher: 'slack.exe', matchType: 'exe', category: 'neutral' },
  { matcher: 'ms-teams.exe', matchType: 'exe', category: 'neutral' },
  { matcher: 'Teams.exe', matchType: 'exe', category: 'neutral' },
  { matcher: 'outlook.exe', matchType: 'exe', category: 'neutral' },
  { matcher: 'Zoom.exe', matchType: 'exe', category: 'neutral' },
  { matcher: 'Telegram.exe', matchType: 'exe', category: 'neutral' },
  { matcher: 'explorer.exe', matchType: 'exe', category: 'neutral' },
  { matcher: 'Spotify.exe', matchType: 'exe', category: 'neutral' },
  { matcher: 'slack.com', matchType: 'domain', category: 'neutral' },
  { matcher: 'notion.so', matchType: 'domain', category: 'neutral' },
  { matcher: 'mail.google.com', matchType: 'domain', category: 'neutral' },
  { matcher: 'gmail.com', matchType: 'domain', category: 'neutral' },
  { matcher: 'outlook.office.com', matchType: 'domain', category: 'neutral' },
  { matcher: 'calendar.google.com', matchType: 'domain', category: 'neutral' },
  { matcher: 'docs.google.com', matchType: 'domain', category: 'neutral' },
  { matcher: 'drive.google.com', matchType: 'domain', category: 'neutral' },
  { matcher: 'teams.microsoft.com', matchType: 'domain', category: 'neutral' },
  { matcher: 'atlassian.net', matchType: 'domain', category: 'neutral' },
  { matcher: 'trello.com', matchType: 'domain', category: 'neutral' },
  { matcher: 'asana.com', matchType: 'domain', category: 'neutral' },
  { matcher: 'linkedin.com', matchType: 'domain', category: 'neutral' },
  { matcher: 'zoom.us', matchType: 'domain', category: 'neutral' },
  { matcher: 'web.whatsapp.com', matchType: 'domain', category: 'neutral' },
  { matcher: 'steam.exe', matchType: 'exe', category: 'distracted' },
  { matcher: 'EpicGamesLauncher.exe', matchType: 'exe', category: 'distracted' },
  { matcher: 'Discord.exe', matchType: 'exe', category: 'distracted', thresholdSec: 900 },
  { matcher: 'youtube.com', matchType: 'domain', category: 'distracted', thresholdSec: 600 },
  { matcher: 'x.com', matchType: 'domain', category: 'distracted', thresholdSec: 300 },
  { matcher: 'twitter.com', matchType: 'domain', category: 'distracted', thresholdSec: 300 },
  { matcher: 'reddit.com', matchType: 'domain', category: 'distracted', thresholdSec: 600 },
  { matcher: 'facebook.com', matchType: 'domain', category: 'distracted' },
  { matcher: 'instagram.com', matchType: 'domain', category: 'distracted' },
  { matcher: 'tiktok.com', matchType: 'domain', category: 'distracted' },
  { matcher: 'snapchat.com', matchType: 'domain', category: 'distracted' },
  { matcher: 'pinterest.com', matchType: 'domain', category: 'distracted' },
  { matcher: '9gag.com', matchType: 'domain', category: 'distracted' },
  { matcher: 'netflix.com', matchType: 'domain', category: 'distracted' },
  { matcher: 'primevideo.com', matchType: 'domain', category: 'distracted' },
  { matcher: 'disneyplus.com', matchType: 'domain', category: 'distracted' },
  { matcher: 'hotstar.com', matchType: 'domain', category: 'distracted' },
  { matcher: 'twitch.tv', matchType: 'domain', category: 'distracted' }
]

const DEFAULT_SETTINGS: Record<string, string> = {
  idleThresholdSec: '120',
  heartbeatSec: '20',
  distractionThresholdSec: '600',
  theme: 'dark',
  autostart: 'false',
  wsPort: '7413',
  notificationsEnabled: 'true',
  deepWorkTargetMin: '360',
  distractionLimitMin: '60'
}

const DEFAULT_GOALS = [
  { metric: 'deep_work_min', target: 360, period: 'daily' },
  { metric: 'distraction_max_min', target: 60, period: 'daily' }
]

// Bump when DEFAULT_RULES gains new entries so existing installs receive them once.
const CURRENT_SEED_VERSION = 2

export function initDatabase(): Database.Database {
  const dbPath = join(app.getPath('userData'), 'flowline.db')
  const firstRun = !existsSync(dbPath)

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)

  seedSettings()
  if (firstRun) {
    seedRules()
    seedGoals()
    setSeedVersion(CURRENT_SEED_VERSION)
  } else if (getSeedVersion() < CURRENT_SEED_VERSION) {
    // Top up newly shipped default rules on existing installs, once per version.
    seedRules()
    setSeedVersion(CURRENT_SEED_VERSION)
  }

  return db
}

function getSeedVersion(): number {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('seedVersion') as
    | { value: string }
    | undefined
  return row ? Number(row.value) : 0
}

function setSeedVersion(version: number): void {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run('seedVersion', String(version))
}

function seedSettings(): void {
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      insert.run(key, value)
    }
  })
  tx()
}

function seedRules(): void {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO rules (matcher, match_type, category, threshold_sec, created_at) VALUES (?, ?, ?, ?, ?)'
  )
  const now = Date.now()
  const tx = db.transaction(() => {
    for (const r of DEFAULT_RULES) {
      insert.run(r.matcher, r.matchType, r.category, r.thresholdSec ?? null, now)
    }
  })
  tx()
}

function seedGoals(): void {
  const insert = db.prepare('INSERT OR IGNORE INTO goals (metric, target, period) VALUES (?, ?, ?)')
  const tx = db.transaction(() => {
    for (const g of DEFAULT_GOALS) {
      insert.run(g.metric, g.target, g.period)
    }
  })
  tx()
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }

  return db
}
