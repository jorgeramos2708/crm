import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { redis } from '../services/redis.js';
import { env } from '../config.js';
import { users, pipelines, pipelineStages, oportunidades, contactos, companies, contactCompanies, automatizaciones, emailTemplates, emailCampaigns, activities, contactLists, contactListMembers, emailTracking, emailSubscriptions, microsoftGraphTokens, microsoftGraphSubscriptions, microsoftConfig, apiTokens, webhookEndpoints, webhookDeliveries, customFields, tareas, archivos, googleConfig, googleTokens, equipos, equipoMiembros, vistasGuardadas, productos, presupuestos, permisos, ajustes } from '../db/schema.js';
import { eq, desc, asc, and, or, ilike, count, sql, inArray } from 'drizzle-orm';
import { hashPassword, verifyPassword, generateToken, setAuthCookie, clearAuthCookie } from '../services/auth.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { processAutomatizaciones, renderTemplate, sendEmail, logActivity } from '../services/automatizaciones.js';
import { encrypt } from '../services/crypto.js';
import { parseCsv, toCsv } from '../services/csv.js';
import { WEBHOOK_EVENTS, createApiToken, emitEvent } from '../services/webhooks.js';
import { ENTIDADES, TIPOS, getActiveFields, sanitizeCustom } from '../services/customFields.js';
import { MODULOS, getPermisosMap, tienePermiso } from '../services/permisos.js';
import type { Accion } from '../services/permisos.js';
import { storage, bucketName } from '../services/storage.js';
import {
  GOOGLE_SCOPES, getGoogleConfig, buildGoogleState, parseGoogleState, getGoogleAuthUrl,
  exchangeGoogleCode, storeGoogleTokens, getGmailMessages, sendGmail, getGoogleProfile, getGoogleCalendar,
} from '../services/google.js';
import { getUserCalendar } from '../services/microsoftGraph.js';
import {
  getAuthUrl,
  buildAuthState,
  parseAuthState,
  getGlobalConfig,
  storeUserTokens,
  sendEmailViaGraph,
  getUserEmails,
  createUserSubscription,
  renewUserSubscription,
  deleteUserSubscription,
  getUserProfile,
  exchangeCodeForTokens
} from '../services/microsoftGraph.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      name: string;
    };
  }
}

// Type definitions for route parameters
interface PipelineParams {
  id: string;
}

interface PipelineStageParams {
  id: string;
}

interface OportunidadParams {
  id: string;
}

interface ContactoParams {
  id: string;
}

interface CompanyParams {
  id: string;
}

interface CompanyContactParams {
  id: string;
  contactoId: string;
}

interface CompaniesQuery {
  limit?: string;
  offset?: string;
  q?: string;
  sortBy?: string;
  sortDir?: string;
}

// El frontend reenvía el objeto completo (incluye id/createdAt/updatedAt como texto).
// Drizzle exige Date en timestamp: se depuran antes de actualizar.
function stripReadonly<T extends Record<string, any>>(body: T): Omit<T, 'id' | 'createdAt' | 'updatedAt'> {
  const { id, createdAt, updatedAt, ...rest } = body;
  void id; void createdAt; void updatedAt;
  return rest;
}

interface AutomatizacionParams {
  id: string;
}

interface EmailTemplateParams {
  id: string;
}

interface EmailCampaignParams {
  id: string;
  campaignId: string;
}

interface EmailSubscriptionParams {
  id: string;
  token: string;
}

interface ContactListParams {
  id: string;
}

interface OportunidadesQuery {
  limit?: string;
  offset?: string;
  q?: string;
  stageId?: string;
  pipelineId?: string;
  sortBy?: string;
  sortDir?: string;
  alcance?: string;
}

interface ContactosQuery {
  limit?: string;
  offset?: string;
  q?: string;
  sortBy?: string;
  sortDir?: string;
}

interface CreateOportunidadBody {
  nombre: string;
  descripcion?: string;
  pipelineId: string;
  stageId: string;
  contactoId?: string;
  importe?: number;
  probabilidad?: number;
  fechaCierreEstimada?: string;
  propietarioId?: string;
}

interface UpdateOportunidadBody {
  nombre?: string;
  descripcion?: string;
  pipelineId?: string;
  stageId?: string;
  contactoId?: string;
  importe?: number;
  probabilidad?: number;
  fechaCierreEstimada?: string;
  propietarioId?: string;
}

interface CreateContactoBody {
  nombre: string;
  email?: string;
  telefono?: string;
  empresa?: string;
  cargo?: string;
}

interface CreatePipelineBody {
  nombre: string;
  descripcion?: string;
}

interface CreatePipelineStageBody {
  pipelineId: string;
  nombre: string;
  color?: string;
  orden?: number;
  esInicial?: boolean;
  esFinal?: boolean;
}

interface CreateAutomatizacionBody {
  nombre: string;
  descripcion?: string;
  evento: string;
  condiciones: unknown[];
  acciones: unknown[];
  activo?: boolean;
}

interface CreateEmailTemplateBody {
  nombre: string;
  asunto: string;
  contenidoHtml: string;
  contenidoTexto?: string;
  variables?: string[];
}

interface CreateEmailCampaignBody {
  nombre: string;
  templateId: string;
  remitenteNombre: string;
  remitenteEmail: string;
  asunto: string;
  estado?: string;
  programadaPara?: string;
}

const TEMA_DEFAULT = { fondo: '#faf9f7', panel: '#f1eee7' };

