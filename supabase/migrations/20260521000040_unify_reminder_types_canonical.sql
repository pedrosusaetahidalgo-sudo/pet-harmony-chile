-- ============================================================
-- Unificacion de taxonomia de pet_reminders.type (FRONTEND + TRIGGER + CHECK)
-- 2026-05-21 (plan PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN Fase 2)
--
-- Problema historico (ver plan §11.1 y §31.3):
-- 1. Frontend (AddMedicalRecord.tsx) inserta manualmente un reminder
--    con type='deworming' para CUALQUIER antiparasitario (no distingue
--    interno vs externo).
-- 2. Trigger create_vaccine_reminder (mig 20260629000000) inserta un
--    reminder con type='antiparasitic' para el mismo evento.
-- 3. CHECK constraint fue parcheado en mig 20260724000000 para aceptar
--    ambos valores ('deworming' Y 'antiparasitic'), pero eso enmascaro
--    la inconsistencia en lugar de resolverla.
--
-- Resultado actual: por cada medical_record de antiparasitario pueden
-- aparecer 2 filas en pet_reminders (una del trigger con 'antiparasitic',
-- otra del frontend con 'deworming'), o solo 1 si el ON CONFLICT del
-- trigger las deduplica. Impredecible.
--
-- Fix (esta migracion):
-- A. Back-fill: actualizar TODAS las filas existentes de pet_reminders
--    con type='antiparasitic' a type='deworming' (o type='flea' si el
--    titulo indica pulgas/garrapatas/externo).
-- B. Actualizar CHECK constraint al set canonico (con 'flea' como nuevo
--    valor y sin 'antiparasitic').
-- C. Redefinir el trigger create_vaccine_reminder() para usar
--    'deworming' (interno) o 'flea' (externo). Esto alinea con
--    src/lib/reminderTypes.ts y src/lib/frequencies.ts del frontend.
-- D. Borrar reminders duplicados (misma pet_id + type + due_date),
--    dejando el mas reciente.
--
-- NO aplicar automaticamente. El dueno aplica desde Supabase Dashboard
-- > SQL Editor. Idempotente: se puede aplicar multiples veces.
-- ============================================================

-- ---------------------------------------------------------------
-- A. Back-fill de filas existentes con 'antiparasitic'
-- ---------------------------------------------------------------

-- Marcar como 'flea' si el titulo sugiere uso externo (pulgas/
-- garrapatas/pipeta/collar). Caso contrario queda como 'deworming'.
UPDATE public.pet_reminders
SET type = 'flea'
WHERE type = 'antiparasitic'
  AND (
    LOWER(COALESCE(title, '')) LIKE '%pulga%'
    OR LOWER(COALESCE(title, '')) LIKE '%garrapata%'
    OR LOWER(COALESCE(title, '')) LIKE '%externo%'
    OR LOWER(COALESCE(title, '')) LIKE '%pipeta%'
    OR LOWER(COALESCE(title, '')) LIKE '%collar%'
  );

-- Resto de 'antiparasitic' → 'deworming' (asume interno).
UPDATE public.pet_reminders
SET type = 'deworming'
WHERE type = 'antiparasitic';

-- ---------------------------------------------------------------
-- B. Actualizar CHECK constraint
-- ---------------------------------------------------------------

ALTER TABLE public.pet_reminders
  DROP CONSTRAINT IF EXISTS pet_reminders_type_check;

ALTER TABLE public.pet_reminders
  ADD CONSTRAINT pet_reminders_type_check
  CHECK (
    type IN (
      'vaccine',
      'checkup',
      'medication',
      'grooming',
      'weight',
      'custom',
      'deworming',
      'flea',
      'dental',
      'food',
      'insurance',
      'license'
    )
  );

-- ---------------------------------------------------------------
-- C. Redefinir trigger con taxonomia canonica (usa 'deworming' o 'flea')
-- ---------------------------------------------------------------

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
  v_brand_lower TEXT;
BEGIN
  v_is_antiparasitario := NEW.record_type IN ('antiparasitario', 'desparasitacion', 'antipulgas');
  v_brand_lower := LOWER(COALESCE(NEW.product_brand, ''));

  IF NEW.record_type = 'vacuna' THEN
    v_type := 'vaccine';
    v_due_date := NEW.next_date;
    v_title := 'Refuerzo: ' || COALESCE(NEW.title, 'Vacuna');

  ELSIF v_is_antiparasitario THEN
    -- Asignar tipo canonico segun antiparasitic_type:
    -- 'externo' (pulgas/garrapatas/pipeta) → 'flea'
    -- 'interno' / 'ambos' / NULL (default) → 'deworming'
    IF NEW.antiparasitic_type = 'externo' THEN
      v_type := 'flea';
    ELSE
      v_type := 'deworming';
    END IF;

    -- Calcular due_date respetando next_date del user, con auto-calculo
    -- alineado a src/lib/frequencies.ts del frontend:
    --  - interno / ambos / null → +3 meses
    --  - externo → +1 mes (excepto Bravecto / Nexgard Spectra → +3 meses)
    IF NEW.next_date IS NOT NULL THEN
      v_due_date := NEW.next_date;
    ELSIF NEW.antiparasitic_type = 'externo' THEN
      IF v_brand_lower LIKE '%bravecto%' OR v_brand_lower LIKE '%nexgard spectra%' THEN
        v_due_date := NEW.date + INTERVAL '3 months';
      ELSE
        v_due_date := NEW.date + INTERVAL '1 month';
      END IF;
    ELSE
      v_due_date := NEW.date + INTERVAL '3 months';
    END IF;

    v_title := 'Antiparasitario: ' || COALESCE(
      NEW.product_brand,
      NEW.title,
      CASE NEW.antiparasitic_type
        WHEN 'interno' THEN 'Desparasitacion interna'
        WHEN 'externo' THEN 'Pulgas y garrapatas'
        WHEN 'ambos'   THEN 'Desparasitacion completa'
        ELSE 'Desparasitacion'
      END
    );
  ELSE
    -- Otros record_type: sin reminder automatico.
    RETURN NEW;
  END IF;

  IF NEW.owner_id IS NULL OR v_due_date IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.pet_reminders (pet_id, owner_id, type, title, due_date)
  VALUES (NEW.pet_id, NEW.owner_id, v_type, v_title, v_due_date)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_vaccine_reminder() IS
  'Auto-crea pet_reminders con tipo canonico (vaccine|deworming|flea). Unificado 2026-05-21. Ver src/lib/frequencies.ts para misma logica en frontend.';

-- ---------------------------------------------------------------
-- D. Deduplicar reminders redundantes (misma pet + type + due_date)
--    que hayan quedado despues del back-fill. Mantiene el mas reciente.
-- ---------------------------------------------------------------

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY pet_id, type, due_date
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM public.pet_reminders
  WHERE is_completed = FALSE
)
DELETE FROM public.pet_reminders pr
USING ranked
WHERE pr.id = ranked.id
  AND ranked.rn > 1;
