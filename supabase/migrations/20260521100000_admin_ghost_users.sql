-- =============================================================================
-- Admin: monitoreo y limpieza de "ghost users"
-- =============================================================================
-- Ghost user: cuenta creada por invitacion (invited_at NOT NULL) que el dueno
-- nunca acepto (last_sign_in_at IS NULL). Antes se creaban automaticamente
-- por el flujo create-patient → ahora ese flujo no las crea, pero quedan
-- legacy y ayuda monitorear que no vuelvan a aparecer.

-- 1. RPC: listar ghost users (admin only)
CREATE OR REPLACE FUNCTION public.admin_list_ghost_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  invited_at timestamptz,
  pets_count bigint,
  display_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    u.invited_at,
    (SELECT COUNT(*) FROM public.pets p WHERE p.owner_id = u.id) AS pets_count,
    (SELECT pr.display_name FROM public.profiles pr WHERE pr.id = u.id LIMIT 1) AS display_name
  FROM auth.users u
  WHERE EXISTS (
    SELECT 1 FROM public.admin_access a
    WHERE a.user_id = auth.uid() AND a.is_active = true
  )
  AND u.invited_at IS NOT NULL
  AND u.last_sign_in_at IS NULL
  ORDER BY u.created_at DESC
  LIMIT 200;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_ghost_users FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_ghost_users TO authenticated;

-- 2. RPC: borrar un ghost user de forma segura (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_ghost_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
DECLARE
  v_email text;
  v_is_ghost boolean;
BEGIN
  -- Verificar admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'forbidden: admin access required';
  END IF;

  -- Verificar que es ghost (seguridad: no borrar users reales)
  SELECT
    email,
    (invited_at IS NOT NULL AND last_sign_in_at IS NULL)
  INTO v_email, v_is_ghost
  FROM auth.users
  WHERE id = p_user_id;

  IF v_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  IF NOT v_is_ghost THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_ghost_user');
  END IF;

  -- Limpiar dependencias en orden seguro
  DELETE FROM public.pending_reviews WHERE pet_id IN (SELECT id FROM public.pets WHERE owner_id = p_user_id);
  DELETE FROM public.pet_reminders WHERE pet_id IN (SELECT id FROM public.pets WHERE owner_id = p_user_id);
  DELETE FROM public.medical_records WHERE pet_id IN (SELECT id FROM public.pets WHERE owner_id = p_user_id);
  DELETE FROM public.medical_records WHERE owner_id = p_user_id;
  DELETE FROM public.vet_clinical_notes WHERE pet_id IN (SELECT id FROM public.pets WHERE owner_id = p_user_id);
  DELETE FROM public.medical_share_tokens WHERE pet_id IN (SELECT id FROM public.pets WHERE owner_id = p_user_id);
  DELETE FROM public.pet_vet_links WHERE owner_id = p_user_id OR pet_id IN (SELECT id FROM public.pets WHERE owner_id = p_user_id);
  DELETE FROM public.pet_routines WHERE pet_id IN (SELECT id FROM public.pets WHERE owner_id = p_user_id);
  DELETE FROM public.notifications WHERE user_id = p_user_id;
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  DELETE FROM public.user_missions WHERE user_id = p_user_id;
  DELETE FROM public.ai_usage WHERE user_id = p_user_id;
  DELETE FROM public.pending_reviews WHERE user_id = p_user_id;
  DELETE FROM public.pets WHERE owner_id = p_user_id;
  DELETE FROM public.service_providers WHERE user_id = p_user_id;
  DELETE FROM public.admin_access WHERE user_id = p_user_id;
  DELETE FROM public.profiles WHERE id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;

  -- Audit log
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_type, target_id, details)
  VALUES (
    auth.uid(),
    'user.delete_ghost',
    'user',
    p_user_id::text,
    jsonb_build_object('email', v_email)
  );

  RETURN jsonb_build_object('success', true, 'email', v_email);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_ghost_user FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_ghost_user TO authenticated;

-- 3. RPC: borrado masivo (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_all_ghost_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
DECLARE
  v_ghost_ids uuid[];
  v_count int;
  v_uid uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'forbidden: admin access required';
  END IF;

  SELECT array_agg(id) INTO v_ghost_ids
  FROM auth.users
  WHERE invited_at IS NOT NULL AND last_sign_in_at IS NULL;

  IF v_ghost_ids IS NULL THEN
    RETURN jsonb_build_object('success', true, 'deleted_count', 0);
  END IF;

  v_count := array_length(v_ghost_ids, 1);

  FOREACH v_uid IN ARRAY v_ghost_ids LOOP
    PERFORM public.admin_delete_ghost_user(v_uid);
  END LOOP;

  RETURN jsonb_build_object('success', true, 'deleted_count', v_count);
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_all_ghost_users FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_all_ghost_users TO authenticated;

COMMENT ON FUNCTION public.admin_list_ghost_users IS
  'Lista cuentas fantasma (invited_at NOT NULL + last_sign_in_at NULL). Admin only.';
COMMENT ON FUNCTION public.admin_delete_ghost_user IS
  'Borra un ghost user con cleanup en cascada. Admin only. Rechaza users reales.';
COMMENT ON FUNCTION public.admin_delete_all_ghost_users IS
  'Borra todos los ghost users en batch. Admin only.';
