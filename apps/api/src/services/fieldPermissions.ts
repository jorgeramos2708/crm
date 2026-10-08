import { db } from "../db/index.js";
import { fieldPermissions } from "../db/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { redis } from "./redis.js";

export interface FieldPermissionRule {
  entity: string;
  field: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface FieldPermissionsMap {
  [entity: string]: {
    [field: string]: { canRead: boolean; canWrite: boolean };
  };
}

const CACHE_TTL = 300; // 5 minutes
const CACHE_PREFIX = "field_perms:";

export class FieldPermissionService {
  static async getForRole(
    tenantId: string,
    role: string,
  ): Promise<FieldPermissionsMap> {
    // Admin: acceso total (mapa vacío = los filtros dejan pasar todo).
    if (role === "admin") return {};
    const cacheKey = `${CACHE_PREFIX}${tenantId}:${role}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as FieldPermissionsMap;
    }

    const perms = await db
      .select()
      .from(fieldPermissions)
      .where(
        and(
          eq(fieldPermissions.tenantId, tenantId),
          eq(fieldPermissions.role, role),
        ),
      );

    // Base = defaults seguros; las filas de BD los sobreescriben.
    const map: FieldPermissionsMap = JSON.parse(
      JSON.stringify(await this.getDefaultPermissions()),
    );
    for (const p of perms) {
      if (!map[p.entity]) map[p.entity] = {};
      map[p.entity][p.field] = {
        canRead: p.canRead,
        canWrite: p.canWrite,
      };
    }

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(map));
    return map;
  }

  static async invalidateCache(tenantId: string, role?: string): Promise<void> {
    if (role) {
      await redis.del(`${CACHE_PREFIX}${tenantId}:${role}`);
    } else {
      const keys = await redis.keys(`${CACHE_PREFIX}${tenantId}:*`);
      if (keys.length > 0) await redis.del(...keys);
    }
  }

  static async setPermission(
    tenantId: string,
    role: string,
    entity: string,
    field: string,
    canRead: boolean,
    canWrite: boolean,
  ): Promise<void> {
    await db
      .insert(fieldPermissions)
      .values({
        tenantId,
        role,
        entity,
        field,
        canRead,
        canWrite,
      })
      .onConflictDoUpdate({
        target: [
          fieldPermissions.tenantId,
          fieldPermissions.role,
          fieldPermissions.entity,
          fieldPermissions.field,
        ],
        set: { canRead, canWrite, updatedAt: new Date() },
      });

    await this.invalidateCache(tenantId, role);
  }

  static async bulkSetPermissions(
    tenantId: string,
    role: string,
    permissions: Array<{
      entity: string;
      field: string;
      canRead: boolean;
      canWrite: boolean;
    }>,
  ): Promise<void> {
    if (permissions.length === 0) return;

    await db
      .insert(fieldPermissions)
      .values(
        permissions.map((p) => ({
          tenantId,
          role,
          entity: p.entity,
          field: p.field,
          canRead: p.canRead,
          canWrite: p.canWrite,
        })),
      )
      .onConflictDoUpdate({
        target: [
          fieldPermissions.tenantId,
          fieldPermissions.role,
          fieldPermissions.entity,
          fieldPermissions.field,
        ],
        set: {
          canRead: sql`excluded.can_read`,
          canWrite: sql`excluded.can_write`,
          updatedAt: new Date(),
        },
      });

    await this.invalidateCache(tenantId, role);
  }

  static async deletePermission(
    tenantId: string,
    role: string,
    entity: string,
    field: string,
  ): Promise<void> {
    await db
      .delete(fieldPermissions)
      .where(
        and(
          eq(fieldPermissions.tenantId, tenantId),
          eq(fieldPermissions.role, role),
          eq(fieldPermissions.entity, entity),
          eq(fieldPermissions.field, field),
        ),
      );

    await this.invalidateCache(tenantId, role);
  }

  static async getAllForTenant(tenantId: string): Promise<
    Array<{
      role: string;
      entity: string;
      field: string;
      canRead: boolean;
      canWrite: boolean;
    }>
  > {
    return db
      .select({
        role: fieldPermissions.role,
        entity: fieldPermissions.entity,
        field: fieldPermissions.field,
        canRead: fieldPermissions.canRead,
        canWrite: fieldPermissions.canWrite,
      })
      .from(fieldPermissions)
      .where(eq(fieldPermissions.tenantId, tenantId));
  }

  static async getDefaultPermissions(): Promise<FieldPermissionsMap> {
    // Baseline mínima para roles no-admin: solo lo demostrablemente peligroso.
    // (Una baseline más estricta rompería flujos core como crear contactos
    // con email; el admin la endurece vía la API de matriz.)
    return {
      users: {
        passwordHash: { canRead: false, canWrite: false },
        role: { canRead: true, canWrite: false },
      },
    };
  }

  static filterFields(
    data: any,
    entity: string,
    permissions: FieldPermissionsMap,
    operation: "read" | "write" = "read",
  ): any {
    if (!data) return data;
    const entityPerms = permissions[entity];
    if (!entityPerms) return data;

    const isArray = Array.isArray(data);
    const items = isArray ? data : [data];

    const filtered = items.map((item) => {
      const filteredItem: any = {};
      for (const [key, value] of Object.entries(item)) {
        const fieldPerm = entityPerms[key];
        if (!fieldPerm) {
          // Field not explicitly configured, allow by default
          filteredItem[key] = value;
        } else if (operation === "read" && fieldPerm.canRead) {
          filteredItem[key] = value;
        } else if (operation === "write" && fieldPerm.canWrite) {
          filteredItem[key] = value;
        }
        // If no permission, omit the field
      }
      return filteredItem;
    });

    return isArray ? filtered : filtered[0];
  }

  static checkWritePermission(
    entity: string,
    field: string,
    permissions: FieldPermissionsMap,
  ): boolean {
    const entityPerms = permissions[entity];
    if (!entityPerms) return true; // Not configured, allow
    const fieldPerm = entityPerms[field];
    if (!fieldPerm) return true; // Not configured, allow
    return fieldPerm.canWrite;
  }
}
