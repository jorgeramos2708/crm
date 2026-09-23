import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config.js";
import { db } from "../db/index.js";
import { emailTracking } from "../db/schema.js";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  campaignId?: string | null;
  contactoId?: string | null;
}

export interface SendEmailResult {
  ok: boolean;
  dryRun: boolean;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export function buildTrackingId(
  campaignId?: string | null,
  contactoId?: string | null,
): string | null {
  if (!campaignId) return null;
  return contactoId ? `${campaignId}.${contactoId}` : campaignId;
}

export function parseTrackingId(raw: string): {
  campaignId: string | null;
  contactoId: string | null;
} {
  const [campaignId, contactoId] = String(raw || "").split(".");
  return {
    campaignId: campaignId || null,
    contactoId: contactoId || null,
  };
}

export function injectOpenPixel(
  html: string,
  trackingId: string,
  publicUrl: string,
): string {
  const base = publicUrl.replace(/\/$/, "");
  const pixel = `<img src="${base}/api/track/open/${trackingId}" width="1" height="1" alt="" style="display:none" />`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return html + pixel;
}

export function injectClickTracking(
  html: string,
  trackingId: string,
  publicUrl: string,
): string {
  const base = publicUrl.replace(/\/$/, "");
  return html.replace(/href="(https?:\/\/[^"]+)"/gi, (match, url: string) => {
    if (url.includes("/api/track/")) return match;
    const target = `${base}/api/track/click/${trackingId}?url=${encodeURIComponent(url)}`;
    return `href="${target}"`;
  });
}

export function applyTracking(
  html: string,
  trackingId: string,
  publicUrl: string,
): string {
  return injectOpenPixel(
    injectClickTracking(html, trackingId, publicUrl),
    trackingId,
    publicUrl,
  );
}

export async function logEmailEvent(
  tipo: "sent" | "open" | "click" | "unsubscribe" | "bounce",
  campaignId: string | null,
  contactoId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await db.insert(emailTracking).values({
    campaignId,
    contactoId,
    tipo,
    metadata,
  });
}

export async function sendEmail(
  opts: SendEmailOptions,
): Promise<SendEmailResult> {
  let { html } = opts;
  const trackingId = buildTrackingId(opts.campaignId, opts.contactoId);
  if (trackingId) {
    html = applyTracking(html, trackingId, env.GRAPH_PUBLIC_URL);
  }

  const from =
    opts.from || env.SMTP_FROM || (env.SMTP_USER ? env.SMTP_USER : undefined);

  const transport = getTransporter();
  if (!transport) {
    console.log(
      `[EMAIL:dry-run] To: ${opts.to}, Subject: ${opts.subject}, campaign=${opts.campaignId ?? "-"}`,
    );
    if (opts.campaignId) {
      await logEmailEvent("sent", opts.campaignId, opts.contactoId ?? null, {
        to: opts.to,
        dryRun: true,
      });
    }
    return { ok: true, dryRun: true };
  }

  await transport.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html,
    text: opts.text,
    replyTo: opts.replyTo,
  });

  if (opts.campaignId) {
    await logEmailEvent("sent", opts.campaignId, opts.contactoId ?? null, {
      to: opts.to,
    });
  }

  return { ok: true, dryRun: false };
}
