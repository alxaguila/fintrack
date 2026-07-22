-- ============================================================
-- FinTrack — Rollback de la migración 032 (Diccionario de clasificación en BD)
-- Ejecutar en el SQL Editor de Supabase para revertir 032_dictionary_rules.sql
-- ============================================================
--
-- ATENCIÓN: si el admin ha añadido palabras nuevas desde /admin/reglas
-- después de aplicar la 032, este rollback las borra también — no hay forma
-- de recuperarlas salvo que categoryRules.ts se restaure a la vez en el
-- código (revertir el commit correspondiente).

DROP TABLE IF EXISTS dictionary_rules;
