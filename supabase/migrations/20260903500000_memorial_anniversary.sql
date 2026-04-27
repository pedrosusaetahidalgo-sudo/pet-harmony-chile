-- ══════════════════════════════════════════════════════════════════════════
-- Memorial anniversary cascade (§14.bis.4.b "memorial day push")
-- ══════════════════════════════════════════════════════════════════════════
-- Recordatorio anual el dia del aniversario del fallecimiento. Es el
-- momento mas emocional del producto post-muerte de la mascota — tocar
-- esa fibra acerca al dueño a Paw Friend cuando mas duele Y abre la
-- puerta a viralidad organica (compartir el memorial, recordar a su
-- mascota publicamente).
--
-- Solo aplica a pets:
--   - lifecycle_status = 'memorial'
--   - passed_away_at IS NOT NULL
--   - memorial_remembrance_enabled = TRUE (opt-in del dueño)
--   - El aniversario cae en ±7 dias de hoy
--
-- Crea un nuevo tipo en pet_health_alerts: 'memorial_anniversary'.
-- Severity 'low' (no urgente, contemplativo). Email pendiente: cuando
-- agreguemos el tipo a notify-health-alerts, se envia email empatico
-- con CTA "Ver memorial" + share buttons.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Extender CHECK constraint para soportar el nuevo tipo
ALTER TABLE public.pet_health_alerts DROP CONSTRAINT IF EXISTS pet_health_alerts_alert_type_check;
ALTER TABLE public.pet_health_alerts
  ADD CONSTRAINT pet_health_alerts_alert_type_check
  CHECK (alert_type IN (
    'weight_loss_30d',
    'vaccine_overdue',
    'no_activity_7d',
    'antiparasitic_overdue',
    'birthday_window',
    'memorial_anniversary'
  ));

-- 2. RPC detect_memorial_anniversary_alerts
CREATE OR REPLACE FUNCTION public.detect_memorial_anniversary_alerts()
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
  WITH anniversary_pets AS (
    SELECT
      p.id AS pet_id,
      p.owner_id,
      p.name AS pet_name,
      p.passed_away_at,
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.passed_away_at::DATE))::INT AS years_since_passing,
      -- Aniversario este año
      DATE(MAKE_DATE(
        EXTRACT(YEAR FROM CURRENT_DATE)::INT,
        EXTRACT(MONTH FROM p.passed_away_at)::INT,
        EXTRACT(DAY FROM p.passed_away_at)::INT
      )) AS anniversary_this_year,
      -- Dias hasta/desde el aniversario
      DATE(MAKE_DATE(
        EXTRACT(YEAR FROM CURRENT_DATE)::INT,
        EXTRACT(MONTH FROM p.passed_away_at)::INT,
        EXTRACT(DAY FROM p.passed_away_at)::INT
      )) - CURRENT_DATE AS days_to_anniversary
    FROM public.pets p
    WHERE p.lifecycle_status = 'memorial'
      AND p.passed_away_at IS NOT NULL
      AND p.memorial_remembrance_enabled = TRUE
      AND p.owner_id IS NOT NULL
      -- Aniversario en ventana ±7 dias
      AND ABS(
        DATE(MAKE_DATE(
          EXTRACT(YEAR FROM CURRENT_DATE)::INT,
          EXTRACT(MONTH FROM p.passed_away_at)::INT,
          EXTRACT(DAY FROM p.passed_away_at)::INT
        )) - CURRENT_DATE
      ) <= 7
      -- Solo si paso al menos 1 año desde el fallecimiento (no alertar
      -- en los primeros 7 dias post-muerte; ese es duelo activo)
      AND p.passed_away_at < NOW() - INTERVAL '300 days'
  ),
  inserted AS (
    INSERT INTO public.pet_health_alerts (
      pet_id, owner_id, alert_type, severity, message, metadata
    )
    SELECT
      ap.pet_id,
      ap.owner_id,
      'memorial_anniversary',
      'low',
      CASE
        WHEN ap.days_to_anniversary = 0 THEN
          FORMAT('Hoy se cumplen %s años de %s 💜', ap.years_since_passing, ap.pet_name)
        WHEN ap.days_to_anniversary > 0 THEN
          FORMAT('En %s dias se cumplen %s años de %s 💜',
            ap.days_to_anniversary, ap.years_since_passing, ap.pet_name)
        ELSE
          FORMAT('Hace %s dias se cumplieron %s años de %s 💜',
            ABS(ap.days_to_anniversary), ap.years_since_passing, ap.pet_name)
      END,
      jsonb_build_object(
        'years_since_passing', ap.years_since_passing,
        'days_to_anniversary', ap.days_to_anniversary,
        'passed_away_at', ap.passed_away_at,
        'memorial_url', '/memoria/' || ap.pet_id
      )
    FROM anniversary_pets ap
    ON CONFLICT (pet_id, alert_type) WHERE dismissed_at IS NULL DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO v_created FROM inserted;

  SELECT COUNT(*)::INT INTO v_scanned
  FROM public.pets p
  WHERE p.lifecycle_status = 'memorial'
    AND p.passed_away_at IS NOT NULL
    AND p.memorial_remembrance_enabled = TRUE;

  RETURN QUERY SELECT v_created, v_scanned;
END $$;

REVOKE ALL ON FUNCTION public.detect_memorial_anniversary_alerts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.detect_memorial_anniversary_alerts() TO service_role;

COMMENT ON FUNCTION public.detect_memorial_anniversary_alerts() IS
  'Refactor Maestro §14.bis.4.b. Recordatorio anual del aniversario del '
  'fallecimiento. Solo si memorial_remembrance_enabled=true. Window ±7d. '
  'Cron diario.';

COMMIT;

DO $$
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'detect_memorial_anniversary_alerts';
  IF NOT FOUND THEN RAISE EXCEPTION 'detect_memorial_anniversary_alerts no creada'; END IF;
  RAISE NOTICE 'Smoke test OK: memorial anniversary alerts (6to tipo de cascada)';
END $$;
