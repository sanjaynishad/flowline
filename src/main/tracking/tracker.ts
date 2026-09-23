import { powerMonitor } from 'electron'
import { ActiveWindow } from '@paymoapp/active-window'
import type { Category, LiveStatus, Rule } from '../../shared/types'
import { getRules, insertEvent, updateEventEnd, deleteEmptyEvent } from '../db/repositories'
import { classify, isBrowser, type Candidate } from './categorizer'
import { browserBridge } from '../browser/wsServer'

interface WinInfo {
  title: string
  application: string
  path: string
  pid: number
}

interface OpenSpan {
  eventId: number
  appName: string
  exePath: string | null
  windowTitle: string | null
  url: string | null
  domain: string | null
  category: Category
  thresholdSec: number | null
  startTs: number
}

export interface TrackerCallbacks {
  onStatus: (status: LiveStatus) => void
  onDistraction: (info: { label: string; seconds: number }) => void
}

class Tracker {
  private rules: Rule[] = []
  private span: OpenSpan | null = null
  private afk = false
  private tracking = false
  private heartbeat: NodeJS.Timeout | null = null
  private subscriptionId: number | null = null
  private idleThresholdSec = 120
  private heartbeatSec = 20
  private distractionThresholdSec = 600
  private distractedAccumSec = 0
  private distractionNotified = false
  private callbacks: TrackerCallbacks | null = null

  start(
    config: { idleThresholdSec: number; heartbeatSec: number; distractionThresholdSec: number },
    callbacks: TrackerCallbacks
  ): void {
    this.idleThresholdSec = config.idleThresholdSec
    this.heartbeatSec = config.heartbeatSec
    this.distractionThresholdSec = config.distractionThresholdSec
    this.callbacks = callbacks
    this.rules = getRules()
    this.tracking = true

    ActiveWindow.initialize()
    this.subscriptionId = ActiveWindow.subscribe((winInfo) => {
      this.onWindowChange(winInfo as WinInfo | null)
    })

    // No foreground event fires for the already-focused window, so seed the first span.
    const initial = ActiveWindow.getActiveWindow() as WinInfo | null
    if (initial) {
      this.openSpan(initial)
    }

    this.heartbeat = setInterval(() => this.tick(), this.heartbeatSec * 1000)
    this.emitStatus()
  }

  reloadRules(): void {
    this.rules = getRules()
  }

  updateConfig(config: {
    idleThresholdSec?: number
    heartbeatSec?: number
    distractionThresholdSec?: number
  }): void {
    if (config.idleThresholdSec !== undefined) {
      this.idleThresholdSec = config.idleThresholdSec
    }

    if (config.distractionThresholdSec !== undefined) {
      this.distractionThresholdSec = config.distractionThresholdSec
    }

    if (config.heartbeatSec !== undefined && config.heartbeatSec !== this.heartbeatSec) {
      this.heartbeatSec = config.heartbeatSec
      if (this.heartbeat) {
        clearInterval(this.heartbeat)
        this.heartbeat = setInterval(() => this.tick(), this.heartbeatSec * 1000)
      }
    }
  }

  private buildCandidate(winInfo: WinInfo): Candidate {
    const base: Candidate = {
      appName: winInfo.application || 'Unknown',
      exePath: winInfo.path || null,
      windowTitle: winInfo.title || null,
      domain: null
    }

    if (isBrowser(base)) {
      const tab = browserBridge.getFreshTab()
      if (tab) {
        base.domain = tab.domain
        base.windowTitle = tab.title ?? base.windowTitle
      }
    }

    return base
  }

  private candidateKey(c: Candidate): string {
    return `${c.exePath ?? c.appName}|${c.domain ?? c.windowTitle ?? ''}`
  }

  private openSpan(winInfo: WinInfo): void {
    const candidate = this.buildCandidate(winInfo)
    const cls = classify(candidate, this.rules)
    const now = Date.now()
    const url = candidate.domain ? browserBridge.getFreshTab()?.url ?? null : null

    const eventId = insertEvent({
      appName: candidate.appName,
      exePath: candidate.exePath,
      windowTitle: candidate.windowTitle,
      url,
      domain: candidate.domain,
      category: cls.category,
      startTs: now,
      endTs: now,
      durationSec: 0,
      isAfk: 0
    })

    this.span = {
      eventId,
      appName: candidate.appName,
      exePath: candidate.exePath,
      windowTitle: candidate.windowTitle,
      url,
      domain: candidate.domain,
      category: cls.category,
      thresholdSec: cls.thresholdSec,
      startTs: now
    }

    if (cls.category !== 'distracted') {
      this.distractedAccumSec = 0
      this.distractionNotified = false
    }
  }

