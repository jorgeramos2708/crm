import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    defaults: { withCredentials: true, baseURL: "", headers: { common: {} } },
  },
}));

import axios from "axios";
import Tareas from "./Tareas.vue";
import { estadoToasts } from "../utils/toast";

const mockedGet = axios.get as unknown as ReturnType<typeof vi.fn>;
const mockedPut = axios.put as unknown as ReturnType<typeof vi.fn>;

const tareas = [
  {
    id: "t1",
    titulo: "Llamar a Acme",
    descripcion: "",
    estado: "pendiente",
    prioridad: "alta",
    vencimiento: "",
    entityType: "",
    entityId: "",
  },
  {
    id: "t2",
    titulo: "Enviar propuesta",
    descripcion: "",
    estado: "en_progreso",
    prioridad: "media",
    vencimiento: "",
    entityType: "",
    entityId: "",
  },
  {
    id: "t3",
    titulo: "Tarea completada",
    descripcion: "",
    estado: "completada",
    prioridad: "baja",
    vencimiento: "",
    entityType: "",
    entityId: "",
  },
];

function mockApi() {
  mockedGet.mockImplementation((url: string) => {
    if (url === "/api/tareas")
      return Promise.resolve({ data: { data: tareas } });
    if (
      url === "/api/contactos" ||
      url === "/api/companies" ||
      url === "/api/oportunidades"
    )
      return Promise.resolve({ data: { data: [] } });
    return Promise.resolve({ data: {} });
  });
}

describe("Tareas drag & drop", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    estadoToasts.items.value = [];
  });

  it("renderiza las columnas y tareas", async () => {
    mockApi();
    const w = mount(Tareas, { attachTo: document.body });
    await flushPromises();
    expect(w.text()).toContain("Pendiente");
    expect(w.text()).toContain("En progreso");
    expect(w.text()).toContain("Llamar a Acme");
    expect(w.text()).toContain("Enviar propuesta");
  });

  it("no arrastra tareas completadas", async () => {
    mockApi();
    const w = mount(Tareas, { attachTo: document.body });
    await flushPromises();

    const blockedCards = w.findAll('[draggable="false"]');
    expect(blockedCards.length).toBe(1);
    expect(blockedCards[0].text()).toContain("Tarea completada");

    const draggableCards = w.findAll('[draggable="true"]');
    expect(draggableCards.length).toBe(2);

    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    await draggableCards[0].trigger("dragstart", { dataTransfer });
    const compCards = w.findAll('[draggable="false"]');
    expect(mockedPut).not.toHaveBeenCalled();
    w.unmount();
  });

  it("resalta la columna destino y hace PUT al soltar", async () => {
    mockApi();
    mockedPut.mockResolvedValue({ data: {} });
    const w = mount(Tareas, { attachTo: document.body });
    await flushPromises();

    const cards = w.findAll('[draggable="true"]');
    expect(cards.length).toBe(2);
    const card = cards[0];

    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    await card.trigger("dragstart", { dataTransfer });
    expect(card.classes()).toContain("opacity-40");
    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", "t1");

    const columns = w.findAll(".space-y-2");
    expect(columns.length).toBe(4);
    const target =
      columns.find(
        (c) =>
          c.classes().includes("bg-blue-50") ||
          c.classes().includes("bg-blue-50 dark:bg-blue-900/15"),
      ) || columns[1];
    await target.trigger("dragover", { dataTransfer });
    expect(target.classes()).toContain("ring-2");

    await target.trigger("drop", { dataTransfer });
    await flushPromises();
    expect(mockedPut).toHaveBeenCalledWith("/api/tareas/t1", {
      estado: "en_progreso",
    });
    w.unmount();
  });

  it("limpia dropTarget y arrastrando al dragend", async () => {
    mockApi();
    const w = mount(Tareas, { attachTo: document.body });
    await flushPromises();
    const cards = w.findAll('[draggable="true"]');
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    await cards[0].trigger("dragstart", { dataTransfer });
    expect(cards[0].classes()).toContain("opacity-40");
    await cards[0].trigger("dragend");
    expect(cards[0].classes()).not.toContain("opacity-40");
    const columns = w.findAll(".space-y-2");
    await columns[1].trigger("dragover", { dataTransfer });
    await cards[0].trigger("dragend");
    expect(columns[1].classes()).not.toContain("ring-2");
    w.unmount();
  });
});
