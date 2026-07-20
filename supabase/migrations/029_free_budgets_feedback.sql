-- ============================================================
-- FinTrack — Migración 029: activar Presupuestos también para el plan FREE
-- Ejecutar en el SQL Editor de Supabase (después de 001–028)
-- ============================================================
--
-- Temporal: se abre Presupuestos a todos los planes (incluido FREE) para
-- conseguir feedback mientras se termina de pulir la función. El gate de plan
-- del sidebar (`has_budget` en plan_limits) sigue siendo la única puerta — no
-- se toca código de la app, solo el flag por plan.
-- ------------------------------------------------------------

UPDATE plan_limits SET has_budget = TRUE WHERE plan = 'free';
