-- Anti doble-generación concurrente de slots.
-- Aplicar: docker exec -i crm-postgres psql -U crm -d crm < scripts/migrate-meeting-slots-ux.sql
CREATE UNIQUE INDEX IF NOT EXISTS meeting_slots_tipo_inicio_ux
  ON meeting_slots (meeting_type_id, inicio);
