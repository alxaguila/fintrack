-- ============================================================
-- FinTrack — Rollback de 028_merge_cafe_breakfast.sql
-- Ejecutar en el SQL Editor de Supabase para deshacer el cambio.
--
-- LIMITACIÓN: solo recrea la subcategoría `cafe_breakfast` en el catálogo.
-- No puede reconstruir qué movimientos/reglas/votos/presupuestos venían
-- originalmente de cafetería frente a restaurante — eso quedó fusionado sin
-- distinción en 028 y no es recuperable desde aquí.
-- ============================================================

INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT g.id, 'cafe_breakfast', 'coffee', 30
FROM category_groups g
WHERE g.slug = 'food_leisure'
ON CONFLICT (slug) DO NOTHING;
