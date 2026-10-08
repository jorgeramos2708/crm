import { Page, Locator, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly statsCards: Locator;
  readonly pipelineChart: Locator;
  readonly recentActivities: Locator;
  readonly forecastCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statsCards = page.locator("text=Total Oportunidades").locator("..");
    this.pipelineChart = page.locator("text=Embudo de Ventas").locator("..");
    this.recentActivities = page
      .locator("text=Actividad Reciente")
      .locator("..");
    this.forecastCard = page.locator("text=Pronóstico").locator("..");
  }

  async goto() {
    await this.page.goto("/");
    await expect(this.page.locator("text=Resumen")).toBeVisible({
      timeout: 10000,
    });
  }

  async expectStatsVisible() {
    await expect(this.page.locator("text=Total Oportunidades")).toBeVisible();
    await expect(this.page.locator("text=Valor Total")).toBeVisible();
    await expect(this.page.locator("text=Ticket Promedio")).toBeVisible();
    await expect(this.page.locator("text=Tasa de Conversión")).toBeVisible();
  }

  async expectPipelineChartVisible() {
    await expect(this.page.locator("text=Embudo de Ventas")).toBeVisible();
    await expect(this.page.locator("canvas, svg").first()).toBeVisible();
  }

  async expectForecastVisible() {
    await expect(this.page.locator("text=Pronóstico")).toBeVisible();
    await expect(this.page.locator("text=Este Mes")).toBeVisible();
  }

  async navigateToPipeline() {
    await this.page.click("text=Ver Pipeline");
    await expect(this.page).toHaveURL(/\/pipeline/);
  }

  async expectRecentActivities(count: number = 1) {
    const activities = this.recentActivities.locator(
      '[class*="activity"], [class*="timeline"]',
    );
    await expect(activities).toHaveCount(count);
  }

  async getStats() {
    const totalOpps = await this.page
      .locator("text=Total Oportunidades")
      .locator("..")
      .locator("text=/\\d+/")
      .first()
      .textContent();
    const valorTotal = await this.page
      .locator("text=Valor Total")
      .locator("..")
      .locator("text=/\\$?[\\d,]+/")
      .first()
      .textContent();
    const ticketPromedio = await this.page
      .locator("text=Ticket Promedio")
      .locator("..")
      .locator("text=/\\$?[\\d,]+/")
      .first()
      .textContent();
    const conversion = await this.page
      .locator("text=Tasa de Conversión")
      .locator("..")
      .locator("text=/\\d+%/")
      .first()
      .textContent();

    return {
      totalOportunidades: totalOpps,
      valorTotal,
      ticketPromedio,
      tasaConversion: conversion,
    };
  }
}
