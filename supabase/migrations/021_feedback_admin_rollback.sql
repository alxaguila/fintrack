-- ============================================================
-- FinTrack — Rollback de la migración 021 (bandeja de feedback en admin)
-- Deja `feedback` como la dejó la 014: buzón ciego de solo-INSERT.
-- ============================================================

REVOKE UPDATE (read_at) ON feedback FROM authenticated;
REVOKE SELECT ON feedback FROM authenticated;

DROP POLICY IF EXISTS "feedback admin mark read" ON feedback;
DROP POLICY IF EXISTS "feedback admin read" ON feedback;

DROP INDEX IF EXISTS idx_feedback_unread;

-- Destructivo: se pierde qué feedback estaba leído. El feedback en sí se conserva.
ALTER TABLE feedback DROP COLUMN IF EXISTS read_at;
