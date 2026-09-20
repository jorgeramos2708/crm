import 'dotenv/config';
import { db, connectDB, closeDB } from './db/index.js';
import { redis, connectRedis, closeRedis } from './services/redis.js';
import { microsoftGraphSubscriptions, contactos } from './db/schema.js';
import { eq, lt, ilike } from 'drizzle-orm';
import { apiTokens, archivos } from './db/schema.js';
import { storage, bucketName } from './services/storage.js';
import { getUserGraphClient, renewUserSubscription } from './services/microsoftGraph.js';
import { logActivity } from './services/automatizaciones.js';
import { emitEvent } from './services/webhooks.js';
import os from 'os';

const STREAM = 'graph:notifications';
const GROUP = 'crm-workers';
const CONSUMER = `${os.hostname()}-${process.pid}`;
const IDEMPOTENCY_TTL_SECONDS = 600;
const RENEW_INTERVAL_MS = 30 * 60 * 1000;
const RENEW_AHEAD_MS = 24 * 60 * 60 * 1000;

let running = true;

async function ensureGroup() {
  try {
    await redis.xgroup('CREATE', STREAM, GROUP, '$', 'MKSTREAM');
    console.log(`👷 Stream group ${GROUP} listo`);
  } catch (err: any) {
    if (!String(err?.message || err).includes('BUSYGROUP')) throw err;
  }
}

async function processNotification(fields: Record<string, string>) {
  const { subscriptionId, changeType, resourceDataId } = fields;
  if (!subscriptionId) return;

  // Idempotencia: Graph reintenta notificaciones; ignorar repetidas 10 min
  const dedupKey = `graph:notif:${subscriptionId}:${resourceDataId || 'noid'}:${changeType || 'nochange'}`;
  let fresh = false;
  try {
    fresh = (await redis.set(dedupKey, '1', 'EX', IDEMPOTENCY_TTL_SECONDS, 'NX')) === 'OK';
  } catch {
    fresh = true; // sin Redis no se puede deducir: procesar
  }
  if (!fresh) {
    console.log(`⏭️ Notificación duplicada ignorada: ${dedupKey}`);
    return;
  }

  const [sub] = await db.select().from(microsoftGraphSubscriptions)
    .where(eq(microsoftGraphSubscriptions.subscriptionId, subscriptionId)).limit(1);
  if (!sub) return;
  const userId = sub.userId;

  // Solo mensajes crean/actualizan timeline; el resto solo se notifica
  if (resourceDataId && (changeType === 'created' || changeType === 'updated')) {
    try {
      const client = await getUserGraphClient(userId);
      if (!client) return;
      const msg: any = await client.api(`/me/messages/${resourceDataId}`)
        .select('id,subject,from,receivedDateTime,bodyPreview').get();
      const fromAddr: string = msg?.from?.emailAddress?.address || '';
      const subject: string = msg?.subject || '(sin asunto)';

      let contactoId: string | undefined;
      if (fromAddr) {
        const [c] = await db.select().from(contactos).where(ilike(contactos.email, fromAddr)).limit(1);
        if (c) {
          contactoId = c.id;
          await logActivity('email_recibido', `Email Outlook: ${subject}`, 'contacto', c.id, userId, {
            via: 'graph-webhook', messageId: msg.id, from: fromAddr,
          });
        }
      }
      await redis.publish(`user:${userId}:events`, JSON.stringify({
        type: 'mail.received', messageId: msg.id, subject, from: fromAddr, contactoId,
      }));
      emitEvent('microsoft.correo_recibido', {
        messageId: msg.id, subject, from: fromAddr, contactoId, userId,
      }).catch(() => {});
    } catch (err) {
      console.error(`Worker: no se pudo obtener mensaje ${resourceDataId}:`, (err as Error)?.message || err);
    }
  } else {
    await redis.publish(`user:${userId}:events`, JSON.stringify({
      type: 'graph.change', changeType, resourceDataId,
    }));
  }
}

async function consumeLoop() {
  while (running) {
    let res: any;
    try {
      res = await redis.xreadgroup('GROUP', GROUP, CONSUMER, 'COUNT', 10, 'BLOCK', 5000, 'STREAMS', STREAM, '>');
    } catch (err) {
      console.error('Worker xreadgroup error:', (err as Error)?.message || err);
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    if (!res) continue;
    for (const [, messages] of res as any[]) {
      for (const [id, fields] of messages as any[]) {
        const obj: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) obj[fields[i]] = fields[i + 1];
        try {
          await processNotification(obj);
        } catch (err) {
          console.error(`Worker: error procesando ${id}:`, (err as Error)?.message || err);
        }
        try { await redis.xack(STREAM, GROUP, id); } catch { /* noop */ }
      }
    }
  }
}

async function renewLoop() {
  while (running) {
    try {
      const soon = new Date(Date.now() + RENEW_AHEAD_MS);
      const expiring = await db.select().from(microsoftGraphSubscriptions)
        .where(lt(microsoftGraphSubscriptions.expiresAt, soon));
      for (const s of expiring) {
        try {
          const ok = await renewUserSubscription(s.subscriptionId);
          console.log(`🔄 Renovación ${s.subscriptionId}: ${ok ? 'ok' : 'falló'}`);
        } catch (err) {
          console.error(`🔄 Renovación ${s.subscriptionId} error:`, (err as Error)?.message || err);
        }
      }
    } catch (err) {
      console.error('Worker renewLoop error:', (err as Error)?.message || err);
    }
    await new Promise(r => setTimeout(r, RENEW_INTERVAL_MS));
  }
}

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

// Limpieza diaria: tokens expirados + objetos huérfanos en MinIO (>1h y sin fila en DB)
async function cleanupLoop() {
  while (running) {
    try {
      const gone = await db.delete(apiTokens).where(lt(apiTokens.expiraEn, new Date()));
      void gone;
      console.log('🧹 Limpieza: tokens expirados eliminados');
    } catch (err) {
      console.error('Worker cleanup tokens error:', (err as Error)?.message || err);
    }
    try {
      const rows = await db.select({ clave: archivos.clave }).from(archivos);
      const validas = new Set(rows.map(r => r.clave));
      const limite = Date.now() - 60 * 60 * 1000;
      const stream = storage().listObjectsV2(bucketName(), '', true);
      for await (const obj of stream as any) {
        try {
          if (!validas.has(obj.name) && new Date(obj.lastModified).getTime() < limite) {
            await storage().removeObject(bucketName(), obj.name);
            console.log(`🧹 Huérfano MinIO eliminado: ${obj.name}`);
          }
        } catch { /* sigue con el siguiente */ }
      }
    } catch (err) {
      console.error('Worker cleanup MinIO error:', (err as Error)?.message || err);
    }
    await new Promise(r => setTimeout(r, CLEANUP_INTERVAL_MS));
  }
}

async function main() {
  await connectDB();
  await connectRedis();
  await ensureGroup();
  console.log(`👷 Worker ${CONSUMER} iniciado (consume + renovador + limpieza)`);
  // Renovación inicial al arrancar (sin bloquear el consumo)
  renewLoop();
  cleanupLoop();
  await consumeLoop();
}

process.on('SIGTERM', async () => { running = false; await closeRedis(); await closeDB(); process.exit(0); });
process.on('SIGINT', async () => { running = false; await closeRedis(); await closeDB(); process.exit(0); });

main().catch(async (err) => {
  console.error('Worker fatal:', err);
  try { await closeRedis(); } catch { /* noop */ }
  try { await closeDB(); } catch { /* noop */ }
  process.exit(1);
});
