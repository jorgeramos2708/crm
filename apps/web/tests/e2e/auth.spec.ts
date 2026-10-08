import { test, expect } from "@playwright/test";
import { submitLogin, waitForVueHydration } from "./helpers";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await waitForVueHydration(page);
  });

  test("should login with valid credentials", async ({ page }) => {
    await page.fill('input[name="email"]', "admin@crm.local");
    await page.fill('input[name="password"]', "admin1234");
    await submitLogin(page);

    await page.waitForURL("http://localhost:8081/", {
      timeout: 30000,
      waitUntil: "commit",
    });
    // El email del chip se oculta en móvil; el botón de menú confirma sesión.
    await expect(page.locator('[aria-label="Menú de usuario"]')).toBeVisible();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.fill('input[name="email"]', "invalid@crm.local");
    await page.fill('input[name="password"]', "wrongpassword");
    await submitLogin(page);

    await expect(page.locator("text=Credenciales inválidas")).toBeVisible();
  });

  test("should redirect to login when accessing protected route", async ({
    page,
  }) => {
    await page.goto("/contactos");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should logout successfully", async ({ page }) => {
    await page.fill('input[name="email"]', "admin@crm.local");
    await page.fill('input[name="password"]', "admin1234");
    await submitLogin(page);
    await expect(page).toHaveURL(/\/$/, { timeout: 30000 });

    await page.click('[aria-label="Menú de usuario"]');
    await page.click("text=Cerrar sesión");
    await page.waitForURL("**/login", { timeout: 30000 });
  });
});
