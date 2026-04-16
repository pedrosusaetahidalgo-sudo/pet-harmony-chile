-- Fix: feedback_in_app admin policy fails with 403 because the
-- sub-SELECT on admin_access is blocked by admin_access's own RLS.
-- Solution: use a SECURITY DEFINER function that bypasses RLS.
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.

-- 1. Create helper function (bypasses RLS on admin_access)
CREATE OR REPLACE FUNCTION public.is_active_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = check_user_id
      AND is_active = true
  );
$$;

-- 2. Replace the broken feedback admin policy
DROP POLICY IF EXISTS "feedback_admin_all" ON public.feedback_in_app;
CREATE POLICY "feedback_admin_all"
  ON public.feedback_in_app FOR ALL
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));
