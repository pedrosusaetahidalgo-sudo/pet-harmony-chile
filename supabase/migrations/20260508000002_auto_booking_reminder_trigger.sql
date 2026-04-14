-- Auto-create a pet_reminder when a booking is created with a pet_id and future date.

CREATE OR REPLACE FUNCTION public.create_booking_reminder()
RETURNS TRIGGER AS $$
DECLARE
  v_slot_date date;
  v_service_type text;
BEGIN
  -- Resolve slot date and service type from service_slots
  SELECT ss.slot_date, ss.service_type
  INTO v_slot_date, v_service_type
  FROM public.service_slots ss
  WHERE ss.id = NEW.slot_id;

  IF NEW.pet_id IS NOT NULL AND v_slot_date IS NOT NULL AND v_slot_date >= CURRENT_DATE THEN
    INSERT INTO public.pet_reminders (pet_id, owner_id, type, title, due_date)
    VALUES (
      NEW.pet_id,
      NEW.user_id,
      'checkup',
      'Cita: ' || COALESCE(v_service_type, 'Servicio'),
      v_slot_date
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_booking_reminder ON public.bookings;
CREATE TRIGGER trigger_auto_booking_reminder
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_booking_reminder();
