-- ══════════════════════════════════════════════════════════════════════════
-- Refugios: historia rescate + follow-up 30/90 dias post-adopcion
-- ══════════════════════════════════════════════════════════════════════════
-- Refactor Maestro Fase 1 §6.7.
--
-- Cambios:
--   1. pets.rescue_story TEXT — narrativa del rescate visible desde dia 0
--      en perfil publico de la mascota.
--   2. Tabla adoption_followups — registros de chequeo automatico al
--      adoptante 30 y 90 dias post-transferencia. Se llenan via trigger
--      cuando adoption_processes.status='transferred'. Un cron diario
--      manda email a los due (sent_at IS NULL AND due_at <= NOW()).
--   3. Trigger en adoption_processes que crea los 2 follow-ups al pasar
--      a 'transferred' (idempotente).
--
-- Sin estos: refugio carga una mascota sin contexto + adoptante recibe
-- email solo al transferir, nunca despues. Esto cierra el loop emocional.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Historia de rescate en pets (TEXT libre, narrativa)
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS rescue_story TEXT;

COMMENT ON COLUMN public.pets.rescue_story IS
  'Historia narrativa del rescate (ej: "Lo encontramos en Vitacura sin chip..."). Visible publicamente en /refugios/<slug> y en la ficha del adoptante post-transferencia.';

-- 2. Tabla adoption_followups
CREATE TABLE IF NOT EXISTS public.adoption_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adoption_process_id UUID NOT NULL
    REFERENCES public.adoption_processes(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  adopter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shelter_id UUID NOT NULL REFERENCES public.adoption_centers(id) ON DELETE CASCADE,

  kind TEXT NOT NULL CHECK (kind IN ('30d', '90d')),
  due_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  response_status TEXT CHECK (response_status IN ('great', 'good', 'concern', 'no_reply')),
  response_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (adoption_process_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_adoption_followups_due
  ON public.adoption_followups(due_at)
  WHERE sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_adoption_followups_adopter
  ON public.adoption_followups(adopter_user_id);

ALTER TABLE public.adoption_followups ENABLE ROW LEVEL SECURITY;

-- RLS: shelter ve los suyos, adopter ve los suyos
DROP POLICY IF EXISTS "Shelter ve sus followups" ON public.adoption_followups;
CREATE POLICY "Shelter ve sus followups"
  ON public.adoption_followups FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.adoption_centers
    WHERE id = shelter_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Adopter ve y responde sus followups" ON public.adoption_followups;
CREATE POLICY "Adopter ve y responde sus followups"
  ON public.adoption_followups FOR ALL
  TO authenticated
  USING (adopter_user_id = auth.uid())
  WITH CHECK (adopter_user_id = auth.uid());

-- 3. Trigger: al pasar a 'transferred', crear 2 followups (30d, 90d)
CREATE OR REPLACE FUNCTION public.create_adoption_followups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'transferred'
     AND (OLD.status IS NULL OR OLD.status != 'transferred')
  THEN
    -- Idempotente: ON CONFLICT DO NOTHING (UNIQUE adoption_process_id+kind)
    INSERT INTO public.adoption_followups (
      adoption_process_id, pet_id, adopter_user_id, shelter_id, kind, due_at
    ) VALUES
      (NEW.id, NEW.pet_id, NEW.adopter_user_id, NEW.shelter_id, '30d', NOW() + INTERVAL '30 days'),
      (NEW.id, NEW.pet_id, NEW.adopter_user_id, NEW.shelter_id, '90d', NOW() + INTERVAL '90 days')
    ON CONFLICT (adoption_process_id, kind) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_adoption_followups_create
  ON public.adoption_processes;
CREATE TRIGGER tg_adoption_followups_create
  AFTER UPDATE ON public.adoption_processes
  FOR EACH ROW EXECUTE FUNCTION public.create_adoption_followups();

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Smoke test (regla 9.2.1)
-- ══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_col_exists BOOLEAN;
  v_table_exists BOOLEAN;
  v_trigger_exists BOOLEAN;
BEGIN
  -- 1. Columna rescue_story en pets
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pets'
      AND column_name = 'rescue_story'
  ) INTO v_col_exists;
  IF NOT v_col_exists THEN
    RAISE EXCEPTION 'Columna pets.rescue_story no se agrego';
  END IF;

  -- 2. Tabla adoption_followups
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'adoption_followups'
  ) INTO v_table_exists;
  IF NOT v_table_exists THEN
    RAISE EXCEPTION 'Tabla adoption_followups no se creo';
  END IF;

  -- 3. Trigger en adoption_processes
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tg_adoption_followups_create'
  ) INTO v_trigger_exists;
  IF NOT v_trigger_exists THEN
    RAISE EXCEPTION 'Trigger tg_adoption_followups_create no se creo';
  END IF;

  RAISE NOTICE 'Smoke test OK: rescue_story + adoption_followups + trigger creados';
END $$;
