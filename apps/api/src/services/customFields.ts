import { db } from '../db/index.js';
import { customFields } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export const ENTIDADES = ['contacto', 'empresa', 'oportunidad'] as const;
export const TIPOS = ['texto', 'numero', 'fecha', 'booleano', 'seleccion'] as const;

export async function getActiveFields(entidad: string) {
  return db.select().from(customFields)
    .where(and(eq(customFields.entidad, entidad), eq(customFields.activo, true)))
    .orderBy(customFields.orden);
}

export function coerce(tipo: string, value: unknown, opciones: string[]): { ok: boolean; value?: unknown } {
  if (value === null || value === undefined || value === '') return { ok: true, value: null };
  switch (tipo) {
    case 'numero': {
      const n = Number(value);
      return Number.isFinite(n) ? { ok: true, value: n } : { ok: false };
    }
    case 'booleano': {
      if (value === true || value === 'true' || value === 1 || value === '1') return { ok: true, value: true };
      if (value === false || value === 'false' || value === 0 || value === '0') return { ok: true, value: false };
      return { ok: false };
    }
    case 'fecha': {
      const d = new Date(value as string);
      return isNaN(d.getTime()) ? { ok: false } : { ok: true, value: d.toISOString().slice(0, 10) };
    }
    case 'seleccion': {
      return opciones.includes(String(value)) ? { ok: true, value: String(value) } : { ok: false };
    }
    default:
      return { ok: true, value: String(value) };
  }
}

// Valida y sanea `custom` según definiciones activas. Ignora claves desconocidas.
export async function sanitizeCustom(entidad: string, input: unknown): Promise<{ custom: Record<string, unknown>; errors: string[] }> {
  const defs = await getActiveFields(entidad);
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const custom: Record<string, unknown> = {};
  const errors: string[] = [];
  for (const d of defs) {
    const v = src[d.clave];
    if (v === undefined || v === null || v === '') {
      if (d.requerido) errors.push(`Campo "${d.etiqueta}" requerido`);
      continue;
    }
    const r = coerce(d.tipo, v, (d.opciones as string[]) || []);
    if (!r.ok) errors.push(`Campo "${d.etiqueta}" inválido para tipo ${d.tipo}`);
    else custom[d.clave] = r.value;
  }
  return { custom, errors };
}
