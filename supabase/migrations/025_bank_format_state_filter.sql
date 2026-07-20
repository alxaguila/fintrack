-- ============================================================
-- FinTrack — Migración 025: columna de estado en bank_formats
-- Ejecutar en el SQL Editor de Supabase (después de 001–024)
-- ============================================================
--
-- Algunos extractos (Revolut, otras fintechs) incluyen una columna de
-- estado de la transacción (COMPLETED / REVERTED / DECLINED / PENDING...).
-- Sin esto se importaban movimientos que nunca llegaron a completarse. La
-- lista de valores no finales a excluir vive en el frontend
-- (src/lib/automap.ts → NON_FINAL_STATE_VALUES), no en BD: aquí solo se
-- guarda qué columna del extracto es la de estado.
-- ------------------------------------------------------------

ALTER TABLE bank_formats ADD COLUMN state_column TEXT;
