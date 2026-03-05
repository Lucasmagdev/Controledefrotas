-- ============================================================================
-- TABELA: vehicles (Cadastro de Veículos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text NOT NULL,
  name text NOT NULL,
  responsible_name text DEFAULT '',
  status text NOT NULL DEFAULT 'Ativo'
    CHECK (status IN ('Ativo', 'Inativo', 'Em Manut.')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_plate_unique
  ON public.vehicles (upper(plate));

CREATE INDEX IF NOT EXISTS idx_vehicles_status
  ON public.vehicles (status);

CREATE INDEX IF NOT EXISTS idx_vehicles_name
  ON public.vehicles (name);

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on vehicles" ON public.vehicles;
CREATE POLICY "Allow public read on vehicles"
  ON public.vehicles FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on vehicles" ON public.vehicles;
CREATE POLICY "Allow public insert on vehicles"
  ON public.vehicles FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on vehicles" ON public.vehicles;
CREATE POLICY "Allow public update on vehicles"
  ON public.vehicles FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on vehicles" ON public.vehicles;
CREATE POLICY "Allow public delete on vehicles"
  ON public.vehicles FOR DELETE
  TO public
  USING (true);
