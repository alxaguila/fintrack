-- ============================================================
-- FinTrack — Rollback de la migración 035 (comercio en transactions)
-- Ejecutar en el SQL Editor de Supabase para revertir 035_transaction_merchant.sql
-- ============================================================

DROP FUNCTION IF EXISTS admin_link_merchant_transactions(uuid);

DROP INDEX IF EXISTS idx_transactions_merchant;
ALTER TABLE transactions DROP COLUMN IF EXISTS merchant_id;

-- Nota: la extensión unaccent no se elimina (podría estar en uso por otra
-- parte del esquema); es inofensiva dejarla activa.
