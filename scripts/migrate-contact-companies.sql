-- Auditoría: contact_companies no tiene la columna id que declara el schema.
-- Backfill con gen_random_uuid() (pgcrypto instalado); luego PK.
ALTER TABLE contact_companies
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
UPDATE contact_companies SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE contact_companies ALTER COLUMN id SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_companies_pkey'
  ) THEN
    ALTER TABLE contact_companies ADD PRIMARY KEY (id);
  END IF;
END $$;
SELECT column_name FROM information_schema.columns
WHERE table_name = 'contact_companies' ORDER BY ordinal_position;
