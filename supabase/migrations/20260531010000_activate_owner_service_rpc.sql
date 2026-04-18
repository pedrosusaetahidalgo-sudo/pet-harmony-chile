-- ==========================================================================
-- RPC: activate_owner_service — auto-aprueba servicios no-profesionales
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-18):
-- Un dueno que cumple criterios (perfil completo + mascota con ficha)
-- puede activar servicios de paseo/cuidado/entrenamiento sin aprobacion
-- manual. Vet y grooming NO pasan por aca — siguen requiriendo docs y
-- approval manual.
--
-- La validacion vive en el RPC (server-side) para que el UI no pueda
-- skippear criterios. Retorna el id del service_provider creado.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.activate_owner_service(
  p_service_type TEXT,        -- 'dog_walker' | 'dogsitter' | 'trainer'
  p_base_commune TEXT,
  p_service_areas TEXT[],
  p_bio TEXT,
  p_price_from INTEGER
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
BEGIN
  -- 1. Auth
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Whitelist de service_type (solo no-profesionales)
  IF p_service_type NOT IN ('dog_walker', 'dogsitter', 'trainer') THEN
    RAISE EXCEPTION 'Tipo de servicio % no disponible por auto-aprobacion. Vet y peluquero requieren verificacion manual.', p_service_type;
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

  -- 4. No duplicar: si ya es provider, abortar
  SELECT id INTO v_existing_provider
  FROM service_providers
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_existing_provider IS NOT NULL THEN
    RAISE EXCEPTION 'Ya tienes un perfil de servicios activo';
  END IF;

  -- 5. Criterio: perfil completo (display_name + bio + location + avatar_url)
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

  -- 6. Criterio: al menos 1 mascota con al menos 1 medical_record
  SELECT COUNT(DISTINCT p.id)
  INTO v_pet_count
  FROM pets p
  INNER JOIN medical_records m ON m.pet_id = p.id
  WHERE p.owner_id = v_user_id
    AND m.owner_id = v_user_id;

  IF v_pet_count < 1 THEN
    RAISE EXCEPTION 'Necesitas al menos una mascota con ficha clinica (un registro medico).';
  END IF;

  -- 7. Crear service_provider aprobado
  INSERT INTO service_providers (
    user_id,
    display_name,
    provider_type,
    primary_service_type,
    status,
    is_verified,
    is_directory_visible,
    commune,
    service_areas,
    bio,
    price_from,
    provider_plan
  )
  VALUES (
    v_user_id,
    v_profile.display_name,
    'home_visit',
    p_service_type,
    'aprobado',
    true,
    true,
    p_base_commune,
    p_service_areas,
    COALESCE(p_bio, v_profile.bio),
    p_price_from,
    'provider_free'
  )
  RETURNING id INTO v_new_provider_id;

  -- 8. Conceder rol correspondiente
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, p_service_type::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 9. Audit (el trigger del generate_provider_slug se encarga del slug)
  INSERT INTO admin_audit_log (
    admin_user_id, action, target_type, target_id, details
  ) VALUES (
    v_user_id,
    'owner.activate_service',
    'service_provider',
    v_new_provider_id,
    jsonb_build_object(
      'service_type', p_service_type,
      'auto_approved', true,
      'base_commune', p_base_commune,
      'areas_count', array_length(p_service_areas, 1),
      'price_from', p_price_from
    )
  );

  RETURN v_new_provider_id;
END;
$$;

-- Solo usuarios autenticados pueden invocar (la funcion ya valida auth.uid()
-- pero defensivo).
REVOKE EXECUTE ON FUNCTION public.activate_owner_service(TEXT, TEXT, TEXT[], TEXT, INTEGER)
  FROM public, anon;
GRANT EXECUTE ON FUNCTION public.activate_owner_service(TEXT, TEXT, TEXT[], TEXT, INTEGER)
  TO authenticated;

COMMENT ON FUNCTION public.activate_owner_service IS
  'Auto-aprueba un servicio no-profesional (paseo/cuidado/entrenamiento) para un dueno que cumple perfil completo + mascota con ficha. Vet y grooming requieren aprobacion manual.';
