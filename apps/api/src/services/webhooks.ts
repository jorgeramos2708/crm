import { createHash, createHmac, randomBytes } from "crypto";
import { db } from "../db/index.js";
import {
  apiTokens,
  webhookEndpoints,
  webhookDeliveries,
  pushSubscriptions,
  ajustes,
} from "../db/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import webpush from "web-push";

export const WEBHOOK_EVENTS = [
  "oportunidad.creada",
  "oportunidad.etapa_cambiada",
  "contacto.creado",
  "email.enviado",
  "microsoft.correo_recibido",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function signWebhook(secret: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

export function verifyWebhookSignature(
  secret: string,
  body: string,
  signature: string,
): boolean {
  const expected = signWebhook(secret, body);
  if (expected.length !== signature.length) return false;
  return (
    createHash("sha256")
      .update(expected)
      .digest()
      .equals(createHash("sha256").update(signature).digest()) &&
    expected === signature
  );
}

// Tokens de API pública: formato crm_<32 bytes base64url>, se guarda solo sha256
export async function createApiToken(
  userId: string,
  nombre: string,
  expiraEn?: Date,
) {
  const raw = `crm_${randomBytes(32).toString("base64url")}`;
  const tokenHash = createHash("sha256").update(raw).digest("hex");
  const [rec] = await db
    .insert(apiTokens)
    .values({
      userId,
      nombre,
      tokenHash,
      prefijo: raw.slice(0, 12),
      expiraEn: expiraEn || null,
    })
    .returning();
  return { token: raw, record: rec };
}

export async function verifyApiToken(raw: string) {
  if (!raw.startsWith("crm_")) return null;
  const tokenHash = createHash("sha256").update(raw).digest("hex");
  const [t] = await db
    .select()
    .from(apiTokens)
    .where(and(eq(apiTokens.tokenHash, tokenHash), eq(apiTokens.activo, true)))
    .limit(1);
  if (!t) return null;
  if (t.expiraEn && new Date() > t.expiraEn) return null;
  await db
    .update(apiTokens)
    .set({ ultimoUsoEn: new Date() })
    .where(eq(apiTokens.id, t.id));
  return t;
}

// Emite evento a webhooks suscritos. Nunca lanza (fire-and-forget con log en deliveries).
export async function emitEvent(
  evento: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const endpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.activo, true));
    const targets = endpoints.filter(
      (e) =>
        ((e.eventos as string[]) || []).includes(evento) ||
        ((e.eventos as string[]) || []).includes("*"),
    );
    if (targets.length === 0) return;
    const body = JSON.stringify({
      event: evento,
      at: new Date().toISOString(),
      data,
    });
    await Promise.all(
      targets.map(async (ep) => {
        const sig = signWebhook(ep.secret, body);
        let statusCode: number | null = null;
        let ok = false;
        let error: string | null = null;
        for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
          try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 10000);
            const res = await fetch(ep.url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CRM-Event": evento,
                "X-CRM-Signature": sig,
              },
              body,
              signal: ctrl.signal,
            });
            clearTimeout(timer);
            statusCode = res.status;
            ok = res.ok;
            if (!res.ok) error = `HTTP ${res.status}`;
          } catch (e: any) {
            error =
              e?.name === "AbortError"
                ? "timeout 10s"
                : e?.message || "error de red";
          }
          // Reintento una vez (5s) solo ante fallo de red/timeout o 5xx/429
          const retryable =
            !ok &&
            (statusCode === null || statusCode === 429 || statusCode >= 500);
          if (!ok && retryable && attempt === 1) {
            error += " (reintentando)";
            await new Promise((r) => setTimeout(r, 5000));
          }
        }
        try {
          await db.insert(webhookDeliveries).values({
            endpointId: ep.id,
            evento,
            statusCode,
            ok,
            error,
          });
          // Retención: últimas 100 entregas por endpoint
          await db.execute(
            sql`DELETE FROM webhook_deliveries WHERE endpoint_id = ${ep.id} AND id NOT IN (SELECT id FROM webhook_deliveries WHERE endpoint_id = ${ep.id} ORDER BY created_at DESC LIMIT 100)`,
          );
        } catch {
          /* log no debe romper nada */
        }
      }),
    );
  } catch (err) {
    console.error("emitEvent error:", err);
  }
}

