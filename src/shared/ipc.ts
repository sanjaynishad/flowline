export const IPC = {
  settingsGet: 'settings:get',
  settingsSet: 'settings:set',
  rulesList: 'rules:list',
  rulesAdd: 'rules:add',
  rulesUpdate: 'rules:update',
  rulesDelete: 'rules:delete',
  dashboardSummary: 'dashboard:summary',
  insightsTimeline: 'insights:timeline',
  insightsAppMetrics: 'insights:appMetrics',
  insightsRecentEvents: 'insights:recentEvents',
  reportsDaily: 'reports:daily',
  reportsStreak: 'reports:streak',
  statusGet: 'status:get',
  sessionStart: 'sessions:start',
  sessionStop: 'sessions:stop',
  sessionList: 'sessions:list',
  sessionActive: 'sessions:active',
  goalsList: 'goals:list',
  goalsSet: 'goals:set',
  exportData: 'export:data',
  // main -> renderer push channels
  statusUpdate: 'status:update'
} as const
