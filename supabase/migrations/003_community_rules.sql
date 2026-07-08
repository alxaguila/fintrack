-- ============================================================
-- FinTrack — Reglas de clasificación de la comunidad
-- Ejecutar en el SQL Editor de Supabase (después de 001 y 002)
-- ============================================================
--
-- Objetivo: ayudar a la clasificación automática de TODOS los usuarios
-- compartiendo, de forma anónima, qué categoría asigna la gente a cada
-- "merchant key" (clave de comercio normalizada, p.ej. "MERCADONA").
--
-- Privacidad: NUNCA se comparte el concepto bancario crudo (puede contener
-- datos personales). Solo se comparte la merchant_key derivada + la categoría
-- + un contador de votos.
--
-- Modelo:
--   community_rule_contributions  -> 1 voto por (usuario, merchant_key)  [privado]
--   community_rules               -> agregado público (merchant_key, categoría, votos)
--
-- Los clientes NUNCA escriben directamente en estas tablas: lo hacen a través
-- de las funciones SECURITY DEFINER upsert_community_vote / delete_community_vote.
-- ------------------------------------------------------------

-- Contribución individual (privada): el voto de un usuario para un comercio.
CREATE TABLE community_rule_contributions (
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_key TEXT        NOT NULL,
  category_id  UUID        NOT NULL REFERENCES categories(id),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, merchant_key)
);

-- Agregado público: para cada (comercio, categoría), cuántos usuarios la votan.
CREATE TABLE community_rules (
  merchant_key TEXT        NOT NULL,
  category_id  UUID        NOT NULL REFERENCES categories(id),
  votes        INT         NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (merchant_key, category_id)
);

CREATE INDEX idx_community_rules_key_votes
  ON community_rules(merchant_key, votes DESC);

-- ------------------------------------------------------------
-- Recalcular el agregado de un comercio a partir de las contribuciones.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION recompute_community_rule(p_merchant_key TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM community_rules WHERE merchant_key = p_merchant_key;
  INSERT INTO community_rules (merchant_key, category_id, votes, updated_at)
  SELECT merchant_key, category_id, COUNT(*)::INT, NOW()
  FROM community_rule_contributions
  WHERE merchant_key = p_merchant_key
  GROUP BY merchant_key, category_id;
END;
$$;

-- ------------------------------------------------------------
-- Registrar / actualizar el voto del usuario actual para un comercio.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION upsert_community_vote(p_merchant_key TEXT, p_category_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_merchant_key IS NULL OR length(trim(p_merchant_key)) = 0 OR p_category_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO community_rule_contributions (user_id, merchant_key, category_id, updated_at)
  VALUES (auth.uid(), p_merchant_key, p_category_id, NOW())
  ON CONFLICT (user_id, merchant_key)
  DO UPDATE SET category_id = EXCLUDED.category_id, updated_at = NOW();

  PERFORM recompute_community_rule(p_merchant_key);
END;
$$;

-- ------------------------------------------------------------
-- Retirar el voto del usuario actual para un comercio.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_community_vote(p_merchant_key TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM community_rule_contributions
  WHERE user_id = auth.uid() AND merchant_key = p_merchant_key;

  PERFORM recompute_community_rule(p_merchant_key);
END;
$$;

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE community_rule_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_rules              ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo ve/gestiona sus propias contribuciones (lectura).
-- La escritura real se hace vía funciones SECURITY DEFINER.
CREATE POLICY "own_contributions" ON community_rule_contributions
  FOR SELECT USING (user_id = auth.uid());

-- El agregado es de lectura pública para usuarios autenticados; sin escritura directa.
CREATE POLICY "read_community_rules" ON community_rules
  FOR SELECT USING (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- GRANTS
-- ------------------------------------------------------------
GRANT SELECT ON community_rules              TO authenticated;
GRANT SELECT ON community_rule_contributions TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_community_vote(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_community_vote(TEXT)       TO authenticated;
