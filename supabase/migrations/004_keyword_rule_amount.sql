-- ============================================================
-- FinTrack — Condición de importe (opcional) en las reglas
-- Ejecutar en el SQL Editor de Supabase (después de 001–003)
-- ============================================================
--
-- Permite que una regla, además de casar por texto del concepto, exija que el
-- importe (en valor absoluto) esté por encima de un mínimo y/o por debajo de un
-- máximo. Ambos límites son opcionales: si los dos son NULL, la regla aplica a
-- cualquier importe (comportamiento actual).
-- ------------------------------------------------------------

ALTER TABLE keyword_rules
  ADD COLUMN amount_min DECIMAL(15,2),
  ADD COLUMN amount_max DECIMAL(15,2);
