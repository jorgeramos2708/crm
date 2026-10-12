import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, isNull } from "drizzle-orm";
import { users, tenants, pipelines, pipelineStages } from "./db/schema.js";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://crm:crm_dev_password@postgres:5432/crm",
});

const db = drizzle(pool);

async function seed() {
  // Tenant por defecto (idempotente): sin tenants, getDefaultTenantId
  // devuelve "" y los inserts con tenant_id UUID fallan (22P02 -> 404).
  const [tenant] = await db
    .insert(tenants)
    .values({ nombre: "Principal", subdominio: "default" })
    .onConflictDoNothing({ target: tenants.subdominio })
    .returning({ id: tenants.id });
  const tenantId =
    tenant?.id ??
    (
      await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.subdominio, "default"))
        .limit(1)
    )[0]?.id;
  const hash = await bcrypt.hash("admin1234", 12);
  await db
    .insert(users)
    .values({
      email: "admin@crm.local",
      passwordHash: hash,
      name: "Admin",
      role: "admin",
      activo: true,
      tenantId: tenantId ?? null,
    })
    .onConflictDoNothing();
  // Vincula admins huérfanos sin tocar passwords existentes.
  await db.update(users).set({ tenantId }).where(isNull(users.tenantId));
  // Pipeline comercial estándar (solo si no hay ninguno).
  const existing = await db
    .select({ id: pipelines.id })
    .from(pipelines)
    .limit(1);
  if (!existing.length) {
    const [pipe] = await db
      .insert(pipelines)
      .values({
        nombre: "Pipeline Principal",
        descripcion: "Pipeline comercial estándar",
        activo: true,
      })
      .returning({ id: pipelines.id });
    const etapas = [
      {
        nombre: "Prospección",
        color: "#3b82f6",
        orden: 1,
        esInicial: true,
        esFinal: false,
      },
      {
        nombre: "Calificación",
        color: "#0ea5e9",
        orden: 2,
        esInicial: false,
        esFinal: false,
      },
      {
        nombre: "Reunión/Demostración",
        color: "#8b5cf6",
        orden: 3,
        esInicial: false,
        esFinal: false,
      },
      {
        nombre: "Propuesta",
        color: "#f59e0b",
        orden: 4,
        esInicial: false,
        esFinal: false,
      },
      {
        nombre: "Negociación",
        color: "#f97316",
        orden: 5,
        esInicial: false,
        esFinal: false,
      },
      {
        nombre: "Ganado",
        color: "#22c55e",
        orden: 6,
        esInicial: false,
        esFinal: true,
      },
      {
        nombre: "Perdido",
        color: "#991b1b",
        orden: 7,
        esInicial: false,
        esFinal: true,
      },
      {
        nombre: "Postventa",
        color: "#14b8a6",
        orden: 8,
        esInicial: false,
        esFinal: false,
      },
    ];
    for (const e of etapas) {
      await db.insert(pipelineStages).values({
        pipelineId: pipe.id,
        nombre: e.nombre,
        color: e.color,
        orden: e.orden,
        esInicial: e.esInicial,
        esFinal: e.esFinal,
      });
    }
  }
  console.log("Admin created");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
