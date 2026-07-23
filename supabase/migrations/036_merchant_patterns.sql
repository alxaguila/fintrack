-- ============================================================
-- FinTrack — Migración 036: variaciones de concepto por comercio
-- Ejecutar en el SQL Editor de Supabase (después de 001–035)
-- ============================================================
--
-- `matchMerchant()` (migración 035) solo comparaba el concepto contra el
-- nombre exacto del comercio (merchants.name). En la práctica un mismo
-- comercio aparece en los extractos con grafías distintas ("SANTAGLORIA" /
-- "SANTA GLORIA" / "S GLORIA"), que un único nombre no cubre.
--
-- merchant_patterns: lista de variaciones de concepto por comercio, palabra/
-- frase completa (mismo criterio que dictionary_rules.pattern). Si un
-- comercio tiene variaciones, se comprueban ELLAS (no el nombre); si no tiene
-- ninguna, el nombre del comercio sigue siendo el patrón por defecto.
--
-- Idempotente: se puede re-ejecutar sin error.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS merchant_patterns (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid        NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  pattern     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id, pattern)
);

ALTER TABLE merchant_patterns DROP CONSTRAINT IF EXISTS chk_merchant_pattern_len;
ALTER TABLE merchant_patterns ADD  CONSTRAINT chk_merchant_pattern_len
  CHECK (char_length(pattern) BETWEEN 2 AND 80);

ALTER TABLE merchant_patterns DROP CONSTRAINT IF EXISTS chk_merchant_pattern_upper;
ALTER TABLE merchant_patterns ADD  CONSTRAINT chk_merchant_pattern_upper
  CHECK (pattern = upper(pattern));

CREATE INDEX IF NOT EXISTS idx_merchant_patterns_merchant ON merchant_patterns(merchant_id);

ALTER TABLE merchant_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "merchant_patterns read" ON merchant_patterns;
CREATE POLICY "merchant_patterns read"
  ON merchant_patterns FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "merchant_patterns admin insert" ON merchant_patterns;
CREATE POLICY "merchant_patterns admin insert"
  ON merchant_patterns FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "merchant_patterns admin delete" ON merchant_patterns;
CREATE POLICY "merchant_patterns admin delete"
  ON merchant_patterns FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, DELETE ON merchant_patterns TO authenticated;

-- ------------------------------------------------------------
-- admin_link_merchant_transactions: ahora usa merchant_patterns si existen,
-- si no cae al nombre del comercio (mismo criterio que matchMerchant() en
-- src/lib/categoryRules.ts). Misma firma que en la migración 035.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_link_merchant_transactions(p_merchant_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name     text;
  v_patterns text[];
  v_count    integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT name INTO v_name FROM merchants WHERE id = p_merchant_id;
  IF v_name IS NULL THEN RETURN 0; END IF;

  SELECT array_agg(upper(unaccent(trim(pattern)))) INTO v_patterns
  FROM merchant_patterns WHERE merchant_id = p_merchant_id;

  IF v_patterns IS NULL THEN
    v_patterns := ARRAY[upper(unaccent(trim(v_name)))];
  END IF;

  UPDATE transactions
  SET merchant_id = p_merchant_id
  WHERE merchant_id IS NULL
    AND EXISTS (
      SELECT 1 FROM unnest(v_patterns) AS pat
      WHERE (' ' || regexp_replace(upper(unaccent(concept)), '[^A-Z0-9]+', ' ', 'g') || ' ')
            LIKE ('% ' || pat || ' %')
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
