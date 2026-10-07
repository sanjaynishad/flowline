import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone (non-Electron) Vite config that serves the renderer in a plain
// browser for demo/screenshot capture. Entry is src/renderer/demo.html, which
// installs the mock `window.api` before mounting the real app.
export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  },
  plugins: [react()],
  server: {
    port: 5178,
    strictPort: true,
    open: '/demo.html'
  }
})
