-- ============================================================
-- FinTrack — Migración 022: infraestructura de planes de suscripción
-- Ejecutar en el SQL Editor de Supabase (después de 001–021)
-- ============================================================
--
-- Fase 1 del sistema de planes (FREE/PRO/PREMIUM): sin pasarela de pago, el
-- plan se asigna a mano por un admin. Esta migración monta:
--   1) user_settings.plan + trigger que impide que un usuario se auto-ascienda.
--   2) plan_limits: topes por plan, editables por admin (NULL = ilimitado).
--   3) plan_history: registro de cada cambio de plan (para la futura gráfica
--      de evolución), alimentado por un trigger — así el histórico empieza a
--      acumularse desde ya, aunque la UI de admin para cambiar planes aún no
--      exista (Fase 2).
--   4) get_plan_usage(): consumo del mes en curso del usuario autenticado, en
--      una sola llamada (mismo patrón de agregados en BD que el Dashboard).
--
-- Idempotente: CREATE OR REPLACE / IF NOT EXISTS donde aplica.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 1. user_settings.plan + trigger anti-auto-ascenso
-- ------------------------------------------------------------
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

ALTER TABLE user_settings
  DROP CONSTRAINT IF EXISTS user_settings_plan_check;
ALTER TABLE user_settings
  ADD CONSTRAINT user_settings_plan_check CHECK (plan IN ('free', 'pro', 'premium'));

-- Ningún usuario puede cambiar su propio plan (sin pasarela de pago, el único
-- camino válido es que un admin lo haga a mano desde /admin o el SQL Editor).
CREATE OR REPLACE FUNCTION public.prevent_plan_self_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'plan_change_forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_plan_self_change ON user_settings;
CREATE TRIGGER trg_prevent_plan_self_change
  BEFORE UPDATE OF plan ON user_settings
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan)
  EXECUTE FUNCTION public.prevent_plan_self_change();

