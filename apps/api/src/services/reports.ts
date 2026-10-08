import { db } from "../db/index.js";
import {
  mvFunnelMetrics,
  mvVelocity,
  mvForecast,
  mvRepPerformance,
  mvCohortRetention,
  reportSchedules,
} from "../db/schema.js";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import parser from "cron-parser";
const CronExpressionParser = parser;

/**
 * Parsea una expresión cron devolviendo la próxima ejecución.
 * Compat ESM/CJS: según el empaquetado, `parse` puede colgar del
 * namespace o del export default. Lanza Error("Cron inválido: ...")
 * en vez de dejar un TypeError opaco (→ 400 en las rutas).
 */
export function parseCronOrThrow(cron: string, timezone: string): Date {
  const candidates = [
    (CronExpressionParser as any)?.parse,
    (CronExpressionParser as any)?.default?.parse,
  ];
  const parseFn = candidates.find((fn) => typeof fn === "function");
  if (!parseFn) {
    throw new Error("Motor de cron no disponible");
  }
  try {
    return parseFn(cron, { tz: timezone }).next().toDate();
  } catch {
    throw new Error(`Cron inválido: "${cron}"`);
  }
}

export interface FunnelStage {
  stageId: string;
  stageName: string;
  stageOrder: number;
  enteredCount: number | null;
  exitedCount: number | null;
  conversionRate: string | number | null;
  avgDaysInStage: string | number | null;
}

export interface VelocityRow {
  tenantId: string;
  userId: string;
  userName: string;
  week: Date;
  dealsClosed: number | null;
  revenue: string | number | null;
  avgCycleDays: string | number | null;
  refreshedAt: Date | null;
}

export interface ForecastRow {
  tenantId: string;
  userId: string;
  userName: string;
  month: Date;
  weightedPipeline: string | number | null;
  dealCount: number | null;
  refreshedAt: Date | null;
}

export interface RepPerformanceRow {
  tenantId: string;
  userId: string;
  userName: string;
  periodStart: Date;
  periodEnd: Date;
  dealsCreated: number | null;
  dealsWon: number | null;
  dealsLost: number | null;
  revenueWon: string | number | null;
  avgDealSize: string | number | null;
  winRate: string | number | null;
  avgCycleDays: string | number | null;
  activitiesCount: number | null;
  emailsSent: number | null;
  callsMade: number | null;
  refreshedAt: Date | null;
}

export interface CohortRow {
  tenantId: string;
  cohortMonth: Date;
  periodNumber: number;
  cohortSize: number | null;
  retainedCount: number | null;
  retentionRate: string | number | null;
  refreshedAt: Date | null;
}

export interface RepAgg {
  userId: string;
  userName: string;
  deals: number;
  revenue: number;
  avgCycleDays: number;
  weekCount: number;
}

export interface RepForecastAgg {
  userId: string;
  userName: string;
  weighted: number;
  deals: number;
}

export interface CohortAgg {
  cohortMonth: string;
  size: number;
  periods: Record<number, { retained: number; rate: number }>;
}

export class ReportsService {
  static async getFunnelMetrics(
    tenantId: string,
    options: { pipelineId?: string; period?: string } = {},
  ) {
    const { pipelineId, period = "30d" } = options;
    const conditions = [eq(mvFunnelMetrics.tenantId, tenantId)];
    if (pipelineId) conditions.push(eq(mvFunnelMetrics.pipelineId, pipelineId));

    const [latest] = await db
      .select({
        periodStart: mvFunnelMetrics.periodStart,
        periodEnd: mvFunnelMetrics.periodEnd,
      })
      .from(mvFunnelMetrics)
      .where(and(...conditions))
      .orderBy(desc(mvFunnelMetrics.periodStart))
      .limit(1);

    if (!latest) return { stages: [], summary: null };

    const periodConditions = [
      ...conditions,
      eq(mvFunnelMetrics.periodStart, latest.periodStart),
      eq(mvFunnelMetrics.periodEnd, latest.periodEnd),
    ];

    const stages = await db
      .select()
      .from(mvFunnelMetrics)
      .where(and(...periodConditions))
      .orderBy(asc(mvFunnelMetrics.stageOrder));

    const totalEntered = stages.reduce(
      (sum, s) => sum + (s.enteredCount || 0),
      0,
    );
    const totalExited = stages.reduce(
      (sum, s) => sum + (s.exitedCount || 0),
      0,
    );

    return {
      stages: stages.map((s) => ({
        stageId: s.stageId,
        stageName: s.stageName,
        stageOrder: s.stageOrder,
        entered: s.enteredCount,
        exited: s.exitedCount,
        conversionRate: s.conversionRate,
        avgDaysInStage: s.avgDaysInStage,
      })),
      summary: {
        periodStart: latest.periodStart,
        periodEnd: latest.periodEnd,
        totalEntered,
        totalExited,
        overallConversion:
          totalEntered > 0 ? (totalExited / totalEntered) * 100 : 0,
      },
    };
  }

