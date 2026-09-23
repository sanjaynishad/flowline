import { WebSocketServer, type WebSocket } from 'ws'
import { extractDomain } from '../tracking/categorizer'

export interface BrowserTab {
  url: string | null
  domain: string | null
  title: string | null
  receivedAt: number
}

const FRESHNESS_MS = 5000

class BrowserBridge {
  private wss: WebSocketServer | null = null
  private latest: BrowserTab | null = null
  private clients = new Set<WebSocket>()
  private onStatusChange: ((connected: boolean) => void) | null = null

  start(port: number, onStatusChange?: (connected: boolean) => void): void {
    this.onStatusChange = onStatusChange ?? null
    this.wss = new WebSocketServer({ host: '127.0.0.1', port })

    this.wss.on('connection', (ws, req) => {
      // Only accept the browser extension; reject web pages that can reach loopback.
      const origin = req.headers.origin ?? ''
      if (!/^(chrome-extension|moz-extension):\/\//.test(origin)) {
        ws.close(1008, 'origin not allowed')
        return
      }

      this.clients.add(ws)
      this.emitStatus()

      ws.on('message', (raw) => {
        this.handleMessage(raw.toString())
      })

      ws.on('close', () => {
        this.clients.delete(ws)
        this.emitStatus()
      })

      ws.on('error', () => {
        this.clients.delete(ws)
        this.emitStatus()
      })
    })

    this.wss.on('error', (err) => {
      console.error('[browser-bridge] server error:', err.message)
    })
  }

  private handleMessage(text: string): void {
    try {
      const msg = JSON.parse(text) as { url?: string; title?: string; focused?: boolean }
      if (msg.focused === false) {
        this.latest = null
        return
      }

      const url = msg.url ?? null
      this.latest = {
        url,
        domain: extractDomain(url),
        title: msg.title ?? null,
        receivedAt: Date.now()
      }
    } catch {
      // Ignore malformed frames.
    }
  }

  getFreshTab(): BrowserTab | null {
    if (!this.latest) {
      return null
    }

    if (Date.now() - this.latest.receivedAt > FRESHNESS_MS) {
      return null
    }

    return this.latest
  }

  isConnected(): boolean {
    return this.clients.size > 0
  }

  private emitStatus(): void {
    this.onStatusChange?.(this.isConnected())
  }

  stop(): void {
    for (const ws of this.clients) {
      ws.terminate()
    }

    this.clients.clear()
    this.wss?.close()
    this.wss = null
  }
}

export const browserBridge = new BrowserBridge()
