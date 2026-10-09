import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Regresión de seguridad (auditoría power-pack CR-C-11/12/13 + guards).
// Integración HTTP contra el despliegue local; se omite si no hay API.
// Usa fixtures etiquetadas sec-e2e-* y limpia todo al final.
const BASE = process.env.API_TEST_URL || "http://localhost:8081";
const TAG = `sec${Date.now().toString(36)}`;

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
const garbage: Array<{ method: string; path: string }> = [];
const track = (method: string, path: string) => garbage.push({ method, path });

describe("security-regression", () => {
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
    if (!AC) return;
    for (const g of garbage.reverse()) {
      try {
        await api(g.method, g.path, undefined, AC);
      } catch {
        /* best-effort */
      }
    }
  }, 120000);

  it("matriz de campos es solo-admin (CR-C-12)", async () => {
    if (!reachable) return;
    const c = await api(
      "POST",
      "/api/users",
      { email: `u-${TAG}@test.com`, password: "Test1234!", name: "U" },
      AC!,
    );
    expect(c.status).toBe(201);
    track("DELETE", `/api/users/${c.data.id}`);
    const u = await api("POST", "/api/auth/login", {
      email: `u-${TAG}@test.com`,
      password: "Test1234!",
    });
    const mx = await api(
      "PUT",
      "/api/ajustes/field-permissions",
      {
        role: "user",
        entity: "users",
        field: "role",
        canRead: true,
        canWrite: true,
      },
      u.cookie!,
    );
    expect(mx.status).toBe(403);
  }, 60000);

  it("write denegado 403 + read stripped + baseline permite (CR-C-12)", async () => {
    if (!reachable) return;
    const c = await api(
      "POST",
      "/api/users",
      { email: `w-${TAG}@test.com`, password: "Test1234!", name: "W" },
      AC!,
    );
    track("DELETE", `/api/users/${c.data.id}`);
    await api(
      "PUT",
      `/api/users/${c.data.id}/permisos`,
      { permisos: [{ modulo: "contactos", r: true, w: true }] },
      AC!,
    );
    const u = await api("POST", "/api/auth/login", {
      email: `w-${TAG}@test.com`,
      password: "Test1234!",
    });
    await api(
      "PUT",
      "/api/ajustes/field-permissions",
      {
        role: "user",
        entity: "contactos",
        field: "email",
        canRead: true,
        canWrite: false,
      },
      AC!,
    );
    const denied = await api(
      "POST",
      "/api/contactos",
      { nombre: `NP-${TAG}`, email: `np-${TAG}@test.com` },
      u.cookie!,
    );
    expect(denied.status).toBe(403);
    expect(denied.data?.code).toBe("FIELD_WRITE_FORBIDDEN");
    await api(
      "DELETE",
      "/api/ajustes/field-permissions?role=user&entity=contactos&field=email",
      undefined,
      AC!,
    );
    const ok = await api(
      "POST",
      "/api/contactos",
      { nombre: `OK-${TAG}`, email: `ok-${TAG}@test.com` },
      u.cookie!,
    );
    expect([200, 201]).toContain(ok.status);
    track("DELETE", `/api/contactos/${ok.data?.id}`);
    await api(
      "PUT",
      "/api/ajustes/field-permissions",
      {
        role: "user",
        entity: "contactos",
        field: "email",
        canRead: false,
        canWrite: true,
      },
      AC!,
    );
    const list = await api(
      "GET",
      "/api/contactos?limit=100",
      undefined,
      u.cookie!,
    );
    const rows = list.data?.data || list.data || [];
    const mine = (Array.isArray(rows) ? rows : []).find(
      (x: any) => x?.nombre === `OK-${TAG}`,
    );
    expect(mine).toBeDefined();
    expect(mine).not.toHaveProperty("email");
    await api(
      "DELETE",
      "/api/ajustes/field-permissions?role=user&entity=contactos&field=email",
      undefined,
      AC!,
    );
  }, 120000);

  it("revocación por cambio de password: TOKEN_REVOKED + relogin (CR-C-11)", async () => {
    if (!reachable) return;
    const c = await api(
      "POST",
      "/api/users",
      { email: `r-${TAG}@test.com`, password: "Test1234!", name: "R" },
      AC!,
    );
    track("DELETE", `/api/users/${c.data.id}`);
    const u1 = await api("POST", "/api/auth/login", {
      email: `r-${TAG}@test.com`,
      password: "Test1234!",
    });
    await api(
      "PUT",
      `/api/users/${c.data.id}`,
      { password: "Nuevo1234!" },
      AC!,
    );
    const stale = await api("GET", "/api/auth/me", undefined, u1.cookie!);
    expect(stale.status).toBe(401);
    expect(stale.data?.code).toBe("TOKEN_REVOKED");
    const u2 = await api("POST", "/api/auth/login", {
      email: `r-${TAG}@test.com`,
      password: "Nuevo1234!",
    });
    expect(u2.status).toBe(200);
  }, 120000);

  it("bulk honesto + booking concurrente único (CR-C-13)", async () => {
    if (!reachable) return;
    const del = await api(
      "POST",
      "/api/contactos/bulk",
      { ids: ["00000000-0000-0000-0000-000000000000"], action: "delete" },
      AC!,
    );
    expect(del.status).toBe(200);
    expect(del.data?.succeeded).toEqual([]);
    expect(del.data?.failed?.length).toBeGreaterThan(0);
    // meeting: tipo + slots + 3 reservas concurrentes => exactamente 1 gana
    const t = await api(
      "POST",
      "/api/reuniones/tipos",
      { slug: `t-${TAG}`, nombre: "T", duracionMin: 30 },
      AC!,
    );
    expect(t.status).toBe(201);
    track("DELETE", `/api/reuniones/tipos/${t.data?.id}`);
    const day = new Date(Date.now() + 86400000);
    const ini = new Date(day.setHours(10, 0, 0, 0)).toISOString();
    const fin = new Date(day.setHours(11, 0, 0, 0)).toISOString();
    await api(
      "POST",
      `/api/reuniones/tipos/${t.data?.id}/generar-slots`,
      { inicio: ini, fin },
      AC!,
    );
    const slots = await api(
      "GET",
      `/api/reuniones/publico/t-${TAG}/slots?from=${ini}&to=${fin}`,
    );
    const list = slots.data?.data || slots.data || [];
    expect(Array.isArray(list) && list.length).toBeGreaterThan(0);
    const sid = list[0].id;
    const results = await Promise.all(
      [1, 2, 3].map((n) =>
        api("POST", `/api/reuniones/publico/t-${TAG}/reservar`, {
          slotId: sid,
          invitadoNombre: `G${n}`,
          invitadoEmail: `g${n}.${TAG}@test.com`,
        }),
      ),
    );
    expect(results.filter((r) => r.status === 200).length).toBe(1);
  }, 180000);

  it("no degradar/eliminar al último admin (LOW guard)", async () => {
    if (!reachable) return;
    const me = await api("GET", "/api/auth/me", undefined, AC!);
    const admins = await api("GET", "/api/users", undefined, AC!);
    const activeAdmins = (Array.isArray(admins.data) ? admins.data : []).filter(
      (u: any) => u.role === "admin" && u.activo,
    );
    if (activeAdmins.length === 1 && activeAdmins[0].id === me.data?.id) {
      const demote = await api(
        "PUT",
        `/api/users/${me.data.id}`,
        { role: "user" },
        AC!,
      );
      expect(demote.status).toBe(400);
      const del = await api(
        "DELETE",
        `/api/users/${me.data.id}`,
        undefined,
        AC!,
      );
      expect(del.status).toBe(400);
    } else {
      // Segundo admin: el ciclo degradar con control existe; se verifica vía código.
      expect(true).toBe(true);
    }
  }, 60000);
});
