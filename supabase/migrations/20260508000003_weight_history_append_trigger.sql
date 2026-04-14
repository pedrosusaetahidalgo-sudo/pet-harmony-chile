-- Automatically append to weight_history when pets.weight changes.
-- weight_history is a JSONB array of {date, weight} objects.

CREATE OR REPLACE FUNCTION public.append_weight_history()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.weight IS DISTINCT FROM OLD.weight AND NEW.weight IS NOT NULL THEN
    NEW.weight_history := COALESCE(OLD.weight_history, '[]'::jsonb) ||
      jsonb_build_array(jsonb_build_object('date', now()::text, 'weight', NEW.weight));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_append_weight_history ON public.pets;
CREATE TRIGGER trigger_append_weight_history
  BEFORE UPDATE ON public.pets
  FOR EACH ROW
  EXECUTE FUNCTION public.append_weight_history();
