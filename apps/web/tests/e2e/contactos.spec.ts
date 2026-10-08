import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

// Sufijo único por worker para que las corridas sean idempotentes
// (los datos creados no colisionan entre ejecuciones).
const uid = () =>
  `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

test.describe("Contactos", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/contactos");
    await expect(page.locator("main h1")).toContainText(["Contactos"], {
      timeout: 10000,
    });
  });

  test("should display contactos list", async ({ page }) => {
    await expect(page.locator("main h1")).toContainText(["Contactos"]);
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible();
    await expect(page.locator("text=+").first()).toBeVisible();
  });

  test("should create new contacto", async ({ page }) => {
    const tag = uid();
    await page.click("text=+");
    await expect(page.locator("text=Nuevo Contacto").first()).toBeVisible();

    await page.fill('input[name="nombre"]', `Juan Pérez E2E ${tag}`);
    await page.fill('input[name="email"]', `juan.perez.e2e.${tag}@test.com`);
    await page.fill('input[name="telefono"]', "+52 55 1234 5678");
    await page.fill('input[name="empresa"]', "Empresa Test");
    await page.fill('input[name="cargo"]', "Gerente");

    await page.click('button:has-text("Crear")');
    await expect(
      page.locator(`text=Juan Pérez E2E ${tag}`).first(),
    ).toBeVisible();
  });

  test("should edit contacto", async ({ page }) => {
    const tag = uid();
    // First create a contact
    await page.click("text=+");
    await page.fill('input[name="nombre"]', `Edit Test ${tag}`);
    await page.fill('input[name="email"]', `edit.test.${tag}@test.com`);
    await page.click('button:has-text("Crear")');
    await expect(page.locator(`text=Edit Test ${tag}`).first()).toBeVisible();

    // Edit the contact (botón dentro de su fila)
    const row = page.locator("tbody tr", { hasText: `Edit Test ${tag}` });
    await row.locator('button[title="Editar"]').click();
    await expect(page.locator("text=Editar Contacto").first()).toBeVisible();

    await page.fill('input[name="cargo"]', "Director General");
    await page.click('button:has-text("Guardar")');

    await expect(page.locator("text=Director General").first()).toBeVisible();
  });

  test("should delete contacto", async ({ page }) => {
    const tag = uid();
    // Create a contact to delete
    await page.click("text=+");
    await page.fill('input[name="nombre"]', `Delete Test ${tag}`);
    await page.fill('input[name="email"]', `delete.test.${tag}@test.com`);
    await page.click('button:has-text("Crear")');
    await expect(page.locator(`text=Delete Test ${tag}`).first()).toBeVisible();

    // Delete it (diálogo de confirmación propio, no nativo)
    const row = page.locator("tbody tr", { hasText: `Delete Test ${tag}` });
    await row.locator('button[title="Eliminar"]').click();
    await page.click('button:has-text("Confirmar")');

    await expect(
      page.locator(`text=Delete Test ${tag}`).first(),
    ).not.toBeVisible();
  });

  test("should search contactos", async ({ page }) => {
    const tag = uid();
    // Create a searchable contact
    await page.click("text=+");
    await page.fill('input[name="nombre"]', `Searchable Juan ${tag}`);
    await page.fill('input[name="email"]', `searchable.${tag}@test.com`);
    await page.click('button:has-text("Crear")');

    // Search (debounce 300ms en UI)
    await page.fill('input[placeholder*="Buscar"]', `Searchable Juan ${tag}`);
    await expect(
      page.locator(`text=Searchable Juan ${tag}`).first(),
    ).toBeVisible();

    // Clear search
    await page.fill('input[placeholder*="Buscar"]', "");
  });

  test("should export CSV", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.click('a[title="Exportar CSV"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/contactos.*\.csv/);
  });

  test("should import CSV", async ({ page }) => {
    await expect(page.locator('input[type="file"]').first()).toBeAttached();
    // La subida real se ejerce en API; aquí se valida presencia del control
    // (input[type=file] oculto dentro del label Importar CSV).
  });
});
