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
--
-- DEFENSIVE 2026-04-30: cada bloque chequea to_regclass() antes de tocar
-- la tabla. Si insurance_leads (mig 20260915000000) no esta aplicada
-- todavia, esta mig se aplica parcialmente (solo crea list_my_data_sharing
-- defensiva) sin fallar. Cuando se aplique la mig 20260915, re-aplicar
-- esta mig completara el ALTER + RPC.

DO $$
BEGIN
  -- 1. Agregar columna revoked_at + revocation_reason solo si la tabla existe.
  IF to_regclass('public.insurance_leads') IS NOT NULL THEN
    ALTER TABLE public.insurance_leads
      ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS revocation_reason TEXT;
  ELSE
    RAISE NOTICE 'Tabla insurance_leads no existe — skip ALTER. Re-aplicar esta mig despues de 20260915000000.';
  END IF;
END $$;

-- 2. RPC revoke_insurance_lead — solo se crea si la tabla existe.
--    Si la tabla no existe, el CREATE FUNCTION explotaria al validar
--    la ref en pg_dump, asi que la envolvemos en EXECUTE.
DO $$
BEGIN
  IF to_regclass('public.insurance_leads') IS NOT NULL THEN
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION public.revoke_insurance_lead(
        p_lead_id UUID,
        p_reason TEXT DEFAULT 'Revocado por el titular vía /mis-datos-compartidos'
      )
      RETURNS BOOLEAN
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $body$
      DECLARE
        v_lead RECORD;
      BEGIN
        SELECT * INTO v_lead
        FROM public.insurance_leads
        WHERE id = p_lead_id AND owner_id = auth.uid();

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Lead no encontrado o no pertenece al usuario actual';
        END IF;

        IF v_lead.revoked_at IS NOT NULL THEN
          RETURN false;
        END IF;

        UPDATE public.insurance_leads
        SET
          revoked_at = NOW(),
          revocation_reason = p_reason,
          status = 'lost',
          contact_phone = NULL,
          admin_notes = COALESCE(admin_notes || E'\n', '') ||
            'Revocado por el titular el ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI') ||
            ' — motivo: ' || p_reason,
          updated_at = NOW()
        WHERE id = p_lead_id;

        IF NOT EXISTS (
          SELECT 1 FROM public.insurance_leads
          WHERE id = p_lead_id AND revoked_at IS NOT NULL AND status = 'lost'
        ) THEN
          RAISE EXCEPTION 'Soft delete fallo: revoked_at o status no se actualizo';
        END IF;

        RETURN true;
      END;
      $body$;
    $func$;

    EXECUTE 'GRANT EXECUTE ON FUNCTION public.revoke_insurance_lead(UUID, TEXT) TO authenticated';
  ELSE
    RAISE NOTICE 'Tabla insurance_leads no existe — skip RPC revoke_insurance_lead.';
  END IF;
END $$;

-- 3. list_my_data_sharing defensiva: cada categoria se incluye solo si
--    la tabla source existe. Esto permite aplicar la mig sin importar
--    en que orden se hayan corrido las migs de motores.
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
  v_has_revoked_at BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Categoria 1: aseguradora_lead (insurance_leads no revocados)
  IF to_regclass('public.insurance_leads') IS NOT NULL
     AND to_regclass('public.insurance_partners') IS NOT NULL THEN

    v_has_revoked_at := EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'insurance_leads'
        AND column_name = 'revoked_at'
    );

    IF v_has_revoked_at THEN
      RETURN QUERY EXECUTE $q$
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
        WHERE il.owner_id = $1 AND il.revoked_at IS NULL
      $q$ USING v_user_id;
    ELSE
      RETURN QUERY EXECUTE $q$
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
          (il.status NOT IN ('lost', 'closed'))
        FROM public.insurance_leads il
        JOIN public.insurance_partners ip ON ip.id = il.partner_id
        WHERE il.owner_id = $1
      $q$ USING v_user_id;
    END IF;
  END IF;

  -- Categoria 2: pharma_research_consent (profiles siempre existe)
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

  -- Categoria 3: paw_shield_training
  IF to_regclass('public.paw_shield_data_archive') IS NOT NULL THEN
    RETURN QUERY EXECUTE $q$
      SELECT
        'paw_shield_training'::TEXT,
        psa.created_at,
        'Paw Friend (modelo biometrico interno)'::TEXT,
        'biometria'::TEXT,
        jsonb_build_object('id', psa.id, 'pet_id', psa.pet_id),
        true
      FROM public.paw_shield_data_archive psa
      WHERE psa.owner_id = $1 AND psa.deleted_at IS NULL
    $q$ USING v_user_id;
  END IF;

  -- Categoria 4: vet_checkin
  IF to_regclass('public.vet_checkin_logs') IS NOT NULL
     AND to_regclass('public.service_providers') IS NOT NULL
     AND to_regclass('public.pets') IS NOT NULL THEN
    RETURN QUERY EXECUTE $q$
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
      WHERE pt.owner_id = $1
    $q$ USING v_user_id;
  END IF;

  -- Categoria 5: insurance_quote_calculated
  IF to_regclass('public.insurance_quotes') IS NOT NULL
     AND to_regclass('public.insurance_partners') IS NOT NULL THEN
    RETURN QUERY EXECUTE $q$
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
      WHERE iq.owner_id = $1
    $q$ USING v_user_id;
  END IF;

END;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_data_sharing() TO authenticated;

-- 4. Smoke test inline (regla 9.2.1): verificar function compila + no rompe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'list_my_data_sharing'
      AND pronargs = 0
  ) THEN
    RAISE EXCEPTION 'list_my_data_sharing no se actualizo correctamente';
  END IF;

  -- revoke_insurance_lead solo se valida si insurance_leads existe.
  IF to_regclass('public.insurance_leads') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'revoke_insurance_lead'
        AND pronargs = 2
    ) THEN
      RAISE EXCEPTION 'revoke_insurance_lead no se creo correctamente';
    END IF;
  END IF;
END $$;
