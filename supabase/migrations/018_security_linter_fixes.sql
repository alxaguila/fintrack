-- ============================================================
-- FinTrack — Correcciones del Database Linter (avisos SECURITY)
-- Ejecutar en el SQL Editor de Supabase (después de 001–017)
-- ============================================================
--
-- Cierra los avisos del linter de Supabase sin romper funcionalidad. Idempotente.
-- Aparte de esto queda 1 acción MANUAL en el dashboard (no es SQL):
--   Authentication → Password → activar "Leaked password protection" (HaveIBeenPwned).
--
-- Avisos residuales ACEPTADOS por diseño tras esta migración (0029):
--   upsert_community_vote / delete_community_vote e is_admin siguen ejecutables por
--   `authenticated` a propósito (las dos primeras son RPC legítimas de usuarios
--   logueados; is_admin la necesita RLS). No exponen datos de terceros.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- GRUPO A — Buckets públicos: quitar la policy de lectura amplia
-- ------------------------------------------------------------
-- En un bucket PÚBLICO la descarga por URL (getPublicUrl → <img src>) NO usa esta
-- policy; solo habilita `.list()` de todos los objetos. La app solo usa
-- getPublicUrl, así que quitarla evita el listado sin afectar a la carga de logos.
-- (Verificar tras aplicar: los logos de cuentas y de bancos siguen mostrándose.)
DROP POLICY IF EXISTS "account-logos public read" ON storage.objects;
DROP POLICY IF EXISTS "bank-logos public read"    ON storage.objects;

-- ------------------------------------------------------------
-- GRUPO B — SECURITY DEFINER expuestas por PostgREST (/rest/v1/rpc/*)
-- ------------------------------------------------------------
-- Se revoca el grant implícito a PUBLIC (del que heredan anon/authenticated) y
-- luego se re-concede EXECUTE solo donde hace falta.

-- handle_new_user(): es un TRIGGER, nunca una API. Los triggers se ejecutan sin
-- comprobar EXECUTE, así que ningún rol expuesto lo necesita.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- recompute_community_rule(text): helper INTERNO (lo llama PERFORM desde las
-- funciones de voto, que corren como owner). Ningún rol expuesto lo necesita.
REVOKE EXECUTE ON FUNCTION public.recompute_community_rule(text) FROM PUBLIC, anon, authenticated;

-- upsert/delete_community_vote: RPC legítimas para usuarios logueados. Se quita
-- anon (y el grant implícito a PUBLIC); se mantiene authenticated.
REVOKE EXECUTE ON FUNCTION public.upsert_community_vote(text, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.upsert_community_vote(text, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_community_vote(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.delete_community_vote(text) TO authenticated;

-- is_admin() (Opción A): el cliente NO la llama por RPC; solo se usa dentro de RLS.
-- Se quita anon (y PUBLIC); se mantiene authenticated para que las políticas de
-- catálogos globales sigan evaluándose.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO authenticated;
