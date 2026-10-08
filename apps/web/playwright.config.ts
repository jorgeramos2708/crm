import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/results.xml" }],
  ],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:8081",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      // Movimiento reducido: el WebKit por software es 5-10x más lento y los
      // gates de estabilidad de click flakean con las animaciones de entrada.
      // El CSS las desactiva con prefers-reduced-motion (sin cambiar layout).
      // Timeouts amplios: cada transición de página tarda ~30-60s en este host.
      use: {
        ...devices["Desktop Safari"],
        reducedMotion: "reduce",
        actionTimeout: 30000,
      },
      timeout: 180000,
      expect: { timeout: 30000 },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"], reducedMotion: "reduce" },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:8081",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      VITE_API_URL: "http://localhost:8081",
    },
  },
  expect: {
    toHaveScreenshot: { maxDiffPixels: 100 },
    toMatchSnapshot: { threshold: 0.2 },
  },
});
