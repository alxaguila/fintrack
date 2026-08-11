-- ============================================================
-- zafyros — Rollback de la migración 051 (horario 7h Madrid)
-- Ejecutar en el SQL Editor de Supabase para revertir 051_inactivity_email_madrid_7am.sql
-- ============================================================
-- Restaura el job único de las 09:00 UTC introducido en 049_pg_cron_inactivity_emails.sql.

SELECT cron.unschedule('inactivity-emails-daily-madrid-cest');
SELECT cron.unschedule('inactivity-emails-daily-madrid-cet');

SELECT cron.schedule(
  'inactivity-emails-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jgahtmyjyflmuunemrfg.functions.supabase.co/send-inactivity-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    ),
    body := '{}'::jsonb
  )
  $$
);
