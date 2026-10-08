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
  auditLog,
  tenants,
} from "../schema.js";
import { eq, inArray, desc } from "drizzle-orm";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { SandboxExport } from "./export.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ImportDiff {
  entity: string;
  creates: any[];
  updates: Array<{ existing: any; incoming: any; changes: string[] }>;
  deletes: any[];
}

export async function importSandbox(
  tenantId: string,
  inputPath: string,
  options: {
    dryRun: boolean;
    force: boolean;
    actorId?: string;
    actorIp?: string;
  } = { dryRun: true, force: false },
): Promise<ImportDiff[]> {
  const db = getDb();

  console.log(`[import] Reading sandbox from: ${inputPath}`);

  const fileContent = await fs.readFile(inputPath, "utf-8");
  const sandbox: SandboxExport = JSON.parse(fileContent);

  console.log(`[import] Sandbox version: ${sandbox.version}`);
  console.log(
    `[import] Exported from: ${sandbox.tenantNombre} (${sandbox.tenantId})`,
  );
  console.log(`[import] Exported at: ${sandbox.exportedAt}`);

  if (sandbox.tenantId !== tenantId) {
    console.warn(
      `[import] Warning: Sandbox tenant (${sandbox.tenantId}) differs from target tenant (${tenantId})`,
    );
  }

  const diffs: ImportDiff[] = [];

  const entityConfigs = [
    {
      key: "pipelines",
      table: pipelines,
      idField: "id",
      data: sandbox.data.pipelines,
      relations: [],
    },
    {
      key: "pipelineStages",
      table: pipelineStages,
      idField: "id",
      data: sandbox.data.pipelineStages,
      relations: [{ field: "pipelineId", checkTable: pipelines }],
    },
    {
      key: "automatizaciones",
      table: automatizaciones,
      idField: "id",
      data: sandbox.data.automatizaciones,
      relations: [],
    },
    {
      key: "emailTemplates",
      table: emailTemplates,
      idField: "id",
      data: sandbox.data.emailTemplates,
      relations: [],
    },
    {
      key: "customFields",
      table: customFields,
      idField: "id",
      data: sandbox.data.customFields,
      relations: [],
    },
    {
      key: "leadScoringRules",
      table: leadScoringRules,
      idField: "id",
      data: sandbox.data.leadScoringRules,
      relations: [],
    },
    {
      key: "meetingTypes",
      table: meetingTypes,
      idField: "id",
      data: sandbox.data.meetingTypes,
      relations: [],
    },
    {
      key: "emailSequences",
      table: emailSequences,
      idField: "id",
      data: sandbox.data.emailSequences,
      relations: [],
    },
  ];

  for (const config of entityConfigs) {
    const diff = await computeDiff(db, tenantId, config);
    diffs.push(diff);

    console.log(
      `[import] ${config.key}: ${diff.creates.length} create, ${diff.updates.length} update, ${diff.deletes.length} delete`,
    );

    if (!options.dryRun && options.force) {
      await applyDiff(db, tenantId, config, diff, options);
    }
  }

  if (options.dryRun) {
    console.log(
      "\n[import] DRY RUN - No changes applied. Use --force to apply.",
    );
  } else if (!options.force) {
    console.log("\n[import] Use --force to apply changes.");
  }

  if (!options.dryRun && options.force) {
    await logAuditEvent(db, tenantId, {
      eventType: "sandbox_import",
      eventCategory: "configuration",
      actorType: "system",
      actorId: options.actorId,
      actorIp: options.actorIp,
      targetType: "sandbox",
      targetId: tenantId,
      before: null,
      after: {
        importedEntities: diffs.map(
          (d) =>
            `${d.entity}: ${d.creates.length}c/${d.updates.length}u/${d.deletes.length}d`,
        ),
      },
      changedFields: [],
      metadata: {
        sandboxVersion: sandbox.version,
        sourceTenant: sandbox.tenantNombre,
      },
    });
    console.log("[import] Audit log entry created");
  }

  return diffs;
}

async function computeDiff(
  db: any,
  tenantId: string,
  config: {
    key: string;
    table: any;
    idField: string;
    data: any[];
    relations: Array<{ field: string; checkTable: any }>;
  },
): Promise<ImportDiff> {
  const incoming = config.data;
  const incomingIds = new Set(incoming.map((item) => item[config.idField]));

  const existing = await db.select().from(config.table);
  const existingMap = new Map(
    existing.map((item: any) => [item[config.idField], item]),
  );

  const creates: any[] = [];
  const updates: Array<{ existing: any; incoming: any; changes: string[] }> =
    [];
  const deletes: any[] = [];

  for (const item of incoming) {
    const existingItem = existingMap.get(item[config.idField]);
    if (!existingItem) {
      creates.push(item);
    } else {
      const changes = findChanges(existingItem, item);
      if (changes.length > 0) {
        updates.push({ existing: existingItem, incoming: item, changes });
      }
    }
  }

  for (const item of existing) {
    if (!incomingIds.has(item[config.idField])) {
      deletes.push(item);
    }
  }

  return { entity: config.key, creates, updates, deletes };
}

