-- ============================================================
-- FinTrack — Migración 043: fusionar "home_delivery" y "nightlife_drinks" en "restaurant"
-- Ejecutar en el SQL Editor de Supabase (después de 001–042)
-- ============================================================
--
-- Unifica en una sola subcategoría ("Restaurantes, bares y discotecas") lo que
-- antes eran tres: restaurant, home_delivery (comida a domicilio) y
-- nightlife_drinks (copas y vida nocturna) — el límite entre las tres era
-- difuso al clasificar movimientos. Se reutiliza el slug `restaurant` (mismo
-- criterio que la migración 028, cafe_breakfast → restaurant); las etiquetas
-- i18n se actualizan aparte en src/i18n/locales/{es,en}/categories.json.
--
-- A diferencia de 028, esta vez también existe `dictionary_rules` (migración
-- 032), que 028 no conocía — se reasigna igual que el resto de tablas.
-- `community_rule_usage` y `merchants` no tienen category_id (se indexan por
-- merchant_key/nombre), así que no necesitan tocarse.
--
-- AVISO: no es trivial de deshacer — el rollback recrea las dos subcategorías
-- pero no puede reconstruir qué votos/importes/movimientos venían de cuál.
-- ------------------------------------------------------------

DO $$
DECLARE
  v_keep_id  UUID;
  v_merge_id UUID;
  v_merge_slug TEXT;
BEGIN
  SELECT id INTO v_keep_id FROM categories WHERE slug = 'restaurant';

  IF v_keep_id IS NULL THEN
    RAISE NOTICE 'restaurant no encontrada — nada que fusionar (¿ya se ejecutó?).';
    RETURN;
  END IF;

  FOREACH v_merge_slug IN ARRAY ARRAY['home_delivery', 'nightlife_drinks']
  LOOP
    SELECT id INTO v_merge_id FROM categories WHERE slug = v_merge_slug;

    IF v_merge_id IS NULL THEN
      RAISE NOTICE '% no encontrada — se omite.', v_merge_slug;
      CONTINUE;
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
    --    la subcategoría fusionada si ya había orden guardado para restaurant.
    DELETE FROM budget_category_order bco_merge
    WHERE bco_merge.category_id = v_merge_id
      AND EXISTS (
        SELECT 1 FROM budget_category_order bco_keep
        WHERE bco_keep.category_id = v_keep_id AND bco_keep.profile_id = bco_merge.profile_id
      );

    UPDATE budget_category_order SET category_id = v_keep_id WHERE category_id = v_merge_id;

    -- 7) Diccionario integrado (migración 032): `pattern` es UNIQUE global,
    --    no por categoría, así que reasignar no puede chocar.
    UPDATE dictionary_rules SET category_id = v_keep_id WHERE category_id = v_merge_id;

    -- 8) Retirar la subcategoría fusionada del catálogo.
    DELETE FROM categories WHERE id = v_merge_id;
  END LOOP;
END $$;
