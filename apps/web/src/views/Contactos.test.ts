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
    expect(w.text()).toContain("Crea el primero");
  });

  it("abre el modal con Nuevo Contacto", async () => {
    mockApi([]);
    const w = mountContactos();
    await flushPromises();
    await w
      .findAll("button")
      .find((b) => b.attributes("title") === "Nuevo Contacto")!
      .trigger("click");
    await flushPromises();
    // Modal is teleported to body
    expect(document.body.innerHTML).toContain("Nuevo Contacto");
  });

  it("valida el nombre al guardar", async () => {
    mockApi([]);
    const w = mountContactos();
    await flushPromises();
    await w
      .findAll("button")
      .find((b) => b.attributes("title") === "Nuevo Contacto")!
      .trigger("click");
    await flushPromises();
    const modalForm = document.body.querySelector("form");
    expect(modalForm).not.toBeNull();
    if (modalForm) {
      modalForm.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    }
    await flushPromises();
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
    await flushPromises();
    // Check modal is open in body
    expect(document.body.innerHTML).toContain("Nuevo Contacto");
    // Find Cancelar button in body
    const buttons = Array.from(document.body.querySelectorAll("button"));
    const cancelarBtn = buttons.find((b) => b.textContent === "Cancelar");
    expect(cancelarBtn).not.toBeNull();
    cancelarBtn?.click();
    await flushPromises();
    await new Promise((r) => setTimeout(r, 350));
    expect(document.body.querySelector(".modal-shell")).toBeNull();
    const remainingButtons = Array.from(
      document.body.querySelectorAll("button"),
    );
    expect(remainingButtons.some((b) => b.textContent === "Cancelar")).toBe(
      false,
    );
  });
});
