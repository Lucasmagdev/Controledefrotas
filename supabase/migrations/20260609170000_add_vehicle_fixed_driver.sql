-- Veiculos com condutor fixo ficam reservados e nao aparecem em retiradas comuns.
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS fixed_driver_name text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_vehicles_fixed_driver_name
  ON public.vehicles (fixed_driver_name)
  WHERE fixed_driver_name <> '';
