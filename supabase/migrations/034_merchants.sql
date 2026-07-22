-- ============================================================
-- FinTrack — Migración 034: Catálogo de comercios (merchants)
-- Ejecutar en el SQL Editor de Supabase (después de 001–033)
-- ============================================================
--
-- Primer paso de "Admin > Comercios": un catálogo de comercios reconocidos
-- por el sistema de clasificación (MERCADONA, NETFLIX, IBERDROLA...), cada
-- uno con su logo. El fin último (fuera de esta migración) es que los
-- movimientos en Movimientos/Dashboard muestren el logo del comercio en vez
-- del icono genérico de categoría.
--
-- Solo el CRUD de esta migración; el enlace real transactions → comercio y
-- el backfill de prioridad (qué comercio tener logo primero, usando el
-- histórico) quedan para una fase posterior — ver memoria project_merchant_catalog.
--
-- merchant_id se añade como FK nullable a:
--   - dictionary_rules (migración 032): tabla estable, UPDATE/DELETE normales,
--     sin riesgo de que se pise.
--   - community_rule_usage (migración 033): idem, es upsert-only.
-- NO se añade a community_rules: esa tabla se borra y reinserta por completo
-- en cada voto (recompute_community_rule, migración 003), así que cualquier
-- columna extra ahí se perdería en el siguiente voto (mismo motivo por el que
-- la 033 ya evitó tocarla). Si en el futuro hace falta el FK también ahí,
-- habrá que actualizar recompute_community_rule para repoblarlo.
--
-- Idempotente: se puede re-ejecutar sin error.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 1. Tabla merchants
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchants (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL UNIQUE,
  logo_url    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE merchants DROP CONSTRAINT IF EXISTS chk_merchant_name_len;
ALTER TABLE merchants ADD  CONSTRAINT chk_merchant_name_len
  CHECK (char_length(name) BETWEEN 2 AND 80);

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "merchants read" ON merchants;
CREATE POLICY "merchants read"
  ON merchants FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "merchants admin insert" ON merchants;
CREATE POLICY "merchants admin insert"
  ON merchants FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "merchants admin update" ON merchants;
CREATE POLICY "merchants admin update"
  ON merchants FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "merchants admin delete" ON merchants;
CREATE POLICY "merchants admin delete"
  ON merchants FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON merchants TO authenticated;

-- ------------------------------------------------------------
-- 2. FK merchant_id en dictionary_rules y community_rule_usage
-- ------------------------------------------------------------
ALTER TABLE dictionary_rules
  ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_dictionary_rules_merchant ON dictionary_rules(merchant_id);

ALTER TABLE community_rule_usage
  ADD COLUMN IF NOT EXISTS merchant_id uuid REFERENCES merchants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_community_rule_usage_merchant ON community_rule_usage(merchant_id);

-- ------------------------------------------------------------
-- 3. Bucket merchant-logos (mismo patrón que bank-logos, migración 016)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'merchant-logos', 'merchant-logos', true, 1048576,
  ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Sin política pública de SELECT/listing: getPublicUrl no la necesita para
-- descargar, y una política de listado dispararía el warning del linter
-- "public_bucket_allows_listing" (mismo criterio aplicado a bank-logos, ver
-- migración 019).
DROP POLICY IF EXISTS "merchant-logos admin insert" ON storage.objects;
CREATE POLICY "merchant-logos admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'merchant-logos' AND public.is_admin());

DROP POLICY IF EXISTS "merchant-logos admin update" ON storage.objects;
CREATE POLICY "merchant-logos admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'merchant-logos' AND public.is_admin());

DROP POLICY IF EXISTS "merchant-logos admin delete" ON storage.objects;
CREATE POLICY "merchant-logos admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'merchant-logos' AND public.is_admin());
