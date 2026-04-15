-- =====================================================
-- Fix: admin_access RLS "Super admin full access" policy
-- causes infinite recursion (sub-SELECT on same table).
-- Solution: helper function with SECURITY DEFINER that
-- bypasses RLS to check admin status.
-- =====================================================

-- 1. Create helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
IMMUTABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = check_user_id
      AND role = 'super_admin'
      AND is_active = true
  );
$$;

-- 2. Replace recursive policy with function-based one
DROP POLICY IF EXISTS "Super admin full access on admin_access" ON public.admin_access;
CREATE POLICY "Super admin full access on admin_access"
  ON public.admin_access FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- Policy "Admin can read own access" stays unchanged (no recursion)
