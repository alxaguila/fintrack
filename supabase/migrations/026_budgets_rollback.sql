-- ============================================================
-- FinTrack — Rollback de 026_budgets.sql
-- Ejecutar en el SQL Editor de Supabase para deshacer Presupuestos.
-- Se pierden todos los importes presupuestados (recurrentes y excepciones).
-- ============================================================

DROP TABLE IF EXISTS budget_overrides;
DROP TABLE IF EXISTS budget_rules;
