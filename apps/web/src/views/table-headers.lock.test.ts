import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const views = resolve(import.meta.dirname, "..", "views");

function read(name: string): string {
  return readFileSync(resolve(views, name), "utf-8");
}

describe("Blindado: Negocios.vue", () => {
  const src = read("Negocios.vue");

  it("cols define 6 anchos", () => {
    const m = src.match(/:cols="\[([^\]]+)\]"/);
    expect(m).toBeTruthy();
    const arr = m![1].split(",").map((s) => s.trim().replace(/['"]/g, ""));
    expect(arr).toHaveLength(6);
    expect(arr.every((c) => /^\d+%$/.test(c))).toBe(true);
  });

  it("headers correctos: Negocio, Etapa, Importe, Probabilidad", () => {
    expect(src).toMatch(/<Th>Negocio<\/Th>/);
    expect(src).toMatch(/<Th>Etapa<\/Th>/);
    expect(src).toMatch(/<Th align="right">Importe<\/Th>/);
    expect(src).toMatch(/<Th align="right">Probabilidad<\/Th>/);
  });

  it("NO tiene headers EDITAR ni ELIMINAR visibles", () => {
    expect(src).not.toMatch(/<Th[^>]*>Editar<\/Th>/);
    expect(src).not.toMatch(/<Th[^>]*>Eliminar<\/Th>/);
    expect(src).not.toMatch(/<Th[^>]*>Prob\.<\/Th>/);
  });

  it("las 2 últimas Th de cabecera están vacías (acciones)", () => {
    const head = src.match(/<template #head>[\s\S]*?<\/template>/);
    expect(head).toBeTruthy();
    const ths = head![0].match(/<Th[^>]*>/g) || [];
    expect(ths).toHaveLength(6);
    expect(ths[4]).toBe("<Th>");
    expect(ths[5]).toBe("<Th>");
  });

  it("filas de datos tienen 6 celdas (Td o td)", () => {
    const row = src.match(/v-for="o in negocios"[\s\S]*?<\/tr>/);
    expect(row).toBeTruthy();
    const cells = row![0].match(/<(Td|td)[\s>]/g) || [];
    expect(cells).toHaveLength(6);
  });
});

describe("Blindado: Contactos.vue", () => {
  const src = read("Contactos.vue");

  it("cols define 6 anchos", () => {
    const m = src.match(/:cols="\[([^\]]+)\]"/);
    expect(m).toBeTruthy();
    const arr = m![1].split(",").map((s) => s.trim().replace(/['"]/g, ""));
    expect(arr).toHaveLength(6);
    expect(arr.every((c) => /^\d+%$/.test(c))).toBe(true);
  });

  it("headers correctos", () => {
    expect(src).toMatch(/<Th>Nombre<\/Th>/);
    expect(src).toMatch(/<Th>Email<\/Th>/);
    expect(src).toMatch(/<Th>Teléfono<\/Th>/);
    expect(src).toMatch(/<Th>Empresa<\/Th>/);
    expect(src).toMatch(/<Th>Cargo<\/Th>/);
  });

  it("NO tiene header ACCIONES visible", () => {
    expect(src).not.toMatch(/<Th[^>]*>Acciones<\/Th>/);
  });

  it("la última Th de cabecera está vacía", () => {
    const head = src.match(/<template #head>[\s\S]*?<\/template>/);
    const ths = head![0].match(/<Th[^>]*>/g) || [];
    expect(ths).toHaveLength(6);
    expect(ths[5]).toBe("<Th>");
  });

  it("filas de datos tienen 6 celdas", () => {
    const row = src.match(/v-for="contacto in contactos"[\s\S]*?<\/tr>/);
    const cells = row![0].match(/<(Td|td)[\s>]/g) || [];
    expect(cells).toHaveLength(6);
  });
});

describe("Blindado: Productos.vue", () => {
  const src = read("Productos.vue");

  it("cols define 5 anchos", () => {
    const m = src.match(/:cols="\[([^\]]+)\]"/);
    expect(m).toBeTruthy();
    const arr = m![1].split(",").map((s) => s.trim().replace(/['"]/g, ""));
    expect(arr).toHaveLength(5);
    expect(arr.every((c) => /^\d+%$/.test(c))).toBe(true);
  });

  it("headers correctos", () => {
    expect(src).toMatch(/<Th>Producto<\/Th>/);
    expect(src).toMatch(/<Th>SKU<\/Th>/);
    expect(src).toMatch(/<Th align="right">Precio<\/Th>/);
    expect(src).toMatch(/<Th>Estado<\/Th>/);
  });

  it("NO tiene header ACCIONES visible", () => {
    expect(src).not.toMatch(/<Th[^>]*>Acciones<\/Th>/);
  });

  it("la última Th de cabecera está vacía", () => {
    const head = src.match(/<template #head>[\s\S]*?<\/template>/);
    const ths = head![0].match(/<Th[^>]*>/g) || [];
    expect(ths).toHaveLength(5);
    expect(ths[4]).toBe("<Th>");
  });

  it("filas de datos tienen 5 celdas", () => {
    const row = src.match(/v-for="p in productos"[\s\S]*?<\/tr>/);
    const cells = row![0].match(/<(Td|td)[\s>]/g) || [];
    expect(cells).toHaveLength(5);
  });
});

describe("Blindado: Table.vue", () => {
  const src = readFileSync(
    resolve(import.meta.dirname, "..", "components", "Table.vue"),
    "utf-8",
  );

  it("NO tiene tbody externo que envuelva TransitionGroup (bug anidado)", () => {
    expect(src).not.toMatch(/<tbody[^>]*>\s*<TransitionGroup/);
  });

  it("TransitionGroup es tbody hijo directo de table", () => {
    expect(src).toMatch(
      /<table[^>]*>[\s\S]*?<thead[\s\S]*?<TransitionGroup[^>]*tag="tbody"/,
    );
  });

  it("soporta prop cols con colgroup", () => {
    expect(src).toMatch(/colgroup/);
    expect(src).toMatch(/cols/);
    expect(src).toMatch(/table-fixed/);
  });

  it("table-fixed solo cuando hay cols", () => {
    expect(src).toMatch(
      /cols && cols\.length \? 'w-full table-fixed' : 'w-full'/,
    );
  });
});
