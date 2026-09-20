import { createHash, createHmac, randomBytes } from 'crypto';
import { db } from '../db/index.js';
import { apiTokens, webhookEndpoints, webhookDeliveries } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';

export const WEBHOOK_EVENTS = [
  'oportunidad.creada',
  'oportunidad.etapa_cambiada',
  'contacto.creado',
  'email.enviado',
  'microsoft.correo_recibido',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function signWebhook(secret: string, body: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

export function verifyWebhookSignature(secret: string, body: string, signature: string): boolean {
  const expected = signWebhook(secret, body);
  if (expected.length !== signature.length) return false;
  return createHash('sha256').update(expected).digest().equals(createHash('sha256').update(signature).digest())
    && expected === signature;
}

// Tokens de API pública: formato crm_<32 bytes base64url>, se guarda solo sha256
export async function createApiToken(userId: string, nombre: string, expiraEn?: Date) {
  const raw = `crm_${randomBytes(32).toString('base64url')}`;
  const tokenHash = createHash('sha256').update(raw).digest('hex');
  const [rec] = await db.insert(apiTokens).values({
    userId,
    nombre,
    tokenHash,
    prefijo: raw.slice(0, 12),
    expiraEn: expiraEn || null,
  }).returning();
  return { token: raw, record: rec };
}

export async function verifyApiToken(raw: string) {
  if (!raw.startsWith('crm_')) return null;
  const tokenHash = createHash('sha256').update(raw).digest('hex');
  const [t] = await db.select().from(apiTokens).where(
    and(eq(apiTokens.tokenHash, tokenHash), eq(apiTokens.activo, true))
  ).limit(1);
  if (!t) return null;
  if (t.expiraEn && new Date() > t.expiraEn) return null;
  await db.update(apiTokens).set({ ultimoUsoEn: new Date() }).where(eq(apiTokens.id, t.id));
  return t;
}

// Emite evento a webhooks suscritos. Nunca lanza (fire-and-forget con log en deliveries).
export async function emitEvent(evento: string, data: Record<string, unknown>): Promise<void> {
  try {
    const endpoints = await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.activo, true));
    const targets = endpoints.filter(e => ((e.eventos as string[]) || []).includes(evento) || ((e.eventos as string[]) || []).includes('*'));
    if (targets.length === 0) return;
    const body = JSON.stringify({ event: evento, at: new Date().toISOString(), data });
    await Promise.all(targets.map(async (ep) => {
      const sig = signWebhook(ep.secret, body);
      let statusCode: number | null = null;
      let ok = false;
      let error: string | null = null;
      for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 10000);
          const res = await fetch(ep.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            'X-CRM-Event': evento,
            'X-CRM-Signature': sig,
            },
            body,
            signal: ctrl.signal,
          });
          clearTimeout(timer);
          statusCode = res.status;
          ok = res.ok;
          if (!res.ok) error = `HTTP ${res.status}`;
        } catch (e: any) {
          error = e?.name === 'AbortError' ? 'timeout 10s' : (e?.message || 'error de red');
        }
        // Reintento una vez (5s) solo ante fallo de red/timeout o 5xx/429
        const retryable = !ok && (statusCode === null || statusCode === 429 || statusCode >= 500);
        if (!ok && retryable && attempt === 1) {
          error += ' (reintentando)';
          await new Promise(r => setTimeout(r, 5000));
        }
      }
      try {
        await db.insert(webhookDeliveries).values({
          endpointId: ep.id, evento, statusCode, ok, error,
        });
        // Retención: últimas 100 entregas por endpoint
        await db.execute(sql`DELETE FROM webhook_deliveries WHERE endpoint_id = ${ep.id} AND id NOT IN (SELECT id FROM webhook_deliveries WHERE endpoint_id = ${ep.id} ORDER BY created_at DESC LIMIT 100)`);
      } catch { /* log no debe romper nada */ }
    }));
  } catch (err) {
    console.error('emitEvent error:', err);
  }
}
