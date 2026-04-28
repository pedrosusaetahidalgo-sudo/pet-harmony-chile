-- 2026-04-28 (Sprint 1 P1 COMP-002)
--
-- Derecho ARCO de portabilidad (Ley 19.628 / Reglamento 21.719): el usuario
-- tiene derecho a recibir TODOS sus datos personales en formato estructurado
-- y legible por maquina. Hoy esto se hace a mano por email; a 100K users no
-- escala.
--
-- Esta RPC retorna un JSON con todas las tablas que contienen datos del user
-- autenticado. Frontend lo descarga como pawfriend-mis-datos-YYYY-MM-DD.json.
--
-- Tablas incluidas:
--   - profile (perfil basico + consents)
--   - pets (sus mascotas)
--   - medical_records (historial clinico)
--   - pet_reminders (recordatorios)
--   - pet_timeline_events (timeline)
--   - bookings + vet_bookings (reservas)
--   - donations (aportes monetarios)
--   - pitch_applications (postulaciones a /aplicar)
--
-- Se EXCLUYEN: tablas que pueden contener data de otros users (chat,
-- service_reviews donde el user es el reviewer pero el contenido es
-- interaccion con un tercero — mejor exportar separado y obfuscar el
-- otro lado).
--
-- SECURITY DEFINER: la fn corre con privilegios elevados pero filtra
-- estrictamente por auth.uid(). Sin bind a user_id, devuelve {} vacio.

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

  -- medical_records (filtra solo por pets del user)
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

  -- bookings legacy (filtrados por user_id)
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    v_result := jsonb_set(v_result, '{bookings_legacy}', COALESCE(
      (SELECT jsonb_agg(to_jsonb(b.*))
         FROM public.bookings b
         WHERE b.user_id = v_user_id),
      '[]'::jsonb
    ));
  END IF;

  -- vet_bookings (V2)
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'vet_bookings') THEN
    v_result := jsonb_set(v_result, '{vet_bookings}', COALESCE(
      (SELECT jsonb_agg(to_jsonb(vb.*))
         FROM public.vet_bookings vb
         WHERE vb.owner_id = v_user_id),
      '[]'::jsonb
    ));
  END IF;

  -- donations (aportes que hizo el user)
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'donations') THEN
    v_result := jsonb_set(v_result, '{donations}', COALESCE(
      (SELECT jsonb_agg(to_jsonb(d.*))
         FROM public.donations d
         WHERE d.user_id = v_user_id),
      '[]'::jsonb
    ));
  END IF;

  -- pitch_applications (postulaciones via /aplicar — match por email)
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'pitch_applications') THEN
    v_result := jsonb_set(v_result, '{pitch_applications}', COALESCE(
      (SELECT jsonb_agg(to_jsonb(pa.*))
         FROM public.pitch_applications pa
         WHERE pa.contact_email = (SELECT email FROM auth.users WHERE id = v_user_id)),
      '[]'::jsonb
    ));
  END IF;

  -- Metadata del export
  v_result := jsonb_set(v_result, '{_export_meta}', jsonb_build_object(
    'exported_at', now(),
    'user_id', v_user_id,
    'note', 'Derecho ARCO de portabilidad (Ley 19.628). Datos personales del usuario solicitante.'
  ));

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.export_user_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.export_user_data() TO authenticated;

COMMENT ON FUNCTION public.export_user_data IS
  'Sprint 1 P1 COMP-002 (2026-04-28): export ARCO de portabilidad. Devuelve JSON con todos los datos del usuario autenticado. Filtrado estrictamente por auth.uid().';
