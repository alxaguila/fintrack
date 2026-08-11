-- ============================================================
-- zafyros — Rollback de la migración 048 (base para emails de inactividad)
-- Ejecutar en el SQL Editor de Supabase para revertir 048_inactivity_emails.sql
-- ============================================================

DROP FUNCTION IF EXISTS generate_stale_account_notifications_all_users();
ALTER TABLE user_settings DROP COLUMN IF EXISTS notify_inactivity_email;
ALTER TABLE notifications DROP COLUMN IF EXISTS emailed_at;
