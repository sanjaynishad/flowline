import { WebSocketServer, type WebSocket } from 'ws'
import { extractDomain } from '../tracking/categorizer'

export interface BrowserTab {
  url: string | null
  domain: string | null
  title: string | null
  receivedAt: number
}

const FRESHNESS_MS = 5000

// Extension ID derived from the pinned public key in browser-extension/manifest.json.
const ALLOWED_ORIGINS = new Set(['chrome-extension://jcoofjgacfkefbpbkeecocghleheinpa'])

class BrowserBridge {
  private wss: WebSocketServer | null = null
  private latestByClient = new Map<WebSocket, BrowserTab>()
  private clients = new Set<WebSocket>()
  private onStatusChange: ((connected: boolean) => void) | null = null
  private onTab: (() => void) | null = null

  start(port: number, onStatusChange?: (connected: boolean) => void): void {
    this.onStatusChange = onStatusChange ?? null
    this.wss = new WebSocketServer({ host: '127.0.0.1', port })

    this.wss.on('connection', (ws, req) => {
      // Only the Flowline Bridge extension may connect; blocks web pages and other extensions.
      if (!ALLOWED_ORIGINS.has(req.headers.origin ?? '')) {
        ws.close(1008, 'origin not allowed')
        return
      }

      this.clients.add(ws)
      this.emitStatus()

      ws.on('message', (raw) => {
        this.handleMessage(ws, raw.toString())
      })

      ws.on('close', () => {
        this.clients.delete(ws)
        this.latestByClient.delete(ws)
        this.emitStatus()
      })

      ws.on('error', () => {
        this.clients.delete(ws)
        this.latestByClient.delete(ws)
        this.emitStatus()
      })
    })

    this.wss.on('error', (err) => {
      console.error('[browser-bridge] server error:', err.message)
    })
  }

  // Registers a callback fired on every tab report so the tracker can split the browser span immediately.
  setTabListener(cb: () => void): void {
    this.onTab = cb
  }

  private handleMessage(ws: WebSocket, text: string): void {
    try {
      const msg = JSON.parse(text) as unknown
      if (typeof msg !== 'object' || msg === null) {
        return
      }

      const frame = msg as { url?: unknown; title?: unknown; focused?: unknown }
      if (frame.focused === false) {
        this.latestByClient.delete(ws)
      } else {
        const url = typeof frame.url === 'string' ? frame.url : null
        const title = typeof frame.title === 'string' ? frame.title : null
        this.latestByClient.set(ws, {
          url,
          domain: extractDomain(url),
          title,
          receivedAt: Date.now()
        })
      }

      this.onTab?.()
    } catch {
      // Ignore malformed frames.
    }
  }

  getFreshTab(): BrowserTab | null {
    const cutoff = Date.now() - FRESHNESS_MS
    let freshest: BrowserTab | null = null
    for (const tab of this.latestByClient.values()) {
      if (tab.receivedAt > cutoff && (!freshest || tab.receivedAt > freshest.receivedAt)) {
        freshest = tab
      }
    }

    return freshest
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
    this.latestByClient.clear()
    this.wss?.close()
    this.wss = null
  }
}

export const browserBridge = new BrowserBridge()
