# drizzle/ — historial de journal (NO es la vía de migración activa)

Este directorio conserva el snapshot/journal inicial de drizzle-kit como
referencia, pero **ningún código lo consume automáticamente**:

- No hay `drizzle.config.*` y ningún arranque ejecuta `drizzle-kit migrate`.
- La vía canónica es `apps/api/src/migrate.ts` (bootstrap `CREATE TABLE IF
EXISTS` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para evolutivos) más
  los scripts idempotentes de `scripts/*.sql`, aplicados con:
  `docker exec -i crm-postgres psql -U crm -d crm < scripts/<migracion>.sql`.

Si algún día se adopta drizzle-kit como migrador, hay que regenerar este
journal (`token_version` en `users`, índice único
`meeting_slots_tipo_inicio_ux`, etc.) antes de usarlo.
