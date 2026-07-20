-- ============================================================
-- FinTrack — Rollback de la migración 025
-- ============================================================

ALTER TABLE bank_formats DROP COLUMN IF EXISTS state_column;
