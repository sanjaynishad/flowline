// Flowline Bridge — reports the active tab to the desktop app over a local WebSocket.
const WS_URL = 'ws://127.0.0.1:7413'
const RECONNECT_MS = 3000

let socket = null
let reconnectTimer = null

function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }

  try {
    socket = new WebSocket(WS_URL)
  } catch (e) {
    scheduleReconnect()
    return
  }

  socket.addEventListener('open', () => {
    reportActiveTab()
  })

  socket.addEventListener('close', () => {
    scheduleReconnect()
  })

  socket.addEventListener('error', () => {
    try {
      socket.close()
    } catch (e) {
      // ignore
    }
  })
}

function scheduleReconnect() {
  if (reconnectTimer) {
    return
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, RECONNECT_MS)
}

function send(payload) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(payload))
    } catch (e) {
      // ignore
    }
  } else {
    connect()
  }
}

async function reportActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      send({ focused: true, url: null, title: tab ? tab.title : null })
      return
    }

    send({ focused: true, url: tab.url, title: tab.title, ts: Date.now() })
  } catch (e) {
    // ignore
  }
}

chrome.tabs.onActivated.addListener(reportActiveTab)

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (tab.active && (changeInfo.url || changeInfo.status === 'complete')) {
    reportActiveTab()
  }
})

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    send({ focused: false })
  } else {
    reportActiveTab()
  }
})

// Keep the socket warm.
setInterval(() => {
  connect()
  reportActiveTab()
}, 4000)

connect()
