// Inspecciona variables y fondos computados en Contactos.
import { chromium } from 'playwright'

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 45000 })
await page.locator('#email').fill('admin@crm.local')
await page.locator('#password').fill('admin1234')
await page.getByRole('button', { name: /iniciar sesión/i }).click()
await page.waitForURL('http://localhost:8081/', { timeout: 30000 }).catch(() => {})
await page.goto('http://localhost:8081/contactos', { waitUntil: 'networkidle', timeout: 45000 })
await page.waitForTimeout(1500)
const info = await page.evaluate(() => {
  const root = getComputedStyle(document.documentElement)
  const card = document.querySelector('[data-testid="contactos-table"]')
  const cs = card ? getComputedStyle(card) : null
  const td = document.querySelector('tbody td')
  const tcs = td ? getComputedStyle(td) : null
  return {
    panel: root.getPropertyValue('--panel').trim(),
    bgSubtle: root.getPropertyValue('--bg-subtle').trim(),
    fgMuted: root.getPropertyValue('--fg-muted').trim(),
    cardBg: cs ? cs.backgroundColor : null,
    tdColor: tcs ? tcs.color : null,
    cssHrefs: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((l) => l.href),
  }
})
console.log('VARS:' + JSON.stringify(info))
await browser.close()
