-- ============================================================================
-- TIPO DE USO NOS REGISTROS DE VEICULOS
-- ============================================================================

ALTER TABLE public.vehicle_records
  ADD COLUMN IF NOT EXISTS usage_type text;

UPDATE public.vehicle_records
SET usage_type = 'Comum'
WHERE usage_type IS NULL OR usage_type = '';

ALTER TABLE public.vehicle_records
  ALTER COLUMN usage_type SET DEFAULT 'Comum';

ALTER TABLE public.vehicle_records
  ALTER COLUMN usage_type SET NOT NULL;

ALTER TABLE public.vehicle_records
  DROP CONSTRAINT IF EXISTS vehicle_records_usage_type_check;

ALTER TABLE public.vehicle_records
  ADD CONSTRAINT vehicle_records_usage_type_check
    CHECK (usage_type IN ('Comum', 'Rota'));
