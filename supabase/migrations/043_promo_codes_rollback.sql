-- ============================================================
-- FinTrack — Rollback de la migración 043 (Códigos promocionales)
-- Ejecutar en el SQL Editor de Supabase para revertir 043_promo_codes.sql
-- ============================================================

DROP TRIGGER IF EXISTS trg_promo_codes_updated_at ON promo_codes;
DROP FUNCTION IF EXISTS set_promo_codes_updated_at();

-- Tabla promo_codes (políticas e índices se borran solos con la tabla).
DROP TABLE IF EXISTS promo_codes;
