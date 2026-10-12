-- Etapas CRM estándar: Prospección, Calificación, Reunión/Demostración,
-- Propuesta, Negociación, Ganado, Perdido, Postventa.
-- Idempotente: sirve en BD con las 5 etapas viejas (renombra 1:1 y agrega
-- las 3 nuevas) y en BD vacías (crea pipeline + 8 etapas).
-- Los colores siguen el código de temperatura (frío -> cálido -> cierre).
DO $$
DECLARE
  pid uuid;
BEGIN
  SELECT id INTO pid FROM pipelines ORDER BY created_at LIMIT 1;
  IF NOT FOUND THEN
    INSERT INTO pipelines (nombre, descripcion, activo)
    VALUES ('Pipeline Principal', 'Pipeline comercial estándar', true)
    RETURNING id INTO pid;
  END IF;

  -- Renombre 1:1 (conserva ids: las oportunidades no se tocan).
  UPDATE pipeline_stages SET nombre = 'Prospección', color = '#3b82f6', orden = 1, es_inicial = true,  es_final = false WHERE pipeline_id = pid AND nombre = 'Nuevo';
  UPDATE pipeline_stages SET nombre = 'Calificación', color = '#0ea5e9', orden = 2, es_inicial = false, es_final = false WHERE pipeline_id = pid AND nombre = 'Calificado';
  UPDATE pipeline_stages SET nombre = 'Propuesta', color = '#f59e0b', orden = 4, es_inicial = false, es_final = false WHERE pipeline_id = pid AND nombre = 'Propuesta';
  UPDATE pipeline_stages SET nombre = 'Negociación', color = '#f97316', orden = 5, es_inicial = false, es_final = false WHERE pipeline_id = pid AND nombre = 'Negociación';
  UPDATE pipeline_stages SET nombre = 'Ganado', color = '#22c55e', orden = 6, es_inicial = false, es_final = true  WHERE pipeline_id = pid AND nombre = 'Ganado';

  -- Primeras 5 si faltan (BD vacía o parcial; en BD con datos ya existen
  -- por el renombre de arriba).
  IF NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE pipeline_id = pid AND nombre = 'Prospección') THEN
    INSERT INTO pipeline_stages (pipeline_id, nombre, color, orden, es_inicial, es_final)
    VALUES (pid, 'Prospección', '#3b82f6', 1, true, false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE pipeline_id = pid AND nombre = 'Calificación') THEN
    INSERT INTO pipeline_stages (pipeline_id, nombre, color, orden, es_inicial, es_final)
    VALUES (pid, 'Calificación', '#0ea5e9', 2, false, false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE pipeline_id = pid AND nombre = 'Propuesta') THEN
    INSERT INTO pipeline_stages (pipeline_id, nombre, color, orden, es_inicial, es_final)
    VALUES (pid, 'Propuesta', '#f59e0b', 4, false, false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE pipeline_id = pid AND nombre = 'Negociación') THEN
    INSERT INTO pipeline_stages (pipeline_id, nombre, color, orden, es_inicial, es_final)
    VALUES (pid, 'Negociación', '#f97316', 5, false, false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE pipeline_id = pid AND nombre = 'Ganado') THEN
    INSERT INTO pipeline_stages (pipeline_id, nombre, color, orden, es_inicial, es_final)
    VALUES (pid, 'Ganado', '#22c55e', 6, false, true);
  END IF;
  -- Nuevas (solo si faltan).
  IF NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE pipeline_id = pid AND nombre = 'Reunión/Demostración') THEN
    INSERT INTO pipeline_stages (pipeline_id, nombre, color, orden, es_inicial, es_final)
    VALUES (pid, 'Reunión/Demostración', '#8b5cf6', 3, false, false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE pipeline_id = pid AND nombre = 'Perdido') THEN
    INSERT INTO pipeline_stages (pipeline_id, nombre, color, orden, es_inicial, es_final)
    VALUES (pid, 'Perdido', '#991b1b', 7, false, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE pipeline_id = pid AND nombre = 'Postventa') THEN
    INSERT INTO pipeline_stages (pipeline_id, nombre, color, orden, es_inicial, es_final)
    VALUES (pid, 'Postventa', '#14b8a6', 8, false, false);
  END IF;
END $$;
