-- 2026-04-30 (Observabilidad B2B · extiende compute_risk_signals con motores)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Extiende compute_risk_signals() (mig 20260903100000_risk_monitor) con 4
-- signals nuevas para los 7 motores Revenue Master Plan:
--
-- 6. b2b_api_error_rate (§11.1) — b2b_api_usage 5xx > 5% en 24h
-- 7. insurance_leads_dead_channel (§11.5) — 0 leads en >7d con partners
--    activos = canal muerto (signal de que el motor B2B no esta convirtiendo)
-- 8. retail_conversion_drop (§11.5) — total_clicks - conversions ratio
--    indica que el funnel se rompio (clicks pero sin compras)
-- 9. b2b_outreach_silence (§11.5) — 0 outreach enviado en >14d (Pedro
--    no esta usando el sistema de outreach automation)
--
-- Cada signal se agrega con la misma estructura (signal_id, severity,
-- value, threshold, message, linked_risk).

BEGIN;

CREATE OR REPLACE FUNCTION public.compute_risk_signals()
RETURNS TABLE (
  signal_id TEXT,
  name TEXT,
  severity TEXT,
  value NUMERIC,
  threshold NUMERIC,
  message TEXT,
  linked_risk TEXT,
  computed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ai_calls_24h INT;
  v_consent_rate NUMERIC;
  v_consent_decided INT;
  v_pets_memorial INT;
  v_pets_active INT;
  v_dropout_ratio NUMERIC;
  v_edge_5xx_24h INT;
  v_edge_total_24h INT;
  v_error_rate NUMERIC;
  -- B2B signals
  v_b2b_api_5xx_24h INT;
  v_b2b_api_total_24h INT;
  v_b2b_api_error_rate NUMERIC;
  v_active_insurance_partners INT;
  v_insurance_leads_7d INT;
  v_retail_clicks_30d INT;
  v_retail_conversions_30d INT;
  v_retail_conversion_rate NUMERIC;
  v_outreach_14d INT;
BEGIN
  -- 1. AI cost spike
  SELECT COUNT(*) INTO v_ai_calls_24h
  FROM public.system_health_log
  WHERE function_name IN (
    'pet-assistant', 'breed-tips', 'medical-suggestions',
    'bereavement-assistant', 'process-consultation-transcript',
    'verify-vet-document', 'verify-service-provider',
    'moderate-service-promotion', 'ocr-vaccination-card',
    'generate-medical-summary', 'generate-vet-patient-summary'
  )
    AND status = 'success'
    AND created_at >= NOW() - INTERVAL '24 hours';

  IF v_ai_calls_24h > 1000 THEN
    RETURN QUERY SELECT
      'openai_cost_spike'::TEXT,
      'OpenAI/Claude calls altas'::TEXT,
      CASE WHEN v_ai_calls_24h > 5000 THEN 'critical' ELSE 'warn' END::TEXT,
      v_ai_calls_24h::NUMERIC,
      1000::NUMERIC,
      FORMAT('AI APIs llamadas %s veces en 24h. Supera threshold 1000.', v_ai_calls_24h),
      '11.1: Costo OpenAI spikes'::TEXT,
      NOW();
  END IF;

  -- 2. Consent rate <30%
  SELECT
    COUNT(*) FILTER (WHERE anonymous_data_research_consent = TRUE)::NUMERIC,
    COUNT(*) FILTER (WHERE anonymous_data_research_consent IS NOT NULL)::INT
  INTO v_consent_rate, v_consent_decided
  FROM public.profiles;

  IF v_consent_decided >= 50 THEN
    v_consent_rate := (v_consent_rate / v_consent_decided) * 100;
    IF v_consent_rate < 30 THEN
      RETURN QUERY SELECT
        'low_consent_rate'::TEXT,
        'Opt-in research consent bajo'::TEXT,
        CASE WHEN v_consent_rate < 15 THEN 'critical' ELSE 'warn' END::TEXT,
        ROUND(v_consent_rate, 1),
        30::NUMERIC,
        FORMAT('Solo %s%% de %s users decidieron opt-in. Pharma deal requiere >=30%%.',
          ROUND(v_consent_rate, 1), v_consent_decided),
        '11.2: Bajo conversion seguros embebidos'::TEXT,
        NOW();
    END IF;
  END IF;

  -- 3. Pet dropout
  SELECT COUNT(*) INTO v_pets_memorial
  FROM public.pets
  WHERE lifecycle_status = 'memorial'
    AND updated_at >= NOW() - INTERVAL '30 days';

  SELECT COUNT(*) INTO v_pets_active
  FROM public.pets
  WHERE lifecycle_status = 'active'
    AND created_at >= NOW() - INTERVAL '30 days';

  IF v_pets_active > 0 THEN
    v_dropout_ratio := (v_pets_memorial::NUMERIC / v_pets_active) * 100;
    IF v_dropout_ratio > 20 THEN
      RETURN QUERY SELECT
        'high_pet_dropout'::TEXT,
        'Memorial > 20% del crecimiento'::TEXT,
        CASE WHEN v_dropout_ratio > 40 THEN 'critical' ELSE 'warn' END::TEXT,
        ROUND(v_dropout_ratio, 1),
        20::NUMERIC,
        FORMAT('30d: %s memorial vs %s active = %s%% dropout.',
          v_pets_memorial, v_pets_active, ROUND(v_dropout_ratio, 1)),
        '11.2: Memorial percibido como morboso'::TEXT,
        NOW();
    END IF;
  END IF;

  -- 4. Edge fn error rate
  SELECT
    COUNT(*) FILTER (WHERE status = 'error'),
    COUNT(*)
  INTO v_edge_5xx_24h, v_edge_total_24h
  FROM public.system_health_log
  WHERE created_at >= NOW() - INTERVAL '24 hours';

  IF v_edge_total_24h >= 100 THEN
    v_error_rate := (v_edge_5xx_24h::NUMERIC / v_edge_total_24h) * 100;
    IF v_error_rate > 5 THEN
      RETURN QUERY SELECT
        'edge_fn_error_rate'::TEXT,
        'Edge fns con error rate alta'::TEXT,
        CASE WHEN v_error_rate > 15 THEN 'critical' ELSE 'warn' END::TEXT,
        ROUND(v_error_rate, 1),
        5::NUMERIC,
        FORMAT('24h: %s errors / %s calls = %s%%.',
          v_edge_5xx_24h, v_edge_total_24h, ROUND(v_error_rate, 1)),
        '11.1: Errors criticos consola'::TEXT,
        NOW();
    END IF;
  END IF;

  -- 5. Pgvector slow
  IF EXISTS (
    SELECT 1 FROM public.system_health_log
    WHERE function_name = 'nose-print-match'
      AND created_at >= NOW() - INTERVAL '24 hours'
      AND execution_time_ms > 5000
  ) THEN
    RETURN QUERY
    SELECT
      'pgvector_slow'::TEXT,
      'nose-print-match lento'::TEXT,
      'warn'::TEXT,
      (
        SELECT MAX(execution_time_ms)::NUMERIC
        FROM public.system_health_log
        WHERE function_name = 'nose-print-match'
          AND created_at >= NOW() - INTERVAL '24 hours'
      ),
      5000::NUMERIC,
      FORMAT(
        '%s calls de nose-print-match >5s en 24h. Revisar pgvector index.',
        (
          SELECT COUNT(*) FROM public.system_health_log
          WHERE function_name = 'nose-print-match'
            AND created_at >= NOW() - INTERVAL '24 hours'
            AND execution_time_ms > 5000
        )
      ),
      '11.1: pgvector performance con 100k+ embeddings'::TEXT,
      NOW();
  END IF;

  -- ── 6. B2B API error rate (motor #1 Pharma) ─────────────────────────
  -- Si b2b-api edge fn tiene >5% error rate en 24h → riesgo alto:
  -- partner externo recibe 5xx y baja confianza en el producto.
  SELECT
    COUNT(*) FILTER (WHERE status = 'error'),
    COUNT(*)
  INTO v_b2b_api_5xx_24h, v_b2b_api_total_24h
  FROM public.system_health_log
  WHERE function_name = 'b2b-api'
    AND created_at >= NOW() - INTERVAL '24 hours';

  IF v_b2b_api_total_24h >= 50 THEN
    v_b2b_api_error_rate := (v_b2b_api_5xx_24h::NUMERIC / v_b2b_api_total_24h) * 100;
    IF v_b2b_api_error_rate > 5 THEN
      RETURN QUERY SELECT
        'b2b_api_error_rate'::TEXT,
        'B2B API errors a partners'::TEXT,
        CASE WHEN v_b2b_api_error_rate > 15 THEN 'critical' ELSE 'warn' END::TEXT,
        ROUND(v_b2b_api_error_rate, 1),
        5::NUMERIC,
        FORMAT('Motor #1 Pharma: %s errors / %s calls en 24h = %s%%. Partners reciben 5xx.',
          v_b2b_api_5xx_24h, v_b2b_api_total_24h, ROUND(v_b2b_api_error_rate, 1)),
        '11.1: Errors criticos consola (revenue motors)'::TEXT,
        NOW();
    END IF;
  END IF;

  -- ── 7. Insurance leads dead channel (motor #2 Aseguradoras) ─────────
  -- Si hay partners activos pero 0 leads en >7d → canal muerto.
  -- Riesgo: el motor codigo esta listo pero el funnel UX no convierte.
  SELECT COUNT(*) INTO v_active_insurance_partners
  FROM public.insurance_partners
  WHERE is_active = true;

  SELECT COUNT(*) INTO v_insurance_leads_7d
  FROM public.insurance_leads
  WHERE created_at >= NOW() - INTERVAL '7 days';

  IF v_active_insurance_partners >= 1 AND v_insurance_leads_7d = 0 THEN
    RETURN QUERY SELECT
      'insurance_leads_dead_channel'::TEXT,
      'Aseguradoras sin leads (>7d)'::TEXT,
      'warn'::TEXT,
      0::NUMERIC,
      1::NUMERIC,
      FORMAT('Motor #2 Aseguradoras: %s partner(s) activo(s) pero 0 leads en 7d. Revisar funnel UX en /cotizar-seguro.',
        v_active_insurance_partners),
      '11.5: Bajo conversion seguros embebidos'::TEXT,
      NOW();
  END IF;

  -- ── 8. Retail conversion drop (motor #3 Retail) ─────────────────────
  -- Si hay >100 clicks en 30d pero <2% conversion rate → funnel roto
  -- (clicks pero las compras no se atribuyen, problema en partner side
  -- o en tracking).
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE converted_at IS NOT NULL)
  INTO v_retail_clicks_30d, v_retail_conversions_30d
  FROM public.retail_clicks
  WHERE created_at >= NOW() - INTERVAL '30 days';

  IF v_retail_clicks_30d >= 100 THEN
    v_retail_conversion_rate := (v_retail_conversions_30d::NUMERIC / v_retail_clicks_30d) * 100;
    IF v_retail_conversion_rate < 2 THEN
      RETURN QUERY SELECT
        'retail_conversion_drop'::TEXT,
        'Retail clicks sin conversion'::TEXT,
        CASE WHEN v_retail_conversion_rate < 0.5 THEN 'critical' ELSE 'warn' END::TEXT,
        ROUND(v_retail_conversion_rate, 2),
        2::NUMERIC,
        FORMAT('Motor #3 Retail: %s clicks / %s conversions = %s%% en 30d. Verificar postback partner.',
          v_retail_clicks_30d, v_retail_conversions_30d, ROUND(v_retail_conversion_rate, 2)),
        '11.5: Funnel partner roto'::TEXT,
        NOW();
    END IF;
  END IF;

  -- ── 9. B2B outreach silence (no estamos usando outreach automation) ─
  -- Si en 14d no hubo NINGUN envio desde admin via send-b2b-outreach,
  -- significa que el cuello de botella comercial sigue sin moverse.
  -- Solo aplica si la tabla b2b_outreach_log existe (mig 20260919).
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'b2b_outreach_log'
  ) THEN
    EXECUTE 'SELECT COUNT(*) FROM public.b2b_outreach_log WHERE sent_at >= NOW() - INTERVAL ''14 days'''
      INTO v_outreach_14d;

    IF v_outreach_14d = 0 THEN
      RETURN QUERY SELECT
        'b2b_outreach_silence'::TEXT,
        'Outreach B2B silencioso (>14d)'::TEXT,
        'warn'::TEXT,
        0::NUMERIC,
        1::NUMERIC,
        'Admin > Comercial > Outreach B2B sin uso en 14d. El cuello de botella comercial no se esta moviendo.'::TEXT,
        '11.5: Activacion comercial estancada'::TEXT,
        NOW();
    END IF;
  END IF;

  RETURN;
END $$;

REVOKE ALL ON FUNCTION public.compute_risk_signals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_risk_signals() TO authenticated;

COMMENT ON FUNCTION public.compute_risk_signals() IS
  'Refactor Maestro §11 + B2B motores 2026-04-30. Retorna 0+ signals (5 originales + 4 nuevas para B2B). UI admin muestra banner si severity=critical.';

COMMIT;

DO $$
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'compute_risk_signals';
  IF NOT FOUND THEN RAISE EXCEPTION 'compute_risk_signals no actualizada'; END IF;
  RAISE NOTICE 'Smoke test OK: risk monitor extendido con 4 B2B signals';
END $$;
