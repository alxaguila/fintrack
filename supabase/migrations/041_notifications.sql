-- ============================================================
-- FinTrack — Migración 041: Notificaciones in-app (cuentas obsoletas)
-- Ejecutar en el SQL Editor de Supabase (después de 001–040)
-- ============================================================
--
-- Primera fase de notificaciones dentro de la app (la campanita de la
-- esquina superior derecha). El primer tipo de notificación es "cuenta sin
-- actualizar": se avisa a los 15 días sin importar movimientos nuevos
-- (severity 'warning') y de nuevo a los 30 días (severity 'critical').
--
-- Se usa una tabla real (no solo cálculo en cliente/localStorage) para que
-- el estado leído/no leído sobreviva a recargas y dispositivos, y para que
-- en el futuro (fase de email) se pueda reutilizar como cola de envío.
--
-- No hay cron/Edge Function programada en el proyecto: la generación se
-- dispara desde el cliente (RPC generate_stale_account_notifications) una
-- vez por sesión, al montar AppShell — mismo patrón "cálculo bajo demanda"
-- que el resto de la app.
--
-- Idempotente: se puede re-ejecutar sin error.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 1. Tabla notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id  uuid        NOT NULL REFERENCES financial_profiles(id) ON DELETE CASCADE,
  account_id  uuid        REFERENCES accounts(id) ON DELETE CASCADE,
  type        text        NOT NULL,
  severity    text        NOT NULL CHECK (severity IN ('warning', 'critical')),
  dedup_key   text        NOT NULL UNIQUE,
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  read_at     timestamptz,
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id)
  WHERE read_at IS NULL AND resolved_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_notifications" ON notifications;
CREATE POLICY "own_notifications"
  ON notifications FOR ALL TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;

-- ------------------------------------------------------------
-- 2. RPC: genera/resuelve notificaciones de cuentas obsoletas del usuario
--    autenticado (todos sus perfiles, no solo el activo).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_stale_account_notifications()
RETURNS void
LANGUAGE sql
SECURITY INVOKER
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
      AND p.user_id = auth.uid()
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
    -- al llegar a "critical" se da por resuelto el aviso "warning" anterior de esa cuenta
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
    -- cuentas que ya no están obsoletas (nueva importación, archivada...) resuelven cualquier aviso abierto
    UPDATE notifications n
    SET resolved_at = now()
    WHERE n.user_id = auth.uid()
      AND n.type = 'account_stale'
      AND n.resolved_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM stale s WHERE s.account_id = n.account_id)
    RETURNING 1
  )
  SELECT 1;
$$;

REVOKE ALL ON FUNCTION generate_stale_account_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_stale_account_notifications() TO authenticated;
