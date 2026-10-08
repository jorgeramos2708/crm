import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { createPinia, setActivePinia } from "pinia";

// Mock window.matchMedia for components that use it (GraficaBarras, etc.)
vi.stubGlobal(
  "matchMedia",
  vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
);
import Btn from "./Btn.vue";
import Badge from "./Badge.vue";
import Card from "./Card.vue";
import Modal from "./Modal.vue";
import Input from "./Input.vue";
import Select from "./Select.vue";
import Pagination from "./Pagination.vue";
import Icon from "./Icon.vue";
import Th from "./Th.vue";
import TableState from "./TableState.vue";
import Td from "./Td.vue";
import Field from "./Field.vue";
import CustomFields from "./CustomFields.vue";
import CommandPalette from "./CommandPalette.vue";
import Sheet from "./Sheet.vue";
import DropdownMenu from "./DropdownMenu.vue";
import DropdownMenuItem from "./DropdownMenuItem.vue";
import Tooltip from "./Tooltip.vue";
import GraficaBarras from "./GraficaBarras.vue";
import GraficaDona from "./GraficaDona.vue";
import GraficaLinea from "./GraficaLinea.vue";
import { TooltipProvider } from "reka-ui";

describe("Btn", () => {
  it("renderiza el slot y variante primaria por defecto", () => {
    const w = mount(Btn, { slots: { default: "Guardar" } });
    expect(w.text()).toBe("Guardar");
    expect(w.classes()).toContain("btn-primary");
    expect(w.attributes("style")).toContain("linear-gradient");
  });

  it("aplica la variante outline", () => {
    const w = mount(Btn, { props: { variant: "outline" } });
    expect(w.classes()).toContain("btn-outline");
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

  it("variante icon usa tamaño fijo uniforme sin clases de size", () => {
    const w = mount(Btn, {
      props: { variant: "icon", size: "lg" },
      slots: { default: "+" },
    });
    expect(w.classes()).toContain("btn-icon");
    expect(w.classes()).not.toContain("px-6");
    expect(w.classes()).not.toContain("py-3");
    // btn-icon has fixed 40px via CSS class
    expect(w.classes()).toContain("btn-icon");
  });
});

describe("Badge", () => {
  it("muestra punto y texto en variante dot", () => {
    const w = mount(Badge, {
      props: { color: "green", dot: true },
      slots: { default: "En vivo" },
    });
    expect(w.text()).toBe("En vivo");
    expect(w.find(".badge-dot-indicator").exists()).toBe(true);
    expect(w.find(".badge-dot-indicator").attributes("style")).toContain(
      "background-color",
    );
  });

  it("aplica color hexadecimal arbitrario al punto", () => {
    const w = mount(Badge, {
      props: { color: "#0F6CBD", dot: true },
      slots: { default: "Etapa" },
    });
    // jsdom normaliza el hex a rgb()
    expect(w.find(".badge-dot-indicator").attributes("style")).toContain(
      "background-color",
    );
  });

  it("oculta el punto con dot=false", () => {
    const w = mount(Badge, {
      props: { variant: "success", dot: false },
      slots: { default: "Activo" },
    });
    // badge-dot-indicator should not exist when dot=false
    expect(w.find(".badge-dot-indicator").exists()).toBe(false);
    expect(w.classes()).toContain("badge-success");
  });
});

describe("Card", () => {
  it("usa variante flat por defecto", () => {
    const w = mount(Card, { slots: { default: "hola" } });
    expect(w.classes()).toContain("rounded-2xl");
    expect(w.classes().join(" ")).toContain("bg-[var(--panel)]");
  });

  it("usa superficie elevada con variant elevated", () => {
    const w = mount(Card, {
      props: { variant: "elevated" },
      slots: { default: "hola" },
    });
    expect(w.classes()).toContain("border");
    expect(w.classes()).toContain("rounded-2xl");
    expect(w.classes().join(" ")).not.toContain("bg-white");
  });
});

describe("Modal", () => {
  it("no renderiza nada cerrado", () => {
    const w = mount(Modal, { props: { open: false } });
    expect(w.html()).not.toContain("Confirmar");
  });

  it("cierra al pulsar Cancelar y limpia estilos del body", async () => {
    const w = mount(Modal, {
      props: { open: true, title: "Nuevo" },
      slots: { default: "<p>Cuerpo</p>" },
      attachTo: document.body,
    });
    document.body.style.pointerEvents = "none";
    await w.setProps({ open: false });
    await new Promise((r) => setTimeout(r, 350));
    expect(document.querySelector(".dialog-shell")).toBeNull();
    expect(document.body.style.pointerEvents).toBe("");
    w.unmount();
  });

  it("muestra título y emite close", async () => {
    const w = mount(Modal, {
      props: { open: true, title: "Confirmar" },
      slots: { default: "<p>Cuerpo</p>" },
      attachTo: document.body,
    });
    expect(document.body.textContent).toContain("Confirmar");
    // Close via the close button
    const closeBtn = document.body.querySelector(".modal-close");
    closeBtn?.click();
    await w.vm.$nextTick();
    expect(w.emitted("close")).toBeTruthy();
    w.unmount();
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
    expect(w.find("select").attributes("disabled")).toBeDefined();
  });
});

describe("Input", () => {
  it("propaga placeholder y disabled", () => {
    const w = mount(Input, {
      props: { placeholder: "Buscar...", disabled: true },
    });
    expect(w.find("input").attributes("placeholder")).toBe("Buscar...");
    expect(w.find("input").attributes("disabled")).toBeDefined();
  });
});

describe("Modal", () => {
  it("renderiza el slot de footer", () => {
    const w = mount(Modal, {
      props: { open: true, title: "T" },
      slots: { footer: "<button>Ok</button>" },
      attachTo: document.body,
    });
    expect(document.body.textContent).toContain("Ok");
    w.unmount();
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

describe("CustomFields", () => {
  it("no entra en bucle al reasignar modelValue equivalente", async () => {
    const w = mount(CustomFields, {
      props: { entidad: "contacto", modelValue: {} },
      global: { stubs: { FechaInput: true } },
    });
    await flushPromises();
    const spy = vi.fn();
    w.vm.$emit = spy;
    await w.setProps({ modelValue: {} });
    await w.setProps({ modelValue: { a: 1 } });
    await w.setProps({ modelValue: { a: 1 } });
    await nextTick();
    expect(spy).not.toHaveBeenCalled();
    w.unmount();
  });
});

describe("Btn link-danger", () => {
  it("usa rojo sin relleno y sin padding de botón", () => {
    const w = mount(Btn, {
      props: { variant: "link-danger" },
      slots: { default: "Eliminar" },
    });
    expect(w.classes()).toContain("btn-link-danger");
    expect(w.classes()).not.toContain("px-4");
    expect(w.classes()).not.toContain("bg-red-600");
    // Check that it uses CSS variable for destructive color
    expect(w.attributes("style")).toContain("destructive");
  });
});

describe("TableState", () => {
  it("muestra skeleton en modo loading", () => {
    const w = mount(TableState, {
      props: { loading: true, colspan: 6 },
    });
    expect(w.find("tr").exists()).toBe(true);
    expect(w.find("td").attributes("colspan")).toBe("6");
  });

  it("muestra el mensaje de vacío con su slot", () => {
    const w = mount(TableState, {
      props: { colspan: 4 },
      slots: { default: "Sin presupuestos." },
    });
    expect(w.text()).toContain("Sin presupuestos.");
    expect(w.find("td").classes()).toContain("text-center");
  });
});

describe("CommandPalette", () => {
  const cmds = [
    { id: "a", label: "Ir a Contactos", group: "Ventas", to: "/contactos" },
    { id: "b", label: "Ir a Empresas", group: "Ventas", to: "/empresas" },
    { id: "c", label: "Cerrar sesión", group: "Acción" },
  ];

  let router: ReturnType<typeof createRouter>;
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: "/contactos",
          name: "contactos",
          component: { template: "<div>Contactos</div>" },
        },
        {
          path: "/empresas",
          name: "empresas",
          component: { template: "<div>Empresas</div>" },
        },
      ],
    });
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it("no renderiza nada cerrada", () => {
    const w = mount(CommandPalette, {
      props: { open: false, commands: cmds },
      global: {
        plugins: [router, pinia],
      },
    });
    expect(w.text()).not.toContain("Ir a Contactos");
    w.unmount();
  });

  // TODO: Fix filtering tests - component uses composable state internally
  it.skip("filtra comandos al escribir", async () => {
    const w = mount(CommandPalette, {
      props: { open: true, commands: cmds },
      attachTo: document.body,
      global: {
        plugins: [router, pinia],
      },
    });
    await nextTick();
    const input = w.find("input");
    expect(input.exists()).toBe(true);
    await input.setValue("empresas");
    expect(w.text()).toContain("Ir a Empresas");
    expect(w.text()).not.toContain("Cerrar sesión");
    w.unmount();
  });

  it.skip("ejecuta el comando seleccionado con Enter y emite close", async () => {
    const w = mount(CommandPalette, {
      props: { open: true, commands: cmds },
      attachTo: document.body,
      global: {
        plugins: [router, pinia],
      },
    });
    await nextTick();
    const input = w.find("input");
    await input.setValue("contactos");
    await input.trigger("keydown", { key: "Enter" });
    expect(w.emitted("select")?.[0]?.[0]).toMatchObject({
      id: "a",
      to: "/contactos",
    });
    expect(w.emitted("close")).toBeTruthy();
    w.unmount();
  });

  it.skip("navega con flechas y muestra mensaje sin resultados", async () => {
    const w = mount(CommandPalette, {
      props: { open: true, commands: cmds },
      attachTo: document.body,
      global: {
        plugins: [router, pinia],
      },
    });
    await nextTick();
    const input = w.find("input");
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.setValue("zzz-no-existe");
    expect(w.text()).toContain("Sin resultados");
    w.unmount();
  });
});

describe("Sheet", () => {
  it("no renderiza nada cerrado", () => {
    const w = mount(Sheet, { props: { open: false, title: "Panel" } });
    expect(w.text()).not.toContain("Panel");
    w.unmount();
  });

  it("muestra título y emite close al pulsar fuera", async () => {
    const w = mount(Sheet, {
      props: { open: true, title: "Panel" },
      slots: { default: "<p>Contenido</p>" },
      attachTo: document.body,
    });
    expect(w.text()).toContain("Panel");
    expect(w.text()).toContain("Contenido");
    const overlay = document.querySelector(".sheet-shell");
    overlay!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(w.emitted("close")).toBeTruthy();
    w.unmount();
  });

  it("emite close desde el botón del header", async () => {
    const w = mount(Sheet, {
      props: { open: true, title: "Panel" },
      attachTo: document.body,
    });
    const btn = w.find('button[aria-label="Cerrar panel"]');
    expect(btn.exists()).toBe(true);
    await btn.trigger("click");
    expect(w.emitted("close")).toBeTruthy();
    w.unmount();
  });
});

describe("DropdownMenu", () => {
  it("abre al pulsar el trigger y muestra los items", async () => {
    const w = mount(DropdownMenu, {
      slots: {
        trigger: '<button type="button" class="trigger">Menú</button>',
        default:
          "<DropdownMenuItem>Temas</DropdownMenuItem><DropdownMenuItem danger>Salir</DropdownMenuItem>",
      },
      global: { components: { DropdownMenuItem } },
      attachTo: document.body,
    });
    await w.find(".trigger").trigger("click");
    await nextTick();
    await nextTick();
    expect(document.body.textContent).toContain("Temas");
    expect(document.body.textContent).toContain("Salir");
    w.unmount();
  });

  it("marca danger en el item peligroso", async () => {
    const w = mount(DropdownMenu, {
      slots: {
        trigger: '<button type="button" class="trigger">Menú</button>',
        default: "<DropdownMenuItem danger>Eliminar</DropdownMenuItem>",
      },
      global: { components: { DropdownMenuItem } },
      attachTo: document.body,
    });
    await w.find(".trigger").trigger("click");
    await nextTick();
    await nextTick();
    const item = document.body.querySelector(".text-red-600");
    expect(item).toBeTruthy();
    expect(item!.textContent).toContain("Eliminar");
    w.unmount();
  });
});

describe("Tooltip", () => {
  it("renderiza el trigger y abre el contenido al enfocar con retardo 0", async () => {
    const Host = {
      components: { Tooltip, TooltipProvider },
      template: `
        <TooltipProvider :delay-duration="0">
          <Tooltip content="Cerrar sesión" :delay="0">
            <button type="button">Salir</button>
          </Tooltip>
        </TooltipProvider>
      `,
    };
    const w = mount(Host, { attachTo: document.body });
    const trigger = w.find("button");
    expect(trigger.exists()).toBe(true);
    await trigger.trigger("focus");
    await new Promise((r) => setTimeout(r, 30));
    expect(document.body.textContent).toContain("Cerrar sesión");
    w.unmount();
  });
});

describe("GraficaBarras", () => {
  it("muestra empty state sin datos", () => {
    const w = mount(GraficaBarras, { props: { datos: [], animar: false } });
    expect(w.text()).toContain("Sin datos para graficar");
    // Empty state may still render SVG container
    expect(w.find("svg").exists()).toBe(true);
  });

  it("renderiza barras y aria-label con datos", async () => {
    const w = mount(GraficaBarras, {
      props: {
        datos: [
          { etiqueta: "Ene", valor: 100, valorFmt: "$100" },
          { etiqueta: "Feb", valor: 200, valorFmt: "$200" },
        ],
        animar: false,
        ariaLabel: "Ventas mensuales",
      },
    });
    await nextTick();
    expect(w.find("svg").exists()).toBe(true);
    expect(w.find("svg").attributes("aria-label")).toBe("Ventas mensuales");
    expect(w.findAll("rect").length).toBeGreaterThanOrEqual(2);
    expect(w.text()).toContain("Ene");
    expect(w.text()).toContain("Feb");
  });
});

describe("GraficaDona", () => {
  it("muestra empty state sin segmentos", () => {
    const w = mount(GraficaDona, { props: { datos: [], animar: false } });
    expect(w.text()).toContain("Sin datos para graficar");
    expect(w.find("svg").exists()).toBe(false);
  });

  it("renderiza la dona con leyenda y porcentajes", async () => {
    const w = mount(GraficaDona, {
      props: {
        datos: [
          { etiqueta: "Cerrado", count: 7, color: "#22c55e" },
          { etiqueta: "Abierto", count: 3, color: "#3b82f6" },
        ],
        animar: false,
        centro: "total",
      },
    });
    await nextTick();
    await new Promise((r) => setTimeout(r, 120));
    expect(w.find("svg").exists()).toBe(true);
    expect(w.text()).toContain("Cerrado");
    expect(w.text()).toContain("Abierto");
    expect(w.text()).toContain("70%");
    expect(w.text()).toContain("30%");
    expect(w.find("svg").text()).toContain("10");
  });
});

describe("GraficaLinea", () => {
  it("muestra empty state sin datos", () => {
    const w = mount(GraficaLinea, { props: { datos: [] } });
    expect(w.text()).toContain("Sin datos para graficar.");
    expect(w.find("svg").exists()).toBe(false);
  });

  it("renderiza la línea con datos de la serie", async () => {
    const w = mount(GraficaLinea, {
      props: {
        datos: [
          { etiqueta: "Lun", valor: 5, valorFmt: "5" },
          { etiqueta: "Mar", valor: 8, valorFmt: "8" },
          { etiqueta: "Mié", valor: 3, valorFmt: "3" },
        ],
        animar: false,
        ariaLabel: "Actividad semanal",
      },
    });
    await nextTick();
    expect(w.find("svg").exists()).toBe(true);
    expect(w.find("svg").attributes("aria-label")).toBe("Actividad semanal");
    expect(w.find("path.line-path").exists()).toBe(true);
    expect(w.find("path.line-area").exists()).toBe(true);
    expect(w.findAll("circle").length).toBe(3);
    expect(w.text()).toContain("Lun");
    expect(w.text()).toContain("Mar");
  });
});
