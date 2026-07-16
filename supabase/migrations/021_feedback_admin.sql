-- ============================================================
-- FinTrack — Migración 021: bandeja de feedback en el backoffice
-- Ejecutar en el SQL Editor de Supabase (después de 001–020)
-- ============================================================
--
-- La 014 creó `feedback` como buzón ciego: solo-INSERT, sin ninguna policy de
-- SELECT, así que ni un admin podía leerlo desde la app (solo el dashboard, que
-- va con service role y se salta la RLS). Aquí lo abrimos al backoffice:
--
--   1) `read_at` (NULL = no leído) para la bandeja estilo correo de /admin/feedback.
--   2) SELECT + UPDATE solo para is_admin() (función de la 015).
--
-- Nota sobre el GRANT: la RLS decide QUÉ filas se tocan, no qué columnas. Para
-- que un admin no pueda reescribir el `message` de un usuario, el permiso de
-- UPDATE se da a nivel de columna, solo sobre `read_at`.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 1. Columna de lectura
-- ------------------------------------------------------------
-- Timestamp en vez de booleano: cuesta lo mismo y deja traza de cuándo se leyó.
ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Alimenta el contador de no leídos (puntito rojo del hub). Parcial: el índice
-- solo indexa lo pendiente, que es lo único que se cuenta.
CREATE INDEX IF NOT EXISTS idx_feedback_unread
  ON feedback(created_at DESC)
  WHERE read_at IS NULL;

-- ------------------------------------------------------------
-- 2. Policies de admin
-- ------------------------------------------------------------
-- La policy "insert_own_feedback" de la 014 sigue vigente y no se toca.
DROP POLICY IF EXISTS "feedback admin read" ON feedback;
CREATE POLICY "feedback admin read"
  ON feedback FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "feedback admin mark read" ON feedback;
CREATE POLICY "feedback admin mark read"
  ON feedback FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- 3. Grants (la RLS de arriba sigue filtrando por is_admin())
-- ------------------------------------------------------------
GRANT SELECT ON feedback TO authenticated;
GRANT UPDATE (read_at) ON feedback TO authenticated;
