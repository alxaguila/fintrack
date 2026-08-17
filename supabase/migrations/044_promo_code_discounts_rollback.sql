-- ============================================================
-- FinTrack — Rollback de la migración 044 (Descuento en códigos)
-- Ejecutar en el SQL Editor de Supabase para revertir 044_promo_code_discounts.sql
-- ============================================================

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_reward_exclusive;
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_discount_pair;
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_discount_percent_range;
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_discount_value;
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_discount_type;

ALTER TABLE promo_codes DROP COLUMN IF EXISTS discount_value;
ALTER TABLE promo_codes DROP COLUMN IF EXISTS discount_type;
