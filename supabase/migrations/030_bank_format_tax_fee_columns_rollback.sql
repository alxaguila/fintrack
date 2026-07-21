-- ============================================================
-- FinTrack — Rollback de la migración 030
-- ============================================================

ALTER TABLE bank_formats DROP COLUMN IF EXISTS tax_column;
ALTER TABLE bank_formats DROP COLUMN IF EXISTS fee_column;
