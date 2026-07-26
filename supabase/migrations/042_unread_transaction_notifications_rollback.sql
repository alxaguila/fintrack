-- ============================================================
-- FinTrack — Rollback de la migración 042
-- Ejecutar en el SQL Editor de Supabase para revertir 042_unread_transaction_notifications.sql
-- ============================================================

DROP FUNCTION IF EXISTS generate_unread_transaction_notifications();
DROP INDEX IF EXISTS idx_transactions_profile_unread;
DROP INDEX IF EXISTS idx_notifications_user_pending_announce;
ALTER TABLE notifications DROP COLUMN IF EXISTS announced_at;
