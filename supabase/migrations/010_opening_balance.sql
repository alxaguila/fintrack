-- ============================================================
-- FinTrack — Saldo por suma (saldo inicial por cuenta)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================
--
-- Cambia el modelo de saldo: en vez de leer un "saldo corrido" guardado por
-- movimiento (frágil ante reasignaciones/borrados), el saldo de una cuenta pasa a
-- calcularse EN VIVO como:
--
--     saldo(cuenta) = opening_balance + SUM(importes de sus movimientos)
--
-- Así, mover un movimiento de cuenta o borrarlo recalcula solo sumando en la cuenta
-- correcta. Es robusto y reversible por diseño.
--
-- NO destruye datos: solo AÑADE la columna `opening_balance` y dos vistas. La
-- columna `transactions.balance` se conserva intacta. Rollback en 010_..._rollback.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Columna: saldo inicial de la cuenta (antes de su 1er movimiento)
-- ------------------------------------------------------------
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(15,2);

-- ------------------------------------------------------------
-- 2. Backfill de cuentas bancarias existentes.
--    Derivamos opening_balance de los saldos por fila ya guardados:
--    opening = balance(ancla) - SUM(importes hasta e incluyendo el ancla),
--    donde el ancla es el movimiento con saldo no nulo más reciente.
--    (Los saldos por fila forman una cadena coherente, así que cualquier ancla da
--     el mismo opening; el saldo actual calculado coincide con el que se ve hoy.)
-- ------------------------------------------------------------
WITH anchor AS (
  SELECT DISTINCT ON (t.account_id)
    t.account_id,
    t.date       AS a_date,
    t.created_at AS a_created,
    t.balance    AS a_balance
  FROM transactions t
  WHERE t.balance IS NOT NULL
  ORDER BY t.account_id, t.date DESC, t.created_at DESC
),
opening AS (
  SELECT
    an.account_id,
    ROUND(
      an.a_balance - COALESCE(SUM(t.amount) FILTER (
        WHERE t.date < an.a_date
           OR (t.date = an.a_date AND t.created_at <= an.a_created)
      ), 0)
    , 2) AS value
  FROM anchor an
  JOIN transactions t ON t.account_id = an.account_id
  GROUP BY an.account_id, an.a_balance
)
UPDATE accounts a
SET opening_balance = o.value
FROM opening o
WHERE a.id = o.account_id
  AND a.type IN ('cuenta_corriente', 'ahorro')
  AND a.opening_balance IS NULL;

-- ------------------------------------------------------------
-- 3. Vista de saldo actual por cuenta: opening_balance + suma de importes.
--    security_invoker = true → respeta la RLS de accounts/transactions.
--    balance NULL cuando la cuenta no tiene saldo inicial fijado ("sin saldo").
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_account_balances
WITH (security_invoker = true) AS
SELECT
  a.id         AS account_id,
  a.profile_id,
  CASE WHEN a.opening_balance IS NULL THEN NULL
       ELSE a.opening_balance + COALESCE(SUM(t.amount), 0)
  END          AS balance,
  MAX(t.date)  AS last_movement_date,
  COUNT(t.id)  AS movement_count
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id
GROUP BY a.id, a.profile_id, a.opening_balance;

-- ------------------------------------------------------------
-- 4. Vista de flujo mensual por cuenta (SUM de importes por mes), para
--    reconstruir en cliente la gráfica de evolución de saldo (acumulado).
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_account_monthly_flow
WITH (security_invoker = true) AS
SELECT
  a.profile_id,
  t.account_id,
  date_trunc('month', t.date)::date AS month,
  SUM(t.amount)                     AS flow
FROM transactions t
JOIN accounts a ON a.id = t.account_id
GROUP BY a.profile_id, t.account_id, date_trunc('month', t.date)::date;
