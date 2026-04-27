-- ══════════════════════════════════════════════════════════════════════════
-- Cascadas no_activity_7d + birthday_window (Refactor Maestro §2.8.3)
-- ══════════════════════════════════════════════════════════════════════════
-- Cierra 2 tipos restantes en pet_health_alerts. Las otras 3 ya estaban:
--   - weight_loss_30d (trigger sync, mig 20260902200000)
--   - vaccine_overdue (RPC cron, mig 20260902400000)
--   - antiparasitic_overdue (no implementado todavia)
--
-- Ambas RPCs son idempotentes (ON CONFLICT) y se programan con pg_cron.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. detect_inactive_user_alerts ─────────────────────────────────────
-- Detecta usuarios sin login >= 7 dias que tienen >=1 mascota activa.
-- Crea alerta para la mascota mas reciente del user. Severity 'low'
-- (informativo, no medico). Email solo si severity escala a 'medium'+
-- (no aplica aqui — la cascada de inactividad no escala).
CREATE OR REPLACE FUNCTION public.detect_inactive_user_alerts()
RETURNS TABLE (
  alerts_created INT,
  users_scanned INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created INT := 0;
  v_scanned INT := 0;
BEGIN
  -- Encontrar users con last_sign_in_at >= 7 dias atras + >=1 pet activo
  WITH inactive_users AS (
    SELECT
      u.id AS user_id,
      EXTRACT(DAY FROM (NOW() - u.last_sign_in_at))::INT AS days_inactive,
      -- Mascota mas reciente del user (la que probablemente le importa mas)
      (
        SELECT id FROM public.pets
        WHERE owner_id = u.id AND lifecycle_status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      ) AS pet_id,
      (
        SELECT name FROM public.pets
        WHERE owner_id = u.id AND lifecycle_status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      ) AS pet_name
    FROM auth.users u
    WHERE u.last_sign_in_at IS NOT NULL
      AND u.last_sign_in_at < NOW() - INTERVAL '7 days'
      AND u.last_sign_in_at > NOW() - INTERVAL '30 days'  -- ignorar abandono total
      AND EXISTS (
        SELECT 1 FROM public.pets
        WHERE owner_id = u.id AND lifecycle_status = 'active'
      )
  ),
  inserted AS (
    INSERT INTO public.pet_health_alerts (
      pet_id, owner_id, alert_type, severity, message, metadata
    )
    SELECT
      iu.pet_id,
      iu.user_id,
      'no_activity_7d',
      'low',
      FORMAT(
        'Hace %s dias que no abris la app. %s te espera.',
        iu.days_inactive,
        iu.pet_name
      ),
      jsonb_build_object('days_inactive', iu.days_inactive)
    FROM inactive_users iu
    WHERE iu.pet_id IS NOT NULL
    ON CONFLICT (pet_id, alert_type) WHERE dismissed_at IS NULL DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO v_created FROM inserted;

  SELECT COUNT(*)::INT INTO v_scanned
  FROM auth.users u
  WHERE u.last_sign_in_at IS NOT NULL
    AND u.last_sign_in_at < NOW() - INTERVAL '7 days'
    AND u.last_sign_in_at > NOW() - INTERVAL '30 days';

  RETURN QUERY SELECT v_created, v_scanned;
END $$;

REVOKE ALL ON FUNCTION public.detect_inactive_user_alerts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.detect_inactive_user_alerts() TO service_role;

COMMENT ON FUNCTION public.detect_inactive_user_alerts() IS
  'Cascada §2.8.3 no_activity_7d: alerta in-app para users con last_sign_in_at '
  '>= 7 dias atras Y < 30 dias (despues de 30d se considera abandono y no '
  'molestamos). Idempotente. Cron diario.';

-- ── 2. detect_birthday_window_alerts ──────────────────────────────────
-- Detecta pets con birth_date dentro de ±7 dias del dia de hoy y crea
-- alerta `birthday_window`. Severity 'low' (festivo, no urgente). UI ya
-- tiene CTA "Ver cumple" hacia tab historia. El feature CASCADE_BIRTHDAY_AUTO
-- en HomePetFocusV2 sigue funcionando independiente — esto agrega
-- visibilidad cuando el dueño no abrio /home reciente.
CREATE OR REPLACE FUNCTION public.detect_birthday_window_alerts()
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
  WITH birthday_pets AS (
    SELECT
      p.id AS pet_id,
      p.owner_id,
      p.name AS pet_name,
      p.birth_date,
      -- Dias hasta el cumple este año (negativo si ya paso, positivo si viene)
      (
        DATE(
          MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INT,
                    EXTRACT(MONTH FROM p.birth_date)::INT,
                    EXTRACT(DAY FROM p.birth_date)::INT)
        ) - CURRENT_DATE
      ) AS days_until
    FROM public.pets p
    WHERE p.birth_date IS NOT NULL
      AND p.lifecycle_status = 'active'
      AND p.owner_id IS NOT NULL
      -- Cumpleaños en ventana ±7 dias
      AND ABS(
        DATE(
          MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INT,
                    EXTRACT(MONTH FROM p.birth_date)::INT,
                    EXTRACT(DAY FROM p.birth_date)::INT)
        ) - CURRENT_DATE
      ) <= 7
  ),
  inserted AS (
    INSERT INTO public.pet_health_alerts (
      pet_id, owner_id, alert_type, severity, message, metadata
    )
    SELECT
      bp.pet_id,
      bp.owner_id,
      'birthday_window',
      'low',
      CASE
        WHEN bp.days_until = 0 THEN
          FORMAT('Hoy %s cumple años! Compartir su cumple ✨', bp.pet_name)
        WHEN bp.days_until > 0 THEN
          FORMAT('%s cumple años en %s dias. Preparale algo lindo.',
            bp.pet_name, bp.days_until)
        ELSE
          FORMAT('%s cumplio hace %s dias. Saca una foto del momento.',
            bp.pet_name, ABS(bp.days_until))
      END,
      jsonb_build_object(
        'days_until', bp.days_until,
        'birth_date', bp.birth_date
      )
    FROM birthday_pets bp
    ON CONFLICT (pet_id, alert_type) WHERE dismissed_at IS NULL DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO v_created FROM inserted;

  SELECT COUNT(*)::INT INTO v_scanned
  FROM public.pets p
  WHERE p.birth_date IS NOT NULL
    AND p.lifecycle_status = 'active'
    AND p.owner_id IS NOT NULL
    AND ABS(
      DATE(
        MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INT,
                  EXTRACT(MONTH FROM p.birth_date)::INT,
                  EXTRACT(DAY FROM p.birth_date)::INT)
      ) - CURRENT_DATE
    ) <= 7;

  RETURN QUERY SELECT v_created, v_scanned;
END $$;

REVOKE ALL ON FUNCTION public.detect_birthday_window_alerts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.detect_birthday_window_alerts() TO service_role;

COMMENT ON FUNCTION public.detect_birthday_window_alerts() IS
  'Cascada §2.8.3 birthday_window: alerta in-app cuando el cumple del pet '
  'esta a ±7 dias. Idempotente. Cron diario.';

COMMIT;

-- Smoke test
DO $$
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'detect_inactive_user_alerts';
  IF NOT FOUND THEN RAISE EXCEPTION 'detect_inactive_user_alerts no creada'; END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'detect_birthday_window_alerts';
  IF NOT FOUND THEN RAISE EXCEPTION 'detect_birthday_window_alerts no creada'; END IF;

  RAISE NOTICE 'Smoke test OK: inactivity + birthday cascadas';
END $$;
