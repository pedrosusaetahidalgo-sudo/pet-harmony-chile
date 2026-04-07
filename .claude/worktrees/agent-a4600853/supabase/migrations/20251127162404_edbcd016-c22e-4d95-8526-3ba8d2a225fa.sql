-- Función para actualizar contador de intereses
CREATE OR REPLACE FUNCTION public.update_adoption_interests_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Trigger para actualizar contador de intereses
CREATE TRIGGER update_interests_count_trigger
AFTER INSERT OR DELETE ON public.adoption_interests
FOR EACH ROW
EXECUTE FUNCTION public.update_adoption_interests_count();