-- ============================================================
-- FinTrack — Vistas agregadas para el Dashboard
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================
--
-- Motivo: el Dashboard agregaba en cliente descargando TODAS las
-- transacciones del perfil. Con el tope de filas de PostgREST (1000)
-- y orden ascendente, los movimientos más recientes se perdían
-- (la gráfica se quedaba "congelada" en meses pasados).
--
-- Estas dos vistas mueven la agregación a la base de datos y se
-- consultan en grano (mes × tipo) y (mes × subcategoría × tipo),
-- de modo que cada consulta del Dashboard devuelve unas pocas
-- filas y nunca se acerca al tope, sea cual sea el volumen.
--
-- Ambas usan security_invoker = true para que respeten la RLS
-- existente de `transactions` (cada usuario ve solo lo suyo).
-- ============================================================

-- ------------------------------------------------------------
-- Serie de la gráfica: totales por mes y tipo.
-- Grano (perfil × mes × tipo) ≈ meses × 3 filas → siempre minúsculo.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_dashboard_totals
WITH (security_invoker = true) AS
SELECT
  t.profile_id,
  date_trunc('month', t.date)::date AS month,   -- 'YYYY-MM-01'
  t.transaction_type,
  SUM(t.amount)      AS total,       -- con signo
  SUM(ABS(t.amount)) AS total_abs    -- magnitud (altura de la barra)
FROM transactions t
GROUP BY
  t.profile_id,
  date_trunc('month', t.date)::date,
  t.transaction_type;

-- ------------------------------------------------------------
-- Desglose por subcategoría: se consulta SIEMPRE filtrado por el
-- rango de fechas del periodo activo, por lo que devuelve a lo sumo
-- (subcategorías × tipos) de ese periodo. category_id NULL = "sin categoría".
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_dashboard_breakdown
WITH (security_invoker = true) AS
SELECT
  t.profile_id,
  date_trunc('month', t.date)::date AS month,   -- 'YYYY-MM-01'
  t.category_id,                                 -- NULL = sin categoría
  t.transaction_type,
  SUM(ABS(t.amount)) AS total_abs,
  COUNT(*)           AS count
FROM transactions t
GROUP BY
  t.profile_id,
  date_trunc('month', t.date)::date,
  t.category_id,
  t.transaction_type;
