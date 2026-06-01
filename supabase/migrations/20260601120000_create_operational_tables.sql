-- ============================================================================
-- Aba operacional de patio e checklist
-- ============================================================================

-- Tabela de motoristas
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnh_number text NOT NULL UNIQUE,
  cnh_valid_until date NOT NULL,
  phone text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drivers_name
  ON public.drivers (name);

CREATE INDEX IF NOT EXISTS idx_drivers_cnh_valid_until
  ON public.drivers (cnh_valid_until);

DROP TRIGGER IF EXISTS update_drivers_updated_at ON public.drivers;
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on drivers" ON public.drivers;
CREATE POLICY "Allow public read on drivers"
  ON public.drivers
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on drivers" ON public.drivers;
CREATE POLICY "Allow public insert on drivers"
  ON public.drivers
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on drivers" ON public.drivers;
CREATE POLICY "Allow public update on drivers"
  ON public.drivers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on drivers" ON public.drivers;
CREATE POLICY "Allow public delete on drivers"
  ON public.drivers
  FOR DELETE
  USING (true);

-- Movimentacoes operacionais
CREATE TABLE IF NOT EXISTS public.operational_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  vehicle_plate text NOT NULL,
  operation_type text NOT NULL
    CHECK (operation_type IN ('Obras', 'Trajeto curto', 'Viagem')),
  driver_id uuid REFERENCES public.drivers(id) ON UPDATE CASCADE ON DELETE SET NULL,
  driver_name text NOT NULL,
  driver_cnh_number text NOT NULL,
  driver_cnh_valid_until date NOT NULL,
  qr_identifier text DEFAULT '',
  entry_date date NOT NULL,
  entry_time time NOT NULL,
  entry_odometer numeric NOT NULL,
  entry_fuel_level text NOT NULL
    CHECK (entry_fuel_level IN ('Reserva', '1/4', '1/2', '3/4', 'Cheio')),
  entry_observations text DEFAULT '',
  exit_date date,
  exit_time time,
  exit_odometer numeric,
  exit_fuel_level text
    CHECK (exit_fuel_level IN ('Reserva', '1/4', '1/2', '3/4', 'Cheio')),
  exit_observations text DEFAULT '',
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'Em aberto'
    CHECK (status IN ('Em aberto', 'Concluida')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operational_movements_vehicle_id
  ON public.operational_movements (vehicle_id);

CREATE INDEX IF NOT EXISTS idx_operational_movements_vehicle_plate
  ON public.operational_movements (vehicle_plate);

CREATE INDEX IF NOT EXISTS idx_operational_movements_status
  ON public.operational_movements (status);

CREATE INDEX IF NOT EXISTS idx_operational_movements_operation_type
  ON public.operational_movements (operation_type);

CREATE INDEX IF NOT EXISTS idx_operational_movements_entry_date
  ON public.operational_movements (entry_date DESC);

DROP TRIGGER IF EXISTS update_operational_movements_updated_at ON public.operational_movements;
CREATE TRIGGER update_operational_movements_updated_at
  BEFORE UPDATE ON public.operational_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.operational_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on operational_movements" ON public.operational_movements;
CREATE POLICY "Allow public read on operational_movements"
  ON public.operational_movements
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on operational_movements" ON public.operational_movements;
CREATE POLICY "Allow public insert on operational_movements"
  ON public.operational_movements
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on operational_movements" ON public.operational_movements;
CREATE POLICY "Allow public update on operational_movements"
  ON public.operational_movements
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on operational_movements" ON public.operational_movements;
CREATE POLICY "Allow public delete on operational_movements"
  ON public.operational_movements
  FOR DELETE
  USING (true);

-- Fotos das operacoes
CREATE TABLE IF NOT EXISTS public.operational_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id uuid NOT NULL REFERENCES public.operational_movements(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('Entrada', 'Saida')),
  file_path text NOT NULL,
  file_url text NOT NULL,
  caption text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operational_photos_movement_id
  ON public.operational_photos (movement_id);

CREATE INDEX IF NOT EXISTS idx_operational_photos_phase
  ON public.operational_photos (phase);

ALTER TABLE public.operational_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on operational_photos" ON public.operational_photos;
CREATE POLICY "Allow public read on operational_photos"
  ON public.operational_photos
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on operational_photos" ON public.operational_photos;
CREATE POLICY "Allow public insert on operational_photos"
  ON public.operational_photos
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on operational_photos" ON public.operational_photos;
CREATE POLICY "Allow public update on operational_photos"
  ON public.operational_photos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on operational_photos" ON public.operational_photos;
CREATE POLICY "Allow public delete on operational_photos"
  ON public.operational_photos
  FOR DELETE
  USING (true);

-- Bucket publico para anexos da operacao
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-operation-photos', 'vehicle-operation-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public read on vehicle-operation-photos" ON storage.objects;
CREATE POLICY "Allow public read on vehicle-operation-photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'vehicle-operation-photos');

DROP POLICY IF EXISTS "Allow public insert on vehicle-operation-photos" ON storage.objects;
CREATE POLICY "Allow public insert on vehicle-operation-photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'vehicle-operation-photos');

DROP POLICY IF EXISTS "Allow public update on vehicle-operation-photos" ON storage.objects;
CREATE POLICY "Allow public update on vehicle-operation-photos"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'vehicle-operation-photos')
  WITH CHECK (bucket_id = 'vehicle-operation-photos');

DROP POLICY IF EXISTS "Allow public delete on vehicle-operation-photos" ON storage.objects;
CREATE POLICY "Allow public delete on vehicle-operation-photos"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'vehicle-operation-photos');

