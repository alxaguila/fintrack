-- ============================================================
-- FinTrack — Migración 042: notificaciones de movimientos sin leer + ticker
-- Ejecutar en el SQL Editor de Supabase (después de 001–041)
-- ============================================================
--
-- Segundo tipo de notificación in-app: 'unread_transactions' (movimientos
-- con is_reviewed=false). Umbral: cualquier cantidad > 0, una notificación
-- POR PERFIL (no agregada entre perfiles), sin escalado de severidad.
--
-- announced_at es nuevo: paralelo a read_at, marca si el "ticker" (banner
-- animado junto a la campana) ya anunció esa notificación alguna vez — cada
-- notificación se anuncia como máximo una vez en su vida, aunque el punto
-- rojo de la campana siga indicando que falta leerla.
--
-- Idempotente: se puede re-ejecutar sin error.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 1. Columna announced_at
-- ------------------------------------------------------------
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS announced_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_notifications_user_pending_announce
  ON notifications(user_id)
  WHERE announced_at IS NULL AND resolved_at IS NULL;

-- ------------------------------------------------------------
-- 2. Índice de apoyo para el conteo de no-leídos por perfil
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transactions_profile_unread
  ON transactions(profile_id) WHERE is_reviewed = false;

-- ------------------------------------------------------------
-- 3. RPC: genera/actualiza/resuelve notificaciones de movimientos sin leer
--    del usuario autenticado (todos sus perfiles).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_unread_transaction_notifications()
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  WITH counts AS (
    SELECT
      t.profile_id                                  AS profile_id,
      p.user_id                                      AS user_id,
      p.name                                          AS profile_name,
      count(*) FILTER (WHERE t.is_reviewed = false)   AS unread_count
    FROM transactions t
    JOIN financial_profiles p ON p.id = t.profile_id
    WHERE p.user_id = auth.uid()
    GROUP BY t.profile_id, p.user_id, p.name
  ),
  active AS (
    SELECT * FROM counts WHERE unread_count > 0
  ),
  upserted AS (
    INSERT INTO notifications (user_id, profile_id, account_id, type, severity, dedup_key, payload)
    SELECT
      user_id, profile_id, NULL, 'unread_transactions', 'warning',
      'unread_transactions:' || profile_id,
      jsonb_build_object('count', unread_count, 'profile_name', profile_name)
    FROM active
    ON CONFLICT (dedup_key) DO UPDATE SET
      payload      = EXCLUDED.payload,
      -- Solo "reabre" (resetea read_at/announced_at) si de verdad estaba
      -- resuelta; si seguía activa, un cambio de conteo no debe re-anunciarla
      -- ni volver a marcarla como no leída.
      read_at      = CASE WHEN notifications.resolved_at IS NOT NULL THEN NULL ELSE notifications.read_at END,
      announced_at = CASE WHEN notifications.resolved_at IS NOT NULL THEN NULL ELSE notifications.announced_at END,
      resolved_at  = NULL
    RETURNING 1
  ),
  resolved AS (
    -- Perfiles cuyo conteo actual es 0: se resuelve cualquier aviso abierto.
    UPDATE notifications n
    SET resolved_at = now()
    WHERE n.user_id = auth.uid()
      AND n.type = 'unread_transactions'
      AND n.resolved_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM active a WHERE a.profile_id = n.profile_id)
    RETURNING 1
  )
  SELECT 1;
$$;

REVOKE ALL ON FUNCTION generate_unread_transaction_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_unread_transaction_notifications() TO authenticated;
