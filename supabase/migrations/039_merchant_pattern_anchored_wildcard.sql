-- ============================================================
-- FinTrack — Migración 039: comodín anclado por posición
-- Ejecutar en el SQL Editor de Supabase (después de 001–038)
-- ============================================================
--
-- Hasta ahora cualquier variación con * casaba en cualquier posición, sin
-- importar dónde estuviera el asterisco ("*NOMBRE", "NOMBRE*" y "*NOMBRE*"
-- se comportaban igual). Ahora la posición importa (mismo criterio que un
-- glob), igual que en el cliente (matchMerchant/wildcardToRegex en
-- src/lib/categoryRules.ts):
--   NOMBRE*   → el concepto tiene que EMPEZAR por NOMBRE
--   *NOMBRE   → el concepto tiene que TERMINAR en NOMBRE
--   *NOMBRE*  → NOMBRE puede aparecer en cualquier posición
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
    trim(regexp_replace(upper(unaccent(trim(pattern))), '[^A-Z0-9 *]+', ' ', 'g'))
  ) INTO v_patterns
  FROM merchant_patterns WHERE merchant_id = p_merchant_id;

  IF v_patterns IS NULL THEN
    v_patterns := ARRAY[trim(regexp_replace(upper(unaccent(trim(v_name))), '[^A-Z0-9 *]+', ' ', 'g'))];
  END IF;

  UPDATE transactions
  SET merchant_id = p_merchant_id
  WHERE merchant_id IS NULL
    AND EXISTS (
      SELECT 1 FROM unnest(v_patterns) AS pat
      WHERE
        -- Con comodín: replace(pat,'*','%') conserva dónde estaba cada *, así
        -- que LIKE ya ancla solo por el lado que NO tiene *, sin lógica aparte.
        (pat LIKE '%*%' AND
         trim(regexp_replace(upper(unaccent(concept)), '[^A-Z0-9]+', ' ', 'g'))
               LIKE replace(pat, '*', '%'))
        OR
        -- Sin comodín: palabra/frase completa, igual que siempre.
        (pat NOT LIKE '%*%' AND
         (' ' || regexp_replace(upper(unaccent(concept)), '[^A-Z0-9]+', ' ', 'g') || ' ')
               LIKE ('% ' || pat || ' %'))
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
