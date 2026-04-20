-- ==========================================================================
-- RPC admin-only: embudo owner → PDF descargado (proxy North Star)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d):
-- El widget admin "Conversion owner -> PDF" mide el aha moment de Paw
-- Friend. Como todavia no hay PostHog consolidado, usamos proxies Supabase:
--   1. Owners con mascota registrada (universe).
--   2. Owners con mascota + >= 3 medical_records (ficha completa).
--   3. Owners con >= 1 share token creado (intento de compartir).
--   4. Owners con >= 1 share token abierto (vet recibio la ficha).
--
-- Cuando PostHog tenga el evento real `clinical_pdf_downloaded`, sustituimos
-- el paso 3 con eventos PostHog; por ahora share token es el mejor proxy.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.rpc_pdf_funnel()
RETURNS TABLE (
  owners_with_pet INTEGER,
  owners_with_filled_ficha INTEGER,
  owners_shared INTEGER,
  owners_share_opened INTEGER,
  captured_at TIMESTAMPTZ
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
  SELECT
    -- 1. Universe: distinct owners con al menos 1 pet
    (SELECT COUNT(DISTINCT owner_id)::INTEGER
     FROM public.pets
     WHERE owner_id IS NOT NULL)
      AS owners_with_pet,

    -- 2. Owners con pet y >=3 medical_records (proxy ficha usable)
    (SELECT COUNT(DISTINCT p.owner_id)::INTEGER
     FROM public.pets p
     WHERE p.owner_id IS NOT NULL
       AND (
         SELECT COUNT(*) FROM public.medical_records mr WHERE mr.pet_id = p.id
       ) >= 3)
      AS owners_with_filled_ficha,

    -- 3. Owners que crearon al menos 1 share token
    (SELECT COUNT(DISTINCT owner_id)::INTEGER
     FROM public.medical_share_tokens
     WHERE owner_id IS NOT NULL)
      AS owners_shared,

    -- 4. Owners cuyo share token fue abierto al menos 1 vez
    (SELECT COUNT(DISTINCT owner_id)::INTEGER
     FROM public.medical_share_tokens
     WHERE owner_id IS NOT NULL
       AND last_accessed_at IS NOT NULL)
      AS owners_share_opened,

    NOW()::TIMESTAMPTZ AS captured_at;
END;
$$;

COMMENT ON FUNCTION public.rpc_pdf_funnel() IS
  'Embudo admin: owners con pet -> ficha llena (>=3 records) -> crearon share -> share abierto. Proxy Supabase del North Star (PostHog complementa).';

GRANT EXECUTE ON FUNCTION public.rpc_pdf_funnel() TO authenticated;
