// Captures dark + light screenshots of each renderer page into site/public/screenshots/.
// Run the demo server first (npm run demo); needs a browser: npx playwright install chromium (or PW_CHANNEL=chrome).
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
