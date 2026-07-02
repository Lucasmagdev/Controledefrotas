-- ============================================================================
-- Seed de veiculos pessoais informados pela portaria
-- ============================================================================

WITH raw_people(name) AS (
  VALUES
    ('Lorena Steffany Lima da Costa Silveira'),
    ('Gabriel Ferrari Amorim'),
    ('Amanda Rodrigues Bastos'),
    ('Amanda Beatriz Alves Nava'),
    ('Joao Victor Silva Lage'),
    ('Bruno Ferreira Flisch'),
    ('Marlon Nocci Marangon'),
    ('Isadora Alves Teixeira'),
    ('Thais Gabriela da Cunha'),
    ('Beatriz Martins Costa dos Santos'),
    ('Marcos Quispe Luna'),
    ('Guilherme Gustavo Martins Moreira'),
    ('Joao Vitor Silva Batista'),
    ('Tiago Fernandes Matias Pereira'),
    ('Elcione Mendonca Neri'),
    ('Adriano Augusto Fonseca Freitas'),
    ('Mariana Turci Lisboa Paulista'),
    ('Leandro Correa Santiago'),
    ('Samuel Werner Campos Nogueira'),
    ('Filipe Guimaraes Almeida'),
    ('Sabrina de Fatima Paula Mendes'),
    ('Tatiana Martins Baptista'),
    ('Nubia Passos de Paula')
),
inserted_people AS (
  INSERT INTO public.people (
    person_type,
    name,
    phone,
    company,
    notes,
    origin,
    is_active
  )
  SELECT
    'Funcionario',
    raw_people.name,
    '',
    '',
    'Cadastro inicial para veiculo pessoal',
    'manual',
    true
  FROM raw_people
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.people p
    WHERE lower(trim(p.name)) = lower(trim(raw_people.name))
  )
  RETURNING id, name
),
all_people AS (
  SELECT p.id, p.name
  FROM public.people p
  INNER JOIN raw_people r ON lower(trim(p.name)) = lower(trim(r.name))
  UNION
  SELECT id, name
  FROM inserted_people
),
vehicle_seed(person_name, plate) AS (
  VALUES
    ('Lorena Steffany Lima da Costa Silveira', 'SHH4G72'),
    ('Gabriel Ferrari Amorim', 'HKI8G63'),
    ('Amanda Rodrigues Bastos', 'RMV7H86'),
    ('Amanda Beatriz Alves Nava', 'HEA3720'),
    ('Joao Victor Silva Lage', 'GQR6J46'),
    ('Bruno Ferreira Flisch', 'BDW4G39'),
    ('Bruno Ferreira Flisch', 'HMJ1983'),
    ('Marlon Nocci Marangon', 'BCC4C03'),
    ('Isadora Alves Teixeira', 'PXT5137'),
    ('Thais Gabriela da Cunha', 'EZR2874'),
    ('Beatriz Martins Costa dos Santos', 'PXA4G13'),
    ('Marcos Quispe Luna', 'TEZ9J29'),
    ('Guilherme Gustavo Martins Moreira', 'QOG3901'),
    ('Joao Vitor Silva Batista', 'HLA0371'),
    ('Tiago Fernandes Matias Pereira', 'HCQ6443'),
    ('Elcione Mendonca Neri', 'OWQ5B13'),
    ('Adriano Augusto Fonseca Freitas', 'NZR8297'),
    ('Mariana Turci Lisboa Paulista', 'SIG0B78'),
    ('Leandro Correa Santiago', 'RJS0A40'),
    ('Samuel Werner Campos Nogueira', 'QNE8788'),
    ('Samuel Werner Campos Nogueira', 'SZH2B54'),
    ('Filipe Guimaraes Almeida', 'QQS6D45'),
    ('Filipe Guimaraes Almeida', 'PZI3I90'),
    ('Sabrina de Fatima Paula Mendes', 'QPG9J52'),
    ('Tatiana Martins Baptista', 'TDW0G09'),
    ('Nubia Passos de Paula', 'LRP3B99')
)
INSERT INTO public.personal_vehicles (
  person_id,
  plate,
  name,
  notes,
  is_active
)
SELECT
  all_people.id,
  vehicle_seed.plate,
  'Veiculo pessoal',
  'Cadastro inicial informado pela portaria',
  true
FROM vehicle_seed
INNER JOIN all_people ON lower(trim(all_people.name)) = lower(trim(vehicle_seed.person_name))
ON CONFLICT (upper(plate)) DO NOTHING;
