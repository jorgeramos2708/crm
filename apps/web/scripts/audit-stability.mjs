// Sonda de estabilidad del botón Crear en el modal de contactos.
// Mide si el bounding box se mueve (animación infinita) y lista animaciones activas.
import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 45000 })
await page.locator('#email').fill('admin@crm.local')
await page.locator('#password').fill('admin1234')
await page.getByRole('button', { name: /iniciar sesión/i }).click()
await page.waitForURL('http://localhost:8081/', { timeout: 30000 }).catch(() => {})
await page.goto('http://localhost:8081/contactos', { waitUntil: 'networkidle', timeout: 45000 })
await page.waitForTimeout(2000)
await page.locator('[title="Nuevo Contacto"]').first().click()
await page.waitForTimeout(1000)
const info = await page.evaluate(async () => {
  const btns = Array.from(document.querySelectorAll('button')).filter(
    (b) => b.textContent.trim() === 'Crear',
  )
  const anims = document.getAnimations().map((a) => ({
    name: a.animationName || '(none)',
    state: a.playState,
    target: String(
      a.effect?.target?.tagName +
        '.' +
        (a.effect?.target?.className?.baseVal ?? a.effect?.target?.className ?? ''),
    ).slice(0, 80),
  }))
  const boxes = []
  for (let i = 0; i < 5; i++) {
    const r = btns[0]?.getBoundingClientRect()
    boxes.push(r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null)
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  return {
    crearCount: btns.length,
    boxes,
    animCount: anims.length,
    anims: anims.slice(0, 10),
  }
})
console.log('STABILITY:' + JSON.stringify(info).slice(0, 2200))
await browser.close()
