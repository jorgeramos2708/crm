import { test as base, type Page } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { PipelinePage } from "./pages/PipelinePage";
import { ContactosPage } from "./pages/ContactosPage";
import { DashboardPage } from "./pages/DashboardPage";

type TestFixtures = {
  loginPage: LoginPage;
  pipelinePage: PipelinePage;
  contactosPage: ContactosPage;
  dashboardPage: DashboardPage;
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  pipelinePage: async ({ page }, use) => {
    await use(new PipelinePage(page));
  },
  contactosPage: async ({ page }, use) => {
    await use(new ContactosPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  authenticatedPage: async ({ page }, use) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@crm.local");
    await page.fill('input[name="password"]', "admin1234");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/$/);
    await use(page);
  },
});

export { expect } from "@playwright/test";
