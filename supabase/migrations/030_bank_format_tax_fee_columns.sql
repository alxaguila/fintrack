-- ============================================================
-- FinTrack — Migración 030: columnas de impuesto/comisión en bank_formats
-- Ejecutar en el SQL Editor de Supabase (después de 001–029)
-- ============================================================
--
-- Algunos extractos (Trade Republic y otros brokers) traen el importe BRUTO de
-- un movimiento (p.ej. un pago de intereses) en una columna y la retención o
-- comisión en otra columna aparte ("tax", "fee"), de forma que el importe que
-- realmente entra o sale de la cuenta es amount + tax + fee (ambas ya vienen
-- con signo negativo cuando restan). Sin esto se importa el bruto, lo que
-- infla ingresos por categoría en Análisis/Dashboard aunque el saldo total no
-- se vea afectado (se compensa en el saldo inicial calculado).
-- Igual que state_column (migración 025): solo se guarda qué columna del
-- extracto es cada una; el neteo vive en el frontend (src/hooks/useImport.ts).
-- ------------------------------------------------------------

ALTER TABLE bank_formats ADD COLUMN tax_column TEXT;
ALTER TABLE bank_formats ADD COLUMN fee_column TEXT;
