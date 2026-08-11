-- ============================================================
-- zafyros — Migración 050: agrupar cuentas cercanas en el email de inactividad
-- Ejecutar en el SQL Editor de Supabase (después de 001–049)
-- ============================================================
--
-- Reemplaza generate_stale_account_notifications_all_users() (048) para
-- evitar que un mismo usuario reciba varios emails de inactividad en pocos
-- días solo porque sus cuentas cruzan el umbral de 15 días en fechas
-- distintas.
--
-- Antes: en cuanto UNA cuenta llegaba a 15 días se insertaba su aviso y se
-- mandaba el email; si otra cuenta del mismo usuario llegaba a 15 días
-- tres días después, se mandaba un segundo email.
--
-- Ahora: las cuentas activas de cada usuario se agrupan por cercanía —
-- cuentas cuya diferencia de "días sin actualizar" es de 3 días o menos
-- quedan en el mismo grupo (encadenado: 9-12-13 es un grupo, 0-1-4 es
-- otro, porque el salto de 4 a 9 es de 5 días). El aviso de un grupo no se
-- genera hasta que la cuenta MENOS desactualizada del grupo llega también a
-- 15 días — en ese momento se informa de TODAS las cuentas del grupo (que
-- por construcción ya están todas en 15 días o más).
--
-- No se toca generate_stale_account_notifications() (041), que sigue
-- calculando el aviso in-app cuenta por cuenta, sin agrupar — este cambio
-- es solo para el email, que es lo que se pidió.
--
-- Idempotente: se puede re-ejecutar sin error.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION generate_stale_account_notifications_all_users()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH accounts_days AS (
    -- días desde el último import de TODAS las cuentas activas con alguna
    -- importación (no solo las que ya llegaron a 15 días) — hace falta ver
    -- también las "casi obsoletas" para poder agruparlas correctamente.
    SELECT
      a.id          AS account_id,
      a.profile_id  AS profile_id,
      p.user_id     AS user_id,
      (CURRENT_DATE - li.last_import_at::date) AS days_since,
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
  ),
  gapped AS (
    SELECT
      *,
      days_since - LAG(days_since) OVER (PARTITION BY user_id ORDER BY days_since, account_id) AS gap
    FROM accounts_days
  ),
  clustered AS (
    -- "islas" de cuentas: cada vez que el hueco con la anterior (ya ordenadas
    -- por antigüedad) es mayor de 3 días, empieza un grupo nuevo.
    SELECT
      *,
      SUM(CASE WHEN gap IS NULL OR gap > 3 THEN 1 ELSE 0 END)
        OVER (PARTITION BY user_id ORDER BY days_since, account_id) AS cluster_id
    FROM gapped
  ),
  eligible_clusters AS (
    -- solo los grupos donde INCLUSO la cuenta menos desactualizada ya llegó a 15 días
    SELECT user_id, cluster_id
    FROM clustered
    GROUP BY user_id, cluster_id
    HAVING MIN(days_since) >= 15
  ),
  stale AS (
    SELECT
      c.account_id, c.profile_id, c.user_id, c.days_since,
      CASE WHEN c.days_since >= 30 THEN 'critical' ELSE 'warning' END AS severity,
      c.account_name, c.profile_name
    FROM clustered c
    JOIN eligible_clusters e ON e.user_id = c.user_id AND e.cluster_id = c.cluster_id
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
