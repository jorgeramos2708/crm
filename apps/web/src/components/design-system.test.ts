import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Btn from "./Btn.vue";
import Badge from "./Badge.vue";
import Card from "./Card.vue";
import Modal from "./Modal.vue";
import Input from "./Input.vue";
import Select from "./Select.vue";
import Pagination from "./Pagination.vue";
import Icon from "./Icon.vue";
import Th from "./Th.vue";
import Td from "./Td.vue";
import Field from "./Field.vue";

describe("Btn", () => {
  it("renderiza el slot y variante primaria por defecto", () => {
    const w = mount(Btn, { slots: { default: "Guardar" } });
    expect(w.text()).toBe("Guardar");
    expect(w.classes()).toContain("bg-zinc-900");
  });

  it("aplica la variante outline", () => {
    const w = mount(Btn, { props: { variant: "outline" } });
    expect(w.classes().join(" ")).toContain("border-zinc-300");
  });

  it("deshabilita el botón", async () => {
    const w = mount(Btn, { props: { disabled: true } });
    expect(w.attributes("disabled")).toBeDefined();
  });

  it("muestra spinner en loading", () => {
    const w = mount(Btn, { props: { loading: true } });
    expect(w.find("svg.animate-spin").exists()).toBe(true);
  });

  it("renderiza un <a> con href", () => {
    const w = mount(Btn, {
      props: { href: "/api/x/export", variant: "outline" },
    });
    expect(w.element.tagName).toBe("A");
    expect(w.attributes("href")).toBe("/api/x/export");
  });
});

describe("Badge", () => {
  it("muestra punto y texto en variante dot", () => {
    const w = mount(Badge, {
      props: { color: "green" },
      slots: { default: "En vivo" },
    });
    expect(w.text()).toBe("En vivo");
    expect(w.find(".bg-green-500").exists()).toBe(true);
  });

  it("aplica color hexadecimal arbitrario", () => {
    const w = mount(Badge, {
      props: { hex: "#0F6CBD" },
      slots: { default: "Etapa" },
    });
    // jsdom normaliza el hex a rgb()
    expect(w.find("span > span").attributes("style")).toContain(
      "background-color",
    );
  });

  it("oculta el punto con dot=false en pastilla", () => {
    const w = mount(Badge, {
      props: { color: "green", variant: "pill", dot: false },
      slots: { default: "Activo" },
    });
    expect(w.find("span > span").exists()).toBe(false);
    expect(w.classes().join(" ")).toContain("rounded-full");
  });
});

describe("Card", () => {
  it("usa panel-flat por defecto", () => {
    const w = mount(Card, { slots: { default: "hola" } });
    expect(w.classes()).toContain("panel-flat");
  });

  it("usa superficie elevada con variant elevated", () => {
    const w = mount(Card, {
      props: { variant: "elevated" },
      slots: { default: "hola" },
    });
    expect(w.classes()).toContain("bg-white");
    expect(w.classes()).toContain("rounded-2xl");
  });
});

describe("Modal", () => {
  it("no renderiza nada cerrado", () => {
    const w = mount(Modal, { props: { open: false } });
    expect(w.html()).not.toContain("Confirmar");
  });

  it("muestra título y emite close al pulsar fuera", async () => {
    const w = mount(Modal, {
      props: { open: true, title: "Confirmar" },
      slots: { default: "<p>Cuerpo</p>" },
    });
    expect(w.text()).toContain("Confirmar");
    await w.trigger("click");
    expect(w.emitted("close")).toBeTruthy();
  });
});

describe("Input", () => {
  it("emite update:modelValue al escribir", async () => {
    const w = mount(Input, { props: { modelValue: "" } });
    await w.find("input").setValue("hola");
    expect(w.emitted("update:modelValue")?.[0]).toEqual(["hola"]);
  });

  it("renderiza textarea en modo multiline", () => {
    const w = mount(Input, { props: { multiline: true, rows: 3 } });
    expect(w.find("textarea").exists()).toBe(true);
    expect(w.find("textarea").attributes("rows")).toBe("3");
  });
});

describe("Select", () => {
  it("emite update:modelValue al cambiar", async () => {
    const w = mount(Select, {
      props: { modelValue: "" },
      slots: { default: '<option value="a">A</option>' },
    });
    await w.find("select").setValue("a");
    expect(w.emitted("update:modelValue")?.[0]).toEqual(["a"]);
  });
});

