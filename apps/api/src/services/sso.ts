import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Strategy as SamlStrategy } from "@node-saml/passport-saml";
import passport from "passport";
import { db } from "../db/index.js";
import { users, tenants, auditLog } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { hashPassword } from "./auth.js";
import { logActivity } from "./automatizaciones.js";

export interface SamlConfig {
  entryPoint: string;
  issuer: string;
  callbackUrl: string;
  cert: string;
  privateCert?: string;
  decryptionPvk?: string;
  identifierFormat?: string;
  attributeConsumingServiceIndex?: string;
  disableRequestedAuthnContext?: boolean;
  authnContext?: string[];
  acceptedClockSkewMs?: number;
  attributeMap?: Record<string, string>;
  logoutUrl?: string;
  logoutCallbackUrl?: string;
}

export interface SSOConfig {
  provider: "saml" | "oidc" | "google" | "microsoft";
  entityId?: string;
  ssoUrl?: string;
  cert?: string;
  privateCert?: string;
  attributeMap?: Record<string, string>;
  oidcConfig?: {
    issuer: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string;
  };
  roleMapping?: Record<string, string>;
  groupMapping?: Record<string, string>;
}

export interface SSOUserProfile {
  subject: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  groups?: string[];
  roles?: string[];
  attributes: Record<string, any>;
}

const samlStrategies = new Map<string, SamlStrategy>();

export function initializePassport(): void {
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user || null);
    } catch (error) {
      done(error, null);
    }
  });
}

export function createSamlStrategy(
  tenantId: string,
  config: SamlConfig,
): SamlStrategy {
  const signonVerify = async (
    profile: any,
    done: (error: Error | null, user?: any) => void,
  ) => {
    try {
      const ssoProfile = mapSamlProfile(profile, config.attributeMap);
      const user = await findOrCreateSSOUser(tenantId, "saml", ssoProfile);
      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  };

  const logoutVerify = async (
    profile: any,
    done: (error: Error | null, user?: any) => void,
  ) => {
    done(null, false);
  };

  const strategy = new SamlStrategy(
    {
      entryPoint: config.entryPoint,
      issuer: config.issuer,
      callbackUrl: config.callbackUrl,
      cert: config.cert,
      identifierFormat:
        config.identifierFormat ||
        "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      acceptedClockSkewMs: config.acceptedClockSkewMs ?? 300000,
      attributeMap: config.attributeMap || {
        email: "email",
        givenName: "firstName",
        surname: "lastName",
        displayName: "name",
        groups: "groups",
        roles: "roles",
      },
      logoutUrl: config.logoutUrl,
      logoutCallbackUrl: config.logoutCallbackUrl,
    } as any,
    signonVerify,
    logoutVerify,
  );

  samlStrategies.set(tenantId, strategy);
  return strategy;
}

export async function getSamlStrategy(
  tenantId: string,
): Promise<SamlStrategy | undefined> {
  return samlStrategies.get(tenantId);
}

export function mapSamlProfile(
  profile: any,
  attributeMap?: Record<string, string>,
): SSOUserProfile {
  const map = attributeMap || {};
  return {
    subject:
      profile.nameID ||
      profile["urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"] ||
      profile.email,
    email: profile[map.email || "email"] || profile.email,
    name: profile[map.displayName || "displayName"] || profile.name,
    firstName: profile[map.givenName || "givenName"] || profile.firstName,
    lastName: profile[map.surname || "surname"] || profile.lastName,
    groups: parseGroups(profile[map.groups || "groups"]),
    roles: parseGroups(profile[map.roles || "roles"]),
    attributes: profile,
  };
}

function parseGroups(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value.split(",").map((g) => g.trim());
    }
  }
  return [];
}