export async function registerAuthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Config pública del despliegue (sin secretos): moneda USD/MXN
  app.get('/api/config', async () => ({ currency: env.CURRENCY }));

  // Marca del despliegue (personalización): pública en lectura, solo admin escribe
  const MARCA_CLAVES = ['marca_nombre', 'marca_color', 'marca_logo', 'marca_fondo', 'marca_tema'] as const;
  app.get('/api/ajustes/marca', async () => {
    const rows = await db.select().from(ajustes).where(
      or(...MARCA_CLAVES.map(c => eq(ajustes.clave, c)))
    );
    const map: Record<string, any> = {};
    for (const r of rows) map[r.clave] = r.valor;
    const tema = (map.marca_tema && typeof map.marca_tema === 'object' ? map.marca_tema : {}) as Record<string, string>;
    return {
      nombre: typeof map.marca_nombre === 'string' ? map.marca_nombre : 'CRM',
      color: typeof map.marca_color === 'string' ? map.marca_color : '',
      logo: typeof map.marca_logo === 'string' ? map.marca_logo : '',
      fondo: typeof map.marca_fondo === 'string' ? map.marca_fondo : '',
      tema: {
        fondo: /^#[0-9a-fA-F]{6}$/.test(tema.fondo || '') ? tema.fondo : TEMA_DEFAULT.fondo,
        panel: /^#[0-9a-fA-F]{6}$/.test(tema.panel || '') ? tema.panel : TEMA_DEFAULT.panel,
      },
    };
  });

  app.put('/api/ajustes/marca', { preHandler: requireRole('admin') }, async (req, res) => {
    const body = req.body as { nombre?: string; color?: string; logo?: string | null; fondo?: string | null; tema?: { fondo?: string; panel?: string } };
    const out: Record<string, string> = {};
    if (body.nombre !== undefined) {
      const nombre = String(body.nombre).slice(0, 60).trim() || 'CRM';
      await db.insert(ajustes).values({ clave: 'marca_nombre', valor: nombre, updatedAt: new Date() })
        .onConflictDoUpdate({ target: [ajustes.clave], set: { valor: nombre, updatedAt: new Date() } });
      out.nombre = nombre;
    }
    if (body.color !== undefined) {
      const color = /^#[0-9a-fA-F]{6}$/.test(String(body.color)) ? String(body.color) : '';
      await db.insert(ajustes).values({ clave: 'marca_color', valor: color, updatedAt: new Date() })
        .onConflictDoUpdate({ target: [ajustes.clave], set: { valor: color, updatedAt: new Date() } });
      out.color = color;
    }
    if (body.logo !== undefined) {
      const logo = body.logo && String(body.logo).startsWith('data:image/') && String(body.logo).length <= 500000
        ? String(body.logo) : '';
      await db.insert(ajustes).values({ clave: 'marca_logo', valor: logo, updatedAt: new Date() })
        .onConflictDoUpdate({ target: [ajustes.clave], set: { valor: logo, updatedAt: new Date() } });
      out.logo = logo ? 'ok' : '';
    }
    if (body.fondo !== undefined) {
      const f = String(body.fondo || '');
      const fondo = f === '' || /^#[0-9a-fA-F]{6}$/.test(f) || (f.startsWith('data:image/') && f.length <= 1000000)
        ? f : '';
      await db.insert(ajustes).values({ clave: 'marca_fondo', valor: fondo, updatedAt: new Date() })
        .onConflictDoUpdate({ target: [ajustes.clave], set: { valor: fondo, updatedAt: new Date() } });
      out.fondo = fondo ? 'ok' : '';
    }
    if (body.tema !== undefined && typeof body.tema === 'object') {
      const esHex = (v: unknown) => /^#[0-9a-fA-F]{6}$/.test(String(v || ''));
      const tema = {
        fondo: esHex(body.tema?.fondo) ? String(body.tema.fondo) : TEMA_DEFAULT.fondo,
        panel: esHex(body.tema?.panel) ? String(body.tema.panel) : TEMA_DEFAULT.panel,
      };
      await db.insert(ajustes).values({ clave: 'marca_tema', valor: tema as any, updatedAt: new Date() })
        .onConflictDoUpdate({ target: [ajustes.clave], set: { valor: tema as any, updatedAt: new Date() } });
      out.tema = 'ok';
    }
    return out;
  });

  // RBAC por módulo (rwx): una sola tabla de reglas. Admin pasa siempre.
  // Mapea método+ruta -> (modulo, accion). Las rutas no listadas conservan su auth previa.
  const PERM_RULES: Array<{ method: string; re: RegExp; modulo: string; accion: Accion }> = [
    { method: 'GET', re: /^\/api\/contactos(\/|$)/, modulo: 'contactos', accion: 'r' },
    { method: 'POST', re: /^\/api\/contactos(\/|$)/, modulo: 'contactos', accion: 'w' },
    { method: 'PUT', re: /^\/api\/contactos\//, modulo: 'contactos', accion: 'w' },
    { method: 'DELETE', re: /^\/api\/contactos\//, modulo: 'contactos', accion: 'x' },
    { method: 'GET', re: /^\/api\/companies(\/|$)/, modulo: 'empresas', accion: 'r' },
    { method: 'POST', re: /^\/api\/companies(\/|$)/, modulo: 'empresas', accion: 'w' },
    { method: 'PUT', re: /^\/api\/companies\//, modulo: 'empresas', accion: 'w' },
    { method: 'DELETE', re: /^\/api\/companies\/[^/]+\/contacts\//, modulo: 'empresas', accion: 'w' },
    { method: 'DELETE', re: /^\/api\/companies\//, modulo: 'empresas', accion: 'x' },
    { method: 'GET', re: /^\/api\/oportunidades(\/|$)/, modulo: 'oportunidades', accion: 'r' },
    { method: 'POST', re: /^\/api\/oportunidades(\/|$)/, modulo: 'oportunidades', accion: 'w' },
    { method: 'PUT', re: /^\/api\/oportunidades\//, modulo: 'oportunidades', accion: 'w' },
    { method: 'DELETE', re: /^\/api\/oportunidades\//, modulo: 'oportunidades', accion: 'x' },
    { method: 'GET', re: /^\/api\/productos(\/|$)/, modulo: 'productos', accion: 'r' },
    { method: 'POST', re: /^\/api\/productos(\/|$)/, modulo: 'productos', accion: 'w' },
    { method: 'PUT', re: /^\/api\/productos\//, modulo: 'productos', accion: 'w' },
    { method: 'DELETE', re: /^\/api\/productos\//, modulo: 'productos', accion: 'x' },
    { method: 'GET', re: /^\/api\/presupuestos(\/|$)/, modulo: 'presupuestos', accion: 'r' },
    { method: 'POST', re: /^\/api\/presupuestos(\/|$)/, modulo: 'presupuestos', accion: 'w' },
    { method: 'PUT', re: /^\/api\/presupuestos\//, modulo: 'presupuestos', accion: 'w' },
    { method: 'DELETE', re: /^\/api\/presupuestos\//, modulo: 'presupuestos', accion: 'x' },
    { method: 'GET', re: /^\/api\/tareas(\/|$)/, modulo: 'tareas', accion: 'r' },
    { method: 'POST', re: /^\/api\/tareas(\/|$)/, modulo: 'tareas', accion: 'w' },
    { method: 'PUT', re: /^\/api\/tareas\//, modulo: 'tareas', accion: 'w' },
    { method: 'DELETE', re: /^\/api\/tareas\//, modulo: 'tareas', accion: 'x' },
    { method: 'GET', re: /^\/api\/reportes\//, modulo: 'reportes', accion: 'r' },
    { method: 'GET', re: /^\/api\/email-campaigns(\/|$)/, modulo: 'campañas', accion: 'r' },
    { method: 'POST', re: /^\/api\/email-campaigns(\/|$)/, modulo: 'campañas', accion: 'w' },
    { method: 'PUT', re: /^\/api\/email-campaigns\//, modulo: 'campañas', accion: 'w' },
    { method: 'DELETE', re: /^\/api\/email-campaigns\//, modulo: 'campañas', accion: 'x' },
    { method: 'GET', re: /^\/api\/email-templates(\/|$)/, modulo: 'plantillas', accion: 'r' },
    { method: 'POST', re: /^\/api\/email-templates(\/|$)/, modulo: 'plantillas', accion: 'w' },
    { method: 'PUT', re: /^\/api\/email-templates\//, modulo: 'plantillas', accion: 'w' },
    { method: 'DELETE', re: /^\/api\/email-templates\//, modulo: 'plantillas', accion: 'x' },
    { method: 'GET', re: /^\/api\/contact-lists(\/|$)/, modulo: 'listas', accion: 'r' },
    { method: 'POST', re: /^\/api\/contact-lists(\/|$)/, modulo: 'listas', accion: 'w' },
    { method: 'DELETE', re: /^\/api\/contact-lists\//, modulo: 'listas', accion: 'x' },
    { method: 'GET', re: /^\/api\/automatizaciones(\/|$)/, modulo: 'automatizaciones', accion: 'r' },
    { method: 'POST', re: /^\/api\/automatizaciones(\/|$)/, modulo: 'automatizaciones', accion: 'w' },
    { method: 'PUT', re: /^\/api\/automatizaciones\//, modulo: 'automatizaciones', accion: 'w' },
    { method: 'DELETE', re: /^\/api\/automatizaciones\//, modulo: 'automatizaciones', accion: 'x' },
    { method: 'GET', re: /^\/api\/activities(\/|$)/, modulo: 'actividades', accion: 'r' },
    { method: 'GET', re: /^\/api\/(microsoft|google)\/(emails|profile|subscriptions|status)(\/|$)/, modulo: 'correos', accion: 'r' },
    { method: 'POST', re: /^\/api\/(microsoft|google)\/send(\/|$)/, modulo: 'correos', accion: 'w' },
    { method: 'POST', re: /^\/api\/microsoft\/vincular(\/|$)/, modulo: 'correos', accion: 'w' },
    { method: 'GET', re: /^\/api\/calendario(\/|$)/, modulo: 'calendario', accion: 'r' },
  ];

  app.addHook('preHandler', async (req, reply) => {
    const path = req.url.split('?')[0];
    const rule = PERM_RULES.find(r => r.method === req.method && r.re.test(path));
    if (!rule) return;
    await authMiddleware(req as any, reply as any);
    if (reply.sent) return;
    const u = (req as any).user;
    const ok = await tienePermiso(u.id, u.role, rule.modulo, rule.accion);
    if (!ok) {
      return reply.code(403).send({ error: 'Sin permiso para este módulo', code: 'FORBIDDEN' });
    }
  });

  app.post('/api/auth/login', {
    // Anti fuerza bruta (además del límite estricto en nginx)
    config: { rateLimit: { max: 15, timeWindow: '1 minute' } },
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.code(401).send({ error: 'Credenciales inválidas', code: 'INVALID_CREDENTIALS' });
    }
    if (!user.activo) {
      return res.code(403).send({ error: 'Usuario inactivo', code: 'USER_INACTIVE' });
    }
    
    const token = generateToken({ 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      name: user.name
    });
    
    setAuthCookie(res, token);

    const { passwordHash, ...userSafe } = user;
    const permisosMap = await getPermisosMap(user.id, user.role);
    return { user: { ...userSafe, permisos: permisosMap } };
  });

  app.post('/api/auth/logout', async (req, res) => {
    clearAuthCookie(res);
    return { ok: true };
  });

  app.get('/api/auth/me', { preHandler: authMiddleware }, async (req) => {
    const permisosMap = await getPermisosMap(req.user!.id, req.user!.role);
    return { user: { ...req.user, permisos: permisosMap } };
  });

  // Public tracking endpoints (no auth required)
  app.get('/api/track/open/:trackingId', async (req, res) => {
    await db.insert(emailTracking).values({
      campaignId: (req as any).params.trackingId,
      tipo: 'open',
      metadata: { userAgent: req.headers['user-agent'], ip: req.ip }
    });
    res.header('Content-Type', 'image/gif');
    return Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  });

  app.get('/api/track/click/:trackingId', async (req: FastifyRequest<{ Querystring: { url?: string } }>, res) => {
    const { url } = req.query;
    await db.insert(emailTracking).values({
      campaignId: (req as any).params.trackingId,
      tipo: 'click',
      metadata: { url, userAgent: req.headers['user-agent'], ip: req.ip }
    });
    return res.redirect(url || '/');
  });

  app.get('/api/track/unsubscribe/:trackingId', async (req, res) => {
    await db.insert(emailTracking).values({
      campaignId: (req as any).params.trackingId,
      tipo: 'unsubscribe',
      metadata: { userAgent: req.headers['user-agent'], ip: req.ip }
    });
    return { ok: true, message: 'Te has dado de baja correctamente' };
  });

  // Public email subscription endpoints (no auth required)
  app.get('/api/email-subscriptions/confirm/:token', async (req: FastifyRequest<{ Params: EmailSubscriptionParams }>, res) => {
    const [sub] = await db.select().from(emailSubscriptions).where(eq(emailSubscriptions.token, req.params.token)).limit(1);
    if (!sub) return res.code(404).send({ error: 'Token inválido' });
    if (sub.estado === 'confirmado') return res.code(400).send({ error: 'Ya confirmado' });
    if (sub.estado === 'cancelado') return res.code(400).send({ error: 'Suscripción cancelada' });
    await db.update(emailSubscriptions).set({ estado: 'confirmado', confirmadoEn: new Date() }).where(eq(emailSubscriptions.id, sub.id));
    return { ok: true, message: 'Suscripción confirmada correctamente' };
  });

  app.get('/api/email-subscriptions/unsubscribe/:token', async (req: FastifyRequest<{ Params: EmailSubscriptionParams }>, res) => {
    const [sub] = await db.select().from(emailSubscriptions).where(eq(emailSubscriptions.token, req.params.token)).limit(1);
    if (!sub) return res.code(404).send({ error: 'Token inválido' });
    await db.update(emailSubscriptions).set({ estado: 'cancelado', canceladoEn: new Date() }).where(eq(emailSubscriptions.id, sub.id));
    return { ok: true, message: 'Te has dado de baja correctamente' };
  });

  app.get('/api/email-subscriptions', async (req: FastifyRequest<{ Querystring: { contactoId?: string; listaId?: string; estado?: string } }>, res) => {
    const { contactoId, listaId, estado } = req.query;
    const conditions = [];
    if (contactoId) conditions.push(eq(emailSubscriptions.contactoId, contactoId));
    if (listaId) conditions.push(eq(emailSubscriptions.listaId, listaId));
    if (estado) conditions.push(eq(emailSubscriptions.estado, estado));
    return db.select().from(emailSubscriptions).where(and(...conditions)).orderBy(desc(emailSubscriptions.createdAt));
  });

  // Webhook receptor de Microsoft Graph (público: lo llama Microsoft, no el usuario).
  // Handshake: Graph envía ?validationToken y espera el token en texto plano.
  // Notificaciones: JSON { value: [...] } -> se encolan en Redis y se responde 202 de inmediato.
  app.get('/api/graph/notify', async (req: FastifyRequest<{ Querystring: { validationToken?: string } }>, res) => {
    if (req.query.validationToken) {
      res.header('Content-Type', 'text/plain');
      return res.send(req.query.validationToken);
    }
    return res.code(400).send({ error: 'Sin validationToken' });
  });

  app.post('/api/graph/notify', async (req: FastifyRequest<{ Querystring: { validationToken?: string } }>, res) => {
    if (req.query.validationToken) {
      res.header('Content-Type', 'text/plain');
      return res.send(req.query.validationToken);
    }
    const body = req.body as { value?: Array<{ subscriptionId?: string; changeType?: string; resource?: string; clientState?: string; resourceData?: { id?: string } }> };
    for (const n of body?.value || []) {
      if (!n.subscriptionId) continue;
      const [sub] = await db.select().from(microsoftGraphSubscriptions)
        .where(eq(microsoftGraphSubscriptions.subscriptionId, n.subscriptionId)).limit(1);
      if (!sub) continue; // suscripción desconocida: ack silencioso
      if (sub.clientState && n.clientState && sub.clientState !== n.clientState) {
        console.warn(`Graph notify clientState inválido para ${n.subscriptionId}`);
        continue;
      }
      await redis.xadd('graph:notifications', 'MAXLEN', '~', 10000, '*',
        'subscriptionId', n.subscriptionId,
        'changeType', n.changeType || '',
        'resource', n.resource || '',
        'resourceDataId', n.resourceData?.id || '',
        'clientState', n.clientState || '');
    }
    return res.code(202).send({ ok: true });
  });

  // Login SSO (sin sesión previa): el state lleva un nonce guardado 10 min en Redis.
  // Solo entran usuarios ya creados por el admin y activos (match por email).
  app.get('/api/auth/:proveedor/login', async (req, res) => {
    const proveedor = (req.params as any).proveedor as string;
    if (proveedor !== 'google' && proveedor !== 'microsoft') {
      return res.code(404).send({ error: 'Proveedor no soportado' });
    }
    const { randomUUID: uuid } = await import('crypto');
    const nonce = uuid();
    try {
      await redis.set(`sso:login:${nonce}`, proveedor, 'EX', 600);
    } catch {
      return res.code(500).send({ error: 'No se pudo iniciar el login' });
    }
    const state = Buffer.from(JSON.stringify({ purpose: 'login', nonce })).toString('base64url');
    const url = proveedor === 'google' ? await getGoogleAuthUrl(state) : await getAuthUrl(state);
    const FE = process.env.FRONTEND_URL || 'http://localhost:8081';
    if (!url) return res.redirect(`${FE}/login?error=sso_no_configurado`);
    res.redirect(url);
  });

  app.get('/api/auth/:proveedor/login/callback', async (req: FastifyRequest<{ Querystring: { code?: string; state?: string; error?: string } }>, res) => {
    const FE = process.env.FRONTEND_URL || 'http://localhost:8081';
    const proveedor = (req.params as any).proveedor as string;
    const { code, state, error } = req.query;
    const fail = (code: string) => res.redirect(`${FE}/login?error=${code}`);
    if (proveedor !== 'google' && proveedor !== 'microsoft') return res.code(404).send({ error: 'Proveedor no soportado' });
    if (error) return fail('sso_cancelado');
    if (!code || !state) return fail('sso_invalido');
    let parsed: any = null;
    try {
      parsed = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch { return fail('sso_invalido'); }
    if (parsed?.purpose !== 'login' || !parsed?.nonce) return fail('sso_invalido');
    let saved: string | null = null;
    try {
      saved = await redis.get(`sso:login:${parsed.nonce}`);
      if (saved) await redis.del(`sso:login:${parsed.nonce}`);
    } catch { /* sin Redis no hay login SSO */ }
    if (saved !== proveedor) return fail('sso_expirado');
    try {
      let email = '';
      if (proveedor === 'google') {
        const cfg = await getGoogleConfig();
        if (!cfg) return fail('sso_no_configurado');
        const tokens = await exchangeGoogleCode(cfg, code);
        // token temporal solo para identificar al usuario (no se guarda)
        const me: any = await (async () => {
          const r = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });
          if (!r.ok) throw new Error('userinfo');
          return r.json();
        })();
        email = me.email || '';
      } else {
        const cfg = await getGlobalConfig();
        if (!cfg) return fail('sso_no_configurado');
        const tokens = await exchangeCodeForTokens(cfg, code);
        const me: any = await (async () => {
          const r = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });
          if (!r.ok) throw new Error('graph me');
          return r.json();
        })();
        email = me.mail || me.userPrincipalName || '';
      }
      if (!email) return fail('sso_sin_email');
      const [user] = await db.select().from(users)
        .where(sql`lower(${users.email}) = lower(${email})`).limit(1);
      if (!user) return fail('sso_sin_cuenta');
      if (!user.activo) return fail('sso_inactivo');
      const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });
      setAuthCookie(res, token);
      return res.redirect(`${FE}/`);
    } catch (err) {
      console.error('SSO login error:', err);
      return fail('sso_error');
    }
  });

  // Microsoft Graph OAuth endpoints
  app.get('/api/auth/microsoft/connect', { preHandler: authMiddleware }, async (req, res) => {
    const state = buildAuthState(req.user!.id);
    const authUrl = await getAuthUrl(state);
    if (!authUrl) {
      return res.code(400).send({ error: 'Microsoft Graph no configurado' });
    }
    res.redirect(authUrl);
  });

  app.get('/api/auth/microsoft/callback', async (req: FastifyRequest<{ Querystring: { code?: string; state?: string; error?: string } }>, res) => {
    const { code, error, state } = req.query;
    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8081'}/settings?microsoft_error=${error}`);
    }
    if (!code) {
      return res.code(400).send({ error: 'Código de autorización requerido' });
    }
    if (!state) {
      return res.code(400).send({ error: 'Estado requerido' });
    }
    
    const parsedState = parseAuthState(state);
    if (!parsedState?.userId) {
      return res.code(400).send({ error: 'Estado inválido' });
    }

    try {
      const config = await getGlobalConfig();
      if (!config) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8081'}/settings?microsoft_error=config_not_found`);
      }
      const tokens = await exchangeCodeForTokens(config, code);
      await storeUserTokens(parsedState.userId, tokens);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8081'}/settings?microsoft_connected=true`);
    } catch (err) {
      console.error('Microsoft OAuth error:', err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8081'}/settings?microsoft_error=token_exchange_failed`);
    }
  });

  // Microsoft Graph endpoints (auth required)
  app.register(async (app) => {
    app.addHook('preHandler', authMiddleware);

    app.get('/api/microsoft/profile', async (req) => {
      const profile = await getUserProfile(req.user!.id);
      if (!profile) return { error: 'No conectado a Microsoft' };
      return profile;
    });

    app.post('/api/microsoft/send', async (req: FastifyRequest<{ Body: { to: string[]; subject: string; htmlBody: string; textBody?: string; contactoId?: string; oportunidadId?: string } }>, res) => {
      try {
        const { contactoId, oportunidadId, ...email } = req.body;
        await sendEmailViaGraph(req.user!.id, email);
        if (contactoId) {
          await logActivity('email_sent', `Email Outlook: ${email.subject}`, 'contacto', contactoId, req.user!.id, { via: 'microsoft-graph', to: email.to });
        }
        if (oportunidadId) {
          await logActivity('email_sent', `Email Outlook: ${email.subject}`, 'oportunidad', oportunidadId, req.user!.id, { via: 'microsoft-graph', to: email.to });
        }
        emitEvent('email.enviado', { subject: email.subject, to: email.to, contactoId, oportunidadId }).catch(() => {});
        return { ok: true };
      } catch (err) {
        console.error('Microsoft send error:', err);
        return res.code(500).send({ error: 'Error enviando email' });
      }
    });

    // Vincular un correo de Outlook (enviado o recibido) a un contacto u oportunidad
    app.post('/api/microsoft/vincular', async (req, res) => {
      const { messageId, asunto, from, contactoId, oportunidadId } = req.body as {
        messageId?: string; asunto?: string; from?: string; contactoId?: string; oportunidadId?: string;
      };
      if (!contactoId && !oportunidadId) {
        return res.code(400).send({ error: 'contactoId u oportunidadId requerido' });
      }
      const titulo = `Correo Outlook vinculado: ${asunto || messageId || 'sin asunto'}`;
      const metadata = { via: 'microsoft-graph', messageId, asunto, from };
      if (contactoId) {
        await logActivity('email_vinculado', titulo, 'contacto', contactoId, req.user!.id, metadata);
      }
      if (oportunidadId) {
        await logActivity('email_vinculado', titulo, 'oportunidad', oportunidadId, req.user!.id, metadata);
      }
      return { ok: true };
    });

    app.get('/api/microsoft/emails', async (req: FastifyRequest<{ Querystring: { folder?: string; top?: string; skip?: string; filter?: string } }>, res) => {
      try {
        const { folder = 'inbox', top = '50', skip = '0', filter } = req.query;
        const emails = await getUserEmails(req.user!.id, { folder, top: parseInt(top), skip: parseInt(skip), filter });
        return { data: emails };
      } catch (err) {
        console.error('Microsoft get emails error:', err);
        return res.code(500).send({ error: 'Error obteniendo emails' });
      }
    });

    app.post('/api/microsoft/subscriptions', async (req: FastifyRequest<{ Body: { resource: string; changeType: string; notificationUrl?: string; clientState?: string } }>, res) => {
      try {
        const { resource, changeType, clientState } = req.body;
        const notificationUrl = req.body.notificationUrl || `${env.GRAPH_PUBLIC_URL}/api/graph/notify`;
        const subId = await createUserSubscription(req.user!.id, resource, changeType, notificationUrl, clientState);
        if (!subId) return res.code(500).send({ error: 'Error creando suscripción' });
        return { subscriptionId: subId };
      } catch (err) {
        console.error('Microsoft subscription error:', err);
        return res.code(500).send({ error: 'Error creando suscripción' });
      }
    });

    app.post('/api/microsoft/subscriptions/:id/renew', async (req: FastifyRequest<{ Params: { id: string } }>, res) => {
      const ok = await renewUserSubscription(req.params.id);
      if (!ok) return res.code(500).send({ error: 'Error renovando suscripción' });
      return { ok: true };
    });

    app.delete('/api/microsoft/subscriptions/:id', async (req: FastifyRequest<{ Params: { id: string } }>, res) => {
      const ok = await deleteUserSubscription(req.params.id);
      if (!ok) return res.code(500).send({ error: 'Error eliminando suscripción' });
      return { ok: true };
    });

    app.get('/api/microsoft/subscriptions', async (req, res) => {
      const subs = await db.select().from(microsoftGraphSubscriptions).where(eq(microsoftGraphSubscriptions.userId, req.user!.id));
      return subs;
    });

    app.get('/api/microsoft/status', async (req, res) => {
      const [token] = await db.select().from(microsoftGraphTokens).where(
        eq(microsoftGraphTokens.userId, req.user!.id)
      ).limit(1);
      if (!token) return { connected: false };
      return {
        connected: true,
        expiresAt: token.expiresAt,
        scopes: token.scopes
      };
    });

    app.delete('/api/microsoft/disconnect', async (req, res) => {
      await db.delete(microsoftGraphTokens).where(
        eq(microsoftGraphTokens.userId, req.user!.id)
      );
      await db.delete(microsoftGraphSubscriptions).where(eq(microsoftGraphSubscriptions.userId, req.user!.id));
      return { ok: true };
    });

    // Stream de eventos en tiempo real (Server-Sent Events).
    // El worker publica en Redis `user:{id}:events` y aquí se reemite al navegador.
    app.get('/api/stream', async (req, reply) => {
      reply.hijack();
      const raw = reply.raw;
      raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      raw.write(': connected\n\n');

      const channel = `user:${req.user!.id}:events`;
      const sub = redis.duplicate();
      sub.on('error', () => {});
      sub.on('message', (_ch: string, msg: string) => {
        try { raw.write(`data: ${msg}\n\n`); } catch { /* cliente desconectado */ }
      });
      try {
        await sub.connect();
        await sub.subscribe(channel);
      } catch { /* sigue con heartbeat */ }

      const hb = setInterval(() => {
        try { raw.write(': hb\n\n'); } catch { /* noop */ }
      }, 25000);

      req.raw.on('close', () => {
        clearInterval(hb);
        sub.unsubscribe(channel).catch(() => {});
        sub.disconnect();
      });
    });

    // Global Microsoft config (single-tenant: una credencial Azure por despliegue)
    app.get('/api/microsoft/config', { preHandler: requireRole('admin') }, async () => {
      const [config] = await db.select().from(microsoftConfig).where(eq(microsoftConfig.activo, true)).limit(1);
      if (!config) return { configured: false };
      const { clientSecret, ...safe } = config;
      return { configured: true, config: { ...safe, clientSecretConfigured: !!clientSecret } };
    });

    app.put('/api/microsoft/config', { preHandler: requireRole('admin') }, async (req, res) => {
      const body = req.body as {
        clientId: string;
        clientSecret?: string;
        tenantId?: string;
        redirectUri: string;
        scopes?: string[];
        activo?: boolean;
      };
      if (!body.clientId || !body.redirectUri) {
        return res.code(400).send({ error: 'clientId y redirectUri son requeridos' });
      }
      const [existing] = await db.select().from(microsoftConfig).limit(1);
      if (!existing) {
        if (!body.clientSecret) {
          return res.code(400).send({ error: 'clientSecret es requerido en la configuración inicial' });
        }
        const [created] = await db.insert(microsoftConfig).values({
          clientId: body.clientId,
          clientSecret: encrypt(body.clientSecret),
          tenantId: body.tenantId || 'common',
          redirectUri: body.redirectUri,
          scopes: body.scopes || [],
          activo: body.activo ?? true,
        }).returning();
        const { clientSecret, ...safe } = created;
        return res.code(201).send({ ...safe, clientSecretConfigured: true });
      }
      const [updated] = await db.update(microsoftConfig).set({
        clientId: body.clientId,
        ...(body.clientSecret ? { clientSecret: encrypt(body.clientSecret) } : {}),
        tenantId: body.tenantId || existing.tenantId,
        redirectUri: body.redirectUri,
        scopes: body.scopes ?? existing.scopes,
        activo: body.activo ?? existing.activo,
        updatedAt: new Date(),
      }).where(eq(microsoftConfig.id, existing.id)).returning();
      const { clientSecret, ...safe } = updated;
      return { ...safe, clientSecretConfigured: true };
    });

    // Google OAuth (callback público con state=userId)
    app.get('/api/auth/google/connect', { preHandler: authMiddleware }, async (req, res) => {
      const state = buildGoogleState(req.user!.id);
      const authUrl = await getGoogleAuthUrl(state);
      if (!authUrl) return res.code(400).send({ error: 'Google no configurado' });
      res.redirect(authUrl);
    });

    app.get('/api/auth/google/callback', async (req: FastifyRequest<{ Querystring: { code?: string; state?: string; error?: string } }>, res) => {
      const { code, error, state } = req.query;
      const FE = process.env.FRONTEND_URL || 'http://localhost:8081';
      if (error) return res.redirect(`${FE}/settings?google_error=${error}`);
      if (!code || !state) return res.code(400).send({ error: 'code y state requeridos' });
      const parsed = parseGoogleState(state);
      if (!parsed?.userId) return res.code(400).send({ error: 'Estado inválido' });
      try {
        const cfg = await getGoogleConfig();
        if (!cfg) return res.redirect(`${FE}/settings?google_error=config_not_found`);
        const tokens = await exchangeGoogleCode(cfg, code);
        await storeGoogleTokens(parsed.userId, tokens);
        return res.redirect(`${FE}/settings?google_connected=true`);
      } catch (err) {
        console.error('Google OAuth error:', err);
        return res.redirect(`${FE}/settings?google_error=token_exchange_failed`);
      }
    });

    app.get('/api/google/status', async (req) => {
      const [t] = await db.select().from(googleTokens).where(eq(googleTokens.userId, req.user!.id)).limit(1);
      if (!t) return { connected: false };
      return { connected: true, expiresAt: t.expiresAt, scopes: t.scopes };
    });

    app.get('/api/google/profile', async (req) => {
      const p = await getGoogleProfile(req.user!.id);
      if (!p) return { error: 'No conectado a Google' };
      return p;
    });

    app.post('/api/google/send', async (req: FastifyRequest<{ Body: { to: string[]; subject: string; htmlBody: string; textBody?: string; contactoId?: string; oportunidadId?: string } }>, res) => {
      try {
        const { contactoId, oportunidadId, ...email } = req.body;
        await sendGmail(req.user!.id, email);
        if (contactoId) await logActivity('email_sent', `Email Gmail: ${email.subject}`, 'contacto', contactoId, req.user!.id, { via: 'google', to: email.to });
        if (oportunidadId) await logActivity('email_sent', `Email Gmail: ${email.subject}`, 'oportunidad', oportunidadId, req.user!.id, { via: 'google', to: email.to });
        emitEvent('email.enviado', { subject: email.subject, to: email.to, contactoId, oportunidadId, via: 'google' }).catch(() => {});
        return { ok: true };
      } catch (err) {
        console.error('Gmail send error:', err);
        return res.code(500).send({ error: 'Error enviando email' });
      }
    });

    app.get('/api/google/emails', async (req: FastifyRequest<{ Querystring: { q?: string; max?: string } }>, res) => {
      try {
        const emails = await getGmailMessages(req.user!.id, { q: req.query.q, max: parseInt(req.query.max || '25') });
        return { data: emails };
      } catch (err) {
        console.error('Gmail list error:', err);
        return res.code(500).send({ error: 'Error obteniendo emails' });
      }
    });

    app.delete('/api/google/disconnect', async (req, res) => {
      await db.delete(googleTokens).where(eq(googleTokens.userId, req.user!.id));
      return { ok: true };
    });

    app.get('/api/google/config', { preHandler: requireRole('admin') }, async () => {
      const [c] = await db.select().from(googleConfig).where(eq(googleConfig.activo, true)).limit(1);
      if (!c) return { configured: false };
      const { clientSecret, ...safe } = c;
      return { configured: true, config: { ...safe, clientSecretConfigured: !!clientSecret } };
    });

    app.put('/api/google/config', { preHandler: requireRole('admin') }, async (req, res) => {
      const body = req.body as { clientId?: string; clientSecret?: string; redirectUri?: string; scopes?: string[] };
      if (!body.clientId || !body.redirectUri) return res.code(400).send({ error: 'clientId y redirectUri requeridos' });
      const [existing] = await db.select().from(googleConfig).limit(1);
      if (!existing) {
        if (!body.clientSecret) return res.code(400).send({ error: 'clientSecret requerido en configuración inicial' });
        const [created] = await db.insert(googleConfig).values({
          clientId: body.clientId, clientSecret: encrypt(body.clientSecret),
          redirectUri: body.redirectUri, scopes: body.scopes?.length ? body.scopes : [...GOOGLE_SCOPES],
        }).returning();
        const { clientSecret, ...safe } = created;
        return res.code(201).send({ ...safe, clientSecretConfigured: true });
      }
      const [updated] = await db.update(googleConfig).set({
        clientId: body.clientId,
        ...(body.clientSecret ? { clientSecret: encrypt(body.clientSecret) } : {}),
        redirectUri: body.redirectUri,
        scopes: body.scopes?.length ? body.scopes : existing.scopes,
        updatedAt: new Date(),
      }).where(eq(googleConfig.id, existing.id)).returning();
      const { clientSecret, ...safe } = updated;
      return { ...safe, clientSecretConfigured: true };
    });

    // Calendario unificado: Outlook (Graph) + Google
    app.get('/api/calendario', async (req: FastifyRequest<{ Querystring: { start?: string; end?: string } }>) => {
      const { start, end } = req.query;
      const [outlook, google] = await Promise.all([
        getUserCalendar(req.user!.id, { start, end }).catch((e: any) => ({ error: e?.message || 'outlook no disponible' })),
        getGoogleCalendar(req.user!.id, { timeMin: start, timeMax: end }).catch((e: any) => ({ error: e?.message || 'google no disponible' })),
      ]);
      const list = [
        ...((outlook as any[]).map ? (outlook as any[]) : []),
        ...((google as any[]).map ? (google as any[]) : []),
      ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      return {
        data: list,
        fuentes: {
          outlook: (outlook as any).error ? { connected: false, error: (outlook as any).error } : { connected: true },
          google: (google as any).error ? { connected: false, error: (google as any).error } : { connected: true },
        },
      };
    });

    // Tokens de API pública (cada usuario gestiona los suyos; el token se muestra una sola vez)
    app.get('/api/api-tokens', async (req) => {
      return db.select({
        id: apiTokens.id, nombre: apiTokens.nombre, prefijo: apiTokens.prefijo,
        ultimoUsoEn: apiTokens.ultimoUsoEn, expiraEn: apiTokens.expiraEn,
        activo: apiTokens.activo, createdAt: apiTokens.createdAt,
      }).from(apiTokens).where(eq(apiTokens.userId, req.user!.id)).orderBy(desc(apiTokens.createdAt));
    });

    app.post('/api/api-tokens', async (req, res) => {
      const { nombre, expiraEn } = req.body as { nombre?: string; expiraEn?: string };
      if (!nombre) return res.code(400).send({ error: 'nombre requerido' });
      const { token, record } = await createApiToken(
        req.user!.id, nombre, expiraEn ? new Date(expiraEn) : undefined
      );
      return res.code(201).send({ id: record.id, token, prefijo: record.prefijo });
    });

    app.delete('/api/api-tokens/:id', async (req: FastifyRequest<{ Params: { id: string } }>, res) => {
      const conditions = req.user!.role === 'admin'
        ? eq(apiTokens.id, req.params.id)
        : and(eq(apiTokens.id, req.params.id), eq(apiTokens.userId, req.user!.id));
      await db.delete(apiTokens).where(conditions);
      return { ok: true };
    });

    // Rotación: revoca el token actual y emite uno nuevo (se muestra una sola vez)
    app.post('/api/api-tokens/:id/rotar', async (req: FastifyRequest<{ Params: { id: string } }>, res) => {
      const conditions = req.user!.role === 'admin'
        ? eq(apiTokens.id, req.params.id)
        : and(eq(apiTokens.id, req.params.id), eq(apiTokens.userId, req.user!.id));
      const [old] = await db.select().from(apiTokens).where(conditions).limit(1);
      if (!old) return res.code(404).send({ error: 'No encontrado' });
      const { token, record } = await createApiToken(old.userId, old.nombre, old.expiraEn || undefined);
      await db.delete(apiTokens).where(eq(apiTokens.id, old.id));
      return res.code(201).send({ id: record.id, token, prefijo: record.prefijo });
    });

    // Webhooks salientes (global por despliegue: solo admin)
    app.get('/api/webhooks', { preHandler: requireRole('admin') }, async () => {
      const endpoints = await db.select().from(webhookEndpoints).orderBy(desc(webhookEndpoints.createdAt));
      return { eventos: WEBHOOK_EVENTS, endpoints: endpoints.map(({ secret, ...e }) => e) };
    });

    app.post('/api/webhooks', { preHandler: requireRole('admin') }, async (req, res) => {
      const { nombre, url, secret, eventos } = req.body as {
        nombre?: string; url?: string; secret?: string; eventos?: string[];
      };
      if (!nombre || !url || !secret) return res.code(400).send({ error: 'nombre, url y secret requeridos' });
      try { new URL(url); } catch { return res.code(400).send({ error: 'url inválida' }); }
      const validos = (eventos || []).filter(e => (WEBHOOK_EVENTS as readonly string[]).includes(e) || e === '*');
      if (validos.length === 0) return res.code(400).send({ error: 'eventos requeridos' });
      const [ep] = await db.insert(webhookEndpoints).values({ nombre, url, secret, eventos: validos }).returning();
      const { secret: _s, ...safe } = ep;
      return res.code(201).send(safe);
    });

    app.delete('/api/webhooks/:id', {
      preHandler: requireRole('admin'),
      schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } }
    }, async (req: FastifyRequest<{ Params: { id: string } }>, res) => {
      await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, req.params.id));
      return { ok: true };
    });

    app.get('/api/webhooks/:id/deliveries', {
      preHandler: requireRole('admin'),
      schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } }
    }, async (req, res) => {
      return db.select().from(webhookDeliveries)
        .where(eq(webhookDeliveries.endpointId, (req as any).params.id))
        .orderBy(desc(webhookDeliveries.createdAt)).limit(50);
    });
  });

  app.register(async (app) => {
    app.addHook('preHandler', authMiddleware);

    app.get('/api/users', { preHandler: requireRole('admin') }, async () => {
      return db.select({ 
        id: users.id, 
        email: users.email, 
        name: users.name, 
        role: users.role, 
        activo: users.activo, 
        createdAt: users.createdAt 
      }).from(users).orderBy(desc(users.createdAt));
    });

    app.post('/api/users', { preHandler: requireRole('admin') }, async (req, res) => {
      const { email, password, name, role } = req.body as { email: string; password: string; name: string; role?: string };
      if (!email || !password || !name) return res.code(400).send({ error: 'email, password y name requeridos' });
      const hash = await hashPassword(password);
      try {
        const [user] = await db.insert(users).values({ email, passwordHash: hash, name, role: role || 'user' }).returning();
        const { passwordHash, ...safe } = user;
        return res.code(201).send(safe);
      } catch {
        return res.code(409).send({ error: 'El email ya está registrado' });
      }
    });

    app.put('/api/users/:id', { preHandler: requireRole('admin') }, async (req, res) => {
      const body = stripReadonly(req.body as Record<string, any>);
      delete body.email;
      delete body.passwordHash;
      if (body.password) {
        body.passwordHash = await hashPassword(String(body.password));
        delete body.password;
      }
      if (body.role && !['admin', 'user'].includes(body.role)) {
        return res.code(400).send({ error: 'role inválido' });
      }
      const [u] = await db.update(users).set({ ...body, updatedAt: new Date() })
        .where(eq(users.id, (req as any).params.id)).returning();
      if (!u) return res.code(404).send({ error: 'No encontrado' });
      const { passwordHash, ...safe } = u;
      return safe;
    });

    app.delete('/api/users/:id', { preHandler: requireRole('admin') }, async (req, res) => {
      if ((req as any).params.id === req.user!.id) {
        return res.code(400).send({ error: 'No puedes eliminar tu propio usuario' });
      }
      await db.delete(permisos).where(eq(permisos.userId, (req as any).params.id));
      await db.delete(users).where(eq(users.id, (req as any).params.id));
      return { ok: true };
    });

    // Matriz de permisos rwx por usuario (solo admin). Admin siempre tiene todo.
    app.get('/api/users/:id/permisos', { preHandler: requireRole('admin') }, async (req) => {
      const [u] = await db.select().from(users).where(eq(users.id, (req as any).params.id)).limit(1);
      if (!u) return { error: 'No encontrado' };
      return getPermisosMap(u.id, u.role);
    });

    app.put('/api/users/:id/permisos', { preHandler: requireRole('admin') }, async (req, res) => {
      const { permisos: lista } = req.body as { permisos?: Array<{ modulo: string; r?: boolean; w?: boolean; x?: boolean }> };
      if (!Array.isArray(lista)) return res.code(400).send({ error: 'permisos debe ser un arreglo' });
      const validos = (MODULOS as readonly string[]);
      const userId = (req as any).params.id as string;
      const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!u) return res.code(404).send({ error: 'No encontrado' });
      await db.delete(permisos).where(eq(permisos.userId, userId));
      const filas = lista
        .filter(p => validos.includes(p.modulo) && (p.r || p.w || p.x))
        .map(p => ({ userId, modulo: p.modulo, r: !!p.r, w: !!p.w, x: !!p.x }));
      if (filas.length) await db.insert(permisos).values(filas);
      return getPermisosMap(userId, u.role);
    });

    // Pipelines
    app.get('/api/pipelines', async () => db.select().from(pipelines).where(eq(pipelines.activo, true)).orderBy(pipelines.nombre));
    app.get('/api/pipelines/:id', async (req: FastifyRequest<{ Params: PipelineParams }>, res) => {
      const [pipeline] = await db.select().from(pipelines).where(eq(pipelines.id, req.params.id)).limit(1);
      if (!pipeline) return res.code(404).send({ error: 'No encontrado' });
      return pipeline;
    });
    app.post('/api/pipelines', { preHandler: requireRole('admin') }, async (req, res) => {
      const [pipeline] = await db.insert(pipelines).values(req.body as any).returning();
      return res.code(201).send(pipeline);
    });

    app.get('/api/pipeline-stages', async () => db.select().from(pipelineStages).orderBy(pipelineStages.orden));
    app.get('/api/pipeline-stages/:id', async (req: FastifyRequest<{ Params: PipelineStageParams }>, res) => {
      const [stage] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, req.params.id)).limit(1);
      if (!stage) return res.code(404).send({ error: 'No encontrado' });
      return stage;
    });
    app.post('/api/pipeline-stages', { preHandler: requireRole('admin') }, async (req, res) => {
      const [stage] = await db.insert(pipelineStages).values(req.body as any).returning();
      return res.code(201).send(stage);
    });

    // Oportunidades
    const OPP_SORT: Record<string, any> = { nombre: oportunidades.nombre, importe: oportunidades.importe, probabilidad: oportunidades.probabilidad, createdAt: oportunidades.createdAt };
    app.get('/api/oportunidades', async (req: FastifyRequest<{ Querystring: OportunidadesQuery }>) => {
      const { limit = '20', offset = '0', q, stageId, pipelineId, sortBy = 'createdAt', sortDir = 'desc', alcance } = req.query;
      const conditions = [];
      if (q) conditions.push(or(ilike(oportunidades.nombre, `%${q}%`), ilike(oportunidades.descripcion, `%${q}%`)));
      if (stageId) conditions.push(eq(oportunidades.stageId, stageId));
      if (pipelineId) conditions.push(eq(oportunidades.pipelineId, pipelineId));
      const vis = await alcanceIds(req.user!.id, alcance);
      if (vis) conditions.push(inArray(oportunidades.propietarioId, vis));
      const sortCol = OPP_SORT[sortBy] || oportunidades.createdAt;
      const data = await db.select().from(oportunidades).where(and(...conditions)).orderBy(sortDir === 'asc' ? asc(sortCol) : desc(sortCol)).limit(parseInt(limit)).offset(parseInt(offset));
      const [{ count: total }] = await db.select({ count: count() }).from(oportunidades).where(and(...conditions));
      return { data, total: Number(total) };
    });

    app.get('/api/oportunidades/:id', async (req: FastifyRequest<{ Params: OportunidadParams }>, res) => {
      const [opp] = await db.select().from(oportunidades).where(eq(oportunidades.id, req.params.id)).limit(1);
      if (!opp) return res.code(404).send({ error: 'No encontrada' });
      return opp;
    });

    app.post('/api/oportunidades', async (req, res) => {
      const { custom: customInput, ...rest } = req.body as CreateOportunidadBody & { custom?: unknown };
      const body = rest as CreateOportunidadBody;
      const { custom, errors } = await sanitizeCustom('oportunidad', customInput);
      if (errors.length) return res.code(400).send({ error: errors.join('; ') });
      const [opp] = await db.insert(oportunidades).values({
        ...body,
        custom,
        propietarioId: req.user!.id,
        fechaCierreEstimada: body.fechaCierreEstimada ? new Date(body.fechaCierreEstimada) : undefined
      }).returning();
      emitEvent('oportunidad.creada', { id: opp.id, nombre: opp.nombre, pipelineId: opp.pipelineId, stageId: opp.stageId, importe: opp.importe }).catch(() => {});
      return res.code(201).send(opp);
    });

    app.put('/api/oportunidades/:id', async (req: FastifyRequest<{ Params: OportunidadParams; Body: UpdateOportunidadBody & { custom?: unknown } }>, res) => {
      const { custom: customInput, ...rawBody } = req.body;
      const body = stripReadonly(rawBody);
      const [oldOpp] = await db.select().from(oportunidades).where(eq(oportunidades.id, req.params.id)).limit(1);
      if (!oldOpp) return res.code(404).send({ error: 'No encontrada' });

      const updateData: Record<string, any> = { ...body, updatedAt: new Date() };
      if (customInput !== undefined) {
        const r = await sanitizeCustom('oportunidad', customInput);
        if (r.errors.length) return res.code(400).send({ error: r.errors.join('; ') });
        updateData.custom = { ...(oldOpp.custom as object), ...r.custom };
      }
      if (body.fechaCierreEstimada) {
        updateData.fechaCierreEstimada = new Date(body.fechaCierreEstimada);
      }
      const [opp] = await db.update(oportunidades).set(updateData).where(eq(oportunidades.id, req.params.id)).returning();
      if (!opp) return res.code(404).send({ error: 'No encontrada' });

      // Trigger automatizaciones if stage changed
      if (body.stageId && body.stageId !== oldOpp.stageId) {
        const [newStage] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, body.stageId)).limit(1);
        const [oldStage] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, oldOpp.stageId)).limit(1);
        await processAutomatizaciones({
          evento: 'stage_changed',
          oportunidadId: opp.id,
          stageId: body.stageId,
          oldStageId: oldOpp.stageId,
          stage: { nombre: newStage?.nombre, color: newStage?.color, esFinal: newStage?.esFinal },
          oldStage: { nombre: oldStage?.nombre, color: oldStage?.color, esFinal: oldStage?.esFinal },
          userId: req.user?.id,
          pipelineId: opp.pipelineId,
          importe: opp.importe,
          probabilidad: opp.probabilidad
        });
        emitEvent('oportunidad.etapa_cambiada', {
          id: opp.id, nombre: opp.nombre, oldStageId: oldOpp.stageId, stageId: body.stageId,
          stage: newStage?.nombre, importe: opp.importe
        }).catch(() => {});
      }

      return opp;
    });

    app.delete('/api/oportunidades/:id', {
      schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } }
    }, async (req, res) => {
      await db.delete(oportunidades).where(eq(oportunidades.id, (req as any).params.id));
      return { ok: true };
    });

    app.get('/api/oportunidades/export', async (req, res) => {
      const data = await db.select().from(oportunidades).orderBy(desc(oportunidades.createdAt)).limit(5000);
      const rows = data.map(o => ({
        ...o,
        fechaCierreEstimada: o.fechaCierreEstimada ? new Date(o.fechaCierreEstimada).toISOString() : ''
      }));
      res.header('Content-Type', 'text/csv; charset=utf-8');
      res.header('Content-Disposition', 'attachment; filename="oportunidades.csv"');
      return res.send(toCsv(['nombre', 'descripcion', 'pipelineId', 'stageId', 'contactoId', 'propietarioId', 'importe', 'probabilidad', 'fechaCierreEstimada'], rows));
    });

    // Contactos
    const CONTACTO_SORT: Record<string, any> = { nombre: contactos.nombre, email: contactos.email, createdAt: contactos.createdAt };
    app.get('/api/contactos', async (req: FastifyRequest<{ Querystring: ContactosQuery }>) => {
      const { limit = '20', offset = '0', q, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
      const conditions = q ? or(ilike(contactos.nombre, `%${q}%`), ilike(contactos.email, `%${q}%`)) : undefined;
      const sortCol = CONTACTO_SORT[sortBy] || contactos.createdAt;
      const data = await db.select().from(contactos).where(conditions).orderBy(sortDir === 'asc' ? asc(sortCol) : desc(sortCol)).limit(parseInt(limit)).offset(parseInt(offset));
      const [{ count: total }] = await db.select({ count: count() }).from(contactos).where(conditions);
      return { data, total: Number(total) };
    });

    app.post('/api/contactos', async (req, res) => {
      const { custom: customInput, ...rest } = req.body as any;
      const { custom, errors } = await sanitizeCustom('contacto', customInput);
      if (errors.length) return res.code(400).send({ error: errors.join('; ') });
      const [contacto] = await db.insert(contactos).values({ ...rest, custom }).returning();
      emitEvent('contacto.creado', { id: contacto.id, nombre: contacto.nombre, email: contacto.email }).catch(() => {});
      return res.code(201).send(contacto);
    });

    app.put('/api/contactos/:id', async (req: FastifyRequest<{ Params: ContactoParams; Body: Record<string, any> }>, res) => {
      const { custom: customInput, ...rawBody } = req.body;
      const body = stripReadonly(rawBody);
      const [current] = await db.select().from(contactos).where(eq(contactos.id, req.params.id)).limit(1);
      if (!current) return res.code(404).send({ error: 'No encontrado' });
      let custom = current.custom as Record<string, unknown>;
      if (customInput !== undefined) {
        const r = await sanitizeCustom('contacto', customInput);
        if (r.errors.length) return res.code(400).send({ error: r.errors.join('; ') });
        custom = { ...(current.custom as object), ...r.custom };
      }
      const [contacto] = await db.update(contactos).set({ ...body, custom, updatedAt: new Date() }).where(eq(contactos.id, req.params.id)).returning();
      return contacto;
    });

    app.delete('/api/contactos/:id', async (req: FastifyRequest<{ Params: ContactoParams }>, res) => {
      await db.delete(contactos).where(eq(contactos.id, req.params.id));
      return { ok: true };
    });

    app.get('/api/contactos/export', async (req, res) => {
      const data = await db.select().from(contactos).orderBy(desc(contactos.createdAt)).limit(5000);
      res.header('Content-Type', 'text/csv; charset=utf-8');
      res.header('Content-Disposition', 'attachment; filename="contactos.csv"');
      return res.send(toCsv(['nombre', 'email', 'telefono', 'empresa', 'cargo'], data));
    });

    app.post('/api/contactos/import', async (req, res) => {
      let file: any;
      try {
        file = await (req as any).file();
      } catch {
        return res.code(400).send({ error: 'Archivo requerido (campo file, multipart)' });
      }
      if (!file) return res.code(400).send({ error: 'Archivo requerido (campo file)' });
      const { rows } = parseCsv((await file.toBuffer()).toString('utf8'));
      if (rows.length === 0) return res.code(400).send({ error: 'CSV vacío o sin cabeceras' });
      if (rows.length > 5000) return res.code(400).send({ error: 'Máximo 5000 filas' });
      let created = 0, updated = 0;
      const errors: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const line = i + 2;
        if (!r.nombre) { errors.push(`Línea ${line}: nombre requerido`); continue; }
        try {
          if (r.email) {
            const [ex] = await db.select().from(contactos).where(eq(contactos.email, r.email)).limit(1);
            if (ex) {
              await db.update(contactos).set({
                nombre: r.nombre, telefono: r.telefono || null,
                empresa: r.empresa || null, cargo: r.cargo || null, updatedAt: new Date()
              }).where(eq(contactos.id, ex.id));
              updated++;
              continue;
            }
          }
          await db.insert(contactos).values({
            nombre: r.nombre, email: r.email || null,
            telefono: r.telefono || null, empresa: r.empresa || null, cargo: r.cargo || null
          });
          created++;
        } catch (e: any) {
          errors.push(`Línea ${line}: ${e?.message || 'error'}`);
        }
      }
      return { created, updated, errors: errors.slice(0, 50), totalErrors: errors.length };
    });

    // Presupuestos / cotizaciones
    // Descuento = % (0-100) fijo en UI; impuestos = 16% fijo no modificable.
    const PRESUPUESTO_ESTADOS = ['borrador', 'enviado', 'aceptado', 'rechazado', 'vencido'];
    const IVA = 0.16;
    function totalesPresupuesto(items: any[], descuentoPct = 0) {
      const subtotal = (items || []).reduce((a, it) => a + Math.max(0, Number(it.cantidad) || 0) * Math.max(0, Number(it.precio) || 0), 0);
      const pct = Math.min(100, Math.max(0, Number(descuentoPct) || 0));
      const descMonto = subtotal * pct / 100;
      const impuestos = Math.round((subtotal - descMonto) * IVA);
      const total = Math.max(0, Math.round(subtotal - descMonto + impuestos));
      return { subtotal: Math.round(subtotal), descuentoPct: pct, impuestos, total };
    }

    app.get('/api/presupuestos', async (req: FastifyRequest<{ Querystring: { oportunidadId?: string; estado?: string; limit?: string } }>) => {
      const { oportunidadId, estado, limit = '50' } = req.query;
      const conditions = [];
      if (oportunidadId) conditions.push(eq(presupuestos.oportunidadId, oportunidadId));
      if (estado) conditions.push(eq(presupuestos.estado, estado));
      return db.select().from(presupuestos).where(and(...conditions)).orderBy(desc(presupuestos.createdAt)).limit(parseInt(limit));
    });

    app.get('/api/presupuestos/:id', async (req, res) => {
      const [p] = await db.select().from(presupuestos).where(eq(presupuestos.id, (req as any).params.id)).limit(1);
      if (!p) return res.code(404).send({ error: 'No encontrado' });
      const [opp] = p.oportunidadId ? await db.select({ id: oportunidades.id, nombre: oportunidades.nombre }).from(oportunidades).where(eq(oportunidades.id, p.oportunidadId)).limit(1) : [];
      const [ct] = p.contactoId ? await db.select({ id: contactos.id, nombre: contactos.nombre }).from(contactos).where(eq(contactos.id, p.contactoId)).limit(1) : [];
      const [emp] = p.empresaId ? await db.select({ id: companies.id, nombre: companies.nombre }).from(companies).where(eq(companies.id, p.empresaId)).limit(1) : [];
      return { ...p, oportunidad: opp || null, contacto: ct || null, empresa: emp || null };
    });

    app.post('/api/presupuestos', async (req, res) => {
      const body = req.body as {
        oportunidadId?: string; contactoId?: string; empresaId?: string;
        items?: Array<{ descripcion?: string; cantidad?: number; precio?: number; productoId?: string }>;
        descuento?: number; impuestos?: number; estado?: string; validez?: string; notas?: string;
      };
      const items = (body.items || []).map(it => ({
        descripcion: String(it.descripcion || 'Concepto'),
        cantidad: Math.max(0, Number(it.cantidad) || 0),
        precio: Math.max(0, Number(it.precio) || 0),
        productoId: it.productoId || null,
      }));
      if (body.estado && !PRESUPUESTO_ESTADOS.includes(body.estado)) {
        return res.code(400).send({ error: `estado debe ser uno de: ${PRESUPUESTO_ESTADOS.join(', ')}` });
      }
      const calc = totalesPresupuesto(items, body.descuento);
      const year = new Date().getFullYear();
      const [{ total: existentes }] = await db.select({ total: count() }).from(presupuestos);
      const folio = `COT-${year}-${String(Number(existentes) + 1).padStart(4, '0')}`;
      const [p] = await db.insert(presupuestos).values({
        folio,
        oportunidadId: body.oportunidadId || null, contactoId: body.contactoId || null, empresaId: body.empresaId || null,
        items, subtotal: calc.subtotal, descuento: calc.descuentoPct,
        impuestos: calc.impuestos, total: calc.total,
        estado: body.estado || 'borrador',
        validez: body.validez ? new Date(body.validez) : null,
        notas: body.notas || null,
      }).returning();
      return res.code(201).send(p);
    });

    app.put('/api/presupuestos/:id', async (req, res) => {
      const raw = stripReadonly(req.body as Record<string, any>);
      delete raw.folio;
      if (raw.estado && !PRESUPUESTO_ESTADOS.includes(raw.estado)) {
        return res.code(400).send({ error: `estado debe ser uno de: ${PRESUPUESTO_ESTADOS.join(', ')}` });
      }
      const [current] = await db.select().from(presupuestos).where(eq(presupuestos.id, (req as any).params.id)).limit(1);
      if (!current) return res.code(404).send({ error: 'No encontrado' });
      const items = raw.items !== undefined
        ? (raw.items as any[]).map(it => ({
            descripcion: String(it.descripcion || 'Concepto'),
            cantidad: Math.max(0, Number(it.cantidad) || 0),
            precio: Math.max(0, Number(it.precio) || 0),
            productoId: it.productoId || null,
          }))
        : (current.items as any[]);
      const calc = totalesPresupuesto(
        items,
        raw.descuento !== undefined ? raw.descuento : current.descuento
      );
      const [p] = await db.update(presupuestos).set({
        ...raw,
        items, subtotal: calc.subtotal, total: calc.total,
        descuento: calc.descuentoPct,
        impuestos: calc.impuestos,
        validez: raw.validez !== undefined ? (raw.validez ? new Date(raw.validez) : null) : current.validez,
        updatedAt: new Date(),
      }).where(eq(presupuestos.id, (req as any).params.id)).returning();
      return p;
    });

    app.delete('/api/presupuestos/:id', async (req, res) => {
      await db.delete(presupuestos).where(eq(presupuestos.id, (req as any).params.id));
      return { ok: true };
    });

    // Empresas
    const COMPANY_SORT: Record<string, any> = { nombre: companies.nombre, createdAt: companies.createdAt };
    app.get('/api/companies', async (req: FastifyRequest<{ Querystring: CompaniesQuery }>) => {
      const { limit = '20', offset = '0', q, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
      const conditions = q ? or(ilike(companies.nombre, `%${q}%`), ilike(companies.dominio, `%${q}%`)) : undefined;
      const sortCol = COMPANY_SORT[sortBy] || companies.createdAt;
      const data = await db.select().from(companies).where(conditions).orderBy(sortDir === 'asc' ? asc(sortCol) : desc(sortCol)).limit(parseInt(limit)).offset(parseInt(offset));
      const [{ count: total }] = await db.select({ count: count() }).from(companies).where(conditions);
      return { data, total: Number(total) };
    });

    app.post('/api/companies', async (req, res) => {
      const { custom: customInput, ...rest } = req.body as any;
      const { custom, errors } = await sanitizeCustom('empresa', customInput);
      if (errors.length) return res.code(400).send({ error: errors.join('; ') });
      const [company] = await db.insert(companies).values({ ...rest, custom }).returning();
      return res.code(201).send(company);
    });

    app.get('/api/companies/:id', async (req: FastifyRequest<{ Params: CompanyParams }>, res) => {
      const [company] = await db.select().from(companies).where(eq(companies.id, req.params.id)).limit(1);
      if (!company) return res.code(404).send({ error: 'No encontrada' });
      const members = await db.select({ contacto: contactos }).from(contactCompanies)
        .innerJoin(contactos, eq(contactCompanies.contactId, contactos.id))
        .where(eq(contactCompanies.companyId, req.params.id));
      return { ...company, contactos: members.map(m => m.contacto) };
    });

    app.put('/api/companies/:id', async (req: FastifyRequest<{ Params: CompanyParams; Body: Record<string, any> }>, res) => {
      const { custom: customInput, ...rawBody } = req.body;
      const body = stripReadonly(rawBody);
      const [current] = await db.select().from(companies).where(eq(companies.id, req.params.id)).limit(1);
      if (!current) return res.code(404).send({ error: 'No encontrada' });
      let custom = current.custom as Record<string, unknown>;
      if (customInput !== undefined) {
        const r = await sanitizeCustom('empresa', customInput);
        if (r.errors.length) return res.code(400).send({ error: r.errors.join('; ') });
        custom = { ...(current.custom as object), ...r.custom };
      }
      const [company] = await db.update(companies).set({ ...body, custom, updatedAt: new Date() }).where(eq(companies.id, req.params.id)).returning();
      return company;
    });

    app.delete('/api/companies/:id', async (req: FastifyRequest<{ Params: CompanyParams }>, res) => {
      await db.delete(contactCompanies).where(eq(contactCompanies.companyId, req.params.id));
      await db.delete(companies).where(eq(companies.id, req.params.id));
      return { ok: true };
    });

    // Productos / catálogo
    app.get('/api/productos', async (req: FastifyRequest<{ Querystring: { q?: string; limit?: string; soloActivos?: string } }>) => {
      const { q, limit = '100', soloActivos } = req.query;
      const conditions = [];
      if (q) conditions.push(or(ilike(productos.nombre, `%${q}%`), ilike(productos.sku, `%${q}%`)));
      if (soloActivos === '1') conditions.push(eq(productos.activo, true));
      return db.select().from(productos).where(and(...conditions)).orderBy(productos.nombre).limit(parseInt(limit));
    });

    app.post('/api/productos', async (req, res) => {
      const body = req.body as { nombre?: string; sku?: string; descripcion?: string; precio?: number; activo?: boolean };
      if (!body.nombre) return res.code(400).send({ error: 'nombre requerido' });
      const [p] = await db.insert(productos).values({
        nombre: body.nombre, sku: body.sku || null, descripcion: body.descripcion || null,
        precio: Math.max(0, Math.round(Number(body.precio) || 0)), activo: body.activo ?? true,
      }).returning();
      return res.code(201).send(p);
    });

    app.put('/api/productos/:id', async (req, res) => {
      const body = stripReadonly(req.body as Record<string, any>);
      if (body.precio !== undefined) body.precio = Math.max(0, Math.round(Number(body.precio) || 0));
      const [p] = await db.update(productos).set({ ...body, updatedAt: new Date() })
        .where(eq(productos.id, (req as any).params.id)).returning();
      if (!p) return res.code(404).send({ error: 'No encontrado' });
      return p;
    });

    app.delete('/api/productos/:id', async (req, res) => {
      await db.delete(productos).where(eq(productos.id, (req as any).params.id));
      return { ok: true };
    });

    app.get('/api/companies/export', async (req, res) => {
      const data = await db.select().from(companies).orderBy(desc(companies.createdAt)).limit(5000);
      res.header('Content-Type', 'text/csv; charset=utf-8');
      res.header('Content-Disposition', 'attachment; filename="empresas.csv"');
      return res.send(toCsv(['nombre', 'dominio'], data));
    });

    // Campos personalizados: lectura para todos, gestión solo admin
    app.get('/api/custom-fields', async (req: FastifyRequest<{ Querystring: { entidad?: string } }>) => {
      const { entidad } = req.query;
      const conds = [eq(customFields.activo, true)];
      if (entidad) conds.push(eq(customFields.entidad, entidad));
      return db.select().from(customFields).where(and(...conds)).orderBy(customFields.orden);
    });

    app.post('/api/custom-fields', { preHandler: requireRole('admin') }, async (req, res) => {
      const body = req.body as { entidad?: string; clave?: string; etiqueta?: string; tipo?: string; opciones?: string[]; requerido?: boolean; orden?: number };
      if (!body.entidad || !(ENTIDADES as readonly string[]).includes(body.entidad)) {
        return res.code(400).send({ error: `entidad debe ser una de: ${ENTIDADES.join(', ')}` });
      }
      if (!body.clave || !/^[a-z][a-z0-9_]{1,49}$/.test(body.clave)) {
        return res.code(400).send({ error: 'clave inválida (minúsculas, números, guion bajo)' });
      }
      if (!body.etiqueta) return res.code(400).send({ error: 'etiqueta requerida' });
      if (body.tipo && !(TIPOS as readonly string[]).includes(body.tipo)) {
        return res.code(400).send({ error: `tipo debe ser uno de: ${TIPOS.join(', ')}` });
      }
      if (body.tipo === 'seleccion' && (!body.opciones || body.opciones.length === 0)) {
        return res.code(400).send({ error: 'seleccion requiere opciones' });
      }
      try {
        const [f] = await db.insert(customFields).values({
          entidad: body.entidad, clave: body.clave, etiqueta: body.etiqueta,
          tipo: body.tipo || 'texto', opciones: body.opciones || [],
          requerido: body.requerido ?? false, orden: body.orden ?? 0,
        }).returning();
        return res.code(201).send(f);
      } catch {
        return res.code(409).send({ error: 'Ya existe un campo con esa clave en la entidad' });
      }
    });

    app.put('/api/custom-fields/:id', { preHandler: requireRole('admin') }, async (req, res) => {
      const raw = req.body as Record<string, any>;
      delete raw.clave;
      delete raw.entidad;
      const body = stripReadonly(raw);
      const [f] = await db.update(customFields).set({ ...body, updatedAt: new Date() })
        .where(eq(customFields.id, (req as any).params.id)).returning();
      if (!f) return res.code(404).send({ error: 'No encontrado' });
      return f;
    });

    app.delete('/api/custom-fields/:id', { preHandler: requireRole('admin') }, async (req, res) => {
      await db.delete(customFields).where(eq(customFields.id, (req as any).params.id));
      return { ok: true };
    });

    app.post('/api/companies/:id/contacts', async (req: FastifyRequest<{ Params: CompanyParams }>, res) => {
      const { contactoId } = req.body as { contactoId: string };
      if (!contactoId) return res.code(400).send({ error: 'contactoId requerido' });
      const [company] = await db.select().from(companies).where(eq(companies.id, req.params.id)).limit(1);
      if (!company) return res.code(404).send({ error: 'Empresa no encontrada' });
      const [contacto] = await db.select().from(contactos).where(eq(contactos.id, contactoId)).limit(1);
      if (!contacto) return res.code(404).send({ error: 'Contacto no encontrado' });
      await db.insert(contactCompanies).values({ contactId: contactoId, companyId: req.params.id }).onConflictDoNothing();
      return res.code(201).send({ ok: true });
    });

    app.delete('/api/companies/:id/contacts/:contactoId', async (req: FastifyRequest<{ Params: CompanyContactParams }>, res) => {
      await db.delete(contactCompanies).where(and(
        eq(contactCompanies.companyId, req.params.id),
        eq(contactCompanies.contactId, req.params.contactoId)
      ));
      return { ok: true };
    });

    app.get('/api/contactos/:id/companies', async (req: FastifyRequest<{ Params: ContactoParams }>) => {
      const rows = await db.select({ company: companies }).from(contactCompanies)
        .innerJoin(companies, eq(contactCompanies.companyId, companies.id))
        .where(eq(contactCompanies.contactId, req.params.id));
      return rows.map(r => r.company);
    });

    // Tareas
    const TAREA_SORT: Record<string, any> = { titulo: tareas.titulo, vencimiento: tareas.vencimiento, estado: tareas.estado, createdAt: tareas.createdAt };
    app.get('/api/tareas', async (req: FastifyRequest<{ Querystring: { limit?: string; offset?: string; estado?: string; entityType?: string; entityId?: string; asignadoId?: string; sortBy?: string; sortDir?: string; alcance?: string } }>) => {
      const { limit = '50', offset = '0', estado, entityType, entityId, asignadoId, sortBy = 'createdAt', sortDir = 'desc', alcance } = req.query;
      const conditions = [];
      if (estado) conditions.push(eq(tareas.estado, estado));
      if (entityType) conditions.push(eq(tareas.entityType, entityType));
      if (entityId) conditions.push(eq(tareas.entityId, entityId));
      if (asignadoId) conditions.push(eq(tareas.asignadoId, asignadoId));
      const vis = await alcanceIds(req.user!.id, alcance);
      if (vis) conditions.push(inArray(tareas.asignadoId, vis));
      const col = TAREA_SORT[sortBy] || tareas.createdAt;
      const order = sortDir === 'asc' ? asc(col) : desc(col);
      const data = await db.select().from(tareas).where(and(...conditions)).orderBy(order).limit(parseInt(limit)).offset(parseInt(offset));
      const [{ count: total }] = await db.select({ count: count() }).from(tareas).where(and(...conditions));
      return { data, total: Number(total) };
    });

    app.post('/api/tareas', async (req, res) => {
      const body = req.body as { titulo?: string; descripcion?: string; estado?: string; prioridad?: string; vencimiento?: string; entityType?: string; entityId?: string; asignadoId?: string };
      if (!body.titulo) return res.code(400).send({ error: 'titulo requerido' });
      const [t] = await db.insert(tareas).values({
        titulo: body.titulo, descripcion: body.descripcion,
        estado: body.estado || 'pendiente', prioridad: body.prioridad || 'media',
        vencimiento: body.vencimiento ? new Date(body.vencimiento) : null,
        entityType: body.entityType || null, entityId: body.entityId || null,
        asignadoId: body.asignadoId || null, creadoPor: req.user!.id,
      }).returning();
      return res.code(201).send(t);
    });

    app.put('/api/tareas/:id', async (req, res) => {
      const body = stripReadonly(req.body as Record<string, any>);
      if (body.vencimiento) body.vencimiento = new Date(body.vencimiento as any);
      const [t] = await db.update(tareas).set({ ...body, updatedAt: new Date() })
        .where(eq(tareas.id, (req as any).params.id)).returning();
      if (!t) return res.code(404).send({ error: 'No encontrada' });
      return t;
    });

    app.delete('/api/tareas/:id', async (req, res) => {
      await db.delete(tareas).where(eq(tareas.id, (req as any).params.id));
      return { ok: true };
    });

    // Archivos (MinIO): vinculados a contacto, empresa u oportunidad
    const ARCHIVO_ENTIDADES = ['contacto', 'empresa', 'oportunidad'];
    app.get('/api/archivos', async (req: FastifyRequest<{ Querystring: { entityType?: string; entityId?: string } }>, res) => {
      const { entityType, entityId } = req.query;
      if (!entityType || !entityId) return res.code(400).send({ error: 'entityType y entityId requeridos' });
      return db.select().from(archivos)
        .where(and(eq(archivos.entityType, entityType), eq(archivos.entityId, entityId)))
        .orderBy(desc(archivos.createdAt));
    });

    app.post('/api/archivos', async (req, res) => {
      let file: any;
      try {
        file = await (req as any).file({ limits: { fileSize: 25 * 1024 * 1024, files: 1 } });
      } catch {
        return res.code(400).send({ error: 'Archivo requerido (campo file, multipart)' });
      }
      if (!file) return res.code(400).send({ error: 'Archivo requerido (campo file)' });
      const fields = (file.fields || {}) as Record<string, any>;
      const entityType = fields.entityType?.value;
      const entityId = fields.entityId?.value;
      if (!ARCHIVO_ENTIDADES.includes(entityType) || !entityId) {
        return res.code(400).send({ error: 'entityType (contacto|empresa|oportunidad) y entityId requeridos' });
      }
      const buf = await file.toBuffer();
      const safeName = `${Date.now()}-${(file.filename || 'archivo').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const clave = `${entityType}/${entityId}/${safeName}`;
      try {
        await storage().putObject(bucketName(), clave, buf, buf.length, { 'Content-Type': file.mimetype || 'application/octet-stream' });
      } catch (e: any) {
        return res.code(500).send({ error: `Error subiendo a almacenamiento: ${e?.message || e}` });
      }
      const [row] = await db.insert(archivos).values({
        nombre: file.filename || safeName, mime: file.mimetype || null,
        tamano: buf.length, clave, entityType, entityId, userId: req.user!.id,
      }).returning();
      return res.code(201).send(row);
    });

    app.get('/api/archivos/:id/download', async (req, res) => {
      const [row] = await db.select().from(archivos).where(eq(archivos.id, (req as any).params.id)).limit(1);
      if (!row) return res.code(404).send({ error: 'No encontrado' });
      try {
        const url = await storage().presignedGetObject(bucketName(), row.clave, 3600);
        return res.redirect(url);
      } catch (e: any) {
        return res.code(500).send({ error: `Error generando descarga: ${e?.message || e}` });
      }
    });

    app.delete('/api/archivos/:id', async (req, res) => {
      const [row] = await db.select().from(archivos).where(eq(archivos.id, (req as any).params.id)).limit(1);
      if (!row) return res.code(404).send({ error: 'No encontrado' });
      try { await storage().removeObject(bucketName(), row.clave); } catch { /* sigue borrando el registro */ }
      await db.delete(archivos).where(eq(archivos.id, row.id));
      return { ok: true };
    });

    // Equipos (gestión admin; lectura autenticada)
    app.get('/api/equipos', async () => {
      const list = await db.select().from(equipos).orderBy(equipos.nombre);
      const members = await db.select({ equipoId: equipoMiembros.equipoId, userId: users.id, name: users.name, email: users.email })
        .from(equipoMiembros).innerJoin(users, eq(equipoMiembros.userId, users.id));
      return list.map(e => ({ ...e, miembros: members.filter(m => m.equipoId === e.id) }));
    });

    app.post('/api/equipos', { preHandler: requireRole('admin') }, async (req, res) => {
      const { nombre } = req.body as { nombre?: string };
      if (!nombre) return res.code(400).send({ error: 'nombre requerido' });
      const [e] = await db.insert(equipos).values({ nombre }).returning();
      return res.code(201).send(e);
    });

    app.delete('/api/equipos/:id', { preHandler: requireRole('admin') }, async (req, res) => {
      await db.delete(equipoMiembros).where(eq(equipoMiembros.equipoId, (req as any).params.id));
      await db.delete(equipos).where(eq(equipos.id, (req as any).params.id));
      return { ok: true };
    });

    app.post('/api/equipos/:id/miembros', { preHandler: requireRole('admin') }, async (req, res) => {
      const { userId } = req.body as { userId?: string };
      if (!userId) return res.code(400).send({ error: 'userId requerido' });
      await db.insert(equipoMiembros).values({ equipoId: (req as any).params.id, userId }).onConflictDoNothing();
      return res.code(201).send({ ok: true });
    });

    app.delete('/api/equipos/:id/miembros/:userId', { preHandler: requireRole('admin') }, async (req, res) => {
      await db.delete(equipoMiembros).where(and(
        eq(equipoMiembros.equipoId, (req as any).params.id),
        eq(equipoMiembros.userId, (req as any).params.userId)
      ));
      return { ok: true };
    });

    // Resuelve ids de usuario visibles según alcance: mio | equipo | todos
    async function alcanceIds(userId: string, alcance?: string): Promise<string[] | null> {
      if (alcance === 'mio') return [userId];
      if (alcance === 'equipo') {
        const mios = await db.select().from(equipoMiembros).where(eq(equipoMiembros.userId, userId));
        const ids = mios.map(m => m.equipoId);
        if (!ids.length) return [userId];
        const mates = await db.select().from(equipoMiembros).where(inArray(equipoMiembros.equipoId, ids));
        return [...new Set(mates.map(m => m.userId))];
      }
      return null;
    }

    // Vistas guardadas (por usuario)
    app.get('/api/vistas', async (req: FastifyRequest<{ Querystring: { entidad?: string } }>) => {
      const conds = [eq(vistasGuardadas.userId, req.user!.id)];
      if (req.query.entidad) conds.push(eq(vistasGuardadas.entidad, req.query.entidad));
      return db.select().from(vistasGuardadas).where(and(...conds)).orderBy(desc(vistasGuardadas.createdAt));
    });

    app.post('/api/vistas', async (req, res) => {
      const { entidad, nombre, filtros } = req.body as { entidad?: string; nombre?: string; filtros?: unknown };
      if (!entidad || !nombre) return res.code(400).send({ error: 'entidad y nombre requeridos' });
      const [v] = await db.insert(vistasGuardadas).values({
        userId: req.user!.id, entidad, nombre, filtros: (filtros as object) || {},
      }).returning();
      return res.code(201).send(v);
    });

    app.delete('/api/vistas/:id', async (req, res) => {
      await db.delete(vistasGuardadas).where(and(
        eq(vistasGuardadas.id, (req as any).params.id),
        eq(vistasGuardadas.userId, req.user!.id)
      ));
      return { ok: true };
    });

    // Timeline unificado: actividades + tareas + archivos de un registro
    app.get('/api/timeline', async (req: FastifyRequest<{ Querystring: { entityType?: string; entityId?: string; limit?: string } }>, res) => {
      const { entityType, entityId, limit = '100' } = req.query;
      if (!entityType || !entityId) return res.code(400).send({ error: 'entityType y entityId requeridos' });
      const cond = and(eq(activities.entityType, entityType), eq(activities.entityId, entityId));
      const [acts, tars, files] = await Promise.all([
        db.select().from(activities).where(cond).orderBy(desc(activities.createdAt)).limit(parseInt(limit)),
        db.select().from(tareas).where(and(eq(tareas.entityType, entityType), eq(tareas.entityId, entityId))).orderBy(desc(tareas.createdAt)).limit(parseInt(limit)),
        db.select().from(archivos).where(and(eq(archivos.entityType, entityType), eq(archivos.entityId, entityId))).orderBy(desc(archivos.createdAt)).limit(parseInt(limit)),
      ]);
      const items = [
        ...acts.map(a => ({ kind: 'actividad', fecha: a.createdAt, data: a })),
        ...tars.map(t => ({ kind: 'tarea', fecha: t.createdAt, data: t })),
        ...files.map(f => ({ kind: 'archivo', fecha: f.createdAt, data: f })),
      ].sort((a, b) => new Date(b.fecha as any).getTime() - new Date(a.fecha as any).getTime());
      return items.slice(0, parseInt(limit));
    });

    // Dashboard stats
    app.get('/api/dashboard/stats', async () => {
      const [totalOpps] = await db.select({ count: count() }).from(oportunidades);
      const [totalValor] = await db.select({ sum: sql<number>`coalesce(sum(${oportunidades.importe}), 0)` }).from(oportunidades);
      const [totalStages] = await db.select({ count: count() }).from(pipelineStages);
      const [totalUsers] = await db.select({ count: count() }).from(users).where(eq(users.activo, true));
      return {
        totalOportunidades: Number(totalOpps.count),
        valorTotal: Number(totalValor.sum || 0),
        totalEtapas: Number(totalStages.count),
        totalUsuarios: Number(totalUsers.count)
      };
    });

    // Embudo por etapa: conteo, importe y ponderado (importe × probabilidad)
    app.get('/api/reportes/embudo', async (req: FastifyRequest<{ Querystring: { pipelineId?: string } }>) => {
      const { pipelineId } = req.query;
      const stageCond = pipelineId ? eq(pipelineStages.pipelineId, pipelineId) : undefined;
      const stages = await db.select().from(pipelineStages).where(stageCond).orderBy(pipelineStages.orden);
      const oppCond = pipelineId ? eq(oportunidades.pipelineId, pipelineId) : undefined;
      const opps = await db.select({
        id: oportunidades.id, stageId: oportunidades.stageId,
        importe: oportunidades.importe, probabilidad: oportunidades.probabilidad,
      }).from(oportunidades).where(oppCond);
      const etapas = stages.map(s => {
        const items = opps.filter(o => o.stageId === s.id);
        const importe = items.reduce((a, o) => a + (o.importe || 0), 0);
        const ponderado = items.reduce((a, o) => a + (o.importe || 0) * (o.probabilidad ?? 50) / 100, 0);
        return {
          stageId: s.id, nombre: s.nombre, color: s.color, orden: s.orden,
          esFinal: s.esFinal, count: items.length, importe, ponderado: Math.round(ponderado),
        };
      });
      const total = opps.length;
      const valorTotal = opps.reduce((a, o) => a + (o.importe || 0), 0);
      const ponderadoTotal = etapas.reduce((a, e) => a + e.ponderado, 0);
      return {
        currency: env.CURRENCY, total, valorTotal, ponderadoTotal,
        ticketMedio: total ? Math.round(valorTotal / total) : 0,
        etapas,
      };
    });

    // Serie mensual: oportunidades e importe por mes de creación (últimos N meses)
    app.get('/api/reportes/mensual', async (req: FastifyRequest<{ Querystring: { meses?: string; pipelineId?: string } }>) => {
      const meses = Math.min(24, Math.max(3, parseInt(req.query.meses || '12')));
      const { pipelineId } = req.query;
      const conds = [sql`${oportunidades.createdAt} >= date_trunc('month', now()) - (${meses} - 1) * interval '1 month'`];
      if (pipelineId) conds.push(eq(oportunidades.pipelineId, pipelineId));
      const rows = await db.select({
        mes: sql<string>`to_char(date_trunc('month', ${oportunidades.createdAt}), 'YYYY-MM')`,
        count: count(),
        importe: sql<number>`coalesce(sum(${oportunidades.importe}), 0)`,
      }).from(oportunidades).where(and(...conds))
        .groupBy(sql`date_trunc('month', ${oportunidades.createdAt})`)
        .orderBy(sql`date_trunc('month', ${oportunidades.createdAt})`);
      const map = new Map(rows.map(r => [r.mes, { count: Number(r.count), importe: Number(r.importe) }]));
      const serie = [];
      const now = new Date();
      for (let i = meses - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const nombre = d.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
        serie.push({ mes: key, nombre, ...(map.get(key) || { count: 0, importe: 0 }) });
      }
      return { currency: env.CURRENCY, serie };
    });

    // Automatizaciones
    app.get('/api/automatizaciones', async () => db.select().from(automatizaciones).orderBy(desc(automatizaciones.createdAt)));
    app.post('/api/automatizaciones', async (req, res) => {
      const [auto] = await db.insert(automatizaciones).values(req.body as any).returning();
      return res.code(201).send(auto);
    });
    app.put('/api/automatizaciones/:id', {
      schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } }
    }, async (req, res) => {
      const body = stripReadonly(req.body as Record<string, any>);
      const [auto] = await db.update(automatizaciones).set({ ...body, updatedAt: new Date() }).where(eq(automatizaciones.id, (req as any).params.id)).returning();
      return auto;
    });

    app.delete('/api/automatizaciones/:id', {
      schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } }
    }, async (req, res) => {
      await db.delete(automatizaciones).where(eq(automatizaciones.id, (req as any).params.id));
      return { ok: true };
    });

    // Email templates
    app.get('/api/email-templates', async () => db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt)));
    app.post('/api/email-templates', async (req, res) => {
      const [tpl] = await db.insert(emailTemplates).values(req.body as any).returning();
      return res.code(201).send(tpl);
    });
    app.put('/api/email-templates/:id', async (req: FastifyRequest<{ Params: EmailTemplateParams; Body: Record<string, any> }>, res) => {
      const body = stripReadonly(req.body);
      const [tpl] = await db.update(emailTemplates).set({ ...body, updatedAt: new Date() }).where(eq(emailTemplates.id, req.params.id)).returning();
      if (!tpl) return res.code(404).send({ error: 'No encontrada' });
      return tpl;
    });
    app.delete('/api/email-templates/:id', async (req: FastifyRequest<{ Params: EmailTemplateParams }>, res) => {
      await db.delete(emailTemplates).where(eq(emailTemplates.id, req.params.id));
      return { ok: true };
    });

    // Email campaigns
    app.get('/api/email-campaigns', async () => db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt)));
    app.post('/api/email-campaigns', async (req, res) => {
      const [campaign] = await db.insert(emailCampaigns).values(req.body as any).returning();
      return res.code(201).send(campaign);
    });
    app.post('/api/email-campaigns/:id/send', async (req: FastifyRequest<{ Params: EmailCampaignParams }>, res) => {
      const [campaign] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, req.params.id)).limit(1);
      if (!campaign) return res.code(404).send({ error: 'Campaña no encontrada' });
      if (!campaign.templateId) return res.code(400).send({ error: 'Campaña sin plantilla asignada' });
      
      const [tpl] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, campaign.templateId)).limit(1);
      if (!tpl) return res.code(400).send({ error: 'Plantilla no encontrada' });

      // Get contact lists or use all contacts for now
      const contacts = await db.select().from(contactos);
      
      let sent = 0;
      for (const contact of contacts) {
        if (contact.email) {
          const html = renderTemplate(tpl.contenidoHtml, { nombre: contact.nombre, email: contact.email });
          const text = renderTemplate(tpl.contenidoTexto || '', { nombre: contact.nombre, email: contact.email });
          await sendEmail({ to: contact.email, subject: campaign.asunto, html, text });
          await logActivity('email_sent', `Email campaña: ${campaign.nombre}`, 'contacto', contact.id, req.user?.id, { campaignId: campaign.id, template: tpl.nombre, to: contact.email });
          sent++;
        }
      }

      await db.update(emailCampaigns).set({ estado: 'enviada', enviadaEn: new Date(), updatedAt: new Date() }).where(eq(emailCampaigns.id, campaign.id));
      
      return { ok: true, sent };
    });

    app.put('/api/email-campaigns/:id', async (req: FastifyRequest<{ Params: EmailCampaignParams; Body: Record<string, any> }>, res) => {
      const body = stripReadonly(req.body);
      const [campaign] = await db.update(emailCampaigns).set({ ...body, updatedAt: new Date() }).where(eq(emailCampaigns.id, req.params.id)).returning();
      if (!campaign) return res.code(404).send({ error: 'No encontrada' });
      return campaign;
    });

    app.delete('/api/email-campaigns/:id', async (req: FastifyRequest<{ Params: EmailCampaignParams }>, res) => {
      await db.delete(emailCampaigns).where(eq(emailCampaigns.id, req.params.id));
      return { ok: true };
    });

    // Contact Lists
    app.get('/api/contact-lists', async () => db.select().from(contactLists).orderBy(desc(contactLists.createdAt)));
    app.post('/api/contact-lists', async (req, res) => {
      const [list] = await db.insert(contactLists).values(req.body as any).returning();
      return res.code(201).send(list);
    });
    app.get('/api/contact-lists/:id', async (req: FastifyRequest<{ Params: ContactListParams }>, res) => {
      const [list] = await db.select().from(contactLists).where(eq(contactLists.id, req.params.id)).limit(1);
      if (!list) return res.code(404).send({ error: 'No encontrada' });
      return list;
    });

    app.put('/api/contact-lists/:id', async (req: FastifyRequest<{ Params: ContactListParams; Body: Record<string, any> }>, res) => {
      const body = stripReadonly(req.body);
      const [list] = await db.update(contactLists).set({ ...body, updatedAt: new Date() }).where(eq(contactLists.id, req.params.id)).returning();
      if (!list) return res.code(404).send({ error: 'No encontrada' });
      return list;
    });

    app.delete('/api/contact-lists/:id', async (req: FastifyRequest<{ Params: ContactListParams }>, res) => {
      await db.delete(contactLists).where(eq(contactLists.id, req.params.id));
      return { ok: true };
    });

    app.get('/api/contact-lists/:id/members', async (req: FastifyRequest<{ Params: ContactListParams }>) => {
      return db.select().from(contactListMembers).where(eq(contactListMembers.listId, req.params.id));
    });
    app.post('/api/contact-lists/:id/members', async (req: FastifyRequest<{ Params: ContactListParams }>, res) => {
      const [member] = await db.insert(contactListMembers).values({ listId: req.params.id, contactoId: (req.body as any).contactoId }).returning();
      return res.code(201).send(member);
    });
    app.delete('/api/contact-lists/:id/members/:contactoId', async (req, res) => {
      await db.delete(contactListMembers).where(and(
        eq(contactListMembers.listId, (req as any).params.id),
        eq(contactListMembers.contactoId, (req as any).params.contactoId)
      ));
      return { ok: true };
    });

    // Email Subscriptions (Double Opt-in) - admin only
    app.post('/api/email-subscriptions', async (req, res) => {
      const { contactoId, listaId } = req.body as { contactoId: string; listaId?: string };
      const { randomUUID } = await import('crypto');
      const token = randomUUID();
      const [sub] = await db.insert(emailSubscriptions).values({
        contactoId,
        listaId,
        token,
        estado: 'pendiente'
      }).returning();
      // TODO: Send confirmation email with link /api/email-subscriptions/confirm/${token}
      return res.code(201).send(sub);
    });

    // Email Tracking
    app.get('/api/email-tracking', async (req: FastifyRequest<{ Querystring: { campaignId?: string; contactoId?: string; tipo?: string; limit?: string } }>) => {
      const { campaignId, contactoId, tipo, limit = '100' } = req.query;
      const conditions = [];
      if (campaignId) conditions.push(eq(emailTracking.campaignId, campaignId));
      if (contactoId) conditions.push(eq(emailTracking.contactoId, contactoId));
      if (tipo) conditions.push(eq(emailTracking.tipo, tipo));
      return db.select().from(emailTracking).where(and(...conditions)).orderBy(desc(emailTracking.createdAt)).limit(parseInt(limit));
    });
    app.get('/api/email-tracking/stats/:campaignId', async (req: FastifyRequest<{ Params: { campaignId: string } }>) => {
      const tipoMap: Record<string, keyof typeof stats> = {
        sent: 'sent',
        open: 'opens',
        click: 'clicks',
        unsubscribe: 'unsubscribes',
        bounce: 'bounces',
      };
      const tracking = await db.select().from(emailTracking).where(eq(emailTracking.campaignId, req.params.campaignId));
      const stats = { sent: 0, opens: 0, clicks: 0, unsubscribes: 0, bounces: 0 };
      for (const t of tracking) {
        const key = tipoMap[t.tipo];
        if (key) stats[key]++;
      }
      return stats;
    });

    // Activities
    app.get('/api/activities', async (req: FastifyRequest<{ Querystring: { limit?: string; offset?: string; entityType?: string; entityId?: string } }>) => {
      const { limit = '50', offset = '0', entityType, entityId } = req.query;
      const conditions = [];
      if (entityType) conditions.push(eq(activities.entityType, entityType));
      if (entityId) conditions.push(eq(activities.entityId, entityId));
      const data = await db.select().from(activities).where(and(...conditions)).orderBy(desc(activities.createdAt)).limit(parseInt(limit)).offset(parseInt(offset));
      const [{ count: total }] = await db.select({ count: count() }).from(activities).where(and(...conditions));
      return { data, total: Number(total) };
    });

    // Timeline: correos y actividad vinculada a un contacto u oportunidad
    app.get('/api/contactos/:id/timeline', async (req: FastifyRequest<{ Params: ContactoParams; Querystring: { limit?: string } }>) => {
      const { limit = '50' } = req.query;
      return db.select().from(activities)
        .where(and(eq(activities.entityType, 'contacto'), eq(activities.entityId, req.params.id)))
        .orderBy(desc(activities.createdAt)).limit(parseInt(limit));
    });

    app.get('/api/oportunidades/:id/timeline', async (req: FastifyRequest<{ Params: OportunidadParams; Querystring: { limit?: string } }>) => {
      const { limit = '50' } = req.query;
      return db.select().from(activities)
        .where(and(eq(activities.entityType, 'oportunidad'), eq(activities.entityId, req.params.id)))
        .orderBy(desc(activities.createdAt)).limit(parseInt(limit));
    });
  });
}