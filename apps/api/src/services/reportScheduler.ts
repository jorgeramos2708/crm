import { db } from "../db/index.js";
import { reportSchedules, users } from "../db/schema.js";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { ReportsService } from "./reports.js";
import { sendEmail } from "./email.js";
import parser from "cron-parser";
const CronExpressionParser = parser;
import { PDFDocument, rgb, StandardFonts, PDFPage } from "pdf-lib";

interface ReportScheduleData {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  reportType: string;
  config: Record<string, any>;
  format: string;
  cron: string;
  timezone: string;
  recipients: string[];
  enabled: boolean;
  nextRunAt: Date | null;
}

interface FunnelReportData {
  stages: Array<{
    stageId: string;
    stageName: string;
    stageOrder: number;
    entered: number | null;
    exited: number | null;
    conversionRate: string | number | null;
    avgDaysInStage: string | number | null;
  }>;
  summary: {
    periodStart: Date;
    periodEnd: Date;
    totalEntered: number;
    totalExited: number;
    overallConversion: number;
  } | null;
}

interface VelocityReportData {
  weekly: Array<{
    week: string;
    deals: number;
    revenue: number;
    activeReps: number;
  }>;
  reps: Array<{
    userId: string;
    userName: string;
    deals: number;
    revenue: number;
    avgCycleDays: number;
  }>;
}

interface ForecastReportData {
  monthly: Array<{
    month: string;
    weightedPipeline: number;
    dealCount: number;
    activeReps: number;
  }>;
  reps: Array<{
    userId: string;
    userName: string;
    weighted: number;
    deals: number;
  }>;
}

interface RepPerformanceReportData {
  userId: string;
  userName: string;
  dealsCreated: number;
  dealsWon: number;
  dealsLost: number;
  revenueWon: number;
  avgDealSize: number;
  winRate: number;
  avgCycleDays: number;
  activitiesCount: number;
  emailsSent: number;
  callsMade: number;
}

interface CohortReportData {
  cohortMonth: string;
  size: number;
  periods: Record<number, { retained: number; rate: number }>;
}

export class ReportSchedulerService {
  static async createSchedule(data: any) {
    const { ReportsService } = await import("./reports.js");
    const schedule = await ReportsService.createSchedule(data);
    await this.scheduleNextRun(schedule.id);
    return schedule;
  }

  static async updateSchedule(id: string, data: any) {
    const { ReportsService } = await import("./reports.js");
    const schedule = await ReportsService.updateSchedule(id, data);
    if (data.enabled !== undefined || data.cron || data.timezone) {
      await this.scheduleNextRun(id);
    }
    return schedule;
  }

  static async deleteSchedule(id: string) {
    const { ReportsService } = await import("./reports.js");
    return ReportsService.deleteSchedule(id);
  }

  static async scheduleNextRun(scheduleId: string) {
    const [schedule] = await db
      .select()
      .from(reportSchedules)
      .where(eq(reportSchedules.id, scheduleId))
      .limit(1);

    if (!schedule || !schedule.enabled) {
      await db
        .update(reportSchedules)
        .set({ nextRunAt: null })
        .where(eq(reportSchedules.id, scheduleId));
      return;
    }

    try {
      const interval = CronExpressionParser.parse(schedule.cron, {
        tz: schedule.timezone,
      });
      const nextRun = interval.next().toDate();

      await db
        .update(reportSchedules)
        .set({ nextRunAt: nextRun })
        .where(eq(reportSchedules.id, scheduleId));
    } catch (error) {
      console.error(`Error parsing cron for schedule ${scheduleId}:`, error);
      await db
        .update(reportSchedules)
        .set({ nextRunAt: null, enabled: false })
        .where(eq(reportSchedules.id, scheduleId));
    }
  }

  static async processDueSchedules() {
    const now = new Date();

    const dueSchedules = await db
      .select()
      .from(reportSchedules)
      .where(
        and(
          eq(reportSchedules.enabled, true),
          isNotNull(reportSchedules.nextRunAt),
          lte(reportSchedules.nextRunAt, now),
        ),
      );

    for (const schedule of dueSchedules) {
      try {
        await this.executeSchedule(schedule as unknown as ReportScheduleData);
      } catch (error) {
        console.error(`Error executing schedule ${schedule.id}:`, error);
      }
    }
  }