  static async getVelocity(
    tenantId: string,
    options: { period?: string } = {},
  ) {
    const { period = "12w" } = options;
    const weeks = period === "52w" ? 52 : 12;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const data = await db
      .select()
      .from(mvVelocity)
      .where(
        and(eq(mvVelocity.tenantId, tenantId), gte(mvVelocity.week, startDate)),
      )
      .orderBy(asc(mvVelocity.week));

    const weeklyData: Record<
      string,
      { week: string; deals: number; revenue: number; reps: Set<string> }
    > = data.reduce(
      (
        acc: Record<
          string,
          { week: string; deals: number; revenue: number; reps: Set<string> }
        >,
        row,
      ) => {
        const weekKey = row.week.toISOString().split("T")[0];
        if (!acc[weekKey]) {
          acc[weekKey] = {
            week: weekKey,
            deals: 0,
            revenue: 0,
            reps: new Set(),
          };
        }
        acc[weekKey].deals += row.dealsClosed || 0;
        acc[weekKey].revenue += Number(row.revenue || 0);
        acc[weekKey].reps.add(row.userId);
        return acc;
      },
      {},
    );

    const repData: Record<string, RepAgg> = data.reduce(
      (acc: Record<string, RepAgg>, row) => {
        if (!acc[row.userId]) {
          acc[row.userId] = {
            userId: row.userId,
            userName: row.userName,
            deals: 0,
            revenue: 0,
            avgCycleDays: 0,
            weekCount: 0,
          };
        }
        acc[row.userId].deals += row.dealsClosed || 0;
        acc[row.userId].revenue += Number(row.revenue || 0);
        acc[row.userId].avgCycleDays += Number(row.avgCycleDays || 0);
        acc[row.userId].weekCount += 1;
        return acc;
      },
      {},
    );

    Object.values(repData).forEach((r: RepAgg) => {
      r.avgCycleDays = r.weekCount > 0 ? r.avgCycleDays / r.weekCount : 0;
    });

    return {
      weekly: Object.values(weeklyData).map((w) => ({
        week: w.week,
        deals: w.deals,
        revenue: w.revenue,
        activeReps: w.reps.size,
      })),
      reps: Object.values(repData).sort(
        (a: RepAgg, b: RepAgg) => b.revenue - a.revenue,
      ),
    };
  }

