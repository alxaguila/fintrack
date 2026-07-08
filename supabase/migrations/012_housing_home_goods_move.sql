-- ============================================================
-- FinTrack — Reubica "Hogar y decoración" (home_goods) al grupo Hogar
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================
--
-- Cambios de taxonomía asociados a este cambio (los nombres visibles
-- se resuelven por i18n, no viven en la BD, así que aquí solo se
-- reubica la subcategoría):
--
--   · Grupo "Vivienda" (slug housing) pasa a mostrarse como "Hogar".
--   · rent_purchase: "Alquiler y compra" → "Alquiler".
--   · mortgage:      "Hipoteca" → "Hipoteca y compra".
--   · other_housing: "Otros vivienda" → "Otros hogar".
--   · home_goods ("Hogar y decoración") se MUEVE del grupo Compras
--     (shopping) al grupo Hogar (housing) para no duplicarla.
--
-- El slug home_goods no cambia, por lo que ni las reglas del usuario
-- (keyword_rules, por category_id) ni el diccionario built-in
-- (categoryRules.ts, por slug) ni los movimientos ya clasificados se
-- ven afectados: solo cambia el grupo al que pertenece la subcategoría.
-- ============================================================

UPDATE categories
SET
  group_id   = (SELECT id FROM category_groups WHERE slug = 'housing'),
  sort_order = 55
WHERE slug = 'home_goods';
