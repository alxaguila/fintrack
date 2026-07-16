-- ============================================================
-- FinTrack — Rollback de la migración 023
-- ============================================================

UPDATE plan_limits
SET dashboard_history_months = 6, updated_at = NOW()
WHERE plan = 'free';
