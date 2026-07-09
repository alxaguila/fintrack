-- ============================================================
-- FinTrack — Migración 015: Rol de administrador + cierre RLS (Fase 0)
-- Ejecutar en el SQL Editor de Supabase (después de 001–014)
-- ============================================================
--
-- Objetivo: montar el cimiento de seguridad de la administración.
--   1) Rol simple con booleano `is_admin` en user_settings (migrable a RBAC).
--   2) Función public.is_admin() SECURITY DEFINER para usarla en políticas sin
--      recursión (leer user_settings dentro de su propia política sin esto
--      provocaría recursión infinita).
--   3) Cerrar el agujero conocido: bank_entities permitía escritura a cualquier
--      autenticado → ahora solo is_admin().
--   4) Escritura de catálogos globales (categories, category_groups) restringida
--      a is_admin(); lectura restringida a usuarios autenticados.
--   5) Eliminar la vista v_monthly_summary_by_profile: se saltaba la RLS de
--      transactions (sin security_invoker) y exponía agregados de TODOS los
--      usuarios. Es código muerto (no la consume el frontend).
--
-- Regla general aplicada: RLS activada + sin política permisiva = denegado
-- (deny-by-default). Ver informe AUDIT_RLS_fase0.md.
--
-- Idempotente: se puede re-ejecutar sin error.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 1. Rol en BD: flag is_admin en user_settings
-- ------------------------------------------------------------
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- ------------------------------------------------------------
-- 2. Función is_admin(): lee el flag del usuario actual SALTÁNDOSE la RLS.
--    SECURITY DEFINER es crítico: permite usar esta función dentro de las
--    políticas de user_settings / catálogos sin recursión infinita.
--    STABLE: no muta datos y es constante dentro de una misma sentencia.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT us.is_admin FROM user_settings us WHERE us.user_id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ------------------------------------------------------------
-- 3. bank_entities: cerrar el agujero de escritura abierta.
--    Antes: "bank_entities write" FOR ALL TO authenticated USING(true) →
--    cualquier autenticado podía crear/editar/borrar entidades del catálogo.
--    Ahora: lectura para autenticados; escritura solo is_admin().
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "bank_entities write" ON bank_entities;

-- Lectura (catálogo compartido) — se re-crea explícita por claridad.
DROP POLICY IF EXISTS "bank_entities read" ON bank_entities;
CREATE POLICY "bank_entities read"
  ON bank_entities FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "bank_entities admin insert" ON bank_entities;
CREATE POLICY "bank_entities admin insert"
  ON bank_entities FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bank_entities admin update" ON bank_entities;
CREATE POLICY "bank_entities admin update"
  ON bank_entities FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bank_entities admin delete" ON bank_entities;
CREATE POLICY "bank_entities admin delete"
  ON bank_entities FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 4. categories / category_groups: catálogos de referencia globales.
--    Lectura: solo usuarios autenticados (antes USING(true) sobre rol public,
--    legibles incluso sin login). Escritura: solo is_admin() (antes no había
--    política de escritura → denegada por defecto; ahora explícita para la
--    futura UI de admin).
-- ------------------------------------------------------------

-- categories --------------------------------------------------
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "read_categories"
  ON categories FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "categories admin insert" ON categories;
CREATE POLICY "categories admin insert"
  ON categories FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories admin update" ON categories;
CREATE POLICY "categories admin update"
  ON categories FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories admin delete" ON categories;
CREATE POLICY "categories admin delete"
  ON categories FOR DELETE TO authenticated
  USING (public.is_admin());

-- category_groups ---------------------------------------------
DROP POLICY IF EXISTS "public_read_category_groups" ON category_groups;
CREATE POLICY "read_category_groups"
  ON category_groups FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "category_groups admin insert" ON category_groups;
CREATE POLICY "category_groups admin insert"
  ON category_groups FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "category_groups admin update" ON category_groups;
CREATE POLICY "category_groups admin update"
  ON category_groups FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "category_groups admin delete" ON category_groups;
CREATE POLICY "category_groups admin delete"
  ON category_groups FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 5. Eliminar vista con fuga de RLS.
--    v_monthly_summary_by_profile (migración 001) es una vista normal (sin
--    security_invoker), por lo que corría con los privilegios del owner y se
--    saltaba la RLS de transactions: cualquier autenticado podía leer agregados
--    de todos los usuarios. No la consume el frontend → se elimina.
--    (El Dashboard usa v_dashboard_totals / v_dashboard_breakdown, que SÍ tienen
--     security_invoker = true — ver migración 004_dashboard_aggregation.)
-- ------------------------------------------------------------
DROP VIEW IF EXISTS v_monthly_summary_by_profile;

-- ============================================================
-- 6. MARCAR ADMIN (ejecutar UNA sola vez, manualmente, tras lo anterior)
-- ------------------------------------------------------------
-- Descomenta y ejecuta para conceder admin a la cuenta owner.
-- Requiere que exista ya la fila en user_settings (creada por el trigger 002 al
-- registrarse). Si no existiese, primero inicia sesión con esa cuenta una vez.
--
-- UPDATE user_settings
--   SET is_admin = true, updated_at = NOW()
--   WHERE user_id = (
--     SELECT id FROM auth.users WHERE email = 'alex.delaguila83@gmail.com'
--   );
-- ============================================================
