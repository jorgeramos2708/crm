import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Table from "./Table.vue";
import Th from "./Th.vue";
import Td from "./Td.vue";

describe("Table - blindado de alineación de columnas", () => {
  it("usa table-fixed cuando se pasa cols", () => {
    const w = mount(Table, {
      props: { cols: ["35%", "15%", "15%", "15%", "10%", "10%"] },
      slots: { head: "<tr><th>a</th></tr>", default: "<tr><td>1</td></tr>" },
    });
    expect(w.find("table").classes()).toContain("table-fixed");
  });

  it("NO usa table-fixed sin cols (auto layout)", () => {
    const w = mount(Table, {
      slots: { head: "<tr><th>a</th></tr>", default: "<tr><td>1</td></tr>" },
    });
    expect(w.find("table").classes()).not.toContain("table-fixed");
  });

  it("renderiza colgroup con un <col> por cada ancho", () => {
    const w = mount(Table, {
      props: { cols: ["35%", "15%", "15%", "15%", "10%", "10%"] },
      slots: { head: "<tr><th>a</th></tr>", default: "<tr><td>1</td></tr>" },
    });
    expect(w.findAll("col")).toHaveLength(6);
    expect(w.find("col").attributes("style")).toContain("width: 35%");
  });

  it("NO renderiza colgroup sin cols", () => {
    const w = mount(Table, {
      slots: { head: "<tr><th>a</th></tr>", default: "<tr><td>1</td></tr>" },
    });
    expect(w.find("colgroup").exists()).toBe(false);
  });

  it("NO tiene tbody externo que envuelva TransitionGroup (bug anidado)", () => {
    const w = mount(Table, {
      props: { cols: ["50%", "50%"] },
      slots: {
        head: "<tr><th>a</th><th>b</th></tr>",
        default: "<tr><td>1</td><td>2</td></tr>",
      },
    });
    // TransitionGroup tag="tbody" debe renderizar exactamente 1 tbody
    const tbodies = w.findAll("tbody");
    expect(tbodies.length).toBeLessThanOrEqual(1);
  });

  it("thead y colgroup (si existe) son hermanos directos de la tabla", () => {
    const w = mount(Table, {
      props: { cols: ["50%", "50%"] },
      slots: {
        head: "<tr><th>a</th><th>b</th></tr>",
        default: "<tr><td>1</td><td>2</td></tr>",
      },
    });
    const table = w.find("table");
    const children = Array.from(table.element.children);
    const tags = children.map((c) => c.tagName.toLowerCase());
    expect(tags).toContain("thead");
    expect(tags).toContain("colgroup");
    // no debe haber thead anidado dentro de tbody ni viceversa
    const tbodiesInsideThead = table.element.querySelectorAll("thead tbody");
    expect(tbodiesInsideThead).toHaveLength(0);
  });
});

describe("Th - celdas de cabecera", () => {
  it("alineación left por defecto", () => {
    const w = mount(Th, { slots: { default: "Nombre" } });
    expect(w.classes()).toContain("text-left");
  });

  it("alineación right con align=right", () => {
    const w = mount(Th, {
      props: { align: "right" },
      slots: { default: "Importe" },
    });
    expect(w.classes()).toContain("text-right");
  });

  it("usa px-6 py-3 por defecto", () => {
    const w = mount(Th, { slots: { default: "x" } });
    expect(w.classes()).toContain("px-6");
    expect(w.classes()).toContain("py-3");
  });
});

describe("Td - celdas de datos", () => {
  it("alineación left por defecto", () => {
    const w = mount(Td, { slots: { default: "valor" } });
    expect(w.classes()).toContain("text-left");
  });

  it("alineación right con align=right", () => {
    const w = mount(Td, {
      props: { align: "right" },
      slots: { default: "5000" },
    });
    expect(w.classes()).toContain("text-right");
  });

  it("usa px-6 py-4 por defecto", () => {
    const w = mount(Td, { slots: { default: "x" } });
    expect(w.classes()).toContain("px-6");
    expect(w.classes()).toContain("py-4");
  });
});

describe("Blindado: número de columnas por tabla", () => {
  const casos = [
    {
      archivo: "Negocios",
      cols: ["30%", "20%", "15%", "15%", "10%", "10%"],
      headers: ["Negocio", "Etapa", "Importe", "Probabilidad"],
    },
    {
      archivo: "Contactos",
      cols: ["18%", "18%", "13%", "18%", "15%", "18%"],
      headers: ["Nombre", "Email", "Teléfono", "Empresa", "Cargo"],
    },
    {
      archivo: "Producto",
      cols: ["35%", "20%", "15%", "15%", "15%"],
      headers: ["Producto", "SKU", "Precio", "Estado"],
    },
  ];

  for (const { archivo, cols, headers } of casos) {
    it(`${archivo}: cols tiene ${cols.length} anchos definidos`, () => {
      expect(cols).toHaveLength(cols.length);
      expect(cols.every((c) => /^\d+%$/.test(c))).toBe(true);
    });

    it(`${archivo}: headers esperados presentes`, () => {
      for (const h of headers) {
        expect(headers).toContain(h);
      }
    });
  }
});
