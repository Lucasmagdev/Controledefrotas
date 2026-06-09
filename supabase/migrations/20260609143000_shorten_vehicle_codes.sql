-- ============================================================================
-- CODIGOS DE VEICULOS COM 3 DIGITOS
-- Mantem o codigo anterior para compatibilidade com etiquetas e QRs existentes.
-- ============================================================================

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS legacy_short_code text;

UPDATE public.vehicles
SET legacy_short_code = short_code
WHERE legacy_short_code IS NULL
  AND short_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_legacy_short_code_unique
  ON public.vehicles (legacy_short_code)
  WHERE legacy_short_code IS NOT NULL;

ALTER TABLE public.vehicles
  ALTER COLUMN short_code DROP DEFAULT;

CREATE SEQUENCE IF NOT EXISTS public.vehicles_mobile_code_seq
  START WITH 101
  INCREMENT BY 1
  MINVALUE 101
  MAXVALUE 999
  NO CYCLE;

WITH numbered AS (
  SELECT
    id,
    (100 + ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id))::text AS generated_code
  FROM public.vehicles
)
UPDATE public.vehicles AS v
SET short_code = numbered.generated_code
FROM numbered
WHERE v.id = numbered.id
  AND v.short_code !~ '^[0-9]{3}$';

DO $$
DECLARE
  max_code integer;
BEGIN
  SELECT COALESCE(MAX(short_code::int), 100)
    INTO max_code
  FROM public.vehicles
  WHERE short_code ~ '^[0-9]{3}$';

  IF max_code >= 999 THEN
    RAISE EXCEPTION 'Limite de codigos curtos de veiculos atingido';
  ELSIF max_code < 101 THEN
    PERFORM setval('public.vehicles_mobile_code_seq', 101, false);
  ELSE
    PERFORM setval('public.vehicles_mobile_code_seq', max_code, true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_vehicle_mobile_code()
RETURNS text
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  next_code bigint;
BEGIN
  next_code := nextval('public.vehicles_mobile_code_seq');

  IF next_code > 999 THEN
    RAISE EXCEPTION 'Limite de codigos curtos de veiculos atingido';
  END IF;

  RETURN next_code::text;
END;
$$;

ALTER TABLE public.vehicles
  ALTER COLUMN short_code SET DEFAULT public.generate_vehicle_mobile_code();

ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_short_code_mobile_check;

ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_short_code_mobile_check
    CHECK (short_code ~ '^[0-9]{3}$' AND short_code::int BETWEEN 101 AND 999);
