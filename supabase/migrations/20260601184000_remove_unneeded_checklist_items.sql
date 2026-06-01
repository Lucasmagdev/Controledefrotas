-- ============================================================================
-- Remover itens dispensados do checklist operacional
-- ============================================================================

DELETE FROM public.operational_checklist_items
WHERE item_key IN ('documentos', 'freios', 'ferramentas');
