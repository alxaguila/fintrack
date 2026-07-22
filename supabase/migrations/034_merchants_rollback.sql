-- ============================================================
-- FinTrack — Rollback de la migración 034 (Catálogo de comercios)
-- Ejecutar en el SQL Editor de Supabase para revertir 034_merchants.sql
-- ============================================================

-- Políticas del bucket merchant-logos.
DROP POLICY IF EXISTS "merchant-logos admin insert" ON storage.objects;
DROP POLICY IF EXISTS "merchant-logos admin update" ON storage.objects;
DROP POLICY IF EXISTS "merchant-logos admin delete" ON storage.objects;

-- Nota: el bucket en sí no se borra automáticamente para no perder objetos ya
-- subidos. Si de verdad quieres eliminarlo, vacíalo antes y ejecuta:
--   DELETE FROM storage.buckets WHERE id = 'merchant-logos';

-- FK merchant_id en las tablas de clasificación.
DROP INDEX IF EXISTS idx_community_rule_usage_merchant;
ALTER TABLE community_rule_usage DROP COLUMN IF EXISTS merchant_id;

DROP INDEX IF EXISTS idx_dictionary_rules_merchant;
ALTER TABLE dictionary_rules DROP COLUMN IF EXISTS merchant_id;

-- Tabla merchants (políticas se borran solas con la tabla).
DROP TABLE IF EXISTS merchants;
