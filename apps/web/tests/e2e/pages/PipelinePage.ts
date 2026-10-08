import { Page, Locator, expect } from "@playwright/test";

export class PipelinePage {
  readonly page: Page;
  readonly newOpportunityButton: Locator;
  readonly stageColumns: Locator;
  readonly opportunityCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newOpportunityButton = page.locator("text=+");
    this.stageColumns = page.locator(".space-y-1\\.5");
    this.opportunityCards = page.locator('[draggable="true"]');
  }

  async goto() {
    await this.page.goto("/pipeline");
    await expect(this.page.locator("text=Nueva")).toBeVisible({
      timeout: 10000,
    });
  }

  async createOpportunity(data: {
    nombre: string;
    importe: number;
    pipelineId?: string;
    stageId?: string;
    descripcion?: string;
  }) {
    await this.newOpportunityButton.click();
    await expect(this.page.locator("text=Nueva Oportunidad")).toBeVisible();

    await this.page.fill('input[name="nombre"]', data.nombre);
    await this.page.fill('input[name="importe"]', data.importe.toString());

    if (data.pipelineId) {
      await this.page.selectOption(
        'select[name="pipelineId"]',
        data.pipelineId,
      );
    }
    if (data.stageId) {
      await this.page.selectOption('select[name="stageId"]', data.stageId);
    }
    if (data.descripcion) {
      await this.page.fill('textarea[name="descripcion"]', data.descripcion);
    }

    await this.page.click('button:has-text("Crear")');
    await expect(this.page.locator(`text=${data.nombre}`)).toBeVisible({
      timeout: 5000,
    });
  }

  async dragToStage(opportunityName: string, targetStageName: string) {
    const card = this.page.locator(`text=${opportunityName}`).first();
    const targetColumn = this.page
      .locator(`text=${targetStageName}`)
      .locator("..");

    await card.dragTo(targetColumn);

    // Wait for the move to complete
    await this.page.waitForTimeout(500);

    // Verify move
    await expect(
      this.page
        .locator(`text=${targetStageName}`)
        .locator("..")
        .locator(`text=${opportunityName}`),
    ).toBeVisible();
  }

  async dragToSameColumn(opportunityName: string) {
    const card = this.page.locator(`text=${opportunityName}`).first();
    const sourceColumn = card.locator("..").locator("..");

    await card.dragTo(sourceColumn);
    await this.page.waitForTimeout(500);
  }

  async expectOpportunityInStage(opportunityName: string, stageName: string) {
    const stage = this.page.locator(`text=${stageName}`).locator("..");
    await expect(stage.locator(`text=${opportunityName}`)).toBeVisible();
  }

  async expectNoOpportunityInStage(opportunityName: string, stageName: string) {
    const stage = this.page.locator(`text=${stageName}`).locator("..");
    await expect(stage.locator(`text=${opportunityName}`)).not.toBeVisible();
  }

  async getOpportunityCard(opportunityName: string) {
    return this.page.locator(`text=${opportunityName}`).first();
  }

  async expectOpportunityCountInStage(stageName: string, count: number) {
    const stage = this.page.locator(`text=${stageName}`).locator("..");
    const cards = stage.locator('[draggable="true"]');
    await expect(cards).toHaveCount(count);
  }
}
