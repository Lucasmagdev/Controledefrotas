-- ============================================================================
-- Solicitacoes de inspecao de veiculo (admin pede, porteiro recebe e conclui)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vehicle_inspection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  vehicle_plate text NOT NULL,
  vehicle_name text NOT NULL DEFAULT '',
  requested_by text NOT NULL DEFAULT '',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'Pendente'
    CHECK (status IN ('Pendente', 'Concluida')),
  checklist jsonb,
  completed_by text,
  completed_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_vehicle_inspection_requests_status
  ON public.vehicle_inspection_requests (status);

CREATE INDEX IF NOT EXISTS idx_vehicle_inspection_requests_vehicle_id
  ON public.vehicle_inspection_requests (vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_inspection_requests_created_at
  ON public.vehicle_inspection_requests (created_at DESC);

DROP TRIGGER IF EXISTS update_vehicle_inspection_requests_updated_at ON public.vehicle_inspection_requests;
CREATE TRIGGER update_vehicle_inspection_requests_updated_at
  BEFORE UPDATE ON public.vehicle_inspection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.vehicle_inspection_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on vehicle_inspection_requests" ON public.vehicle_inspection_requests;
CREATE POLICY "Allow public read on vehicle_inspection_requests"
  ON public.vehicle_inspection_requests FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on vehicle_inspection_requests" ON public.vehicle_inspection_requests;
CREATE POLICY "Allow public insert on vehicle_inspection_requests"
  ON public.vehicle_inspection_requests FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on vehicle_inspection_requests" ON public.vehicle_inspection_requests;
CREATE POLICY "Allow public update on vehicle_inspection_requests"
  ON public.vehicle_inspection_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on vehicle_inspection_requests" ON public.vehicle_inspection_requests;
CREATE POLICY "Allow public delete on vehicle_inspection_requests"
  ON public.vehicle_inspection_requests FOR DELETE
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'vehicle_inspection_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_inspection_requests;
  END IF;
END $$;
