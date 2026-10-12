import { describe, it, expect, beforeAll, afterAll } from "vitest";
import pg from "pg";

// POST /api/activities: alta manual de notas desde el Dashboard.
// Integración HTTP contra el despliegue local; se omite si no hay API.
// Usa fixture etiquetada y la limpia al final.
const BASE = process.env.API_TEST_URL || "http://localhost:8081";
const TAG = `nota${Date.now().toString(36)}`;
const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://crm:crm_dev_password@localhost:5433/crm",
});

async function api(
  method: string,
  path: string,
  body?: unknown,
  cookie?: string,
): Promise<{ status: number; data: any; cookie: string | null }> {
  const r = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const m = (r.headers.get("set-cookie") || "").match(/token=([^;]+)/);
  let data: any = null;
  try {
    data = await r.json();
  } catch {
    /* vacío */
  }
  return { status: r.status, data, cookie: m ? `token=${m[1]}` : null };
}

let reachable = false;
let AC: string | null = null;
let createdId: string | null = null;

describe("activities-post", () => {
  beforeAll(async () => {
    try {
      const h = await fetch(`${BASE}/health`);
      reachable = h.ok;
    } catch {
      reachable = false;
    }
    if (!reachable) return;
    const admin = await api("POST", "/api/auth/login", {
      email: "admin@crm.local",
      password: "admin1234",
    });
    AC = admin.cookie;
    reachable = !!AC;
  }, 60000);

  afterAll(async () => {
    if (createdId) {
      await pool.query("DELETE FROM activities WHERE id = $1", [createdId]);
    }
    await pool.end();
  });

  it("401 sin sesión", async () => {
    if (!reachable) return;
    const r = await api("POST", "/api/activities", { titulo: "x" });
    expect(r.status).toBe(401);
  });

  it("400 sin título", async () => {
    if (!reachable) return;
    const r = await api("POST", "/api/activities", { titulo: "  " }, AC!);
    expect(r.status).toBe(400);
  });

  it("201 crea nota vinculada al autor", async () => {
    if (!reachable) return;
    const r = await api(
      "POST",
      "/api/activities",
      { titulo: TAG, descripcion: "nota de prueba" },
      AC!,
    );
    expect(r.status).toBe(201);
    expect(r.data.tipo).toBe("nota");
    expect(r.data.entityType).toBe("nota");
    expect(r.data.titulo).toBe(TAG);
    createdId = r.data.id;
  });
});
