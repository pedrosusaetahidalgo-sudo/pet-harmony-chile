-- ==========================================================================
-- Trigger auto-recordatorio: extiende a antiparasitarios (feedback Sofia)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d INIT-07):
-- El trigger create_vaccine_reminder (mig 20260508000001) solo dispara
-- cuando record_type='vacuna'. Sofia pidio explicitamente que los
-- antiparasitarios tambien generen recordatorio automatico: "eso si
-- que se les olvida, seria bacan que les lleguen recordatorio de la
-- proxima fecha" (audits/FEEDBACK_VET_SOFIA_2026_04_13.md §3).
--
-- Esta migracion:
-- 1. Extiende el trigger para cubrir antiparasitario | desparasitacion
--    | antipulgas cuando next_date esta definida.
-- 2. Calcula next_date automatico si no se provee, respetando el caso
--    Bravecto = 3 meses (vs default externo = 1 mes).
-- 3. Mantiene compatibilidad con la logica existente de vacunas.
--
-- Idempotente: DROP FUNCTION + CREATE OR REPLACE (usa el mismo nombre
-- create_vaccine_reminder que ya existia, amplia comportamiento).
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.create_vaccine_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_due_date DATE;
  v_title TEXT;
  v_type TEXT;
  v_is_antiparasitario BOOLEAN;
BEGIN
  -- Determinar si es vacuna o antiparasitario
  v_is_antiparasitario := NEW.record_type IN ('antiparasitario', 'desparasitacion', 'antipulgas');

  IF NEW.record_type = 'vacuna' THEN
    v_type := 'vaccine';
    v_due_date := NEW.next_date;
    v_title := 'Refuerzo: ' || COALESCE(NEW.title, 'Vacuna');
  ELSIF v_is_antiparasitario THEN
    v_type := 'antiparasitic';

    -- Si el caller proveo next_date, respetarla. Si no, auto-calcular:
    -- - antiparasitic_type='interno': +3 meses desde date.
    -- - antiparasitic_type='externo': +1 mes (caso Bravecto = +3 meses).
    -- - antiparasitic_type='ambos': +1 mes (lo mas conservador).
    -- - Sin tipo: default +3 meses (interno es lo mas comun).
    IF NEW.next_date IS NOT NULL THEN
      v_due_date := NEW.next_date;
    ELSIF NEW.antiparasitic_type = 'interno' THEN
      v_due_date := NEW.date + INTERVAL '3 months';
    ELSIF NEW.antiparasitic_type = 'externo' THEN
      IF LOWER(COALESCE(NEW.product_brand, '')) LIKE '%bravecto%' THEN
        v_due_date := NEW.date + INTERVAL '3 months';  -- Caso especial Sofia
      ELSE
        v_due_date := NEW.date + INTERVAL '1 month';
      END IF;
    ELSIF NEW.antiparasitic_type = 'ambos' THEN
      v_due_date := NEW.date + INTERVAL '1 month';
    ELSE
      v_due_date := NEW.date + INTERVAL '3 months';
    END IF;

    v_title := 'Antiparasitario: ' || COALESCE(
      NEW.product_brand,
      NEW.title,
      CASE NEW.antiparasitic_type
        WHEN 'interno' THEN 'Desparasitacion interna'
        WHEN 'externo' THEN 'Desparasitacion externa'
        WHEN 'ambos'   THEN 'Desparasitacion completa'
        ELSE 'Desparasitacion'
      END
    );
  ELSE
    -- Otros tipos: no crear recordatorio
    RETURN NEW;
  END IF;

  -- Requerimos owner_id + due_date para crear reminder
  IF NEW.owner_id IS NULL OR v_due_date IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.pet_reminders (pet_id, owner_id, type, title, due_date)
  VALUES (NEW.pet_id, NEW.owner_id, v_type, v_title, v_due_date)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- El trigger ya existe (mig 20260508000001); reusa el nombre
-- trigger_auto_vaccine_reminder. Confirmamos que apunta a la nueva
-- version de la funcion.
DROP TRIGGER IF EXISTS trigger_auto_vaccine_reminder ON public.medical_records;
CREATE TRIGGER trigger_auto_vaccine_reminder
  AFTER INSERT ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.create_vaccine_reminder();

COMMENT ON FUNCTION public.create_vaccine_reminder() IS
  'Auto-crea pet_reminders para vacunas Y antiparasitarios. Antiparasitarios usan auto-calculo de next_date segun antiparasitic_type (interno=3m, externo=1m, Bravecto=3m). Feedback Sofia 2026-04-13.';
