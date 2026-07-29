-- ============================================================
-- FinTrack — Migración 045: tipo de perfil (particular/autónomo/empresa)
-- + corrección de nombres de perfil por defecto rotos (prefijo del email)
-- Ejecutar en el SQL Editor de Supabase (después de 001–044)
-- ============================================================
--
-- 1) Columna `type` en financial_profiles: mismo patrón que account_type /
--    transaction_type (código fijo en BD, traducido por clave i18n en el
--    frontend), no el patrón `categories.slug` en inglés (específico de la
--    taxonomía de categorías).
-- 2) Backfill: el auto-alta del perfil por defecto (AppShell.tsx) se disparaba
--    antes de que el onboarding rellenara first_name/last_name, así que usaba
--    el prefijo del email como nombre. Se corrige aquí para todos los
--    usuarios ya existentes con ese problema, usando su nombre real ya
--    guardado en user_settings.
-- ------------------------------------------------------------

ALTER TABLE financial_profiles ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'particular';

ALTER TABLE financial_profiles DROP CONSTRAINT IF EXISTS chk_financial_profiles_type;
ALTER TABLE financial_profiles ADD CONSTRAINT chk_financial_profiles_type
  CHECK (type IN ('particular', 'autonomo', 'empresa'));

-- Backfill: solo perfiles por defecto cuyo nombre coincide EXACTAMENTE con el
-- prefijo del email de su usuario (no se toca ningún perfil renombrado a mano).
UPDATE financial_profiles fp
SET name = trim(concat_ws(' ', us.first_name, us.last_name)),
    updated_at = NOW()
FROM auth.users au
JOIN user_settings us ON us.user_id = au.id
WHERE fp.user_id = au.id
  AND fp.is_default = TRUE
  AND fp.name = split_part(au.email, '@', 1)
  AND us.first_name IS NOT NULL
  AND trim(concat_ws(' ', us.first_name, us.last_name)) <> '';
