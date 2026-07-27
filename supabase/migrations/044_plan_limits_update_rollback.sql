-- ============================================================
-- FinTrack — Rollback migración 044: ajuste de topes de plan
-- ============================================================

UPDATE plan_limits SET max_rules = 50, updated_at = NOW() WHERE plan = 'free';
UPDATE plan_limits SET max_movements_per_month = 3000, updated_at = NOW() WHERE plan = 'pro';
