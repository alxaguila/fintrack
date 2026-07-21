-- ============================================================
-- FinTrack — Correcciones del Database Linter (2ª pasada)
-- Ejecutar en el SQL Editor de Supabase (después de 001–030)
-- ============================================================
--
-- Segunda ronda de avisos SECURITY del linter de Supabase, aparecidos con las
-- funciones de analítica de admin (017) y de gestión de planes (022/024), más
-- una recaída del bucket bank-logos (ver migración 019, ya corregida en su
-- fuente). Idempotente.
--
-- Avisos residuales ACEPTADOS por diseño tras esta migración (0029,
-- `authenticated`): las 7 RPC de analítica de admin + get_plan_usage() siguen
-- ejecutables por `authenticated` a propósito — cada una valida internamente
-- `is_admin()` (o, en get_plan_usage, ya filtra por `auth.uid()` propio), así
-- que el rol solo abre la puerta; el guard interno es la autorización real.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- GRUPO A — bank-logos: quitar de nuevo la policy de lectura amplia
-- ------------------------------------------------------------
-- La migración 019 la había recreado por error al "reasegurar" el bucket; ya
-- se corrigió en su fuente para que una reinstalación desde cero no la
-- reintroduzca. Esto arregla la base de datos YA migrada.
DROP POLICY IF EXISTS "bank-logos public read" ON storage.objects;

-- ------------------------------------------------------------
-- GRUPO B — SECURITY DEFINER nuevas sin REVOKE inicial
-- ------------------------------------------------------------

-- B.1 — RPC de analítica de admin (017) + evolución de planes (024): todas
-- validan `is_admin()` internamente y ya tienen GRANT explícito a
-- `authenticated`. Solo falta quitar el grant implícito a PUBLIC (del que
-- hereda `anon`).
REVOKE EXECUTE ON FUNCTION public.admin_list_users()                  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_user_category_breakdown(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_user_monthly(uuid)            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_stats_overview()              FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_signups_by_month()            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_demographics()                FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_plan_evolution(text)          FROM PUBLIC, anon;

-- B.2 — get_plan_usage(): RPC legítima para que cada usuario vea su propio
-- consumo (ya filtra por auth.uid()); no necesita is_admin(). Se quita el
-- acceso implícito de PUBLIC/anon, se mantiene authenticated.
REVOKE EXECUTE ON FUNCTION public.get_plan_usage() FROM PUBLIC, anon;

-- B.3 — Funciones-trigger puras (022/024): nunca se llaman por RPC, solo las
-- dispara Postgres en UPDATE. Ningún rol expuesto las necesita ejecutables
-- directamente (los triggers no comprueban EXECUTE del rol que hizo el UPDATE).
REVOKE EXECUTE ON FUNCTION public.log_plan_change()                      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_plan_self_change()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restrict_cross_user_settings_update()  FROM PUBLIC, anon, authenticated;
