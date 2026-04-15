-- =====================================================
-- Fix: award_points_atomic references point_transactions
-- which does not exist. Correct table is paw_point_transactions
-- with columns: points_amount, source_type, description
-- =====================================================

CREATE OR REPLACE FUNCTION public.award_points_atomic(
  p_user_id UUID,
  p_points INT,
  p_action TEXT,
  p_transaction_type TEXT DEFAULT 'earn'
)
RETURNS TABLE(awarded BOOLEAN, points INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total INT;
BEGIN
  INSERT INTO user_stats (user_id, total_points)
  VALUES (p_user_id, p_points)
  ON CONFLICT (user_id) DO UPDATE
    SET total_points = user_stats.total_points + p_points;

  SELECT total_points INTO v_new_total
  FROM user_stats WHERE user_id = p_user_id;

  INSERT INTO paw_point_transactions (user_id, points_amount, transaction_type, source_type, description)
  VALUES (p_user_id, p_points, p_transaction_type, p_action, p_action);

  RETURN QUERY SELECT true, v_new_total;
END;
$$;
