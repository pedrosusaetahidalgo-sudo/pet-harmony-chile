-- ══════════════════════════════════════════════════════════════════════════
-- Pet bootstrap + "ficha completa día 90" KPI
-- (Refactor Maestro §14.bis.3 + §14.bis.6)
-- ══════════════════════════════════════════════════════════════════════════
-- Cubre 2 de las recomendaciones del analisis critico Claude:
--
-- §14.bis.3 Tensión 3: "El dueño quiere resultados rápidos, la data tarda".
--   Mitigación: timeline no nace vacío. Al insertar pet, trigger crea evento
--   "Bienvenida a Paw Friend" en pet_timeline_events. Mascota dia-1 ya
--   tiene 1 evento visible.
--
-- §14.bis.6: "La métrica que decide si el pivote funciona" — mascotas con
--   ficha completa al cabo de 90 días. Definicion:
--     - >=10 eventos timeline en >=3 categorias distintas
--     - Pet ID Card generada
--     - (Fase 1+) Nose print capturado (opcional, no bloquea)
--
--   Threshold proyecto sano: >=50% de pets nuevas alcanzan ficha completa
--   en 90d. <20% es señal de fricción.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Trigger: evento Bienvenida al crear pet
CREATE OR REPLACE FUNCTION public.create_welcome_timeline_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo si la mascota tiene owner (las mascotas creadas por vet con
  -- pending_owner_email no necesitan welcome event hasta que sean reclamadas)
  IF NEW.owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Solo en INSERT (no UPDATE)
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.pet_timeline_events (
    pet_id, category, title, description, event_at,
    source, is_milestone, recorded_by, data
  ) VALUES (
    NEW.id,
    'milestone',
    FORMAT('%s entra a Paw Friend ✨', NEW.name),
    FORMAT(
      'Empieza la historia de %s. Acá vamos a guardar cada momento — vacunas, peso, fotos, ' ||
      'logros, hasta los pequeños detalles que hacen la diferencia.',
      NEW.name
    ),
    NOW(),
    'auto_trigger',
    TRUE,
    NEW.owner_id,
    jsonb_build_object(
      'auto_generated', true,
      'event_kind', 'welcome',
      'pet_species', NEW.species
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- No bloquear creacion de mascota si falla el evento
  RAISE WARNING 'create_welcome_timeline_event failed: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trigger_pet_welcome_event ON public.pets;
CREATE TRIGGER trigger_pet_welcome_event
  AFTER INSERT ON public.pets
  FOR EACH ROW
  EXECUTE FUNCTION public.create_welcome_timeline_event();

COMMENT ON FUNCTION public.create_welcome_timeline_event() IS
  'Refactor Maestro §14.bis.3. Crea evento timeline "Bienvenida" automatico '
  'al insertar pet con owner_id. Timeline no nace vacio.';

-- 2. RPC: pets con ficha completa
-- Definicion: >=10 eventos timeline en >=3 categorias + Pet ID Card generada
CREATE OR REPLACE FUNCTION public.count_pets_complete_ficha(
  p_within_days INT DEFAULT NULL  -- NULL = todas; 90 = solo creadas en ultimos 90d
)
RETURNS TABLE (
  pets_with_complete_ficha INT,
  pets_eligible INT,
  completion_rate_pct NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_complete INT;
  v_eligible INT;
BEGIN
  WITH pet_metrics AS (
    SELECT
      p.id,
      p.created_at,
      (
        SELECT COUNT(*)::INT
        FROM public.pet_timeline_events e
        WHERE e.pet_id = p.id
      ) AS event_count,
      (
        SELECT COUNT(DISTINCT category)::INT
        FROM public.pet_timeline_events e
        WHERE e.pet_id = p.id
      ) AS category_count,
      EXISTS (
        SELECT 1 FROM public.pet_id_cards c
        WHERE c.pet_id = p.id
      ) AS has_id_card
    FROM public.pets p
    WHERE p.lifecycle_status = 'active'
      AND p.owner_id IS NOT NULL
      AND (p_within_days IS NULL OR p.created_at >= NOW() - (p_within_days || ' days')::INTERVAL)
  )
  SELECT
    COUNT(*) FILTER (
      WHERE event_count >= 10
        AND category_count >= 3
        AND has_id_card = TRUE
    )::INT,
    COUNT(*)::INT
  INTO v_complete, v_eligible
  FROM pet_metrics;

  RETURN QUERY SELECT
    v_complete,
    v_eligible,
    CASE WHEN v_eligible > 0
      THEN ROUND((v_complete::NUMERIC / v_eligible) * 100, 1)
      ELSE 0::NUMERIC
    END;
END $$;

REVOKE ALL ON FUNCTION public.count_pets_complete_ficha(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_pets_complete_ficha(INT) TO authenticated;

COMMENT ON FUNCTION public.count_pets_complete_ficha(INT) IS
  'Refactor Maestro §14.bis.6. Cuenta pets con ficha completa: >=10 eventos '
  'timeline en >=3 categorias + Pet ID Card generada. p_within_days filtra '
  'pets creadas en ese rango (90 = norte del proyecto).';

-- 3. Extender master_kpis_daily con la metrica norte
DROP MATERIALIZED VIEW IF EXISTS public.master_kpis_daily;

CREATE MATERIALIZED VIEW public.master_kpis_daily AS
SELECT
  CURRENT_DATE AS as_of_date,

  -- ── Volumen base ───────────────────────────────────────────────────
  (SELECT COUNT(*)::INT FROM auth.users) AS users_total,
  (SELECT COUNT(*)::INT FROM auth.users WHERE last_sign_in_at >= NOW() - INTERVAL '7 days') AS users_active_7d,
  (SELECT COUNT(*)::INT FROM auth.users WHERE last_sign_in_at >= NOW() - INTERVAL '30 days') AS users_active_30d,
  (SELECT COUNT(*)::INT FROM public.pets WHERE lifecycle_status = 'active') AS pets_active,
  (SELECT COUNT(*)::INT FROM public.pets WHERE lifecycle_status = 'memorial') AS pets_memorial,

  -- ── §14.bis.6 NORTH STAR: ficha completa día 90 ────────────────────
  (SELECT pets_with_complete_ficha FROM public.count_pets_complete_ficha(90)) AS pets_complete_ficha_90d,
  (SELECT pets_eligible FROM public.count_pets_complete_ficha(90)) AS pets_eligible_90d,
  (SELECT completion_rate_pct FROM public.count_pets_complete_ficha(90)) AS completion_rate_90d_pct,

  -- ── Fase 1 KPIs ────────────────────────────────────────────────────
  (SELECT COUNT(DISTINCT pet_id)::INT FROM public.nose_prints) AS pets_with_nose_print,
  (
    SELECT COUNT(*)::INT
    FROM public.system_health_log
    WHERE function_name = 'generate-paw-passport' AND status = 'success'
  ) AS passports_generated_total,
  (
    SELECT COUNT(*)::INT
    FROM public.system_health_log
    WHERE function_name = 'generate-paw-passport' AND status = 'success'
      AND created_at >= NOW() - INTERVAL '30 days'
  ) AS passports_generated_30d,
  (SELECT COUNT(*)::INT FROM public.public_breed_stats WHERE pet_count >= 50) AS seo_landings_breed,
  (SELECT COUNT(*)::INT FROM public.public_species_stats WHERE pet_count >= 50) AS seo_landings_species,
  (
    SELECT COUNT(*)::INT FROM public.service_providers
    WHERE is_directory_visible = true AND slug IS NOT NULL
  ) AS seo_landings_vets,

  -- ── Joya de la corona ────────────────────────────────────────────
  (
    SELECT COUNT(*)::INT FROM public.pets p
    WHERE EXISTS (
      SELECT 1 FROM public.medical_records mr
      WHERE mr.pet_id = p.id
      GROUP BY mr.pet_id
      HAVING COUNT(*) >= 5
    )
  ) AS pets_complete_ficha,
  (
    SELECT COUNT(DISTINCT pet_id)::INT FROM public.medical_share_tokens
    WHERE expires_at > NOW()
  ) AS pets_with_active_share,

  -- ── Engagement medico ────────────────────────────────────────────
  (
    SELECT COUNT(*)::INT FROM public.medical_records
    WHERE created_at >= NOW() - INTERVAL '30 days'
  ) AS medical_records_30d,
  (
    SELECT COUNT(*)::INT FROM public.medical_records
    WHERE record_type = 'vacuna' AND next_date IS NOT NULL AND next_date >= CURRENT_DATE
  ) AS vaccines_up_to_date,
  (
    SELECT COUNT(*)::INT FROM public.medical_records
    WHERE record_type = 'vacuna' AND next_date IS NOT NULL AND next_date < CURRENT_DATE
  ) AS vaccines_overdue,

  -- ── Cascadas (Fase 2) ────────────────────────────────────────────
  (SELECT COUNT(*)::INT FROM public.pet_health_alerts) AS health_alerts_total,
  (SELECT COUNT(*)::INT FROM public.pet_health_alerts WHERE dismissed_at IS NULL) AS health_alerts_active,
  (
    SELECT COUNT(*)::INT FROM public.pet_health_alerts
    WHERE created_at >= NOW() - INTERVAL '7 days'
  ) AS health_alerts_created_7d,

  -- ── Research consent (Pharma deal pre-req §7.3) ──────────────────
  (SELECT COUNT(*)::INT FROM public.profiles WHERE anonymous_data_research_consent = TRUE) AS users_consent_yes,
  (SELECT COUNT(*)::INT FROM public.profiles WHERE anonymous_data_research_consent = FALSE) AS users_consent_no,
  (SELECT COUNT(*)::INT FROM public.profiles WHERE anonymous_data_research_consent IS NULL) AS users_consent_pending,

  -- ── B2B (§7.5) ────────────────────────────────────────────────────
  (SELECT COUNT(*)::INT FROM public.b2b_api_keys WHERE is_active = TRUE) AS b2b_keys_active,
  (SELECT COALESCE(SUM(total_requests), 0)::BIGINT FROM public.b2b_api_keys) AS b2b_requests_total,
  (SELECT COUNT(*)::INT FROM public.correlation_definitions WHERE status = 'published') AS correlations_published,
  (SELECT COUNT(*)::INT FROM public.correlation_definitions WHERE status = 'draft') AS correlations_draft,

  -- ── Refugios (Fase 1 §6.7) ───────────────────────────────────────
  (SELECT COUNT(*)::INT FROM public.adoption_centers WHERE status = 'active') AS shelters_active,
  (SELECT COUNT(*)::INT FROM public.adoption_followups) AS followups_total,
  (
    SELECT COUNT(*)::INT FROM public.adoption_followups WHERE response_status IS NOT NULL
  ) AS followups_responded,

  NOW() AS refreshed_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_master_kpis_daily_unique
  ON public.master_kpis_daily(as_of_date);

GRANT SELECT ON public.master_kpis_daily TO authenticated;

COMMIT;

-- Initial refresh
REFRESH MATERIALIZED VIEW public.master_kpis_daily;

-- Smoke test
DO $$
DECLARE
  v_complete INT;
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'create_welcome_timeline_event';
  IF NOT FOUND THEN RAISE EXCEPTION 'trigger fn create_welcome_timeline_event no creada'; END IF;

  PERFORM 1 FROM pg_proc WHERE proname = 'count_pets_complete_ficha';
  IF NOT FOUND THEN RAISE EXCEPTION 'count_pets_complete_ficha no creada'; END IF;

  SELECT pets_complete_ficha_90d INTO v_complete FROM public.master_kpis_daily LIMIT 1;
  IF v_complete IS NULL THEN
    RAISE EXCEPTION 'pets_complete_ficha_90d no esta en master_kpis_daily';
  END IF;

  RAISE NOTICE 'Smoke test OK: bootstrap welcome trigger + ficha completa KPI (% pets complete 90d)', v_complete;
END $$;
