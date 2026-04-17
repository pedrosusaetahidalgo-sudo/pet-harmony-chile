-- ==========================================================================
-- Fix: export_jobs RLS returning 403 para admins que acceden via has_role
-- (sin fila en admin_access). Unifica chequeo admin en helper SECURITY DEFINER
-- que acepta ambas fuentes: admin_access activo O user_roles con rol 'admin'.
--
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.
-- ==========================================================================

-- 1. Helper unificado para admin check (SECURITY DEFINER, bypasses RLS).
--    Mantiene retrocompatibilidad con useIsAdmin (admin_access + has_role fallback).
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = check_user_id AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = check_user_id AND role = 'admin'
    );
$$;

COMMENT ON FUNCTION public.is_admin_user IS
  'Retorna true si el usuario es admin por admin_access (nuevo) o user_roles (legacy). SECURITY DEFINER para bypass de RLS en sub-SELECTS.';

-- 2. Re-aplicar policies de export_jobs usando el helper
DROP POLICY IF EXISTS "admin_read_export_jobs" ON public.export_jobs;
DROP POLICY IF EXISTS "admin_insert_export_jobs" ON public.export_jobs;
DROP POLICY IF EXISTS "admin_update_export_jobs" ON public.export_jobs;

CREATE POLICY "admin_read_export_jobs" ON public.export_jobs
  FOR SELECT
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "admin_insert_export_jobs" ON public.export_jobs
  FOR INSERT
  WITH CHECK (
    requested_by = auth.uid() AND public.is_admin_user(auth.uid())
  );

CREATE POLICY "admin_update_export_jobs" ON public.export_jobs
  FOR UPDATE
  USING (public.is_admin_user(auth.uid()));

-- 3. Seed idempotente: garantizar que Pedro tenga admin_access activo.
--    Si la fila no existe, la crea como super_admin.
--    Si existe pero is_active=false, la reactiva (conserva el rol existente).
INSERT INTO public.admin_access (user_id, email, role, is_active)
SELECT id, email, 'super_admin', true
FROM auth.users
WHERE email = 'pedro.susaeta.hidalgo@gmail.com'
ON CONFLICT (user_id) DO UPDATE
  SET is_active = true;

-- 4. Bucket audit-exports (privado) + policies de Storage para admins.
--    El upload falla con 403 si no existe bucket o no hay policy.
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-exports', 'audit-exports', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "admin_audit_exports_read" ON storage.objects;
CREATE POLICY "admin_audit_exports_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'audit-exports' AND public.is_admin_user(auth.uid())
  );

DROP POLICY IF EXISTS "admin_audit_exports_insert" ON storage.objects;
CREATE POLICY "admin_audit_exports_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audit-exports' AND public.is_admin_user(auth.uid())
  );

DROP POLICY IF EXISTS "admin_audit_exports_update" ON storage.objects;
CREATE POLICY "admin_audit_exports_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'audit-exports' AND public.is_admin_user(auth.uid())
  );
