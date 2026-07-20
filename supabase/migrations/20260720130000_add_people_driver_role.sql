-- Separa o cadastro geral de pessoas do papel de motorista.
-- Funcionarios existentes continuam como motoristas para preservar o
-- comportamento anterior; novos cadastros de pedestres usam o padrao false.

ALTER TABLE public.people
  ADD COLUMN IF NOT EXISTS is_driver boolean;

UPDATE public.people AS person
SET is_driver = (
  person_type = 'Funcionario'
  OR origin IN ('drivers', 'historico')
  OR cnh_number IS NOT NULL
  OR cnh_file_path IS NOT NULL
  OR EXISTS (
    SELECT 1
    FROM public.operational_movements movement
    WHERE movement.driver_id = person.id
  )
)
WHERE is_driver IS NULL;

ALTER TABLE public.people
  ALTER COLUMN is_driver SET DEFAULT false;

ALTER TABLE public.people
  ALTER COLUMN is_driver SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_people_is_driver
  ON public.people (is_driver);
