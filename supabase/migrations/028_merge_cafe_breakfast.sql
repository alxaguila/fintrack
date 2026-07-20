-- ============================================================
-- FinTrack — Migración 028: fusionar "Cafeterías y desayunos" en "Restaurantes y bares"
-- Ejecutar en el SQL Editor de Supabase (después de 001–027)
-- ============================================================
--
-- Fusiona la subcategoría `cafe_breakfast` dentro de `restaurant`: reasigna
-- todo lo que apuntaba a cafe_breakfast y la retira del catálogo. Donde hay
-- restricciones UNIQUE que podrían chocar (un mismo perfil/comercio con fila
-- en ambas categorías), se fusiona el valor (voto/importe) en vez de perderlo.
--
-- AVISO: no es trivial de deshacer — el rollback recrea la subcategoría pero
-- no puede reconstruir qué votos/importes/movimientos venían de cuál.
-- ------------------------------------------------------------

DO $$
DECLARE
  v_keep_id  UUID;
  v_merge_id UUID;
BEGIN
  SELECT id INTO v_keep_id  FROM categories WHERE slug = 'restaurant';
  SELECT id INTO v_merge_id FROM categories WHERE slug = 'cafe_breakfast';

  IF v_keep_id IS NULL OR v_merge_id IS NULL THEN
    RAISE NOTICE 'restaurant/cafe_breakfast no encontradas — nada que fusionar (¿ya se ejecutó?).';
    RETURN;
  END IF;

  -- 1) Movimientos: sin restricción de unicidad, reasignación directa.
  UPDATE transactions SET category_id = v_keep_id WHERE category_id = v_merge_id;

  -- 2) Reglas de clasificación del usuario: reasignación directa.
  UPDATE keyword_rules SET category_id = v_keep_id WHERE category_id = v_merge_id;

  -- 3) Contribuciones individuales a la comunidad: la PK es (user_id, merchant_key),
  --    no incluye category_id, así que no puede haber colisión.
  UPDATE community_rule_contributions SET category_id = v_keep_id WHERE category_id = v_merge_id;

  -- 4) Agregado de comunidad (PK merchant_key+category_id): sumar votos donde
  --    ya exista fila para restaurant con el mismo comercio.
  UPDATE community_rules cr_keep
  SET votes = cr_keep.votes + cr_merge.votes, updated_at = NOW()
  FROM community_rules cr_merge
  WHERE cr_merge.category_id = v_merge_id
    AND cr_keep.category_id = v_keep_id
    AND cr_keep.merchant_key = cr_merge.merchant_key;

  DELETE FROM community_rules cr_merge
  WHERE cr_merge.category_id = v_merge_id
    AND EXISTS (
      SELECT 1 FROM community_rules cr_keep
      WHERE cr_keep.category_id = v_keep_id AND cr_keep.merchant_key = cr_merge.merchant_key
    );

  UPDATE community_rules SET category_id = v_keep_id WHERE category_id = v_merge_id;

  -- 5) Presupuestos (UNIQUE profile_id+category_id): sumar el importe donde el
  --    perfil ya tuviera regla en restaurant.
  UPDATE budget_rules br_keep
  SET amount = br_keep.amount + br_merge.amount, updated_at = NOW()
  FROM budget_rules br_merge
  WHERE br_merge.category_id = v_merge_id
    AND br_keep.category_id = v_keep_id
    AND br_keep.profile_id = br_merge.profile_id;

  DELETE FROM budget_rules br_merge
  WHERE br_merge.category_id = v_merge_id
    AND EXISTS (
      SELECT 1 FROM budget_rules br_keep
      WHERE br_keep.category_id = v_keep_id AND br_keep.profile_id = br_merge.profile_id
    );

  UPDATE budget_rules SET category_id = v_keep_id WHERE category_id = v_merge_id;

  -- 6) Orden manual de sobres (UNIQUE profile_id+category_id): descarta el de
  --    cafetería si ya había orden guardado para restaurant.
  DELETE FROM budget_category_order bco_merge
  WHERE bco_merge.category_id = v_merge_id
    AND EXISTS (
      SELECT 1 FROM budget_category_order bco_keep
      WHERE bco_keep.category_id = v_keep_id AND bco_keep.profile_id = bco_merge.profile_id
    );

  UPDATE budget_category_order SET category_id = v_keep_id WHERE category_id = v_merge_id;

  -- 7) Retirar la subcategoría fusionada del catálogo.
  DELETE FROM categories WHERE id = v_merge_id;
END $$;
