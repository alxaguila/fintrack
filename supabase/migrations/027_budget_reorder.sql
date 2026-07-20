-- ============================================================
-- FinTrack — Migración 027: quitar "solo este mes" + orden manual de subcategorías
-- Ejecutar en el SQL Editor de Supabase (después de 001–026)
-- ============================================================
--
-- 1) Se retira la excepción puntual de presupuesto ("solo este mes"): el
--    importe de una subcategoría es siempre el recurrente (budget_rules). Sin
--    usuarios reales todavía en la función, se elimina budget_overrides en vez
--    de dejarla sin uso.
DROP TABLE IF EXISTS budget_overrides;

-- 2) Orden manual (arrastrar) de las subcategorías dentro de un sobre, por
--    perfil. Solo hace falta una fila cuando el usuario reordena; el resto usa
--    el sort_order por defecto de `categories`.
CREATE TABLE IF NOT EXISTS budget_category_order (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES financial_profiles(id) ON DELETE CASCADE,
  category_id UUID        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  sort_order  SMALLINT    NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, category_id)
);

ALTER TABLE budget_category_order ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_budget_category_order" ON budget_category_order;
CREATE POLICY "own_budget_category_order" ON budget_category_order
  FOR ALL USING (
    profile_id IN (SELECT id FROM financial_profiles WHERE user_id = auth.uid())
  );
