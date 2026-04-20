-- ==========================================================================
-- RPC admin: MRR B2B timeseries (últimas 6 semanas)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d):
-- AdminPDFFunnelWidget muestra conversión. Falta visibilizar evolución del
-- MRR B2B semana a semana para ritual + deck inversores.
--
-- Cálculo: cada fila = snapshot "al cierre de la semana N" del MRR
-- acumulado de vets con plan != free que estaban activos.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.rpc_mrr_timeseries()
RETURNS TABLE (
  week_start DATE,
  mrr_clp BIGINT,
  paying_vets INTEGER,
  new_paying_this_week INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_week_offset INT;
  v_week_start DATE;
  v_week_end DATE;
BEGIN
  IF NOT public.is_active_admin(auth.uid()) THEN
    RETURN;
  END IF;

  -- Últimas 6 semanas terminando en esta
  FOR v_week_offset IN REVERSE 5..0 LOOP
    v_week_start := date_trunc('week', CURRENT_DATE - (v_week_offset * 7))::DATE;
    v_week_end := v_week_start + INTERVAL '6 days';

    RETURN QUERY
    SELECT
      v_week_start AS week_start,
      COALESCE(SUM(
        CASE sp.provider_plan
          WHEN 'provider_premium'        THEN 9900
          WHEN 'provider_individual'     THEN 9900
          WHEN 'provider_clinic_starter' THEN 19900
          WHEN 'provider_clinic_basic'   THEN 19900
          WHEN 'provider_pro_max'        THEN 29900
          WHEN 'provider_clinic_pro'     THEN 29900
          ELSE 0
        END
      ), 0)::BIGINT AS mrr_clp,
      COUNT(*)::INTEGER AS paying_vets,
      COUNT(*) FILTER (
        WHERE sp.created_at BETWEEN v_week_start AND (v_week_end + INTERVAL '1 day')
      )::INTEGER AS new_paying_this_week
    FROM public.service_providers sp
    WHERE sp.provider_plan IS NOT NULL
      AND sp.provider_plan != 'provider_free'
      AND sp.created_at <= (v_week_end + INTERVAL '1 day')
      AND sp.status IN ('approved', 'active', 'pending');
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.rpc_mrr_timeseries() IS
  'MRR B2B + count vets pagando + nuevos esta semana, snapshot por semana ultimas 6. Para widget AdminMRRChart.';

GRANT EXECUTE ON FUNCTION public.rpc_mrr_timeseries() TO authenticated;
