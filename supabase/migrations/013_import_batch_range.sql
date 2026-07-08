-- ============================================================
-- FinTrack — Migración 013: rango de fechas por lote de importación
-- ------------------------------------------------------------
-- Para el Historial: dos columnas "Desde / Hasta" con la primera y última
-- fecha de los movimientos que contiene cada subida. Es un agregado, así que se
-- resuelve con una vista (patrón del dashboard) en vez de traer movimientos al
-- cliente. security_invoker = true → respeta la RLS de transactions, de modo
-- que cada usuario solo ve el rango de sus propios lotes.
-- ============================================================

CREATE OR REPLACE VIEW v_import_batch_range
WITH (security_invoker = true) AS
SELECT
  t.import_batch_id,
  t.profile_id,
  MIN(t.date) AS date_from,
  MAX(t.date) AS date_to
FROM transactions t
WHERE t.import_batch_id IS NOT NULL
GROUP BY t.import_batch_id, t.profile_id;
