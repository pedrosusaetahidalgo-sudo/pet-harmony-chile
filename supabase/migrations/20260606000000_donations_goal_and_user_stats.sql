-- ==========================================================================
-- Donations: meta global $20M + stats por usuario (membresia simulada)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-19):
-- Pedro pide:
--   1. Meta visible: 20.000.000 CLP en total para sostener Paw Friend.
--      Mostrar barra de % pero OCULTAR el monto total recaudado exacto.
--   2. Cada user logueado debe ver su aporte acumulado + aporte de este
--      mes (simula una "membresia" voluntaria).
--
-- Esta migracion crea 2 RPCs:
--   - get_donations_goal_progress(): publico, retorna solo % + agregados
--     del mes + conteo de donantes. NO expone total_clp exacto.
--   - get_my_donation_stats(): privado (authenticated), retorna lo que
--     el user logueado ha donado (total + este mes + count + fecha).
--
-- IMPORTANTE: la meta esta hardcoded a 20_000_000 en SQL y en frontend
-- (src/lib/donations.ts constante DONATIONS_GOAL_CLP). Si cambia, hay
-- que actualizar ambos lugares.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.get_donations_goal_progress()
RETURNS TABLE (
  percent INT,
  month_clp BIGINT,
  donors_total INT,
  donors_month INT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH sums AS (
    SELECT
      COALESCE(SUM(d.amount_clp), 0)::BIGINT AS total_clp,
      COALESCE(SUM(d.amount_clp) FILTER (
        WHERE d.paid_at >= date_trunc('month', NOW())
      ), 0)::BIGINT AS month_clp,
      COUNT(DISTINCT COALESCE(d.user_id::TEXT, d.commerce_order))::INT AS donors_total,
      COUNT(DISTINCT COALESCE(d.user_id::TEXT, d.commerce_order)) FILTER (
        WHERE d.paid_at >= date_trunc('month', NOW())
      )::INT AS donors_month
    FROM public.donations d
    WHERE d.status = 'paid'
  )
  SELECT
    LEAST(100, GREATEST(0, FLOOR(s.total_clp * 100.0 / 20000000.0)::INT)) AS percent,
    s.month_clp,
    s.donors_total,
    s.donors_month
  FROM sums s;
$$;

REVOKE ALL ON FUNCTION public.get_donations_goal_progress() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_donations_goal_progress() TO anon, authenticated;

COMMENT ON FUNCTION public.get_donations_goal_progress() IS
  'Progreso publico hacia la meta de donaciones (20M CLP). Retorna solo % (clamped 0-100) + agregados. NO expone el total recaudado exacto al cliente.';

-- ==========================================================================
-- Stats del user logueado (membresia simulada)
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.get_my_donation_stats()
RETURNS TABLE (
  total_clp BIGINT,
  month_clp BIGINT,
  donation_count INT,
  first_donation_at TIMESTAMPTZ,
  last_donation_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(d.amount_clp), 0)::BIGINT AS total_clp,
    COALESCE(SUM(d.amount_clp) FILTER (
      WHERE d.paid_at >= date_trunc('month', NOW())
    ), 0)::BIGINT AS month_clp,
    COUNT(*)::INT AS donation_count,
    MIN(d.paid_at) AS first_donation_at,
    MAX(d.paid_at) AS last_donation_at
  FROM public.donations d
  WHERE d.user_id = auth.uid()
    AND d.status = 'paid';
$$;

REVOKE ALL ON FUNCTION public.get_my_donation_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_donation_stats() TO authenticated;

COMMENT ON FUNCTION public.get_my_donation_stats() IS
  'Stats del user logueado (auth.uid()). Retorna aporte total + aporte del mes + count + fecha primera/ultima donacion. Usado en /donaciones para mostrar "membresia simulada" al usuario.';
