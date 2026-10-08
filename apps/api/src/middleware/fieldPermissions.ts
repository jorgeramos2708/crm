import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import {
  FieldPermissionService,
  FieldPermissionsMap,
} from "../services/fieldPermissions.js";

declare module "fastify" {
  interface FastifyRequest {
    fieldPermissions?: FieldPermissionsMap;
  }
}

export async function fieldPermissionMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user || !request.tenantId) return;

  const permissions = await FieldPermissionService.getForRole(
    request.tenantId,
    request.user.role,
  );
  request.fieldPermissions = permissions;
}

export function createFieldFilter(
  entity: string,
  operation: "read" | "write" = "read",
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.fieldPermissions) return;

    const originalSend = reply.send.bind(reply);
    reply.send = function (payload: any) {
      if (payload && (Array.isArray(payload) || typeof payload === "object")) {
        if (payload.data && Array.isArray(payload.data)) {
          // Paginated response: { data: [...], total: ... }
          payload.data = FieldPermissionService.filterFields(
            payload.data,
            entity,
            request.fieldPermissions!,
            operation,
          );
        } else if (Array.isArray(payload)) {
          // Direct array response
          payload = FieldPermissionService.filterFields(
            payload,
            entity,
            request.fieldPermissions!,
            operation,
          );
        } else if (payload.id || Object.keys(payload).length > 0) {
          // Single object response
          payload = FieldPermissionService.filterFields(
            payload,
            entity,
            request.fieldPermissions!,
            operation,
          );
        }
      }
      return originalSend(payload);
    };
  };
}

export function createWriteFieldFilter(entity: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.fieldPermissions || !request.body) return;

    const body = request.body as Record<string, any>;
    const filteredBody: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
      if (
        FieldPermissionService.checkWritePermission(
          entity,
          key,
          request.fieldPermissions!,
        )
      ) {
        filteredBody[key] = value;
      } else {
        return reply.code(403).send({
          error: `No tiene permiso para escribir el campo '${key}'`,
          code: "FIELD_WRITE_FORBIDDEN",
          field: key,
        });
      }
    }

    request.body = filteredBody;
  };
}

export async function registerFieldPermissionRoutes(app: FastifyInstance) {
  app.get(
    "/api/ajustes/field-permissions",
    async (
      request: FastifyRequest<{
        Querystring: { role?: string; entity?: string };
      }>,
    ) => {
      const tenantId = request.tenantId || "default";
      const role = request.query?.role || request.user?.role || "user";
      const entity = request.query?.entity;

      const permissions = await FieldPermissionService.getForRole(
        tenantId,
        role,
      );

      if (entity) {
        return { fieldPermissions: permissions[entity] || {} };
      }
      return { fieldPermissions: permissions };
    },
  );

  app.put(
    "/api/ajustes/field-permissions",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId || "default";
      const body = request.body as {
        role: string;
        entity: string;
        field: string;
        canRead: boolean;
        canWrite: boolean;
      };

      if (!body.role || !body.entity || !body.field) {
        return reply
          .code(400)
          .send({ error: "role, entity y field son requeridos" });
      }

      await FieldPermissionService.setPermission(
        tenantId,
        body.role,
        body.entity,
        body.field,
        body.canRead ?? true,
        body.canWrite ?? false,
      );

      return { ok: true };
    },
  );

  app.delete(
    "/api/ajustes/field-permissions",
    async (
      request: FastifyRequest<{
        Querystring: { role: string; entity: string; field: string };
      }>,
      reply: FastifyReply,
    ) => {
      const tenantId = request.tenantId || "default";
      const { role, entity, field } = request.query;

      if (!role || !entity || !field) {
        return reply
          .code(400)
          .send({ error: "role, entity y field son requeridos" });
      }

      await FieldPermissionService.deletePermission(
        tenantId,
        role,
        entity,
        field,
      );

      return { ok: true };
    },
  );

  app.post(
    "/api/ajustes/field-permissions/bulk",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = request.tenantId || "default";
      const body = request.body as {
        role: string;
        permissions: Array<{
          entity: string;
          field: string;
          canRead: boolean;
          canWrite: boolean;
        }>;
      };

      if (!body.role || !Array.isArray(body.permissions)) {
        return reply
          .code(400)
          .send({ error: "role y permissions[] son requeridos" });
      }

      await FieldPermissionService.bulkSetPermissions(
        tenantId,
        body.role,
        body.permissions,
      );

      return { ok: true };
    },
  );
}
