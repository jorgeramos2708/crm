import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

// Login canónico del demo (ver seed.ts y README). Espera el aterrizaje
// en "/" para evitar la carrera entre el POST /api/auth/login y la
// navegación siguiente (el guard redirige a /login si aún no hay sesión).
// Envío del formulario de login sin gates de "actionability":
// el click flakea en WebKit (animaciones de entrada) y el Enter por
// teclado no dispara el submit en el WebKit headless de este host.
// requestSubmit() ejecuta el handler @submit de Vue en todos los motores.
// Hidratación de Vue: sin el mount, los fills solo tocan el DOM SSR y el
// re-render posterior los borra (race visible en WebKit lento). Se espera
// __vue_app__ ANTES de rellenar nada; el catch conserva el flujo si falta.
export async function waitForVueHydration(page: Page) {
  await page
    .waitForFunction(
      () => !!(document.querySelector("#app") as any)?.__vue_app__,
      null,
      {
        timeout: 20000,
      },
    )
    .catch(() => {});
}

export async function submitLogin(page: Page) {
  await waitForVueHydration(page);
  await page.evaluate(() => {
    const form = document.querySelector(
      "form.login-form",
    ) as HTMLFormElement | null;
    if (form) form.requestSubmit();
    else
      (
        document.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement | null
      )?.click();
  });
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await waitForVueHydration(page);
  await page.fill('input[name="email"]', "admin@crm.local");
  await page.fill('input[name="password"]', "admin1234");
  await submitLogin(page);
  // waitUntil commit: en SPA la URL se confirma sin nueva carga de documento;
  // 'load' cuelga en WebKit por recursos diferidos del dashboard.
  await page.waitForURL("http://localhost:8081/", {
    timeout: 60000,
    waitUntil: "commit",
  });
  // h1 del main: 'text=Resumen' matchea primero el link oculto del aside en móvil.
  await expect(page.locator("main h1")).toContainText(["Resumen"], {
    timeout: 10000,
  });
}

// Navegación por menú lateral: en viewports móviles el aside está oculto
// (hidden lg:flex) y la navegación vive en el Sheet lateral.
export async function navegarMenu(page: Page, href: string) {
  const mobileBtn = page.locator('[data-testid="mobile-menu-btn"]');
  if (await mobileBtn.isVisible()) {
    await mobileBtn.click();
    const sheet = page.locator(".sheet-shell");
    await sheet.locator(`nav a[href="${href}"]`).click();
  } else {
    await page.locator(`aside a[href="${href}"]`).click();
  }
}
