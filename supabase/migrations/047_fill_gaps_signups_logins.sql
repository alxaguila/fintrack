-- ============================================================
-- FinTrack — Migración 047: rellena huecos en Altas y Conexiones
-- Ejecutar en el SQL Editor de Supabase (después de 001–046)
-- ============================================================
--
-- admin_signups_by_granularity() y admin_logins_by_granularity() (046) solo
-- agrupaban filas existentes, así que un día/semana/mes sin ningún alta o
-- login no aparecía en la gráfica. Se reescriben con generate_series (mismo
-- patrón que admin_plan_evolution de la 024) para devolver TODO el rango
-- desde el primer evento hasta hoy, con cnt=0 donde no hubo actividad.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_signups_by_granularity(p_granularity text DEFAULT 'month')
RETURNS TABLE (bucket date, cnt int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_authorized' USING errcode = '42501';
  END IF;
  IF p_granularity NOT IN ('day', 'week', 'month') THEN
    RAISE EXCEPTION 'invalid_granularity' USING errcode = '22023';
  END IF;

  RETURN QUERY
  WITH bounds AS (
    SELECT
      date_trunc(p_granularity, MIN(u.created_at))::date AS start_date,
      date_trunc(p_granularity, now())::date              AS end_date
    FROM auth.users u
  ),
  buckets AS (
    SELECT generate_series(start_date, end_date, ('1 ' || p_granularity)::interval)::date AS bucket
    FROM bounds
  ),
  counts AS (
    SELECT date_trunc(p_granularity, u.created_at)::date AS bucket, COUNT(*)::int AS cnt
    FROM auth.users u
    GROUP BY 1
  )
  SELECT b.bucket, COALESCE(c.cnt, 0)
  FROM buckets b
  LEFT JOIN counts c ON c.bucket = b.bucket
  ORDER BY b.bucket;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_logins_by_granularity(p_granularity text DEFAULT 'month')
RETURNS TABLE (bucket date, cnt int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_authorized' USING errcode = '42501';
  END IF;
  IF p_granularity NOT IN ('day', 'week', 'month') THEN
    RAISE EXCEPTION 'invalid_granularity' USING errcode = '22023';
  END IF;

  RETURN QUERY
  WITH bounds AS (
    SELECT
      date_trunc(p_granularity, MIN(le.occurred_at))::date AS start_date,
      date_trunc(p_granularity, now())::date                AS end_date
    FROM public.login_events le
  ),
  buckets AS (
    SELECT generate_series(start_date, end_date, ('1 ' || p_granularity)::interval)::date AS bucket
    FROM bounds
  ),
  counts AS (
    SELECT date_trunc(p_granularity, le.occurred_at)::date AS bucket, COUNT(*)::int AS cnt
    FROM public.login_events le
    GROUP BY 1
  )
  SELECT b.bucket, COALESCE(c.cnt, 0)
  FROM buckets b
  LEFT JOIN counts c ON c.bucket = b.bucket
  ORDER BY b.bucket;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_signups_by_granularity(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_logins_by_granularity(text)  TO authenticated;
