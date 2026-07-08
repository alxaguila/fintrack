-- ============================================================
-- FinTrack — Nuevo tipo de cuenta: valores
-- Ejecutar en el SQL Editor de Supabase (después de 001–005)
-- ============================================================
--
-- Añade "valores" al enum account_type para poder crear cuentas de valores
-- (broker/inversión). Sin lógica especial todavía: solo el tipo.
--
-- NOTA: ALTER TYPE ... ADD VALUE no puede ejecutarse dentro de una transacción
-- que luego use el valor. Ejecuta este archivo SOLO (no lo pegues junto a otras
-- sentencias que ya inserten cuentas de tipo 'valores').
-- ------------------------------------------------------------

ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'valores';
