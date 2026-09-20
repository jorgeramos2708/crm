import { Client } from '@microsoft/microsoft-graph-client';
import fetch from 'isomorphic-fetch';
import { db } from '../db/index.js';
import { redis } from './redis.js';
import { microsoftGraphTokens, microsoftGraphSubscriptions, microsoftConfig } from '../db/schema.js';
import { encrypt, decrypt } from './crypto.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

if (!globalThis.fetch) {
  globalThis.fetch = fetch as any;
}

interface GraphConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  tenantId: string;
}

export async function getGlobalConfig(): Promise<GraphConfig | null> {
  const [config] = await db.select().from(microsoftConfig).where(
    eq(microsoftConfig.activo, true)
  ).limit(1);
  
  if (!config) return null;
  
  return {
    clientId: config.clientId,
    clientSecret: decrypt(config.clientSecret),
    redirectUri: config.redirectUri,
    scopes: config.scopes as string[],
    tenantId: config.tenantId
  };
}

function getAuthClient(accessToken: string): Client {
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

export async function getAuthUrl(state?: string): Promise<string | null> {
  const config = await getGlobalConfig();
  if (!config) return null;
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    response_mode: 'query',
    scope: config.scopes.join(' '),
    state: state || randomUUID(),
    prompt: 'select_account'
  });
  return `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

export function parseAuthState(state: string): { userId: string; nonce: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    if (!decoded?.userId) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function buildAuthState(userId: string): string {
  return Buffer.from(JSON.stringify({ userId, nonce: randomUUID() })).toString('base64url');
}

export async function exchangeCodeForTokens(config: GraphConfig, code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
}> {
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
    scope: config.scopes.join(' ')
  });

  const response = await fetch(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data: any = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scopes: data.scope.split(' ')
  };
}

export async function refreshAccessToken(config: GraphConfig, refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: config.scopes.join(' ')
  });

  const response = await fetch(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data: any = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || config.clientSecret,
    expiresAt: new Date(Date.now() + data.expires_in * 1000)
  };
}

export async function storeUserTokens(userId: string, tokens: {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
}): Promise<void> {
  await db.insert(microsoftGraphTokens).values({
    userId,
    accessToken: encrypt(tokens.accessToken),
    refreshToken: encrypt(tokens.refreshToken),
    expiresAt: tokens.expiresAt,
    scopes: tokens.scopes
  }).onConflictDoUpdate({
    target: [microsoftGraphTokens.userId],
    set: {
      accessToken: encrypt(tokens.accessToken),
      refreshToken: encrypt(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
      updatedAt: new Date()
    }
  });
}

async function readTokenRecord(userId: string) {
  const [rec] = await db.select().from(microsoftGraphTokens).where(
    eq(microsoftGraphTokens.userId, userId)
  ).limit(1);
  return rec || null;
}

export async function getValidUserAccessToken(userId: string): Promise<string | null> {
  let tokenRecord = await readTokenRecord(userId);

  if (!tokenRecord) return null;

  if (new Date(tokenRecord.expiresAt).getTime() - Date.now() > 60_000) {
    return decrypt(tokenRecord.accessToken);
  }

  // Lock anti-estampida: solo un proceso renueva; el resto re-lee tras 1s.
  // Si Redis no responde, se renueva sin lock (nunca se borran tokens por fallo de Redis).
  const lockKey = `lock:ms-refresh:${userId}`;
  let locked = false;
  let lockBroken = false;
  try {
    locked = (await redis.set(lockKey, '1', 'EX', 30, 'NX')) === 'OK';
  } catch {
    lockBroken = true;
  }
  if (!locked && !lockBroken) {
    await new Promise(r => setTimeout(r, 1000));
    tokenRecord = await readTokenRecord(userId);
    if (tokenRecord && new Date(tokenRecord.expiresAt).getTime() - Date.now() > 60_000) {
      return decrypt(tokenRecord.accessToken);
    }
    // Sigue expirado: intentar renovar igualmente
  }

  try {
    const config = await getGlobalConfig();
    if (!config) return null;

    const refreshed = await refreshAccessToken(config, decrypt(tokenRecord!.refreshToken));
    await db.update(microsoftGraphTokens)
      .set({
        accessToken: encrypt(refreshed.accessToken),
        refreshToken: encrypt(refreshed.refreshToken),
        expiresAt: refreshed.expiresAt,
        updatedAt: new Date()
      })
      .where(eq(microsoftGraphTokens.userId, userId));
    return refreshed.accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    await db.delete(microsoftGraphTokens).where(
      eq(microsoftGraphTokens.userId, userId)
    );
    return null;
  } finally {
    if (locked) await redis.del(lockKey).catch(() => {});
  }
}

export async function getUserGraphClient(userId: string): Promise<Client | null> {
  const accessToken = await getValidUserAccessToken(userId);
  if (!accessToken) return null;
  
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

export async function sendEmailViaGraph(userId: string, email: {
  to: string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  attachments?: Array<{ name: string; contentType: string; contentBytes: string }>;
}): Promise<boolean> {
  const client = await getUserGraphClient(userId);
  if (!client) throw new Error('No valid Microsoft Graph token for user');
  
  const message = {
    subject: email.subject,
    body: {
      contentType: 'HTML',
      content: email.htmlBody
    },
    toRecipients: email.to.map(addr => ({
      emailAddress: { address: addr }
    })),
    attachments: email.attachments?.map(att => ({
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: att.name,
      contentType: att.contentType,
      contentBytes: att.contentBytes
    })) || []
  };

  if (email.textBody) {
    (message as any).body = {
      contentType: 'Text',
      content: email.textBody
    };
  }

  try {
    await client.api('/me/sendMail').post({ message });
    return true;
  } catch (error) {
    console.error('Graph sendMail error:', error);
    throw error;
  }
}

export async function getUserEmails(userId: string, options: {
  folder?: string;
  top?: number;
  skip?: number;
  filter?: string;
  orderby?: string;
} = {}): Promise<any[]> {
  const client = await getUserGraphClient(userId);
  if (!client) throw new Error('No valid Microsoft Graph token for user');

  const { folder = 'inbox', top = 50, skip = 0, filter, orderby = 'receivedDateTime desc' } = options;
  
  let query = client.api(`/me/mailFolders('${folder}')/messages`).top(top).skip(skip).orderby(orderby);
  
  if (filter) {
    query = query.filter(filter);
  }

  const response = await query.get();
  return response.value || [];
}

export async function createUserSubscription(userId: string, resource: string, changeType: string, notificationUrl: string, clientState?: string): Promise<string | null> {
  const client = await getUserGraphClient(userId);
  if (!client) throw new Error('No valid Microsoft Graph token for user');

  const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days max

  try {
    const subscription = await client.api('/subscriptions').post({
      changeType,
      notificationUrl,
      resource,
      expirationDateTime: expiresAt.toISOString(),
      clientState: clientState || randomUUID()
    });

    await db.insert(microsoftGraphSubscriptions).values({
      userId,
      subscriptionId: subscription.id,
      resource,
      changeType,
      notificationUrl,
      expiresAt: new Date(subscription.expirationDateTime),
      clientState: subscription.clientState
    });

    return subscription.id;
  } catch (error) {
    console.error('Subscription creation error:', error);
    return null;
  }
}

export async function renewUserSubscription(subscriptionId: string): Promise<boolean> {
  const [sub] = await db.select().from(microsoftGraphSubscriptions).where(
    eq(microsoftGraphSubscriptions.subscriptionId, subscriptionId)
  ).limit(1);
  
  if (!sub) return false;

  const client = await getUserGraphClient(sub.userId);
  if (!client) return false;

  const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  try {
    await client.api(`/subscriptions/${subscriptionId}`).patch({
      expirationDateTime: expiresAt.toISOString()
    });

    await db.update(microsoftGraphSubscriptions)
      .set({ expiresAt, updatedAt: new Date() })
      .where(eq(microsoftGraphSubscriptions.subscriptionId, subscriptionId));

    return true;
  } catch (error) {
    console.error('Subscription renewal error:', error);
    return false;
  }
}

export async function deleteUserSubscription(subscriptionId: string): Promise<boolean> {
  const [sub] = await db.select().from(microsoftGraphSubscriptions).where(
    eq(microsoftGraphSubscriptions.subscriptionId, subscriptionId)
  ).limit(1);
  
  if (!sub) return false;

  const client = await getUserGraphClient(sub.userId);
  if (!client) return false;

  try {
    await client.api(`/subscriptions/${subscriptionId}`).delete();
    await db.delete(microsoftGraphSubscriptions).where(eq(microsoftGraphSubscriptions.subscriptionId, subscriptionId));
    return true;
  } catch (error) {
    console.error('Subscription deletion error:', error);
    return false;
  }
}

export async function getUserCalendar(userId: string, opts: { start?: string; end?: string; top?: number } = {}): Promise<any[]> {
  const client = await getUserGraphClient(userId);
  if (!client) throw new Error('No conectado a Microsoft');
  const start = opts.start || new Date().toISOString();
  const end = opts.end || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const res: any = await client.api('/me/calendarview')
    .query({ startDateTime: start, endDateTime: end })
    .select('id,subject,start,end,location,webLink')
    .top(opts.top || 25)
    .orderby('start/dateTime')
    .get();
  return (res.value || []).map((e: any) => ({
    id: e.id,
    subject: e.subject || '(sin título)',
    start: e.start?.dateTime,
    end: e.end?.dateTime,
    location: e.location?.displayName || '',
    link: e.webLink || '',
    provider: 'outlook',
  }));
}

export async function getUserProfile(userId: string): Promise<any> {
  const client = await getUserGraphClient(userId);
  if (!client) return null;

  try {
    return await client.api('/me').select('id,displayName,mail,userPrincipalName').get();
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
}

