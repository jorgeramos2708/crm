import { test, expect } from "@playwright/test";
import { loginAsAdmin, navegarMenu } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await expect(page.locator("main h1")).toContainText(["Resumen"], {
      timeout: 10000,
    });
  });

  test("should display dashboard KPI cards", async ({ page }) => {
    await expect(page.locator("text=Total Pipeline").first()).toBeVisible();
    await expect(
      page.locator("text=Oportunidades Ganadas").first(),
    ).toBeVisible();
    await expect(page.locator("text=En Proceso").first()).toBeVisible();
    await expect(page.locator("text=Perdidas").first()).toBeVisible();
  });

  test("should display pipeline board", async ({ page }) => {
    await expect(
      page.locator("main").locator("text=Pipeline").first(),
    ).toBeVisible();
    // Esperar a que carguen las etapas (fetch async) antes de leer
    const names = page.locator(".pipeline-column-name");
    await expect(names.first()).toBeVisible({ timeout: 15000 });
    // Etapas sembradas en demo (forma array: reintenta hasta el fetch)
    await expect(names).toContainText(["Nuevo", "Ganado"]);
  });

  test("should display recent activities", async ({ page }) => {
    await expect(page.locator("text=Actividad Reciente").first()).toBeVisible();
  });

  test("should navigate to pipeline from dashboard", async ({ page }) => {
    await navegarMenu(page, "/pipeline");
    await expect(page).toHaveURL(/\/pipeline/);
    const names = page.locator(".pipeline-column-name");
    await expect(names.first()).toBeVisible({ timeout: 15000 });
    await expect(names).toContainText(["Nuevo"]);
  });

  test("should display tasks and events widgets", async ({ page }) => {
    await expect(page.locator("text=Próximas Tareas").first()).toBeVisible();
    await expect(page.locator("text=Próximos Eventos").first()).toBeVisible();
  });
});
