-- ==========================================================================
-- Post-adoption check-ins — seguimiento automatico del adoptante
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20):
-- Cuando un refugio entrega una mascota al adoptante (shelter_adopted_at
-- se setea), queremos hacer seguimiento a los 7, 30 y 90 dias preguntando
-- por el estado del animal. Esto:
--   1. Cierra el ciclo del refugio (saber que la mascota llego bien).
--   2. Genera data de calidad de adopcion.
--   3. Mantiene al adoptante activo en la app.
--
-- Tabla post_adoption_checkins: 1 row por (pet, milestone_days). Se
-- generan al momento del transfer con status='pending'. Un cron diario
-- revisa los que tienen scheduled_at <= now() y status='pending' y
-- envia el email via edge fn send-post-adoption-checkin (futura; por
-- ahora la tabla queda lista para que el cron la consuma).
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.post_adoption_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  shelter_id UUID REFERENCES public.adoption_centers(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_email TEXT NOT NULL,

  milestone_days INT NOT NULL CHECK (milestone_days IN (7, 30, 90)),
  scheduled_at TIMESTAMPTZ NOT NULL,

  -- Workflow
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'responded', 'skipped', 'failed')),
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  response_score INT CHECK (response_score IS NULL OR response_score BETWEEN 1 AND 5),
  response_notes TEXT,

  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (pet_id, milestone_days)
);

CREATE INDEX IF NOT EXISTS idx_post_adoption_checkins_due
  ON public.post_adoption_checkins(scheduled_at, status)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_post_adoption_checkins_shelter
  ON public.post_adoption_checkins(shelter_id, created_at DESC)
  WHERE shelter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_adoption_checkins_owner
  ON public.post_adoption_checkins(owner_id, created_at DESC)
  WHERE owner_id IS NOT NULL;

DROP TRIGGER IF EXISTS post_adoption_checkins_updated_at ON public.post_adoption_checkins;
CREATE TRIGGER post_adoption_checkins_updated_at
  BEFORE UPDATE ON public.post_adoption_checkins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.post_adoption_checkins ENABLE ROW LEVEL SECURITY;

-- Admin ve todo
DROP POLICY IF EXISTS "post_adoption_admin_all" ON public.post_adoption_checkins;
CREATE POLICY "post_adoption_admin_all"
  ON public.post_adoption_checkins FOR ALL
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

-- Shelter ve los check-ins de mascotas que cargo
DROP POLICY IF EXISTS "post_adoption_shelter_read" ON public.post_adoption_checkins;
CREATE POLICY "post_adoption_shelter_read"
  ON public.post_adoption_checkins FOR SELECT
  USING (
    shelter_id IN (
      SELECT id FROM public.adoption_centers WHERE user_id = auth.uid()
    )
  );

-- Owner ve sus propios check-ins (para responder)
DROP POLICY IF EXISTS "post_adoption_owner_read" ON public.post_adoption_checkins;
CREATE POLICY "post_adoption_owner_read"
  ON public.post_adoption_checkins FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "post_adoption_owner_update" ON public.post_adoption_checkins;
CREATE POLICY "post_adoption_owner_update"
  ON public.post_adoption_checkins FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

GRANT SELECT ON public.post_adoption_checkins TO authenticated;
GRANT UPDATE (response_score, response_notes, responded_at) ON public.post_adoption_checkins TO authenticated;

-- ==========================================================================
-- Trigger: al setear shelter_adopted_at, crear los 3 check-ins (7/30/90 dias)
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.schedule_post_adoption_checkins()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Solo cuando shelter_adopted_at pasa de NULL a algo (transicion adoptada)
  IF TG_OP <> 'UPDATE' THEN RETURN NEW; END IF;
  IF OLD.shelter_adopted_at IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.shelter_adopted_at IS NULL THEN RETURN NEW; END IF;
  IF NEW.created_by_shelter_id IS NULL THEN RETURN NEW; END IF;

  -- Email del adoptante: si hay owner_id, del profile; sino de pending_owner_email
  IF NEW.owner_id IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.owner_id;
  END IF;
  IF v_email IS NULL THEN
    v_email := NEW.pending_owner_email;
  END IF;
  IF v_email IS NULL OR v_email = '' THEN
    -- Sin email no podemos agendar. Skip silencioso.
    RETURN NEW;
  END IF;

  INSERT INTO public.post_adoption_checkins
    (pet_id, shelter_id, owner_id, owner_email, milestone_days, scheduled_at)
  VALUES
    (NEW.id, NEW.created_by_shelter_id, NEW.owner_id, v_email,  7, NEW.shelter_adopted_at + INTERVAL '7 days'),
    (NEW.id, NEW.created_by_shelter_id, NEW.owner_id, v_email, 30, NEW.shelter_adopted_at + INTERVAL '30 days'),
    (NEW.id, NEW.created_by_shelter_id, NEW.owner_id, v_email, 90, NEW.shelter_adopted_at + INTERVAL '90 days')
  ON CONFLICT (pet_id, milestone_days) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS schedule_post_adoption_checkins_trg ON public.pets;
CREATE TRIGGER schedule_post_adoption_checkins_trg
  AFTER UPDATE OF shelter_adopted_at ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.schedule_post_adoption_checkins();

COMMENT ON TABLE public.post_adoption_checkins IS
  'Seguimiento automatico al adoptante a los 7, 30, 90 dias. Se crean via trigger cuando pets.shelter_adopted_at se setea. Un cron diario procesa los pending con scheduled_at <= now().';
