-- ============================================================================
-- Pet Co-Owners: copropiedad de mascotas
-- Permite que una mascota tenga múltiples dueños/cuidadores/familiares
-- ============================================================================

-- Tabla de co-propietarios
CREATE TABLE IF NOT EXISTS public.pet_co_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'co_owner'
    CHECK (role IN ('co_owner', 'caretaker', 'trainer', 'family_member')),
  permissions TEXT[] NOT NULL DEFAULT ARRAY['view_record']::TEXT[],
  invited_by UUID REFERENCES auth.users(id),
  invited_email TEXT,
  invitation_token UUID DEFAULT gen_random_uuid(),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked'))
);

-- Unique solo para co-owners aceptados (evita conflicto con placeholders en pending)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pet_co_owners_unique_accepted
  ON public.pet_co_owners(pet_id, user_id) WHERE status != 'revoked';

-- Unique por email invitado por mascota (evita doble invitación al mismo email)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pet_co_owners_unique_email
  ON public.pet_co_owners(pet_id, invited_email) WHERE status != 'revoked' AND invited_email IS NOT NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_pet_co_owners_pet ON public.pet_co_owners(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_co_owners_user ON public.pet_co_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_co_owners_token ON public.pet_co_owners(invitation_token) WHERE status = 'pending';

-- RLS
ALTER TABLE public.pet_co_owners ENABLE ROW LEVEL SECURITY;

-- El dueño principal puede ver y gestionar todos los co-owners de sus mascotas
DO $$ BEGIN
  CREATE POLICY "owner_manages_co_owners"
    ON public.pet_co_owners FOR ALL
    USING (pet_id IN (SELECT id FROM public.pets WHERE owner_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Un co-owner puede ver su propio registro y los otros co-owners de la misma mascota
DO $$ BEGIN
  CREATE POLICY "co_owner_reads_own"
    ON public.pet_co_owners FOR SELECT
    USING (
      user_id = auth.uid()
      OR pet_id IN (
        SELECT pet_id FROM public.pet_co_owners
        WHERE user_id = auth.uid() AND status = 'accepted'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Un co-owner puede actualizar su propio registro (aceptar invitación)
DO $$ BEGIN
  CREATE POLICY "co_owner_accepts_own"
    ON public.pet_co_owners FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Permisos por rol (referencia, enforced en frontend)
-- co_owner:       view_record, add_records, edit_pet
-- caretaker:      view_record, add_notes
-- family_member:  view_record
-- trainer:        view_record, add_routines
-- ============================================================================

-- Función para aceptar invitación de co-owner por token
CREATE OR REPLACE FUNCTION public.accept_co_owner_invitation(
  p_token UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record pet_co_owners%ROWTYPE;
BEGIN
  -- Buscar invitación pendiente
  SELECT * INTO v_record
  FROM pet_co_owners
  WHERE invitation_token = p_token AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'invalid_or_expired_token');
  END IF;

  -- Si ya hay un user_id asignado y no coincide, error
  IF v_record.user_id IS NOT NULL AND v_record.user_id != p_user_id THEN
    -- Reasignar si el user_id era placeholder (invited_email flow)
    IF v_record.invited_email IS NOT NULL THEN
      UPDATE pet_co_owners
      SET user_id = p_user_id, accepted_at = now(), status = 'accepted'
      WHERE id = v_record.id;
      RETURN json_build_object('success', true, 'pet_id', v_record.pet_id, 'role', v_record.role);
    END IF;
    RETURN json_build_object('success', false, 'error', 'invitation_for_another_user');
  END IF;

  -- Aceptar
  UPDATE pet_co_owners
  SET accepted_at = now(), status = 'accepted', user_id = p_user_id
  WHERE id = v_record.id;

  RETURN json_build_object('success', true, 'pet_id', v_record.pet_id, 'role', v_record.role);
END;
$$;

-- Auto-claim: cuando un usuario se registra con email que tiene invitaciones pendientes
CREATE OR REPLACE FUNCTION public.auto_claim_co_owner_by_email(p_user_id UUID, p_email TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE pet_co_owners
  SET user_id = p_user_id, accepted_at = now(), status = 'accepted'
  WHERE invited_email = lower(p_email) AND status = 'pending';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
