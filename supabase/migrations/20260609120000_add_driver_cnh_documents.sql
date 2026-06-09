-- ============================================================================
-- ANEXOS DE CNH DOS MOTORISTAS
-- ============================================================================

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS cnh_file_path text,
  ADD COLUMN IF NOT EXISTS cnh_file_url text,
  ADD COLUMN IF NOT EXISTS cnh_file_name text,
  ADD COLUMN IF NOT EXISTS cnh_file_type text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-cnh-documents', 'driver-cnh-documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public read on driver-cnh-documents" ON storage.objects;
CREATE POLICY "Allow public read on driver-cnh-documents"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'driver-cnh-documents');

DROP POLICY IF EXISTS "Allow public insert on driver-cnh-documents" ON storage.objects;
CREATE POLICY "Allow public insert on driver-cnh-documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'driver-cnh-documents');

DROP POLICY IF EXISTS "Allow public update on driver-cnh-documents" ON storage.objects;
CREATE POLICY "Allow public update on driver-cnh-documents"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'driver-cnh-documents')
  WITH CHECK (bucket_id = 'driver-cnh-documents');

DROP POLICY IF EXISTS "Allow public delete on driver-cnh-documents" ON storage.objects;
CREATE POLICY "Allow public delete on driver-cnh-documents"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'driver-cnh-documents');
