-- ══════════════════════════════════════════════════════════════
-- Fix RLS recursion on pet_co_owners
--
-- Problema: la policy `co_owner_reads_own` consulta pet_co_owners
-- dentro de sí misma (recursión infinita) -> PostgreSQL devuelve 500
-- al cliente en cada SELECT a esa tabla.
--
-- Causa raíz: misma patología que se corrigió en 20260519300000 para
-- admin_access + tablas admin. Aquí aplica el mismo fix con un
-- SECURITY DEFINER helper que hace el self-query sin RLS.
--
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
-- ══════════════════════════════════════════════════════════════

-- Helper: pets donde el usuario tiene co-ownership aceptado.
-- SECURITY DEFINER permite consultar pet_co_owners sin disparar RLS.
CREATE OR REPLACE FUNCTION public.pets_with_co_ownership(check_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT pet_id FROM public.pet_co_owners
  WHERE user_id = check_user_id
    AND status = 'accepted';
$$;

REVOKE EXECUTE ON FUNCTION public.pets_with_co_ownership(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.pets_with_co_ownership(UUID) TO authenticated;

-- Reemplaza la policy recursiva con una que use el helper
DROP POLICY IF EXISTS "co_owner_reads_own" ON public.pet_co_owners;

CREATE POLICY "co_owner_reads_own"
  ON public.pet_co_owners FOR SELECT
  USING (
    user_id = auth.uid()
    OR pet_id IN (SELECT public.pets_with_co_ownership(auth.uid()))
  );

COMMENT ON FUNCTION public.pets_with_co_ownership(UUID) IS
  'Helper SECURITY DEFINER para policy de pet_co_owners sin recursión.';
