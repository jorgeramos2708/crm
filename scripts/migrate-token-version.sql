-- Revocación de sesiones: versionado de tokens por usuario.
-- Aplicar: docker exec -i crm-postgres psql -U crm -d crm < scripts/migrate-token-version.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
