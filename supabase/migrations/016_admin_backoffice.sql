-- ============================================================
-- FinTrack — Migración 016: Backoffice /admin (bancos + categorías)
-- Ejecutar en el SQL Editor de Supabase (después de 001–015)
-- ============================================================
--
-- Da soporte de BD a las dos primeras pantallas del panel de administración:
--   1) Bucket `bank-logos`: logos de entidades bancarias subidos por el admin
--      (lectura pública, escritura solo is_admin()). Antes no había dónde
--      guardarlos (bank_entities.logo_url existe desde la 007 pero sin bucket).
--   2) Tabla `category_translations`: traducciones (ES/EN) de grupos y
--      subcategorías, editables por el admin EN RUNTIME. El bundle
--      categories.json sigue siendo la base; estas filas se fusionan/override
--      encima en el cliente (i18n.addResourceBundle), de modo que crear o
--      renombrar una categoría no exige redeploy.
--
-- Autorización: la escritura la gobierna is_admin() (migración 015). Lectura
-- para autenticados (los labels se usan en toda la app).
--
-- Idempotente: se puede re-ejecutar sin error.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 1. Bucket bank-logos
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

-- Lectura pública (los desplegables de cuentas muestran el logo sin auth).
DROP POLICY IF EXISTS "bank-logos public read" ON storage.objects;
CREATE POLICY "bank-logos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bank-logos');

-- Subir / reemplazar / borrar: solo admin.
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

-- ------------------------------------------------------------
-- 2. Tabla category_translations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS category_translations (
  key_type   text        NOT NULL CHECK (key_type IN ('group','category')),
  slug       text        NOT NULL,
  lang       text        NOT NULL CHECK (lang IN ('es','en')),
  label      text        NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key_type, slug, lang)
);

ALTER TABLE category_translations DROP CONSTRAINT IF EXISTS chk_cat_tr_slug_len;
ALTER TABLE category_translations ADD  CONSTRAINT chk_cat_tr_slug_len
  CHECK (char_length(slug) <= 80);

ALTER TABLE category_translations DROP CONSTRAINT IF EXISTS chk_cat_tr_label_len;
ALTER TABLE category_translations ADD  CONSTRAINT chk_cat_tr_label_len
  CHECK (char_length(label) <= 120);

ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;

-- Lectura para cualquier autenticado (los labels se pintan en toda la app).
DROP POLICY IF EXISTS "category_translations read" ON category_translations;
CREATE POLICY "category_translations read"
  ON category_translations FOR SELECT TO authenticated
  USING (true);

-- Escritura solo admin.
DROP POLICY IF EXISTS "category_translations admin insert" ON category_translations;
CREATE POLICY "category_translations admin insert"
  ON category_translations FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "category_translations admin update" ON category_translations;
CREATE POLICY "category_translations admin update"
  ON category_translations FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "category_translations admin delete" ON category_translations;
CREATE POLICY "category_translations admin delete"
  ON category_translations FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON category_translations TO authenticated;
