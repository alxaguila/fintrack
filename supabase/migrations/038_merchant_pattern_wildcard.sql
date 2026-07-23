-- ============================================================
-- FinTrack — Migración 038: comodín (*) en variaciones de comercio
-- Ejecutar en el SQL Editor de Supabase (después de 001–037)
-- ============================================================
--
-- El asterisco en una variación de concepto (merchant_patterns.pattern) pasa
-- a funcionar como comodín real ("cualquier secuencia de caracteres"), no
-- como texto literal — igual que matchMerchant() en el cliente
-- (src/lib/categoryRules.ts). Sin asterisco, sigue siendo coincidencia exacta
-- por palabra/frase completa (sin cambios).
--
-- Idempotente: se puede re-ejecutar sin error.
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

  -- Limpia cada patrón igual que el concepto (mayúsculas, sin tildes, sin
  -- puntuación) EXCEPTO el asterisco, que se conserva como comodín.
  SELECT array_agg(
    trim(regexp_replace(upper(unaccent(trim(pattern))), '[^A-Z0-9 *]+', ' ', 'g'))
  ) INTO v_patterns
  FROM merchant_patterns WHERE merchant_id = p_merchant_id;

  IF v_patterns IS NULL THEN
    v_patterns := ARRAY[trim(regexp_replace(upper(unaccent(trim(v_name))), '[^A-Z0-9 *]+', ' ', 'g'))];
  END IF;

  -- Ambos modos comparan contra el MISMO concepto limpio (mayúsculas, sin
  -- tildes, puntuación → espacio) — solo cambia si se exige palabra/frase
  -- completa (sin comodín) o substring libre (con comodín).
  UPDATE transactions
  SET merchant_id = p_merchant_id
  WHERE merchant_id IS NULL
    AND EXISTS (
      SELECT 1 FROM unnest(v_patterns) AS pat
      WHERE
        (pat LIKE '%*%' AND
         (' ' || regexp_replace(upper(unaccent(concept)), '[^A-Z0-9]+', ' ', 'g') || ' ')
               LIKE ('%' || replace(pat, '*', '%') || '%'))
        OR
        (pat NOT LIKE '%*%' AND
         (' ' || regexp_replace(upper(unaccent(concept)), '[^A-Z0-9]+', ' ', 'g') || ' ')
               LIKE ('% ' || pat || ' %'))
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
