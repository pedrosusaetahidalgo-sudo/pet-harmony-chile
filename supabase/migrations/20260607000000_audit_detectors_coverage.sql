-- ==========================================================================
-- Audit coverage: RPC para detectar users en auth sin profile
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-19):
-- El detector 'auth_users_without_profile' en auditExport.ts necesita contar
-- auth.users que no tienen fila en public.profiles (onboarding roto). Como
-- auth.users NO es accesible desde el cliente, envolvemos en RPC SECURITY
-- DEFINER que solo responde a admin.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.count_users_without_profile()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Guardia: si no es admin activo, retorna 0 (sin leak de info).
  IF NOT public.is_active_admin(auth.uid()) THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)::INT INTO v_count
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  );

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.count_users_without_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_users_without_profile() TO authenticated;

COMMENT ON FUNCTION public.count_users_without_profile() IS
  'Retorna cantidad de auth.users sin fila en public.profiles. Solo admin ve el count real; non-admin recibe 0. Usado por detector audit auth_users_without_profile.';
