-- ============================================================
-- FinTrack — Migración 026: Presupuestos (budget_rules + budget_overrides)
-- Ejecutar en el SQL Editor de Supabase (después de 001–025)
-- ============================================================
--
-- Modelo de 2 niveles: category_groups = "sobre" (categoría), categories =
-- subcategoría. El presupuesto se fija SIEMPRE a nivel de subcategoría; el
-- total del sobre es la suma de sus subcategorías presupuestadas (calculado
-- en cliente, no hay columna de importe a nivel de grupo).
--
-- budget_rules    → importe recurrente mensual por (perfil, subcategoría).
-- budget_overrides → excepción puntual para UN mes concreto, sin romper la
--                    recurrencia de budget_rules en los meses siguientes.
--
-- Importe efectivo de un mes = override de ese mes si existe, si no la regla
-- recurrente, si no "sin presupuestar". Se combina en cliente (no hace falta
-- vista SQL nueva: el gasto real ya se obtiene de v_dashboard_breakdown,
-- migración 004).
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS budget_rules (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES financial_profiles(id) ON DELETE CASCADE,
  category_id UUID        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, category_id)
);

CREATE TABLE IF NOT EXISTS budget_overrides (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES financial_profiles(id) ON DELETE CASCADE,
  category_id UUID        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month       DATE        NOT NULL, -- normalizado al día 1 del mes
  amount      NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, category_id, month),
  CONSTRAINT budget_overrides_month_is_first_day CHECK (date_trunc('month', month)::date = month)
);

CREATE INDEX IF NOT EXISTS idx_budget_overrides_profile_month ON budget_overrides (profile_id, month);

ALTER TABLE budget_rules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_budget_rules" ON budget_rules;
CREATE POLICY "own_budget_rules" ON budget_rules
  FOR ALL USING (
    profile_id IN (SELECT id FROM financial_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "own_budget_overrides" ON budget_overrides;
CREATE POLICY "own_budget_overrides" ON budget_overrides
  FOR ALL USING (
    profile_id IN (SELECT id FROM financial_profiles WHERE user_id = auth.uid())
  );
