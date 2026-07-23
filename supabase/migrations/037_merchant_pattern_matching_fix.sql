-- ============================================================
-- FinTrack — Migración 037: corrige normalización de merchant_patterns
-- Ejecutar en el SQL Editor de Supabase (después de 001–036)
-- ============================================================
--
-- admin_link_merchant_transactions() (migración 036) limpiaba el CONCEPTO
-- (regexp_replace de puntuación a espacio) pero no el PATRÓN antes de
-- compararlos — un patrón con puntuación (p. ej. "GLOVO*", escrito a mano
-- pensando que el asterisco actuaba como comodín, cosa que este sistema no
-- soporta: la coincidencia es siempre por palabra/frase exacta) nunca podía
-- casar con nada, porque el concepto tokenizado nunca contiene asteriscos.
-- Mismo arreglo aplicado en el cliente a normalizePattern()
-- (src/lib/categoryRules.ts), reutilizada tanto para dictionary_rules como
-- para merchant_patterns.
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

  SELECT array_agg(
    trim(regexp_replace(upper(unaccent(trim(pattern))), '[^A-Z0-9]+', ' ', 'g'))
  ) INTO v_patterns
  FROM merchant_patterns WHERE merchant_id = p_merchant_id;

  IF v_patterns IS NULL THEN
    v_patterns := ARRAY[trim(regexp_replace(upper(unaccent(trim(v_name))), '[^A-Z0-9]+', ' ', 'g'))];
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
