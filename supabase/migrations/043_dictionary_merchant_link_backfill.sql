-- 043_dictionary_merchant_link_backfill.sql
--
-- dictionary_rules.merchant_id existe desde la migración 034 pero ningún flujo
-- de la app lo rellenaba (ni siquiera el puente diccionario → comercio). Este
-- backfill enlaza, de forma conservadora (match exacto de patrón o de nombre,
-- sin comodines "*"), los pares comercio/regla que YA coinciden por texto hoy,
-- para que la nueva UI (crear regla desde un comercio y viceversa) parta de un
-- estado consistente. Los pares que solo coinciden por comodín siguen
-- resolviéndose por la heurística en tiempo de render hasta que se editen.

UPDATE dictionary_rules dr
SET merchant_id = m.id
FROM merchants m
WHERE dr.merchant_id IS NULL
  AND (
    EXISTS (
      SELECT 1 FROM merchant_patterns mp
      WHERE mp.merchant_id = m.id AND mp.pattern = dr.pattern
    )
    OR (
      NOT EXISTS (SELECT 1 FROM merchant_patterns mp2 WHERE mp2.merchant_id = m.id)
      AND upper(m.name) = dr.pattern
    )
  );
