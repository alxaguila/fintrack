-- ============================================================
-- FinTrack — Migración 044: ajuste de topes de plan (reglas FREE, movimientos PRO)
-- Ejecutar en el SQL Editor de Supabase (después de 001–043)
-- ============================================================
--
-- 1) FREE: max_rules 50 → 25.
-- 2) PRO: max_movements_per_month 3000 → 2000.
--
-- Presupuestos en FREE (has_budget) ya estaba en TRUE desde la migración 029,
-- que lo abrió como parche temporal "para feedback mientras se pule la
-- función". Con este cambio pasa a ser diseño oficial y permanente del plan
-- FREE: no se toca el valor (sigue TRUE), pero deja de ser un flag temporal.
-- Su restricción definitiva (3 sobres fijos: compras, restauración y hogar,
-- resto bloqueado con aviso de upgrade) vive en el frontend
-- (`src/lib/budgets.ts` / `src/pages/Budgets.tsx`), no en `plan_limits` —
-- no hace falta columna nueva porque no es un contador, es una lista fija.
-- ------------------------------------------------------------

UPDATE plan_limits SET max_rules = 25, updated_at = NOW() WHERE plan = 'free';
UPDATE plan_limits SET max_movements_per_month = 2000, updated_at = NOW() WHERE plan = 'pro';
