-- ============================================
-- GAMIFICATION SYSTEM
-- ============================================

-- Add gamification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_bookings INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_posts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_adoptions INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_lost_pet_help INTEGER NOT NULL DEFAULT 0;

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- e.g., 'first_booking', 'pet_hero'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- emoji or icon name
  points_reward INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL, -- 'booking', 'social', 'adoption', 'help', 'milestone'
  requirement_value INTEGER, -- e.g., 10 bookings, 5 reviews
  requirement_type TEXT, -- 'count', 'single', 'streak'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user achievements table (tracks which users have which achievements)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create missions table
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- e.g., 'daily_book_service', 'weekly_write_reviews'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  mission_type TEXT NOT NULL, -- 'daily', 'weekly', 'special'
  action_type TEXT NOT NULL, -- 'booking', 'review', 'post', 'adoption', 'lost_pet'
  target_count INTEGER NOT NULL DEFAULT 1,
  points_reward INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user missions table (tracks user progress on missions)
CREATE TABLE IF NOT EXISTS public.user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, mission_id)
);

-- Create points history table (audit trail)
CREATE TABLE IF NOT EXISTS public.points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL, -- can be negative for deductions
  action_type TEXT NOT NULL, -- 'booking', 'review', 'post', 'achievement', 'mission', 'adoption', 'lost_pet'
  action_id UUID, -- reference to the action (booking_id, review_id, etc.)
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON public.user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_mission_id ON public.user_missions(mission_id);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON public.points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON public.points_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Achievements are visible to everyone"
  ON public.achievements FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own points history"
  ON public.points_history FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for missions
CREATE POLICY "Active missions are visible to everyone"
  ON public.missions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their own missions"
  ON public.user_missions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own mission progress"
  ON public.user_missions FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (code, name, description, icon, points_reward, category, requirement_type, requirement_value) VALUES
  ('first_booking', 'Primera Reserva', 'Completa tu primera reserva de servicio', '🎉', 50, 'booking', 'single', 1),
  ('booking_master', 'Maestro de Reservas', 'Completa 10 reservas', '📅', 100, 'booking', 'count', 10),
  ('booking_expert', 'Experto en Reservas', 'Completa 50 reservas', '⭐', 500, 'booking', 'count', 50),
  ('first_review', 'Primera Reseña', 'Escribe tu primera reseña', '✍️', 25, 'social', 'single', 1),
  ('review_master', 'Maestro de Reseñas', 'Escribe 10 reseñas', '📝', 100, 'social', 'count', 10),
  ('social_butterfly', 'Mariposa Social', 'Publica 20 posts', '🦋', 200, 'social', 'count', 20),
  ('pet_hero', 'Héroe de Mascotas', 'Ayuda a encontrar 5 mascotas perdidas', '🦸', 500, 'help', 'count', 5),
  ('adoption_angel', 'Ángel de Adopción', 'Ayuda con 3 adopciones', '👼', 300, 'adoption', 'count', 3),
  ('level_5', 'Nivel 5', 'Alcanza el nivel 5', '🏆', 200, 'milestone', 'single', 5),
  ('level_10', 'Nivel 10', 'Alcanza el nivel 10', '💎', 500, 'milestone', 'single', 10),
  ('level_20', 'Nivel 20', 'Alcanza el nivel 20', '👑', 1000, 'milestone', 'single', 20)
ON CONFLICT (code) DO NOTHING;

-- Insert default daily missions
INSERT INTO public.missions (code, name, description, mission_type, action_type, target_count, points_reward) VALUES
  ('daily_book_service', 'Reserva Diaria', 'Reserva un servicio hoy', 'daily', 'booking', 1, 50),
  ('daily_write_review', 'Reseña Diaria', 'Escribe una reseña hoy', 'daily', 'review', 1, 25),
  ('daily_post', 'Post Diario', 'Publica un post hoy', 'daily', 'post', 1, 10),
  ('weekly_book_services', 'Reservas Semanales', 'Reserva 3 servicios esta semana', 'weekly', 'booking', 3, 150),
  ('weekly_write_reviews', 'Reseñas Semanales', 'Escribe 3 reseñas esta semana', 'weekly', 'review', 3, 75),
  ('weekly_help_lost_pet', 'Ayuda Semanal', 'Ayuda con una mascota perdida esta semana', 'weekly', 'lost_pet', 1, 75)
ON CONFLICT (code) DO NOTHING;

-- Function to calculate level from points
CREATE OR REPLACE FUNCTION public.calculate_level(points INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Level formula: level = floor(sqrt(points / 100)) + 1
  -- This means:
  -- Level 1: 0-99 points
  -- Level 2: 100-399 points
  -- Level 3: 400-899 points
  -- Level 4: 900-1599 points
  -- etc.
  RETURN FLOOR(SQRT(GREATEST(points, 0) / 100.0))::INTEGER + 1;
END;
$$;

-- Function to get points needed for next level
CREATE OR REPLACE FUNCTION public.points_for_next_level(current_level INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Points needed for level N = (N-1)^2 * 100
  RETURN (current_level * current_level * 100);
END;
$$;

-- Function to award points (with premium 2x multiplier)
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_action_type TEXT,
  p_action_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_points INTEGER;
  v_new_level INTEGER;
  v_old_level INTEGER;
  v_is_premium BOOLEAN;
  v_premium_end_date TIMESTAMPTZ;
  v_actual_points INTEGER;
BEGIN
  -- Check if user is premium and has active subscription
  SELECT is_premium, premium_end_date INTO v_is_premium, v_premium_end_date
  FROM public.profiles
  WHERE id = p_user_id;

  -- Apply 2x multiplier if premium is active
  IF v_is_premium AND (v_premium_end_date IS NULL OR v_premium_end_date > now()) THEN
    v_actual_points := p_points * 2;
  ELSE
    v_actual_points := p_points;
  END IF;

  -- Get current points and level
  SELECT points, level INTO v_new_points, v_old_level
  FROM public.profiles
  WHERE id = p_user_id;

  -- Add points
  v_new_points := COALESCE(v_new_points, 0) + v_actual_points;
  
  -- Calculate new level
  v_new_level := public.calculate_level(v_new_points);

  -- Update profile
  UPDATE public.profiles
  SET 
    points = v_new_points,
    level = v_new_level,
    updated_at = now()
  WHERE id = p_user_id;

  -- Record in history (store actual points awarded, not base)
  INSERT INTO public.points_history (user_id, points, action_type, action_id, description)
  VALUES (
    p_user_id, 
    v_actual_points, 
    p_action_type, 
    p_action_id, 
    COALESCE(p_description, '') || CASE 
      WHEN v_is_premium AND (v_premium_end_date IS NULL OR v_premium_end_date > now()) 
      THEN ' (Premium 2x)' 
      ELSE '' 
    END
  );

  -- Check for level up achievements
  IF v_new_level > v_old_level THEN
    -- Check if user has level achievements
    INSERT INTO public.user_achievements (user_id, achievement_id)
    SELECT p_user_id, a.id
    FROM public.achievements a
    WHERE a.code IN ('level_5', 'level_10', 'level_20')
      AND a.requirement_value = v_new_level
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements ua
        WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
      );
  END IF;
END;
$$;

-- Trigger to update level when points change
CREATE OR REPLACE FUNCTION public.update_level_on_points_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.level := public.calculate_level(NEW.points);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_level
  BEFORE UPDATE OF points ON public.profiles
  FOR EACH ROW
  WHEN (OLD.points IS DISTINCT FROM NEW.points)
  EXECUTE FUNCTION public.update_level_on_points_change();

