-- ============================================================
-- FinTrack — Catálogo de entidades bancarias / de crédito
-- Ejecutar en el SQL Editor de Supabase (después de 006)
-- ============================================================
--
-- Catálogo global de entidades que alimenta el desplegable del formulario de
-- cuentas. De momento lo mantiene el "admin" (el propio usuario); en el futuro
-- habrá una UI para gestionarlo y subir el logo de cada entidad (columna
-- logo_url ya prevista aquí). Ver memoria project_bank_entities_backend.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bank_entities (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  logo_url    TEXT,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bank_entities ENABLE ROW LEVEL SECURITY;

-- Lectura para cualquier usuario autenticado (catálogo compartido).
DROP POLICY IF EXISTS "bank_entities read" ON bank_entities;
CREATE POLICY "bank_entities read"
  ON bank_entities FOR SELECT TO authenticated
  USING (true);

-- Alta/edición/borrado por usuarios autenticados (rol admin pendiente de backend).
DROP POLICY IF EXISTS "bank_entities write" ON bank_entities;
CREATE POLICY "bank_entities write"
  ON bank_entities FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Lista inicial (España). El orden lo da sort_order.
INSERT INTO bank_entities (name, sort_order) VALUES
  ('Openbank', 10),
  ('BBVA', 20),
  ('CaixaBank', 30),
  ('Santander', 40),
  ('ING', 50),
  ('Banco Sabadell', 60),
  ('Bankinter', 70),
  ('Unicaja Banco', 80),
  ('Kutxabank', 90),
  ('Abanca', 100),
  ('Ibercaja', 110),
  ('Cajamar', 120),
  ('Eurocaja Rural', 130),
  ('Laboral Kutxa', 140),
  ('EVO Banco', 150),
  ('WiZink', 160),
  ('Deutsche Bank', 170),
  ('Revolut', 180),
  ('N26', 190),
  ('Trade Republic', 200),
  ('MyInvestor', 210),
  ('Wise', 220),
  ('PayPal', 230)
ON CONFLICT (name) DO NOTHING;
