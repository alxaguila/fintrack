-- ============================================================
-- FinTrack — 014: Feedback / soporte del usuario
-- Ejecutar en el SQL Editor de Supabase (después de las anteriores)
-- ============================================================
--
-- Objetivo: recoger sugerencias, quejas y reportes de bugs enviados desde la
-- app. NO se envía email: las entradas se leen desde el dashboard de Supabase
-- (y en el futuro desde un backoffice de admin).
--
-- Privacidad / RLS: cada usuario autenticado puede INSERTAR su propio feedback
-- (user_id = auth.uid()), pero NADIE lo lee con la anon key (sin policy SELECT);
-- la lectura se hace con service role / backoffice.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ON DELETE SET NULL: si el usuario borra su cuenta, conservamos el feedback
  -- (útil para el backoffice) pero desligado de su identidad.
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  email       TEXT,
  type        TEXT        NOT NULL DEFAULT 'other'
              CHECK (type IN ('suggestion', 'complaint', 'bug', 'other')),
  message     TEXT        NOT NULL CHECK (length(message) BETWEEN 1 AND 4000),
  app_version TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- El usuario autenticado solo puede insertar filas a su propio nombre.
CREATE POLICY "insert_own_feedback" ON feedback
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Sin policy SELECT/UPDATE/DELETE → los clientes no pueden leer ni tocar el
-- feedback. Se consulta con service role (backoffice / dashboard).

GRANT INSERT ON feedback TO authenticated;
