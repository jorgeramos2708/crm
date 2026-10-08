import { simpleParser, ParsedMail } from "mailparser";
import { db } from "../db/index.js";
import { emailThreads, emailMessages, contactos } from "../db/schema.js";
import { eq, and, or, ilike, sql, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendEmail } from "./email.js";
import { logActivity } from "./automatizaciones.js";

interface InboundEmailResult {
  threadId: string;
  messageId: string;
}

function extractParticipants(
  parsed: ParsedMail,
): Array<{ email: string; name?: string; role: "from" | "to" | "cc" | "bcc" }> {
  const participants: Array<{
    email: string;
    name?: string;
    role: "from" | "to" | "cc" | "bcc";
  }> = [];

  if (parsed.from?.value) {
    parsed.from.value.forEach((addr: any) => {
      participants.push({
        email: addr.address,
        name: addr.name,
        role: "from",
      });
    });
  }

  ["to", "cc", "bcc"].forEach((role: string) => {
    const addresses = (parsed as any)[role]?.value;
    if (addresses) {
      addresses.forEach((addr: any) => {
        participants.push({
          email: addr.address,
          name: addr.name,
          role: role as "to" | "cc" | "bcc",
        });
      });
    }
  });

  return participants;
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

async function findOrCreateThread(
  tenantId: string,
  parsed: ParsedMail,
  source: "smtp" | "graph" | "imap",
): Promise<{ threadId: string; isNew: boolean }> {
  const messageId = parsed.messageId || "";
  const inReplyTo = parsed.inReplyTo || "";
  const references = parsed.references || [];

  // 1. Try to find existing thread by Message-ID, In-Reply-To, or References
  const searchIds = [messageId, ...references];
  if (inReplyTo) searchIds.unshift(inReplyTo);

  for (const refId of searchIds) {
    if (!refId) continue;
    const [existing] = await db
      .select()
      .from(emailMessages)
      .where(
        and(
          eq(emailMessages.messageId, refId),
          eq(emailMessages.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (existing) {
      return { threadId: existing.threadId, isNew: false };
    }
  }

  // 2. Try to find by subject similarity (fallback)
  const subject = parsed.subject || "(sin asunto)";
  const subjectFrag = (parsed.subject || "")
    .substring(0, 50)
    .replace(/[%_\\]/g, "\\$&");
  const [existingThread] = await db
    .select()
    .from(emailThreads)
    .where(
      and(
        eq(emailThreads.tenantId, tenantId),
        ilike(emailThreads.subject, `%${subjectFrag}%`),
      ),
    )
    .orderBy(desc(emailThreads.lastMessageAt))
    .limit(1);

  if (existingThread) {
    // Check if participants match (at least one common email)
    const parsedParticipants = extractParticipants(parsed);
    const threadParticipants = existingThread.participants as Array<{
      email: string;
    }>;
    const hasCommonParticipant = parsedParticipants.some((p) =>
      threadParticipants.some(
        (tp) => normalizeEmail(tp.email) === normalizeEmail(p.email),
      ),
    );

    if (hasCommonParticipant) {
      return { threadId: existingThread.id, isNew: false };
    }
  }

  // 3. Create new thread
  const participants = extractParticipants(parsed);
  const [newThread] = await db
    .insert(emailThreads)
    .values({
      tenantId,
      subject: parsed.subject || "(sin asunto)",
      participants,
      lastMessageAt: new Date(),
      messageCount: 1,
      isRead: false,
      isArchived: false,
    })
    .returning({ id: emailThreads.id });

  return { threadId: newThread.id, isNew: true };
}

async function saveMessage(
  tenantId: string,
  threadId: string,
  parsed: ParsedMail,
  direction: "inbound" | "outbound",
  source: "smtp" | "graph" | "imap",
): Promise<string> {
  const messageId =
    parsed.messageId ||
    `${Date.now()}.${Math.random().toString(36).substring(7)}@local`;

  const p = parsed as any;

  const [message] = await db
    .insert(emailMessages)
    .values({
      threadId,
      tenantId,
      messageId:
        parsed.messageId ||
        `${Date.now()}.${Math.random().toString(36).substring(7)}@local`,
      inReplyTo: parsed.inReplyTo || null,
      references: parsed.references || [],
      fromEmail: p.from?.value?.[0]?.address || "",
      fromName: p.from?.value?.[0]?.name || null,
      toEmails:
        p.to?.value?.map((a: any) => ({ address: a.address, name: a.name })) ||
        [],
      ccEmails:
        p.cc?.value?.map((a: any) => ({ address: a.address, name: a.name })) ||
        [],
      bccEmails:
        p.bcc?.value?.map((a: any) => ({ address: a.address, name: a.name })) ||
        [],
      subject: parsed.subject || "(sin asunto)",
      bodyText: parsed.text || null,
      bodyHtml: parsed.html || null,
      direction: direction,
      status: "received",
      receivedAt: new Date(),
      headers: parsed.headers as any,
    })
    .returning({ id: emailMessages.id });

  // Update thread
  await db
    .update(emailThreads)
    .set({
      lastMessageAt: new Date(),
      messageCount: sql.raw(`${emailThreads.messageCount} + 1`),
      updatedAt: new Date(),
    })
    .where(eq(emailThreads.id, threadId));

  return messageId;
}

async function matchContact(
  email: string,
  tenantId: string,
): Promise<string | null> {
  const normalized = normalizeEmail(email);
  const [contact] = await db
    .select({ id: contactos.id })
    .from(contactos)
    .where(
      and(
        sql`lower(${contactos.email}) = ${normalized}`,
        eq(contactos.tenantId, tenantId),
      ),
    )
    .limit(1);
  return contact?.id || null;
}

export async function processInboundEmail(
  raw: string,
  source: "smtp" | "graph" | "imap",
  tenantId = "default",
): Promise<{ threadId: string; messageId: string }> {
  const parsed = await simpleParser(raw);

  // 1. Find or create thread
  const { threadId, isNew } = await findOrCreateThread(
    tenantId,
    parsed,
    source,
  );

  // 2. Save message
  const messageId = await saveMessage(
    tenantId,
    threadId,
    parsed,
    "inbound",
    source,
  );

  // 3. Match contacts and link
  const fromEmail = parsed.from?.value?.[0]?.address;
  if (fromEmail) {
    const contactId = await matchContact(fromEmail, tenantId);
    // Could update thread participants with contact info
  }

  // 4. Log activity
  await logActivity(
    "email_received",
    `Email recibido: ${parsed.subject || "(sin asunto)"}`,
    "email_thread",
    threadId,
    undefined,
    { messageId: parsed.messageId, source },
  );

  // 5. Update thread lastMessageAt and messageCount
  await db
    .update(emailThreads)
    .set({
      lastMessageAt: new Date(),
      messageCount: sql.raw(`${emailThreads.messageCount} + 1`),
      updatedAt: new Date(),
    })
    .where(eq(emailThreads.id, threadId));

  return { threadId, messageId };
}

export async function processOutboundEmail(
  threadId: string,
  to: string[],
  subject: string,
  html: string,
  text: string | undefined,
  fromEmail: string,
  fromName: string | undefined,
  campaignId?: string,
  contactoId?: string,
  tenantId = "default",
): Promise<string> {
  // Create a ParsedMail-like object for outbound
  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(7)}@local>`;
  const outboundParsed = {
    messageId,
    from: { value: [{ address: fromEmail, name: fromName }] },
    to: { value: to.map((e) => ({ address: e })) },
    subject: subject,
    html,
    text: text || "",
    inReplyTo: null,
    references: [],
    cc: { value: [] },
    bcc: { value: [] },
    headers: {},
  } as unknown as ParsedMail;

  // Save outbound message
  await saveMessage(tenantId, threadId, outboundParsed, "outbound", "smtp");

  // Update thread
  await db
    .update(emailThreads)
    .set({
      lastMessageAt: new Date(),
      messageCount: sql.raw(`${emailThreads.messageCount} + 1`),
      updatedAt: new Date(),
    })
    .where(eq(emailThreads.id, threadId));

  return messageId;
}
