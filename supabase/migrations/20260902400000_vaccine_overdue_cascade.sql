-- ══════════════════════════════════════════════════════════════════════════
-- Cascada vaccine_overdue (Refactor Maestro §2.8.3)
-- ══════════════════════════════════════════════════════════════════════════
-- Segundo tipo de cascada en pet_health_alerts (mig 20260902200000 hizo el
-- primero: weight_loss_30d).
--
-- Una RPC SQL puede hacer todo el trabajo: scan medical_records con
-- record_type='vacuna' y next_date < hoy, JOIN con pets, INSERT alerta
-- si no existe ya una abierta para ese pet+tipo.
--
-- No requiere edge fn (no hay external API). Pedro la programa con pg_cron:
--
--   SELECT cron.schedule(
--     'detect-vaccine-overdue-daily',
--     '0 14 * * *',  -- 10am Chile
--     $$ SELECT public.detect_vaccine_overdue_alerts(); $$
--   );
--
-- Severity por dias vencida:
--   1-30d  → low      ('vacuna vencida hace pocas semanas')
--   31-90d → medium   ('vencida hace meses, agendar pronto')
--   90d+   → high     ('vencida hace mucho — riesgo real de enfermedad')
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.detect_vaccine_overdue_alerts()
RETURNS TABLE (
  alerts_created INT,
  pets_scanned INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created INT := 0;
  v_scanned INT := 0;
BEGIN
  -- Scan medical_records con vacuna vencida
  WITH overdue_vaccines AS (
    SELECT
      mr.pet_id,
      mr.title,
      mr.next_date,
      (CURRENT_DATE - mr.next_date) AS days_overdue,
      p.owner_id,
      p.name AS pet_name
    FROM public.medical_records mr
    JOIN public.pets p ON p.id = mr.pet_id
    WHERE mr.record_type = 'vacuna'
      AND mr.next_date IS NOT NULL
      AND mr.next_date < CURRENT_DATE
      AND p.owner_id IS NOT NULL
      AND p.lifecycle_status = 'active'
      -- Solo el record mas reciente por (pet, vaccine title) — el dueño quiza
      -- ya re-vacuno y registro otro record posterior. En ese caso no alertar.
      AND mr.id = (
        SELECT mr2.id FROM public.medical_records mr2
        WHERE mr2.pet_id = mr.pet_id
          AND mr2.record_type = 'vacuna'
          AND mr2.title = mr.title
        ORDER BY mr2.date DESC
        LIMIT 1
      )
  ),
  inserted AS (
    INSERT INTO public.pet_health_alerts (
      pet_id, owner_id, alert_type, severity, message, metadata
    )
    SELECT
      v.pet_id,
      v.owner_id,
      'vaccine_overdue',
      CASE
        WHEN v.days_overdue >= 90 THEN 'high'
        WHEN v.days_overdue >= 31 THEN 'medium'
        ELSE 'low'
      END,
      FORMAT(
        '%s tiene la vacuna "%s" vencida hace %s dias. Agenda con tu vet.',
        v.pet_name,
        v.title,
        v.days_overdue
      ),
      jsonb_build_object(
        'vaccine_title', v.title,
        'next_date', v.next_date,
        'days_overdue', v.days_overdue
      )
    FROM overdue_vaccines v
    ON CONFLICT (pet_id, alert_type) WHERE dismissed_at IS NULL DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO v_created FROM inserted;

  -- Pets escaneados (para metric)
  SELECT COUNT(DISTINCT pet_id)::INT INTO v_scanned
  FROM public.medical_records
  WHERE record_type = 'vacuna' AND next_date < CURRENT_DATE;

  RETURN QUERY SELECT v_created, v_scanned;
END $$;

REVOKE ALL ON FUNCTION public.detect_vaccine_overdue_alerts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.detect_vaccine_overdue_alerts() TO service_role;

COMMENT ON FUNCTION public.detect_vaccine_overdue_alerts() IS
  'Cascada §2.8.3: crea alertas en pet_health_alerts para vacunas vencidas. '
  'Ejecutar diaria via pg_cron. Idempotente (ON CONFLICT). Solo alerta vacunas '
  'cuyo record mas reciente por titulo tiene next_date pasado — si el dueño '
  'ya re-vacuno y registro despues, no alertar.';

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Smoke test
-- ══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'detect_vaccine_overdue_alerts';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'detect_vaccine_overdue_alerts no creada';
  END IF;
  RAISE NOTICE 'Smoke test OK: vaccine_overdue cascade';
END $$;
