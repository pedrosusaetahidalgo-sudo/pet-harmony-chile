-- ==========================================================================
-- Pitch Applications: tabla unificada de postulaciones desde cada pitch deck
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 PM):
-- Cada pitch deck (01-06) termina con un CTA "Postulate" que apunta a
-- /aplicar?tipo=<kind>. El form captura los datos basicos comunes +
-- payload especifico del tipo en JSONB.
--
-- Flujo:
-- 1. Usuario llena el form publico -> INSERT en pitch_applications
-- 2. Edge fn notify-pitch-application manda email a Pedro
-- 3. Pedro revisa en Admin > Aplicaciones
-- 4. Al aprobar, el admin puede auto-crear la entidad publica segun el tipo:
--    - paw_companys (sponsor/partner) -> row en paw_companys
--    - paw_voices                     -> row en paw_voices
--    Otros tipos (corfo/startup/angels/refugio/vet) no crean entidad
--    publica automaticamente (son leads externos o tienen su propio
--    flujo: /onboarding-shelter, /registro-veterinario).
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.pitch_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN (
    'corfo',
    'startup_chile',
    'paw_companys',
    'angels_vc',
    'refugio',
    'paw_partners',
    'vet',
    'paw_voices',
    'otro'
  )),

  -- Campos comunes de contacto
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL CHECK (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_phone TEXT,
  organization_name TEXT,
  website TEXT,

  -- Mensaje libre + metadata
  message TEXT CHECK (message IS NULL OR length(message) <= 2000),
  payload JSONB DEFAULT '{}'::jsonb,

  -- Contexto del cliente
  source_url TEXT,
  user_agent TEXT,

  -- Workflow admin
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'in_review', 'approved', 'rejected', 'contacted')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  approved_entity_id UUID,
  approved_entity_table TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pitch_apps_kind_status
  ON public.pitch_applications(kind, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pitch_apps_email
  ON public.pitch_applications(contact_email);
CREATE INDEX IF NOT EXISTS idx_pitch_apps_status
  ON public.pitch_applications(status, created_at DESC);

DROP TRIGGER IF EXISTS pitch_applications_updated_at ON public.pitch_applications;
CREATE TRIGGER pitch_applications_updated_at
  BEFORE UPDATE ON public.pitch_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.pitch_applications ENABLE ROW LEVEL SECURITY;

-- INSERT publico: cualquiera (anon o authenticated) puede postular.
-- No permite crear con status distinto de 'submitted' para evitar abuso.
DROP POLICY IF EXISTS "pitch_apps_public_insert" ON public.pitch_applications;
CREATE POLICY "pitch_apps_public_insert"
  ON public.pitch_applications FOR INSERT
  WITH CHECK (status = 'submitted');

-- Lectura / update solo admin.
DROP POLICY IF EXISTS "pitch_apps_admin_all" ON public.pitch_applications;
CREATE POLICY "pitch_apps_admin_all"
  ON public.pitch_applications FOR ALL
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

-- El propio applicant (si esta autenticado con su email) puede leer su propia
-- postulacion para ver el estado.
DROP POLICY IF EXISTS "pitch_apps_self_read" ON public.pitch_applications;
CREATE POLICY "pitch_apps_self_read"
  ON public.pitch_applications FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND contact_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

GRANT SELECT, INSERT ON public.pitch_applications TO anon, authenticated;

-- ==========================================================================
-- RPC: approve_pitch_application
-- ==========================================================================
-- Para tipos que tienen tabla publica destino (paw_companys, paw_voices),
-- crea la row correspondiente y marca la aplicacion como approved con
-- referencia a la entidad creada. Solo admin. Idempotente.
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.approve_pitch_application(
  p_application_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app RECORD;
  v_new_id UUID;
  v_target_table TEXT;
BEGIN
  IF NOT public.is_active_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can approve pitch applications';
  END IF;

  SELECT * INTO v_app FROM public.pitch_applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  IF v_app.status = 'approved' THEN
    RETURN json_build_object(
      'success', true,
      'already_approved', true,
      'entity_id', v_app.approved_entity_id,
      'entity_table', v_app.approved_entity_table
    );
  END IF;

  -- Segun el tipo, crear entidad publica
  CASE v_app.kind
    WHEN 'paw_companys' THEN
      INSERT INTO public.paw_companys (
        name, slug, website, description, tier, monthly_clp,
        is_active, partnership_type
      )
      VALUES (
        COALESCE(v_app.organization_name, v_app.contact_name),
        lower(regexp_replace(
          translate(COALESCE(v_app.organization_name, v_app.contact_name),
            'áéíóúàèìòùâêîôûäëïöüãõñç', 'aeiouaeiouaeiouaeiouaonc'),
          '[^a-zA-Z0-9]+', '-', 'g'
        )),
        v_app.website,
        COALESCE(v_app.payload->>'description', v_app.message),
        COALESCE(v_app.payload->>'tier', 'bronze'),
        COALESCE((v_app.payload->>'monthly_clp')::INT, 49900),
        false, -- admin debe activar manualmente despues de validar pago
        'sponsor'
      )
      RETURNING id INTO v_new_id;
      v_target_table := 'paw_companys';

    WHEN 'paw_partners' THEN
      INSERT INTO public.paw_companys (
        name, slug, website, description, tier, monthly_clp,
        is_active, partnership_type, paw_member_discount
      )
      VALUES (
        COALESCE(v_app.organization_name, v_app.contact_name),
        lower(regexp_replace(
          translate(COALESCE(v_app.organization_name, v_app.contact_name),
            'áéíóúàèìòùâêîôûäëïöüãõñç', 'aeiouaeiouaeiouaeiouaonc'),
          '[^a-zA-Z0-9]+', '-', 'g'
        )),
        v_app.website,
        COALESCE(v_app.payload->>'description', v_app.message),
        'bronze', -- partners no tienen tier monetario
        0,
        false, -- admin debe revisar antes de activar
        'partner',
        v_app.payload->>'discount'
      )
      RETURNING id INTO v_new_id;
      v_target_table := 'paw_companys';

    WHEN 'paw_voices' THEN
      INSERT INTO public.paw_voices (
        name, slug, handle, platform, followers_estimated, bio,
        profile_url, contact_email, status
      )
      VALUES (
        v_app.contact_name,
        lower(regexp_replace(
          translate(v_app.contact_name,
            'áéíóúàèìòùâêîôûäëïöüãõñç', 'aeiouaeiouaeiouaeiouaonc'),
          '[^a-zA-Z0-9]+', '-', 'g'
        )),
        COALESCE(v_app.payload->>'handle', v_app.payload->>'instagram'),
        COALESCE(v_app.payload->>'platform', 'instagram'),
        COALESCE((v_app.payload->>'followers')::INT, 0),
        COALESCE(v_app.payload->>'bio', v_app.message),
        v_app.website,
        v_app.contact_email,
        'active'
      )
      RETURNING id INTO v_new_id;
      v_target_table := 'paw_voices';

    ELSE
      -- Tipos sin tabla publica destino: solo marcamos como approved.
      v_new_id := NULL;
      v_target_table := NULL;
  END CASE;

  UPDATE public.pitch_applications
  SET status = 'approved',
      admin_notes = COALESCE(p_notes, admin_notes),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      approved_entity_id = v_new_id,
      approved_entity_table = v_target_table
  WHERE id = p_application_id;

  RETURN json_build_object(
    'success', true,
    'entity_id', v_new_id,
    'entity_table', v_target_table
  );
EXCEPTION WHEN unique_violation THEN
  -- Puede pasar si el slug o el handle ya existe. Degradamos a 'in_review'
  -- y dejamos que el admin resuelva manualmente.
  UPDATE public.pitch_applications
  SET status = 'in_review',
      admin_notes = COALESCE(p_notes, admin_notes) ||
        E'\n[auto] Conflicto al auto-crear entidad: ' || SQLERRM,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = p_application_id;

  RETURN json_build_object(
    'success', false,
    'error', 'duplicate_entity',
    'message', SQLERRM
  );
END;
$$;

REVOKE ALL ON FUNCTION public.approve_pitch_application(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_pitch_application(UUID, TEXT) TO authenticated;
