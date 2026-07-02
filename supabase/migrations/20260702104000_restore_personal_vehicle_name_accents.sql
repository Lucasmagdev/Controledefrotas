-- ============================================================================
-- Restaurar acentos dos nomes cadastrados no seed de veiculos pessoais
-- ============================================================================

WITH name_updates(old_name, new_name) AS (
  VALUES
    ('Lorena Steffany Lima da Costa Silveira', 'Lorena Stéffany Lima da Costa Silveira'),
    ('Joao Victor Silva Lage', 'João Victor Silva Lage'),
    ('Thais Gabriela da Cunha', 'Thaís Gabriela da Cunha'),
    ('Elcione Mendonca Neri', 'Elcione Mendonça Neri'),
    ('Leandro Correa Santiago', 'Leandro Corrêa Santiago'),
    ('Filipe Guimaraes Almeida', 'Filipe Guimarães Almeida'),
    ('Nubia Passos de Paula', 'Núbia Passos de Paula')
)
UPDATE public.people p
SET
  name = name_updates.new_name,
  updated_at = now()
FROM name_updates
WHERE p.name = name_updates.old_name;
