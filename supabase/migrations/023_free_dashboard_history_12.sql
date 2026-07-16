-- ============================================================
-- FinTrack — Migración 023: sube el histórico del Dashboard en FREE a 12 meses
-- Ejecutar en el SQL Editor de Supabase (después de 001–022)
-- ============================================================
--
-- La 022 sembró plan_limits.dashboard_history_months = 6 para FREE. Se sube a
-- 12: la gráfica de Análisis pasa a mostrar 12 grupos de columnas por defecto
-- (antes 6), y así el botón "cargar histórico completo" del frontend queda
-- bloqueado de forma coherente en FREE (no hay más historial que revelar,
-- porque el tope y la ventana por defecto coinciden).
-- ------------------------------------------------------------

UPDATE plan_limits
SET dashboard_history_months = 12, updated_at = NOW()
WHERE plan = 'free';
