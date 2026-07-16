-- ============================================================
-- FinTrack — Rollback de la migración 022 (planes de suscripción)
-- ============================================================

DROP FUNCTION IF EXISTS public.get_plan_usage();

DROP TRIGGER IF EXISTS trg_log_plan_change ON user_settings;
DROP FUNCTION IF EXISTS public.log_plan_change();

DROP TABLE IF EXISTS plan_history;

DROP TRIGGER IF EXISTS trg_prevent_plan_self_change ON user_settings;
DROP FUNCTION IF EXISTS public.prevent_plan_self_change();

DROP TABLE IF EXISTS plan_limits;

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_plan_check;
ALTER TABLE user_settings DROP COLUMN IF EXISTS plan;
