-- ============================================================
-- FinTrack — Migración 046: registro de conexiones + granularidad en altas
-- Ejecutar en el SQL Editor de Supabase (después de 001–045)
-- ============================================================
--
-- Da soporte a la gráfica "Conexiones" de /admin/estadisticas. auth.users solo
-- guarda `last_sign_in_at` (se sobrescribe en cada login), así que no hay forma
-- de reconstruir un histórico de conexiones pasado. Esta migración empieza a
-- registrar cada login a partir de ahora en login_events; la gráfica arrancará
-- vacía y se irá llenando con conexiones futuras.
--
-- De paso, sustituye admin_signups_by_month() (sin granularidad) por
-- admin_signups_by_granularity() (día/semana/mes, mismo patrón que
-- admin_plan_evolution de la 024) para que "Altas" y "Conexiones" compartan
-- selector.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 1. Tabla de eventos de login (deny-by-default: solo se lee vía RPC admin)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.login_events (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_events_user_id     ON public.login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_occurred_at ON public.login_events(occurred_at);

ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
-- Sin políticas: nadie autenticado puede leer/escribir directamente. Solo el
-- trigger (SECURITY DEFINER) escribe, y solo admin_logins_by_granularity()
-- (SECURITY DEFINER) lee, tras comprobar is_admin().

-- ------------------------------------------------------------
-- 2. Trigger: cada login (cambio de last_sign_in_at) deja una fila
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_login_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    INSERT INTO public.login_events (user_id, occurred_at) VALUES (NEW.id, NEW.last_sign_in_at);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.record_login_event();

-- ------------------------------------------------------------
-- 3. RPC: conexiones agregadas por día/semana/mes
-- ------------------------------------------------------------
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

GRANT EXECUTE ON FUNCTION public.admin_logins_by_granularity(text) TO authenticated;

-- ------------------------------------------------------------
-- 4. RPC: altas agregadas por día/semana/mes (sustituye admin_signups_by_month)
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_signups_by_month();

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

GRANT EXECUTE ON FUNCTION public.admin_signups_by_granularity(text) TO authenticated;
