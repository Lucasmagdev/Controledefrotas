-- ============================================================================
-- Permitir checklist de entrada sem CNH preenchida na movimentação operacional
-- ============================================================================

ALTER TABLE public.operational_movements
  ALTER COLUMN driver_cnh_number DROP NOT NULL,
  ALTER COLUMN driver_cnh_valid_until DROP NOT NULL;
