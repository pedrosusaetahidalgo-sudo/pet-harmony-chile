-- ==========================================================================
-- Fix trigger sync_vaccination_status() — columna fantasma
-- 2026-05-21 (bug report Pedro 2026-04-21: "vacuna no funciona")
--
-- Causa raiz del bug:
-- El trigger original (mig 20260504210000_sync_vaccination_status_on_medical_record.sql)
-- intenta hacer UPDATE pets.vaccines_up_to_date, pero esa columna NUNCA
-- existio en public.pets. Solo existe pets.vaccination_status (TEXT) que
-- fue agregada en mig 20251127153354.
--
-- Resultado: cualquier INSERT en medical_records con record_type='vacuna'
-- falla con 'column "vaccines_up_to_date" of relation "pets" does not exist'.
-- El insert entero rollback → UI ve 400 y el medical_record nunca persiste.
--
-- Fix: redefinir la funcion sync_vaccination_status() eliminando la
-- referencia a vaccines_up_to_date. Mantenemos la actualizacion de
-- vaccination_status que SI existe y es la fuente de verdad. El RPC
-- rpc_pet_health_summary (mig 20260709000000) ya deriva vaccines_up_to_date
-- como alias boolean de vaccination_status = 'up_to_date', asi que no se
-- pierde nada funcional.
--
-- Idempotente. NO aplicar automaticamente. Aplicar desde SQL Editor.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.sync_vaccination_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_vaccine_count INTEGER;
BEGIN
  IF NEW.record_type <> 'vacuna' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO recent_vaccine_count
  FROM public.medical_records
  WHERE pet_id = NEW.pet_id
    AND record_type = 'vacuna'
    AND date >= (CURRENT_DATE - INTERVAL '12 months');

  -- Solo actualizamos vaccination_status (columna que SI existe).
  -- vaccines_up_to_date se deriva en runtime via rpc_pet_health_summary.
  UPDATE public.pets
  SET vaccination_status = CASE
    WHEN recent_vaccine_count > 0 THEN 'up_to_date'
    ELSE 'pending'
  END
  WHERE id = NEW.pet_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_vaccination_status() IS
  'Sync pets.vaccination_status al insertar/actualizar medical_records. Fix 2026-05-21: removida referencia a pets.vaccines_up_to_date (columna inexistente).';

-- El trigger ya existe (DROP + CREATE para idempotencia robusta).
DROP TRIGGER IF EXISTS trigger_sync_vaccination_status ON public.medical_records;
CREATE TRIGGER trigger_sync_vaccination_status
  AFTER INSERT OR UPDATE ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_vaccination_status();

-- ========================================================================
-- SMOKE TEST INLINE (regla 9.2.1 CLAUDE.md)
-- Inserta y borra un medical_record tipo vacuna contra una mascota real
-- para ejercitar el trigger. Si las refs siguen rotas, esta migracion
-- falla AL APLICARLA (no 4 meses despues en runtime).
-- ========================================================================
DO $$
DECLARE
  v_pet_id UUID;
  v_owner_id UUID;
  v_record_id UUID;
BEGIN
  SELECT id, owner_id INTO v_pet_id, v_owner_id
  FROM public.pets
  WHERE owner_id IS NOT NULL
  LIMIT 1;

  IF v_pet_id IS NULL THEN
    RAISE NOTICE 'Smoke skipped: no hay pets con owner_id en esta DB';
    RETURN;
  END IF;

  INSERT INTO public.medical_records (
    pet_id, owner_id, record_type, title, date
  ) VALUES (
    v_pet_id, v_owner_id, 'vacuna',
    '__SMOKE_TEST__ sync_vaccination_status',
    CURRENT_DATE
  ) RETURNING id INTO v_record_id;

  -- Si el trigger fallaba por columna inexistente, ya exploto arriba.
  DELETE FROM public.medical_records WHERE id = v_record_id;

  RAISE NOTICE 'Smoke test sync_vaccination_status: OK';
END $$;
