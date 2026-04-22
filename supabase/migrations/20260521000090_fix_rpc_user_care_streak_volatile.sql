-- ==========================================================================
-- Fix rpc_user_care_streak: STABLE no permite CREATE TEMP TABLE
-- 2026-05-21
--
-- Error original reportado 2026-04-21:
--   ERROR 0A000: CREATE TABLE is not allowed in a non-volatile function
--   CONTEXT: PL/pgSQL function rpc_user_care_streak uuid line 21
--
-- Causa: mig 20260708000000 marco la funcion STABLE pero el cuerpo
-- hace CREATE TEMP TABLE. Postgres prohibe DDL en funciones STABLE.
--
-- Fix: redefinir la funcion sin TEMP TABLE. Usamos CTE con UNION. Marcada
-- VOLATILE por seguridad aunque no modifica estado persistente.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.rpc_user_care_streak(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  current_streak_days INTEGER,
  longest_streak_days INTEGER,
  last_active_date DATE,
  actions_last_7d INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
VOLATILE
AS $fnbody$
DECLARE
  v_user_id UUID;
  v_current INTEGER := 0;
  v_longest INTEGER := 0;
  v_last_date DATE;
  v_actions_7d INTEGER := 0;
  v_check_date DATE;
  v_has_action BOOLEAN;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN RETURN; END IF;

  -- Solo permitir consultar la propia racha (seguridad)
  IF v_user_id != auth.uid() AND NOT public.is_active_admin(auth.uid()) THEN
    RETURN;
  END IF;

  -- Unificar acciones con CTE en vez de TEMP TABLE.
  WITH reminders_actions AS (
    SELECT DISTINCT DATE(COALESCE(completed_at, updated_at)) AS action_date
    FROM public.pet_reminders
    WHERE owner_id = v_user_id
      AND (is_completed = TRUE OR completed_at IS NOT NULL)
  ),
  routine_actions AS (
    SELECT DISTINCT DATE(rc.completed_date) AS action_date
    FROM public.routine_completions rc
    JOIN public.pet_routines pr ON pr.id = rc.routine_id
    JOIN public.pets p ON p.id = pr.pet_id
    WHERE p.owner_id = v_user_id
  ),
  booking_actions AS (
    SELECT DISTINCT DATE(scheduled_date) AS action_date
    FROM public.vet_bookings
    WHERE owner_id = v_user_id
      AND status IN ('completado', 'en_curso')
      AND scheduled_date <= NOW()
  ),
  all_actions AS (
    SELECT action_date FROM reminders_actions
    UNION
    SELECT action_date FROM routine_actions
    UNION
    SELECT action_date FROM booking_actions
  )
  SELECT
    COUNT(DISTINCT action_date) FILTER (
      WHERE action_date >= CURRENT_DATE - INTERVAL '6 days'
    )::INTEGER,
    MAX(action_date)
  INTO v_actions_7d, v_last_date
  FROM all_actions;

  IF v_last_date IS NULL THEN
    RETURN QUERY SELECT 0, 0, NULL::DATE, 0;
    RETURN;
  END IF;

  -- Racha actual hacia atras desde hoy
  IF v_last_date >= CURRENT_DATE - INTERVAL '1 day' THEN
    v_check_date := CURRENT_DATE;
    LOOP
      SELECT EXISTS (
        SELECT 1 FROM (
          SELECT DISTINCT DATE(COALESCE(completed_at, updated_at)) AS d
          FROM public.pet_reminders
          WHERE owner_id = v_user_id
            AND (is_completed = TRUE OR completed_at IS NOT NULL)
          UNION
          SELECT DISTINCT DATE(rc.completed_date) AS d
          FROM public.routine_completions rc
          JOIN public.pet_routines pr ON pr.id = rc.routine_id
          JOIN public.pets p ON p.id = pr.pet_id
          WHERE p.owner_id = v_user_id
          UNION
          SELECT DISTINCT DATE(scheduled_date) AS d
          FROM public.vet_bookings
          WHERE owner_id = v_user_id
            AND status IN ('completado', 'en_curso')
            AND scheduled_date <= NOW()
        ) u
        WHERE u.d = v_check_date
      ) INTO v_has_action;

      IF v_has_action THEN
        v_current := v_current + 1;
        v_check_date := v_check_date - INTERVAL '1 day';
      ELSE
        IF v_check_date = CURRENT_DATE AND v_current = 0 THEN
          v_check_date := v_check_date - INTERVAL '1 day';
        ELSE
          EXIT;
        END IF;
      END IF;

      IF v_current > 365 THEN EXIT; END IF;
    END LOOP;
  END IF;

  -- Racha historica mas larga
  WITH all_dates AS (
    SELECT DISTINCT DATE(COALESCE(completed_at, updated_at)) AS action_date
    FROM public.pet_reminders
    WHERE owner_id = v_user_id
      AND (is_completed = TRUE OR completed_at IS NOT NULL)
    UNION
    SELECT DISTINCT DATE(rc.completed_date)
    FROM public.routine_completions rc
    JOIN public.pet_routines pr ON pr.id = rc.routine_id
    JOIN public.pets p ON p.id = pr.pet_id
    WHERE p.owner_id = v_user_id
    UNION
    SELECT DISTINCT DATE(scheduled_date)
    FROM public.vet_bookings
    WHERE owner_id = v_user_id
      AND status IN ('completado', 'en_curso')
      AND scheduled_date <= NOW()
  ),
  ordered AS (
    SELECT
      action_date,
      action_date - (ROW_NUMBER() OVER (ORDER BY action_date))::INTEGER * INTERVAL '1 day' AS grp
    FROM all_dates
  ),
  streaks AS (
    SELECT COUNT(*)::INTEGER AS len FROM ordered GROUP BY grp
  )
  SELECT COALESCE(MAX(len), 0) INTO v_longest FROM streaks;

  IF v_current > v_longest THEN v_longest := v_current; END IF;

  RETURN QUERY SELECT v_current, v_longest, v_last_date, v_actions_7d;
END;
$fnbody$;

COMMENT ON FUNCTION public.rpc_user_care_streak(UUID) IS
  'Racha de cuidado por user. Fix 2026-05-21 STABLE a VOLATILE.';

GRANT EXECUTE ON FUNCTION public.rpc_user_care_streak(UUID) TO authenticated;

-- Smoke test inline (regla 9.2.1)
DO $smoke$
DECLARE
  v_current INTEGER;
  v_longest INTEGER;
  v_last DATE;
  v_7d INTEGER;
BEGIN
  SELECT current_streak_days, longest_streak_days, last_active_date, actions_last_7d
  INTO v_current, v_longest, v_last, v_7d
  FROM public.rpc_user_care_streak(gen_random_uuid());

  RAISE NOTICE 'Smoke rpc_user_care_streak OK: current=%, longest=%, last=%, 7d=%',
    v_current, v_longest, v_last, v_7d;
END
$smoke$;
