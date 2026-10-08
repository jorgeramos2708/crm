// Detalle de violaciones axe en dashboard autenticado.
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 45000 })
await page.locator('#email').fill('admin@crm.local')
await page.locator('#password').fill('admin1234')
await page.getByRole('button', { name: /iniciar sesión/i }).click()
await page.waitForURL('http://localhost:8081/', { timeout: 30000 }).catch(() => {})
await page.goto('http://localhost:8081/', { waitUntil: 'networkidle', timeout: 45000 })
await page.locator('[data-testid="dashboard"]').first().waitFor({ timeout: 15000 })
const res = await new AxeBuilder({ page }).analyze()
for (const v of res.violations) {
  console.log(`RULE:${v.id} impact:${v.impact} nodes:${v.nodes.length}`)
  for (const n of v.nodes.slice(0, 6)) {
    console.log('  HTML:' + (n.html || '').slice(0, 160).replace(/\n/g, ' '))
  }
}
await browser.close()
