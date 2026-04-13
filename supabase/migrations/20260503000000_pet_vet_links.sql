-- =============================================================================
-- pet_vet_links: vinculacion directa vet-mascota (Compartir Ficha V2)
-- =============================================================================

-- 1. Nueva tabla pet_vet_links
CREATE TABLE IF NOT EXISTS public.pet_vet_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id),
  provider_id uuid NOT NULL REFERENCES public.service_providers(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'rejected', 'revoked_by_owner', 'revoked_by_vet')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  revoked_at timestamptz,
  UNIQUE (pet_id, provider_id)
);

ALTER TABLE public.pet_vet_links ENABLE ROW LEVEL SECURITY;

-- Dueno puede ver/crear/revocar sus vinculaciones
CREATE POLICY "Owner manages own links" ON public.pet_vet_links
  FOR ALL USING (owner_id = auth.uid());

-- Vet puede ver solicitudes dirigidas a el
CREATE POLICY "Vet sees their links" ON public.pet_vet_links
  FOR SELECT USING (
    provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid())
  );

-- Vet puede responder (aceptar/rechazar/desvincularse)
CREATE POLICY "Vet responds to links" ON public.pet_vet_links
  FOR UPDATE USING (
    provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    status IN ('active', 'rejected', 'revoked_by_vet')
  );

-- Indices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_pet_vet_links_pet_id ON public.pet_vet_links(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_vet_links_provider_id ON public.pet_vet_links(provider_id);
CREATE INDEX IF NOT EXISTS idx_pet_vet_links_owner_id ON public.pet_vet_links(owner_id);
CREATE INDEX IF NOT EXISTS idx_pet_vet_links_status ON public.pet_vet_links(status);

-- =============================================================================
-- 2. Fix RLS: permitir que vets creen mascotas pending
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pets' AND policyname = 'Vets can create pending pets'
  ) THEN
    CREATE POLICY "Vets can create pending pets"
      ON public.pets FOR INSERT TO authenticated
      WITH CHECK (created_by_vet_id = auth.uid());
  END IF;
END $$;

-- =============================================================================
-- 3. Columna pending_owner_name en pets
-- =============================================================================
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS pending_owner_name text;

COMMENT ON COLUMN public.pets.pending_owner_name
  IS 'Nombre del dueno ingresado por el vet al crear paciente. Se usa para personalizar el email de invitacion.';

-- =============================================================================
-- 4. Trigger de notificaciones automaticas para pet_vet_links
-- =============================================================================
CREATE OR REPLACE FUNCTION public.notify_pet_vet_link_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_pet_name text;
  v_owner_name text;
  v_vet_user_id uuid;
  v_vet_name text;
BEGIN
  SELECT name INTO v_pet_name FROM public.pets WHERE id = NEW.pet_id;
  SELECT display_name INTO v_owner_name FROM public.profiles WHERE id = NEW.owner_id;
  SELECT sp.user_id, p.display_name INTO v_vet_user_id, v_vet_name
    FROM public.service_providers sp
    JOIN public.profiles p ON p.id = sp.user_id
    WHERE sp.id = NEW.provider_id;

  -- Nueva solicitud -> notificar al vet
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      v_vet_user_id,
      'vet_link_request',
      'Nueva solicitud de paciente',
      COALESCE(v_owner_name, 'Un usuario') || ' quiere compartir la ficha de ' || COALESCE(v_pet_name, 'su mascota') || ' contigo.',
      '/provider/dashboard',
      NEW.id::text
    );
  END IF;

  -- Vet acepta -> notificar al dueno
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'active' THEN
    INSERT INTO public.notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      NEW.owner_id,
      'vet_link_accepted',
      'Tu vet acepto la solicitud',
      COALESCE(v_vet_name, 'Tu veterinario') || ' ahora tiene acceso a la ficha de ' || COALESCE(v_pet_name, 'tu mascota') || '.',
      '/ficha/' || NEW.pet_id,
      NEW.id::text
    );
  END IF;

  -- Vet rechaza -> notificar al dueno
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      NEW.owner_id,
      'vet_link_rejected',
      'Solicitud no aceptada',
      COALESCE(v_vet_name, 'El veterinario') || ' no acepto la solicitud para ' || COALESCE(v_pet_name, 'tu mascota') || '.',
      '/my-pets',
      NEW.id::text
    );
  END IF;

  -- Dueno revoca -> notificar al vet
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'revoked_by_owner' THEN
    INSERT INTO public.notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      v_vet_user_id,
      'vet_link_revoked',
      'Paciente desvinculado',
      COALESCE(v_owner_name, 'El dueno') || ' revoco el acceso a la ficha de ' || COALESCE(v_pet_name, 'una mascota') || '.',
      '/provider/dashboard',
      NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_pet_vet_link_change ON public.pet_vet_links;
CREATE TRIGGER on_pet_vet_link_change
  AFTER INSERT OR UPDATE ON public.pet_vet_links
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_pet_vet_link_change();

-- =============================================================================
-- 5. Migrar tokens existentes con target_provider_id a pet_vet_links
-- =============================================================================
INSERT INTO public.pet_vet_links (pet_id, owner_id, provider_id, status, created_at, responded_at)
SELECT
  mst.pet_id,
  mst.owner_id,
  mst.target_provider_id,
  'active',
  mst.created_at,
  mst.created_at
FROM public.medical_share_tokens mst
WHERE mst.target_provider_id IS NOT NULL
  AND mst.is_revoked = false
  AND mst.expires_at > now()
ON CONFLICT (pet_id, provider_id) DO NOTHING;