describe("Pagination", () => {
  const props = {
    page: 2,
    totalPages: 5,
    total: 100,
    pageSize: 20,
    itemLabel: "contactos",
  };

  it("muestra el rango correcto", () => {
    const w = mount(Pagination, { props });
    expect(w.text()).toContain("Mostrando 21 a 40 de 100 contactos");
  });

  it("emite prev/next y deshabilita en bordes", async () => {
    const w = mount(Pagination, { props });
    const [prev, next] = w.findAll("button");
    await prev.trigger("click");
    await next.trigger("click");
    expect(w.emitted("prev")).toBeTruthy();
    expect(w.emitted("next")).toBeTruthy();

    const first = mount(Pagination, { props: { ...props, page: 1 } });
    expect(first.findAll("button")[0].attributes("disabled")).toBeDefined();
  });
});

describe("Icon", () => {
  it("renderiza un svg para un nombre conocido", () => {
    const w = mount(Icon, { props: { name: "contactos" } });
    expect(w.find("svg").exists()).toBe(true);
  });

  it("usa fallback con nombre desconocido", () => {
    const w = mount(Icon, { props: { name: "no-existe" } });
    expect(w.find("svg").exists()).toBe(true);
  });

  it("renderiza path crudo en modo legacy", () => {
    const w = mount(Icon, { props: { path: "M4 6h16" } });
    expect(w.find('path[d="M4 6h16"]').exists()).toBe(true);
  });
});

describe("Th/Td", () => {
  it("Th alinea a la derecha", () => {
    const w = mount(Th, {
      props: { align: "right" },
      slots: { default: "Total" },
    });
    expect(w.classes()).toContain("text-right");
  });

  it("Td primary usa tono fuerte", () => {
    const w = mount(Td, {
      props: { primary: true },
      slots: { default: "Ana" },
    });
    expect(w.classes()).toContain("text-zinc-900");
    expect(w.classes()).toContain("font-medium");
  });

  it("Td compact y tone strong", () => {
    const w = mount(Td, {
      props: { compact: true, tone: "strong", align: "right" },
      slots: { default: "1" },
    });
    expect(w.classes()).toContain("px-3");
    expect(w.classes()).toContain("text-right");
  });

  it("Th compact", () => {
    const w = mount(Th, {
      props: { compact: true },
      slots: { default: "Cant." },
    });
    expect(w.classes()).toContain("px-3");
  });
});

describe("Field", () => {
  it("muestra etiqueta con asterisco si es requerido", () => {
    const w = mount(Field, {
      props: { label: "Nombre", required: true },
      slots: { default: "<input />" },
    });
    expect(w.find("label").text()).toContain("Nombre");
    expect(w.find("label").text()).toContain("*");
  });

  it("muestra el error sobre el hint", () => {
    const w = mount(Field, {
      props: { label: "Email", error: "Inválido", hint: "Ayuda" },
      slots: { default: "<input />" },
    });
    expect(w.text()).toContain("Inválido");
    expect(w.text()).not.toContain("Ayuda");
  });
});

describe("Select", () => {
  it("propaga disabled", () => {
    const w = mount(Select, { props: { disabled: true } });
    expect(w.attributes("disabled")).toBeDefined();
  });
});

describe("Input", () => {
  it("propaga placeholder y disabled", () => {
    const w = mount(Input, {
      props: { placeholder: "Buscar...", disabled: true },
    });
    expect(w.attributes("placeholder")).toBe("Buscar...");
    expect(w.attributes("disabled")).toBeDefined();
  });
});

describe("Modal", () => {
  it("renderiza el slot de acciones", () => {
    const w = mount(Modal, {
      props: { open: true, title: "T" },
      slots: { actions: "<button>Ok</button>" },
    });
    expect(w.text()).toContain("Ok");
  });
});

describe("Pagination", () => {
  it("deshabilita siguiente en la última página", () => {
    const w = mount(Pagination, {
      props: { page: 5, totalPages: 5, total: 100, pageSize: 20 },
    });
    const buttons = w.findAll("button");
    expect(buttons[1].attributes("disabled")).toBeDefined();
  });
});

describe("Icon", () => {
  it("respeta size y strokeWidth", () => {
    const w = mount(Icon, {
      props: { name: "ajustes", size: 16, strokeWidth: 1.5 },
    });
    const svg = w.find("svg");
    expect(svg.attributes("width")).toBe("16");
  });
});

describe("Field accesibilidad", () => {
  it("la etiqueta envuelve al control (asociación implícita)", () => {
    const w = mount(Field, {
      props: { label: "Nombre", required: true },
      slots: { default: '<input type="text" />' },
    });
    const label = w.find("label");
    expect(label.exists()).toBe(true);
    expect(label.find("input").exists()).toBe(true);
  });
});

describe("Btn link-danger", () => {
  it("usa rojo sin relleno y sin padding de botón", () => {
    const w = mount(Btn, {
      props: { variant: "link-danger" },
      slots: { default: "Eliminar" },
    });
    expect(w.classes()).toContain("text-red-600");
    expect(w.classes()).not.toContain("px-4");
    expect(w.classes()).not.toContain("bg-red-600");
  });
});
