import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginAsAdmin } from "./helpers";

// Esperar hidratación completa antes de auditar: sin esto axe analiza
// el shell vacío a mitad de carga y reporta falsos landmark/heading.
async function auditPage(page, url: string, readySelector: string) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(readySelector).first().waitFor({ timeout: 15000 });
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
}

test.describe("Accessibility Audit", () => {
  test("Homepage should have no accessibility violations", async ({ page }) => {
    await auditPage(page, "/", "main h1");
  });

  test("Login page should have no accessibility violations", async ({
    page,
  }) => {
    await auditPage(page, "/login", "main h1");
  });

  test("Dashboard should have no accessibility violations", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    // El board carga async tras el shell: auditar antes da falsos heading-order.
    await auditPage(page, "/", ".pipeline-column-name");
  });

  test("Contactos page should have no accessibility violations", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await auditPage(page, "/contactos", '[data-testid="contactos-table"]');
  });

  test("Pipeline page should have no accessibility violations", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await auditPage(page, "/pipeline", '[data-testid="pipeline-board"]');
  });

  test("Settings page should have no accessibility violations", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await auditPage(page, "/settings", '[data-testid="settings-form"]');
  });
});
