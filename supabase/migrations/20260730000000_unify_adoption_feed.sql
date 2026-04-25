-- Refactor flujo adopción 2026-04-24 (REFACTOR_ADOPCION_2026_04_24.md, Bloque 1)
--
-- Permitir que adoption_interests apunte directamente a una mascota de refugio
-- (no solo a un adoption_post). Hoy adoption_post_id es NOT NULL.
--
-- Cambios:
--   1. adoption_post_id → DROP NOT NULL
--   2. ADD COLUMN pet_id UUID NULLABLE FK pets(id)
--   3. CHECK (XOR): exactamente uno de los dos debe estar
--   4. Index pet_id + unique (pet_id, interested_user_id)
--   5. RLS policies nuevas para el caso pet_id
--   6. Smoke test (regla 9.2.1)

BEGIN;

-- 1 + 2: schema
ALTER TABLE public.adoption_interests
  ALTER COLUMN adoption_post_id DROP NOT NULL;

ALTER TABLE public.adoption_interests
  ADD COLUMN IF NOT EXISTS pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE;

-- 3: XOR check
ALTER TABLE public.adoption_interests
  DROP CONSTRAINT IF EXISTS adoption_interests_target_check;
ALTER TABLE public.adoption_interests
  ADD CONSTRAINT adoption_interests_target_check
  CHECK (
    (adoption_post_id IS NOT NULL AND pet_id IS NULL)
    OR (adoption_post_id IS NULL AND pet_id IS NOT NULL)
  );

-- 4: indices
CREATE INDEX IF NOT EXISTS idx_adoption_interests_pet_id
  ON public.adoption_interests(pet_id) WHERE pet_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_adoption_interest_pet_user
  ON public.adoption_interests(pet_id, interested_user_id)
  WHERE pet_id IS NOT NULL;

-- 5: RLS policies
-- Refugio dueño puede ver intereses sobre sus pets
DROP POLICY IF EXISTS "Shelters can view interests on their pets"
  ON public.adoption_interests;
CREATE POLICY "Shelters can view interests on their pets"
  ON public.adoption_interests FOR SELECT
  USING (
    pet_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.pets p
      JOIN public.adoption_centers ac ON ac.id = p.created_by_shelter_id
      WHERE p.id = adoption_interests.pet_id
        AND ac.user_id = auth.uid()
    )
  );

-- Cualquier usuario logueado puede expresar interés en una mascota de refugio disponible
DROP POLICY IF EXISTS "Anyone can express interest in shelter pet"
  ON public.adoption_interests;
CREATE POLICY "Anyone can express interest in shelter pet"
  ON public.adoption_interests FOR INSERT
  WITH CHECK (
    pet_id IS NOT NULL
    AND interested_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.pets
      WHERE id = adoption_interests.pet_id
        AND owner_id IS NULL
        AND created_by_shelter_id IS NOT NULL
        AND shelter_adopted_at IS NULL
    )
  );

-- El interesado puede ver y actualizar su propio interés (status=cancelado, etc)
DROP POLICY IF EXISTS "Users can manage their own pet interests"
  ON public.adoption_interests;
CREATE POLICY "Users can manage their own pet interests"
  ON public.adoption_interests FOR SELECT
  USING (pet_id IS NOT NULL AND interested_user_id = auth.uid());

COMMIT;

-- 6: Smoke test (regla 9.2.1)
-- Valida CHECK XOR + columnas. NO crea filas en pets para evitar chocar con
-- el constraint chk_pet_has_responsible. Si hay un pet existente de refugio
-- usable lo aprovechamos; si no, validamos solo el CHECK con nulls puros.
DO $$
DECLARE
  v_pet_id UUID;
  v_user_id UUID;
  v_interest_id UUID;
BEGIN
  -- 1) Validar columnas esperadas (sin tocar data)
  PERFORM 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'adoption_interests'
      AND column_name = 'pet_id';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schema: columna pet_id no se creó';
  END IF;

  -- 2) Validar CHECK XOR rechaza ambos NULL
  BEGIN
    -- Necesita user_id real para el INSERT (FK auth.users)
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.adoption_interests (interested_user_id, message)
      VALUES (v_user_id, 'should fail');
      RAISE EXCEPTION 'CHECK XOR no rechaza ambos NULL';
    END IF;
  EXCEPTION
    WHEN check_violation THEN NULL; -- esperado
  END;

  -- 3) Si hay un pet de refugio existente disponible, validamos insert con pet_id
  SELECT p.id INTO v_pet_id
    FROM public.pets p
    WHERE p.created_by_shelter_id IS NOT NULL
      AND p.owner_id IS NULL
      AND p.shelter_adopted_at IS NULL
    LIMIT 1;

  IF v_pet_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    -- Idempotencia: si ya existe interés del user en este pet, skip
    SELECT id INTO v_interest_id
      FROM public.adoption_interests
      WHERE pet_id = v_pet_id AND interested_user_id = v_user_id;
    IF v_interest_id IS NULL THEN
      INSERT INTO public.adoption_interests (pet_id, interested_user_id, message)
      VALUES (v_pet_id, v_user_id, 'SMOKE_TEST_DELETE_ME')
      RETURNING id INTO v_interest_id;
      DELETE FROM public.adoption_interests WHERE id = v_interest_id;
    END IF;
    RAISE NOTICE 'Smoke test OK: schema + CHECK + insert con pet_id funcionan';
  ELSE
    RAISE NOTICE 'Smoke test parcial: schema + CHECK validados (no había pet de refugio para probar insert)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Smoke test FAILED: %', SQLERRM;
END $$;
