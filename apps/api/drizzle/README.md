# drizzle/ — journal de migraciones

Historial: `0000` (baseline) + `0001_audit-fixes` (`token_version` en users,
índice único `meeting_slots_tipo_inicio_ux`).

Regenerar tras cambiar `src/db/schema.ts`:
`pnpm --filter @crm/api exec drizzle-kit generate --dialect=postgresql --schema=./src/db/schema.ts --out=./drizzle --name=<tema>`

La vía canónica de bootstrap sigue siendo `apps/api/src/migrate.ts`
(`CREATE TABLE IF NOT EXISTS` + evolutivos) más los scripts idempotentes de
`scripts/*.sql`, aplicados con:
`docker exec -i crm-postgres psql -U crm -d crm < scripts/<migracion>.sql`.
