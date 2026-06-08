-- ============================================================================
-- STATUS DE PÁTIO PARA VEÍCULOS
-- ============================================================================

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS in_patio boolean;

UPDATE public.vehicles
SET in_patio = (status = 'Ativo')
WHERE in_patio IS NULL;

ALTER TABLE public.vehicles
  ALTER COLUMN in_patio SET DEFAULT true;

ALTER TABLE public.vehicles
  ALTER COLUMN in_patio SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_in_patio
  ON public.vehicles (in_patio);
