import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc'
import type { Category, DateRange, Goal, MatchType, Settings } from '../../shared/types'
import {
  addRule,
  deleteRule,
  getAppMetrics,
  getDailyTotals,
  getDashboardSummary,
  getDeepWorkStreak,
  getGoals,
  getRecentEvents,
  getRules,
  getSettings,
  getTimeline,
  setGoal,
  setSettings,
  updateRule
} from '../db/repositories'
import { tracker } from '../tracking/tracker'
import { sessionManager } from '../sessions'
import { exportData } from '../exporter'

export interface HandlerDeps {
  onSettingsChanged: (settings: Settings) => void
}

export function registerIpcHandlers(deps: HandlerDeps): void {
  ipcMain.handle(IPC.settingsGet, () => getSettings())

  ipcMain.handle(IPC.settingsSet, (_e, patch: Partial<Settings>) => {
    const next = setSettings(patch)
    tracker.updateConfig({
      idleThresholdSec: next.idleThresholdSec,
      heartbeatSec: next.heartbeatSec,
      distractionThresholdSec: next.distractionThresholdSec
    })
    sessionManager.setNotify(next.notificationsEnabled)
    deps.onSettingsChanged(next)
    return next
  })

  ipcMain.handle(IPC.rulesList, () => getRules())

  ipcMain.handle(
    IPC.rulesAdd,
    (_e, input: { matcher: string; matchType: MatchType; category: Category; thresholdSec?: number | null }) => {
      const rule = addRule(input)
      tracker.reloadRules()
      return rule
    }
  )

  ipcMain.handle(IPC.rulesUpdate, (_e, id: number, patch: Partial<{ matcher: string; matchType: MatchType; category: Category; thresholdSec: number | null }>) => {
    updateRule(id, patch)
    tracker.reloadRules()
    return getRules()
  })

  ipcMain.handle(IPC.rulesDelete, (_e, id: number) => {
    deleteRule(id)
    tracker.reloadRules()
    return getRules()
  })

  ipcMain.handle(IPC.dashboardSummary, (_e, range: DateRange) => getDashboardSummary(range))

  ipcMain.handle(IPC.insightsTimeline, (_e, range: DateRange, buckets: number) =>
    getTimeline(range, buckets)
  )

  ipcMain.handle(IPC.insightsAppMetrics, (_e, range: DateRange, limit: number) =>
    getAppMetrics(range, limit)
  )

  ipcMain.handle(IPC.insightsRecentEvents, (_e, range: DateRange, limit: number) =>
    getRecentEvents(range, limit)
  )

  ipcMain.handle(IPC.reportsDaily, (_e, range: DateRange) => getDailyTotals(range))

  ipcMain.handle(IPC.reportsStreak, () => {
    const goals = getGoals()
    const target = goals.find((g) => g.metric === 'deep_work_min')?.target ?? 360
    return getDeepWorkStreak(target)
  })

  ipcMain.handle(IPC.statusGet, () => tracker.getStatus())

  ipcMain.handle(IPC.sessionStart, (_e, plannedMin: number, type: 'focus' | 'break') =>
    sessionManager.start(plannedMin, type)
  )

  ipcMain.handle(IPC.sessionStop, () => {
    sessionManager.cancel(true)
    return { ok: true }
  })

  ipcMain.handle(IPC.sessionList, (_e, range: DateRange) => sessionManager.list(range))

  ipcMain.handle(IPC.goalsList, () => getGoals())

  ipcMain.handle(IPC.goalsSet, (_e, metric: Goal['metric'], target: number) => {
    setGoal(metric, target)
    return getGoals()
  })

  ipcMain.handle(IPC.exportData, (_e, range: DateRange, format: 'csv' | 'json') =>
    exportData(range, format)
  )
}
