-- ==========================================================================
-- RPC admin: embudo de adopción (refugio → transfer → adoptante)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20 — Plan 90d):
-- Refugios son onboarding inicial de mascotas (mig 20260620000000). Este
-- RPC mide el funnel completo:
--   1. Refugios activos (cuentas adoption_centers).
--   2. Mascotas cargadas por refugios (created_by_shelter_id NOT NULL).
--   3. Mascotas en proceso de adopción (shelter_adopted_at NOT NULL).
--   4. Transferencias completadas (owner_id reclamado vía invitation_token).
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.rpc_adoption_funnel()
RETURNS TABLE (
  active_shelters INTEGER,
  pets_loaded_by_shelters INTEGER,
  pets_in_transfer INTEGER,
  pets_transferred INTEGER,
  shelters_with_transfers INTEGER,
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
    -- 1. Refugios activos
    (SELECT COUNT(*)::INTEGER
     FROM public.adoption_centers
     WHERE status = 'active')
      AS active_shelters,

    -- 2. Mascotas cargadas por refugios (histórico total)
    (SELECT COUNT(*)::INTEGER
     FROM public.pets
     WHERE created_by_shelter_id IS NOT NULL)
      AS pets_loaded_by_shelters,

    -- 3. En transfer: con shelter_adopted_at pero aún sin owner_id (link pendiente)
    (SELECT COUNT(*)::INTEGER
     FROM public.pets
     WHERE created_by_shelter_id IS NOT NULL
       AND shelter_adopted_at IS NOT NULL
       AND owner_id IS NULL)
      AS pets_in_transfer,

    -- 4. Transferidas: shelter_adopted_at + owner_id reclamado
    (SELECT COUNT(*)::INTEGER
     FROM public.pets
     WHERE created_by_shelter_id IS NOT NULL
       AND shelter_adopted_at IS NOT NULL
       AND owner_id IS NOT NULL)
      AS pets_transferred,

    -- 5. Refugios con al menos 1 transfer completada
    (SELECT COUNT(DISTINCT created_by_shelter_id)::INTEGER
     FROM public.pets
     WHERE created_by_shelter_id IS NOT NULL
       AND shelter_adopted_at IS NOT NULL
       AND owner_id IS NOT NULL)
      AS shelters_with_transfers,

    NOW()::TIMESTAMPTZ AS captured_at;
END;
$$;

COMMENT ON FUNCTION public.rpc_adoption_funnel() IS
  'Embudo adopción admin: refugios activos → pets cargados → pets en transfer → pets transferidas. Mide flujo shelter onboarding (mig 20260620000000).';

GRANT EXECUTE ON FUNCTION public.rpc_adoption_funnel() TO authenticated;
