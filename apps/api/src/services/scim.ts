import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { users, tenants, auditLog } from "../db/schema.js";
import { eq, and, ilike, or, count, sql, desc } from "drizzle-orm";
import { createHash } from "node:crypto";

export interface SCIMUser {
  schemas: string[];
  id?: string;
  externalId?: string;
  userName: string;
  name?: {
    formatted?: string;
    familyName?: string;
    givenName?: string;
    middleName?: string;
    honorificPrefix?: string;
    honorificSuffix?: string;
  };
  displayName?: string;
  emails?: Array<{
    value: string;
    type?: string;
    primary?: boolean;
  }>;
  phoneNumbers?: Array<{
    value: string;
    type?: string;
    primary?: boolean;
  }>;
  addresses?: Array<{
    formatted?: string;
    streetAddress?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    type?: string;
    primary?: boolean;
  }>;
  groups?: Array<{
    value: string;
    display?: string;
    $ref?: string;
  }>;
  active: boolean;
  meta?: {
    resourceType: "User";
    created?: string;
    lastModified?: string;
    location?: string;
    version?: string;
  };
}

export interface SCIMGroup {
  schemas: string[];
  id?: string;
  displayName: string;
  members?: Array<{
    value: string;
    display?: string;
    $ref?: string;
  }>;
  meta?: {
    resourceType: "Group";
    created?: string;
    lastModified?: string;
    location?: string;
    version?: string;
  };
}

export interface SCIMListResponse<T> {
  schemas: string[];
  totalResults: number;
  itemsPerPage: number;
  startIndex: number;
  Resources: T[];
}

export interface SCIMSearchRequest {
  filter?: string;
  startIndex?: number;
  count?: number;
  attributes?: string;
  excludedAttributes?: string;
}

const SCIM_SCHEMAS = {
  User: "urn:ietf:params:scim:schemas:core:2.0:User",
  Group: "urn:ietf:params:scim:schemas:core:2.0:Group",
  ListResponse: "urn:ietf:params:scim:api:messages:2.0:ListResponse",
  Error: "urn:ietf:params:scim:api:messages:2.0:Error",
};

function toSCIMUser(user: any): SCIMUser {
  return {
    schemas: [SCIM_SCHEMAS.User],
    id: user.id,
    externalId: user.ssoSubject,
    userName: user.email,
    name: user.name
      ? {
          formatted: user.name,
          givenName: user.name.split(" ")[0],
          familyName: user.name.split(" ").slice(1).join(" "),
        }
      : undefined,
    displayName: user.name,
    emails: [
      {
        value: user.email,
        primary: true,
        type: "work",
      },
    ],
    groups: user.role ? [{ value: user.role, display: user.role }] : [],
    active: user.activo,
    meta: {
      resourceType: "User",
      created: user.createdAt?.toISOString(),
      lastModified: user.updatedAt?.toISOString(),
      location: `/scim/v2/Users/${user.id}`,
      version: createHash("md5")
        .update(user.updatedAt?.toISOString() || "")
        .digest("hex"),
    },
  };
}

function fromSCIMUser(scimUser: SCIMUser, tenantId: string): any {
  return {
    email: scimUser.userName,
    name:
      scimUser.name?.formatted ||
      scimUser.displayName ||
      scimUser.userName.split("@")[0],
    passwordHash: scimUser.id
      ? ""
      : "scim-generated-" + Math.random().toString(36).substring(7),
    role: scimUser.groups?.[0]?.value || "user",
    activo: scimUser.active,
    ssoProvider: "scim",
    ssoSubject: scimUser.externalId || scimUser.userName,
    ssoAttributes: {
      scim: true,
      name: scimUser.name,
      emails: scimUser.emails,
      phoneNumbers: scimUser.phoneNumbers,
      addresses: scimUser.addresses,
    },
    tenantId,
  };
}

function toSCIMGroup(group: any): SCIMGroup {
  return {
    schemas: [SCIM_SCHEMAS.Group],
    id: group.id,
    displayName: group.nombre,
    members:
      group.miembros?.map((m: any) => ({
        value: m.userId,
        display: m.user?.name,
        $ref: `/scim/v2/Users/${m.userId}`,
      })) || [],
    meta: {
      resourceType: "Group",
      created: group.createdAt?.toISOString(),
      lastModified: group.updatedAt?.toISOString(),
      location: `/scim/v2/Groups/${group.id}`,
      version: createHash("md5")
        .update(group.updatedAt?.toISOString() || "")
        .digest("hex"),
    },
  };
}

