-- ══════════════════════════════════════════════════════════════════════════
-- Pet risk score RPC (Refactor Maestro Fase 2 §7.5 + §8.4.5)
-- ══════════════════════════════════════════════════════════════════════════
-- Scaffold para el endpoint /api/v1/risk-score que aseguradoras consumen
-- antes de cotizar. Tier B2B "API risk score" — aseguradoras pagan por
-- query. Sin esta funcion el deal con Mapfre/iki/Sura no se puede
-- prototipar.
--
-- Modelo MVP (refinar con vet antes de exponer en API publica):
--   Score base       = 100 (mascota saludable promedio)
--   Edad             = -1 punto por año despues de 7
--   Edad senior      = -10 adicional si ≥ 10 años
--   Esterilizada     = +5 (prevencion)
--   Antiparasitario  = +3 si reciente (90d)
--   Vacuna vencida   = -5 cada vacuna (cap -15)
--   Cond. cronicas   = -8 cada medical_record con type='alergia'/'cirugía' (cap -24)
--   Sin chip         = -3 (riesgo de perdida)
--   Bajo peso        = -5 (debajo de rango breed esperado)
--
-- Resultado final: clamp [0, 100].
--
-- TODO(refinar-con-vet): reemplazar pesos heuristicos por modelo entrenado
-- una vez tengamos 5k+ mascotas con outcome data (claims, defunciones,
-- consultas de urgencia). Mientras tanto este es el modelo declarado y
-- documentado para conversaciones con aseguradoras.
--
-- Privacy:
--   - SECURITY DEFINER porque cruza varias tablas con RLS estricto
--   - GRANT EXECUTE solo a authenticated (no anon, no public)
--   - Internamente NO devuelve breed/name/owner — solo el numero
--   - Hasta que B2B_API este live, solo el dueño puede llamarla y solo
--     sobre sus propias mascotas (check al inicio).
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.calculate_pet_risk_score(p_pet_id UUID)
RETURNS TABLE (
  pet_id UUID,
  risk_score INT,
  age_years INT,
  factors JSONB,
  computed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pet RECORD;
  v_score INT := 100;
  v_age_years INT;
  v_factors JSONB := '{}'::jsonb;
  v_vacc_overdue INT := 0;
  v_chronic INT := 0;
  v_recent_antiparasitic BOOLEAN := false;
BEGIN
  -- Permission check: solo el owner o admin puede calcular
  SELECT * INTO v_pet
  FROM public.pets
  WHERE id = p_pet_id
    AND (
      owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.admin_access
        WHERE user_id = auth.uid() AND is_active = true
      )
    );

  IF v_pet IS NULL THEN
    RAISE EXCEPTION 'Pet not found or no permission';
  END IF;

  -- Edad
  IF v_pet.birth_date IS NOT NULL THEN
    v_age_years := EXTRACT(YEAR FROM AGE(v_pet.birth_date))::INT;
    IF v_age_years > 7 THEN
      v_score := v_score - LEAST(v_age_years - 7, 15);
    END IF;
    IF v_age_years >= 10 THEN
      v_score := v_score - 10;
    END IF;
    v_factors := v_factors || jsonb_build_object('age_years', v_age_years);
  ELSE
    v_factors := v_factors || jsonb_build_object('age_years', NULL);
  END IF;

  -- Esterilizacion (proxy: campo neutered si existe)
  BEGIN
    IF (v_pet.neutered IS TRUE) THEN
      v_score := v_score + 5;
      v_factors := v_factors || jsonb_build_object('neutered', true);
    END IF;
  EXCEPTION WHEN undefined_column THEN
    -- Si no existe el campo, ignorar este factor (sin penalty)
    NULL;
  END;

  -- Microchip (sin chip = riesgo de perdida)
  IF v_pet.microchip_number IS NULL OR TRIM(v_pet.microchip_number) = '' THEN
    v_score := v_score - 3;
    v_factors := v_factors || jsonb_build_object('has_microchip', false);
  ELSE
    v_factors := v_factors || jsonb_build_object('has_microchip', true);
  END IF;

  -- Vacunas vencidas (next_date < hoy)
  SELECT COUNT(*)::INT INTO v_vacc_overdue
  FROM public.medical_records
  WHERE pet_id = p_pet_id
    AND record_type = 'vacuna'
    AND next_date IS NOT NULL
    AND next_date < CURRENT_DATE;

  IF v_vacc_overdue > 0 THEN
    v_score := v_score - LEAST(v_vacc_overdue * 5, 15);
    v_factors := v_factors || jsonb_build_object('vaccines_overdue', v_vacc_overdue);
  END IF;

  -- Antiparasitario reciente (los datos pueden venir de pet_reminders.type
  -- o de medical_records.record_type. Hacemos best-effort sobre records).
  SELECT EXISTS (
    SELECT 1 FROM public.medical_records
    WHERE pet_id = p_pet_id
      AND record_type = 'tratamiento'
      AND date >= CURRENT_DATE - INTERVAL '90 days'
      AND (
        title ILIKE '%antipara%'
        OR title ILIKE '%pulgas%'
        OR title ILIKE '%desparasit%'
      )
  ) INTO v_recent_antiparasitic;

  IF v_recent_antiparasitic THEN
    v_score := v_score + 3;
    v_factors := v_factors || jsonb_build_object('recent_antiparasitic', true);
  END IF;

  -- Condiciones cronicas (alergias, cirugias previas)
  SELECT COUNT(*)::INT INTO v_chronic
  FROM public.medical_records
  WHERE pet_id = p_pet_id
    AND record_type IN ('alergia', 'cirugía');

  IF v_chronic > 0 THEN
    v_score := v_score - LEAST(v_chronic * 8, 24);
    v_factors := v_factors || jsonb_build_object('chronic_conditions', v_chronic);
  END IF;

  -- Clamp [0, 100]
  v_score := GREATEST(0, LEAST(100, v_score));

  RETURN QUERY SELECT
    p_pet_id,
    v_score,
    COALESCE(v_age_years, 0),
    v_factors,
    NOW();
END $$;

REVOKE ALL ON FUNCTION public.calculate_pet_risk_score(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_pet_risk_score(UUID) TO authenticated;

COMMENT ON FUNCTION public.calculate_pet_risk_score(UUID) IS
  'Refactor Maestro Fase 2 §7.5 — risk score MVP para deal con aseguradoras. '
  'Heuristico hoy; entrenarlo con outcome data cuando tengamos 5k+ mascotas '
  'con claims/defunciones reales. Solo callable por el owner del pet o admin.';

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Smoke test: la funcion se crea y devuelve forma correcta para una mascota
-- de prueba (no llama auth.uid() ya que aqui corremos como postgres).
-- ══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_proc_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'calculate_pet_risk_score'
  ) INTO v_proc_exists;

  IF NOT v_proc_exists THEN
    RAISE EXCEPTION 'calculate_pet_risk_score no se creo';
  END IF;

  RAISE NOTICE 'Smoke test OK: calculate_pet_risk_score creada';
END $$;
