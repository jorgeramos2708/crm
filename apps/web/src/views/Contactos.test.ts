import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: { withCredentials: true, baseURL: "", headers: { common: {} } },
  },
}));

import axios from "axios";
import Contactos from "./Contactos.vue";
import { estadoToasts } from "../utils/toast";

const mockedGet = axios.get as unknown as ReturnType<typeof vi.fn>;

const filas = [
  {
    id: "1",
    nombre: "Ana López",
    email: "ana@acme.com",
    telefono: "",
    empresa: "Acme",
    cargo: "",
  },
];

function mockApi(lista: unknown[] = filas) {
  mockedGet.mockImplementation((url: string) => {
    if (url === "/api/contactos")
      return Promise.resolve({ data: { data: lista, total: lista.length } });
    return Promise.resolve({ data: { data: [] } });
  });
}

describe("Contactos", () => {
  let mounted: { unmount: () => void } | null = null;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    estadoToasts.items.value = [];
  });

  afterEach(() => {
    mounted?.unmount();
    mounted = null;
  });

  function mountContactos() {
    mounted = mount(Contactos, {
      global: { stubs: { CustomFields: true, VistasGuardadas: true } },
      attachTo: document.body,
    });
    return mounted;
  }

  it("lista los contactos de la API", async () => {
    mockApi();
    const w = mountContactos();
    await flushPromises();
    expect(w.text()).toContain("Ana López");
    expect(w.text()).toContain("ana@acme.com");
  });

  it("muestra estado vacío sin contactos", async () => {
    mockApi([]);
    const w = mountContactos();
    await flushPromises();
    expect(w.text()).toContain("No hay contactos.");
  });

  it("abre el modal con Nuevo Contacto", async () => {
    mockApi([]);
    const w = mountContactos();
    await flushPromises();
    await w
      .findAll("button")
      .find((b) => b.attributes("title") === "Nuevo Contacto")!
      .trigger("click");
    expect(w.text()).toContain("Nuevo Contacto");
  });

  it("valida el nombre al guardar", async () => {
    mockApi([]);
    const w = mountContactos();
    await flushPromises();
    await w
      .findAll("button")
      .find((b) => b.attributes("title") === "Nuevo Contacto")!
      .trigger("click");
    const forms = w.findAll("form");
    await forms[forms.length - 1].trigger("submit");
    expect(estadoToasts.items.value.some((t) => t.tipo === "error")).toBe(true);
  });

  it("Cancelar cierra el modal sin congelar la UI", async () => {
    mockApi([]);
    const w = mountContactos();
    await flushPromises();
    await w
      .findAll("button")
      .find((b) => b.attributes("title") === "Nuevo Contacto")!
      .trigger("click");
    expect(w.text()).toContain("Nuevo Contacto");
    const cancelar = w.findAll("button").find((b) => b.text() === "Cancelar")!;
    await cancelar.trigger("click");
    await flushPromises();
    await new Promise((r) => setTimeout(r, 350));
    expect(document.querySelector(".dialog-shell")).toBeNull();
    expect(w.findAll("button").some((b) => b.text() === "Cancelar")).toBe(
      false,
    );
  });
});