-- ------------------------------------------------------------
-- 2. plan_limits: topes por plan (NULL = ilimitado)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_limits (
  plan                       TEXT    PRIMARY KEY CHECK (plan IN ('free', 'pro', 'premium')),
  max_profiles               INT    NULL,
  max_accounts                INT    NULL,
  max_imports_per_month       INT    NULL,
  max_movements_per_month     INT    NULL,
  max_rules                   INT    NULL,
  has_ai_classification       BOOLEAN NOT NULL DEFAULT FALSE,
  has_budget                  BOOLEAN NOT NULL DEFAULT FALSE,
  has_export                  BOOLEAN NOT NULL DEFAULT FALSE,
  has_scheduled_export        BOOLEAN NOT NULL DEFAULT FALSE,
  dashboard_history_months    INT    NULL,
  has_investments             BOOLEAN NOT NULL DEFAULT FALSE,
  has_networth                BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO plan_limits (
  plan, max_profiles, max_accounts, max_imports_per_month, max_movements_per_month,
  max_rules, has_ai_classification, has_budget, has_export, has_scheduled_export,
  dashboard_history_months, has_investments, has_networth
) VALUES
  ('free',    1,    3,   5,    200,  50,  FALSE, FALSE, FALSE, FALSE, 12,   FALSE, FALSE),
  ('pro',     3,    10,  NULL, 3000, 100, TRUE,  TRUE,  TRUE,  FALSE, NULL, FALSE, FALSE),
  ('premium', NULL, NULL, NULL, NULL, NULL, TRUE, TRUE,  TRUE,  TRUE,  NULL, TRUE,  TRUE)
ON CONFLICT (plan) DO UPDATE SET
  max_profiles             = EXCLUDED.max_profiles,
  max_accounts              = EXCLUDED.max_accounts,
  max_imports_per_month     = EXCLUDED.max_imports_per_month,
  max_movements_per_month   = EXCLUDED.max_movements_per_month,
  max_rules                 = EXCLUDED.max_rules,
  has_ai_classification     = EXCLUDED.has_ai_classification,
  has_budget                = EXCLUDED.has_budget,
  has_export                = EXCLUDED.has_export,
  has_scheduled_export      = EXCLUDED.has_scheduled_export,
  dashboard_history_months  = EXCLUDED.dashboard_history_months,
  has_investments           = EXCLUDED.has_investments,
  has_networth              = EXCLUDED.has_networth,
  updated_at                = NOW();

ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_limits read" ON plan_limits;
CREATE POLICY "plan_limits read"
  ON plan_limits FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "plan_limits admin insert" ON plan_limits;
CREATE POLICY "plan_limits admin insert"
  ON plan_limits FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "plan_limits admin update" ON plan_limits;
CREATE POLICY "plan_limits admin update"
  ON plan_limits FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "plan_limits admin delete" ON plan_limits;
CREATE POLICY "plan_limits admin delete"
  ON plan_limits FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 3. plan_history: registro de cada cambio de plan
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_plan    TEXT        NOT NULL,
  new_plan    TEXT        NOT NULL,
  changed_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_history_changed_at ON plan_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_plan_history_user_id ON plan_history(user_id);

ALTER TABLE plan_history ENABLE ROW LEVEL SECURITY;

-- Solo lectura de admin. Sin policy de INSERT/UPDATE/DELETE para authenticated:
-- la única vía de escritura es el trigger de abajo, que corre SECURITY DEFINER
-- (como el owner de la función) y por tanto no está sujeto a esta RLS.
DROP POLICY IF EXISTS "plan_history admin read" ON plan_history;
CREATE POLICY "plan_history admin read"
  ON plan_history FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.log_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO plan_history (user_id, old_plan, new_plan, changed_by)
  VALUES (NEW.user_id, OLD.plan, NEW.plan, auth.uid());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_plan_change ON user_settings;
CREATE TRIGGER trg_log_plan_change
  AFTER UPDATE OF plan ON user_settings
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan)
  EXECUTE FUNCTION public.log_plan_change();

-- ------------------------------------------------------------
-- 4. get_plan_usage(): consumo del mes en curso del usuario autenticado
-- ------------------------------------------------------------
-- Solo devuelve datos del propio auth.uid() (no requiere is_admin()): un
-- usuario siempre puede ver su propio consumo. SECURITY DEFINER + filtro
-- explícito por auth.uid() para resolverlo en una sola llamada (mismo patrón
-- de agregados en BD que v_dashboard_totals/v_dashboard_breakdown).
--
-- "movements_this_month" cuenta por FECHA DEL MOVIMIENTO en el mes natural
-- en curso (no por fecha de importación): el histórico subido nunca consume
-- cupo, solo lo hace la actividad del mes actual.
CREATE OR REPLACE FUNCTION public.get_plan_usage()
RETURNS TABLE (
  movements_this_month int,
  imports_this_month    int,
  profiles_count        int,
  accounts_count        int,
  rules_count           int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::int
       FROM transactions t
       JOIN financial_profiles fp ON fp.id = t.profile_id
       WHERE fp.user_id = auth.uid()
         AND date_trunc('month', t.date) = date_trunc('month', CURRENT_DATE)),
    (SELECT COUNT(*)::int
       FROM import_batches ib
       JOIN financial_profiles fp ON fp.id = ib.profile_id
       WHERE fp.user_id = auth.uid()
         AND date_trunc('month', ib.imported_at) = date_trunc('month', CURRENT_DATE)),
    (SELECT COUNT(*)::int FROM financial_profiles fp WHERE fp.user_id = auth.uid()),
    (SELECT COUNT(*)::int
       FROM accounts a
       JOIN financial_profiles fp ON fp.id = a.profile_id
       WHERE fp.user_id = auth.uid()),
    (SELECT COUNT(*)::int FROM keyword_rules kr WHERE kr.user_id = auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_plan_usage() TO authenticated;
