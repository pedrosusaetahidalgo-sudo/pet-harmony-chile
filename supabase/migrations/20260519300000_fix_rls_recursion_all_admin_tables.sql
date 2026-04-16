-- ══════════════════════════════════════════════════════════════
-- Fix RLS recursion on ALL admin tables
-- All these policies do direct EXISTS on admin_access which
-- causes infinite recursion because admin_access has its own RLS.
-- Replace with is_active_admin() SECURITY DEFINER helper.
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.
-- ══════════════════════════════════════════════════════════════

-- Ensure helper exists (idempotent)
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

-- ────────────────────────────────────────────────────────
-- 1. admin_audit_log
-- ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can read audit log" ON public.admin_audit_log;
CREATE POLICY "Admin can read audit log"
  ON public.admin_audit_log FOR SELECT
  USING (public.is_active_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can insert audit log" ON public.admin_audit_log;
CREATE POLICY "Admin can insert audit log"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (public.is_active_admin(auth.uid()));

-- ────────────────────────────────────────────────────────
-- 2. system_health_log
-- ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can read health logs" ON public.system_health_log;
CREATE POLICY "Admin can read health logs"
  ON public.system_health_log FOR SELECT
  USING (public.is_active_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can insert health logs" ON public.system_health_log;
CREATE POLICY "Admin can insert health logs"
  ON public.system_health_log FOR INSERT
  WITH CHECK (public.is_active_admin(auth.uid()));

-- ────────────────────────────────────────────────────────
-- 3. vet_verification_results
-- ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage vet verification results" ON public.vet_verification_results;
CREATE POLICY "Admin can manage vet verification results"
  ON public.vet_verification_results FOR ALL
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

-- ────────────────────────────────────────────────────────
-- 4. content_reports (also was missing is_active check)
-- ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage reports" ON public.content_reports;
CREATE POLICY "Admins can manage reports"
  ON public.content_reports FOR ALL
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

-- ────────────────────────────────────────────────────────
-- 5. error_logs
-- ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage error logs" ON public.error_logs;
CREATE POLICY "Admin can manage error logs"
  ON public.error_logs FOR ALL
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));

-- ────────────────────────────────────────────────────────
-- 6. analytics_events
-- ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can read analytics" ON public.analytics_events;
CREATE POLICY "Admin can read analytics"
  ON public.analytics_events FOR SELECT
  USING (public.is_active_admin(auth.uid()));


-- ══════════════════════════════════════════════════════════════
-- RPC: approve_verification_request (atomic verify + grant role)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.approve_verification_request(
  p_request_id UUID,
  p_reviewer_id UUID,
  p_status TEXT,   -- 'approved' or 'rejected'
  p_user_id UUID,  -- the user being verified
  p_role TEXT      -- the role to grant (only used if approved)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin
  IF NOT is_active_admin(p_reviewer_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Update verification request
  UPDATE verification_requests
  SET status = p_status,
      reviewed_at = now(),
      reviewed_by = p_reviewer_id
  WHERE id = p_request_id;

  -- Grant role only if approved
  IF p_status = 'approved' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, p_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN TRUE;
END;
$$;


-- ══════════════════════════════════════════════════════════════
-- RPC: get_follow_status (replaces 4 sequential queries)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_follow_status(
  p_viewer_id UUID,
  p_target_id UUID
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'is_following', EXISTS(
      SELECT 1 FROM user_follows
      WHERE follower_id = p_viewer_id AND following_id = p_target_id
    ),
    'is_followed_by', EXISTS(
      SELECT 1 FROM user_follows
      WHERE follower_id = p_target_id AND following_id = p_viewer_id
    ),
    'follower_count', (
      SELECT COUNT(*) FROM user_follows WHERE following_id = p_target_id
    ),
    'following_count', (
      SELECT COUNT(*) FROM user_follows WHERE follower_id = p_target_id
    )
  );
$$;


-- ══════════════════════════════════════════════════════════════
-- RPC: get_provider_dashboard_stats (replaces 6 parallel queries)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_provider_dashboard_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id UUID;
  v_unique_patients INT;
  v_notes_this_month INT;
  v_shared_fichas INT;
  v_bookings_completed INT;
  v_bookings_revenue NUMERIC;
  v_avg_rating NUMERIC;
  v_review_count INT;
  v_pending_invitations INT;
BEGIN
  -- Get provider ID
  SELECT id INTO v_provider_id
  FROM service_providers
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_provider_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_a_provider');
  END IF;

  -- Unique patients (distinct pet_id from clinical notes)
  SELECT COUNT(DISTINCT pet_id) INTO v_unique_patients
  FROM vet_clinical_notes
  WHERE provider_id = v_provider_id;

  -- Notes this month
  SELECT COUNT(*) INTO v_notes_this_month
  FROM vet_clinical_notes
  WHERE provider_id = v_provider_id
    AND created_at >= date_trunc('month', now());

  -- Shared fichas (active share tokens)
  SELECT COUNT(*) INTO v_shared_fichas
  FROM medical_share_tokens
  WHERE created_by = p_user_id
    AND expires_at > now();

  -- Bookings completed + revenue this month
  SELECT
    COUNT(*),
    COALESCE(SUM(total_price), 0)
  INTO v_bookings_completed, v_bookings_revenue
  FROM vet_bookings
  WHERE provider_id = v_provider_id
    AND status IN ('completado', 'completed')
    AND created_at >= date_trunc('month', now());

  -- Reviews
  SELECT
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO v_avg_rating, v_review_count
  FROM service_reviews
  WHERE provider_id = v_provider_id;

  -- Pending review invitations
  SELECT COUNT(*) INTO v_pending_invitations
  FROM review_invitations
  WHERE provider_id = v_provider_id
    AND is_used = false;

  RETURN jsonb_build_object(
    'unique_patients', v_unique_patients,
    'notes_this_month', v_notes_this_month,
    'shared_fichas', v_shared_fichas,
    'bookings_completed', v_bookings_completed,
    'bookings_revenue', v_bookings_revenue,
    'avg_rating', ROUND(v_avg_rating, 1),
    'review_count', v_review_count,
    'pending_invitations', v_pending_invitations
  );
END;
$$;
