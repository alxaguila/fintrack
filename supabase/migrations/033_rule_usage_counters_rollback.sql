-- ============================================================
-- FinTrack — Rollback de la migración 033 (contadores de uso)
-- Ejecutar en el SQL Editor de Supabase para revertir 033_rule_usage_counters.sql
-- ============================================================

DROP FUNCTION IF EXISTS increment_community_usage(text[]);
DROP FUNCTION IF EXISTS increment_dictionary_usage(uuid[]);
DROP TABLE IF EXISTS community_rule_usage;
ALTER TABLE dictionary_rules DROP COLUMN IF EXISTS use_count;
