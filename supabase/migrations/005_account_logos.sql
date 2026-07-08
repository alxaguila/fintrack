-- ============================================================
-- FinTrack — Logo por cuenta (URL o subida a Storage)
-- Ejecutar en el SQL Editor de Supabase (después de 001–004)
-- ============================================================
--
-- Cada cuenta puede tener un logo opcional (PNG con fondo transparente, SVG…).
-- El campo `logo_url` guarda la URL pública: bien una URL externa que pega el
-- usuario, bien la URL pública de un fichero subido al bucket `account-logos`.
-- Si está vacío, la tarjeta cae a un icono según el tipo de cuenta.
-- ------------------------------------------------------------

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- ------------------------------------------------------------
-- Bucket público para los logos subidos por el usuario.
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('account-logos', 'account-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública (las tarjetas muestran el logo sin auth).
DROP POLICY IF EXISTS "account-logos public read" ON storage.objects;
CREATE POLICY "account-logos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'account-logos');

-- Subir / reemplazar / borrar: solo usuarios autenticados.
DROP POLICY IF EXISTS "account-logos auth insert" ON storage.objects;
CREATE POLICY "account-logos auth insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'account-logos');

DROP POLICY IF EXISTS "account-logos auth update" ON storage.objects;
CREATE POLICY "account-logos auth update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'account-logos');

DROP POLICY IF EXISTS "account-logos auth delete" ON storage.objects;
CREATE POLICY "account-logos auth delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'account-logos');
