-- ============================================================
-- FinTrack — Rollback de la migración 017 (Analítica de administración)
-- Ejecutar en el SQL Editor de Supabase para revertir 017_admin_analytics.sql
-- ============================================================

DROP FUNCTION IF EXISTS public.admin_demographics();
DROP FUNCTION IF EXISTS public.admin_signups_by_month();
DROP FUNCTION IF EXISTS public.admin_stats_overview();
DROP FUNCTION IF EXISTS public.admin_user_monthly(uuid);
DROP FUNCTION IF EXISTS public.admin_user_category_breakdown(uuid);
DROP FUNCTION IF EXISTS public.admin_list_users();
