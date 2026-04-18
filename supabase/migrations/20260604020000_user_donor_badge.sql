-- ==========================================================================
-- Paw Angel: badge de donante por usuario
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-19):
-- Los usuarios que han donado al menos una vez deben tener un badge en su
-- perfil publico. Tier se calcula por total historico:
--   - bronze: cualquier donacion pagada (>= $500 minimo, definido por donations)
--   - silver: >= $10.000 CLP acumulado
--   - gold:   >= $50.000 CLP acumulado
--
-- El RPC retorna solo el tier + fecha primera donacion + cantidad, NUNCA
-- el monto exacto (respeta privacidad financiera del donante).
-- Grant EXECUTE anon/authenticated para que perfiles publicos muestren el badge.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.get_user_donor_badge(p_user_id UUID)
RETURNS TABLE (
  tier TEXT,
  first_donation_at TIMESTAMPTZ,
  donation_count INT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN SUM(d.amount_clp) >= 50000 THEN 'gold'
      WHEN SUM(d.amount_clp) >= 10000 THEN 'silver'
      ELSE 'bronze'
    END AS tier,
    MIN(d.paid_at) AS first_donation_at,
    COUNT(*)::INT AS donation_count
  FROM public.donations d
  WHERE d.user_id = p_user_id
    AND d.status = 'paid'
  HAVING COUNT(*) > 0;
$$;

REVOKE ALL ON FUNCTION public.get_user_donor_badge(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_donor_badge(UUID) TO anon, authenticated;

COMMENT ON FUNCTION public.get_user_donor_badge(UUID) IS
  'Paw Angel badge: retorna tier (bronze/silver/gold) + fecha primera donacion + cantidad, para el user_id dado. Null si no ha donado. Nunca expone monto exacto.';

-- Indice para el scan que hace el RPC (user_id + status).
CREATE INDEX IF NOT EXISTS idx_donations_paid_by_user
  ON public.donations(user_id, paid_at)
  WHERE status = 'paid' AND user_id IS NOT NULL;
