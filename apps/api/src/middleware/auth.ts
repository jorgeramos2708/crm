import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../services/auth.js';

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

function getToken(cookies: Record<string, string | undefined> | undefined): string | null {
  if (!cookies) return null;
  const token = cookies.token;
  if (token === undefined || token === null) return null;
  return token;
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // 1) API pública: Authorization: Bearer crm_...
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const { verifyApiToken } = await import('../services/webhooks.js');
      const { db } = await import('../db/index.js');
      const { users } = await import('../db/schema.js');
      const { eq } = await import('drizzle-orm');
      const t = await verifyApiToken(authHeader.slice(7));
      if (!t) return reply.code(401).send({ error: 'API token inválido', code: 'INVALID_TOKEN' });
      const [u] = await db.select().from(users).where(eq(users.id, t.userId)).limit(1);
      if (!u || !u.activo) return reply.code(401).send({ error: 'Usuario inválido', code: 'INVALID_TOKEN' });
      request.user = { id: u.id, email: u.email, role: u.role, name: u.name };
      return;
    } catch {
      return reply.code(401).send({ error: 'Token inválido', code: 'INVALID_TOKEN' });
    }
  }
  // 2) Sesión web: cookie JWT
  const token = getToken(request.cookies);
  if (!token) {
    return reply.code(401).send({ error: 'No autorizado', code: 'UNAUTHORIZED' });
  }
  try {
    const { verifyToken } = await import('../services/auth.js');
    // token is guaranteed to be string here due to the check above
    const decoded = verifyToken(token!);
    request.user = decoded;
  } catch {
    return reply.code(401).send({ error: 'Token inválido', code: 'INVALID_TOKEN' });
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authMiddleware(request, reply);
    if (reply.sent) return;
    const userRole = request.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return reply.code(403).send({ error: 'Sin permisos', code: 'FORBIDDEN' });
    }
  };
}