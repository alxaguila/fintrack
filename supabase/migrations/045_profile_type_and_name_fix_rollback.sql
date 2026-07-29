-- ============================================================
-- FinTrack — Rollback migración 045: tipo de perfil
-- ============================================================
-- El backfill de nombres NO es reversible (no se guarda el valor anterior);
-- este rollback solo revierte el cambio de esquema (columna `type`).

ALTER TABLE financial_profiles DROP CONSTRAINT IF EXISTS chk_financial_profiles_type;
ALTER TABLE financial_profiles DROP COLUMN IF EXISTS type;
