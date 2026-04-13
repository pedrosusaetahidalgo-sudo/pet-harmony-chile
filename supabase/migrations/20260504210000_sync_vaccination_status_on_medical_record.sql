-- ============================================================
-- Sync: cuando se inserta un medical_record de tipo 'vacuna',
-- actualizar pets.vaccination_status y vaccines_up_to_date.
--
-- Logica: si la mascota tiene al menos 1 vacuna en los ultimos
-- 12 meses, se considera 'up_to_date'. Si no, 'pending'.
--
-- NO aplicar automaticamente. Aplicar en Supabase Dashboard > SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION sync_vaccination_status()
RETURNS TRIGGER AS $$
DECLARE
  recent_vaccine_count INTEGER;
BEGIN
  -- Solo actuar en registros de tipo vacuna
  IF NEW.record_type <> 'vacuna' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO recent_vaccine_count
  FROM medical_records
  WHERE pet_id = NEW.pet_id
    AND record_type = 'vacuna'
    AND date >= (CURRENT_DATE - INTERVAL '12 months');

  UPDATE pets
  SET
    vaccination_status = CASE WHEN recent_vaccine_count > 0 THEN 'up_to_date' ELSE 'pending' END,
    vaccines_up_to_date = (recent_vaccine_count > 0)
  WHERE id = NEW.pet_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_vaccination_status ON medical_records;
CREATE TRIGGER trigger_sync_vaccination_status
  AFTER INSERT OR UPDATE ON medical_records
  FOR EACH ROW
  EXECUTE FUNCTION sync_vaccination_status();
