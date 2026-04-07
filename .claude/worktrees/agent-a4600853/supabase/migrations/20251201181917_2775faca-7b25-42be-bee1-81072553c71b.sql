-- Add trainer to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'trainer';

-- Create trigger to update trainer ratings
CREATE OR REPLACE FUNCTION public.update_trainer_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.trainer_profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.training_reviews
      WHERE trainer_id = NEW.trainer_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.training_reviews
      WHERE trainer_id = NEW.trainer_id
    )
  WHERE user_id = NEW.trainer_id;
  RETURN NEW;
END;
$$;

-- Create trigger to update trainer stats
CREATE OR REPLACE FUNCTION public.update_trainer_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completado' AND OLD.status != 'completado' THEN
    UPDATE public.trainer_profiles
    SET total_sessions = total_sessions + 1
    WHERE user_id = NEW.trainer_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers if they don't exist
DROP TRIGGER IF EXISTS update_trainer_rating_trigger ON public.training_reviews;
CREATE TRIGGER update_trainer_rating_trigger
AFTER INSERT OR UPDATE ON public.training_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_trainer_rating();

DROP TRIGGER IF EXISTS update_trainer_stats_trigger ON public.training_bookings;
CREATE TRIGGER update_trainer_stats_trigger
AFTER UPDATE ON public.training_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_trainer_stats();