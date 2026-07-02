-- ============================================================================
-- Pessoas, veiculos pessoais e controle de acesso da portaria
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.people_short_code_seq
  START WITH 10000
  INCREMENT BY 1
  MINVALUE 10000
  MAXVALUE 99999
  NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS public.personal_vehicles_short_code_seq
  START WITH 10000
  INCREMENT BY 1
  MINVALUE 10000
  MAXVALUE 99999
  NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS public.access_records_short_code_seq
  START WITH 10000
  INCREMENT BY 1
  MINVALUE 10000
  MAXVALUE 99999
  NO CYCLE;

CREATE TABLE IF NOT EXISTS public.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code text NOT NULL DEFAULT public.generate_short_code('public.people_short_code_seq'::regclass),
  person_type text NOT NULL DEFAULT 'Funcionario'
    CHECK (person_type IN ('Funcionario', 'Terceirizado', 'Visitante')),
  name text NOT NULL,
  document_number text,
  phone text DEFAULT '',
  company text DEFAULT '',
  notes text DEFAULT '',
  cnh_number text,
  cnh_valid_until date,
  cnh_file_path text,
  cnh_file_url text,
  cnh_file_name text,
  cnh_file_type text,
  origin text NOT NULL DEFAULT 'manual'
    CHECK (origin IN ('manual', 'historico', 'drivers')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_people_short_code_unique
  ON public.people (short_code);

CREATE INDEX IF NOT EXISTS idx_people_name
  ON public.people (name);

CREATE INDEX IF NOT EXISTS idx_people_person_type
  ON public.people (person_type);

CREATE INDEX IF NOT EXISTS idx_people_is_active
  ON public.people (is_active);

CREATE UNIQUE INDEX IF NOT EXISTS idx_people_document_number_unique
  ON public.people (document_number)
  WHERE document_number IS NOT NULL AND btrim(document_number) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_people_cnh_number_unique
  ON public.people (cnh_number)
  WHERE cnh_number IS NOT NULL AND btrim(cnh_number) <> '';

DROP TRIGGER IF EXISTS update_people_updated_at ON public.people;
CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON public.people
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on people" ON public.people;
CREATE POLICY "Allow public read on people"
  ON public.people FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on people" ON public.people;
CREATE POLICY "Allow public insert on people"
  ON public.people FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on people" ON public.people;
CREATE POLICY "Allow public update on people"
  ON public.people FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on people" ON public.people;
CREATE POLICY "Allow public delete on people"
  ON public.people FOR DELETE
  USING (true);

INSERT INTO public.people (
  id,
  short_code,
  person_type,
  name,
  phone,
  notes,
  cnh_number,
  cnh_valid_until,
  cnh_file_path,
  cnh_file_url,
  cnh_file_name,
  cnh_file_type,
  origin,
  is_active,
  created_at,
  updated_at
)
SELECT
  d.id,
  d.short_code,
  'Funcionario',
  d.name,
  COALESCE(d.phone, ''),
  COALESCE(d.notes, ''),
  d.cnh_number,
  d.cnh_valid_until,
  d.cnh_file_path,
  d.cnh_file_url,
  d.cnh_file_name,
  d.cnh_file_type,
  'drivers',
  d.is_active,
  d.created_at,
  d.updated_at
FROM public.drivers d
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  max_code integer;
BEGIN
  SELECT COALESCE(MAX(short_code::int), 9999)
    INTO max_code
  FROM public.people
  WHERE short_code ~ '^[0-9]+$';

  IF max_code < 10000 THEN
    PERFORM setval('public.people_short_code_seq', 10000, false);
  ELSE
    PERFORM setval('public.people_short_code_seq', max_code, true);
  END IF;
END $$;

ALTER TABLE public.operational_movements
  DROP CONSTRAINT IF EXISTS operational_movements_driver_id_fkey;

ALTER TABLE public.operational_movements
  ADD CONSTRAINT operational_movements_driver_id_fkey
  FOREIGN KEY (driver_id)
  REFERENCES public.people(id)
  ON UPDATE CASCADE
  ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.personal_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code text NOT NULL DEFAULT public.generate_short_code('public.personal_vehicles_short_code_seq'::regclass),
  person_id uuid NOT NULL REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  plate text NOT NULL,
  name text DEFAULT '',
  notes text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_personal_vehicles_short_code_unique
  ON public.personal_vehicles (short_code);

CREATE UNIQUE INDEX IF NOT EXISTS idx_personal_vehicles_plate_unique
  ON public.personal_vehicles (upper(plate));

CREATE INDEX IF NOT EXISTS idx_personal_vehicles_person_id
  ON public.personal_vehicles (person_id);

CREATE INDEX IF NOT EXISTS idx_personal_vehicles_is_active
  ON public.personal_vehicles (is_active);

DROP TRIGGER IF EXISTS update_personal_vehicles_updated_at ON public.personal_vehicles;
CREATE TRIGGER update_personal_vehicles_updated_at
  BEFORE UPDATE ON public.personal_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.personal_vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on personal_vehicles" ON public.personal_vehicles;
CREATE POLICY "Allow public read on personal_vehicles"
  ON public.personal_vehicles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on personal_vehicles" ON public.personal_vehicles;
CREATE POLICY "Allow public insert on personal_vehicles"
  ON public.personal_vehicles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on personal_vehicles" ON public.personal_vehicles;
CREATE POLICY "Allow public update on personal_vehicles"
  ON public.personal_vehicles FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on personal_vehicles" ON public.personal_vehicles;
CREATE POLICY "Allow public delete on personal_vehicles"
  ON public.personal_vehicles FOR DELETE
  USING (true);

CREATE TABLE IF NOT EXISTS public.access_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code text NOT NULL DEFAULT public.generate_short_code('public.access_records_short_code_seq'::regclass),
  person_id uuid NOT NULL REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  person_name text NOT NULL,
  person_type text NOT NULL CHECK (person_type IN ('Funcionario', 'Terceirizado', 'Visitante')),
  host_person_id uuid REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE SET NULL,
  host_person_name text NOT NULL,
  personal_vehicle_id uuid REFERENCES public.personal_vehicles(id) ON UPDATE CASCADE ON DELETE SET NULL,
  vehicle_plate text DEFAULT '',
  reason text DEFAULT '',
  entry_date date NOT NULL,
  entry_time time NOT NULL,
  exit_date date,
  exit_time time,
  document_file_path text,
  document_file_name text,
  document_file_type text,
  observations text DEFAULT '',
  status text NOT NULL DEFAULT 'Em aberto'
    CHECK (status IN ('Em aberto', 'Concluido')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_access_records_short_code_unique
  ON public.access_records (short_code);

CREATE INDEX IF NOT EXISTS idx_access_records_person_id
  ON public.access_records (person_id);

CREATE INDEX IF NOT EXISTS idx_access_records_host_person_id
  ON public.access_records (host_person_id);

CREATE INDEX IF NOT EXISTS idx_access_records_status
  ON public.access_records (status);

CREATE INDEX IF NOT EXISTS idx_access_records_entry_date
  ON public.access_records (entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_access_records_vehicle_plate
  ON public.access_records (vehicle_plate);

DROP TRIGGER IF EXISTS update_access_records_updated_at ON public.access_records;
CREATE TRIGGER update_access_records_updated_at
  BEFORE UPDATE ON public.access_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.access_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on access_records" ON public.access_records;
CREATE POLICY "Allow public read on access_records"
  ON public.access_records FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on access_records" ON public.access_records;
CREATE POLICY "Allow public insert on access_records"
  ON public.access_records FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on access_records" ON public.access_records;
CREATE POLICY "Allow public update on access_records"
  ON public.access_records FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on access_records" ON public.access_records;
CREATE POLICY "Allow public delete on access_records"
  ON public.access_records FOR DELETE
  USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('person-documents', 'person-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('access-documents', 'access-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Allow public read on person-documents" ON storage.objects;
CREATE POLICY "Allow public read on person-documents"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'person-documents');

DROP POLICY IF EXISTS "Allow public insert on person-documents" ON storage.objects;
CREATE POLICY "Allow public insert on person-documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'person-documents');

DROP POLICY IF EXISTS "Allow public update on person-documents" ON storage.objects;
CREATE POLICY "Allow public update on person-documents"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'person-documents')
  WITH CHECK (bucket_id = 'person-documents');

DROP POLICY IF EXISTS "Allow public delete on person-documents" ON storage.objects;
CREATE POLICY "Allow public delete on person-documents"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'person-documents');

DROP POLICY IF EXISTS "Allow public read on access-documents" ON storage.objects;
CREATE POLICY "Allow public read on access-documents"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'access-documents');

DROP POLICY IF EXISTS "Allow public insert on access-documents" ON storage.objects;
CREATE POLICY "Allow public insert on access-documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'access-documents');

DROP POLICY IF EXISTS "Allow public update on access-documents" ON storage.objects;
CREATE POLICY "Allow public update on access-documents"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'access-documents')
  WITH CHECK (bucket_id = 'access-documents');

DROP POLICY IF EXISTS "Allow public delete on access-documents" ON storage.objects;
CREATE POLICY "Allow public delete on access-documents"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'access-documents');
