-- ============================================================
-- FinTrack — Migración 024: gestión de planes desde el admin (Fase 2)
-- Ejecutar en el SQL Editor de Supabase (después de 001–023)
-- ============================================================
--
-- 1) Permite a un admin cambiar el PLAN de OTRO usuario (hoy la RLS
--    "own_settings" de 001 solo deja tocar la fila propia). Se abre con una
--    policy nueva scoped a is_admin(), pero — como GRANT/RLS de Postgres no
--    pueden restringir por COLUMNA dentro de una policy — se añade un
--    trigger que, cuando quien escribe NO es el dueño de la fila, solo deja
--    pasar cambios en `plan` (y `updated_at`); cualquier otro campo se
--    rechaza. Así un admin no puede reescribir datos personales ajenos por
--    esta vía, solo el plan (que es lo único que expone la UI de Fase 2).
--
-- 2) RPC admin_plan_evolution(): reconstruye cuántos usuarios había en cada
--    plan a lo largo del tiempo a partir de `plan_history` (022), con
--    granularidad día/semana/mes. Usuarios sin historial cuentan como 'free'
--    (su plan por defecto).
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 1. RLS: admin puede tocar la fila de otro usuario (acotado por el trigger)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "user_settings admin update plan" ON user_settings;
CREATE POLICY "user_settings admin update plan"
  ON user_settings FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.restrict_cross_user_settings_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo entra en juego cuando quien escribe NO es el dueño de la fila (caso:
  -- admin cambiando el plan de otro usuario vía la policy de arriba). Sobre
  -- la fila propia no se restringe nada (ya cubierto por "own_settings").
  IF auth.uid() IS DISTINCT FROM NEW.user_id THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'not_authorized' USING errcode = '42501';
    END IF;
    IF NEW.preferred_language  IS DISTINCT FROM OLD.preferred_language
       OR NEW.full_name        IS DISTINCT FROM OLD.full_name
       OR NEW.first_name       IS DISTINCT FROM OLD.first_name
       OR NEW.last_name        IS DISTINCT FROM OLD.last_name
       OR NEW.gender           IS DISTINCT FROM OLD.gender
       OR NEW.birth_date       IS DISTINCT FROM OLD.birth_date
       OR NEW.country          IS DISTINCT FROM OLD.country
       OR NEW.province         IS DISTINCT FROM OLD.province
       OR NEW.employment_status IS DISTINCT FROM OLD.employment_status
       OR NEW.financial_goal   IS DISTINCT FROM OLD.financial_goal
       OR NEW.onboarding_completed IS DISTINCT FROM OLD.onboarding_completed
       OR NEW.is_admin         IS DISTINCT FROM OLD.is_admin
    THEN
      RAISE EXCEPTION 'cross_user_update_forbidden' USING errcode = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_cross_user_settings_update ON user_settings;
CREATE TRIGGER trg_restrict_cross_user_settings_update
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_cross_user_settings_update();

-- ------------------------------------------------------------
-- 2. RPC: evolución de usuarios por plan a lo largo del tiempo
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_plan_evolution(p_granularity text DEFAULT 'month')
RETURNS TABLE (bucket date, plan text, cnt int)
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
  users_at_bucket AS (
    SELECT
      b.bucket,
      u.id AS user_id,
      COALESCE(
        (SELECT ph.new_plan FROM plan_history ph
           WHERE ph.user_id = u.id
             AND ph.changed_at <= (b.bucket + ('1 ' || p_granularity)::interval - interval '1 day')
           ORDER BY ph.changed_at DESC
           LIMIT 1),
        'free'
      ) AS plan
    FROM buckets b
    JOIN auth.users u
      ON u.created_at <= (b.bucket + ('1 ' || p_granularity)::interval - interval '1 day')
  )
  SELECT bucket, plan, COUNT(*)::int AS cnt
  FROM users_at_bucket
  GROUP BY bucket, plan
  ORDER BY bucket, plan;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_plan_evolution(text) TO authenticated;

-- ------------------------------------------------------------
-- 3. admin_list_users(): añade `plan` (necesita DROP porque CREATE OR REPLACE
--    no admite cambiar las columnas de retorno de una función existente).
-- ------------------------------------------------------------
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
  plan                 text,
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
    COALESCE(us.plan, 'free'),
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
