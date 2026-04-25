-- Refactor flujo adopción 2026-04-24 (REFACTOR_ADOPCION_2026_04_24.md, Bloque 2)
--
-- Tabla adoption_processes: traza el ciclo de vida de una adopción desde
-- "interés expresado" hasta "transferred al adoptante".
--
-- Estados: interested → contacted → visit_scheduled → visit_done →
--          approved → (transferred | rejected)
--
-- Trigger 'transferred' setea pending_owner_email + invitation_token en pets,
-- reusando el mismo flujo de send-pet-invitation.
--
-- Cambios:
--   1. Tabla adoption_processes
--   2. Indices
--   3. Trigger updated_at
--   4. Trigger transfer (set pets.pending_owner_email + token)
--   5. RLS policies
--   6. Smoke test (regla 9.2.1)

BEGIN;

-- 1: tabla
CREATE TABLE IF NOT EXISTS public.adoption_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  adopter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shelter_id UUID NOT NULL REFERENCES public.adoption_centers(id) ON DELETE CASCADE,
  source_interest_id UUID REFERENCES public.adoption_interests(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN (
    'interested',
    'contacted',
    'visit_scheduled',
    'visit_done',
    'approved',
    'rejected',
    'transferred'
  )),
  notes_shelter TEXT,
  notes_adopter TEXT,
  visit_date TIMESTAMPTZ,
  rejected_reason TEXT,
  approved_at TIMESTAMPTZ,
  transferred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT adoption_processes_unique_active UNIQUE (pet_id, adopter_user_id)
);

-- 2: indices
CREATE INDEX IF NOT EXISTS idx_adoption_processes_shelter
  ON public.adoption_processes(shelter_id);
CREATE INDEX IF NOT EXISTS idx_adoption_processes_adopter
  ON public.adoption_processes(adopter_user_id);
CREATE INDEX IF NOT EXISTS idx_adoption_processes_status
  ON public.adoption_processes(status);

-- 3: trigger updated_at
CREATE OR REPLACE FUNCTION public.update_adoption_processes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_adoption_processes_updated_at
  ON public.adoption_processes;
CREATE TRIGGER tg_adoption_processes_updated_at
  BEFORE UPDATE ON public.adoption_processes
  FOR EACH ROW EXECUTE FUNCTION public.update_adoption_processes_updated_at();

-- 4: trigger transfer (cuando pasa a 'transferred', setea token en pets)
CREATE OR REPLACE FUNCTION public.handle_adoption_transfer()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Solo cuando cambia A 'transferred' (no en updates de notas, etc)
  IF NEW.status = 'transferred'
     AND (OLD.status IS NULL OR OLD.status != 'transferred')
  THEN
    -- Lookup del email del adopter
    SELECT email INTO v_email
      FROM auth.users
      WHERE id = NEW.adopter_user_id;

    IF v_email IS NULL THEN
      RAISE EXCEPTION 'Adopter user_id % no tiene email en auth.users', NEW.adopter_user_id;
    END IF;

    -- Actualizar pet: set pending_owner_email + token + shelter_adopted_at
    UPDATE public.pets
      SET pending_owner_email = v_email,
          owner_invitation_token = COALESCE(
            owner_invitation_token,
            encode(gen_random_bytes(32), 'hex')
          ),
          owner_invitation_sent_at = now(),
          shelter_adopted_at = now()
      WHERE id = NEW.pet_id;

    -- Marcar timestamp en el proceso
    NEW.transferred_at = now();
  END IF;

  -- Si cambia a 'approved' y no tenía approved_at, setearlo
  IF NEW.status = 'approved'
     AND (OLD.status IS NULL OR OLD.status != 'approved')
     AND NEW.approved_at IS NULL
  THEN
    NEW.approved_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_adoption_transfer
  ON public.adoption_processes;
CREATE TRIGGER tg_adoption_transfer
  BEFORE UPDATE ON public.adoption_processes
  FOR EACH ROW EXECUTE FUNCTION public.handle_adoption_transfer();

-- 5: RLS
ALTER TABLE public.adoption_processes ENABLE ROW LEVEL SECURITY;

-- Shelter dueño ve sus procesos
DROP POLICY IF EXISTS "Shelter ve sus procesos" ON public.adoption_processes;
CREATE POLICY "Shelter ve sus procesos"
  ON public.adoption_processes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.adoption_centers
      WHERE id = shelter_id AND user_id = auth.uid()
  ));

-- Adopter ve los suyos
DROP POLICY IF EXISTS "Adopter ve sus procesos" ON public.adoption_processes;
CREATE POLICY "Adopter ve sus procesos"
  ON public.adoption_processes FOR SELECT
  USING (adopter_user_id = auth.uid());

-- INSERT: solo el shelter dueño del pet puede crear procesos (típicamente
-- desde un adoption_interest aceptado)
DROP POLICY IF EXISTS "Shelter inserta procesos" ON public.adoption_processes;
CREATE POLICY "Shelter inserta procesos"
  ON public.adoption_processes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.adoption_centers
      WHERE id = shelter_id AND user_id = auth.uid()
  ));

-- UPDATE: solo shelter dueño puede mover entre estados
DROP POLICY IF EXISTS "Shelter actualiza estados" ON public.adoption_processes;
CREATE POLICY "Shelter actualiza estados"
  ON public.adoption_processes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.adoption_centers
      WHERE id = shelter_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.adoption_centers
      WHERE id = shelter_id AND user_id = auth.uid()
  ));

-- Adopter puede actualizar SUS notas (no estados)
DROP POLICY IF EXISTS "Adopter actualiza sus notas" ON public.adoption_processes;
CREATE POLICY "Adopter actualiza sus notas"
  ON public.adoption_processes FOR UPDATE
  USING (adopter_user_id = auth.uid())
  WITH CHECK (adopter_user_id = auth.uid());

-- DELETE: solo shelter dueño
DROP POLICY IF EXISTS "Shelter elimina procesos" ON public.adoption_processes;
CREATE POLICY "Shelter elimina procesos"
  ON public.adoption_processes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.adoption_centers
      WHERE id = shelter_id AND user_id = auth.uid()
  ));

COMMIT;

-- 6: Smoke test
DO $$
DECLARE
  v_function_exists INTEGER;
BEGIN
  -- Validar tabla
  PERFORM 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'adoption_processes';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tabla adoption_processes no se creó';
  END IF;

  -- Validar trigger function
  SELECT COUNT(*) INTO v_function_exists
    FROM pg_proc WHERE proname = 'handle_adoption_transfer';
  IF v_function_exists = 0 THEN
    RAISE EXCEPTION 'Función handle_adoption_transfer no se creó';
  END IF;

  -- Validar enum CHECK
  PERFORM 1 FROM information_schema.check_constraints
    WHERE constraint_schema = 'public'
      AND check_clause LIKE '%interested%';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CHECK constraint del status no se creó';
  END IF;

  RAISE NOTICE 'Smoke test OK: tabla + trigger + check constraint creados';
END $$;
