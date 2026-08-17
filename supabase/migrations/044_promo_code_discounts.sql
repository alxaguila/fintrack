-- ============================================================
-- FinTrack — Migración 044: Descuento en códigos promocionales
-- Ejecutar en el SQL Editor de Supabase (después de 001–043)
-- ============================================================
--
-- Extiende promo_codes (migración 043) con una segunda forma de recompensa:
-- un descuento (% o importe fijo en EUR) sobre el precio de la suscripción,
-- para campañas tipo "Black Friday: 50% en planes anuales". Sin ciclo de
-- facturación (mensual/anual) en el propio código: la app todavía no tiene
-- ese concepto en ningún sitio (los precios de la landing son solo texto),
-- así que lo interpretará el futuro checkout, no el código.
--
-- Un código concede plan gratis (reward_plan/reward_days, migración 043) O
-- un descuento — nunca ambas cosas — de ahí el CHECK de exclusión mutua.
-- Igual que reward_plan/reward_days, esto es solo esquema + admin CRUD: no
-- hay ningún checkout todavía que lea/aplique este descuento.
--
-- Idempotente: se puede re-ejecutar sin error.
-- ------------------------------------------------------------

ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS discount_type text;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS discount_value numeric;

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_discount_type;
ALTER TABLE promo_codes ADD  CONSTRAINT chk_promo_code_discount_type
  CHECK (discount_type IS NULL OR discount_type IN ('percent', 'fixed'));

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_discount_value;
ALTER TABLE promo_codes ADD  CONSTRAINT chk_promo_code_discount_value
  CHECK (discount_value IS NULL OR discount_value > 0);

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_discount_percent_range;
ALTER TABLE promo_codes ADD  CONSTRAINT chk_promo_code_discount_percent_range
  CHECK (discount_type IS DISTINCT FROM 'percent' OR discount_value <= 100);

-- discount_type y discount_value siempre van juntos (ambos NULL o ambos con valor).
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_discount_pair;
ALTER TABLE promo_codes ADD  CONSTRAINT chk_promo_code_discount_pair
  CHECK ((discount_type IS NULL) = (discount_value IS NULL));

-- Exclusión mutua con la recompensa de plan (migración 043).
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_code_reward_exclusive;
ALTER TABLE promo_codes ADD  CONSTRAINT chk_promo_code_reward_exclusive
  CHECK (reward_plan IS NULL OR discount_type IS NULL);
