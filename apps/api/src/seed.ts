import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, isNull } from "drizzle-orm";
import { users, tenants } from "./db/schema.js";
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
  console.log("Admin created");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
