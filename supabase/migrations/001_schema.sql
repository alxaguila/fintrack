-- ============================================================
-- FinTrack — Schema inicial
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- ------------------------------------------------------------
-- ENUMERACIONES
-- ------------------------------------------------------------
CREATE TYPE account_type AS ENUM (
  'cuenta_corriente', 'ahorro', 'tarjeta_credito', 'tarjeta_debito'
);

CREATE TYPE transaction_type AS ENUM (
  'gasto', 'ingreso', 'no_computable'
);

CREATE TYPE category_type AS ENUM (
  'gasto', 'ingreso', 'no_computable'
);

CREATE TYPE keyword_match_type AS ENUM (
  'contains', 'starts_with', 'ends_with', 'exact', 'regex'
);

CREATE TYPE file_format_type AS ENUM ('csv', 'xlsx', 'xls');

CREATE TYPE sign_convention_type AS ENUM (
  'signed',          -- columna única con signo: -45.00 = gasto
  'unsigned_type',   -- columna positiva + columna de tipo D/H o Cargo/Abono
  'split_columns'    -- columnas separadas débito y crédito
);

-- ------------------------------------------------------------
-- CONFIGURACIÓN DE USUARIO
-- ------------------------------------------------------------
CREATE TABLE user_settings (
  user_id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language TEXT        NOT NULL DEFAULT 'es',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- PERFILES FINANCIEROS
-- ------------------------------------------------------------
CREATE TABLE financial_profiles (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  avatar_color  TEXT        NOT NULL DEFAULT '#6366f1',
  is_default    BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order    SMALLINT    NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un solo perfil por defecto por usuario
CREATE UNIQUE INDEX one_default_profile_per_user
  ON financial_profiles(user_id)
  WHERE is_default = TRUE;

-- ------------------------------------------------------------
-- CUENTAS
-- ------------------------------------------------------------
CREATE TABLE accounts (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID         NOT NULL REFERENCES financial_profiles(id) ON DELETE CASCADE,
  name        TEXT         NOT NULL,
  entity      TEXT         NOT NULL,
  type        account_type NOT NULL,
  currency    CHAR(3)      NOT NULL DEFAULT 'EUR',
  iban        TEXT,
  last_four   TEXT,
  color       TEXT         NOT NULL DEFAULT '#6366f1',
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  SMALLINT     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TAXONOMÍA DE CATEGORÍAS (datos de referencia)
-- ------------------------------------------------------------
CREATE TABLE category_groups (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT          NOT NULL UNIQUE,
  type        category_type NOT NULL,
  icon        TEXT,
  color       TEXT,
  sort_order  SMALLINT      NOT NULL DEFAULT 0
);

CREATE TABLE categories (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID     NOT NULL REFERENCES category_groups(id),
  slug        TEXT     NOT NULL UNIQUE,
  icon        TEXT,    -- nombre de icono lucide (kebab-case) por subcategoría
  sort_order  SMALLINT NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------
-- FORMATOS DE BANCO (configuración de importación)
-- ------------------------------------------------------------
CREATE TABLE bank_formats (
  id               UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID                 NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT                 NOT NULL,
  entity           TEXT                 NOT NULL,
  file_format      file_format_type     NOT NULL DEFAULT 'csv',
  delimiter        TEXT                 NOT NULL DEFAULT ',',
  encoding         TEXT                 NOT NULL DEFAULT 'UTF-8',
  skip_rows        SMALLINT             NOT NULL DEFAULT 0,
  date_column      TEXT                 NOT NULL,
  date_format      TEXT                 NOT NULL DEFAULT 'dd/MM/yyyy',
  concept_column   TEXT                 NOT NULL,
  amount_column    TEXT,
  balance_column   TEXT,
  sign_convention  sign_convention_type NOT NULL DEFAULT 'signed',
  type_column      TEXT,
  debit_marker     TEXT,
  debit_column     TEXT,
  credit_column    TEXT,
  created_at       TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- LOTES DE IMPORTACIÓN
-- ------------------------------------------------------------
CREATE TABLE import_batches (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID        NOT NULL REFERENCES financial_profiles(id),
  account_id      UUID        NOT NULL REFERENCES accounts(id),
  bank_format_id  UUID        REFERENCES bank_formats(id),
  filename        TEXT        NOT NULL,
  file_hash       TEXT,
  rows_total      INT         NOT NULL DEFAULT 0,
  rows_imported   INT         NOT NULL DEFAULT 0,
  rows_skipped    INT         NOT NULL DEFAULT 0,
  rows_failed     INT         NOT NULL DEFAULT 0,
  date_from       DATE,
  date_to         DATE,
  imported_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- MOVIMIENTOS
-- ------------------------------------------------------------
CREATE TABLE transactions (
  id               UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID             NOT NULL REFERENCES financial_profiles(id) ON DELETE CASCADE,
  account_id       UUID             NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  import_batch_id  UUID             REFERENCES import_batches(id) ON DELETE SET NULL,
  date             DATE             NOT NULL,
  concept          TEXT             NOT NULL,
  amount           DECIMAL(15,2)    NOT NULL,  -- negativo = gasto, positivo = ingreso
  balance          DECIMAL(15,2),
  transaction_type transaction_type,
  category_id      UUID             REFERENCES categories(id),
  notes            TEXT,
  is_manual        BOOLEAN          NOT NULL DEFAULT FALSE,
  is_reviewed      BOOLEAN          NOT NULL DEFAULT FALSE,
  dedup_hash       TEXT             NOT NULL,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_transaction_per_account UNIQUE (account_id, dedup_hash)
);

CREATE INDEX idx_transactions_profile_date ON transactions(profile_id, date DESC);
CREATE INDEX idx_transactions_account      ON transactions(account_id, date DESC);
CREATE INDEX idx_transactions_category     ON transactions(category_id);
CREATE INDEX idx_transactions_type_date    ON transactions(profile_id, transaction_type, date DESC);

-- ------------------------------------------------------------
-- REGLAS DE CATEGORIZACIÓN AUTOMÁTICA
-- Nivel usuario (profile_id NULL = aplica a todos los perfiles)
-- Nivel perfil (profile_id NOT NULL = override para ese perfil)
-- ------------------------------------------------------------
CREATE TABLE keyword_rules (
  id          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID               NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id  UUID               REFERENCES financial_profiles(id) ON DELETE CASCADE,
  keyword     TEXT               NOT NULL,
  match_type  keyword_match_type NOT NULL DEFAULT 'contains',
  category_id UUID               NOT NULL REFERENCES categories(id),
  priority    SMALLINT           NOT NULL DEFAULT 100,
  is_active   BOOLEAN            NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- VISTA PARA RESUMEN MENSUAL POR PERFIL (para futuras vistas agregadas)
-- ------------------------------------------------------------
CREATE VIEW v_monthly_summary_by_profile AS
SELECT
  fp.user_id,
  fp.id                         AS profile_id,
  fp.name                       AS profile_name,
  DATE_TRUNC('month', t.date)   AS month,
  cg.id                         AS group_id,
  cg.slug                       AS group_slug,
  cg.type                       AS category_type,
  t.transaction_type,
  SUM(t.amount)                 AS total,
  COUNT(*)                      AS count
FROM transactions t
JOIN financial_profiles fp  ON t.profile_id  = fp.id
JOIN categories c           ON t.category_id = c.id
JOIN category_groups cg     ON c.group_id    = cg.id
GROUP BY
  fp.user_id, fp.id, fp.name,
  DATE_TRUNC('month', t.date),
  cg.id, cg.slug, cg.type, t.transaction_type;

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE user_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_formats        ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_groups     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories          ENABLE ROW LEVEL SECURITY;

-- user_settings
CREATE POLICY "own_settings" ON user_settings
  FOR ALL USING (user_id = auth.uid());

-- financial_profiles
CREATE POLICY "own_profiles" ON financial_profiles
  FOR ALL USING (user_id = auth.uid());

-- accounts (a través del perfil)
CREATE POLICY "own_accounts" ON accounts
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM financial_profiles WHERE user_id = auth.uid()
    )
  );

-- transactions (profile_id denormalizado para evitar doble join)
CREATE POLICY "own_transactions" ON transactions
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM financial_profiles WHERE user_id = auth.uid()
    )
  );

-- import_batches
CREATE POLICY "own_import_batches" ON import_batches
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM financial_profiles WHERE user_id = auth.uid()
    )
  );

-- bank_formats (pertenecen al usuario, compartidos entre perfiles)
CREATE POLICY "own_bank_formats" ON bank_formats
  FOR ALL USING (user_id = auth.uid());

-- keyword_rules (nivel usuario, con override por perfil)
CREATE POLICY "own_keyword_rules" ON keyword_rules
  FOR ALL USING (user_id = auth.uid());

-- categorías: solo lectura pública (datos de referencia)
CREATE POLICY "public_read_category_groups" ON category_groups
  FOR SELECT USING (true);

CREATE POLICY "public_read_categories" ON categories
  FOR SELECT USING (true);

-- ------------------------------------------------------------
-- NOTA: el trigger para crear user_settings automáticamente
-- está en 002_trigger.sql — ejecútalo en una query separada.
-- ------------------------------------------------------------
