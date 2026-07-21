-- ============================================================
-- FinTrack — Rollback de 031_security_linter_fixes_2.sql
-- Restaura el estado anterior (reintroduce los avisos del linter).
-- ============================================================

-- GRUPO A — recrear la policy de lectura pública del bucket bank-logos.
DROP POLICY IF EXISTS "bank-logos public read" ON storage.objects;
CREATE POLICY "bank-logos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bank-logos');

-- GRUPO B — restaurar el grant EXECUTE por defecto (PUBLIC) de las funciones.
GRANT EXECUTE ON FUNCTION public.admin_list_users()                  TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_user_category_breakdown(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_user_monthly(uuid)            TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_stats_overview()              TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_signups_by_month()            TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_demographics()                TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_plan_evolution(text)          TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_plan_usage()                    TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_plan_change()                     TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.prevent_plan_self_change()            TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.restrict_cross_user_settings_update() TO PUBLIC;