function parseSCIMFilter(filter: string): any {
  if (!filter) return {};

  const conditions: any = {};

  const eqMatch = filter.match(/(\w+)\s+eq\s+"([^"]+)"/);
  if (eqMatch) {
    conditions[eqMatch[1]] = eqMatch[2];
  }

  const coMatch = filter.match(/(\w+)\s+co\s+"([^"]+)"/);
  if (coMatch) {
    conditions[`${coMatch[1]}_contains`] = coMatch[2];
  }

  const swMatch = filter.match(/(\w+)\s+sw\s+"([^"]+)"/);
  if (swMatch) {
    conditions[`${swMatch[1]}_startsWith`] = swMatch[2];
  }

  const ewMatch = filter.match(/(\w+)\s+ew\s+"([^"]+)"/);
  if (ewMatch) {
    conditions[`${ewMatch[1]}_endsWith`] = ewMatch[2];
  }

  const prMatch = filter.match(/(\w+)\s+pr/);
  if (prMatch) {
    conditions[`${prMatch[1]}_present`] = true;
  }

  return conditions;
}

async function logAuditEvent(
  tenantId: string,
  event: {
    eventType: string;
    eventCategory: string;
    actorType: string;
    actorId?: string;
    targetType: string;
    targetId?: string;
    metadata: any;
  },
): Promise<void> {
  const previousEntry = await db
    .select({ currentHash: auditLog.currentHash })
    .from(auditLog)
    .where(eq(auditLog.tenantId, tenantId))
    .orderBy(desc(auditLog.timestamp))
    .limit(1);

  const previousHash = previousEntry[0]?.currentHash || "0".repeat(64);
  const payload = JSON.stringify({
    ...event,
    previousHash,
    timestamp: new Date().toISOString(),
  });
  const currentHash = createHash("sha256").update(payload).digest("hex");

  await db.insert(auditLog).values({
    ...event,
    tenantId,
    previousHash,
    currentHash,
    timestamp: new Date(),
  });
}

