import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC } from '../shared/ipc'
import type {
  AppUsage,
  Category,
  DashboardSummary,
  DateRange,
  FocusSession,
  Goal,
  LiveStatus,
  MatchType,
  Rule,
  Settings,
  ActivityEvent,
  TimelinePoint,
  DailyTotal
} from '../shared/types'

const api = {
  getSettings: (): Promise<Settings> => ipcRenderer.invoke(IPC.settingsGet),
  setSettings: (patch: Partial<Settings>): Promise<Settings> =>
    ipcRenderer.invoke(IPC.settingsSet, patch),

  listRules: (): Promise<Rule[]> => ipcRenderer.invoke(IPC.rulesList),
  addRule: (input: {
    matcher: string
    matchType: MatchType
    category: Category
    thresholdSec?: number | null
  }): Promise<Rule> => ipcRenderer.invoke(IPC.rulesAdd, input),
  updateRule: (
    id: number,
    patch: Partial<{ matcher: string; matchType: MatchType; category: Category; thresholdSec: number | null }>
  ): Promise<Rule[]> => ipcRenderer.invoke(IPC.rulesUpdate, id, patch),
  deleteRule: (id: number): Promise<Rule[]> => ipcRenderer.invoke(IPC.rulesDelete, id),

  getDashboard: (range: DateRange): Promise<DashboardSummary> =>
    ipcRenderer.invoke(IPC.dashboardSummary, range),
  getTimeline: (range: DateRange, buckets: number): Promise<TimelinePoint[]> =>
    ipcRenderer.invoke(IPC.insightsTimeline, range, buckets),
  getAppMetrics: (range: DateRange, limit: number): Promise<AppUsage[]> =>
    ipcRenderer.invoke(IPC.insightsAppMetrics, range, limit),
  getRecentEvents: (range: DateRange, limit: number): Promise<ActivityEvent[]> =>
    ipcRenderer.invoke(IPC.insightsRecentEvents, range, limit),

  getDailyTotals: (range: DateRange): Promise<DailyTotal[]> =>
    ipcRenderer.invoke(IPC.reportsDaily, range),
  getStreak: (): Promise<number> => ipcRenderer.invoke(IPC.reportsStreak),

  getStatus: (): Promise<LiveStatus> => ipcRenderer.invoke(IPC.statusGet),

  startSession: (plannedMin: number, type: 'focus' | 'break'): Promise<FocusSession> =>
    ipcRenderer.invoke(IPC.sessionStart, plannedMin, type),
  stopSession: (): Promise<{ ok: boolean }> => ipcRenderer.invoke(IPC.sessionStop),
  listSessions: (range: DateRange): Promise<FocusSession[]> =>
    ipcRenderer.invoke(IPC.sessionList, range),
  getActiveSession: (): Promise<FocusSession | null> => ipcRenderer.invoke(IPC.sessionActive),

  listGoals: (): Promise<Goal[]> => ipcRenderer.invoke(IPC.goalsList),
  setGoal: (metric: Goal['metric'], target: number): Promise<Goal[]> =>
    ipcRenderer.invoke(IPC.goalsSet, metric, target),

  exportData: (range: DateRange, format: 'csv' | 'json'): Promise<{ ok: boolean; path?: string }> =>
    ipcRenderer.invoke(IPC.exportData, range, format),

  onStatusUpdate: (cb: (status: LiveStatus) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, status: LiveStatus): void => cb(status)
    ipcRenderer.on(IPC.statusUpdate, listener)
    return () => ipcRenderer.removeListener(IPC.statusUpdate, listener)
  }
}

export type FocusApi = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
