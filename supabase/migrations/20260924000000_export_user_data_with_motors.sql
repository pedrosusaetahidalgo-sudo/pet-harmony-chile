-- 2026-04-30 (Compliance Ley 21.719 · extiende export ARCO con motors data)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- El RPC export_user_data() (mig 20260907100000) cubre profile + pets +
-- medical_records + reminders + bookings + donations + pitch_applications.
-- Pero NO incluye los datos de los 7 motores B2B agregados 2026-04-29/30:
--
--   - insurance_quotes (cotizaciones calculadas)
--   - insurance_leads (leads enviados a aseguradoras)
--   - retail_clicks (clicks tracked en partners retail)
--   - paw_shield_archive (imagenes biometricas archivadas)
--   - vet_checkin_log (eventos donde un vet partner identifico la mascota)
--
-- Con la nueva regulacion 21.719 vigente, el titular tiene derecho a
-- recibir TODOS sus datos personales, no un subset. Esta mig agrega
-- esas 5 tablas al export para completar el cumplimiento ARCO.

BEGIN;

CREATE OR REPLACE FUNCTION public.export_user_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB := '{}'::JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  -- profile (sin password / tokens internos)
  v_result := jsonb_set(v_result, '{profile}', COALESCE(
    (SELECT to_jsonb(p.*) - 'plan_expires_at_meta' - 'fcm_token'
       FROM public.profiles p
       WHERE p.id = v_user_id),
    '{}'::jsonb
  ));

  -- pets
  v_result := jsonb_set(v_result, '{pets}', COALESCE(
    (SELECT jsonb_agg(to_jsonb(p.*))
       FROM public.pets p
       WHERE p.owner_id = v_user_id),
    '[]'::jsonb
  ));

  -- medical_records
  v_result := jsonb_set(v_result, '{medical_records}', COALESCE(
    (SELECT jsonb_agg(to_jsonb(mr.*))
       FROM public.medical_records mr
       WHERE mr.pet_id IN (SELECT id FROM public.pets WHERE owner_id = v_user_id)),
    '[]'::jsonb
  ));

  -- pet_reminders
  v_result := jsonb_set(v_result, '{pet_reminders}', COALESCE(
    (SELECT jsonb_agg(to_jsonb(r.*))
       FROM public.pet_reminders r
       WHERE r.pet_id IN (SELECT id FROM public.pets WHERE owner_id = v_user_id)),
    '[]'::jsonb
  ));

  -- pet_timeline_events
  v_result := jsonb_set(v_result, '{pet_timeline_events}', COALESCE(
    (SELECT jsonb_agg(to_jsonb(e.*))
       FROM public.pet_timeline_events e
       WHERE e.pet_id IN (SELECT id FROM public.pets WHERE owner_id = v_user_id)),
    '[]'::jsonb
  ));

  -- bookings legacy
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    v_result := jsonb_set(v_result, '{bookings_legacy}', COALESCE(
      (SELECT jsonb_agg(to_jsonb(b.*))
         FROM public.bookings b
         WHERE b.user_id = v_user_id),
      '[]'::jsonb
    ));
  END IF;

  -- vet_bookings
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'vet_bookings') THEN
    v_result := jsonb_set(v_result, '{vet_bookings}', COALESCE(
      (SELECT jsonb_agg(to_jsonb(vb.*))
         FROM public.vet_bookings vb
         WHERE vb.owner_id = v_user_id),
      '[]'::jsonb
    ));
  END IF;

  -- donations
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'donations') THEN
    v_result := jsonb_set(v_result, '{donations}', COALESCE(
      (SELECT jsonb_agg(to_jsonb(d.*))
         FROM public.donations d
         WHERE d.user_id = v_user_id),
      '[]'::jsonb
    ));
  END IF;

  -- pitch_applications
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'pitch_applications') THEN
    v_result := jsonb_set(v_result, '{pitch_applications}', COALESCE(
      (SELECT jsonb_agg(to_jsonb(pa.*))
         FROM public.pitch_applications pa
         WHERE pa.contact_email = (SELECT email FROM auth.users WHERE id = v_user_id)),
      '[]'::jsonb
    ));
  END IF;

  -- ── B2B MOTORS DATA (agregado 2026-04-30) ──────────────────────────

  -- insurance_quotes
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'insurance_quotes') THEN
    v_result := jsonb_set(v_result, '{insurance_quotes}', COALESCE(
      (SELECT jsonb_agg(to_jsonb(iq.*))
         FROM public.insurance_quotes iq
         WHERE iq.owner_id = v_user_id),
      '[]'::jsonb
    ));
  END IF;

  -- insurance_leads
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'insurance_leads') THEN
    v_result := jsonb_set(v_result, '{insurance_leads}', COALESCE(
      (SELECT jsonb_agg(to_jsonb(il.*))
         FROM public.insurance_leads il
         WHERE il.owner_id = v_user_id),
      '[]'::jsonb
    ));
  END IF;

  -- retail_clicks
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'retail_clicks') THEN
    v_result := jsonb_set(v_result, '{retail_clicks}', COALESCE(
      (SELECT jsonb_agg(to_jsonb(rc.*))
         FROM public.retail_clicks rc
         WHERE rc.owner_id = v_user_id),
      '[]'::jsonb
    ));
  END IF;

  -- paw_shield_archive (imagenes biometricas)
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'paw_shield_archive') THEN
    v_result := jsonb_set(v_result, '{paw_shield_archive}', COALESCE(
      (SELECT jsonb_agg(to_jsonb(psa.*))
         FROM public.paw_shield_archive psa
         WHERE psa.owner_id = v_user_id),
      '[]'::jsonb
    ));
  END IF;

  -- vet_checkin_log (cuando un vet partner identifico tu mascota)
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'vet_checkin_log') THEN
    v_result := jsonb_set(v_result, '{vet_checkin_log}', COALESCE(
      (SELECT jsonb_agg(to_jsonb(vcl.*))
         FROM public.vet_checkin_log vcl
         WHERE vcl.pet_id IN (SELECT id FROM public.pets WHERE owner_id = v_user_id)),
      '[]'::jsonb
    ));
  END IF;

  -- Metadata del export
  v_result := jsonb_set(v_result, '{_export_meta}', jsonb_build_object(
    'exported_at', now(),
    'user_id', v_user_id,
    'schema_version', '2026-04-30',
    'note', 'Derecho ARCO de portabilidad (Ley 19.628 + Reglamento 21.719). Datos personales del usuario solicitante incluyendo motors B2B (insurance, retail, biometric, vet checkin).'
  ));

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.export_user_data IS
  'Export ARCO completo. Schema 2026-04-30: incluye motors B2B (insurance_quotes/leads, retail_clicks, paw_shield_archive, vet_checkin_log). Filtrado estrictamente por auth.uid().';

COMMIT;
