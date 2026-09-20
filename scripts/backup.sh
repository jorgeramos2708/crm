#!/usr/bin/env bash
# Respaldo de PostgreSQL del despliegue CRM.
# Uso: ./scripts/backup.sh [outdir]
set -euo pipefail
OUTDIR="${1:-./backups}"
CONTAINER="${CRM_POSTGRES_CONTAINER:-crm-postgres}"
mkdir -p "$OUTDIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$OUTDIR/crm-$STAMP.sql"
docker exec "$CONTAINER" pg_dump -U crm -d crm > "$OUT"
echo "Respaldo OK: $OUT"
