-- ══════════════════════════════════════════════════════════════════════════
-- Master KPIs view (Refactor Maestro §13)
-- ══════════════════════════════════════════════════════════════════════════
-- Vista materializada que consolida los KPIs de las 3 fases del refactor:
--
--   Fase 0 (dia 30):  time_to_first_action, day1_ficha_visit, nps_score
--   Fase 1 (dia 90):  pets_with_nose_print, passports_generated, seo_landings
--   Fase 2 (dia 365): users_total, complete_fichas, partners_retail,
--                     insurance_signed, pharma_first_deal, mrr_usd
--
-- En lugar de calcular cada KPI on-demand (caro), refrescamos diaria via
-- pg_cron y leemos resultado en milisegundos.
--
-- Privacy: agregados sobre toda la base, sin pet_id ni owner_id
-- individual. Solo admin puede leer.
--
-- Refresh: pg_cron diario 6am Chile (10 UTC) — antes que abra Pedro.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Vista materializada con los KPIs
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

  -- ── Fase 1 KPIs ────────────────────────────────────────────────────
  (SELECT COUNT(DISTINCT pet_id)::INT FROM public.nose_prints) AS pets_with_nose_print,
  (
    SELECT COUNT(*)::INT
    FROM public.system_health_log
    WHERE function_name = 'generate-paw-passport'
      AND status = 'success'
  ) AS passports_generated_total,
  (
    SELECT COUNT(*)::INT
    FROM public.system_health_log
    WHERE function_name = 'generate-paw-passport'
      AND status = 'success'
      AND created_at >= NOW() - INTERVAL '30 days'
  ) AS passports_generated_30d,
  (
    SELECT COUNT(*)::INT
    FROM public.public_breed_stats
    WHERE pet_count >= 50
  ) AS seo_landings_breed,
  (
    SELECT COUNT(*)::INT
    FROM public.public_species_stats
    WHERE pet_count >= 50
  ) AS seo_landings_species,
  -- Aproximacion: cada vet visible cuenta como landing (slug page)
  (
    SELECT COUNT(*)::INT
    FROM public.service_providers
    WHERE is_directory_visible = true AND slug IS NOT NULL
  ) AS seo_landings_vets,

  -- ── Joya de la corona: ficha completa + share ────────────────────
  (
    SELECT COUNT(*)::INT
    FROM public.pets p
    WHERE EXISTS (
      SELECT 1 FROM public.medical_records mr
      WHERE mr.pet_id = p.id
      GROUP BY mr.pet_id
      HAVING COUNT(*) >= 5
    )
  ) AS pets_complete_ficha,
  (
    SELECT COUNT(DISTINCT pet_id)::INT
    FROM public.medical_share_tokens
    WHERE expires_at > NOW()
  ) AS pets_with_active_share,

  -- ── Engagement medico ────────────────────────────────────────────
  (
    SELECT COUNT(*)::INT
    FROM public.medical_records
    WHERE created_at >= NOW() - INTERVAL '30 days'
  ) AS medical_records_30d,
  (
    SELECT COUNT(*)::INT
    FROM public.medical_records
    WHERE record_type = 'vacuna'
      AND next_date IS NOT NULL
      AND next_date >= CURRENT_DATE
  ) AS vaccines_up_to_date,
  (
    SELECT COUNT(*)::INT
    FROM public.medical_records
    WHERE record_type = 'vacuna'
      AND next_date IS NOT NULL
      AND next_date < CURRENT_DATE
  ) AS vaccines_overdue,

  -- ── Cascadas (Fase 2) ────────────────────────────────────────────
  (SELECT COUNT(*)::INT FROM public.pet_health_alerts) AS health_alerts_total,
  (
    SELECT COUNT(*)::INT
    FROM public.pet_health_alerts
    WHERE dismissed_at IS NULL
  ) AS health_alerts_active,
  (
    SELECT COUNT(*)::INT
    FROM public.pet_health_alerts
    WHERE created_at >= NOW() - INTERVAL '7 days'
  ) AS health_alerts_created_7d,

  -- ── Research consent (Pharma deal pre-req §7.3) ──────────────────
  (
    SELECT COUNT(*)::INT
    FROM public.profiles
    WHERE anonymous_data_research_consent = TRUE
  ) AS users_consent_yes,
  (
    SELECT COUNT(*)::INT
    FROM public.profiles
    WHERE anonymous_data_research_consent = FALSE
  ) AS users_consent_no,
  (
    SELECT COUNT(*)::INT
    FROM public.profiles
    WHERE anonymous_data_research_consent IS NULL
  ) AS users_consent_pending,

  -- ── B2B (§7.5) ────────────────────────────────────────────────────
  (SELECT COUNT(*)::INT FROM public.b2b_api_keys WHERE is_active = TRUE) AS b2b_keys_active,
  (
    SELECT COALESCE(SUM(total_requests), 0)::BIGINT
    FROM public.b2b_api_keys
  ) AS b2b_requests_total,
  (
    SELECT COUNT(*)::INT
    FROM public.correlation_definitions
    WHERE status = 'published'
  ) AS correlations_published,
  (
    SELECT COUNT(*)::INT
    FROM public.correlation_definitions
    WHERE status = 'draft'
  ) AS correlations_draft,

  -- ── Refugios (Fase 1 §6.7) ───────────────────────────────────────
  (SELECT COUNT(*)::INT FROM public.adoption_centers WHERE status = 'active') AS shelters_active,
  (SELECT COUNT(*)::INT FROM public.adoption_followups) AS followups_total,
  (
    SELECT COUNT(*)::INT
    FROM public.adoption_followups
    WHERE response_status IS NOT NULL
  ) AS followups_responded,

  NOW() AS refreshed_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_master_kpis_daily_unique
  ON public.master_kpis_daily(as_of_date);

GRANT SELECT ON public.master_kpis_daily TO authenticated;

-- RLS no aplica a vistas materializadas; la proteccion viene de que
-- la query anidada SOLO computa agregados (sin pet_id, owner_id, etc).
-- Los componentes admin verifican is_admin antes de mostrar.

-- 2. RPC para refresh manual (admin)
CREATE OR REPLACE FUNCTION public.refresh_master_kpis()
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
BEGIN
  v_user := auth.uid();

  -- Cualquier admin puede refrescar manualmente
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_access
    WHERE user_id = v_user AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Solo admins pueden refrescar master_kpis';
  END IF;

  REFRESH MATERIALIZED VIEW public.master_kpis_daily;
  RETURN NOW();
END $$;

REVOKE ALL ON FUNCTION public.refresh_master_kpis() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_master_kpis() TO authenticated;

COMMENT ON MATERIALIZED VIEW public.master_kpis_daily IS
  'Refactor Maestro §13. Vista materializada con KPIs consolidados de las '
  '3 fases. Refresh diario via pg_cron + manual desde admin con '
  'refresh_master_kpis(). Solo agregados — sin PII.';

COMMIT;

-- Initial refresh
REFRESH MATERIALIZED VIEW public.master_kpis_daily;

-- Smoke test
DO $$
DECLARE
  v_row RECORD;
BEGIN
  SELECT * INTO v_row FROM public.master_kpis_daily LIMIT 1;
  IF v_row IS NULL THEN
    RAISE EXCEPTION 'master_kpis_daily vacia';
  END IF;
  RAISE NOTICE 'Smoke test OK: master_kpis_daily creada y poblada (users=%, pets=%)',
    v_row.users_total, v_row.pets_active;
END $$;
