-- ============================================================
-- Auto-reminder para el owner cuando un booking es confirmado
-- 2026-05-21 (plan PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN §24.3, §32.1.7)
--
-- Problema (plan §4, gap detectado):
-- Hoy, cuando un vet_booking pasa a status='confirmado' (sea por
-- auto_confirm_booking o por confirmacion manual del provider), el
-- owner NO recibe un reminder automatico 24h antes de la cita. Tiene
-- que acordarse o esperar al WhatsApp/push externo.
--
-- Fix: nuevo trigger AFTER UPDATE sobre vet_bookings que, cuando el
-- status pasa a 'confirmado', inserta un pet_reminder para el owner
-- con due_date = (scheduled_at - 24h). El reminder-cron ya existente
-- se encarga de enviar el WhatsApp / push cuando se acerque la fecha.
--
-- Idempotente: usa ON CONFLICT DO NOTHING si ya existe reminder para
-- la misma mascota + 'checkup' + la misma fecha (cubre reschedules
-- que re-disparan el trigger).
--
-- NO aplicar automaticamente. Dueno aplica desde SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_booking_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_due TIMESTAMPTZ;
  v_due_date DATE;
  v_provider_name TEXT;
  v_title TEXT;
BEGIN
  -- Solo disparar cuando el status pasa a 'confirmado' desde otro estado.
  -- En INSERTs directos con status='confirmado' tambien aplica (OLD es NULL).
  IF (TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status) THEN
    RETURN NEW;
  END IF;

  IF NEW.status <> 'confirmado' THEN
    RETURN NEW;
  END IF;

  -- vet_bookings tiene columnas owner_id y pet_id (singular).
  IF NEW.pet_id IS NULL OR NEW.owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Due: 24h antes de scheduled_date. Si la cita es en <24h o en el pasado,
  -- no creamos reminder (seria pasado al momento del INSERT).
  v_due := NEW.scheduled_date - INTERVAL '1 day';
  IF v_due <= NOW() THEN
    RETURN NEW;
  END IF;

  v_due_date := v_due::DATE;

  -- Nombre del profesional para el titulo. service_provider_id puede ser
  -- NULL en bookings V1 legacy; cubrimos con fallback.
  IF NEW.service_provider_id IS NOT NULL THEN
    SELECT COALESCE(display_name, business_name, 'tu profesional')
      INTO v_provider_name
    FROM public.service_providers
    WHERE id = NEW.service_provider_id;
  END IF;

  v_title := 'Cita con ' || COALESCE(v_provider_name, 'tu profesional');

  INSERT INTO public.pet_reminders (pet_id, owner_id, type, title, due_date)
  VALUES (NEW.pet_id, NEW.owner_id, 'checkup', v_title, v_due_date)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_booking_reminder() IS
  'Crea un pet_reminder (type=checkup) 24h antes de una cita confirmada. Ver plan PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN §24.3.';

-- Drop + create para idempotencia
DROP TRIGGER IF EXISTS trigger_booking_reminder_on_confirm ON public.vet_bookings;
CREATE TRIGGER trigger_booking_reminder_on_confirm
  AFTER INSERT OR UPDATE OF status ON public.vet_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_booking_reminder();
