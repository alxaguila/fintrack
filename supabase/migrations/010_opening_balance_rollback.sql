-- ============================================================
-- FinTrack — Rollback de 010_opening_balance.sql
-- Ejecutar en el SQL Editor de Supabase para deshacer el modelo de saldo por suma.
-- No se pierde ningún dato de movimientos: la columna transactions.balance nunca
-- se tocó, así que al revertir el código el saldo vuelve a leerse de ahí como antes.
-- ============================================================

DROP VIEW IF EXISTS v_account_monthly_flow;
DROP VIEW IF EXISTS v_account_balances;
ALTER TABLE accounts DROP COLUMN IF EXISTS opening_balance;
