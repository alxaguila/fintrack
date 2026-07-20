-- ============================================================
-- FinTrack — Rollback de 029_free_budgets_feedback.sql
-- Ejecutar en el SQL Editor de Supabase para volver a limitar Presupuestos a PRO/PREMIUM.
-- ============================================================

UPDATE plan_limits SET has_budget = FALSE WHERE plan = 'free';
