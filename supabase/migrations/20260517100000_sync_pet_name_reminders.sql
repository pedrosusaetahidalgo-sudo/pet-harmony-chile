-- ==============================================================
-- Sync del nombre de la mascota en recordatorios
-- ==============================================================
-- Problema:
--   Los pet_reminders se crean con titulos tipo "Vacuna antirrábica de ema2"
--   (embebiendo el nombre de la mascota). Si el dueno renombra la mascota,
--   los recordatorios quedan con el nombre viejo.
--
-- Solucion:
--   1. Backfill: resincronizar titulos existentes con el nombre actual de la mascota.
--   2. Trigger AFTER UPDATE OF name ON pets: mantener titulos actualizados
--      cada vez que el dueno cambie el nombre.
-- ==============================================================

-- 1) Backfill one-shot: rewrite " de X" suffix with current pet name.
--    Solo toca reminders cuyo titulo termina con " de <algo>" (patron generado por el trigger
--    create_default_reminders_for_new_pet y por el frontend AddPet.tsx).
--    No toca titulos que el usuario escribio manualmente sin este patron.
UPDATE pet_reminders r
SET title = regexp_replace(r.title, ' de .+$', ' de ' || p.name)
FROM pets p
WHERE r.pet_id = p.id
  AND r.title ~ ' de .+$'
  AND r.title <> regexp_replace(r.title, ' de .+$', ' de ' || p.name);

-- 2) Trigger para futuros renames
CREATE OR REPLACE FUNCTION public.sync_pet_name_in_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo ejecutar si el nombre realmente cambio
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    -- Actualiza titulos que embeben el nombre antiguo al final (" de <OLD.name>")
    UPDATE pet_reminders
    SET title = regexp_replace(title, ' de ' || regexp_replace(OLD.name, '([.*+?|(){}\[\]\\^$])', '\\\1', 'g') || '$', ' de ' || NEW.name)
    WHERE pet_id = NEW.id
      AND title ~ (' de ' || regexp_replace(OLD.name, '([.*+?|(){}\[\]\\^$])', '\\\1', 'g') || '$');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_pet_name_reminders ON public.pets;
CREATE TRIGGER trg_sync_pet_name_reminders
  AFTER UPDATE OF name ON public.pets
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_pet_name_in_reminders();

COMMENT ON FUNCTION public.sync_pet_name_in_reminders() IS
  'Al renombrar una mascota, actualiza los pet_reminders que embeben el nombre antiguo al final del titulo (" de <OLD.name>").';
