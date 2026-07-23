-- ============================================================
-- FinTrack — Rollback de la migración 040 (contador de uso por comercio)
-- Ejecutar en el SQL Editor de Supabase para revertir 040_merchant_usage_counts.sql
-- ============================================================

DROP FUNCTION IF EXISTS admin_merchant_usage_counts();