function findChanges(existing: any, incoming: any): string[] {
  const changes: string[] = [];
  const allKeys = new Set([...Object.keys(existing), ...Object.keys(incoming)]);

  for (const key of allKeys) {
    if (
      key === "createdAt" ||
      key === "updatedAt" ||
      key === "creadoEn" ||
      key === "actualizadoEn"
    ) {
      continue;
    }
    const existingVal = JSON.stringify(existing[key]);
    const incomingVal = JSON.stringify(incoming[key]);
    if (existingVal !== incomingVal) {
      changes.push(key);
    }
  }
  return changes;
}

async function applyDiff(
  db: any,
  tenantId: string,
  config: {
    key: string;
    table: any;
    idField: string;
    data: any[];
    relations: Array<{ field: string; checkTable: any }>;
  },
  diff: ImportDiff,
  options: { actorId?: string; actorIp?: string },
): Promise<void> {
  for (const item of diff.deletes) {
    console.log(`  [import] Deleting ${config.key}: ${item[config.idField]}`);
    await db
      .delete(config.table)
      .where(eq(config.table[config.idField], item[config.idField]));
  }

  for (const item of diff.creates) {
    console.log(`  [import] Creating ${config.key}: ${item[config.idField]}`);
    const { id, ...data } = item;
    await db.insert(config.table).values(data);
  }

  for (const { existing, incoming, changes } of diff.updates) {
    console.log(
      `  [import] Updating ${config.key}: ${existing[config.idField]} (${changes.join(", ")})`,
    );
    const { id, createdAt, ...data } = incoming;
    await db
      .update(config.table)
      .set(data)
      .where(eq(config.table[config.idField], existing[config.idField]));
  }
}

async function logAuditEvent(
  db: any,
  tenantId: string,
  event: {
    eventType: string;
    eventCategory: string;
    actorType: string;
    actorId?: string;
    actorIp?: string;
    targetType: string;
    targetId?: string;
    before: any;
    after: any;
    changedFields: string[];
    metadata: any;
  },
): Promise<void> {
  const { createHash } = await import("node:crypto");
  const previousEntry = await db
    .select({ currentHash: auditLog.currentHash })
    .from(auditLog)
    .where(eq(auditLog.tenantId, tenantId))
    .orderBy(desc(auditLog.timestamp))
    .limit(1);

  const previousHash = previousEntry[0]?.currentHash || "0".repeat(64);
  const payload = JSON.stringify({
    ...event,
    previousHash,
    timestamp: new Date().toISOString(),
  });
  const currentHash = createHash("sha256").update(payload).digest("hex");

  await db.insert(auditLog).values({
    ...event,
    tenantId,
    previousHash,
    currentHash,
    timestamp: new Date(),
  });
}

export function createImportCommand(): Command {
  const cmd = new Command("import")
    .description("Import sandbox configuration with dry-run support")
    .requiredOption("--env <env>", "Target environment (staging, prod, etc.)")
    .requiredOption("--input <file>", "Input sandbox file")
    .option("--dry-run", "Show diff without applying changes", true)
    .option("--force", "Apply changes (requires --dry-run=false)")
    .option("--actor-id <id>", "Actor user ID for audit log")
    .option("--actor-ip <ip>", "Actor IP for audit log")
    .action(async (options) => {
      const tenantId = process.env[`${options.env.toUpperCase()}_TENANT_ID`];
      if (!tenantId) {
        console.error(
          `Error: ${options.env.toUpperCase()}_TENANT_ID env var required`,
        );
        process.exit(1);
      }

      if (!options.dryRun && !options.force) {
        console.error("Error: --force is required when not in dry-run mode");
        process.exit(1);
      }

      try {
        await importSandbox(tenantId, options.input, {
          dryRun: options.dryRun,
          force: options.force,
          actorId: options.actorId,
          actorIp: options.actorIp,
        });
        console.log("[import] Success!");
      } catch (error) {
        console.error("[import] Failed:", error);
        process.exit(1);
      } finally {
        await closePool();
      }
    });

  return cmd;
}
