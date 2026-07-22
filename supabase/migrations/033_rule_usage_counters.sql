-- ============================================================
-- FinTrack — Migración 033: contador de usos (diccionario + comunidad)
-- Ejecutar en el SQL Editor de Supabase (después de 001–032)
-- ============================================================
--
-- Añade "cuántas veces se ha usado esta regla para clasificar un movimiento",
-- visible en /admin/reglas, para el diccionario integrado y las reglas de
-- comunidad. Se incrementa desde el cliente al CONFIRMAR una importación
-- (useConfirmImport, no en la vista previa), vía función SECURITY DEFINER —
-- el cliente nunca escribe el contador directamente.
--
-- Diccionario: se añade la columna use_count directamente a dictionary_rules
-- (el CRUD del admin ya opera con UPDATE/DELETE normales sobre esa tabla, sin
-- riesgo de que se pise).
--
-- Comunidad: NO se añade a community_rules porque esa tabla se borra y
-- reinserta por completo en cada voto (recompute_community_rule, migración
-- 003) — cualquier columna extra ahí se perdería en el siguiente voto. Se usa
-- una tabla aparte, `community_rule_usage`, indexada por merchant_key (el uso
-- es del comercio, no de la pareja comercio+categoría concreta que gane en
-- cada momento).
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 1. Diccionario: columna use_count
-- ------------------------------------------------------------
ALTER TABLE dictionary_rules ADD COLUMN IF NOT EXISTS use_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_dictionary_usage(p_rule_ids uuid[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE dictionary_rules d
  SET use_count = d.use_count + t.cnt
  FROM (
    SELECT id, count(*)::int AS cnt
    FROM unnest(p_rule_ids) AS id
    GROUP BY id
  ) AS t
  WHERE d.id = t.id;
$$;

REVOKE ALL ON FUNCTION increment_dictionary_usage(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_dictionary_usage(uuid[]) TO authenticated;

-- ------------------------------------------------------------
-- 2. Comunidad: tabla aparte community_rule_usage
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_rule_usage (
  merchant_key text        NOT NULL PRIMARY KEY,
  use_count    integer     NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE community_rule_usage ENABLE ROW LEVEL SECURITY;

-- Lectura pública para autenticados (se muestra en /admin/reglas); la
-- escritura solo ocurre vía la función SECURITY DEFINER de abajo.
DROP POLICY IF EXISTS "community_rule_usage read" ON community_rule_usage;
CREATE POLICY "community_rule_usage read"
  ON community_rule_usage FOR SELECT TO authenticated
  USING (true);

GRANT SELECT ON community_rule_usage TO authenticated;

CREATE OR REPLACE FUNCTION increment_community_usage(p_merchant_keys text[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO community_rule_usage (merchant_key, use_count, updated_at)
  SELECT merchant_key, count(*)::int, now()
  FROM unnest(p_merchant_keys) AS merchant_key
  GROUP BY merchant_key
  ON CONFLICT (merchant_key)
  DO UPDATE SET use_count = community_rule_usage.use_count + EXCLUDED.use_count, updated_at = now();
$$;

REVOKE ALL ON FUNCTION increment_community_usage(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_community_usage(text[]) TO authenticated;
