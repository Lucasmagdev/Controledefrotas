-- ============================================================================
-- PERMITIR CNH NULA EM MOVIMENTAÇÕES
-- ============================================================================

ALTER TABLE public.operational_movements
  ALTER COLUMN driver_cnh_number DROP NOT NULL;
