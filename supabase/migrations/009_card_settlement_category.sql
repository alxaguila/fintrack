-- ============================================================
-- FinTrack — Migración 009: subcategoría "Recibo de tarjeta"
-- ------------------------------------------------------------
-- Nueva subcategoría dentro del grupo non_computable. Se usa para los recibos
-- de liquidación de una tarjeta de crédito (recuperación del crédito ya
-- gastado): no son un ingreso real, así que van como no_computable.
-- El nombre visible se resuelve por i18n con el slug (category.card_settlement).
-- Idempotente: no duplica si ya existe.
-- ============================================================

INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT id, 'card_settlement', 'credit-card', 40
FROM category_groups
WHERE slug = 'non_computable'
ON CONFLICT (slug) DO NOTHING;
