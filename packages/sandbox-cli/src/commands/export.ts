import { Command } from "commander";
import { getDb, closePool } from "../db.js";
import {
  pipelines,
  pipelineStages,
  automatizaciones,
  emailTemplates,
  customFields,
  leadScoringRules,
  meetingTypes,
  emailSequences,
  tenants,
} from "../schema.js";
import { eq } from "drizzle-orm";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SandboxExport {
  version: string;
  exportedAt: string;
  exportedBy: string;
  tenantId: string;
  tenantNombre: string;
  data: {
    pipelines: any[];
    pipelineStages: any[];
    automatizaciones: any[];
    emailTemplates: any[];
    customFields: any[];
    leadScoringRules: any[];
    meetingTypes: any[];
    emailSequences: any[];
  };
}

export async function exportSandbox(
  tenantId: string,
  outputPath: string,
): Promise<void> {
  const db = getDb();

  console.log(`[export] Exporting sandbox for tenant: ${tenantId}`);

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  console.log(`[export] Tenant: ${tenant.nombre} (${tenant.subdominio})`);

  const [
    pipelinesData,
    stagesData,
    automatizacionesData,
    emailTemplatesData,
    customFieldsData,
    leadScoringRulesData,
    meetingTypesData,
    emailSequencesData,
  ] = await Promise.all([
    db.select().from(pipelines).orderBy(pipelines.createdAt),
    db.select().from(pipelineStages).orderBy(pipelineStages.orden),
    db.select().from(automatizaciones).orderBy(automatizaciones.createdAt),
    db.select().from(emailTemplates).orderBy(emailTemplates.createdAt),
    db
      .select()
      .from(customFields)
      .orderBy(customFields.entidad, customFields.orden),
    db
      .select()
      .from(leadScoringRules)
      .where(eq(leadScoringRules.tenantId, tenantId)),
    db.select().from(meetingTypes).where(eq(meetingTypes.tenantId, tenantId)),
    db
      .select()
      .from(emailSequences)
      .where(eq(emailSequences.tenantId, tenantId)),
  ]);

  const exportData: SandboxExport = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    exportedBy: process.env.USER || "cli",
    tenantId: tenant.id,
    tenantNombre: tenant.nombre,
    data: {
      pipelines: pipelinesData,
      pipelineStages: stagesData,
      automatizaciones: automatizacionesData,
      emailTemplates: emailTemplatesData,
      customFields: customFieldsData,
      leadScoringRules: leadScoringRulesData,
      meetingTypes: meetingTypesData,
      emailSequences: emailSequencesData,
    },
  };

  console.log(`[export] Found:`);
  console.log(`  - ${pipelinesData.length} pipelines`);
  console.log(`  - ${stagesData.length} pipeline stages`);
  console.log(`  - ${automatizacionesData.length} automatizaciones`);
  console.log(`  - ${emailTemplatesData.length} email templates`);
  console.log(`  - ${customFieldsData.length} custom fields`);
  console.log(`  - ${leadScoringRulesData.length} lead scoring rules`);
  console.log(`  - ${meetingTypesData.length} meeting types`);
  console.log(`  - ${emailSequencesData.length} email sequences`);

  const fullPath = path.resolve(outputPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, JSON.stringify(exportData, null, 2));

  console.log(`[export] Written to: ${fullPath}`);
}

export function createExportCommand(): Command {
  const cmd = new Command("export")
    .description(
      "Export sandbox configuration (pipelines, stages, automations, templates, etc.)",
    )
    .requiredOption("--env <env>", "Target environment (staging, prod, etc.)")
    .requiredOption("--output <file>", "Output file path")
    .option("--tenant-id <id>", "Specific tenant ID (defaults to env default)")
    .action(async (options) => {
      const tenantId =
        options.tenantId ||
        process.env[`${options.env.toUpperCase()}_TENANT_ID`];
      if (!tenantId) {
        console.error(
          `Error: Tenant ID required. Use --tenant-id or set ${options.env.toUpperCase()}_TENANT_ID env var`,
        );
        process.exit(1);
      }

      try {
        await exportSandbox(tenantId, options.output);
        console.log("[export] Success!");
      } catch (error) {
        console.error("[export] Failed:", error);
        process.exit(1);
      } finally {
        await closePool();
      }
    });

  return cmd;
}
