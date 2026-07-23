-- ============================================================
-- FinTrack — Migración 040: contador de uso por comercio
-- Ejecutar en el SQL Editor de Supabase (después de 001–039)
-- ============================================================
--
-- A diferencia de dictionary_rules.use_count / community_rule_usage (que son
-- contadores incrementados aparte, migración 033), aquí no hace falta ningún
-- contador propio: transactions.merchant_id (migración 035) ya es la fuente
-- de verdad, así que basta con un COUNT(*) en vivo — siempre exacto, sin
-- nada que mantener sincronizado.
--
-- admin_merchant_usage_counts(): RPC admin-only (bypassa RLS para agregar
-- movimientos de TODOS los usuarios, igual que el resto de RPCs admin de este
-- proyecto) que devuelve, por comercio, cuántos movimientos tiene vinculados.
--
-- Idempotente: se puede re-ejecutar sin error.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION admin_merchant_usage_counts()
RETURNS TABLE(merchant_id uuid, use_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT t.merchant_id, count(*)::bigint
  FROM transactions t
  WHERE t.merchant_id IS NOT NULL
  GROUP BY t.merchant_id;
END;
$$;

REVOKE ALL ON FUNCTION admin_merchant_usage_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_merchant_usage_counts() TO authenticated;
