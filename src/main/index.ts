import { app, shell, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { IPC } from '../shared/ipc'
import type { LiveStatus, Settings } from '../shared/types'
import { initDatabase } from './db/database'
import { getSettings } from './db/repositories'
import { browserBridge } from './browser/wsServer'
import { tracker } from './tracking/tracker'
import { sessionManager } from './sessions'
import { registerIpcHandlers } from './ipc/handlers'
import { notify } from './notifications'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let lastStatusSent = 0

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f131c',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  const icon = nativeImage.createFromPath(join(__dirname, '../../resources/tray.png'))
  tray = new Tray(icon)
  tray.setToolTip('Flowline')

  const menu = Menu.buildFromTemplate([
    {
      label: 'Open Flowline',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' },
    {
      label: 'Start 25-min focus block',
      click: () => sessionManager.start(25, 'focus')
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(menu)
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

function pushStatus(status: LiveStatus): void {
  const now = Date.now()
  if (now - lastStatusSent < 1000) {
    return
  }

  lastStatusSent = now
  mainWindow?.webContents.send(IPC.statusUpdate, status)
}

function applyAutostart(enabled: boolean): void {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    args: ['--hidden']
  })
}

function bootstrap(): void {
  initDatabase()
  const settings: Settings = getSettings()

  sessionManager.setNotify(settings.notificationsEnabled)
  applyAutostart(settings.autostart)

  browserBridge.start(settings.wsPort, () => {
    pushStatus(tracker.getStatus())
  })

  tracker.start(
    {
      idleThresholdSec: settings.idleThresholdSec,
      heartbeatSec: settings.heartbeatSec,
      distractionThresholdSec: settings.distractionThresholdSec
    },
    {
      onStatus: pushStatus,
      onDistraction: ({ label, seconds }) => {
        if (getSettings().notificationsEnabled) {
          const mins = Math.round(seconds / 60)
          notify('Distraction alert', `${mins} min on ${label}. Time to refocus?`)
        }
      }
    }
  )

  registerIpcHandlers({
    onSettingsChanged: (next) => {
      applyAutostart(next.autostart)
    }
  })
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.flowline.app')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    bootstrap()
    createWindow()
    createTray()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  // Keep running in the tray; do not quit when the window closes.
  app.on('window-all-closed', () => {
    if (process.platform !== 'win32' && !isQuitting) {
      // no-op: tray keeps the app alive
    }
  })

  app.on('before-quit', () => {
    isQuitting = true
    tracker.stop()
    browserBridge.stop()
  })
}
