-- ============================================================
-- FinTrack — Rollback de la migración 041 (notificaciones in-app)
-- Ejecutar en el SQL Editor de Supabase para revertir 041_notifications.sql
-- ============================================================

DROP FUNCTION IF EXISTS generate_stale_account_notifications();
DROP TABLE IF EXISTS notifications;
