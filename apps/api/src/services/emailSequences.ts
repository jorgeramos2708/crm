import { db } from "../db/index.js";
import {
  emailSequences,
  emailSequenceEnrollments,
  emailTemplates,
  emailCampaigns,
  contactos,
  contactListMembers,
  emailSubscriptions,
  emailTracking,
} from "../db/schema.js";
import { eq, and, sql, desc, or } from "drizzle-orm";
import { sendEmail } from "./email.js";
import { scheduleAction, scheduleSequenceStep } from "./queues.js";
import { renderTemplate } from "../services/automatizaciones.js";

interface SequenceStep {
  delayDays: number;
  delayHours: number;
  templateId: string;
  conditions?: Array<{ campo: string; operador: string; valor: any }>;
}

interface SequenceConfig {
  nombre: string;
  descripcion?: string;
  trigger:
    | "contact_added"
    | "stage_changed"
    | "email_opened"
    | "email_clicked"
    | "manual";
  condiciones: Array<{ campo: string; operador: string; valor: any }>;
  pasos: SequenceStep[];
  activo: boolean;
}

export async function createSequence(
  config: SequenceConfig,
  userId: string,
  tenantId: string,
) {
  const [sequence] = await db
    .insert(emailSequences)
    .values({
      tenantId,
      nombre: config.nombre,
      descripcion: config.descripcion,
      evento: config.trigger,
      condiciones: config.condiciones,
      acciones: config.pasos as any,
      activo: config.activo,
    })
    .returning();
  return sequence;
}

export async function enrollInSequence(
  sequenceId: string,
  contactoId: string,
  userId?: string,
) {
  const [existing] = await db
    .select()
    .from(emailSequenceEnrollments)
    .where(
      and(
        eq(emailSequenceEnrollments.sequenceId, sequenceId),
        eq(emailSequenceEnrollments.contactoId, contactoId),
      ),
    )
    .limit(1);

  if (existing) {
    return { enrolled: false, reason: "already_enrolled" };
  }

  const [sequence] = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.id, sequenceId))
    .limit(1);

  if (!sequence || !sequence.activo) {
    return { enrolled: false, reason: "sequence_not_found_or_inactive" };
  }

  const [enrollment] = await db
    .insert(emailSequenceEnrollments)
    .values({
      sequenceId,
      contactoId,
      pasoActual: 0,
      estado: "active",
    })
    .returning();

  // Schedule first step
  const firstStep = (sequence.acciones as SequenceStep[])[0];
  if (firstStep) {
    const delayMs =
      (firstStep.delayDays * 24 + firstStep.delayHours) * 60 * 60 * 1000;
    await scheduleSequenceStep(
      sequenceId,
      enrollment.id,
      0,
      new Date(Date.now() + delayMs),
    );
  }

  return { enrolled: true, enrollment };
}

export async function processSequenceStep(enrollmentId: string) {
  const [enrollment] = await db
    .select()
    .from(emailSequenceEnrollments)
    .where(eq(emailSequenceEnrollments.id, enrollmentId))
    .limit(1);

  if (!enrollment || enrollment.estado !== "active") return;

  const [sequence] = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.id, enrollment.sequenceId))
    .limit(1);

  if (!sequence || !sequence.activo) {
    await db
      .update(emailSequenceEnrollments)
      .set({ estado: "paused" })
      .where(eq(emailSequenceEnrollments.id, enrollmentId));
    return;
  }

  const actions = sequence.acciones as SequenceStep[];
  const paso = actions[enrollment.pasoActual];
  if (!paso) {
    // Sequence completed
    await db
      .update(emailSequenceEnrollments)
      .set({ estado: "completed", actualizadoEn: new Date() })
      .where(eq(emailSequenceEnrollments.id, enrollmentId));
    return;
  }

  // Check conditions
  if (paso.conditions && paso.conditions.length > 0) {
    const [contact] = await db
      .select()
      .from(contactos)
      .where(eq(contactos.id, enrollment.contactoId))
      .limit(1);

    if (!contact) return;

    const conditionsMet = paso.conditions.every((cond: any) => {
      const fieldValue = getNestedValue(contact, cond.campo);
      return evaluateCondition(fieldValue, cond.operador, cond.valor);
    });

    if (!conditionsMet) {
      // Skip this step, move to next
      await advanceToNextStep(enrollmentId);
      return;
    }

    // Execute step
    if (paso.templateId) {
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, paso.templateId))
        .limit(1);

      if (template) {
        const [contact] = await db
          .select()
          .from(contactos)
          .where(eq(contactos.id, enrollment.contactoId))
          .limit(1);

        if (contact?.email) {
          const html = renderTemplate(template.contenidoHtml, {
            nombre: contact.nombre,
            email: contact.email,
          });
          const text = renderTemplate(template.contenidoTexto || "", {
            nombre: contact.nombre,
            email: contact.email,
          });

          await sendEmail({
            to: contact.email,
            subject: template.asunto,
            html,
            text,
            from: "CRM <noreply@crm.example.com>",
          });

          // Log activity
          await logEmailEvent("sent", null, enrollment.contactoId, {
            sequenceId: enrollment.sequenceId,
            step: enrollment.pasoActual,
          });
        }
      }
    }

    // Advance to next step
    await advanceToNextStep(enrollmentId);
  }
}

