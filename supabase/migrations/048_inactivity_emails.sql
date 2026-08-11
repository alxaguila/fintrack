-- ============================================================
-- zafyros — Migración 048: base para emails de inactividad
-- Ejecutar en el SQL Editor de Supabase (después de 001–047)
-- ============================================================
--
-- Añade lo necesario para que una Edge Function (invocada por pg_cron,
-- ver migración 049) pueda mandar por email el mismo aviso de "cuenta sin
-- actualizar" que ya se muestra in-app (migración 041), a usuarios que no
-- han abierto la app y por tanto nunca disparan el cálculo cliente-side.
--
-- 1. notifications.emailed_at: reutiliza la tabla como cola de envío, tal
--    como preveía el comentario de la migración 041 ("para que en el
--    futuro (fase de email) se pueda reutilizar como cola de envío").
--    NULL = pendiente de enviar; se marca al mandar el correo, así un aviso
--    'warning' se envía una sola vez y no se repite hasta escalar a
--    'critical' (mismo ciclo dedup_key/resolved_at que ya gestiona la RPC
--    original).
--
-- 2. user_settings.notify_inactivity_email: opt-out del usuario, editable
--    desde Ajustes.
--
-- 3. generate_stale_account_notifications_all_users(): igual que
--    generate_stale_account_notifications() (041) pero sin el filtro
--    `p.user_id = auth.uid()` — recorre TODOS los usuarios. No se toca la
--    función original (el aviso in-app sigue calculándose igual, por
--    sesión). Esta nueva función es SECURITY DEFINER y no se concede a
--    `authenticated`: solo la puede llamar el service role (Edge Function).
--
-- Idempotente: se puede re-ejecutar sin error.
-- ------------------------------------------------------------

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS emailed_at timestamptz;

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS notify_inactivity_email boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION generate_stale_account_notifications_all_users()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stale AS (
    SELECT
      a.id          AS account_id,
      a.profile_id  AS profile_id,
      p.user_id     AS user_id,
      (CURRENT_DATE - li.last_import_at::date) AS days_since,
      CASE WHEN (CURRENT_DATE - li.last_import_at::date) >= 30
           THEN 'critical' ELSE 'warning' END AS severity,
      a.name AS account_name,
      p.name AS profile_name
    FROM accounts a
    JOIN financial_profiles p ON p.id = a.profile_id
    JOIN (
      SELECT account_id, max(imported_at) AS last_import_at
      FROM import_batches
      GROUP BY account_id
    ) li ON li.account_id = a.id
    WHERE a.is_active = true
      AND (CURRENT_DATE - li.last_import_at::date) >= 15
  ),
  inserted AS (
    INSERT INTO notifications (user_id, profile_id, account_id, type, severity, dedup_key, payload)
    SELECT
      user_id, profile_id, account_id, 'account_stale', severity,
      'account_stale:' || account_id || ':' || severity,
      jsonb_build_object('days_since', days_since, 'account_name', account_name, 'profile_name', profile_name)
    FROM stale
    ON CONFLICT (dedup_key) DO NOTHING
    RETURNING 1
  ),
  escalated AS (
    UPDATE notifications n
    SET resolved_at = now()
    FROM stale s
    WHERE n.account_id = s.account_id
      AND s.severity = 'critical'
      AND n.dedup_key = 'account_stale:' || s.account_id || ':warning'
      AND n.resolved_at IS NULL
    RETURNING 1
  ),
  resolved AS (
    -- a diferencia de la versión per-usuario (041), aquí se recorren TODAS
    -- las notificaciones abiertas, no solo las de los usuarios que siguen
    -- teniendo alguna cuenta obsoleta — si no, un usuario que se pone al
    -- día del todo nunca vería resueltos sus avisos anteriores.
    UPDATE notifications n
    SET resolved_at = now()
    WHERE n.type = 'account_stale'
      AND n.resolved_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM stale s WHERE s.account_id = n.account_id)
    RETURNING 1
  )
  SELECT 1;
$$;

REVOKE ALL ON FUNCTION generate_stale_account_notifications_all_users() FROM PUBLIC;