export async function registerSCIMRoutes(app: FastifyInstance): Promise<void> {
  const scimAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.code(401).send({
        schemas: [SCIM_SCHEMAS.Error],
        status: 401,
        detail: "Bearer token required",
      });
    }

    const token = authHeader.substring(7);
    const [scimToken] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.scimToken, token))
      .limit(1);

    if (!scimToken) {
      return reply.code(401).send({
        schemas: [SCIM_SCHEMAS.Error],
        status: 401,
        detail: "Invalid SCIM token",
      });
    }

    (request as any).scimTenantId = scimToken.id;
  };

  // Apply SCIM auth only to SCIM routes
  app.get(
    "/scim/v2/Users",
    { preHandler: scimAuth },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request as any).scimTenantId;
      const query = request.query as SCIMSearchRequest;

      const startIndex = Math.max(1, query.startIndex || 1);
      const pageSize = Math.min(100, Math.max(1, query.count || 100));
      const offset = startIndex - 1;

      let whereClause = eq(users.tenantId, tenantId);

      if (query.filter) {
        const filter = parseSCIMFilter(query.filter);
        if (filter.userName) {
          whereClause = and(whereClause, eq(users.email, filter.userName))!;
        }
        if (filter.userName_contains) {
          whereClause = and(
            whereClause,
            ilike(users.email, `%${filter.userName_contains}%`),
          )!;
        }
        if (filter.displayName_contains) {
          whereClause = and(
            whereClause,
            ilike(users.name, `%${filter.displayName_contains}%`),
          )!;
        }
      }

      const [userList, totalResult] = await Promise.all([
        db
          .select()
          .from(users)
          .where(whereClause)
          .limit(pageSize)
          .offset(offset)
          .orderBy(users.createdAt),
        db.select({ count: count() }).from(users).where(whereClause),
      ]);

      const response: SCIMListResponse<SCIMUser> = {
        schemas: [SCIM_SCHEMAS.ListResponse],
        totalResults: totalResult[0]?.count || 0,
        itemsPerPage: userList.length,
        startIndex,
        Resources: userList.map(toSCIMUser),
      };

      return reply.send(response);
    },
  );

  app.post(
    "/scim/v2/Users",
    { preHandler: scimAuth },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request as any).scimTenantId;
      const scimUser = request.body as SCIMUser;

      if (!scimUser.userName) {
        return reply.code(400).send({
          schemas: [SCIM_SCHEMAS.Error],
          status: 400,
          detail: "userName is required",
        });
      }

      const existing = await db
        .select()
        .from(users)
        .where(
          and(eq(users.tenantId, tenantId), eq(users.email, scimUser.userName)),
        )
        .limit(1);

      if (existing[0]) {
        return reply.code(409).send({
          schemas: [SCIM_SCHEMAS.Error],
          status: 409,
          detail: "User already exists",
        });
      }

      const userData = fromSCIMUser(scimUser, tenantId);
      const [newUser] = await db.insert(users).values(userData).returning();

      await logAuditEvent(tenantId, {
        eventType: "user_created",
        eventCategory: "scim",
        actorType: "system",
        targetType: "user",
        targetId: newUser.id,
        metadata: { source: "scim", externalId: scimUser.externalId },
      });

      const createdUser = toSCIMUser(newUser);
      return reply
        .code(201)
        .header("Location", `/scim/v2/Users/${newUser.id}`)
        .send(createdUser);
    },
  );

  app.get(
    "/scim/v2/Users/:id",
    { preHandler: scimAuth },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request as any).scimTenantId;
      const { id } = request.params as { id: string };

      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.tenantId, tenantId), eq(users.id, id)))
        .limit(1);

      if (!user) {
        return reply.code(404).send({
          schemas: [SCIM_SCHEMAS.Error],
          status: 404,
          detail: "User not found",
        });
      }

      return reply.send(toSCIMUser(user));
    },
  );

  app.put(
    "/scim/v2/Users/:id",
    { preHandler: scimAuth },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request as any).scimTenantId;
      const { id } = request.params as { id: string };
      const scimUser = request.body as SCIMUser;

      const [existing] = await db
        .select()
        .from(users)
        .where(and(eq(users.tenantId, tenantId), eq(users.id, id)))
        .limit(1);

      if (!existing) {
        return reply.code(404).send({
          schemas: [SCIM_SCHEMAS.Error],
          status: 404,
          detail: "User not found",
        });
      }

      const userData = fromSCIMUser(scimUser, tenantId);
      delete userData.passwordHash;

      const [updated] = await db
        .update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      await logAuditEvent(tenantId, {
        eventType: "user_updated",
        eventCategory: "scim",
        actorType: "system",
        targetType: "user",
        targetId: id,
        metadata: { source: "scim" },
      });

      return reply.send(toSCIMUser(updated));
    },
  );

  app.patch(
    "/scim/v2/Users/:id",
    { preHandler: scimAuth },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request as any).scimTenantId;
      const { id } = request.params as { id: string };
      const operations = request.body as {
        Operations: Array<{ op: string; path: string; value?: any }>;
      };

      const [existing] = await db
        .select()
        .from(users)
        .where(and(eq(users.tenantId, tenantId), eq(users.id, id)))
        .limit(1);

      if (!existing) {
        return reply.code(404).send({
          schemas: [SCIM_SCHEMAS.Error],
          status: 404,
          detail: "User not found",
        });
      }

      let updatedData = { ...existing };

      for (const op of operations.Operations || []) {
        switch (op.op) {
          case "replace":
            if (op.path === "active") {
              updatedData.activo = op.value;
            } else if (op.path === "userName") {
              updatedData.email = op.value;
            } else if (op.path === "displayName") {
              updatedData.name = op.value;
            } else if (op.path === "name") {
              updatedData.name = op.value.formatted;
            } else if (op.path === "emails") {
              const primaryEmail =
                op.value?.find((e: any) => e.primary) || op.value?.[0];
              if (primaryEmail) updatedData.email = primaryEmail.value;
            }
            break;
          case "add":
            break;
          case "remove":
            if (op.path === "active") {
              updatedData.activo = false;
            }
            break;
        }
      }

      const [updated] = await db
        .update(users)
        .set({ ...updatedData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      await logAuditEvent(tenantId, {
        eventType: "user_patched",
        eventCategory: "scim",
        actorType: "system",
        targetType: "user",
        targetId: id,
        metadata: { source: "scim", operations: operations.Operations },
      });

      return reply.send(toSCIMUser(updated));
    },
  );

  app.delete(
    "/scim/v2/Users/:id",
    { preHandler: scimAuth },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request as any).scimTenantId;
      const { id } = request.params as { id: string };

      const [existing] = await db
        .select()
        .from(users)
        .where(and(eq(users.tenantId, tenantId), eq(users.id, id)))
        .limit(1);

      if (!existing) {
        return reply.code(404).send({
          schemas: [SCIM_SCHEMAS.Error],
          status: 404,
          detail: "User not found",
        });
      }

      await db
        .update(users)
        .set({ activo: false, updatedAt: new Date() })
        .where(eq(users.id, id));

      await logAuditEvent(tenantId, {
        eventType: "user_deactivated",
        eventCategory: "scim",
        actorType: "system",
        targetType: "user",
        targetId: id,
        metadata: { source: "scim" },
      });

      return reply.code(204).send();
    },
  );

  app.get(
    "/scim/v2/Groups",
    { preHandler: scimAuth },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request as any).scimTenantId;
      const query = request.query as SCIMSearchRequest;

      const startIndex = Math.max(1, query.startIndex || 1);
      const pageSize = Math.min(100, Math.max(1, query.count || 100));
      const offset = startIndex - 1;

      let whereClause = eq(tenants.id, tenantId);

      const [groups, totalResult] = await Promise.all([
        db
          .select()
          .from(tenants)
          .where(whereClause)
          .limit(pageSize)
          .offset(offset),
        db.select({ count: count() }).from(tenants).where(whereClause),
      ]);

      const response: SCIMListResponse<SCIMGroup> = {
        schemas: [SCIM_SCHEMAS.ListResponse],
        totalResults: totalResult[0]?.count || 0,
        itemsPerPage: groups.length,
        startIndex,
        Resources: groups.map(toSCIMGroup),
      };

      return reply.send(response);
    },
  );

  app.get(
    "/scim/v2/ServiceProviderConfig",
    { preHandler: scimAuth },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        schemas: [
          "urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig",
        ],
        patch: { supported: true },
        bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
        filter: { supported: true, maxResults: 100 },
        changePassword: { supported: false },
        sort: { supported: false },
        etag: { supported: false },
        authenticationSchemes: [
          {
            name: "Bearer",
            description: "Bearer token authentication",
            specUrl: "https://www.rfc-editor.org/rfc/rfc6750",
            documentationUrl: "",
            type: "oauthbearertoken",
            primary: true,
          },
        ],
      });
    },
  );

  app.get(
    "/scim/v2/ResourceTypes",
    { preHandler: scimAuth },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        schemas: [SCIM_SCHEMAS.ListResponse],
        totalResults: 2,
        itemsPerPage: 2,
        startIndex: 1,
        Resources: [
          {
            schemas: ["urn:ietf:params:scim:schemas:core:2.0:ResourceType"],
            id: "User",
            name: "User",
            endpoint: "/scim/v2/Users",
            description: "User Account",
            schema: SCIM_SCHEMAS.User,
            schemaExtensions: [],
          },
          {
            schemas: ["urn:ietf:params:scim:schemas:core:2.0:ResourceType"],
            id: "Group",
            name: "Group",
            endpoint: "/scim/v2/Groups",
            description: "Group",
            schema: SCIM_SCHEMAS.Group,
            schemaExtensions: [],
          },
        ],
      });
    },
  );

  app.get(
    "/scim/v2/Schemas",
    { preHandler: scimAuth },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        schemas: [SCIM_SCHEMAS.ListResponse],
        totalResults: 2,
        itemsPerPage: 2,
        startIndex: 1,
        Resources: [
          {
            schemas: ["urn:ietf:params:scim:schemas:core:2.0:Schema"],
            id: SCIM_SCHEMAS.User,
            name: "User",
            description: "User Account",
            attributes: [
              {
                name: "userName",
                type: "string",
                multiValued: false,
                required: true,
                caseExact: false,
                mutability: "readWrite",
                returned: "always",
                uniqueness: "server",
              },
              {
                name: "name",
                type: "complex",
                multiValued: false,
                required: false,
                subAttributes: [
                  { name: "formatted", type: "string" },
                  { name: "familyName", type: "string" },
                  { name: "givenName", type: "string" },
                ],
              },
              { name: "displayName", type: "string", multiValued: false },
              {
                name: "emails",
                type: "complex",
                multiValued: true,
                subAttributes: [
                  { name: "value", type: "string" },
                  { name: "type", type: "string" },
                  { name: "primary", type: "boolean" },
                ],
              },
              {
                name: "groups",
                type: "complex",
                multiValued: true,
                subAttributes: [
                  { name: "value", type: "string" },
                  { name: "display", type: "string" },
                ],
              },
              {
                name: "active",
                type: "boolean",
                multiValued: false,
                required: true,
              },
            ],
          },
          {
            schemas: ["urn:ietf:params:scim:schemas:core:2.0:Schema"],
            id: SCIM_SCHEMAS.Group,
            name: "Group",
            description: "Group",
            attributes: [
              {
                name: "displayName",
                type: "string",
                multiValued: false,
                required: true,
              },
              {
                name: "members",
                type: "complex",
                multiValued: true,
                subAttributes: [
                  { name: "value", type: "string" },
                  { name: "display", type: "string" },
                ],
              },
            ],
          },
        ],
      });
    },
  );
}
