-- ============================================================
-- FinTrack — Rollback de la migración 014 (Rol admin + cierre RLS)
-- Ejecutar en el SQL Editor de Supabase para revertir 014_admin_role.sql
-- ============================================================
--
-- Deja el estado de seguridad EXACTAMENTE como estaba antes de la 014, incluida
-- la política abierta de bank_entities y la lectura pública de catálogos. Solo
-- usar si hay que dar marcha atrás; reintroduce el agujero conocido.
-- ------------------------------------------------------------

-- 5'. Recrear la vista eliminada (idéntica a la de 001_schema.sql).
CREATE OR REPLACE VIEW v_monthly_summary_by_profile AS
SELECT
  fp.user_id,
  fp.id                         AS profile_id,
  fp.name                       AS profile_name,
  DATE_TRUNC('month', t.date)   AS month,
  cg.id                         AS group_id,
  cg.slug                       AS group_slug,
  cg.type                       AS category_type,
  t.transaction_type,
  SUM(t.amount)                 AS total,
  COUNT(*)                      AS count
FROM transactions t
JOIN financial_profiles fp  ON t.profile_id  = fp.id
JOIN categories c           ON t.category_id = c.id
JOIN category_groups cg     ON c.group_id    = cg.id
GROUP BY
  fp.user_id, fp.id, fp.name,
  DATE_TRUNC('month', t.date),
  cg.id, cg.slug, cg.type, t.transaction_type;

-- 4'. Revertir catálogos a lectura pública sin escritura (estado previo).
DROP POLICY IF EXISTS "category_groups admin insert" ON category_groups;
DROP POLICY IF EXISTS "category_groups admin update" ON category_groups;
DROP POLICY IF EXISTS "category_groups admin delete" ON category_groups;
DROP POLICY IF EXISTS "read_category_groups" ON category_groups;
CREATE POLICY "public_read_category_groups" ON category_groups
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories admin insert" ON categories;
DROP POLICY IF EXISTS "categories admin update" ON categories;
DROP POLICY IF EXISTS "categories admin delete" ON categories;
DROP POLICY IF EXISTS "read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories
  FOR SELECT USING (true);

-- 3'. Revertir bank_entities a la política abierta (estado previo).
DROP POLICY IF EXISTS "bank_entities admin insert" ON bank_entities;
DROP POLICY IF EXISTS "bank_entities admin update" ON bank_entities;
DROP POLICY IF EXISTS "bank_entities admin delete" ON bank_entities;
DROP POLICY IF EXISTS "bank_entities write" ON bank_entities;
CREATE POLICY "bank_entities write"
  ON bank_entities FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 2'. Eliminar la función is_admin().
DROP FUNCTION IF EXISTS public.is_admin();

-- 1'. Eliminar la columna is_admin.
ALTER TABLE user_settings DROP COLUMN IF EXISTS is_admin;
