#!/usr/bin/env node
import { Command } from "commander";
import { createExportCommand } from "./commands/export.js";
import { createImportCommand } from "./commands/import.js";

const program = new Command();

program
  .name("sandbox")
  .description(
    "Sandbox Promotion CLI - Export/Import configuration between environments",
  )
  .version("1.0.0")
  .addHelpText(
    "after",
    `
Examples:
  $ sandbox export --env staging --output ./sandbox-staging.json
  $ sandbox import --env prod --input ./sandbox-staging.json --dry-run
  $ sandbox import --env prod --input ./sandbox-staging.json --force
`,
  );

program.addCommand(createExportCommand());
program.addCommand(createImportCommand());

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
