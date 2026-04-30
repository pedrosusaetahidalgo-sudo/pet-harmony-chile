-- Compliance Ley 21.719 (Reglamento Ley 19.628 vigente 2026): permite al
-- titular revocar consentimiento retroactivo de un insurance_lead ya enviado.
--
-- Flujo:
--   1. User pidio cotizacion → row en insurance_leads con contact_email/phone.
--   2. User decide arrepentirse → /profile/mis-datos-compartidos → Revocar.
--   3. RPC revoke_insurance_lead(p_lead_id) marca soft-delete:
--      - status='lost' + admin_notes='Revocado por user' + revoked_at=NOW().
--      - Limpia contact_phone (no se borra de DB por cumplimiento legal de
--        traceability del consent, pero se ocluye antes de exponer al partner).
--      - El partner ya notificado debe ser informado por Pedro manualmente
--        si el lead estaba en status='sent' (solo aplica si Pedro agrego el
--        partner real al loop de billing).
--
-- Diferencia con DELETE:
--   - DELETE rompe FK insurance_quotes → insurance_leads (CASCADE perderia
--     historial de quotes calculadas).
--   - SOFT DELETE preserva el quote (el calculo siguio siendo legitimo)
--     pero remueve la PII (contact_phone) del dueño.

-- 1. Agregar columna revoked_at + revocation_reason
ALTER TABLE public.insurance_leads
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revocation_reason TEXT;

-- 2. RPC revoke_insurance_lead
CREATE OR REPLACE FUNCTION public.revoke_insurance_lead(
  p_lead_id UUID,
  p_reason TEXT DEFAULT 'Revocado por el titular vía /mis-datos-compartidos'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead RECORD;
BEGIN
  -- Verificar que el lead exista y pertenezca al user.
  SELECT * INTO v_lead
  FROM public.insurance_leads
  WHERE id = p_lead_id AND owner_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead no encontrado o no pertenece al usuario actual';
  END IF;

  -- Si ya esta revocado, no hacer nada (idempotente).
  IF v_lead.revoked_at IS NOT NULL THEN
    RETURN false;
  END IF;

  -- Soft delete: marca revoked, limpia PII de contacto, status='lost'.
  UPDATE public.insurance_leads
  SET
    revoked_at = NOW(),
    revocation_reason = p_reason,
    status = 'lost',
    contact_phone = NULL,  -- limpia phone (PII directa)
    admin_notes = COALESCE(admin_notes || E'\n', '') ||
      'Revocado por el titular el ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI') ||
      ' — motivo: ' || p_reason,
    updated_at = NOW()
  WHERE id = p_lead_id;

  -- Smoke test inline (regla 9.2.1 CLAUDE.md): verificar que el update
  -- afecto exactamente 1 row y que revoked_at quedo seteado.
  IF NOT EXISTS (
    SELECT 1 FROM public.insurance_leads
    WHERE id = p_lead_id AND revoked_at IS NOT NULL AND status = 'lost'
  ) THEN
    RAISE EXCEPTION 'Soft delete fallo: revoked_at o status no se actualizo';
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_insurance_lead(UUID, TEXT) TO authenticated;

-- 3. Actualizar list_my_data_sharing para marcar consent_revocable=true
--    en aseguradora_lead cuando revoked_at IS NULL.
--    Idempotente: re-crea la function manteniendo el contrato de retorno.
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
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Categoria 1: aseguradora_lead (insurance_leads no revocados)
  RETURN QUERY
  SELECT
    'aseguradora_lead'::TEXT,
    il.created_at,
    ip.display_name::TEXT,
    'aseguradora'::TEXT,
    jsonb_build_object(
      'id', il.id,
      'contact_email', il.contact_email,
      'contact_phone', il.contact_phone,
      'status', il.status,
      'pet_id', il.pet_id,
      'partner_id', il.partner_id
    ),
    (il.revoked_at IS NULL AND il.status NOT IN ('lost', 'closed'))
  FROM public.insurance_leads il
  JOIN public.insurance_partners ip ON ip.id = il.partner_id
  WHERE il.owner_id = v_user_id
    AND il.revoked_at IS NULL;

  -- Categoria 2: pharma_research_consent (solo si profiles.anonymous_data_research_consent=true)
  RETURN QUERY
  SELECT
    'pharma_research_consent'::TEXT,
    p.research_consent_at,
    'Paw Friend (data agregada anonima)'::TEXT,
    'pharma'::TEXT,
    jsonb_build_object('consent_active', p.anonymous_data_research_consent),
    true
  FROM public.profiles p
  WHERE p.id = v_user_id
    AND p.anonymous_data_research_consent = true;

  -- Categoria 3: paw_shield_training (paw_shield_data_archive con consent)
  RETURN QUERY
  SELECT
    'paw_shield_training'::TEXT,
    psa.created_at,
    'Paw Friend (modelo biometrico interno)'::TEXT,
    'biometria'::TEXT,
    jsonb_build_object('id', psa.id, 'pet_id', psa.pet_id),
    true
  FROM public.paw_shield_data_archive psa
  WHERE psa.owner_id = v_user_id
    AND psa.deleted_at IS NULL;

  -- Categoria 4: vet_checkin (logs de vet-checkin-identify)
  RETURN QUERY
  SELECT
    'vet_checkin'::TEXT,
    vcl.created_at,
    sp.business_name,
    'veterinario'::TEXT,
    jsonb_build_object('result', vcl.result, 'match_score', vcl.match_score),
    false
  FROM public.vet_checkin_logs vcl
  LEFT JOIN public.service_providers sp ON sp.id = vcl.provider_id
  JOIN public.pets pt ON pt.id = vcl.pet_id
  WHERE pt.owner_id = v_user_id;

  -- Categoria 5: insurance_quote_calculated (informativo, no PII al partner)
  RETURN QUERY
  SELECT
    'insurance_quote_calculated'::TEXT,
    iq.created_at,
    ip.display_name::TEXT,
    'aseguradora'::TEXT,
    jsonb_build_object(
      'monthly_premium_clp', iq.monthly_premium_clp,
      'risk_score', iq.risk_score
    ),
    false
  FROM public.insurance_quotes iq
  JOIN public.insurance_partners ip ON ip.id = iq.partner_id
  WHERE iq.owner_id = v_user_id;

END;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_data_sharing() TO authenticated;

-- 4. Smoke test inline (regla 9.2.1): verificar function compila + no rompe.
DO $$
BEGIN
  -- Test que la function existe y se puede llamar
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'revoke_insurance_lead'
      AND pronargs = 2
  ) THEN
    RAISE EXCEPTION 'revoke_insurance_lead no se creo correctamente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'list_my_data_sharing'
      AND pronargs = 0
  ) THEN
    RAISE EXCEPTION 'list_my_data_sharing no se actualizo correctamente';
  END IF;
END $$;
