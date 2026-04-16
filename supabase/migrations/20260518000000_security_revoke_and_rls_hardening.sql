-- =====================================================
-- Security hardening: REVOKE vulnerable RPCs + RLS fix
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.
-- =====================================================

-- S2: REVOKE get_medical_summary_data — solo callable via service_role (edge function)
-- La edge function generate-medical-summary ya valida ownership antes de llamar esta RPC.
REVOKE EXECUTE ON FUNCTION public.get_medical_summary_data(UUID, TEXT) FROM public, anon, authenticated;

-- S3: REVOKE upsert_lead_vet — solo callable via service_role (pipeline Python)
REVOKE EXECUTE ON FUNCTION public.upsert_lead_vet(JSONB) FROM public, anon, authenticated;

-- S4: REVOKE is_super_admin — previene enumeracion de admins
REVOKE EXECUTE ON FUNCTION public.is_super_admin(UUID) FROM public, anon, authenticated;

-- S5: Profiles phone column — crear vista publica sin campos sensibles
-- En vez de cambiar la politica SELECT (rompe muchos joins), restringimos via RLS policy
-- que solo el propio usuario pueda ver su phone.
-- Nota: la politica actual es USING(true) para SELECT, lo cual es necesario para que
-- otros usuarios vean display_name/avatar en el feed. El fix correcto es usar una vista.
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT
  id, display_name, avatar_url, bio, level, points,
  is_premium, plan_id, created_at, is_demo
FROM public.profiles;

-- Dar acceso a la vista
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Comentario para documentar
COMMENT ON VIEW public.profiles_public IS 'Vista publica de profiles sin campos sensibles (phone, plan_expires_at). Usar en queries donde no se necesita info privada.';

-- S6: check_contact_exists — restringir a authenticated (era callable por anon)
-- Solo aplicar si la funcion existe (depende de migracion 20260516200000)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'check_contact_exists'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.check_contact_exists(TEXT, TEXT) FROM public, anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.check_contact_exists(TEXT, TEXT) TO authenticated';
  END IF;
END;
$$;
