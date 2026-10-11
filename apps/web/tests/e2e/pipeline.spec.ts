import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

// Sufijo único por corrida para idempotencia.
const uid = () =>
  `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

test.describe("Pipeline", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/pipeline");
    await expect(
      page.locator('[data-testid="pipeline-column"]').first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("should display pipeline columns", async ({ page }) => {
    const names = page.locator(".pipeline-column-name");
    await expect(names.first()).toBeVisible({ timeout: 15000 });
    await expect(names).toContainText([
      "Nuevo",
      "Calificado",
      "Propuesta",
      "Negociación",
      "Ganado",
    ]);
  });

  test("should create new opportunity", async ({ page }) => {
    const tag = uid();
    await page.click("text=+");
    await expect(page.locator("text=Nueva Oportunidad").first()).toBeVisible();

    await page.fill('input[name="nombre"]', `Test Opportunity E2E ${tag}`);
    await page.fill('input[name="importe"]', "50000");
    await page.selectOption('select[name="pipelineId"]', { index: 1 });
    await page.selectOption('select[name="stageId"]', { index: 1 });

    await page.click('button:has-text("Crear")');
    await expect(
      page.locator(`text=Test Opportunity E2E ${tag}`).first(),
    ).toBeVisible();
  });

  test("should drag and drop opportunity between stages", async ({ page }) => {
    const tag = uid();
    // Create a test opportunity first
    await page.click("text=+");
    await page.fill('input[name="nombre"]', `Drag Test ${tag}`);
    await page.fill('input[name="importe"]', "10000");
    await page.selectOption('select[name="pipelineId"]', { index: 1 });
    await page.selectOption('select[name="stageId"]', { index: 1 });
    await page.click('button:has-text("Crear")');

    // Wait for card to appear
    await expect(page.locator(`text=Drag Test ${tag}`).first()).toBeVisible();

    // Drag and drop to next stage (la tarjeta arrastrable es el contenedor div.group)
    const card = page.locator("div.group", { hasText: `Drag Test ${tag}` });
    // Columna por su encabezado (hasText suelto matchea los selects "Mover a").
    const targetColumn = page
      .locator('[data-testid="pipeline-column"]')
      .filter({
        has: page.locator(".pipeline-column-name", { hasText: "Calificado" }),
      });

    await card.dragTo(targetColumn, {
      // Esquina superior: el centro de la tarjeta cae sobre controles
      // interactivos (botón/select) que no inician el arrastre HTML5.
      sourcePosition: { x: 8, y: 8 },
    });

    // Verify move happened
    await expect(
      targetColumn.locator(`text=Drag Test ${tag}`).first(),
    ).toBeVisible();
  });

  test("should not allow dragging completed opportunities", async ({
    page,
  }) => {
    const tag = uid();
    // Create completed opportunity (Ganado = índice 5: placeholder + 5 etapas)
    await page.click("text=+");
    await page.fill('input[name="nombre"]', `Completed Test ${tag}`);
    await page.fill('input[name="importe"]', "10000");
    await page.selectOption('select[name="pipelineId"]', { index: 1 });
    await page.selectOption('select[name="stageId"]', { index: 5 }); // Ganado
    await page.click('button:has-text("Crear")');

    // Verify it's not draggable (el atributo vive en el contenedor div.group)
    const completedCard = page.locator("div.group", {
      hasText: `Completed Test ${tag}`,
    });
    await expect(completedCard).toHaveAttribute("draggable", "false");
  });

  test("should filter by stage", async ({ page }) => {
    await page.selectOption('select[name="filtroStage"]', { index: 2 }); // Calificado
    await expect(page.locator(".space-y-1\\.5")).toHaveCount(1);
  });
});
