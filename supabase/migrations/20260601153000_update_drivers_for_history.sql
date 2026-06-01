-- ============================================================================
-- Ajustes na tabela de motoristas para suportar importacao de historico
-- ============================================================================

ALTER TABLE public.drivers
  ALTER COLUMN cnh_number DROP NOT NULL,
  ALTER COLUMN cnh_valid_until DROP NOT NULL;

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'drivers_origin_check'
  ) THEN
    ALTER TABLE public.drivers
      ADD CONSTRAINT drivers_origin_check CHECK (origin IN ('manual', 'historico'));
  END IF;
END $$;

DROP INDEX IF EXISTS idx_drivers_cnh_number_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_cnh_number_unique
  ON public.drivers (cnh_number);