  static async getForecast(
    tenantId: string,
    options: { period?: string } = {},
  ) {
    const { period = "6m" } = options;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const data = await db
      .select()
      .from(mvForecast)
      .where(
        and(
          eq(mvForecast.tenantId, tenantId),
          gte(mvForecast.month, startDate),
        ),
      )
      .orderBy(asc(mvForecast.month));

    interface MonthlyAgg {
      month: string;
      weighted: number;
      deals: number;
      reps: Set<string>;
    }

    const monthly: Record<string, MonthlyAgg> = data.reduce(
      (acc: Record<string, MonthlyAgg>, row) => {
        const monthKey = row.month.toISOString().split("T")[0].substring(0, 7);
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            weighted: 0,
            deals: 0,
            reps: new Set(),
          };
        }
        acc[monthKey].weighted += Number(row.weightedPipeline || 0);
        acc[monthKey].deals += row.dealCount || 0;
        acc[monthKey].reps.add(row.userId);
        return acc;
      },
      {},
    );

    const repData: Record<string, RepForecastAgg> = data.reduce(
      (acc: Record<string, RepForecastAgg>, row) => {
        if (!acc[row.userId]) {
          acc[row.userId] = {
            userId: row.userId,
            userName: row.userName,
            weighted: 0,
            deals: 0,
          };
        }
        acc[row.userId].weighted += Number(row.weightedPipeline || 0);
        acc[row.userId].deals += row.dealCount || 0;
        return acc;
      },
      {},
    );

    return {
      monthly: Object.values(monthly).map((m) => ({
        month: m.month,
        weightedPipeline: m.weighted,
        dealCount: m.deals,
        activeReps: m.reps.size,
      })),
      reps: Object.values(repData).sort(
        (a: RepForecastAgg, b: RepForecastAgg) => b.weighted - a.weighted,
      ),
    };
  }

  static async getRepPerformance(
    tenantId: string,
    options: { period?: string } = {},
  ) {
    const { period = "4w" } = options;
    const weeks = period === "12w" ? 12 : 4;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);
    const endDate = new Date();

    const data = await db
      .select()
      .from(mvRepPerformance)
      .where(
        and(
          eq(mvRepPerformance.tenantId, tenantId),
          gte(mvRepPerformance.periodStart, startDate),
          lte(mvRepPerformance.periodEnd, endDate),
        ),
      )
      .orderBy(desc(mvRepPerformance.revenueWon));

    return data.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      dealsCreated: r.dealsCreated,
      dealsWon: r.dealsWon,
      dealsLost: r.dealsLost,
      revenueWon: Number(r.revenueWon || 0),
      avgDealSize: Number(r.avgDealSize || 0),
      winRate: Number(r.winRate || 0),
      avgCycleDays: Number(r.avgCycleDays || 0),
      activitiesCount: r.activitiesCount,
      emailsSent: r.emailsSent,
      callsMade: r.callsMade,
    }));
  }

  static async getCohortRetention(
    tenantId: string,
    options: { months?: number } = {},
  ) {
    const { months = 12 } = options;

    const data = await db
      .select()
      .from(mvCohortRetention)
      .where(eq(mvCohortRetention.tenantId, tenantId))
      .orderBy(
        asc(mvCohortRetention.cohortMonth),
        asc(mvCohortRetention.periodNumber),
      );

    const cohorts: Record<string, CohortAgg> = data.reduce(
      (acc: Record<string, CohortAgg>, row: CohortRow) => {
        const cohortKey = row.cohortMonth
          .toISOString()
          .split("T")[0]
          .substring(0, 7);
        if (!acc[cohortKey]) {
          acc[cohortKey] = {
            cohortMonth: cohortKey,
            size: row.cohortSize || 0,
            periods: {},
          };
        }
        acc[cohortKey].periods[row.periodNumber] = {
          retained: row.retainedCount || 0,
          rate: Number(row.retentionRate || 0),
        };
        return acc;
      },
      {} as Record<string, CohortAgg>,
    );

    return Object.values(cohorts).sort((a, b) =>
      b.cohortMonth.localeCompare(a.cohortMonth),
    );
  }

  static async refreshAll(tenantId: string) {
    return {
      message: "Use pg_cron to schedule materialized view refreshes",
      sql: [
        `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_funnel_metrics;`,
        `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_velocity;`,
        `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_forecast;`,
        `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_rep_performance;`,
        `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_cohort_retention;`,
      ],
    };
  }

  static async createSchedule(data: {
    tenantId: string;
    userId: string;
    name: string;
    reportType: string;
    config: Record<string, any>;
    format: string;
    cron: string;
    timezone: string;
    recipients: string[];
  }) {
    // Validar cron ANTES de insertar: evita filas basura + 500
    const nextRun = parseCronOrThrow(data.cron, data.timezone);

    const [schedule] = await db
      .insert(reportSchedules)
      .values(data)
      .returning();

    await db
      .update(reportSchedules)
      .set({ nextRunAt: nextRun })
      .where(eq(reportSchedules.id, schedule.id));

    return { ...schedule, nextRunAt: nextRun };
  }

  static async getSchedule(id: string) {
    const [schedule] = await db
      .select()
      .from(reportSchedules)
      .where(eq(reportSchedules.id, id))
      .limit(1);

    return schedule || null;
  }

  static async listSchedules(tenantId: string, userId?: string) {
    const conditions = [eq(reportSchedules.tenantId, tenantId)];
    if (userId) conditions.push(eq(reportSchedules.userId, userId));

    return db
      .select()
      .from(reportSchedules)
      .where(and(...conditions))
      .orderBy(desc(reportSchedules.createdAt));
  }

  static async updateSchedule(
    id: string,
    data: Partial<{
      name: string;
      config: Record<string, any>;
      format: string;
      cron: string;
      timezone: string;
      recipients: string[];
      enabled: boolean;
    }>,
  ) {
    const updateData: any = { ...data, updatedAt: new Date() };

    if (data.cron || data.timezone) {
      const [schedule] = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, id))
        .limit(1);

      if (schedule) {
        const cron = data.cron || schedule.cron;
        const timezone = data.timezone || schedule.timezone;
        updateData.nextRunAt = parseCronOrThrow(cron, timezone);
      }
    }

    const [schedule] = await db
      .update(reportSchedules)
      .set(updateData)
      .where(eq(reportSchedules.id, id))
      .returning();

    return schedule || null;
  }

  static async deleteSchedule(id: string) {
    await db.delete(reportSchedules).where(eq(reportSchedules.id, id));

    return { ok: true };
  }
}
