-- ============================================================
-- zafyros — Borrado total de datos de usuario (todos los usuarios)
-- Ejecutar en el SQL Editor de Supabase.
--
-- Objetivo: dejar la base de datos como recién instalada para probar
-- la experiencia de un usuario nuevo (importar de cero).
--
-- CONSERVA: auth.users, user_settings, category_groups, categories (taxonomía).
-- BORRA:    movimientos, lotes, cuentas, perfiles, formatos de banco,
--           reglas aprendidas y datos de la comunidad.
--
-- Orden por claves foráneas: import_batches.{profile_id,account_id} son
-- REFERENCES sin ON DELETE (= RESTRICT), así que hay que vaciar import_batches
-- ANTES que accounts / financial_profiles o dará error de FK.
--
-- Nota RLS: corre como `postgres` en el SQL Editor, por lo que se salta la RLS.
-- Desde el navegador (anon key) esto NO funcionaría para las tablas de comunidad
-- (solo tienen política SELECT); ahí haría falta una RPC SECURITY DEFINER.
-- ============================================================
begin;

delete from transactions;
delete from import_batches;
delete from accounts;
delete from financial_profiles;
delete from bank_formats;
delete from keyword_rules;

-- Comunidad: contribuciones privadas + agregado público.
-- Se vacían ambas a la vez, así que no hace falta recompute_community_rule().
delete from community_rule_contributions;
delete from community_rules;

commit;

-- Tras ejecutar: al recargar la app, AppShell detecta que no hay perfiles y
-- recrea uno por defecto automáticamente (estado de usuario nuevo).
