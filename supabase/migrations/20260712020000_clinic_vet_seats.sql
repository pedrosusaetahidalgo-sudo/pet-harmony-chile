-- ==========================================================================
-- Lote A.3 — Clinic vet seats (multi-vet bajo una cuenta clinica)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Auditoría E2E pre-launch):
-- plans.ts declaraba max_vet_seats: 3 en Clinica y -1 en Pro Max pero
-- NO existia infra. Esta tabla permite que una clinica (service_providers
-- con provider_plan = provider_clinic_starter o provider_pro_max) invite
-- y asocie vets adicionales bajo su misma cuenta-organizacion.
--
-- Seats invitation flow:
-- 1. Admin clinica crea invite (row con invited_email + invited_token UUID).
-- 2. Vet recibe email con link /provider/accept-seat?token=<uuid>.
-- 3. Vet se registra o loguea, acepta → seat_user_id se setea, status='active'.
-- 4. Clinica ve seats activos, puede remover (status='removed').
--
-- Idempotente: CREATE TABLE IF NOT EXISTS + CREATE OR REPLACE policies.
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.clinic_vet_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  seat_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email TEXT,
  invited_token UUID NOT NULL DEFAULT gen_random_uuid(),
  role TEXT NOT NULL DEFAULT 'vet' CHECK (role IN ('vet', 'admin_assistant')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'removed')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  CONSTRAINT clinic_vet_seats_unique_seat UNIQUE (parent_provider_id, seat_user_id),
  CONSTRAINT clinic_vet_seats_has_contact CHECK (seat_user_id IS NOT NULL OR invited_email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_clinic_vet_seats_parent ON public.clinic_vet_seats(parent_provider_id);
CREATE INDEX IF NOT EXISTS idx_clinic_vet_seats_seat_user ON public.clinic_vet_seats(seat_user_id) WHERE seat_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clinic_vet_seats_token ON public.clinic_vet_seats(invited_token) WHERE status = 'invited';
CREATE INDEX IF NOT EXISTS idx_clinic_vet_seats_status ON public.clinic_vet_seats(parent_provider_id, status) WHERE status = 'active';

COMMENT ON TABLE public.clinic_vet_seats IS
  'Seats adicionales bajo una cuenta clinica (provider_clinic_starter max 3, provider_pro_max ilimitado).';

-- ----------------------------------------------------------------------
-- RLS: solo el parent provider puede gestionar sus seats
-- ----------------------------------------------------------------------
ALTER TABLE public.clinic_vet_seats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinic_vet_seats_parent_read ON public.clinic_vet_seats;
CREATE POLICY clinic_vet_seats_parent_read
  ON public.clinic_vet_seats FOR SELECT
  USING (
    parent_provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid())
    OR seat_user_id = auth.uid()
  );

DROP POLICY IF EXISTS clinic_vet_seats_parent_insert ON public.clinic_vet_seats;
CREATE POLICY clinic_vet_seats_parent_insert
  ON public.clinic_vet_seats FOR INSERT
  WITH CHECK (
    parent_provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS clinic_vet_seats_parent_update ON public.clinic_vet_seats;
CREATE POLICY clinic_vet_seats_parent_update
  ON public.clinic_vet_seats FOR UPDATE
  USING (
    parent_provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS clinic_vet_seats_admin_all ON public.clinic_vet_seats;
CREATE POLICY clinic_vet_seats_admin_all
  ON public.clinic_vet_seats FOR ALL
  USING (public.is_active_admin(auth.uid()));

-- ----------------------------------------------------------------------
-- RPC: aceptar invitacion de seat
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_clinic_seat_invitation(p_token UUID)
RETURNS TABLE(seat_id UUID, parent_provider_id UUID, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seat public.clinic_vet_seats%ROWTYPE;
  v_parent_plan TEXT;
  v_current_seats INT;
  v_max_seats INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Traer seat por token
  SELECT * INTO v_seat FROM public.clinic_vet_seats
    WHERE invited_token = p_token AND status = 'invited';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or already used invitation token';
  END IF;

  -- Verificar capacidad segun plan del parent
  SELECT provider_plan INTO v_parent_plan FROM public.service_providers
    WHERE id = v_seat.parent_provider_id;

  v_max_seats := CASE
    WHEN v_parent_plan = 'provider_clinic_starter' THEN 3
    WHEN v_parent_plan = 'provider_pro_max' THEN 9999
    ELSE 1
  END;

  SELECT COUNT(*) INTO v_current_seats FROM public.clinic_vet_seats
    WHERE parent_provider_id = v_seat.parent_provider_id AND status = 'active';

  IF v_current_seats >= v_max_seats THEN
    RAISE EXCEPTION 'Clinic seat limit reached (max %). Parent must upgrade plan.', v_max_seats;
  END IF;

  -- Aceptar
  UPDATE public.clinic_vet_seats
    SET seat_user_id = auth.uid(),
        status = 'active',
        accepted_at = NOW()
    WHERE id = v_seat.id;

  RETURN QUERY
  SELECT v_seat.id, v_seat.parent_provider_id, v_seat.role;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_clinic_seat_invitation(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_clinic_seat_invitation(UUID) TO authenticated;

-- ----------------------------------------------------------------------
-- View: seats activos por clinica
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW public.clinic_active_seats_view AS
SELECT
  cvs.id,
  cvs.parent_provider_id,
  cvs.seat_user_id,
  cvs.role,
  cvs.invited_at,
  cvs.accepted_at,
  p.display_name AS seat_display_name,
  p.avatar_url AS seat_avatar_url,
  u.email AS seat_email
FROM public.clinic_vet_seats cvs
LEFT JOIN public.profiles p ON p.id = cvs.seat_user_id
LEFT JOIN auth.users u ON u.id = cvs.seat_user_id
WHERE cvs.status = 'active';

GRANT SELECT ON public.clinic_active_seats_view TO authenticated;

-- ----------------------------------------------------------------------
-- Verificacion post-apply:
-- SELECT COUNT(*) FROM clinic_vet_seats;  -- esperado 0 inicial
-- SELECT * FROM clinic_active_seats_view LIMIT 1;  -- esperado empty
-- \d clinic_vet_seats
-- ----------------------------------------------------------------------
