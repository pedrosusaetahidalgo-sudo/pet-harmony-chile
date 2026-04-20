-- ==========================================================================
-- RPC admin: vets en peligro de churn
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d):
-- El mayor riesgo del motor B2B es vets que se registran, no agregan
-- pacientes en 14 dias y abandonan. Este RPC lista los vets en ese bucket
-- para que Pedro los contacte personalmente (white-glove onboarding,
-- INIT-09). Cada llamada manual tiene alto leverage comercial.
--
-- Definicion "en peligro de churn":
--   - Registrado hace >= 7 dias (para evitar vets recien entrados).
--   - Registrado hace <= 60 dias (fuera de ventana ya es churn consumado).
--   - Cero pacientes activos (service_providers.id no aparece en pet_vet_links).
--   - OR: tuvo pacientes pero no logueo hace >= 21 dias (perdida de engagement).
--
-- Devuelve priorizado por fecha de registro (mas recientes arriba = mas
-- convertibles).
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.rpc_vets_at_churn_risk()
RETURNS TABLE (
  provider_id UUID,
  user_id UUID,
  display_name TEXT,
  contact_email TEXT,
  public_phone TEXT,
  commune TEXT,
  provider_plan TEXT,
  status TEXT,
  registered_at TIMESTAMPTZ,
  days_since_registration INTEGER,
  patients_linked INTEGER,
  last_login TIMESTAMPTZ,
  days_since_login INTEGER,
  risk_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF NOT public.is_active_admin(auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH vet_stats AS (
    SELECT
      sp.id AS provider_id,
      sp.user_id,
      sp.display_name,
      sp.public_email,
      sp.public_phone,
      sp.commune,
      sp.provider_plan,
      sp.status,
      sp.created_at AS registered_at,
      p.updated_at AS last_login,
      (
        SELECT COUNT(*)::INTEGER FROM public.pet_vet_links pvl
        WHERE pvl.provider_id = sp.id AND pvl.status = 'active'
      ) AS patients_count
    FROM public.service_providers sp
    LEFT JOIN public.profiles p ON p.id = sp.user_id
    WHERE sp.created_at >= NOW() - INTERVAL '60 days'
      AND sp.created_at <= NOW() - INTERVAL '7 days'
      AND sp.status != 'suspended'
  )
  SELECT
    vs.provider_id,
    vs.user_id,
    vs.display_name,
    vs.public_email,
    vs.public_phone,
    vs.commune,
    vs.provider_plan,
    vs.status,
    vs.registered_at,
    EXTRACT(DAY FROM NOW() - vs.registered_at)::INTEGER AS days_since_registration,
    vs.patients_count,
    vs.last_login,
    CASE
      WHEN vs.last_login IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM NOW() - vs.last_login)::INTEGER
    END AS days_since_login,
    CASE
      -- Red: cero pacientes + >14 dias o no login hace >21 dias con pacientes
      WHEN vs.patients_count = 0
        AND EXTRACT(DAY FROM NOW() - vs.registered_at) >= 14 THEN 'high'
      WHEN vs.patients_count > 0
        AND vs.last_login IS NOT NULL
        AND EXTRACT(DAY FROM NOW() - vs.last_login) >= 21 THEN 'high'
      -- Amber: cero pacientes 7-14 dias (todavia convertible)
      WHEN vs.patients_count = 0
        AND EXTRACT(DAY FROM NOW() - vs.registered_at) BETWEEN 7 AND 13 THEN 'medium'
      -- Yellow: >= 1 paciente pero sin login hace 14 dias
      WHEN vs.patients_count > 0
        AND vs.last_login IS NOT NULL
        AND EXTRACT(DAY FROM NOW() - vs.last_login) BETWEEN 14 AND 20 THEN 'low'
      ELSE 'healthy'
    END AS risk_level
  FROM vet_stats vs
  WHERE
    (vs.patients_count = 0 AND EXTRACT(DAY FROM NOW() - vs.registered_at) >= 7)
    OR (vs.patients_count > 0
        AND vs.last_login IS NOT NULL
        AND EXTRACT(DAY FROM NOW() - vs.last_login) >= 14)
  ORDER BY
    CASE
      WHEN vs.patients_count = 0 THEN 0
      ELSE 1
    END,
    vs.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.rpc_vets_at_churn_risk() IS
  'Vets registrados 7-60 dias atras con cero pacientes o sin login hace >=14 dias. Priorizado para outreach manual Pedro (INIT-09).';

GRANT EXECUTE ON FUNCTION public.rpc_vets_at_churn_risk() TO authenticated;
