-- ============================================================
-- FinTrack — Rollback de 027_budget_reorder.sql
-- Ejecutar en el SQL Editor de Supabase para deshacer el cambio.
-- Se pierde cualquier orden manual guardado (budget_category_order).
-- ============================================================

DROP TABLE IF EXISTS budget_category_order;

CREATE TABLE IF NOT EXISTS budget_overrides (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES financial_profiles(id) ON DELETE CASCADE,
  category_id UUID        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month       DATE        NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, category_id, month),
  CONSTRAINT budget_overrides_month_is_first_day CHECK (date_trunc('month', month)::date = month)
);

CREATE INDEX IF NOT EXISTS idx_budget_overrides_profile_month ON budget_overrides (profile_id, month);

ALTER TABLE budget_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_budget_overrides" ON budget_overrides;
CREATE POLICY "own_budget_overrides" ON budget_overrides
  FOR ALL USING (
    profile_id IN (SELECT id FROM financial_profiles WHERE user_id = auth.uid())
  );
