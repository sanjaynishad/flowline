// Captures marketing screenshots of the Flowline renderer running in a plain
// browser (via vite.demo.config.ts with a mocked window.api). Produces crisp
// dark + light PNGs for each page into site/public/screenshots/.
//
// Usage:
//   1) npx vite --config vite.demo.config.ts     (serves http://localhost:5178)
//   2) node scripts/capture-screenshots.mjs
// Requires: npx playwright install chromium
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { mkdir } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../site/public/screenshots')
const baseUrl = process.env.DEMO_URL ?? 'http://localhost:5178/demo.html'

const pages = [
  { id: 'dashboard', nav: 'Dashboard' },
  { id: 'insights', nav: 'Insights' },
  { id: 'rules', nav: 'Rules' },
  { id: 'sessions', nav: 'Focus Sessions' },
  { id: 'settings', nav: 'Settings' }
]

const themes = ['dark', 'light']

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(t)
  }, theme)
}

async function run() {
  await mkdir(outDir, { recursive: true })

  // Prefer Playwright's bundled Chromium; fall back to a system Chrome/Edge
  // install (set PW_CHANNEL=chrome|msedge) when the download is unavailable.
  const channel = process.env.PW_CHANNEL
  const browser = await chromium.launch(channel ? { channel } : {})
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  })
  const page = await context.newPage()

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await page.locator('nav button').first().waitFor({ state: 'visible' })
  await page.waitForTimeout(600)

  for (const theme of themes) {
    await setTheme(page, theme)

    for (const target of pages) {
      await page.locator('nav button', { hasText: target.nav }).first().click()
      // Let route content and Recharts animations settle.
      await page.waitForTimeout(900)
      await setTheme(page, theme)

      const file = resolve(outDir, `${target.id}-${theme}.png`)
      await page.screenshot({ path: file })
      console.log(`captured ${file}`)
    }
  }

  await browser.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
