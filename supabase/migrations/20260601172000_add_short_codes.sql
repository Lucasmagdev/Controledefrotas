-- ============================================================================
-- SHORT CODES (5 dígitos) para veículos, motoristas e movimentações operacionais
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_short_code(sequence_name regclass)
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT LPAD(nextval(sequence_name)::text, 5, '0');
$$;

-- Vehicles ------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS public.vehicles_short_code_seq
  START WITH 10000
  INCREMENT BY 1
  MINVALUE 10000
  MAXVALUE 99999
  NO CYCLE;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS short_code text;

WITH numbered AS (
  SELECT
    id,
    LPAD((10000 + ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id) - 1)::text, 5, '0') AS generated_code
  FROM public.vehicles
  WHERE short_code IS NULL
)
UPDATE public.vehicles AS v
SET short_code = numbered.generated_code
FROM numbered
WHERE v.id = numbered.id;

DO $$
DECLARE
  max_code integer;
BEGIN
  SELECT COALESCE(MAX(short_code::int), 9999)
    INTO max_code
  FROM public.vehicles;

  IF max_code < 10000 THEN
    PERFORM setval('public.vehicles_short_code_seq', 10000, false);
  ELSE
    PERFORM setval('public.vehicles_short_code_seq', max_code, true);
  END IF;
END $$;

ALTER TABLE public.vehicles
  ALTER COLUMN short_code SET DEFAULT public.generate_short_code('public.vehicles_short_code_seq'::regclass);

ALTER TABLE public.vehicles
  ALTER COLUMN short_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_short_code_unique
  ON public.vehicles (short_code);

-- Drivers -------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS public.drivers_short_code_seq
  START WITH 10000
  INCREMENT BY 1
  MINVALUE 10000
  MAXVALUE 99999
  NO CYCLE;

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS short_code text;

WITH numbered AS (
  SELECT
    id,
    LPAD((10000 + ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id) - 1)::text, 5, '0') AS generated_code
  FROM public.drivers
  WHERE short_code IS NULL
)
UPDATE public.drivers AS d
SET short_code = numbered.generated_code
FROM numbered
WHERE d.id = numbered.id;

DO $$
DECLARE
  max_code integer;
BEGIN
  SELECT COALESCE(MAX(short_code::int), 9999)
    INTO max_code
  FROM public.drivers;

  IF max_code < 10000 THEN
    PERFORM setval('public.drivers_short_code_seq', 10000, false);
  ELSE
    PERFORM setval('public.drivers_short_code_seq', max_code, true);
  END IF;
END $$;

ALTER TABLE public.drivers
  ALTER COLUMN short_code SET DEFAULT public.generate_short_code('public.drivers_short_code_seq'::regclass);

ALTER TABLE public.drivers
  ALTER COLUMN short_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_short_code_unique
  ON public.drivers (short_code);

-- Operational movements -----------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS public.operational_movements_short_code_seq
  START WITH 10000
  INCREMENT BY 1
  MINVALUE 10000
  MAXVALUE 99999
  NO CYCLE;

ALTER TABLE public.operational_movements
  ADD COLUMN IF NOT EXISTS short_code text;

WITH numbered AS (
  SELECT
    id,
    LPAD((10000 + ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id) - 1)::text, 5, '0') AS generated_code
  FROM public.operational_movements
  WHERE short_code IS NULL
)
UPDATE public.operational_movements AS m
SET short_code = numbered.generated_code
FROM numbered
WHERE m.id = numbered.id;

DO $$
DECLARE
  max_code integer;
BEGIN
  SELECT COALESCE(MAX(short_code::int), 9999)
    INTO max_code
  FROM public.operational_movements;

  IF max_code < 10000 THEN
    PERFORM setval('public.operational_movements_short_code_seq', 10000, false);
  ELSE
    PERFORM setval('public.operational_movements_short_code_seq', max_code, true);
  END IF;
END $$;

ALTER TABLE public.operational_movements
  ALTER COLUMN short_code SET DEFAULT public.generate_short_code('public.operational_movements_short_code_seq'::regclass);

ALTER TABLE public.operational_movements
  ALTER COLUMN short_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_operational_movements_short_code_unique
  ON public.operational_movements (short_code);
