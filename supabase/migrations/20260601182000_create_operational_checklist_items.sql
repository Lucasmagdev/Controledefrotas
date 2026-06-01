-- ============================================================================
-- Checklist operacional normalizado por item
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.operational_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id uuid NOT NULL REFERENCES public.operational_movements(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('Entrada', 'Saida')),
  item_key text NOT NULL,
  item_label text NOT NULL,
  is_ok boolean NOT NULL DEFAULT false,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (movement_id, phase, item_key)
);

CREATE INDEX IF NOT EXISTS idx_operational_checklist_items_movement_id
  ON public.operational_checklist_items (movement_id);

CREATE INDEX IF NOT EXISTS idx_operational_checklist_items_phase
  ON public.operational_checklist_items (phase);

CREATE INDEX IF NOT EXISTS idx_operational_checklist_items_item_key
  ON public.operational_checklist_items (item_key);

DROP TRIGGER IF EXISTS update_operational_checklist_items_updated_at ON public.operational_checklist_items;
CREATE TRIGGER update_operational_checklist_items_updated_at
  BEFORE UPDATE ON public.operational_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.operational_checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on operational_checklist_items" ON public.operational_checklist_items;
CREATE POLICY "Allow public read on operational_checklist_items"
  ON public.operational_checklist_items
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on operational_checklist_items" ON public.operational_checklist_items;
CREATE POLICY "Allow public insert on operational_checklist_items"
  ON public.operational_checklist_items
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on operational_checklist_items" ON public.operational_checklist_items;
CREATE POLICY "Allow public update on operational_checklist_items"
  ON public.operational_checklist_items
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on operational_checklist_items" ON public.operational_checklist_items;
CREATE POLICY "Allow public delete on operational_checklist_items"
  ON public.operational_checklist_items
  FOR DELETE
  TO public
  USING (true);

WITH checklist_labels AS (
  SELECT *
  FROM (VALUES
    ('documentos', 'Documentos / autorizações'),
    ('pneus', 'Pneus e estepe'),
    ('freios', 'Freios'),
    ('luzes', 'Luzes e sinalização'),
    ('vidros', 'Vidros e espelhos'),
    ('limpeza', 'Limpeza geral'),
    ('ferramentas', 'Ferramentas / kit'),
    ('combustivel', 'Marcador de combustível'),
    ('odometro', 'Odômetro conferido'),
    ('avarias', 'Sem avarias aparentes')
  ) AS labels(item_key, item_label)
),
movement_phases AS (
  SELECT
    movement.id AS movement_id,
    phase.phase,
    movement.checklist -> phase.source_key AS phase_checklist
  FROM public.operational_movements AS movement
  CROSS JOIN (VALUES
    ('Entrada', 'entry'),
    ('Saida', 'exit')
  ) AS phase(phase, source_key)
  WHERE movement.checklist ? phase.source_key
)
INSERT INTO public.operational_checklist_items (
  movement_id,
  phase,
  item_key,
  item_label,
  is_ok,
  note,
  created_at,
  updated_at
)
SELECT
  movement_phases.movement_id,
  movement_phases.phase,
  checklist_labels.item_key,
  checklist_labels.item_label,
  COALESCE(((movement_phases.phase_checklist -> checklist_labels.item_key ->> 'ok')::boolean), false),
  COALESCE(movement_phases.phase_checklist -> checklist_labels.item_key ->> 'note', ''),
  now(),
  now()
FROM movement_phases
CROSS JOIN checklist_labels
WHERE movement_phases.phase_checklist ? checklist_labels.item_key
ON CONFLICT (movement_id, phase, item_key)
DO UPDATE SET
  item_label = EXCLUDED.item_label,
  is_ok = EXCLUDED.is_ok,
  note = EXCLUDED.note,
  updated_at = now();
