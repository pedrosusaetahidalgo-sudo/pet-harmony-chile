-- ==========================================================================
-- RPC: racha de cuidado del usuario (gamificación light)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d engagement):
-- Calcula cuántos días consecutivos el usuario completó al menos 1
-- acción de cuidado (reminder completado, routine completado, booking
-- confirmado). Se usa en card Home "Racha de cuidado" con mensaje
-- motivacional.
--
-- Output:
--   - current_streak_days: racha actual (0 si hoy no hay acción).
--   - longest_streak_days: mejor racha histórica.
--   - last_active_date: último día con actividad registrada.
--   - actions_last_7d: cantidad de actividades últimos 7 días.
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
STABLE
AS $$
DECLARE
  v_user_id UUID;
  v_current INTEGER := 0;
  v_longest INTEGER := 0;
  v_last_date DATE;
  v_actions_7d INTEGER := 0;
  v_check_date DATE;
  v_has_action BOOLEAN;
BEGIN
  -- Default: usuario actual autenticado
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN RETURN; END IF;

  -- Solo permitir consultar la propia racha (seguridad)
  IF v_user_id != auth.uid() AND NOT public.is_active_admin(auth.uid()) THEN
    RETURN;
  END IF;

  -- Unificar actividades: completions de reminders + routines + bookings asistidos
  CREATE TEMP TABLE IF NOT EXISTS _care_actions (action_date DATE) ON COMMIT DROP;
  DELETE FROM _care_actions;

  -- pet_reminders completados
  INSERT INTO _care_actions (action_date)
  SELECT DATE(COALESCE(completed_at, updated_at))
  FROM public.pet_reminders
  WHERE owner_id = v_user_id
    AND (is_completed = TRUE OR completed_at IS NOT NULL);

  -- routine_completions (si la tabla existe)
  BEGIN
    INSERT INTO _care_actions (action_date)
    SELECT DATE(completed_date)
    FROM public.routine_completions rc
    JOIN public.pet_routines pr ON pr.id = rc.routine_id
    JOIN public.pets p ON p.id = pr.pet_id
    WHERE p.owner_id = v_user_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- bookings completados (asistió)
  BEGIN
    INSERT INTO _care_actions (action_date)
    SELECT DATE(scheduled_date)
    FROM public.vet_bookings
    WHERE owner_id = v_user_id
      AND status IN ('completado', 'en_curso')
      AND scheduled_date <= NOW();
  EXCEPTION WHEN undefined_column THEN NULL;
  WHEN undefined_table THEN NULL;
  END;

  -- Si no hay acciones, retornar ceros
  IF NOT EXISTS (SELECT 1 FROM _care_actions) THEN
    RETURN QUERY SELECT 0, 0, NULL::DATE, 0;
    RETURN;
  END IF;

  -- Actividades últimos 7 días
  SELECT COUNT(DISTINCT action_date)::INTEGER
  INTO v_actions_7d
  FROM _care_actions
  WHERE action_date >= CURRENT_DATE - INTERVAL '6 days';

  -- Último día con actividad
  SELECT MAX(action_date) INTO v_last_date FROM _care_actions;

  -- Racha actual: contamos hacia atrás desde hoy (o last_date si fue ayer)
  IF v_last_date >= CURRENT_DATE - INTERVAL '1 day' THEN
    v_check_date := CURRENT_DATE;
    LOOP
      SELECT EXISTS (
        SELECT 1 FROM _care_actions WHERE action_date = v_check_date
      ) INTO v_has_action;

      IF v_has_action THEN
        v_current := v_current + 1;
        v_check_date := v_check_date - INTERVAL '1 day';
      ELSE
        -- Si es hoy y no hay acción todavía, no rompe racha (el día está vivo)
        IF v_check_date = CURRENT_DATE AND v_current = 0 THEN
          v_check_date := v_check_date - INTERVAL '1 day';
        ELSE
          EXIT;
        END IF;
      END IF;
      -- safety: no iterar más de 365 días
      IF v_current > 365 THEN EXIT; END IF;
    END LOOP;
  END IF;

  -- Racha histórica más larga (aproximación simple)
  WITH dates AS (
    SELECT DISTINCT action_date FROM _care_actions ORDER BY action_date
  ),
  groups AS (
    SELECT
      action_date,
      action_date - (ROW_NUMBER() OVER (ORDER BY action_date))::INTEGER * INTERVAL '1 day' AS grp
    FROM dates
  ),
  streaks AS (
    SELECT COUNT(*)::INTEGER AS len FROM groups GROUP BY grp
  )
  SELECT COALESCE(MAX(len), 0) INTO v_longest FROM streaks;

  -- Longest siempre >= current
  IF v_current > v_longest THEN v_longest := v_current; END IF;

  RETURN QUERY SELECT v_current, v_longest, v_last_date, v_actions_7d;
END;
$$;

COMMENT ON FUNCTION public.rpc_user_care_streak(UUID) IS
  'Racha de cuidado del usuario: días consecutivos con al menos 1 action (reminder/routine/booking completado). Para card Home Racha de cuidado.';

GRANT EXECUTE ON FUNCTION public.rpc_user_care_streak(UUID) TO authenticated;
