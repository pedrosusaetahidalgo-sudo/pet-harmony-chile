-- Enhance feedback_in_app for admin responses, likes, and paw points rewards
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.

-- Add columns for admin interaction
ALTER TABLE feedback_in_app
  ADD COLUMN IF NOT EXISTS admin_response TEXT,
  ADD COLUMN IF NOT EXISTS admin_responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_liked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS paw_points_awarded INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_display_name TEXT; -- denormalized for admin convenience

-- Index for quick admin filtering
CREATE INDEX IF NOT EXISTS idx_feedback_in_app_liked
  ON feedback_in_app(admin_liked) WHERE admin_liked = true;

-- RPC: Admin awards paw points for quality feedback (atomic)
CREATE OR REPLACE FUNCTION public.admin_award_feedback_points(
  p_feedback_id UUID,
  p_user_id UUID,
  p_points INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate admin
  IF NOT EXISTS (SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- Update feedback record
  UPDATE feedback_in_app
  SET paw_points_awarded = paw_points_awarded + p_points,
      updated_at = now()
  WHERE id = p_feedback_id;

  -- Award points atomically via existing RPC logic
  INSERT INTO paw_point_transactions (user_id, points_amount, transaction_type, source_type, description)
  VALUES (p_user_id, p_points, 'bonus', 'feedback_reward', 'Recompensa por feedback de calidad');

  INSERT INTO user_guardian_progress (user_id, total_paw_points)
  VALUES (p_user_id, p_points)
  ON CONFLICT (user_id)
  DO UPDATE SET total_paw_points = user_guardian_progress.total_paw_points + EXCLUDED.total_paw_points;

  RETURN TRUE;
END;
$$;
