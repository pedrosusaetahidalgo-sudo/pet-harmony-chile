-- =====================================================
-- Helper: buscar usuario por email sin traer toda la tabla auth.users.
-- Usado por edge functions create-patient y send-pet-invitation.
-- Service role only (SECURITY DEFINER sobre auth.users).
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
STABLE
AS $$
  SELECT id FROM auth.users WHERE email = lower(trim(p_email)) LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_id_by_email IS
  'Returns auth.users.id for a given email, or NULL if not found. Service role only.';

-- Revocar acceso publico: solo service_role puede llamar esto
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email FROM public, anon, authenticated;
