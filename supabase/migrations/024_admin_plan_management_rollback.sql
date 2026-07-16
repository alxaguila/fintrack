-- ============================================================
-- FinTrack — Rollback de la migración 024
-- ============================================================

-- Restaura admin_list_users() a la forma de la migración 017 (sin `plan`).
DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id              uuid,
  email                text,
  created_at           timestamptz,
  last_sign_in_at      timestamptz,
  full_name            text,
  country              text,
  province             text,
  gender               text,
  birth_date           date,
  employment_status    text,
  financial_goal       text,
  onboarding_completed boolean,
  is_admin             boolean,
  profiles_count       int,
  accounts_count       int,
  transactions_count   int,
  first_tx             date,
  last_tx              date,
  last_import          timestamptz
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
  SELECT
    u.id, u.email::text, u.created_at, u.last_sign_in_at,
    us.full_name, us.country, us.province, us.gender, us.birth_date,
    us.employment_status, us.financial_goal,
    COALESCE(us.onboarding_completed, false),
    COALESCE(us.is_admin, false),
    (SELECT COUNT(*)::int FROM financial_profiles fp WHERE fp.user_id = u.id),
    (SELECT COUNT(*)::int FROM accounts a
       JOIN financial_profiles fp ON fp.id = a.profile_id WHERE fp.user_id = u.id),
    (SELECT COUNT(*)::int FROM transactions t
       JOIN financial_profiles fp ON fp.id = t.profile_id WHERE fp.user_id = u.id),
    (SELECT MIN(t.date) FROM transactions t
       JOIN financial_profiles fp ON fp.id = t.profile_id WHERE fp.user_id = u.id),
    (SELECT MAX(t.date) FROM transactions t
       JOIN financial_profiles fp ON fp.id = t.profile_id WHERE fp.user_id = u.id),
    (SELECT MAX(ib.imported_at) FROM import_batches ib
       JOIN financial_profiles fp ON fp.id = ib.profile_id WHERE fp.user_id = u.id)
  FROM auth.users u
  LEFT JOIN user_settings us ON us.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

DROP FUNCTION IF EXISTS public.admin_plan_evolution(text);

DROP TRIGGER IF EXISTS trg_restrict_cross_user_settings_update ON user_settings;
DROP FUNCTION IF EXISTS public.restrict_cross_user_settings_update();

DROP POLICY IF EXISTS "user_settings admin update plan" ON user_settings;
