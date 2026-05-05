-- ═══════════════════════════════════════════════════════════════════════════
-- Walk Timer · pet_walks table + RPCs (2026-05-05)
--
-- Motor: dueno toca "Empezar paseo" en home → recordamos start_at + start_lat/lng
-- + sampling cada 10s al path. Toca "Terminar paseo" → cerramos con end_at +
-- distance_meters calculado y duration_seconds. Auto-stop si velocidad < 0.1 m/s
-- por 5min consecutivos (logica frontend; aqui solo guardamos).
--
-- Privacidad:
--  - RLS estricta: solo el owner ve sus walks.
--  - `path` JSONB es solo del owner (no se agrega ni se publica).
--  - Stats publicas via RPC con threshold >=50 paseos por comuna (futuro).
--
-- Eventos timeline: trigger inserta en pet_timeline_events al cerrar el walk
-- (category='activity', data con duracion + distancia). Asi el paseo aparece
-- en la historia del pet con todos los eventos del dueno.
--
-- Idempotente. Aplicar desde Supabase Dashboard > SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Tabla pet_walks
--    Idempotente: si la tabla ya existe parcial (intento previo abortado),
--    los ALTER TABLE ADD COLUMN IF NOT EXISTS agregan lo que falte.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pet_walks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar que TODAS las columnas existen (cubre tabla pre-existente parcial).
ALTER TABLE public.pet_walks ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
ALTER TABLE public.pet_walks ADD COLUMN IF NOT EXISTS duration_seconds INT;
ALTER TABLE public.pet_walks ADD COLUMN IF NOT EXISTS distance_meters NUMERIC(10, 2);
ALTER TABLE public.pet_walks ADD COLUMN IF NOT EXISTS start_lat NUMERIC(9, 6);
ALTER TABLE public.pet_walks ADD COLUMN IF NOT EXISTS start_lng NUMERIC(9, 6);
ALTER TABLE public.pet_walks ADD COLUMN IF NOT EXISTS end_lat NUMERIC(9, 6);
ALTER TABLE public.pet_walks ADD COLUMN IF NOT EXISTS end_lng NUMERIC(9, 6);
ALTER TABLE public.pet_walks ADD COLUMN IF NOT EXISTS path JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.pet_walks ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE public.pet_walks ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.pet_walks ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'in_progress';
ALTER TABLE public.pet_walks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- DEFAULTs idempotentes (cubre tabla pre-existente que pudo perder defaults).
ALTER TABLE public.pet_walks ALTER COLUMN started_at SET DEFAULT NOW();
ALTER TABLE public.pet_walks ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE public.pet_walks ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE public.pet_walks ALTER COLUMN path SET DEFAULT '[]'::jsonb;
ALTER TABLE public.pet_walks ALTER COLUMN source SET DEFAULT 'manual';
ALTER TABLE public.pet_walks ALTER COLUMN status SET DEFAULT 'in_progress';

-- NOT NULLs idempotentes (en caso que pre-existente tuviera columna nullable).
DO $$
BEGIN
  -- Backfill nulls antes de aplicar NOT NULL.
  UPDATE public.pet_walks SET started_at = COALESCE(started_at, NOW()) WHERE started_at IS NULL;
  UPDATE public.pet_walks SET created_at = COALESCE(created_at, NOW()) WHERE created_at IS NULL;
  UPDATE public.pet_walks SET updated_at = COALESCE(updated_at, NOW()) WHERE updated_at IS NULL;
  UPDATE public.pet_walks SET source = COALESCE(source, 'manual') WHERE source IS NULL;
  UPDATE public.pet_walks SET status = COALESCE(status, 'in_progress') WHERE status IS NULL;
END $$;

ALTER TABLE public.pet_walks ALTER COLUMN started_at SET NOT NULL;
ALTER TABLE public.pet_walks ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.pet_walks ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE public.pet_walks ALTER COLUMN source SET NOT NULL;
ALTER TABLE public.pet_walks ALTER COLUMN status SET NOT NULL;

-- CHECKs idempotentes (DROP + ADD para garantizar definicion correcta).
ALTER TABLE public.pet_walks DROP CONSTRAINT IF EXISTS pet_walks_source_check;
ALTER TABLE public.pet_walks ADD CONSTRAINT pet_walks_source_check
  CHECK (source IN ('manual', 'auto_detect', 'planned'));