  private flushSpan(endTs: number): void {
    if (!this.span) {
      return
    }

    const durationSec = Math.max(0, Math.round((endTs - this.span.startTs) / 1000))
    updateEventEnd(this.span.eventId, endTs, durationSec)
  }

  private closeSpan(endTs: number): void {
    if (!this.span) {
      return
    }

    const durationSec = Math.max(0, Math.round((endTs - this.span.startTs) / 1000))
    if (durationSec === 0) {
      deleteEmptyEvent(this.span.eventId)
    } else {
      updateEventEnd(this.span.eventId, endTs, durationSec)
    }

    this.span = null
  }

  private onWindowChange(winInfo: WinInfo | null): void {
    if (!this.tracking) {
      return
    }

    const now = Date.now()
    this.afk = false

    if (!winInfo) {
      this.closeSpan(now)
      this.emitStatus()
      return
    }

    const candidate = this.buildCandidate(winInfo)
    if (this.span && this.candidateKey(candidate) === this.spanKey()) {
      this.emitStatus()
      return
    }

    this.closeSpan(now)
    this.openSpan(winInfo)
    this.emitStatus()
  }

  private spanKey(): string {
    if (!this.span) {
      return ''
    }

    return `${this.span.exePath ?? this.span.appName}|${this.span.domain ?? this.span.windowTitle ?? ''}`
  }

  private tick(): void {
    if (!this.tracking) {
      return
    }

    const now = Date.now()
    const idleSec = powerMonitor.getSystemIdleTime()

    if (idleSec >= this.idleThresholdSec) {
      if (!this.afk) {
        const stoppedAt = Math.max(this.span?.startTs ?? now, now - idleSec * 1000)
        this.closeSpan(stoppedAt)
        this.afk = true
        this.distractedAccumSec = 0
        this.distractionNotified = false
      }

      this.emitStatus()
      return
    }

    if (this.afk || !this.span) {
      this.afk = false
      const current = ActiveWindow.getActiveWindow() as WinInfo | null
      if (current) {
        this.openSpan(current)
      }

      this.emitStatus()
      return
    }

    // Detect in-window browser tab changes (no OS foreground event fires for those).
    const current = ActiveWindow.getActiveWindow() as WinInfo | null
    if (current) {
      const candidate = this.buildCandidate(current)
      if (this.candidateKey(candidate) !== this.spanKey()) {
        this.closeSpan(now)
        this.openSpan(current)
        this.emitStatus()
        return
      }
    }

    this.flushSpan(now)
    this.trackDistraction()
    this.emitStatus()
  }

  private trackDistraction(): void {
    if (!this.span || this.span.category !== 'distracted') {
      return
    }

    this.distractedAccumSec += this.heartbeatSec
    const limit = this.span.thresholdSec ?? this.distractionThresholdSec
    if (!this.distractionNotified && this.distractedAccumSec >= limit) {
      this.distractionNotified = true
      this.callbacks?.onDistraction({
        label: this.span.domain ?? this.span.appName,
        seconds: this.distractedAccumSec
      })
    }
  }

  private emitStatus(): void {
    const status: LiveStatus = {
      tracking: this.tracking,
      isAfk: this.afk,
      current: this.span
        ? {
            appName: this.span.appName,
            windowTitle: this.span.windowTitle,
            domain: this.span.domain,
            category: this.span.category,
            startTs: this.span.startTs
          }
        : null,
      activeSessionSec: this.span ? Math.round((Date.now() - this.span.startTs) / 1000) : 0,
      browserConnected: browserBridge.isConnected()
    }

    this.callbacks?.onStatus(status)
  }

  getStatus(): LiveStatus {
    return {
      tracking: this.tracking,
      isAfk: this.afk,
      current: this.span
        ? {
            appName: this.span.appName,
            windowTitle: this.span.windowTitle,
            domain: this.span.domain,
            category: this.span.category,
            startTs: this.span.startTs
          }
        : null,
      activeSessionSec: this.span ? Math.round((Date.now() - this.span.startTs) / 1000) : 0,
      browserConnected: browserBridge.isConnected()
    }
  }

  stop(): void {
    this.tracking = false
    if (this.span) {
      this.closeSpan(Date.now())
    }

    if (this.heartbeat) {
      clearInterval(this.heartbeat)
      this.heartbeat = null
    }

    if (this.subscriptionId !== null) {
      ActiveWindow.unsubscribe(this.subscriptionId)
      this.subscriptionId = null
    }
  }
}

export const tracker = new Tracker()
