import { FastifyRequest, FastifyReply } from "fastify";
import {
  FieldPermissionService,
  FieldPermissionsMap,
} from "../services/fieldPermissions.js";

export interface FieldFilterOptions {
  entity: string;
  action?: "read" | "write";
}

declare module "fastify" {
  interface FastifyRequest {
    fieldPermissions?: FieldPermissionsMap;
  }
}

export function createFieldFilter(entity: string) {
  return async function fieldFilter(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const tenantId = request.tenantId ?? "default";
    const role = request.user?.role ?? "user";

    const perms: FieldPermissionsMap = await FieldPermissionService.getForRole(
      tenantId,
      role,
    );
    request.fieldPermissions = perms;

    const entityPerms = perms?.[entity];
    if (!entityPerms) return;

    if (request.method === "GET") {
      const originalSend = reply.send.bind(reply);
      reply.send = function (payload: any) {
        if (payload && typeof payload === "object") {
          const filtered = filterObject(payload, entityPerms, "canRead");
          return originalSend(filtered);
        }
        return originalSend(payload);
      };
    }

    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      const body = request.body as Record<string, any>;
      if (body && typeof body === "object") {
        const filtered = filterObject(body, entityPerms, "canWrite");
        request.body = filtered;
      }
    }
  };
}

function filterObject(
  obj: any,
  perms: Record<string, { canRead: boolean; canWrite: boolean }>,
  check: "canRead" | "canWrite",
): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => filterObject(item, perms, check));
  }
  if (obj && typeof obj === "object") {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const perm = perms[key];
      if (!perm) {
        result[key] = filterObject(value, perms, check);
        continue;
      }
      if (perm[check]) {
        result[key] = filterObject(value, perms, check);
      }
    }
    return result;
  }
  return obj;
}

export function checkFieldWritePermission(
  request: FastifyRequest,
  entity: string,
  field: string,
): boolean {
  const perms = request.fieldPermissions?.[entity]?.[field];
  return perms?.canWrite ?? false;
}

export function checkFieldReadPermission(
  request: FastifyRequest,
  entity: string,
  field: string,
): boolean {
  const perms = request.fieldPermissions?.[entity]?.[field];
  return perms?.canRead ?? true;
}
