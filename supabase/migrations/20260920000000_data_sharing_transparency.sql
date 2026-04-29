-- 2026-04-30 (Compliance Ley 21.719 · panel de transparencia datos compartidos)
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Ley 21.719 (Reglamento Ley 19.628 vigente 2026) reconoce el derecho del
-- titular a saber a quien y para que se compartieron sus datos personales.
-- Esta mig agrega RPC list_my_data_sharing() que devuelve transparencia
-- por motor B2B:
--
-- 1. Aseguradoras (insurance_leads): nombre, email, telefono, mensaje
--    compartidos con partner cuando el owner pidio cotizacion.
-- 2. Pharma B2B / Research consent (anonymous_data_research_consent en
--    profiles): si el owner opto-in para data agregada anonimizada.
-- 3. Paw Shield archive (paw_shield_archive con consent_for_training):
--    imagenes de la huella nasal compartidas para entrenamiento.
-- 4. Vet check-in (vet_checkin_log): cuando un vet partner identifico
--    a la mascota via biometria.
-- 5. Insurance quotes calculadas (no enviadas, solo locales).
--
-- Retail clicks NO se comparten con partner (el owner sale al sitio del
-- partner via redirect, partner solo ve referrer URL anonimo). No se
-- incluye aqui.

BEGIN;

CREATE OR REPLACE FUNCTION public.list_my_data_sharing()
RETURNS TABLE (
  category TEXT,
  shared_at TIMESTAMPTZ,
  partner_name TEXT,
  partner_kind TEXT,
  details JSONB,
  consent_revocable BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  -- 1. Insurance leads
  RETURN QUERY
  SELECT
    'aseguradora_lead'::TEXT,
    il.created_at,
    ip.display_name::TEXT,
    'insurance'::TEXT,
    jsonb_build_object(
      'contact_name', il.contact_name,
      'contact_email', il.contact_email,
      'contact_phone', il.contact_phone,
      'message', il.message,
      'lead_id', il.id
    ),
    false
  FROM public.insurance_leads il
  JOIN public.insurance_partners ip ON ip.id = il.partner_id
  WHERE il.owner_id = v_user;

  -- 2. Research consent activo
  RETURN QUERY
  SELECT
    'pharma_research_consent'::TEXT,
    p.updated_at,
    'Pharma B2B partners (Centrovet, MSD, Virbac)'::TEXT,
    'pharma'::TEXT,
    jsonb_build_object(
      'consent_active', p.anonymous_data_research_consent,
      'note', 'Solo se comparten datos AGREGADOS y ANONIMIZADOS. Tu nombre, email y mascota individual nunca se exponen al partner.'
    ),
    true
  FROM public.profiles p
  WHERE p.id = v_user
    AND p.anonymous_data_research_consent = true;

  -- 3. Paw Shield archive con consent training
  RETURN QUERY
  SELECT
    'paw_shield_training'::TEXT,
    psa.created_at,
    'Paw Shield biometria (Petify)'::TEXT,
    'biometric'::TEXT,
    jsonb_build_object(
      'pet_id', psa.pet_id,
      'species', psa.species,
      'storage_path', psa.storage_path,
      'capture_kind', psa.capture_kind,
      'consent_for_training', psa.consent_for_training,
      'expires_at', psa.expires_at
    ),
    true
  FROM public.paw_shield_archive psa
  WHERE psa.owner_id = v_user
    AND psa.consent_for_training = true;

  -- 4. Vet checkin log: cada identify de un vet partner
  RETURN QUERY
  SELECT
    'vet_checkin'::TEXT,
    vcl.created_at,
    COALESCE(vak.name, 'Vet partner sin nombre')::TEXT,
    'vet'::TEXT,
    jsonb_build_object(
      'pet_id', vcl.pet_id,
      'result', vcl.result,
      'match_score', vcl.match_score
    ),
    false
  FROM public.vet_checkin_log vcl
  LEFT JOIN public.vet_api_keys vak ON vak.id = vcl.vet_api_key_id
  LEFT JOIN public.pets p ON p.id = vcl.pet_id
  WHERE p.owner_id = v_user;

  -- 5. Insurance quotes calculadas (locales, no enviadas)
  RETURN QUERY
  SELECT
    'insurance_quote_calculated'::TEXT,
    iq.created_at,
    ip.display_name::TEXT,
    'insurance'::TEXT,
    jsonb_build_object(
      'pet_id', iq.pet_id,
      'monthly_premium_clp', iq.monthly_premium_clp,
      'risk_score', iq.risk_score,
      'note', 'Cotizacion calculada localmente. Solo se comparte con partner si presionas Pedir Cotizacion.'
    ),
    false
  FROM public.insurance_quotes iq
  JOIN public.insurance_partners ip ON ip.id = iq.partner_id
  WHERE iq.owner_id = v_user;
END $$;

REVOKE ALL ON FUNCTION public.list_my_data_sharing() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_data_sharing() TO authenticated;

COMMENT ON FUNCTION public.list_my_data_sharing IS
  'Transparencia Ley 21.719: lista de eventos donde datos del titular se compartieron con partners B2B. Filtrado por auth.uid().';

COMMIT;
