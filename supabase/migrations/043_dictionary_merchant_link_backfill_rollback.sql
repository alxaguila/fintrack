-- Rollback de 043_dictionary_merchant_link_backfill.sql
--
-- Best-effort: limpia merchant_id solo en las filas que coinciden con el mismo
-- criterio que usó la migración de subida. No puede distinguir enlaces creados
-- manualmente desde la nueva UI después de aplicar esa migración — si ya se
-- usó la función nueva, revisar antes de ejecutar este rollback.

UPDATE dictionary_rules dr
SET merchant_id = NULL
FROM merchants m
WHERE dr.merchant_id = m.id
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
