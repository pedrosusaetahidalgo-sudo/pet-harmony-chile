-- ==========================================================================
-- RPC: embudo de activacion 30 dias (admin)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d Tanda 16):
-- Embudo general de activacion — complementa rpc_pdf_funnel (que mide
-- progreso de ficha). Mide: signup -> 1ra mascota -> 1ra accion concreta
-- -> activacion (login 7+ dias despues).
--
-- Cohortes: usuarios registrados en los ultimos 30 dias.
-- Ventana accion: dentro de 7 dias del signup (para medir activacion temprana).
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.rpc_activation_funnel_30d()
RETURNS TABLE(
  signups INT,
  with_pet INT,
  with_action INT,
  retained INT,
  captured_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_active_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  WITH cohort AS (
    SELECT p.id AS user_id, p.created_at AS signup_at
    FROM public.profiles p
    WHERE p.created_at >= NOW() - INTERVAL '30 days'
  ),
  with_pet AS (
    SELECT DISTINCT c.user_id
    FROM cohort c
    JOIN public.pets pt
      ON pt.owner_id = c.user_id
     AND pt.created_at <= c.signup_at + INTERVAL '7 days'
  ),
  with_action AS (
    SELECT DISTINCT c.user_id
    FROM cohort c
    WHERE EXISTS (
      SELECT 1
      FROM public.reminders r
      WHERE r.user_id = c.user_id
        AND r.created_at <= c.signup_at + INTERVAL '7 days'
    )
    OR EXISTS (
      SELECT 1
      FROM public.medical_share_tokens mst
      WHERE mst.owner_id = c.user_id
        AND mst.created_at <= c.signup_at + INTERVAL '7 days'
    )
    OR EXISTS (
      SELECT 1
      FROM public.vet_bookings vb
      WHERE vb.owner_id = c.user_id
        AND vb.created_at <= c.signup_at + INTERVAL '7 days'
    )
  ),
  retained AS (
    SELECT DISTINCT c.user_id
    FROM cohort c
    JOIN auth.users u ON u.id = c.user_id
    WHERE u.last_sign_in_at >= c.signup_at + INTERVAL '7 days'
  )
  SELECT
    (SELECT COUNT(*)::INT FROM cohort),
    (SELECT COUNT(*)::INT FROM with_pet),
    (SELECT COUNT(*)::INT FROM with_action),
    (SELECT COUNT(*)::INT FROM retained),
    NOW();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_activation_funnel_30d() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_activation_funnel_30d() TO authenticated;

COMMENT ON FUNCTION public.rpc_activation_funnel_30d() IS
  'Embudo activacion 30d para admin: signup -> 1ra mascota -> 1ra accion -> retenido 7d+.';

-- Verificacion post-apply:
-- SELECT * FROM rpc_activation_funnel_30d();
