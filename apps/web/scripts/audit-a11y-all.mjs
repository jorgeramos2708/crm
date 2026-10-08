// Auditoría color-contrast en las 4 páginas autenticadas con colores computados.
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

for (const [name, url, ready] of [
  ['dashboard', '/', '[data-testid="dashboard"]'],
  ['contactos', '/contactos', '[data-testid="contactos-table"]'],
  ['pipeline', '/pipeline', '[data-testid="pipeline-board"]'],
  ['settings', '/settings', '[data-testid="settings-form"]'],
]) {
  await page.goto('http://localhost:8081' + url, { waitUntil: 'networkidle', timeout: 45000 })
  await page.locator(ready).first().waitFor({ timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(1500)
  const res = await new AxeBuilder({ page }).disableRules(['landmark-one-main', 'page-has-heading-one', 'region']).analyze()
  const cc = res.violations.filter((v) => v.id === 'color-contrast')
  console.log(`== ${name}: ${cc.length ? cc[0].nodes.length + ' NODES' : 'CLEAN'}`)
  if (cc.length) {
    for (const n of cc[0].nodes.slice(0, 4)) {
      const data = (n.any || []).concat(n.all || []).map((c) => `${c.id}=${JSON.stringify(c.data)}`).join(' | ')
      console.log(`  CHECKS: ${data.slice(0, 300)}`)
    }
  }
  if (cc.length) {
    const info = await page.evaluate((selectors) => {
      return selectors.map((sel) => {
        let el = null
        try { el = document.querySelector(sel) } catch { return sel + ' => BADSEL' }
        if (!el) return sel + ' => NOTFOUND'
        const cs = getComputedStyle(el)
        const cls = typeof el.className === 'string' ? el.className : ''
        return `${cls.slice(0, 90)} => ${cs.color} on ${cs.backgroundColor} ${cs.fontSize}`
      })
    }, cc[0].nodes.slice(0, 12).map((n) => n.target.join(' ')))
    info.forEach((line) => console.log('  ' + line))
  }
}
await browser.close()
