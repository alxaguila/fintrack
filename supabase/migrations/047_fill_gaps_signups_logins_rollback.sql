-- ============================================================
-- FinTrack — Rollback de la migración 047 (vuelve a las versiones sin
-- generate_series de la migración 046: solo agrupan filas existentes)
-- ============================================================

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
  SELECT date_trunc(p_granularity, u.created_at)::date, COUNT(*)::int
  FROM auth.users u
  GROUP BY 1
  ORDER BY 1;
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
  SELECT date_trunc(p_granularity, le.occurred_at)::date, COUNT(*)::int
  FROM public.login_events le
  GROUP BY 1
  ORDER BY 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_signups_by_granularity(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_logins_by_granularity(text)  TO authenticated;