// Claves VAPID: ENV manda; si no, las persistidas en ajustes (las genera /api/push).
// Antes se usaban claves efímeras en memoria que rotaban en cada restart.
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:admin@crm.example.com";
let persistedVapid: { publicKey: string; privateKey: string } | null = null;

async function resolveVapidKeys(): Promise<{
  publicKey: string;
  privateKey: string;
} | null> {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
  }
  if (persistedVapid) return persistedVapid;
  try {
    const { inArray } = await import("drizzle-orm");
    const rows = await db
      .select()
      .from(ajustes)
      .where(inArray(ajustes.clave, ["vapid_public", "vapid_private"]));
    const map: Record<string, string> = {};
    for (const r of rows) {
      if (typeof (r as any).valor === "string")
        map[(r as any).clave] = (r as any).valor;
    }
    if (map.vapid_public && map.vapid_private) {
      persistedVapid = {
        publicKey: map.vapid_public,
        privateKey: map.vapid_private,
      };
      return persistedVapid;
    }
  } catch {
    /* sin claves persistidas */
  }
  return null;
}

export async function sendPushNotification(data: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
}): Promise<{ sent: number; failed: number }> {
  const vapid = await resolveVapidKeys();
  if (!vapid) {
    console.warn("VAPID keys not configured, skipping push notification");
    return { sent: 0, failed: 0 };
  }
  webpush.setVapidDetails(VAPID_SUBJECT, vapid.publicKey, vapid.privateKey);

  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, data.userId));

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  const payload = JSON.stringify({
    title: data.title,
    body: data.body,
    data: data.data || {},
    icon: data.icon || "/icon.svg",
    badge: data.badge || "/icon.svg",
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload,
        {
          vapidDetails: {
            subject: VAPID_SUBJECT,
            publicKey: vapid.publicKey,
            privateKey: vapid.privateKey,
          },
        },
      );
      sent++;
    } catch (error: unknown) {
      console.error("Failed to send push notification:", error);
      failed++;

      // If subscription is invalid/expired, remove it
      const err = error as { statusCode?: number };
      if (err.statusCode === 410 || err.statusCode === 404) {
        const { pushSubscriptions } = await import("../db/schema.js");
        const { db } = await import("../db/index.js");
        const { eq } = await import("drizzle-orm");

        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, sub.endpoint));
      }
    }
  }

  return { sent, failed };
}

export async function sendPushNotificationToAll(data: {
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<{ sent: number; failed: number }> {
  const vapidAll = await resolveVapidKeys();
  if (!vapidAll) {
    console.warn("VAPID keys not configured, skipping push notification");
    return { sent: 0, failed: 0 };
  }
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    vapidAll.publicKey,
    vapidAll.privateKey,
  );

  const subscriptions = await db.select().from(pushSubscriptions);

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  const payload = JSON.stringify({
    title: data.title,
    body: data.body,
    data: data.data || {},
    icon: "/icon.svg",
    badge: "/icon.svg",
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload,
        {
          vapidDetails: {
            subject: VAPID_SUBJECT,
            publicKey: vapidAll.publicKey,
            privateKey: vapidAll.privateKey,
          },
        },
      );
      sent++;
    } catch (error: unknown) {
      console.error("Failed to send push notification:", error);
      failed++;

      const err = error as { statusCode?: number };
      if (err.statusCode === 410 || err.statusCode === 404) {
        const { pushSubscriptions } = await import("../db/schema.js");
        const { db } = await import("../db/index.js");
        const { eq } = await import("drizzle-orm");

        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, sub.endpoint));
      }
    }
  }

  return { sent, failed };
}
