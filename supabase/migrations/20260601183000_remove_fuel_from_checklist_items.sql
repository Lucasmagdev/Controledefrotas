-- ============================================================================
-- Remover marcador de combustível dos itens do checklist
-- ============================================================================

DELETE FROM public.operational_checklist_items
WHERE item_key = 'combustivel';
