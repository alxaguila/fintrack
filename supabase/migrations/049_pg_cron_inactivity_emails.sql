-- ============================================================
-- zafyros — Migración 049: scheduler pg_cron para emails de inactividad
-- Ejecutar en el SQL Editor de Supabase (después de 001–048)
-- ============================================================
--
-- No hay cron ni Edge Function programada en el proyecto hasta ahora (todo
-- se calculaba bajo demanda desde el cliente). Esta migración añade el
-- primer job programado: una vez al día llama a la Edge Function
-- `send-inactivity-emails` (ver supabase/functions/send-inactivity-emails),
-- que a su vez detecta usuarios con cuentas sin actualizar y manda el aviso
-- por Resend.
--
-- Pasos MANUALES antes/después de ejecutar este SQL (no se pueden hacer
-- desde una migración):
--
--   1. Habilitar las extensiones pg_cron y pg_net desde el dashboard de
--      Supabase (Database → Extensions) si tu plan no las tiene ya activas
--      — en algunos planes CREATE EXTENSION aquí falla sin ese paso previo.
--
--   2. Desplegar la function:
--        supabase functions deploy send-inactivity-emails
--      y fijar sus secrets:
--        supabase secrets set RESEND_API_KEY=... CRON_SECRET=...
--      (RESEND_API_KEY ya debería existir si send-auth-email está desplegada).
--
--   3. Guardar el mismo CRON_SECRET en Supabase Vault (SQL Editor):
--        select vault.create_secret('<el mismo valor de CRON_SECRET>', 'cron_secret');
--
--   4. Sustituir '<project-ref>' más abajo por el ref real del proyecto
--      (Project Settings → General → Reference ID) antes de ejecutar este
--      archivo.
--
-- Horario: 09:00 UTC todos los días. Idempotente: cron.schedule con el
-- mismo nombre de job actualiza el job existente en vez de duplicarlo.
-- ------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

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
