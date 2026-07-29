-- ============================================================
-- FinTrack — Rollback de la migración 046 (login_events)
-- ============================================================

DROP FUNCTION IF EXISTS public.admin_signups_by_granularity(text);
DROP FUNCTION IF EXISTS public.admin_logins_by_granularity(text);

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP FUNCTION IF EXISTS public.record_login_event();

DROP TABLE IF EXISTS public.login_events;

-- Recrea admin_signups_by_month() tal como estaba en la migración 017.
CREATE OR REPLACE FUNCTION public.admin_signups_by_month()
RETURNS TABLE (
  month date,
  cnt   int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_authorized' USING errcode = '42501';
  END IF;

  RETURN QUERY
  SELECT date_trunc('month', u.created_at)::date, COUNT(*)::int
  FROM auth.users u
  GROUP BY 1
  ORDER BY 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_signups_by_month() TO authenticated;
