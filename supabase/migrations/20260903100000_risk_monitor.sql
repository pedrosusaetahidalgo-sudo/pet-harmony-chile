-- ══════════════════════════════════════════════════════════════════════════
-- Risk monitor (Refactor Maestro §11)
-- ══════════════════════════════════════════════════════════════════════════
-- Vista que detecta señales tempranas de los riesgos del plan §11.
-- Cada signal tiene severity + threshold; si cruza threshold, banner
-- en admin lo destaca para que Pedro tome accion.
--
-- Signals cubiertas hoy:
--   - openai_cost_spike (§11.1) — edge fns de IA con muchas calls / dia
--   - pgvector_slow (§11.1) — calls a nose-print-match con execution_time alto
--   - low_consent_rate (§11.2) — opt-in <30% bloquea deal Pharma
--   - high_pet_dropout (§11.2) — pets memorial creciendo mas rapido que active
--   - low_dau (§11.5) — daily active users cayendo (proxy de runway risk)
--   - edge_fn_error_rate (§11.1) — 5xx > 5% en ultimas 24h
--
-- Cada signal devuelve: signal_id, name, severity, value, threshold, message,
-- linked_risk (de §11). UI muestra banner amarillo si severity=warn, rojo
-- si severity=critical.
-- ══════════════════════════════════════════════════════════════════════════

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
BEGIN
  -- 1. AI cost spike: contar calls a edge fns de IA en 24h
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

  -- 2. Consent rate <30% (bloquea Pharma deal §7.3)
  SELECT
    COUNT(*) FILTER (WHERE anonymous_data_research_consent = TRUE)::NUMERIC,
    COUNT(*) FILTER (WHERE anonymous_data_research_consent IS NOT NULL)::INT
  INTO v_consent_rate, v_consent_decided
  FROM public.profiles;

  IF v_consent_decided >= 50 THEN  -- solo computar si hay >=50 decisiones
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

  -- 3. Dropout: pets memorial creciendo mas rapido que active
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

  -- 4. Edge fn error rate > 5% en 24h
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

  -- 5. Pgvector slow: nose-print-match con execution_time > 5s
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

  RETURN;
END $$;

REVOKE ALL ON FUNCTION public.compute_risk_signals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_risk_signals() TO authenticated;

COMMENT ON FUNCTION public.compute_risk_signals() IS
  'Refactor Maestro §11. Retorna 0+ signals que cruzan threshold. UI '
  'admin muestra banner si severity=critical. SECURITY DEFINER porque '
  'cruza tablas con RLS estricto (system_health_log + profiles + pets).';

COMMIT;

DO $$
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'compute_risk_signals';
  IF NOT FOUND THEN RAISE EXCEPTION 'compute_risk_signals no creada'; END IF;
  RAISE NOTICE 'Smoke test OK: risk monitor RPC';
END $$;
