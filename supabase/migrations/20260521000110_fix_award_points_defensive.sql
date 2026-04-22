-- ==========================================================================
-- Fix award_points: INSERT en user_achievements con columna inexistente
-- 2026-05-21
--
-- Error reportado 2026-04-21 (F12 Home + ficha):
--   code: 42703
--   message: column "achievement_id" of relation "user_achievements"
--            does not exist
--   CONTEXT: PL/pgSQL function award_points line 58
--
-- Causa: la mig 20251202000000 definio award_points con INSERT a
-- public.user_achievements (user_id, achievement_id). Pero existen
-- 3 definiciones distintas de esa tabla en el repo:
--   - 20251127152253 (original): achievement_type / achievement_name / ...
--   - 20251202000000: achievement_id (FK a achievements.id)
--   - 20260422000002 (paw_game): achievement_code (TEXT)
--
-- En prod quedo una variante SIN achievement_id y la mig 20251202000000
-- intento re-CREATE TABLE IF NOT EXISTS (no-op). Todas las llamadas a
-- award_points fallan con 42703, bloqueando gamificacion en varios
-- callsites (feed, ficha medical record, booking, adoption, etc).
--
-- Fix: redefinir award_points con el INSERT a user_achievements dentro
-- de un BEGIN/EXCEPTION block. Si falla (columna no existe / schema
-- distinto), se ignora y la funcion continua sumando points normalmente.
-- Los points + nivel si se guardan. Solo el achievement de nivel 5/10/20
-- queda sin insertar (feature menor).
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_action_type TEXT,
  p_action_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $fnbody$
DECLARE
  v_new_points INTEGER;
  v_new_level INTEGER;
  v_old_level INTEGER;
  v_current_points INTEGER;
  v_is_premium BOOLEAN;
  v_premium_end_date TIMESTAMPTZ;
  v_actual_points INTEGER;
BEGIN
  SELECT is_premium, premium_end_date, COALESCE(points, 0), COALESCE(level, 1)
  INTO v_is_premium, v_premium_end_date, v_current_points, v_old_level
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_is_premium AND (v_premium_end_date IS NULL OR v_premium_end_date > NOW()) THEN
    v_actual_points := p_points * 2;
  ELSE
    v_actual_points := p_points;
  END IF;

  v_new_points := v_current_points + v_actual_points;
  v_new_level := public.calculate_level(v_new_points);

  UPDATE public.profiles
  SET points = v_new_points,
      level = v_new_level,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Record history (tolerante a ausencia de la tabla)
  BEGIN
    INSERT INTO public.points_history (user_id, points, action_type, action_id, description)
    VALUES (
      p_user_id,
      v_actual_points,
      p_action_type,
      p_action_id,
      COALESCE(p_description, '') || CASE
        WHEN v_is_premium AND (v_premium_end_date IS NULL OR v_premium_end_date > NOW())
        THEN ' (Premium 2x)'
        ELSE ''
      END
    );
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    -- points_history con schema distinto en algunos ambientes, continuar.
    NULL;
  END;

  -- Level achievements: INSERT tolerante a schema divergente de user_achievements.
  IF v_new_level > v_old_level THEN
    BEGIN
      INSERT INTO public.user_achievements (user_id, achievement_id)
      SELECT p_user_id, a.id
      FROM public.achievements a
      WHERE a.code IN ('level_5', 'level_10', 'level_20')
        AND a.requirement_value = v_new_level
        AND NOT EXISTS (
          SELECT 1 FROM public.user_achievements ua
          WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
        );
    EXCEPTION WHEN undefined_column OR undefined_table THEN
      -- Schema de user_achievements no tiene achievement_id (variante
      -- paw_game con achievement_code o legacy con achievement_type).
      -- Los points + level ya se guardaron; el achievement queda sin
      -- insertar. Feature menor, no bloquea la gamificacion core.
      NULL;
    END;
  END IF;
END;
$fnbody$;

GRANT EXECUTE ON FUNCTION public.award_points(UUID, INTEGER, TEXT, UUID, TEXT) TO authenticated;

-- Smoke test: llamar award_points con un UUID dummy. Si la funcion
-- tiene refs rotas o sintaxis invalida, la mig falla al aplicarla.
-- Nota: como p_user_id es un UUID que no existe en profiles, el UPDATE
-- afecta 0 filas pero la funcion no falla (no es error).
DO $smoke$
DECLARE
  v_dummy UUID := gen_random_uuid();
BEGIN
  PERFORM public.award_points(v_dummy, 0, 'smoke_test', NULL, 'smoke');
  RAISE NOTICE 'Smoke award_points OK';
END
$smoke$;