ALTER TABLE public.pet_walks DROP CONSTRAINT IF EXISTS pet_walks_status_check;
ALTER TABLE public.pet_walks ADD CONSTRAINT pet_walks_status_check
  CHECK (status IN ('in_progress', 'completed', 'abandoned', 'cancelled'));

-- Indices para queries comunes
CREATE INDEX IF NOT EXISTS idx_pet_walks_pet_id_started
  ON public.pet_walks (pet_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_pet_walks_owner_id_started
  ON public.pet_walks (owner_id, started_at DESC);
-- Walks activos (in_progress) — partial index, muy chico siempre
CREATE INDEX IF NOT EXISTS idx_pet_walks_active
  ON public.pet_walks (owner_id, started_at DESC)
  WHERE status = 'in_progress';

COMMENT ON TABLE public.pet_walks IS
  'Paseos registrados por el dueno via WalkTimerCard. path es JSONB privado del owner. distance_meters calculada en frontend con haversine sobre samples GPS.';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. RLS
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pet_walks ENABLE ROW LEVEL SECURITY;

-- Owner ve solo sus propios walks
DROP POLICY IF EXISTS "pet_walks_owner_select" ON public.pet_walks;
CREATE POLICY "pet_walks_owner_select"
  ON public.pet_walks FOR SELECT
  USING (owner_id = auth.uid());

-- Owner inserta walks de sus propias mascotas
DROP POLICY IF EXISTS "pet_walks_owner_insert" ON public.pet_walks;
CREATE POLICY "pet_walks_owner_insert"
  ON public.pet_walks FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = pet_walks.pet_id
        AND pets.owner_id = auth.uid()
    )
  );

-- Owner actualiza sus propios walks (para cerrar/cancelar)
DROP POLICY IF EXISTS "pet_walks_owner_update" ON public.pet_walks;
CREATE POLICY "pet_walks_owner_update"
  ON public.pet_walks FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Owner puede borrar (ej: cancelar walk por error en el primer minuto)
DROP POLICY IF EXISTS "pet_walks_owner_delete" ON public.pet_walks;
CREATE POLICY "pet_walks_owner_delete"
  ON public.pet_walks FOR DELETE
  USING (owner_id = auth.uid());

-- Admin all (para soporte / metricas)
DROP POLICY IF EXISTS "pet_walks_admin_all" ON public.pet_walks;
CREATE POLICY "pet_walks_admin_all"
  ON public.pet_walks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_walks TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Trigger updated_at
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.pet_walks_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_pet_walks_updated_at ON public.pet_walks;
CREATE TRIGGER trigger_pet_walks_updated_at
  BEFORE UPDATE ON public.pet_walks
  FOR EACH ROW
  EXECUTE FUNCTION public.pet_walks_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Trigger: al cerrar walk (status='completed'), insertar event en timeline
--    para que aparezca en la historia del pet.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.pet_walks_to_timeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pet_name TEXT;
  v_duration_min INT;
  v_distance_km NUMERIC;
  v_title TEXT;
