-- ============================================================
-- zafyros — Migración 051: emails de inactividad siempre a las 7h de Madrid
-- Ejecutar en el SQL Editor de Supabase (después de 001–050)
-- ============================================================
--
-- La migración 049 programaba el job a las 09:00 UTC fijo, que en Madrid son
-- las 11:00 en verano (CEST, UTC+2) o las 10:00 en invierno (CET, UTC+1) —
-- no coincide con "siempre a las 7h de España" que se pidió.
--
-- pg_cron programa en UTC y España cambia de huso horario dos veces al año,
-- así que no hay una única hora UTC fija que sea siempre las 7h en Madrid.
-- Solución: programar el job en las DOS horas UTC candidatas (05:00, que es
-- 7h en verano, y 06:00, que es 7h en invierno) y envolver la llamada en un
-- guard que solo llama de verdad a la Edge Function si, en el momento de la
-- ejecución, son efectivamente las 7h hora de Madrid (`AT TIME ZONE
-- 'Europe/Madrid'`). Así cada día se dispara la llamada real una sola vez,
-- en el job que coincide con el huso horario vigente ese día — sin depender
-- de tocar `cron.timezone` (GUC de superusuario, no disponible en Supabase
-- gestionado).
--
-- Idempotente: se puede re-ejecutar sin error (unschedule + schedule).
-- ------------------------------------------------------------

SELECT cron.unschedule('inactivity-emails-daily');

SELECT cron.schedule(
  'inactivity-emails-daily-madrid-cest',
  '0 5 * * *',
  $$
  SELECT CASE WHEN EXTRACT(hour FROM (now() AT TIME ZONE 'Europe/Madrid')) = 7
    THEN net.http_post(
      url := 'https://jgahtmyjyflmuunemrfg.functions.supabase.co/send-inactivity-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Cron-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
      ),
      body := '{}'::jsonb
    )
    ELSE NULL END;
  $$
);

SELECT cron.schedule(
  'inactivity-emails-daily-madrid-cet',
  '0 6 * * *',
  $$
  SELECT CASE WHEN EXTRACT(hour FROM (now() AT TIME ZONE 'Europe/Madrid')) = 7
    THEN net.http_post(
      url := 'https://jgahtmyjyflmuunemrfg.functions.supabase.co/send-inactivity-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Cron-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
      ),
      body := '{}'::jsonb
    )
    ELSE NULL END;
  $$
);
