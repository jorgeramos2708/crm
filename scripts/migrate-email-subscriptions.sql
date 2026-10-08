-- Auditoría: la tabla email_subscriptions quedó atrás del schema
-- (faltan tenant_id y creado_en; sobra created_at). Tabla vacía en demo.
ALTER TABLE email_subscriptions
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE email_subscriptions
  ADD COLUMN IF NOT EXISTS creado_en timestamptz NOT NULL DEFAULT now();
UPDATE email_subscriptions SET creado_en = created_at WHERE creado_en IS NULL;
ALTER TABLE email_subscriptions DROP COLUMN IF EXISTS created_at;
-- tenant_id queda nullable a nivel BD (el código siempre lo provee);
-- evita romper filas huérfanas si las hubiera.
SELECT column_name FROM information_schema.columns
WHERE table_name = 'email_subscriptions' ORDER BY ordinal_position;
