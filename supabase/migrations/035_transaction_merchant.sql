-- ============================================================
-- FinTrack — Migración 035: enlazar comercios (merchants) a transactions
-- Ejecutar en el SQL Editor de Supabase (después de 001–034)
-- ============================================================
--
-- Fase 2 del catálogo de comercios (ver migración 034): cada movimiento pasa
-- a saber a qué comercio pertenece (merchant_id), para que Movimientos pueda
-- mostrar su logo en vez del icono genérico de categoría.
--
-- Sin selección manual de patrones: el propio nombre del comercio actúa como
-- patrón de coincidencia (palabra/frase completa, normalizado en mayúsculas
-- sin tildes) contra transactions.concept — mismo criterio que ya usa el
-- diccionario integrado (matchBuiltinCategory/tokenString en
-- src/lib/categoryRules.ts), replicado aquí en SQL solo para el nombre del
-- comercio (no hace falta portar el resto de la lógica de limpieza de
-- conceptos, mucho más compleja, porque aquí se compara contra un nombre de
-- comercio ya limpio, no contra un patrón de diccionario con ruido).
--
-- admin_link_merchant_transactions(): función SECURITY DEFINER que la propia
-- pantalla /admin/comercios llama por RPC justo al guardar un comercio, para
-- re-escanear TODO el histórico (de todos los usuarios) y etiquetar lo que
-- encuentre — sin necesitar la Service Role Key ni desplegar nada aparte.
-- Gateada por public.is_admin() (migración 015), igual que el resto de RPCs
-- admin del proyecto.
--
-- Idempotente: se puede re-ejecutar sin error.
-- ------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_id);

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

REVOKE ALL ON FUNCTION admin_link_merchant_transactions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_link_merchant_transactions(uuid) TO authenticated;