async function advanceToNextStep(enrollmentId: string) {
  const [enrollment] = await db
    .select()
    .from(emailSequenceEnrollments)
    .where(eq(emailSequenceEnrollments.id, enrollmentId))
    .limit(1);

  if (!enrollment) return;

  const [sequence] = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.id, enrollment.sequenceId))
    .limit(1);

  const nextStep = enrollment.pasoActual + 1;

  const pasos = (sequence?.acciones as SequenceStep[]) || [];

  if (nextStep >= pasos.length) {
    // Sequence completed
    await db
      .update(emailSequenceEnrollments)
      .set({ estado: "completed", actualizadoEn: new Date() })
      .where(eq(emailSequenceEnrollments.id, enrollmentId));
    return;
  }

  // Schedule next step
  const nextPaso = (sequence.acciones as SequenceStep[])[nextStep];
  const delayMs =
    (nextPaso.delayDays * 24 + nextPaso.delayHours) * 60 * 60 * 1000;

  await db
    .update(emailSequenceEnrollments)
    .set({ pasoActual: nextStep, actualizadoEn: new Date() })
    .where(eq(emailSequenceEnrollments.id, enrollmentId));

  if (delayMs > 0) {
    await scheduleSequenceStep(
      sequence.id,
      enrollmentId,
      nextStep,
      new Date(Date.now() + delayMs),
    );
  } else {
    // Execute immediately
    await processSequenceStep(enrollmentId);
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((obj, key) => obj?.[key], obj);
}

function evaluateCondition(
  fieldValue: any,
  operator: string,
  expectedValue: any,
): boolean {
  switch (operator) {
    case "equals":
      return fieldValue === expectedValue;
    case "not_equals":
      return fieldValue !== expectedValue;
    case "contains":
      return String(fieldValue || "")
        .toLowerCase()
        .includes(String(expectedValue).toLowerCase());
    case "not_contains":
      return !String(fieldValue || "")
        .toLowerCase()
        .includes(String(expectedValue).toLowerCase());
    case "greater_than":
      return Number(fieldValue) > Number(expectedValue);
    case "less_than":
      return Number(fieldValue) < Number(expectedValue);
    case "greater_equal":
      return Number(fieldValue) >= Number(expectedValue);
    case "less_equal":
      return Number(fieldValue) <= Number(expectedValue);
    case "in":
      return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
    case "not_in":
      return (
        Array.isArray(expectedValue) && !expectedValue.includes(fieldValue)
      );
    default:
      return false;
  }
}

async function logEmailEvent(
  tipo: "sent" | "open" | "click" | "unsubscribe",
  campaignId: string | null,
  contactoId: string | null,
  metadata: Record<string, any> = {},
) {
  await db.insert(emailTracking).values({
    campaignId: campaignId || null,
    contactoId: contactoId || null,
    tipo,
    metadata,
  });
}

export async function enrollContactInSequences(
  contactoId: string,
  trigger: string,
  context: any = {},
) {
  const sequences = await db
    .select()
    .from(emailSequences)
    .where(
      and(eq(emailSequences.evento, trigger), eq(emailSequences.activo, true)),
    );

  for (const sequence of sequences) {
    await enrollInSequence(sequence.id, contactoId);
  }
}
