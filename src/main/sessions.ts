import { startSession, endSession, getSessions } from './db/repositories'
import { notify } from './notifications'
import type { DateRange, FocusSession } from '../shared/types'

interface ActiveSession {
  id: number
  type: 'focus' | 'break'
  plannedMin: number
  timer: NodeJS.Timeout
}

class SessionManager {
  private active: ActiveSession | null = null
  private notifyEnabled = true

  setNotify(enabled: boolean): void {
    this.notifyEnabled = enabled
  }

  start(plannedMin: number, type: 'focus' | 'break'): FocusSession {
    this.cancel(false)
    const id = startSession(plannedMin, type)
    const timer = setTimeout(() => this.complete(), plannedMin * 60 * 1000)
    this.active = { id, type, plannedMin, timer }

    return {
      id,
      startTs: Date.now(),
      endTs: null,
      plannedMin,
      type,
      completed: 0
    }
  }

  private complete(): void {
    if (!this.active) {
      return
    }

    const { id, type } = this.active
    endSession(id, true)
    clearTimeout(this.active.timer)
    this.active = null

    if (this.notifyEnabled) {
      if (type === 'focus') {
        notify('Focus block complete', 'Nice work. Time for a short break.')
      } else {
        notify('Break over', 'Ready for another focus block?')
      }
    }
  }

  cancel(userInitiated = true): void {
    if (!this.active) {
      return
    }

    clearTimeout(this.active.timer)
    endSession(this.active.id, false)
    this.active = null

    if (userInitiated && this.notifyEnabled) {
      notify('Session stopped', 'Focus session ended early.')
    }
  }

  getActiveId(): number | null {
    return this.active?.id ?? null
  }

  list(range: DateRange): FocusSession[] {
    return getSessions(range)
  }
}

export const sessionManager = new SessionManager()
