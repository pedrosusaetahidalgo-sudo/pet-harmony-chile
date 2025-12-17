-- Fix security issues: Add search_path to all functions that don't have it

-- Update update_walker_rating function
CREATE OR REPLACE FUNCTION public.update_walker_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.dog_walker_profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.walk_reviews
      WHERE walker_id = NEW.walker_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.walk_reviews
      WHERE walker_id = NEW.walker_id
    )
  WHERE user_id = NEW.walker_id;
  RETURN NEW;
END;
$function$;

-- Update update_vet_rating function
CREATE OR REPLACE FUNCTION public.update_vet_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.vet_profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.vet_reviews
      WHERE vet_id = NEW.vet_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.vet_reviews
      WHERE vet_id = NEW.vet_id
    )
  WHERE user_id = NEW.vet_id;
  RETURN NEW;
END;
$function$;

-- Update update_walker_stats function
CREATE OR REPLACE FUNCTION public.update_walker_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'completado' AND OLD.status != 'completado' THEN
    UPDATE public.dog_walker_profiles
    SET total_walks = total_walks + 1
    WHERE user_id = NEW.walker_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update update_vet_stats function
CREATE OR REPLACE FUNCTION public.update_vet_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'completado' AND OLD.status != 'completado' THEN
    UPDATE public.vet_profiles
    SET total_visits = total_visits + 1
    WHERE user_id = NEW.vet_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update award_activity_points function
CREATE OR REPLACE FUNCTION public.award_activity_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  points_earned INTEGER;
BEGIN
  SELECT points INTO points_earned
  FROM public.activities
  WHERE id = NEW.activity_id;
  
  UPDATE public.user_stats
  SET total_points = total_points + points_earned
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;

-- Update award_challenge_points function
CREATE OR REPLACE FUNCTION public.award_challenge_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  points_earned INTEGER;
BEGIN
  IF NEW.completed = true AND OLD.completed = false THEN
    SELECT points INTO points_earned
    FROM public.daily_challenges
    WHERE id = NEW.challenge_id;
    
    UPDATE public.user_stats
    SET total_points = total_points + points_earned
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update create_default_user_role function
CREATE OR REPLACE FUNCTION public.create_default_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update update_adoption_interests_count function
CREATE OR REPLACE FUNCTION public.update_adoption_interests_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.adoption_posts
    SET interests_count = interests_count + 1
    WHERE id = NEW.adoption_post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.adoption_posts
    SET interests_count = GREATEST(0, interests_count - 1)
    WHERE id = OLD.adoption_post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Update update_dogsitter_rating function
CREATE OR REPLACE FUNCTION public.update_dogsitter_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.dogsitter_profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.dogsitter_reviews
      WHERE dogsitter_id = NEW.dogsitter_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.dogsitter_reviews
      WHERE dogsitter_id = NEW.dogsitter_id
    )
  WHERE user_id = NEW.dogsitter_id;
  RETURN NEW;
END;
$function$;

-- Update update_dogsitter_stats function
CREATE OR REPLACE FUNCTION public.update_dogsitter_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'completado' AND OLD.status != 'completado' THEN
    UPDATE public.dogsitter_profiles
    SET total_bookings = total_bookings + 1
    WHERE user_id = NEW.dogsitter_id;
  END IF;
  RETURN NEW;
END;
$function$;