-- ==========================================================================
-- Trigger: sincroniza profiles.level automaticamente con profiles.points.
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-17):
-- El level se calculaba en frontend (useGamification hook) con la formula:
--   level = floor(sqrt(points / 100)) + 1
-- Eso es fragil: si el usuario gana puntos pero no visita la app (o el
-- hook no corre por algun bug), level queda desactualizado.
--
-- Fix escalable: trigger SQL que recalcula level en cada UPDATE de points.
-- La formula vive en DB; ningun cliente puede "olvidar" ejecutarla.
--
-- Al aplicar esta migracion, todos los profiles existentes quedan con
-- level correcto (via UPDATE inicial).
-- ==========================================================================

-- Funcion helper: calcula level desde points usando la misma formula
-- que src/lib/gamification.ts -> calculateLevel()
CREATE OR REPLACE FUNCTION public.calc_level_from_points(p_points INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT floor(sqrt(GREATEST(COALESCE(p_points, 0), 0) / 100.0))::int + 1;
$$;

COMMENT ON FUNCTION public.calc_level_from_points IS
  'Formula espejo de src/lib/gamification.ts calculateLevel(). Mantener sincronizada.';

-- Trigger: en cada INSERT/UPDATE de profiles, alinea level con points.
-- BEFORE para que el UPDATE escriba el level nuevo sin requerir segunda query.
CREATE OR REPLACE FUNCTION public.sync_profile_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.level := public.calc_level_from_points(NEW.points);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_level ON public.profiles;
CREATE TRIGGER trg_sync_profile_level
BEFORE INSERT OR UPDATE OF points ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_level();

-- Realineacion inicial: todos los profiles existentes quedan con level
-- coherente con sus points actuales (el trigger se dispara via UPDATE).
UPDATE public.profiles
SET points = points  -- no-op para disparar trigger
WHERE level IS DISTINCT FROM public.calc_level_from_points(points);
