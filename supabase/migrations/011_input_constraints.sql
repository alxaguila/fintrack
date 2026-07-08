-- ============================================================
-- FinTrack — Endurecimiento de entradas (defensa en profundidad)
-- Ejecutar en el SQL Editor de Supabase (después de 001–010)
-- ============================================================
--
-- La validación del cliente (zod, maxLength) es solo la primera capa: cualquiera
-- puede saltársela y pegar directamente contra PostgREST con la anon key. Esta
-- migración añade el backstop real en la BD:
--   1) CHECK de longitud en las columnas de texto libre (evita payloads enormes).
--   2) Límite de mime/tamaño y aislamiento por dueño en el bucket account-logos.
--
-- Es idempotente: se puede re-ejecutar sin error.
-- Los límites son generosos (>= a los del cliente) para no rechazar datos ya
-- existentes; su objetivo es acotar el abuso, no recortar datos legítimos.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 1. CHECK de longitud en columnas de texto
-- ------------------------------------------------------------
ALTER TABLE financial_profiles DROP CONSTRAINT IF EXISTS chk_profile_name_len;
ALTER TABLE financial_profiles ADD  CONSTRAINT chk_profile_name_len
  CHECK (char_length(name) <= 80);

ALTER TABLE accounts DROP CONSTRAINT IF EXISTS chk_account_name_len;
ALTER TABLE accounts ADD  CONSTRAINT chk_account_name_len
  CHECK (char_length(name) <= 120);

ALTER TABLE accounts DROP CONSTRAINT IF EXISTS chk_account_entity_len;
ALTER TABLE accounts ADD  CONSTRAINT chk_account_entity_len
  CHECK (char_length(entity) <= 120);

ALTER TABLE accounts DROP CONSTRAINT IF EXISTS chk_account_logo_len;
ALTER TABLE accounts ADD  CONSTRAINT chk_account_logo_len
  CHECK (logo_url IS NULL OR char_length(logo_url) <= 1024);

ALTER TABLE accounts DROP CONSTRAINT IF EXISTS chk_account_iban_len;
ALTER TABLE accounts ADD  CONSTRAINT chk_account_iban_len
  CHECK (iban IS NULL OR char_length(iban) <= 34);

ALTER TABLE accounts DROP CONSTRAINT IF EXISTS chk_account_last_four_len;
ALTER TABLE accounts ADD  CONSTRAINT chk_account_last_four_len
  CHECK (last_four IS NULL OR char_length(last_four) <= 8);

ALTER TABLE keyword_rules DROP CONSTRAINT IF EXISTS chk_keyword_len;
ALTER TABLE keyword_rules ADD  CONSTRAINT chk_keyword_len
  CHECK (char_length(keyword) <= 120);

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_tx_concept_len;
ALTER TABLE transactions ADD  CONSTRAINT chk_tx_concept_len
  CHECK (char_length(concept) <= 1000);

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_tx_notes_len;
ALTER TABLE transactions ADD  CONSTRAINT chk_tx_notes_len
  CHECK (notes IS NULL OR char_length(notes) <= 500);

ALTER TABLE bank_formats DROP CONSTRAINT IF EXISTS chk_bank_format_name_len;
ALTER TABLE bank_formats ADD  CONSTRAINT chk_bank_format_name_len
  CHECK (char_length(name) <= 120);

ALTER TABLE bank_formats DROP CONSTRAINT IF EXISTS chk_bank_format_entity_len;
ALTER TABLE bank_formats ADD  CONSTRAINT chk_bank_format_entity_len
  CHECK (char_length(entity) <= 120);

-- ------------------------------------------------------------
-- 2. Endurecer el bucket de logos (account-logos)
-- ------------------------------------------------------------
-- Límite de tamaño (1 MB, igual que el cliente) y tipos de imagen permitidos,
-- ahora forzados en el servidor (el chequeo de `file.type` del cliente es
-- spoofeable). NOTA: se mantiene image/svg+xml porque el formulario lo admite y
-- las tarjetas lo pintan vía <img> (sin ejecutar scripts del SVG). Si se quiere
-- cerrar el vector de SVG-XSS al navegar directo a la URL, quítalo del array.
UPDATE storage.buckets
SET file_size_limit    = 1048576,
    allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']
WHERE id = 'account-logos';

-- Lectura pública (las tarjetas muestran el logo sin auth) — sin cambios.
DROP POLICY IF EXISTS "account-logos public read" ON storage.objects;
CREATE POLICY "account-logos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'account-logos');

-- Insert / update / delete: solo objetos cuya carpeta raíz sea un perfil del
-- propio usuario. La ruta de subida es `${profileId}/uuid.ext`, así que
-- (storage.foldername(name))[1] = profile_id. Antes, cualquier autenticado podía
-- escribir o borrar CUALQUIER logo del bucket; ahora queda acotado a los suyos.
DROP POLICY IF EXISTS "account-logos auth insert" ON storage.objects;
CREATE POLICY "account-logos auth insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'account-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM financial_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "account-logos auth update" ON storage.objects;
CREATE POLICY "account-logos auth update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'account-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM financial_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "account-logos auth delete" ON storage.objects;
CREATE POLICY "account-logos auth delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'account-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM financial_profiles WHERE user_id = auth.uid()
    )
  );
