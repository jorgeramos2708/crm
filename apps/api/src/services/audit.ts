import { createHash } from "crypto";
import { db } from "../db";
import { auditLog } from "../db/schema";
import { eq, desc, sql, and, count } from "drizzle-orm";

interface AuditEvent {
  tenantId: string;
  eventType: string;
  eventCategory: "data" | "auth" | "access" | "admin" | "security";
  actorType: "user" | "system" | "api" | "webhook";
  actorId?: string;
  actorIp?: string;
  actorUserAgent?: string;
  targetType?: string;
  targetId?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  changedFields?: string[];
  metadata?: Record<string, any>;
  riskLevel?: "low" | "medium" | "high" | "critical";
}

export class AuditService {
  private static instance: AuditService;
  private buffer: AuditEvent[] = [];
  private flushInterval: NodeJS.Timeout;

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  private constructor() {
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  async log(event: AuditEvent): Promise<string> {
    const [lastEntry] = await db
      .select({ currentHash: auditLog.currentHash })
      .from(auditLog)
      .where(eq(auditLog.tenantId, event.tenantId))
      .orderBy(desc(auditLog.timestamp))
      .limit(1);

    const previousHash = lastEntry?.currentHash || "0".repeat(64);

    const eventData = {
      ...event,
      previousHash,
      timestamp: new Date().toISOString(),
    };

    const currentHash = this.computeHash(eventData);

    const eventId = crypto.randomUUID();

    this.buffer.push({
      ...event,
      eventId,
      previousHash,
      currentHash,
      timestamp: new Date(),
    } as any);

    return eventId;
  }

  private computeHash(data: any): string {
    const hash = createHash("sha256");
    hash.update(JSON.stringify(data, Object.keys(data).sort()));
    return hash.digest("hex");
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const events = this.buffer.splice(0, this.buffer.length);

    try {
      await db.insert(auditLog).values(
        events.map((e) => ({
          tenantId: e.tenantId,
          eventId: e.eventId,
          eventType: e.eventType,
          eventCategory: e.eventCategory,
          actorType: e.actorType,
          actorId: e.actorId,
          actorIp: e.actorIp,
          actorUserAgent: e.actorUserAgent,
          targetType: e.targetType,
          targetId: e.targetId,
          before: e.before,
          after: e.after,
          changedFields: e.changedFields,
          metadata: e.metadata,
          riskLevel: e.riskLevel,
          previousHash: e.previousHash,
          currentHash: e.currentHash,
          timestamp: e.timestamp,
        })),
      );
    } catch (error) {
      console.error("Audit flush failed:", error);
      this.buffer.unshift(...this.buffer.splice(0, this.buffer.length));
    }
  }

  async query(filters: {
    tenantId: string;
    eventType?: string;
    actorId?: string;
    targetType?: string;
    targetId?: string;
    eventCategory?: string;
    riskLevel?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [eq(auditLog.tenantId, filters.tenantId)];

    if (filters.eventType)
      conditions.push(eq(auditLog.eventType, filters.eventType));
    if (filters.actorId) conditions.push(eq(auditLog.actorId, filters.actorId));
    if (filters.targetType)
      conditions.push(eq(auditLog.targetType, filters.targetType));
    if (filters.targetId)
      conditions.push(eq(auditLog.targetId, filters.targetId));
    if (filters.eventCategory)
      conditions.push(eq(auditLog.eventCategory, filters.eventCategory));
    if (filters.riskLevel)
      conditions.push(eq(auditLog.riskLevel, filters.riskLevel));
    if (filters.startDate)
      conditions.push(sql`${auditLog.timestamp} >= ${filters.startDate}`);
    if (filters.endDate)
      conditions.push(sql`${auditLog.timestamp} <= ${filters.endDate}`);

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const [results, total] = await Promise.all([
      db
        .select()
        .from(auditLog)
        .where(and(...conditions))
        .orderBy(desc(auditLog.timestamp))
        .limit(filters.limit || 100)
        .offset(filters.offset || 0),
      db
        .select({ count: count() })
        .from(auditLog)
        .where(and(...conditions)),
    ]);

    return {
      data: results,
      total: total[0]?.count || 0,
    };
  }

  async verifyChain(
    tenantId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<{
    valid: boolean;
    brokenAt?: { id: string; expected: string; actual: string }[];
  }> {
    const entries = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.tenantId, tenantId)))
      .orderBy(auditLog.timestamp);

    const broken: { id: string; expected: string; actual: string }[] = [];
    let previousHash = "0".repeat(64);

    for (const entry of entries) {
      const expectedHash = this.computeHash({
        ...entry,
        previousHash,
      });

      if (entry.currentHash !== expectedHash) {
        broken.push({
          id: entry.id,
          expected: expectedHash,
          actual: entry.currentHash,
        });
      }

      if (entry.previousHash !== previousHash) {
        broken.push({
          id: entry.id,
          expected: previousHash,
          actual: entry.previousHash,
        });
      }

      previousHash = entry.currentHash;
    }

    return {
      valid: broken.length === 0,
      brokenAt: broken.length > 0 ? broken : undefined,
    };
  }

  async exportUserData(tenantId: string, userId: string): Promise<any[]> {
    return this.query({
      tenantId,
      actorId: userId,
      limit: 10000,
    });
  }

  async pseudonymizeUser(tenantId: string, userId: string): Promise<number> {
    const result = await db
      .update(auditLog)
      .set({
        actorId: sql`md5(${auditLog.actorId}::text || '_pseudonymized')`,
        actorIp: null,
        actorUserAgent: null,
        metadata: sql`jsonb_set(${auditLog.metadata}, '{pseudonymized}', 'true')`,
      })
      .where(
        and(eq(auditLog.tenantId, tenantId), eq(auditLog.actorId, userId)),
      );

    return result.rowCount || 0;
  }

  async generateComplianceReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const events = await db
      .select()
      .from(auditLog)
      .where(
        and(
          eq(auditLog.tenantId, tenantId),
          sql`${auditLog.timestamp} >= ${startDate}`,
          sql`${auditLog.timestamp} <= ${endDate}`,
        ),
      )
      .orderBy(auditLog.timestamp);

    const categories = [...new Set(events.map((e) => e.eventCategory))];
    const riskLevels = ["low", "medium", "high", "critical"];

    return {
      period: { start: startDate, end: endDate },
      totalEvents: events.length,
      byCategory: categories.map((cat) => ({
        category: cat,
        count: events.filter((e) => e.eventCategory === cat).length,
      })),
      byRiskLevel: riskLevels.map((risk) => ({
        level: risk,
        count: events.filter((e) => e.riskLevel === risk).length,
      })),
      topActors: this.getTopActors(events),
      topTargets: this.getTopTargets(events),
      integrity: await this.verifyChain(
        tenantId,
        new Date(events[0]?.timestamp),
        new Date(events[events.length - 1]?.timestamp),
      ),
    };
  }

  private getTopActors(events: any[]) {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      const key = `${e.actorType}:${e.actorId}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([actor, count]) => ({ actor, count }));
  }

  private getTopTargets(events: any[]) {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      if (e.targetType && e.targetId) {
        const key = `${e.targetType}:${e.targetId}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([target, count]) => ({ target, count }));
  }
}

export const auditService = AuditService.getInstance();
