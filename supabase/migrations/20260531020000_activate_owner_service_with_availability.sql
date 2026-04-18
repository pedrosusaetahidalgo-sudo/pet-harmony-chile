-- ==========================================================================
-- RPC activate_owner_service: version 2 que acepta horarios.
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-18):
-- La v1 del RPC (mig 20260531010000) creaba el service_provider pero sin
-- horarios; el nuevo vet/paseador quedaba sin reglas de disponibilidad,
-- asi que bookings no podia reservar nada. Esta version acepta
-- availability_rules como JSON y las inserta en provider_availability_rules
-- (schema booking V2).
--
-- Mantiene los mismos criterios y whitelist de servicios. Idempotente:
-- reemplaza la funcion.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.activate_owner_service(
  p_service_type TEXT,
  p_base_commune TEXT,
  p_service_areas TEXT[],
  p_bio TEXT,
  p_price_from INTEGER,
  p_availability_rules JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile RECORD;
  v_pet_count INTEGER;
  v_existing_provider UUID;
  v_new_provider_id UUID;
  v_rule JSONB;
  v_rules_created INTEGER := 0;
BEGIN
  -- 1. Auth
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Whitelist
  IF p_service_type NOT IN ('dog_walker', 'dogsitter', 'trainer') THEN
    RAISE EXCEPTION 'Tipo de servicio % no disponible por auto-aprobacion.', p_service_type;
  END IF;

  -- 3. Validar inputs
  IF p_base_commune IS NULL OR length(trim(p_base_commune)) = 0 THEN
    RAISE EXCEPTION 'Comuna base requerida';
  END IF;
  IF p_service_areas IS NULL OR array_length(p_service_areas, 1) IS NULL THEN
    RAISE EXCEPTION 'Debes seleccionar al menos una comuna de atencion';
  END IF;
  IF p_price_from IS NULL OR p_price_from <= 0 THEN
    RAISE EXCEPTION 'Precio invalido';
  END IF;
  IF jsonb_array_length(p_availability_rules) = 0 THEN
    RAISE EXCEPTION 'Debes activar al menos un dia de disponibilidad';
  END IF;

  -- 4. No duplicar
  SELECT id INTO v_existing_provider
  FROM service_providers
  WHERE user_id = v_user_id
  LIMIT 1;
  IF v_existing_provider IS NOT NULL THEN
    RAISE EXCEPTION 'Ya tienes un perfil de servicios activo';
  END IF;

  -- 5. Perfil completo
  SELECT display_name, bio, location, avatar_url
  INTO v_profile
  FROM profiles
  WHERE id = v_user_id;

  IF v_profile IS NULL
     OR COALESCE(trim(v_profile.display_name), '') = ''
     OR COALESCE(trim(v_profile.bio), '') = ''
     OR COALESCE(trim(v_profile.location), '') = ''
     OR COALESCE(trim(v_profile.avatar_url), '') = ''
  THEN
    RAISE EXCEPTION 'Tu perfil no esta completo. Agrega foto, bio y comuna.';
  END IF;

  -- 6. Mascota con ficha
  SELECT COUNT(DISTINCT p.id)
  INTO v_pet_count
  FROM pets p
  INNER JOIN medical_records m ON m.pet_id = p.id
  WHERE p.owner_id = v_user_id AND m.owner_id = v_user_id;

  IF v_pet_count < 1 THEN
    RAISE EXCEPTION 'Necesitas al menos una mascota con ficha clinica (un registro medico).';
  END IF;

  -- 7. Crear service_provider
  INSERT INTO service_providers (
    user_id, display_name, provider_type, primary_service_type,
    status, is_verified, is_directory_visible,
    commune, service_areas, bio, price_from, provider_plan
  )
  VALUES (
    v_user_id, v_profile.display_name, 'home_visit', p_service_type,
    'aprobado', true, true,
    p_base_commune, p_service_areas,
    COALESCE(p_bio, v_profile.bio),
    p_price_from, 'provider_free'
  )
  RETURNING id INTO v_new_provider_id;

  -- 8. Insertar availability_rules (una por dia habilitado).
  --    Validamos cada item antes de insertar: el CHECK de la tabla rechaza
  --    invalidos, pero queremos un error legible si algo va mal.
  FOR v_rule IN SELECT * FROM jsonb_array_elements(p_availability_rules)
  LOOP
    IF NOT (v_rule ? 'day_of_week' AND v_rule ? 'start_time' AND v_rule ? 'end_time') THEN
      RAISE EXCEPTION 'Regla de horario invalida: %', v_rule;
    END IF;

    INSERT INTO provider_availability_rules (
      provider_id,
      day_of_week,
      start_time,
      end_time,
      service_type,
      slot_duration_minutes,
      is_active
    )
    VALUES (
      v_new_provider_id,
      (v_rule->>'day_of_week')::smallint,
      (v_rule->>'start_time')::time,
      (v_rule->>'end_time')::time,
      p_service_type,
      CASE p_service_type
        WHEN 'dog_walker' THEN 60
        WHEN 'dogsitter' THEN 120
        WHEN 'trainer' THEN 60
        ELSE 60
      END,
      true
    );
    v_rules_created := v_rules_created + 1;
  END LOOP;

  -- 9. Conceder rol
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, p_service_type::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 10. Audit
  INSERT INTO admin_audit_log (
    admin_user_id, action, target_type, target_id, details
  ) VALUES (
    v_user_id, 'owner.activate_service', 'service_provider', v_new_provider_id,
    jsonb_build_object(
      'service_type', p_service_type,
      'auto_approved', true,
      'base_commune', p_base_commune,
      'areas_count', array_length(p_service_areas, 1),
      'price_from', p_price_from,
      'availability_rules_count', v_rules_created
    )
  );

  RETURN v_new_provider_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_owner_service(TEXT, TEXT, TEXT[], TEXT, INTEGER, JSONB)
  FROM public, anon;
GRANT EXECUTE ON FUNCTION public.activate_owner_service(TEXT, TEXT, TEXT[], TEXT, INTEGER, JSONB)
  TO authenticated;

COMMENT ON FUNCTION public.activate_owner_service(TEXT, TEXT, TEXT[], TEXT, INTEGER, JSONB) IS
  'v2: auto-aprueba servicio no-profesional y crea reglas de disponibilidad en provider_availability_rules. Requiere perfil completo + mascota con ficha.';
