-- ============================================================
-- FinTrack — Migración 019: entidades sugeridas por usuarios + fix bucket bank-logos
-- Ejecutar en el SQL Editor de Supabase (después de 001–018)
-- ============================================================
--
-- 1) Un usuario normal puede CREAR una entidad desde el desplegable de cuentas
--    cuando no encuentra la suya. Entra en el catálogo marcada como NO revisada
--    (reviewed=false) y SIN logo; el admin la revisa después (le añade logo) y al
--    guardarla queda revisada. Guardarraíles vía RLS: el usuario solo puede
--    insertar filas propias, pendientes y sin logo; no puede editar ni borrar.
--
-- 2) Reasegura las políticas del bucket `bank-logos` (la subida de logos desde
--    /admin fallaba con "new row violates row-level security policy" porque las
--    políticas de la 016 no llegaron a aplicarse). Idempotente.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 1. Columnas nuevas en bank_entities
-- ------------------------------------------------------------
ALTER TABLE bank_entities
  ADD COLUMN IF NOT EXISTS reviewed    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by  uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL;

-- Las filas existentes son del catálogo curado por el admin → revisadas (default).

-- Un usuario autenticado puede SUGERIR una entidad: fila propia, pendiente y sin
-- logo. La política de admin (015) sigue existiendo: al ser INSERT con varias
-- políticas, basta que UNA permita, así que el admin sigue pudiendo crear normal.
DROP POLICY IF EXISTS "bank_entities user suggest" ON bank_entities;
CREATE POLICY "bank_entities user suggest"
  ON bank_entities FOR INSERT TO authenticated
  WITH CHECK (
    reviewed = false
    AND created_by = auth.uid()
    AND logo_url IS NULL
  );

-- ------------------------------------------------------------
-- 2. Reasegurar bucket bank-logos + políticas (fix del error de subida)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bank-logos', 'bank-logos', true, 1048576,
  ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "bank-logos public read" ON storage.objects;
CREATE POLICY "bank-logos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bank-logos');

DROP POLICY IF EXISTS "bank-logos admin insert" ON storage.objects;
CREATE POLICY "bank-logos admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bank-logos' AND public.is_admin());

DROP POLICY IF EXISTS "bank-logos admin update" ON storage.objects;
CREATE POLICY "bank-logos admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'bank-logos' AND public.is_admin());

DROP POLICY IF EXISTS "bank-logos admin delete" ON storage.objects;
CREATE POLICY "bank-logos admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'bank-logos' AND public.is_admin());
