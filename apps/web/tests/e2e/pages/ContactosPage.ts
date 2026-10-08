import { Page, Locator, expect } from "@playwright/test";

export class ContactosPage {
  readonly page: Page;
  readonly newContactButton: Locator;
  readonly searchInput: Locator;
  readonly exportButton: Locator;
  readonly importButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newContactButton = page.locator("text=+");
    this.searchInput = page.locator('input[placeholder*="Buscar"]');
    this.exportButton = page.locator('button[title="Exportar CSV"]');
    this.importButton = page.locator('button[title="Importar CSV"]');
  }

  async goto() {
    await this.page.goto("/contactos");
    await expect(this.page.locator("text=Contactos")).toBeVisible({
      timeout: 10000,
    });
  }

  async createContact(data: {
    nombre: string;
    email: string;
    telefono?: string;
    empresa?: string;
    cargo?: string;
  }) {
    await this.newContactButton.click();
    await expect(this.page.locator("text=Nuevo Contacto")).toBeVisible();

    await this.page.fill('input[name="nombre"]', data.nombre);
    await this.page.fill('input[name="email"]', data.email);

    if (data.telefono) {
      await this.page.fill('input[name="telefono"]', data.telefono);
    }
    if (data.empresa) {
      await this.page.fill('input[name="empresa"]', data.empresa);
    }
    if (data.cargo) {
      await this.page.fill('input[name="cargo"]', data.cargo);
    }

    await this.page.click('button:has-text("Crear")');
    await expect(this.page.locator(`text=${data.nombre}`)).toBeVisible({
      timeout: 5000,
    });
  }

  async editContact(
    nombre: string,
    updates: { cargo?: string; telefono?: string; empresa?: string },
  ) {
    const editButton = this.page
      .locator(`text=${nombre}`)
      .locator("..")
      .locator('button[aria-label="Editar"]');
    await editButton.click();

    if (updates.cargo) {
      await this.page.fill('input[name="cargo"]', updates.cargo);
    }
    if (updates.telefono) {
      await this.page.fill('input[name="telefono"]', updates.telefono);
    }
    if (updates.empresa) {
      await this.page.fill('input[name="empresa"]', updates.empresa);
    }

    await this.page.click('button:has-text("Guardar")');
    await expect(this.page.locator(`text=${updates.cargo || ""}`)).toBeVisible({
      timeout: 5000,
    });
  }

  async deleteContact(nombre: string) {
    this.page.on("dialog", (dialog) => dialog.accept());
    const deleteButton = this.page
      .locator(`text=${nombre}`)
      .locator("..")
      .locator('button[aria-label="Eliminar"]');
    await deleteButton.click();
    await expect(this.page.locator(`text=${nombre}`)).not.toBeVisible({
      timeout: 5000,
    });
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300); // debounce
  }

  async expectContactVisible(nombre: string) {
    await expect(this.page.locator(`text=${nombre}`)).toBeVisible();
  }

  async expectContactNotVisible(nombre: string) {
    await expect(this.page.locator(`text=${nombre}`)).not.toBeVisible();
  }

  async exportCSV() {
    const downloadPromise = this.page.waitForEvent("download");
    await this.exportButton.click();
    return downloadPromise;
  }

  async importCSV(filePath: string) {
    await this.importButton.click();
    await this.page.setInputFiles('input[type="file"]', filePath);
  }
}
