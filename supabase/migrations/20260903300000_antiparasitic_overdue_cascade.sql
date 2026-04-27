-- ══════════════════════════════════════════════════════════════════════════
-- Cascada antiparasitic_overdue (Refactor Maestro §2.8.3)
-- ══════════════════════════════════════════════════════════════════════════
-- 5to y ultimo tipo de cascada en pet_health_alerts. Completa la matriz:
--   - weight_loss_30d (trigger sync, mig 20260902200000)
--   - vaccine_overdue (RPC cron, mig 20260902400000)
--   - no_activity_7d (RPC cron, mig 20260902600000)
--   - birthday_window (RPC cron, mig 20260902600000)
--   - antiparasitic_overdue (este, RPC cron)
--
-- Detecta record_type IN ('antiparasitario', 'desparasitacion', 'antipulgas')
-- con next_date < hoy. Misma logica que vaccine_overdue: solo el record mas
-- reciente por (pet, title) — si ya re-aplicaron, no spamear.
--
-- Severity por dias vencido:
--   1-30d  → low
--   31-60d → medium  (parasitos pueden establecerse)
--   60d+   → high    (riesgo real, dispara email §2.8.3)
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.detect_antiparasitic_overdue_alerts()
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
  WITH overdue_records AS (
    SELECT
      mr.pet_id,
      mr.title,
      mr.next_date,
      (CURRENT_DATE - mr.next_date) AS days_overdue,
      p.owner_id,
      p.name AS pet_name
    FROM public.medical_records mr
    JOIN public.pets p ON p.id = mr.pet_id
    WHERE mr.record_type IN ('antiparasitario', 'desparasitacion', 'antipulgas')
      AND mr.next_date IS NOT NULL
      AND mr.next_date < CURRENT_DATE
      AND p.owner_id IS NOT NULL
      AND p.lifecycle_status = 'active'
      -- Solo el record mas reciente por (pet, title) — si ya re-aplicaron,
      -- no alertar.
      AND mr.id = (
        SELECT mr2.id FROM public.medical_records mr2
        WHERE mr2.pet_id = mr.pet_id
          AND mr2.record_type = mr.record_type
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
      'antiparasitic_overdue',
      CASE
        WHEN v.days_overdue >= 60 THEN 'high'
        WHEN v.days_overdue >= 31 THEN 'medium'
        ELSE 'low'
      END,
      FORMAT(
        '%s tiene "%s" vencido hace %s dias. Aplicale antiparasitario pronto.',
        v.pet_name,
        v.title,
        v.days_overdue
      ),
      jsonb_build_object(
        'product_title', v.title,
        'next_date', v.next_date,
        'days_overdue', v.days_overdue
      )
    FROM overdue_records v
    ON CONFLICT (pet_id, alert_type) WHERE dismissed_at IS NULL DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO v_created FROM inserted;

  SELECT COUNT(DISTINCT pet_id)::INT INTO v_scanned
  FROM public.medical_records
  WHERE record_type IN ('antiparasitario', 'desparasitacion', 'antipulgas')
    AND next_date < CURRENT_DATE;

  RETURN QUERY SELECT v_created, v_scanned;
END $$;

REVOKE ALL ON FUNCTION public.detect_antiparasitic_overdue_alerts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.detect_antiparasitic_overdue_alerts() TO service_role;

COMMENT ON FUNCTION public.detect_antiparasitic_overdue_alerts() IS
  'Cascada §2.8.3 antiparasitic_overdue: 5to tipo de pet_health_alerts. '
  'Cierra el set de cascadas. Cron diario.';

COMMIT;

DO $$
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'detect_antiparasitic_overdue_alerts';
  IF NOT FOUND THEN RAISE EXCEPTION 'detect_antiparasitic_overdue_alerts no creada'; END IF;
  RAISE NOTICE 'Smoke test OK: antiparasitic_overdue cascade — set §2.8.3 completo';
END $$;
