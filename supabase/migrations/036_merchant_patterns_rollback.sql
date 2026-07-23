-- ============================================================
-- FinTrack — Rollback de la migración 036 (variaciones de comercio)
-- Ejecutar en el SQL Editor de Supabase para revertir 036_merchant_patterns.sql
-- ============================================================

-- Restaura admin_link_merchant_transactions a la versión de la migración 035
-- (solo compara contra el nombre del comercio).
CREATE OR REPLACE FUNCTION admin_link_merchant_transactions(p_merchant_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name    text;
  v_pattern text;
  v_count   integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT name INTO v_name FROM merchants WHERE id = p_merchant_id;
  IF v_name IS NULL THEN RETURN 0; END IF;
  v_pattern := upper(unaccent(trim(v_name)));

  UPDATE transactions
  SET merchant_id = p_merchant_id
  WHERE merchant_id IS NULL
    AND (' ' || regexp_replace(upper(unaccent(concept)), '[^A-Z0-9]+', ' ', 'g') || ' ')
        LIKE ('% ' || v_pattern || ' %');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

DROP TABLE IF EXISTS merchant_patterns;
