-- ============================================================
-- FinTrack — Migración 017: Analítica de administración (usuarios + KPIs)
-- Ejecutar en el SQL Editor de Supabase (después de 001–016)
-- ============================================================
--
-- Da soporte a /admin/usuarios y /admin/estadisticas. Como la RLS bloquea la
-- lectura entre usuarios (deny-by-default de la Fase 0), toda la analítica va
-- por funciones SECURITY DEFINER que:
--   1) verifican is_admin() ANTES de devolver nada (si no, RAISE 42501),
--   2) corren como owner (postgres) para poder leer auth.users y agregar sin RLS.
--
-- Privacidad: la actividad de otros usuarios se expone SIEMPRE agregada (sumas
-- por categoría/mes). NUNCA se devuelven conceptos ni importes individuales.
--
-- Idempotente: CREATE OR REPLACE. GRANT EXECUTE a authenticated (el guard interno
-- es quien realmente autoriza).
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 1. Listado de usuarios (auth.users + demografía + contadores)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_users()
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
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    us.full_name,
    us.country,
    us.province,
    us.gender,
    us.birth_date,
    us.employment_status,
    us.financial_goal,
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

-- ------------------------------------------------------------
-- 2. Actividad de un usuario: desglose por categoría (solo sumas)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_user_category_breakdown(p_user_id uuid)
RETURNS TABLE (
  category_id      uuid,
  category_slug    text,
  group_slug       text,
  transaction_type transaction_type,
  total_abs        numeric,
  cnt              int
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
    t.category_id,
    c.slug::text,
    cg.slug::text,
    t.transaction_type,
    SUM(ABS(t.amount))::numeric,
    COUNT(*)::int
  FROM transactions t
  JOIN financial_profiles fp ON fp.id = t.profile_id
  LEFT JOIN categories c       ON c.id = t.category_id
  LEFT JOIN category_groups cg ON cg.id = c.group_id
  WHERE fp.user_id = p_user_id
  GROUP BY t.category_id, c.slug, cg.slug, t.transaction_type
  ORDER BY SUM(ABS(t.amount)) DESC;
END;
$$;

-- ------------------------------------------------------------
-- 3. Actividad de un usuario: serie mensual (solo sumas por tipo)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_user_monthly(p_user_id uuid)
RETURNS TABLE (
  month            date,
  transaction_type transaction_type,
  total_abs        numeric,
  cnt              int
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
    date_trunc('month', t.date)::date,
    t.transaction_type,
    SUM(ABS(t.amount))::numeric,
    COUNT(*)::int
  FROM transactions t
  JOIN financial_profiles fp ON fp.id = t.profile_id
  WHERE fp.user_id = p_user_id
  GROUP BY date_trunc('month', t.date)::date, t.transaction_type
  ORDER BY 1;
END;
$$;

-- ------------------------------------------------------------
-- 4. KPIs globales: totales
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_stats_overview()
RETURNS TABLE (
  total_users            int,
  onboarded_users        int,
  admin_users            int,
  total_profiles         int,
  total_accounts         int,
  total_transactions     int,
  imported_transactions  int,
  manual_transactions    int
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
    (SELECT COUNT(*)::int FROM auth.users),
    (SELECT COUNT(*)::int FROM user_settings WHERE onboarding_completed),
    (SELECT COUNT(*)::int FROM user_settings WHERE is_admin),
    (SELECT COUNT(*)::int FROM financial_profiles),
    (SELECT COUNT(*)::int FROM accounts),
    (SELECT COUNT(*)::int FROM transactions),
    (SELECT COUNT(*)::int FROM transactions WHERE is_manual = false),
    (SELECT COUNT(*)::int FROM transactions WHERE is_manual = true);
END;
$$;

-- ------------------------------------------------------------
-- 5. Altas de usuarios por mes
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 6. Demografía (país / situación laboral / objetivo) apilada
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_demographics()
RETURNS TABLE (
  dimension text,
  bucket    text,
  cnt       int
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
  SELECT 'country'::text, COALESCE(us.country, '—'), COUNT(*)::int
    FROM user_settings us GROUP BY us.country
  UNION ALL
  SELECT 'employment'::text, COALESCE(us.employment_status, '—'), COUNT(*)::int
    FROM user_settings us GROUP BY us.employment_status
  UNION ALL
  SELECT 'goal'::text, COALESCE(us.financial_goal, '—'), COUNT(*)::int
    FROM user_settings us GROUP BY us.financial_goal
  ORDER BY 1, 3 DESC;
END;
$$;

-- ------------------------------------------------------------
-- GRANTS (el guard is_admin() interno es la autorización real)
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.admin_list_users()                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_category_breakdown(uuid)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_monthly(uuid)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_stats_overview()                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_signups_by_month()               TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_demographics()                   TO authenticated;
