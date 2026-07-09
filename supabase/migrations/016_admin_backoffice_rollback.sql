-- ============================================================
-- FinTrack — Rollback de la migración 016 (Backoffice /admin)
-- Ejecutar en el SQL Editor de Supabase para revertir 016_admin_backoffice.sql
-- ============================================================

-- 2'. Tabla de traducciones.
DROP TABLE IF EXISTS category_translations;

-- 1'. Políticas del bucket bank-logos.
DROP POLICY IF EXISTS "bank-logos public read"   ON storage.objects;
DROP POLICY IF EXISTS "bank-logos admin insert"  ON storage.objects;
DROP POLICY IF EXISTS "bank-logos admin update"  ON storage.objects;
DROP POLICY IF EXISTS "bank-logos admin delete"  ON storage.objects;

-- Nota: el bucket en sí no se borra automáticamente para no perder objetos ya
-- subidos. Si de verdad quieres eliminarlo, vacíalo antes y ejecuta:
--   DELETE FROM storage.buckets WHERE id = 'bank-logos';
