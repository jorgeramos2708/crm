import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    defaults: { withCredentials: true, baseURL: "", headers: { common: {} } },
  },
}));

import axios from "axios";
import Dashboard from "./Dashboard.vue";
import { estadoToasts } from "../utils/toast";

const mockedGet = axios.get as unknown as ReturnType<typeof vi.fn>;

const stats = {
  totalOportunidades: 3,
  valorTotal: 1000,
  totalEtapas: 2,
  totalUsuarios: 1,
};

function mockApi(
  oportunidades: unknown[] = [],
  stages: unknown[] = [],
  fail = false,
) {
  mockedGet.mockImplementation((url: string) => {
    if (fail) return Promise.reject(new Error("down"));
    if (url === "/api/config") return Promise.resolve({ data: {} });
    if (url === "/api/dashboard/stats") return Promise.resolve({ data: stats });
    if (url.startsWith("/api/oportunidades"))
      return Promise.resolve({ data: { data: oportunidades } });
    if (url === "/api/pipeline-stages")
      return Promise.resolve({ data: { data: stages } });
    return Promise.reject(new Error("unexpected url " + url));
  });
}

function mountDashboard() {
  return mount(Dashboard, {
    global: {
      stubs: { RouterLink: { template: "<a><slot /></a>" } },
    },
  });
}

describe("Dashboard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    estadoToasts.items.value = [];
  });

  it("muestra el saludo y el estado vacío", async () => {
    mockApi();
    const w = mountDashboard();
    await flushPromises();
    expect(w.text()).toContain("Bienvenido");
    expect(w.text()).toContain("No hay oportunidades aún.");
  });

  it("lista oportunidades con su etapa y color", async () => {
    mockApi(
      [{ id: "1", nombre: "Acme", stageId: "s1", importe: 500 }],
      [{ id: "s1", nombre: "Nueva", color: "#ff0000" }],
    );
    const w = mountDashboard();
    await flushPromises();
    expect(w.text()).toContain("Acme");
    expect(w.text()).toContain("Nueva");
  });

  it("muestra toast si falla la carga", async () => {
    mockApi([], [], true);
    const silence = vi.spyOn(console, "error").mockImplementation(() => {});
    mountDashboard();
    await flushPromises();
    expect(estadoToasts.items.value.some((t) => t.tipo === "error")).toBe(true);
    silence.mockRestore();
  });
});
