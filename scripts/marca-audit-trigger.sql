-- Trazabilidad: registra quién/cuándo cambia la marca (auditoría 2026-10-05)
CREATE TABLE IF NOT EXISTS _audit_marca_log (
  id serial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  old_val jsonb,
  new_val jsonb,
  app_user text DEFAULT current_user
);
DROP TRIGGER IF EXISTS trg_audit_marca ON ajustes;
CREATE OR REPLACE FUNCTION _log_marca_change() RETURNS trigger AS $$
BEGIN
  IF NEW.clave LIKE 'marca%' AND (OLD.valor IS DISTINCT FROM NEW.valor) THEN
    INSERT INTO _audit_marca_log(old_val, new_val) VALUES (OLD.valor, NEW.valor);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_audit_marca
  AFTER UPDATE ON ajustes
  FOR EACH ROW EXECUTE FUNCTION _log_marca_change();
SELECT 'trigger listo' AS status;
