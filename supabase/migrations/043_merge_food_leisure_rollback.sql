-- ============================================================
-- FinTrack — Rollback de 043_merge_food_leisure.sql
-- Ejecutar en el SQL Editor de Supabase para deshacer el cambio.
--
-- LIMITACIÓN: solo recrea las subcategorías `home_delivery` y
-- `nightlife_drinks` en el catálogo. No puede reconstruir qué movimientos/
-- reglas/votos/presupuestos venían originalmente de cada una frente a
-- `restaurant` — eso quedó fusionado sin distinción en 043 y no es
-- recuperable desde aquí.
-- ============================================================

INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT g.id, 'home_delivery', 'bike', 20
FROM category_groups g
WHERE g.slug = 'food_leisure'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (group_id, slug, icon, sort_order)
SELECT g.id, 'nightlife_drinks', 'beer', 40
FROM category_groups g
WHERE g.slug = 'food_leisure'
ON CONFLICT (slug) DO NOTHING;
