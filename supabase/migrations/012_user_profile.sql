-- ============================================================
-- FinTrack — Datos demográficos del usuario (onboarding)
-- Ejecutar en el SQL Editor de Supabase (después de 001–011)
-- ============================================================
--
-- Añade a user_settings los datos que se piden en el onboarding tras verificar
-- el email. Son datos del USUARIO de la cuenta (no de los financial_profiles).
--
-- Seguridad / validación (defensa en profundidad, igual que 011):
--   - El cliente valida con zod (src/lib/validation.ts) como 1ª capa.
--   - Aquí van los CHECK que son el backstop real si alguien salta el cliente.
--   - RLS: la política "own_settings" (FOR ALL USING user_id = auth.uid()) ya
--     acota lectura/escritura a la fila del propio usuario. No se toca.
--
-- Idempotente: se puede re-ejecutar sin error.
-- ------------------------------------------------------------

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS full_name            text;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS gender               text;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS birth_date           date;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS country              text;   -- ISO-2
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS province             text;   -- subdivisión ISO 3166-2
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS employment_status    text;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS financial_goal       text;   -- opcional
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- ------------------------------------------------------------
-- CHECKs (longitud, enums cerrados, formato de país, rango de fecha)
-- ------------------------------------------------------------
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS chk_us_full_name_len;
ALTER TABLE user_settings ADD  CONSTRAINT chk_us_full_name_len
  CHECK (full_name IS NULL OR char_length(full_name) <= 80);

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS chk_us_province_len;
ALTER TABLE user_settings ADD  CONSTRAINT chk_us_province_len
  CHECK (province IS NULL OR char_length(province) <= 100);

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS chk_us_gender;
ALTER TABLE user_settings ADD  CONSTRAINT chk_us_gender
  CHECK (gender IS NULL OR gender IN ('male','female','other','prefer_not_say'));

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS chk_us_employment;
ALTER TABLE user_settings ADD  CONSTRAINT chk_us_employment
  CHECK (employment_status IS NULL OR employment_status IN
    ('employed','self_employed','student','retired','unemployed','other'));

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS chk_us_financial_goal;
ALTER TABLE user_settings ADD  CONSTRAINT chk_us_financial_goal
  CHECK (financial_goal IS NULL OR financial_goal IN
    ('save','pay_off_debt','invest','control_spending','other'));

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS chk_us_country;
ALTER TABLE user_settings ADD  CONSTRAINT chk_us_country
  CHECK (country IS NULL OR country ~ '^[A-Z]{2}$');

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS chk_us_birth_date;
ALTER TABLE user_settings ADD  CONSTRAINT chk_us_birth_date
  CHECK (birth_date IS NULL OR (birth_date >= DATE '1900-01-01' AND birth_date <= CURRENT_DATE));
