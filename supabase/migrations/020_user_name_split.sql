-- ============================================================
-- FinTrack — Separar nombre y apellidos en user_settings
-- Ejecutar en el SQL Editor de Supabase (después de 001–019)
-- ============================================================
--
-- Hasta ahora el onboarding pedía un único `full_name`. Se divide en
-- `first_name` (nombre) y `last_name` (apellidos) para poder saludar al
-- usuario por su nombre de pila y ordenar/mostrar mejor sus datos.
--
-- `full_name` se conserva: la app lo reescribe como `first_name || ' ' || last_name`
-- al guardar, y se mantiene como campo derivado para compatibilidad (admin, etc.).
--
-- Backfill: los `full_name` ya existentes se parten por el primer espacio →
-- 1ª palabra = nombre, resto = apellidos.
--
-- Idempotente: se puede re-ejecutar sin error.
-- ------------------------------------------------------------

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS last_name  text;

-- CHECKs de longitud (backstop del cliente; <= al límite de zod = 80).
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS chk_us_first_name_len;
ALTER TABLE user_settings ADD  CONSTRAINT chk_us_first_name_len
  CHECK (first_name IS NULL OR char_length(first_name) <= 80);

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS chk_us_last_name_len;
ALTER TABLE user_settings ADD  CONSTRAINT chk_us_last_name_len
  CHECK (last_name IS NULL OR char_length(last_name) <= 80);

-- ------------------------------------------------------------
-- Backfill desde full_name (solo filas con full_name y sin first_name aún).
-- 1ª palabra → first_name; resto (si lo hay) → last_name.
-- ------------------------------------------------------------
UPDATE user_settings
SET
  first_name = split_part(trim(full_name), ' ', 1),
  last_name  = NULLIF(trim(substring(trim(full_name) FROM position(' ' IN trim(full_name)) + 1)), '')
WHERE full_name IS NOT NULL
  AND trim(full_name) <> ''
  AND first_name IS NULL;

-- Nota: cuando full_name no tiene espacio, position(...) = 0 y el substring
-- devuelve el nombre completo; para evitar duplicar nombre en apellidos:
UPDATE user_settings
SET last_name = NULL
WHERE full_name IS NOT NULL
  AND position(' ' IN trim(full_name)) = 0
  AND last_name = first_name;
