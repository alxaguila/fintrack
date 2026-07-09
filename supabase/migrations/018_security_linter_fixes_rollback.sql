-- ============================================================
-- FinTrack — Rollback de 018_security_linter_fixes.sql
-- Restaura el estado anterior (reintroduce los avisos del linter).
-- ============================================================

-- GRUPO A — recrear las policies de lectura pública de los buckets.
DROP POLICY IF EXISTS "account-logos public read" ON storage.objects;
CREATE POLICY "account-logos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'account-logos');

DROP POLICY IF EXISTS "bank-logos public read" ON storage.objects;
CREATE POLICY "bank-logos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bank-logos');

-- GRUPO B — restaurar el grant EXECUTE por defecto (PUBLIC) de las funciones.
GRANT EXECUTE ON FUNCTION public.handle_new_user()                      TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.recompute_community_rule(text)         TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_community_vote(text, uuid)      TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_community_vote(text)            TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin()                            TO PUBLIC;
