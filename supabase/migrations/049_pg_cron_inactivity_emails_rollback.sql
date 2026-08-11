-- ============================================================
-- zafyros — Rollback de la migración 049 (scheduler pg_cron)
-- Ejecutar en el SQL Editor de Supabase para revertir 049_pg_cron_inactivity_emails.sql
-- ============================================================

SELECT cron.unschedule('inactivity-emails-daily');
SELECT vault.delete_secret((SELECT id FROM vault.secrets WHERE name = 'cron_secret'));
-- No se hace DROP EXTENSION pg_cron/pg_net: pueden estar en uso por otros
-- jobs o quedar gestionadas a nivel de proyecto en el dashboard de Supabase.
