import { db } from "../db/index.js";
import { leadScoringRules, contactos } from "../db/schema.js";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

export interface ScoringRule {
  campo: string;
  operador: string;
  valor: any;
  puntos: number;
}

export interface ScoringRuleSet {
  reglas: ScoringRule[];
}

export class LeadScoringEngine {
  static async evaluateContact(
    contactoId: string,
    tenantId: string,
  ): Promise<number> {
    const [contact] = await db
      .select()
      .from(contactos)
      .where(
        and(eq(contactos.id, contactoId), eq(contactos.tenantId, tenantId)),
      )
      .limit(1);

    if (!contact) return 0;

    const [activeRule] = await db
      .select()
      .from(leadScoringRules)
      .where(
        and(
          eq(leadScoringRules.tenantId, tenantId),
          eq(leadScoringRules.activo, true),
        ),
      )
      .limit(1);

    if (!activeRule) return 0;

    const rules = activeRule.reglas as ScoringRule[];
    let score = 0;

    for (const rule of rules) {
      const fieldValue = this.getNestedValue(contact, rule.campo);
      if (this.evaluateCondition(fieldValue, rule.operador, rule.valor)) {
        score += rule.puntos;
      }
    }

    await db
      .update(contactos)
      .set({ leadScore: score, updatedAt: new Date() })
      .where(eq(contactos.id, contactoId));

    return score;
  }

  static async evaluateAllContacts(
    tenantId: string,
  ): Promise<{ processed: number; updated: number }> {
    const [activeRule] = await db
      .select()
      .from(leadScoringRules)
      .where(
        and(
          eq(leadScoringRules.tenantId, tenantId),
          eq(leadScoringRules.activo, true),
        ),
      )
      .limit(1);

    if (!activeRule) return { processed: 0, updated: 0 };

    const rules = activeRule.reglas as ScoringRule[];

    const contacts = await db
      .select()
      .from(contactos)
      .where(eq(contactos.tenantId, tenantId));

    let updated = 0;

    for (const contact of contacts) {
      let score = 0;

      for (const rule of rules) {
        const fieldValue = this.getNestedValue(contact, rule.campo);
        if (this.evaluateCondition(fieldValue, rule.operador, rule.valor)) {
          score += rule.puntos;
        }
      }

      if (score !== contact.leadScore) {
        await db
          .update(contactos)
          .set({ leadScore: score, updatedAt: new Date() })
          .where(eq(contactos.id, contact.id));
        updated++;
      }
    }

    return { processed: contacts.length, updated };
  }

  static getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((obj, key) => obj?.[key], obj);
  }

  static evaluateCondition(
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
        return (
          Array.isArray(expectedValue) && expectedValue.includes(fieldValue)
        );
      case "not_in":
        return (
          Array.isArray(expectedValue) && !expectedValue.includes(fieldValue)
        );
      case "is_empty":
        return (
          fieldValue === null || fieldValue === undefined || fieldValue === ""
        );
      case "is_not_empty":
        return (
          fieldValue !== null && fieldValue !== undefined && fieldValue !== ""
        );
      case "starts_with":
        return String(fieldValue || "").startsWith(String(expectedValue));
      case "ends_with":
        return String(fieldValue || "").endsWith(String(expectedValue));
      default:
        return false;
    }
  }
}

export class LeadScoringService {
  static async createRuleSet(data: {
    tenantId: string;
    userId: string;
    nombre: string;
    descripcion?: string;
    reglas: ScoringRule[];
    activo?: boolean;
  }) {
    const [ruleSet] = await db
      .insert(leadScoringRules)
      .values(data)
      .returning();

    return ruleSet;
  }

  static async getSchedule(id: string) {
    const [schedule] = await db
      .select()
      .from(leadScoringRules)
      .where(eq(leadScoringRules.id, id))
      .limit(1);

    return schedule || null;
  }

  static async listRuleSets(tenantId: string, userId?: string) {
    const conditions = [eq(leadScoringRules.tenantId, tenantId)];
    if (userId) conditions.push(eq(leadScoringRules.userId, userId));

    return db
      .select()
      .from(leadScoringRules)
      .where(and(...conditions))
      .orderBy(desc(leadScoringRules.createdAt));
  }

  static async updateSchedule(
    id: string,
    data: Partial<{
      nombre: string;
      descripcion: string;
      reglas: ScoringRule[];
      activo: boolean;
    }>,
  ) {
    const updateData = { ...data, updatedAt: new Date() };

    const [ruleSet] = await db
      .update(leadScoringRules)
      .set(updateData)
      .where(eq(leadScoringRules.id, id))
      .returning();

    return ruleSet || null;
  }

  static async deleteRuleSet(id: string) {
    await db.delete(leadScoringRules).where(eq(leadScoringRules.id, id));

    return { ok: true };
  }

  static async recalculateAllScores(tenantId: string) {
    return LeadScoringEngine.evaluateAllContacts(tenantId);
  }
}
