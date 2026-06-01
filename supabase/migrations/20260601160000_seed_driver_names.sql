-- ============================================================================
-- Seed de motoristas base para a lista suspensa
-- ============================================================================

WITH seed_names(name) AS (
  VALUES
    ('Ademilson Arcanjo'),
    ('Ademison Arcanjo'),
    ('Adriano Augusto'),
    ('Adriano Augusto Fonseca Freitas'),
    ('Adriano Eugênio'),
    ('Adriano Eugênio Coelho'),
    ('Agnaldo Moreira'),
    ('Alessandro Bragança'),
    ('Ana Flávia Castro'),
    ('Beatriz Martins'),
    ('Betao'),
    ('Bruna Elorde'),
    ('Bruna Garcia'),
    ('Bruna Larissa'),
    ('Bruno Ferreira'),
    ('Bruno Ferreira Flisch'),
    ('Bruno Flisch'),
    ('Carlos Eduardo'),
    ('Claudio Inacio'),
    ('Diego Dias'),
    ('Elcione Mendonça'),
    ('Elcione Neri'),
    ('Ezequiel Nunes'),
    ('Francisco Sales'),
    ('Gabriel Junio'),
    ('Gabriel Junior'),
    ('Gilmar Gomes'),
    ('Guilherme Martins'),
    ('Guilherme Moura'),
    ('Jair Bispo'),
    ('Jeslane Sousa'),
    ('João Gonçalves'),
    ('João Victor'),
    ('Julio Ferreira'),
    ('Kauã Oliveira'),
    ('Leonardo Ramos'),
    ('Lucas Estevam Mgalhães Bispo'),
    ('Lucas Magalhães'),
    ('Ludieles Jesus'),
    ('Luiz Augusto'),
    ('Mazaga'),
    ('Rafaela Vitoria'),
    ('Ramon Rodrigues'),
    ('Rodrigo Ortmann'),
    ('Sabrina Mendes'),
    ('Thais Cunha'),
    ('Thales Medeiros'),
    ('Thiago Vinicius'),
    ('Tiago Fernandes'),
    ('Valter Silva'),
    ('Welton'),
    ('Welton Antônio')
),
normalized_seed AS (
  SELECT DISTINCT ON (lower(trim(name))) name
  FROM seed_names
  ORDER BY lower(trim(name)), name
)
INSERT INTO public.drivers (
  name,
  cnh_number,
  cnh_valid_until,
  origin,
  is_active,
  phone,
  notes
)
SELECT
  s.name,
  NULL,
  NULL,
  'historico',
  true,
  '',
  'Seed inicial da lista de motoristas'
FROM normalized_seed s
WHERE NOT EXISTS (
  SELECT 1
  FROM public.drivers d
  WHERE lower(trim(d.name)) = lower(trim(s.name))
);

