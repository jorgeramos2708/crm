import { db } from '../db/index.js';
import { permisos } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

export const MODULOS = [
  'contactos',
  'empresas',
  'oportunidades',
  'productos',
  'presupuestos',
  'tareas',
  'correos',
  'calendario',
  'campañas',
  'plantillas',
  'listas',
  'automatizaciones',
  'actividades',
  'reportes',
] as const;

export type Modulo = (typeof MODULOS)[number];
export type Accion = 'r' | 'w' | 'x';

export async function getPermisosMap(userId: string, role?: string): Promise<Record<string, { r: boolean; w: boolean; x: boolean }>> {
  const map: Record<string, { r: boolean; w: boolean; x: boolean }> = {};
  for (const m of MODULOS) {
    map[m] = role === 'admin'
      ? { r: true, w: true, x: true }
      : { r: false, w: false, x: false };
  }
  if (role === 'admin') return map;
  const rows = await db.select().from(permisos).where(eq(permisos.userId, userId));
  for (const p of rows) {
    if (map[p.modulo]) map[p.modulo] = { r: p.r, w: p.w, x: p.x };
  }
  return map;
}

export async function tienePermiso(userId: string, role: string | undefined, modulo: string, accion: Accion): Promise<boolean> {
  if (role === 'admin') return true;
  const rows = await db.select().from(permisos).where(eq(permisos.userId, userId));
  const found = rows.find(r => r.modulo === modulo);
  return !!found?.[accion];
}

export function requirePermiso(modulo: string, accion: Accion) {
  return async (request: any, reply: any) => {
    await authMiddleware(request, reply);
    if (reply.sent) return;
    const ok = await tienePermiso(request.user.id, request.user?.role, modulo, accion);
    if (!ok) {
      return reply.code(403).send({ error: 'Sin permiso para este módulo', code: 'FORBIDDEN' });
    }
  };
}