export async function findOrCreateSSOUser(
  tenantId: string,
  provider: "saml" | "oidc" | "google" | "microsoft",
  profile: SSOUserProfile,
): Promise<any> {
  if (!profile.email) {
    throw new Error("Email is required for SSO login");
  }

  const ssoSubject = profile.subject || profile.email;

  let [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, profile.email),
        eq(users.ssoProvider, provider),
        eq(users.ssoSubject, ssoSubject),
      ),
    )
    .limit(1);

  if (!user) {
    [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, profile.email))
      .limit(1);

    if (user) {
      await db
        .update(users)
        .set({
          ssoProvider: provider,
          ssoSubject: ssoSubject,
          ssoAttributes: profile.attributes,
          activo: true,
          tenantId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          email: profile.email,
          passwordHash: randomBytes(32).toString("hex"),
          name: profile.name || profile.email.split("@")[0],
          role: mapRole(provider, profile),
          ssoProvider: provider,
          ssoSubject: ssoSubject,
          ssoAttributes: profile.attributes,
          activo: true,
          tenantId,
        })
        .returning();
      user = newUser;
    }
  }

  return user;
}

function mapRole(provider: string, profile: SSOUserProfile): string {
  const roles = profile.roles || [];
  const groups = profile.groups || [];

  if (
    roles.includes("admin") ||
    groups.includes("admin") ||
    groups.includes("Administrators")
  ) {
    return "admin";
  }
  if (
    roles.includes("manager") ||
    groups.includes("manager") ||
    groups.includes("Managers")
  ) {
    return "manager";
  }
  return "user";
}

export async function registerSamlRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/api/auth/saml/callback/:tenantId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { tenantId } = request.params as { tenantId: string };
      const strategy = await getSamlStrategy(tenantId);

      if (!strategy) {
        return reply
          .code(404)
          .send({ error: "SAML not configured for this tenant" });
      }

      passport.authenticate(
        "saml",
        { session: false },
        async (err: Error | null, user: any) => {
          if (err || !user) {
            return reply.code(401).send({
              error: "SAML authentication failed",
              details: err?.message,
            });
          }

          const token = await generateToken(user);
          await logAuditEvent(tenantId, {
            eventType: "user_sso_login",
            eventCategory: "authentication",
            actorType: "user",
            actorId: user.id,
            targetType: "user",
            targetId: user.id,
            metadata: { provider: "saml" },
          });

          return reply.redirect(`/auth/success?token=${token}`);
        },
      )(request, reply);
    },
  );

  app.get(
    "/api/auth/saml/metadata/:tenantId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { tenantId } = request.params as { tenantId: string };
      const strategy = await getSamlStrategy(tenantId);

      if (!strategy) {
        return reply.code(404).send({ error: "SAML not configured" });
      }

      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);
      const ssoConfig = tenant[0]?.ssoConfig as SSOConfig | undefined;
      const cert = ssoConfig?.cert || "";
      const privateCert = ssoConfig?.privateCert || "";

      const metadata = strategy.generateServiceProviderMetadata(
        privateCert || null,
        cert || null,
      );

      reply.type("application/xml").send(metadata);
    },
  );
}

export async function registerOidcRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/auth/oidc/login/:tenantId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply
        .code(501)
        .send({ error: "OIDC not yet implemented - use SAML for now" });
    },
  );

  app.get(
    "/api/auth/oidc/callback/:tenantId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply
        .code(501)
        .send({ error: "OIDC not yet implemented - use SAML for now" });
    },
  );
}

async function generateToken(user: any): Promise<string> {
  const { generateToken } = await import("./auth.js");
  return generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    v: user.tokenVersion ?? 0,
  });
}

export async function loadTenantSSOConfigs(
  app: FastifyInstance,
): Promise<void> {
  const tenantConfigs = await db
    .select()
    .from(tenants)
    .where(eq(tenants.estado, "activo"));

  for (const tenant of tenantConfigs) {
    if (tenant.ssoConfig) {
      const config = tenant.ssoConfig as SSOConfig;
      if (config.provider === "saml" && config.ssoUrl && config.cert) {
        createSamlStrategy(tenant.id, {
          entryPoint: config.ssoUrl,
          issuer: config.entityId || `crm:${tenant.subdominio}`,
          callbackUrl: `${process.env.API_URL}/api/auth/saml/callback/${tenant.id}`,
          cert: config.cert,
          attributeMap: config.attributeMap,
        });
      }
    }
  }
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
