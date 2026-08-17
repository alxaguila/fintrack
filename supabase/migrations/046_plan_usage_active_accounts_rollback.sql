-- ============================================================
-- FinTrack — Rollback migración 046: cuentas archivadas no cuentan en el plan
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_plan_usage()
RETURNS TABLE (
  movements_this_month int,
  imports_this_month    int,
  profiles_count        int,
  accounts_count        int,
  rules_count           int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::int
       FROM transactions t
       JOIN financial_profiles fp ON fp.id = t.profile_id
       WHERE fp.user_id = auth.uid()
         AND date_trunc('month', t.date) = date_trunc('month', CURRENT_DATE)),
    (SELECT COUNT(*)::int
       FROM import_batches ib
       JOIN financial_profiles fp ON fp.id = ib.profile_id
       WHERE fp.user_id = auth.uid()
         AND date_trunc('month', ib.imported_at) = date_trunc('month', CURRENT_DATE)),
    (SELECT COUNT(*)::int FROM financial_profiles fp WHERE fp.user_id = auth.uid()),
    (SELECT COUNT(*)::int
       FROM accounts a
       JOIN financial_profiles fp ON fp.id = a.profile_id
       WHERE fp.user_id = auth.uid()),
    (SELECT COUNT(*)::int FROM keyword_rules kr WHERE kr.user_id = auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_plan_usage() TO authenticated;