BEGIN
  -- Solo disparar al pasar a 'completed' (y no si ya estaba completed antes).
  IF NEW.status <> 'completed' THEN RETURN NEW; END IF;
  IF OLD.status = 'completed' THEN RETURN NEW; END IF;

  SELECT name INTO v_pet_name FROM public.pets WHERE id = NEW.pet_id;
  v_duration_min := COALESCE(NEW.duration_seconds, 0) / 60;
  v_distance_km := ROUND(COALESCE(NEW.distance_meters, 0) / 1000.0, 2);

  v_title := 'Paseo de ' || COALESCE(v_pet_name, 'la mascota')
    || ' · ' || v_duration_min || ' min'
    || CASE
         WHEN v_distance_km > 0 THEN ' · ' || v_distance_km || ' km'
         ELSE ''
       END;

  BEGIN
    -- source='manual' porque el dueno explicitamente activo el timer.
    -- El identificador del walk va en data->walk_id para queries.
    INSERT INTO public.pet_timeline_events (
      pet_id, category, title, description, event_at,
      is_user_reported, recorded_by, source, data
    ) VALUES (
      NEW.pet_id,
      'activity',
      v_title,
      NEW.note,
      NEW.ended_at,
      TRUE,
      NEW.owner_id,
      'manual',
      jsonb_build_object(
        'kind', 'walk_timer',
        'walk_id', NEW.id,
        'duration_seconds', NEW.duration_seconds,
        'distance_meters', NEW.distance_meters,
        'start_lat', NEW.start_lat,
        'start_lng', NEW.start_lng,
        'end_lat', NEW.end_lat,
        'end_lng', NEW.end_lng
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Blindado: si el INSERT falla (FK rota, CHECK desactualizado), no
    -- bloquea el cierre del walk. Pattern de mig 20260725000012.
    RAISE NOTICE 'pet_walks_to_timeline: skip evento timeline para walk % → %',
      NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_pet_walks_to_timeline ON public.pet_walks;
CREATE TRIGGER trigger_pet_walks_to_timeline
  AFTER UPDATE OF status ON public.pet_walks
  FOR EACH ROW
  EXECUTE FUNCTION public.pet_walks_to_timeline();

COMMENT ON FUNCTION public.pet_walks_to_timeline() IS
  'Al cerrar un walk (status=completed), crea evento activity en pet_timeline_events. Blindado con BEGIN/EXCEPTION para no bloquear el UPDATE del walk.';

-- ─────────────────────────────────────────────────────────────────────────
-- 5. RPC: stats agregadas del pet (para mostrar en home/ficha)
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_pet_walk_stats(p_pet_id UUID)
RETURNS TABLE (
  total_walks INT,
  total_duration_seconds BIGINT,
  total_distance_meters NUMERIC,
  walks_this_week INT,
  walks_this_month INT,
  last_walk_at TIMESTAMPTZ,
  avg_duration_seconds INT,
  avg_distance_meters NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Verificar que el caller es el owner (la RLS no aplica en SECURITY DEFINER)
  IF NOT EXISTS (
    SELECT 1 FROM public.pets
    WHERE id = p_pet_id
      AND owner_id = auth.uid()
  ) THEN
    -- Tambien admin
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = auth.uid() AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Pet not found or no permission';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::INT,
    COALESCE(SUM(duration_seconds), 0)::BIGINT,
    COALESCE(SUM(distance_meters), 0)::NUMERIC,
    COUNT(*) FILTER (WHERE started_at >= NOW() - INTERVAL '7 days')::INT,
    COUNT(*) FILTER (WHERE started_at >= NOW() - INTERVAL '30 days')::INT,
    MAX(started_at),
    COALESCE(AVG(duration_seconds), 0)::INT,
    COALESCE(AVG(distance_meters), 0)::NUMERIC
  FROM public.pet_walks
  WHERE pet_id = p_pet_id
    AND status = 'completed';
END $$;

REVOKE ALL ON FUNCTION public.get_pet_walk_stats(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pet_walk_stats(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_pet_walk_stats IS
  'Stats agregadas de paseos del pet. Verifica ownership o admin.';

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Smoke test inline §9.2.1 — si hay un pet+owner real, ejercita
--    insert + update completed + verifica trigger de timeline + delete.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_pet UUID;
  v_owner UUID;
  v_walk UUID;
  v_event_count INT;
BEGIN
  SELECT id, owner_id INTO v_pet, v_owner
    FROM public.pets
    WHERE owner_id IS NOT NULL
    LIMIT 1;

  IF v_pet IS NULL THEN
    RAISE NOTICE 'Smoke test pet_walks omitido: no hay pets con owner_id en la base.';
    RETURN;
  END IF;

  BEGIN
    -- Insert walk in_progress (started_at explicito para no depender del default).
    INSERT INTO public.pet_walks (pet_id, owner_id, status, started_at)
    VALUES (v_pet, v_owner, 'in_progress', NOW())
    RETURNING id INTO v_walk;

    -- Cerrar walk
    UPDATE public.pet_walks
      SET status = 'completed',
          ended_at = NOW(),
          duration_seconds = 1800,
          distance_meters = 2500.50
      WHERE id = v_walk;

    -- Verificar que el trigger creo evento timeline
    SELECT COUNT(*) INTO v_event_count
      FROM public.pet_timeline_events
      WHERE pet_id = v_pet
        AND data->>'kind' = 'walk_timer'
        AND (data->>'walk_id')::UUID = v_walk;

    -- Cleanup
    DELETE FROM public.pet_timeline_events
      WHERE data->>'kind' = 'walk_timer'
        AND (data->>'walk_id')::UUID = v_walk;
    DELETE FROM public.pet_walks WHERE id = v_walk;

    IF v_event_count = 0 THEN
      RAISE EXCEPTION 'Smoke test pet_walks FAILED: trigger to_timeline no creo evento';
    END IF;

    RAISE NOTICE 'Smoke test pet_walks: OK (insert + complete + timeline event + cleanup).';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Smoke test pet_walks FAILED: %', SQLERRM;
  END;
END $$;
