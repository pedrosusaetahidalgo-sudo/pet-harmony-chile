-- Auto-create a pet_reminder when a vaccination record has a next_date.
-- Avoids orphan vaccines with no follow-up reminder.

CREATE OR REPLACE FUNCTION public.create_vaccine_reminder()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.record_type = 'vacuna' AND NEW.next_date IS NOT NULL AND NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.pet_reminders (pet_id, owner_id, type, title, due_date)
    VALUES (
      NEW.pet_id,
      NEW.owner_id,
      'vaccine',
      'Refuerzo: ' || COALESCE(NEW.title, 'Vacuna'),
      NEW.next_date
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_vaccine_reminder ON public.medical_records;
CREATE TRIGGER trigger_auto_vaccine_reminder
  AFTER INSERT ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.create_vaccine_reminder();
