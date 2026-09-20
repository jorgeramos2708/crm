import fetch from 'isomorphic-fetch';
import { db } from '../db/index.js';
import { redis } from './redis.js';
import { googleConfig, googleTokens } from '../db/schema.js';
import { encrypt, decrypt } from './crypto.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

if (!globalThis.fetch) {
  globalThis.fetch = fetch as any;
}

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
];

interface GoogleCfg {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export async function getGoogleConfig(): Promise<GoogleCfg | null> {
  const [c] = await db.select().from(googleConfig).where(eq(googleConfig.activo, true)).limit(1);
  if (!c) return null;
  return {
    clientId: c.clientId,
    clientSecret: decrypt(c.clientSecret),
    redirectUri: c.redirectUri,
    scopes: (c.scopes as string[]).length ? (c.scopes as string[]) : GOOGLE_SCOPES,
  };
}

export function buildGoogleState(userId: string): string {
  return Buffer.from(JSON.stringify({ userId, nonce: randomUUID() })).toString('base64url');
}

export function parseGoogleState(state: string): { userId: string; nonce: string } | null {
  try {
    const d = JSON.parse(Buffer.from(state, 'base64url').toString());
    return d?.userId ? d : null;
  } catch {
    return null;
  }
}

export async function getGoogleAuthUrl(state: string): Promise<string | null> {
  const cfg = await getGoogleConfig();
  if (!cfg) return null;
  const p = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: 'code',
    scope: cfg.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

export async function exchangeGoogleCode(cfg: GoogleCfg, code: string) {
  const p = new URLSearchParams({
    client_id: cfg.clientId, client_secret: cfg.clientSecret, code,
    redirect_uri: cfg.redirectUri, grant_type: 'authorization_code',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString(),
  });
  if (!res.ok) throw new Error(`Google token exchange: ${await res.text()}`);
  const d: any = await res.json();
  return {
    accessToken: d.access_token as string,
    refreshToken: d.refresh_token as string,
    expiresAt: new Date(Date.now() + d.expires_in * 1000),
    scopes: (d.scope || '').split(' ').filter(Boolean),
  };
}

export async function storeGoogleTokens(userId: string, t: { accessToken: string; refreshToken: string; expiresAt: Date; scopes: string[] }) {
  if (!t.refreshToken) {
    // Google solo devuelve refresh_token la primera vez; conservar el existente
    const [ex] = await db.select().from(googleTokens).where(eq(googleTokens.userId, userId)).limit(1);
    if (ex) t.refreshToken = decrypt(ex.refreshToken);
  }
  await db.insert(googleTokens).values({
    userId, accessToken: encrypt(t.accessToken), refreshToken: encrypt(t.refreshToken),
    expiresAt: t.expiresAt, scopes: t.scopes,
  }).onConflictDoUpdate({
    target: [googleTokens.userId],
    set: {
      accessToken: encrypt(t.accessToken), refreshToken: encrypt(t.refreshToken),
      expiresAt: t.expiresAt, scopes: t.scopes, updatedAt: new Date(),
    },
  });
}

export async function getValidGoogleAccessToken(userId: string): Promise<string | null> {
  const [rec] = await db.select().from(googleTokens).where(eq(googleTokens.userId, userId)).limit(1);
  if (!rec) return null;
  if (new Date(rec.expiresAt).getTime() - Date.now() > 60_000) return decrypt(rec.accessToken);

  const lockKey = `lock:google-refresh:${userId}`;
  let locked = false;
  try { locked = (await redis.set(lockKey, '1', 'EX', 30, 'NX')) === 'OK'; } catch { /* sin lock */ }
  try {
    const cfg = await getGoogleConfig();
    if (!cfg) return null;
    const p = new URLSearchParams({
      client_id: cfg.clientId, client_secret: cfg.clientSecret,
      refresh_token: decrypt(rec.refreshToken), grant_type: 'refresh_token',
    });
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString(),
    });
    if (!res.ok) throw new Error(await res.text());
    const d: any = await res.json();
    const accessToken = d.access_token as string;
    await db.update(googleTokens).set({
      accessToken: encrypt(accessToken),
      expiresAt: new Date(Date.now() + d.expires_in * 1000),
      updatedAt: new Date(),
    }).where(eq(googleTokens.userId, userId));
    return accessToken;
  } catch (e) {
    console.error('Google refresh failed:', (e as Error)?.message || e);
    await db.delete(googleTokens).where(eq(googleTokens.userId, userId));
    return null;
  } finally {
    if (locked) await redis.del(lockKey).catch(() => {});
  }
}

async function gapi(userId: string, path: string, init?: any) {
  const token = await getValidGoogleAccessToken(userId);
  if (!token) throw new Error('No conectado a Google');
  const res = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`Google API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<any>;
}

function header(msg: any, name: string): string {
  const h = (msg.payload?.headers || []).find((x: any) => x.name?.toLowerCase() === name);
  return h?.value || '';
}

export async function getGmailMessages(userId: string, opts: { q?: string; max?: number } = {}) {
  const q = new URLSearchParams({ maxResults: String(opts.max || 25), q: opts.q || '' });
  const list: any = await gapi(userId, `/gmail/v1/users/me/messages?${q.toString()}`);
  const items = await Promise.all((list.messages || []).map(async (m: any) => {
    const full: any = await gapi(userId, `/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`);
    return {
      id: full.id,
      subject: header(full, 'subject') || '(sin asunto)',
      from: { emailAddress: { address: header(full, 'from') } },
      receivedDateTime: new Date(Number(full.internalDate)).toISOString(),
      bodyPreview: full.snippet || '',
    };
  }));
  return items;
}

export async function sendGmail(userId: string, email: { to: string[]; subject: string; htmlBody: string; textBody?: string }) {
  const boundary = `crm${Date.now()}`;
  const bodyText = email.textBody || email.htmlBody.replace(/<[^>]+>/g, '');
  const raw = [
    `To: ${email.to.join(', ')}`,
    `Subject: ${email.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    bodyText,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    email.htmlBody,
    `--${boundary}--`,
  ].join('\r\n');
  const encoded = Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  await gapi(userId, '/gmail/v1/users/me/messages/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: encoded }),
  });
  return true;
}

export async function getGoogleProfile(userId: string) {
  try {
    return await gapi(userId, '/oauth2/v2/userinfo');
  } catch {
    return null;
  }
}

export async function getGoogleCalendar(userId: string, opts: { timeMin?: string; timeMax?: string; max?: number } = {}) {
  const q = new URLSearchParams({
    timeMin: opts.timeMin || new Date().toISOString(),
    ...(opts.timeMax ? { timeMax: opts.timeMax } : {}),
    maxResults: String(opts.max || 25),
    singleEvents: 'true',
    orderBy: 'startTime',
  });
  const data: any = await gapi(userId, `/calendar/v3/calendars/primary/events?${q.toString()}`);
  return (data.items || []).map((e: any) => ({
    id: e.id,
    subject: e.summary || '(sin título)',
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    location: e.location || '',
    link: e.htmlLink || '',
    provider: 'google',
  }));
}
