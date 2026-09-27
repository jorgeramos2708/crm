import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    defaults: { withCredentials: true, baseURL: "", headers: { common: {} } },
  },
}));

import axios from "axios";
import Pipeline from "./Pipeline.vue";
import { estadoToasts } from "../utils/toast";

const mockedGet = axios.get as unknown as ReturnType<typeof vi.fn>;
const mockedPut = axios.put as unknown as ReturnType<typeof vi.fn>;

const stages = [
  { id: "s1", nombre: "Nueva", color: "#3b82f6", orden: 1 },
  { id: "s2", nombre: "Calificada", color: "#8b5cf6", orden: 2 },
];
const opps = [
  { id: "o1", nombre: "Acme", stageId: "s1", importe: 100 },
  { id: "o2", nombre: "Globex", stageId: "s2", importe: 200 },
];
const oppsConCompletado = [
  {
    id: "o1",
    nombre: "Acme",
    stageId: "s1",
    importe: 100,
    completadoEn: "2024-01-01T00:00:00.000Z",
  },
  { id: "o2", nombre: "Globex", stageId: "s2", importe: 200 },
];

function mockApi(oppsData = opps) {
  mockedGet.mockImplementation((url: string) => {
    if (url === "/api/pipeline-stages")
      return Promise.resolve({ data: { data: stages } });
    if (url === "/api/pipelines")
      return Promise.resolve({
        data: { data: [{ id: "p1", nombre: "Ventas" }] },
      });
    if (url.startsWith("/api/oportunidades"))
      return Promise.resolve({
        data: { data: oppsData.map((o) => ({ ...o })) },
      });
    if (url === "/api/config") return Promise.resolve({ data: {} });
    return Promise.resolve({ data: {} });
  });
}

describe("Pipeline drag & drop", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    estadoToasts.items.value = [];
  });

  it("renderiza las columnas y oportunidades", async () => {
    mockApi();
    const w = mount(Pipeline, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" },
          "auto-animate": true,
        },
      },
    });
    await flushPromises();
    expect(w.text()).toContain("Nueva");
    expect(w.text()).toContain("Calificada");
    expect(w.text()).toContain("Acme");
    expect(w.text()).toContain("Globex");
  });

  it("resalta la columna destino durante el dragover y limpia al drop", async () => {
    mockApi();
    mockedPut.mockResolvedValue({ data: {} });
    const w = mount(Pipeline, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" },
          "auto-animate": true,
        },
      },
      attachTo: document.body,
    });
    await flushPromises();

    const cards = w.findAll('[draggable="true"]');
    expect(cards.length).toBe(2);
    const card = cards[0];

    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    await card.trigger("dragstart", { dataTransfer });
    expect(card.classes()).toContain("opacity-40");
    expect(dataTransfer.effectAllowed).toBe("move");
    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", "o1");

    const columns = w.findAll(".space-y-1\\.5");
    expect(columns.length).toBe(2);
    await columns[1].trigger("dragover", { dataTransfer });
    expect(columns[1].classes()).toContain("ring-2");
    expect(columns[1].classes()).toContain("ring-white/70");

    await columns[1].trigger("drop", { dataTransfer });
    await flushPromises();
    expect(mockedPut).toHaveBeenCalledWith("/api/oportunidades/o1", {
      stageId: "s2",
    });
    expect(columns[1].classes()).not.toContain("ring-2");
    w.unmount();
  });

  it("no hace PUT al dropear en la misma columna", async () => {
    mockApi();
    mockedPut.mockResolvedValue({ data: {} });
    const w = mount(Pipeline, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" },
          "auto-animate": true,
        },
      },
      attachTo: document.body,
    });
    await flushPromises();

    const cards = w.findAll('[draggable="true"]');
    const card = cards[0];
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    await card.trigger("dragstart", { dataTransfer });
    const columns = w.findAll(".space-y-1\\.5");
    await columns[0].trigger("drop", { dataTransfer });
    await flushPromises();
    expect(mockedPut).not.toHaveBeenCalled();
    w.unmount();
  });

  it("limpia el estado al dragend", async () => {
    mockApi();
    const w = mount(Pipeline, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" },
          "auto-animate": true,
        },
      },
      attachTo: document.body,
    });
    await flushPromises();
    const cards = w.findAll('[draggable="true"]');
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    await cards[0].trigger("dragstart", { dataTransfer });
    expect(cards[0].classes()).toContain("opacity-40");
    await cards[0].trigger("dragend");
    expect(cards[0].classes()).not.toContain("opacity-40");
    w.unmount();
  });

  it("no arrastra oportunidades completadas", async () => {
    mockApi(oppsConCompletado);
    const w = mount(Pipeline, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" },
          "auto-animate": true,
        },
      },
      attachTo: document.body,
    });
    await flushPromises();

    const blockedCards = w.findAll('[draggable="false"]');
    expect(blockedCards.length).toBe(1);
    expect(blockedCards[0].text()).toContain("Acme");
    expect(w.findAll('[draggable="true"]').length).toBe(1);

    const blockedCard = blockedCards[0];
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    await blockedCard.trigger("dragstart", { dataTransfer });
    expect(dataTransfer.setData).not.toHaveBeenCalled();

    const columns = w.findAll(".space-y-1\\.5");
    await columns[1].trigger("drop", { dataTransfer });
    await flushPromises();
    expect(mockedPut).not.toHaveBeenCalled();
    w.unmount();
  });
});
