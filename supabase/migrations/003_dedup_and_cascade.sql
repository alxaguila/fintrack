-- ============================================================
-- FinTrack — 003: columna de hora + cascada en import_batches
-- Ejecutar en el SQL Editor de Supabase (después de 001 y 002)
-- ============================================================

-- ------------------------------------------------------------
-- bank_formats: columna opcional para mapear la HORA del movimiento
-- (se usa en la clave de deduplicación, no se almacena en transactions)
-- ------------------------------------------------------------
ALTER TABLE bank_formats ADD COLUMN IF NOT EXISTS time_column TEXT;

-- ------------------------------------------------------------
-- import_batches: borrar en cascada al eliminar la cuenta o el perfil.
-- Sin esto, borrar una cuenta con lotes de importación falla por FK,
-- y los lotes de importaciones fallidas quedan huérfanos bloqueándolo.
-- ------------------------------------------------------------
ALTER TABLE import_batches DROP CONSTRAINT IF EXISTS import_batches_account_id_fkey;
ALTER TABLE import_batches
  ADD CONSTRAINT import_batches_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE import_batches DROP CONSTRAINT IF EXISTS import_batches_profile_id_fkey;
ALTER TABLE import_batches
  ADD CONSTRAINT import_batches_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES financial_profiles(id) ON DELETE CASCADE;
