-- ============================================================================
-- TIPO DE USO DOS VEICULOS
-- ============================================================================

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS usage_type text;

UPDATE public.vehicles
SET usage_type = 'Comum'
WHERE usage_type IS NULL OR usage_type = '';

ALTER TABLE public.vehicles
  ALTER COLUMN usage_type SET DEFAULT 'Comum';

ALTER TABLE public.vehicles
  ALTER COLUMN usage_type SET NOT NULL;

ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_usage_type_check;

ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_usage_type_check
    CHECK (usage_type IN ('Comum', 'Rota'));

CREATE INDEX IF NOT EXISTS idx_vehicles_usage_type
  ON public.vehicles (usage_type);
