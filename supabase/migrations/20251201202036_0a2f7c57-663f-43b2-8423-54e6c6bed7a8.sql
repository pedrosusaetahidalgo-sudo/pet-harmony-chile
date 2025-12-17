
-- Guardian Levels (1-50) with thematic names
CREATE TABLE public.guardian_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_number integer NOT NULL UNIQUE,
  level_name text NOT NULL,
  min_points integer NOT NULL DEFAULT 0,
  max_points integer NOT NULL,
  bonus_multiplier numeric DEFAULT 1.0,
  badge_icon text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User Guardian Progress
CREATE TABLE public.user_guardian_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  current_level integer NOT NULL DEFAULT 1,
  total_paw_points integer NOT NULL DEFAULT 0,
  current_level_points integer NOT NULL DEFAULT 0,
  streak_days integer DEFAULT 0,
  last_activity_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Pet (Peludo) Progress
CREATE TABLE public.pet_paw_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id uuid NOT NULL UNIQUE REFERENCES public.pets(id) ON DELETE CASCADE,
  happiness_score integer DEFAULT 50,
  health_score integer DEFAULT 50,
  activity_score integer DEFAULT 50,
  social_score integer DEFAULT 50,
  total_walks integer DEFAULT 0,
  total_vet_visits integer DEFAULT 0,
  vaccines_up_to_date boolean DEFAULT false,
  last_walk_date date,
  last_vet_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Paw Missions (daily, weekly, story)
CREATE TABLE public.paw_missions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_type text NOT NULL CHECK (mission_type IN ('daily', 'weekly', 'story')),
  category text NOT NULL CHECK (category IN ('health', 'activity', 'community', 'exploration', 'care')),
  title text NOT NULL,
  description text NOT NULL,
  icon text,
  points_reward integer NOT NULL DEFAULT 10,
  target_action text NOT NULL,
  target_count integer NOT NULL DEFAULT 1,
  required_level integer DEFAULT 1,
  story_chapter integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User Mission Progress
CREATE TABLE public.user_mission_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL REFERENCES public.paw_missions(id) ON DELETE CASCADE,
  current_progress integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id, assigned_date)
);

-- Paw Badges
CREATE TABLE public.paw_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('health', 'activity', 'community', 'participation', 'special')),
  icon text,
  rarity text DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  unlock_condition text NOT NULL,
  unlock_value integer DEFAULT 1,
  points_bonus integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User Badges
CREATE TABLE public.user_paw_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.paw_badges(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Paw Rewards Shop
CREATE TABLE public.paw_shop_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('discount', 'visual', 'donation', 'premium')),
  points_cost integer NOT NULL,
  discount_percentage integer,
  service_type text,
  icon text,
  stock integer,
  is_active boolean DEFAULT true,
  partner_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User Redeemed Rewards
CREATE TABLE public.user_shop_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  reward_id uuid NOT NULL REFERENCES public.paw_shop_rewards(id),
  points_spent integer NOT NULL,
  redeemed_at timestamp with time zone NOT NULL DEFAULT now(),
  used_at timestamp with time zone,
  expires_at timestamp with time zone,
  redemption_code text UNIQUE
);

-- Point Transactions Log
CREATE TABLE public.paw_point_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  points_amount integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'bonus', 'penalty')),
  source_type text NOT NULL,
  source_id uuid,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guardian_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_guardian_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_paw_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paw_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paw_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_paw_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paw_shop_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shop_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paw_point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Guardian levels visible by all" ON public.guardian_levels FOR SELECT USING (true);

CREATE POLICY "Users can view their own progress" ON public.user_guardian_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_guardian_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_guardian_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Pet owners can view pet progress" ON public.pet_paw_progress FOR SELECT USING (EXISTS (SELECT 1 FROM pets WHERE pets.id = pet_paw_progress.pet_id AND pets.owner_id = auth.uid()));
CREATE POLICY "Pet owners can manage pet progress" ON public.pet_paw_progress FOR ALL USING (EXISTS (SELECT 1 FROM pets WHERE pets.id = pet_paw_progress.pet_id AND pets.owner_id = auth.uid()));

CREATE POLICY "Missions visible by all" ON public.paw_missions FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their mission progress" ON public.user_mission_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their mission progress" ON public.user_mission_progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Badges visible by all" ON public.paw_badges FOR SELECT USING (true);

CREATE POLICY "Users can view their badges" ON public.user_paw_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can award badges" ON public.user_paw_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shop rewards visible by all" ON public.paw_shop_rewards FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their redemptions" ON public.user_shop_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can redeem rewards" ON public.user_shop_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their transactions" ON public.paw_point_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions" ON public.paw_point_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to award points and update level
CREATE OR REPLACE FUNCTION public.award_paw_points(
  p_user_id uuid,
  p_points integer,
  p_source_type text,
  p_source_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_current_total integer;
  v_new_total integer;
  v_new_level integer;
  v_multiplier numeric;
BEGIN
  -- Get current multiplier from user's level
  SELECT COALESCE(gl.bonus_multiplier, 1.0) INTO v_multiplier
  FROM user_guardian_progress ugp
  LEFT JOIN guardian_levels gl ON gl.level_number = ugp.current_level
  WHERE ugp.user_id = p_user_id;

  IF v_multiplier IS NULL THEN
    v_multiplier := 1.0;
  END IF;

  -- Apply multiplier to points
  p_points := FLOOR(p_points * v_multiplier);

  -- Insert or update user progress
  INSERT INTO user_guardian_progress (user_id, total_paw_points, current_level_points, last_activity_date)
  VALUES (p_user_id, p_points, p_points, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    total_paw_points = user_guardian_progress.total_paw_points + p_points,
    current_level_points = user_guardian_progress.current_level_points + p_points,
    last_activity_date = CURRENT_DATE,
    streak_days = CASE 
      WHEN user_guardian_progress.last_activity_date = CURRENT_DATE - 1 THEN user_guardian_progress.streak_days + 1
      WHEN user_guardian_progress.last_activity_date = CURRENT_DATE THEN user_guardian_progress.streak_days
      ELSE 1
    END,
    updated_at = now();

  -- Get new total and calculate level
  SELECT total_paw_points INTO v_new_total FROM user_guardian_progress WHERE user_id = p_user_id;
  
  SELECT COALESCE(MAX(level_number), 1) INTO v_new_level 
  FROM guardian_levels 
  WHERE min_points <= v_new_total;

  -- Update level if changed
  UPDATE user_guardian_progress 
  SET current_level = v_new_level,
      current_level_points = v_new_total - COALESCE((SELECT min_points FROM guardian_levels WHERE level_number = v_new_level), 0)
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO paw_point_transactions (user_id, points_amount, transaction_type, source_type, source_id, description)
  VALUES (p_user_id, p_points, 'earn', p_source_type, p_source_id, p_description);
END;
$$;
