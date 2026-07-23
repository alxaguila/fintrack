-- ============================================================
-- FinTrack — Rollback de la migración 037
-- Ejecutar en el SQL Editor de Supabase para revertir 037_merchant_pattern_matching_fix.sql
-- ============================================================
--
-- Restaura admin_link_merchant_transactions a la versión de la migración 036
-- (sin limpiar puntuación del lado del patrón).

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
