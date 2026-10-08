// Rastrea el origen de --panel en runtime.
import { chromium } from 'playwright'

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()
const responses = []
page.on('response', (r) => {
  if (r.url().includes('/api/ajustes/marca')) responses.push(r.url())
})
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 45000 })
await page.locator('#email').fill('admin@crm.local')
await page.locator('#password').fill('admin1234')
await page.getByRole('button', { name: /iniciar sesión/i }).click()
await page.waitForURL('http://localhost:8081/', { timeout: 30000 }).catch(() => {})
await page.goto('http://localhost:8081/contactos', { waitUntil: 'networkidle', timeout: 45000 })
await page.waitForTimeout(1500)
const info = await page.evaluate(async () => {
  const root = getComputedStyle(document.documentElement)
  const marcaResp = await fetch('/api/ajustes/marca').then((r) => r.json())
  return {
    panelComputed: root.getPropertyValue('--panel').trim(),
    panelInline: document.documentElement.style.getPropertyValue('--panel').trim(),
    bodyClasses: document.body.className,
    marcaTema: marcaResp.tema,
    localMarca: localStorage.getItem('crm-marca')?.slice(0, 120) || null,
  }
})
console.log('SRC:' + JSON.stringify(info))
console.log('MARCA_CALLS:' + responses.length)
await browser.close()
