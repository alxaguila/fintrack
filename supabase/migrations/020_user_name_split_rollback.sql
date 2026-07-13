-- ============================================================
-- Rollback de 020_user_name_split.sql
-- ============================================================
-- Elimina las columnas first_name/last_name y sus CHECK. `full_name` se
-- mantiene intacto (sigue siendo la fuente compatible del nombre completo).
-- ------------------------------------------------------------

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS chk_us_first_name_len;
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS chk_us_last_name_len;

ALTER TABLE user_settings DROP COLUMN IF EXISTS first_name;
ALTER TABLE user_settings DROP COLUMN IF EXISTS last_name;
