import { db } from '../db/index.js';
import { automatizaciones, oportunidades, pipelineStages, emailTemplates, users, contactos, activities } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

interface Condition {
  campo: string;
  operador: string;
  valor: any;
}

interface Action {
  tipo: string;
  [key: string]: any;
}

interface TriggerContext {
  evento: string;
  oportunidadId?: string;
  stageId?: string;
  oldStageId?: string;
  userId?: string;
  [key: string]: any;
}

const operators: Record<string, (a: any, b: any) => boolean> = {
  equals: (a, b) => a === b,
  not_equals: (a, b) => a !== b,
  contains: (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
  not_contains: (a, b) => !String(a).toLowerCase().includes(String(b).toLowerCase()),
  greater_than: (a, b) => Number(a) > Number(b),
  less_than: (a, b) => Number(a) < Number(b),
  greater_equal: (a, b) => Number(a) >= Number(b),
  less_equal: (a, b) => Number(a) <= Number(b),
  in: (a, b) => Array.isArray(b) && b.includes(a),
  not_in: (a, b) => Array.isArray(b) && !b.includes(a),
};

function evaluateCondition(cond: Condition, context: TriggerContext): boolean {
  const { campo, operador, valor } = cond;
  const fn = operators[operador];
  if (!fn) return false;

  let fieldValue: any;
  const parts = campo.split('.');
  
  // Navigate nested object properties
  fieldValue = context;
  for (const part of parts) {
    if (fieldValue && typeof fieldValue === 'object' && part in fieldValue) {
      fieldValue = fieldValue[part];
    } else {
      fieldValue = undefined;
      break;
    }
  }

  return fn(fieldValue, valor);
}

function evaluateConditions(conditions: Condition[] | null | undefined, context: TriggerContext): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every(cond => evaluateCondition(cond, context));
}

async function executeAction(action: Action, context: TriggerContext): Promise<void> {
  const { tipo, ...params } = action;

  switch (tipo) {
    case 'send_email': {
      const { template, destinatario, emailCustom } = params;
      if (template) {
        const [tpl] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, template)).limit(1);
        if (tpl) {
          let toEmail = '';
          if (destinatario === 'propietario' && context.oportunidadId) {
            const [opp] = await db.select({ propietarioId: oportunidades.propietarioId }).from(oportunidades).where(eq(oportunidades.id, context.oportunidadId)).limit(1);
            if (opp?.propietarioId) {
              const [user] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, opp.propietarioId)).limit(1);
              toEmail = user?.email || '';
            }
          } else if (destinatario === 'contacto' && context.oportunidadId) {
            const [opp] = await db.select({ contactoId: oportunidades.contactoId }).from(oportunidades).where(eq(oportunidades.id, context.oportunidadId)).limit(1);
            if (opp?.contactoId) {
              const [contacto] = await db.select({ email: contactos.email }).from(contactos).where(eq(contactos.id, opp.contactoId)).limit(1);
              toEmail = contacto?.email || '';
            }
          }
          
          if (toEmail) {
            const html = renderTemplate(tpl.contenidoHtml, { ...context, ...emailCustom });
            const text = renderTemplate(tpl.contenidoTexto || '', { ...context, ...emailCustom });
            await sendEmail({ to: toEmail, subject: tpl.asunto, html, text });
            await logActivity('email_sent', `Email enviado: ${tpl.nombre}`, 'oportunidad', context.oportunidadId || '', context.userId, { template: tpl.nombre, to: toEmail });
          }
        }
      }
      break;
    }

    case 'create_task': {
      const { titulo, descripcion, asignadoA } = params;
      // Create activity as task
      await logActivity('task_created', titulo, 'oportunidad', context.oportunidadId || '', context.userId, { descripcion, asignadoA });
      break;
    }

    case 'update_field': {
      const { campo, valor } = params;
      if (context.oportunidadId) {
        await db.update(oportunidades).set({ [campo]: valor, updatedAt: new Date() }).where(eq(oportunidades.id, context.oportunidadId));
      }
      break;
    }

    case 'move_stage': {
      const { stageId } = params;
      if (context.oportunidadId && stageId) {
        await db.update(oportunidades).set({ stageId, updatedAt: new Date() }).where(eq(oportunidades.id, context.oportunidadId));
      }
      break;
    }

    case 'webhook': {
      const { url, method = 'POST', headers = {}, body } = params;
      try {
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(body || context)
        });
      } catch (e) {
        console.error('Webhook error:', e);
      }
      break;
    }

    case 'notify': {
      const { mensaje, tipo = 'info' } = params;
      await logActivity('notification', mensaje, 'oportunidad', context.oportunidadId || '', context.userId, { tipo });
      break;
    }
  }
}

function renderTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
}

async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }): Promise<void> {
  console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
  // TODO: Integrate with real email provider (nodemailer, sendgrid, etc.)
}

async function logActivity(tipo: string, titulo: string, entityType: string, entityId: string, userId?: string, metadata?: any): Promise<void> {
  await db.insert(activities).values({ tipo, titulo, entityType, entityId, userId, metadata: metadata || {} });
}

export async function processAutomatizaciones(context: TriggerContext): Promise<void> {
  console.log('[AUTOMATIZACIONES] Processing event:', context.evento, 'for oportunidad:', context.oportunidadId);
  const autos = await db.select().from(automatizaciones).where(and(
    eq(automatizaciones.evento, context.evento),
    eq(automatizaciones.activo, true)
  ));
  console.log('[AUTOMATIZACIONES] Found', autos.length, 'active automatizaciones for event');

  for (const auto of autos) {
    const conditions = auto.condiciones as Condition[];
    const matches = evaluateConditions(conditions, context);
    console.log('[AUTOMATIZACIONES] Automation', auto.nombre, 'conditions match:', matches);
    if (matches) {
      const actions = auto.acciones as Action[];
      for (const action of actions) {
        if (action.tipo && action.delay) {
          console.log('[AUTOMATIZACIONES] Scheduling delayed action:', action.tipo, 'delay:', action.delay);
          setTimeout(() => executeAction(action, context), action.delay * 1000);
        } else {
          console.log('[AUTOMATIZACIONES] Executing action:', action.tipo);
          await executeAction(action, context);
        }
      }
    }
  }
}

export { evaluateCondition, evaluateConditions, executeAction, renderTemplate, sendEmail, logActivity };