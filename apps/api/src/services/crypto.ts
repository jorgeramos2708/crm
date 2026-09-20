import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '../config.js';

const PREFIX = 'enc:v1:';

function getKey(): Buffer {
  const raw = env.MICROSOFT_CRYPTO_KEY;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  if (raw.length >= 16) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ MICROSOFT_CRYPTO_KEY no es hex de 32 bytes; usando clave de desarrollo. Cámbiala en producción.');
    const buf = Buffer.alloc(32);
    Buffer.from(raw).copy(buf);
    return buf;
  }
  const buf = Buffer.alloc(32);
  Buffer.from('crm-dev-only-change-in-production-0000').copy(buf);
  // eslint-disable-next-line no-console
  console.warn('⚠️ MICROSOFT_CRYPTO_KEY no configurada; usando clave de desarrollo. Cámbiala en producción.');
  return buf;
}

let cachedKey: Buffer | null = null;
function key(): Buffer {
  if (!cachedKey) cachedKey = getKey();
  return cachedKey;
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decrypt(payload: string): string {
  if (!payload.startsWith(PREFIX)) return payload; // compat: valores antiguos en claro
  const [ivHex, tagHex, dataHex] = payload.slice(PREFIX.length).split(':');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
}

export function isEncrypted(payload: string | null | undefined): boolean {
  return !!payload && payload.startsWith(PREFIX);
}