  static async executeSchedule(schedule: ReportScheduleData) {
    try {
      // Generate report
      let reportData: any;
      switch (schedule.reportType) {
        case "funnel":
          reportData = await ReportsService.getFunnelMetrics(
            schedule.tenantId,
            schedule.config,
          );
          break;
        case "velocity":
          reportData = await ReportsService.getVelocity(
            schedule.tenantId,
            schedule.config,
          );
          break;
        case "forecast":
          reportData = await ReportsService.getForecast(
            schedule.tenantId,
            schedule.config,
          );
          break;
        case "rep-performance":
          reportData = await ReportsService.getRepPerformance(
            schedule.tenantId,
            schedule.config,
          );
          break;
        case "cohort-retention":
          reportData = await ReportsService.getCohortRetention(
            schedule.tenantId,
            schedule.config,
          );
          break;
        default:
          throw new Error(`Unknown report type: ${schedule.reportType}`);
      }

      // Generate file
      let fileBuffer: Buffer;
      let filename: string;
      if (schedule.format === "pdf") {
        fileBuffer = await this.generatePDF(schedule, reportData);
        filename = `${schedule.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      } else if (schedule.format === "excel") {
        fileBuffer = await this.generateExcel(schedule, reportData);
        filename = `${schedule.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
      } else {
        fileBuffer = Buffer.from(JSON.stringify(reportData, null, 2), "utf-8");
        filename = `${schedule.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
      }

      // Send email
      if (schedule.recipients && schedule.recipients.length > 0) {
        await this.sendReportEmail(schedule, filename, fileBuffer);
      }

      // Update schedule
      const interval = CronExpressionParser.parse(schedule.cron, {
        tz: schedule.timezone,
      });
      const nextRun = interval.next().toDate();

      await db
        .update(reportSchedules)
        .set({
          lastRunAt: new Date(),
          nextRunAt: nextRun,
          updatedAt: new Date(),
        })
        .where(eq(reportSchedules.id, schedule.id));
    } catch (error) {
      console.error(`Error executing scheduled report ${schedule.id}:`, error);
      // Still schedule next run even if this one failed
      await this.scheduleNextRun(schedule.id);
    }
  }

  static async generatePDF(
    schedule: ReportScheduleData,
    reportData: any,
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const [font, boldFont] = await Promise.all([
      pdfDoc.embedFont(StandardFonts.Helvetica),
      pdfDoc.embedFont(StandardFonts.HelveticaBold),
    ]);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    // Title
    page.drawText(schedule.name, {
      x: margin,
      y,
      size: 24,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 30;

    // Subtitle with report type and date
    page.drawText(
      `${schedule.reportType.toUpperCase()} Report — ${new Date().toLocaleDateString()}`,
      {
        x: margin,
        y,
        size: 12,
        font,
        color: rgb(0.4, 0.4, 0.4),
      },
    );
    y -= 40;

    // Render report data based on type
    switch (schedule.reportType) {
      case "funnel":
        this.renderFunnelReport(
          pdfDoc,
          page,
          margin,
          y,
          reportData,
          font,
          boldFont,
        );
        break;
      case "velocity":
        this.renderVelocityReport(
          pdfDoc,
          page,
          margin,
          y,
          reportData,
          font,
          boldFont,
        );
        break;
      case "forecast":
        this.renderForecastReport(
          pdfDoc,
          page,
          margin,
          y,
          reportData,
          font,
          boldFont,
        );
        break;
      case "rep-performance":
        this.renderRepPerformanceReport(
          pdfDoc,
          page,
          margin,
          y,
          reportData,
          font,
          boldFont,
        );
        break;
      case "cohort-retention":
        this.renderCohortReport(
          pdfDoc,
          page,
          margin,
          y,
          reportData,
          font,
          boldFont,
        );
        break;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  static renderFunnelReport(
    pdfDoc: PDFDocument,
    page: PDFPage,
    margin: number,
    y: number,
    data: FunnelReportData,
    font: any,
    boldFont: any,
  ) {
    if (data.summary) {
      page.drawText(
        `Total Entered: ${data.summary.totalEntered} | Total Exited: ${data.summary.totalExited} | Overall Conversion: ${data.summary.overallConversion.toFixed(1)}%`,
        { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) },
      );
      y -= 30;
    }

    // Table header
    const headers = ["Stage", "Entered", "Exited", "Conversion %", "Avg Days"];
    const colWidths = [150, 70, 70, 90, 70];
    let x = margin;

    headers.forEach((h, i) => {
      page.drawText(h, {
        x,
        y,
        size: 9,
        font: boldFont,
        color: rgb(0.9, 0.9, 0.9),
      });
      x += colWidths[i];
    });
    y -= 20;

    // Table rows
    data.stages.forEach((stage) => {
      x = margin;
      const row = [
        stage.stageName,
        stage.entered?.toString() || "0",
        stage.exited?.toString() || "0",
        stage.conversionRate
          ? `${Number(stage.conversionRate).toFixed(1)}%`
          : "0%",
        stage.avgDaysInStage ? Number(stage.avgDaysInStage).toFixed(1) : "0",
      ];
      row.forEach((val, i) => {
        page.drawText(val, {
          x,
          y,
          size: 9,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        x += colWidths[i];
      });
      y -= 20;
    });
  }

  static renderVelocityReport(
    pdfDoc: PDFDocument,
    page: PDFPage,
    margin: number,
    y: number,
    data: VelocityReportData,
    font: any,
    boldFont: any,
  ) {
    page.drawText("Weekly Velocity", {
      x: margin,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 30;

    data.weekly.forEach((week) => {
      page.drawText(
        `${week.week}: ${week.deals} deals, $${week.revenue.toLocaleString()} revenue, ${week.activeReps} active reps`,
        { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) },
      );
      y -= 18;
    });
  }

  static renderForecastReport(
    pdfDoc: PDFDocument,
    page: PDFPage,
    margin: number,
    y: number,
    data: ForecastReportData,
    font: any,
    boldFont: any,
  ) {
    page.drawText("Monthly Forecast", {
      x: margin,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 30;

    data.monthly.forEach((month) => {
      page.drawText(
        `${month.month}: $${month.weightedPipeline.toLocaleString()} weighted (${month.dealCount} deals, ${month.activeReps} reps)`,
        { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) },
      );
      y -= 18;
    });
  }

  static renderRepPerformanceReport(
    pdfDoc: PDFDocument,
    page: PDFPage,
    margin: number,
    y: number,
    data: RepPerformanceReportData[],
    font: any,
    boldFont: any,
  ) {
    page.drawText("Rep Performance", {
      x: margin,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 30;

    data.forEach((rep) => {
      page.drawText(
        `${rep.userName}: ${rep.dealsWon} won / ${rep.dealsLost} lost | $${rep.revenueWon.toLocaleString()} | Win Rate: ${rep.winRate.toFixed(1)}% | Avg Cycle: ${rep.avgCycleDays.toFixed(1)}d`,
        { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) },
      );
      y -= 18;
    });
  }

  static renderCohortReport(
    pdfDoc: PDFDocument,
    page: PDFPage,
    margin: number,
    y: number,
    data: CohortReportData[],
    font: any,
    boldFont: any,
  ) {
    page.drawText("Cohort Retention", {
      x: margin,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 30;

    data.forEach((cohort) => {
      page.drawText(`Cohort ${cohort.cohortMonth} (${cohort.size} contacts):`, {
        x: margin,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 18;

      Object.entries(cohort.periods).forEach(([period, data]) => {
        page.drawText(
          `  Period ${period}: ${data.retained}/${cohort.size} retained (${data.rate.toFixed(1)}%)`,
          { x: margin + 20, y, size: 9, font: font, color: rgb(0.3, 0.3, 0.3) },
        );
        y -= 16;
      });
      y -= 10;
    });
  }

  static async generateExcel(_schedule: any, reportData: any): Promise<Buffer> {
    // Placeholder for Excel generation - would use exceljs
    // For now, return CSV as buffer
    let csv = "";
    if (reportData.stages) {
      csv = "Stage,Entered,Exited,Conversion %,Avg Days\n";
      reportData.stages.forEach((s: any) => {
        csv += `${s.stageName},${s.entered || 0},${s.exited || 0},${s.conversionRate || 0}%,${s.avgDaysInStage || 0}\n`;
      });
    }
    return Buffer.from(csv, "utf-8");
  }

  static async sendReportEmail(
    schedule: ReportScheduleData,
    filename: string,
    fileBuffer: Buffer,
  ) {
    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, schedule.userId))
      .limit(1);

    const subject = `📊 ${schedule.name} — ${new Date().toLocaleDateString()}`;
    const html = `
      <p>Hola ${user?.name || "usuario"},</p>
      <p>Adjunto encontrarás el reporte programado <strong>${schedule.name}</strong>.</p>
      <p>Tipo: ${schedule.reportType}<br>
      Formato: ${schedule.format.toUpperCase()}<br>
      Generado: ${new Date().toLocaleString()}</p>
      <p>Saludos,<br>CRM</p>
    `;

    await sendEmail({
      to: schedule.recipients.join(", "),
      subject,
      html,
      text: `Reporte: ${schedule.name}\nTipo: ${schedule.reportType}\nGenerado: ${new Date().toLocaleString()}`,
      attachments: [
        {
          filename,
          content: fileBuffer,
        },
      ],
    });
  }

  static async startScheduler() {
    console.log("📅 Report scheduler started");
    // Run every minute
    setInterval(() => this.processDueSchedules(), 60000);
    // Initial run
    await this.processDueSchedules();
  }
}
