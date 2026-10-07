import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './theme/ThemeProvider'
import { mockApi } from './demo/mockApi'
import './assets/main.css'

// Install the mock bridge before the app mounts so renderer code that reads
// `window.api` during effects finds the demo data instead of Electron.
;(window as unknown as { api: typeof mockApi }).api = mockApi

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
