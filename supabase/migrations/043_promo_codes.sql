-- ============================================================
-- FinTrack — Migración 043: Códigos promocionales (promo_codes)
-- Ejecutar en el SQL Editor de Supabase (después de 001–042)
-- ============================================================
--
-- Infraestructura de códigos para futuras promociones: alta de nuevo
-- usuario, invitación entre usuarios (referral) y campañas de email
-- marketing a usuarios ya registrados. Sin pasarela de pago todavía, así
-- que la recompensa se modela como una concesión temporal de plan
-- (reward_plan/reward_days), reutilizando el sistema FREE/PRO/PREMIUM ya
-- existente (migración 022) en vez de un descuento en €.
--
-- Alcance de esta migración: solo el esquema + gestión desde /admin. NO
-- incluye ningún RPC de canje/validación (nadie incrementa use_count
-- todavía) — se construirá junto con la primera pantalla de usuario que
-- consuma un código (registro, invitación o checkout), para no dejar
-- código sin invocar. Ver memoria project_promo_codes.
--
-- Idempotente: se puede re-ejecutar sin error.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS promo_codes (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code         text        NOT NULL UNIQUE,
  type         text        NOT NULL,
  description  text,
  -- Dueño del código si type='referral' (quién invita). NULL en signup/campaign.
  -- Sin autogeneración todavía: el admin lo asigna a mano si quiere probar el flujo.
  owner_user_id uuid       REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_plan  text,
  reward_days  integer,
  starts_at    timestamptz,
  ends_at      timestamptz,
  max_uses     integer,
  use_count    integer     NOT NULL DEFAULT 0,
  is_active    boolean     NOT NULL DEFAULT true,
  created_by   uuid        REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_len;
ALTER TABLE promo_codes ADD  CONSTRAINT chk_promo_code_len
  CHECK (char_length(code) BETWEEN 3 AND 40);

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_format;
ALTER TABLE promo_codes ADD  CONSTRAINT chk_promo_code_format
  CHECK (code ~ '^[A-Z0-9_-]+$');

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_type;
ALTER TABLE promo_codes ADD  CONSTRAINT chk_promo_code_type
  CHECK (type IN ('signup', 'referral', 'campaign'));

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_reward_plan;
ALTER TABLE promo_codes ADD  CONSTRAINT chk_promo_code_reward_plan
  CHECK (reward_plan IS NULL OR reward_plan IN ('free', 'pro', 'premium'));

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_reward_days;
ALTER TABLE promo_codes ADD  CONSTRAINT chk_promo_code_reward_days
  CHECK (reward_days IS NULL OR reward_days > 0);

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_max_uses;
ALTER TABLE promo_codes ADD  CONSTRAINT chk_promo_code_max_uses
  CHECK (max_uses IS NULL OR max_uses > 0);

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_dates;
ALTER TABLE promo_codes ADD  CONSTRAINT chk_promo_code_dates
  CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at >= starts_at);

CREATE INDEX IF NOT EXISTS idx_promo_codes_owner ON promo_codes(owner_user_id);

-- Solo admin: a diferencia de merchants/bank_entities (catálogos de lectura
-- pública), aquí no hay ningún flujo de usuario todavía que necesite leer
-- códigos, así que no se abre SELECT a "authenticated" en general.
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo_codes admin select" ON promo_codes;
CREATE POLICY "promo_codes admin select"
  ON promo_codes FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "promo_codes admin insert" ON promo_codes;
CREATE POLICY "promo_codes admin insert"
  ON promo_codes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "promo_codes admin update" ON promo_codes;
CREATE POLICY "promo_codes admin update"
  ON promo_codes FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "promo_codes admin delete" ON promo_codes;
CREATE POLICY "promo_codes admin delete"
  ON promo_codes FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON promo_codes TO authenticated;

-- updated_at automático en cada UPDATE (mismo patrón que otras tablas admin).
CREATE OR REPLACE FUNCTION set_promo_codes_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_promo_codes_updated_at ON promo_codes;
CREATE TRIGGER trg_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION set_promo_codes_updated_at();
