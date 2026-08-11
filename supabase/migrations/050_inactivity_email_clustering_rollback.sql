-- ============================================================
-- zafyros — Rollback de la migración 050 (agrupar cuentas cercanas)
-- Ejecutar en el SQL Editor de Supabase para revertir 050_inactivity_email_clustering.sql
-- ============================================================
-- Restaura la versión sin agrupar de generate_stale_account_notifications_all_users()
-- (la introducida en 048_inactivity_emails.sql).

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
