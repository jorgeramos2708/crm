// Lista todos los nodos con fallo color-contrast + colores computados.
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
  if (v.id !== 'color-contrast') {
    console.log(`RULE:${v.id} nodes:${v.nodes.length}`)
    continue
  }
  console.log(`RULE:${v.id} nodes:${v.nodes.length}`)
  const out = await page.evaluate((selectors) => {
    return selectors.map((sel) => {
      const el = document.querySelector(sel)
      if (!el) return sel + ' => NOT FOUND'
      const cs = getComputedStyle(el)
      return `${sel} => color:${cs.color} bg:${cs.backgroundColor} font:${cs.fontSize}/${cs.fontWeight}`
    })
  }, v.nodes.slice(0, 15).map((n) => n.target.join(' ')))
  out.forEach((line) => console.log('  ' + line))
}
await browser.close()
