-- ══════════════════════════════════════════════════════════════
-- Fix defensivo pet_co_owners: ambas policies usan helpers SECURITY DEFINER
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-20, post-rollback):
--   Aun con la mig 20260530000000 aplicada, `SELECT * FROM pet_co_owners`
--   devuelve 500. Las 3 policies activas son:
--     1. co_owner_reads_own  (SELECT) — usa helper pets_with_co_ownership ✓
--     2. co_owner_accepts_own (UPDATE) — simple, sin subquery
--     3. owner_manages_co_owners (ALL)  — subquery inline a pets
--
--   `pets` no tiene policies que referencien pet_co_owners (verificado),
--   entonces no hay recursion cruzada. Pero PostgreSQL puede estar
--   pegandose al planificar por otra razon (statement_timeout, lock,
--   estadistica rara). Este fix convierte `owner_manages_co_owners` para
--   usar un helper SECURITY DEFINER, consistente con el patron.
--
-- Idempotente: DROP POLICY IF EXISTS + CREATE OR REPLACE FUNCTION.
-- ══════════════════════════════════════════════════════════════

-- Helper: pets propias del usuario (para policies que deben checkear
-- owner_id sin reevaluar RLS en cascada). SECURITY DEFINER = ejecuta
-- como postgres, bypasea RLS al leer pets.
CREATE OR REPLACE FUNCTION public.user_owns_pet(check_user_id UUID, check_pet_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pets
    WHERE id = check_pet_id
      AND owner_id = check_user_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.user_owns_pet(UUID, UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.user_owns_pet(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.user_owns_pet(UUID, UUID) IS
  'Helper SECURITY DEFINER para policies que necesitan chequear owner_id de pets sin disparar RLS en cascada.';

-- Reemplaza owner_manages_co_owners — antes subquery inline a pets,
-- ahora usa helper. Mantiene misma semantica: el dueno principal
-- puede ver/insertar/editar/borrar co_owners de sus mascotas.
DROP POLICY IF EXISTS "owner_manages_co_owners" ON public.pet_co_owners;

CREATE POLICY "owner_manages_co_owners"
  ON public.pet_co_owners FOR ALL
  TO authenticated
  USING (public.user_owns_pet(auth.uid(), pet_id))
  WITH CHECK (public.user_owns_pet(auth.uid(), pet_id));

-- ──────────────────────────────────────────────────────────────
-- Verificacion post-apply:
--
--   -- Helper debe existir
--   SELECT proname FROM pg_proc WHERE proname = 'user_owns_pet';
--
--   -- Policy debe estar con el expr nuevo (referencia al helper)
--   SELECT pg_get_expr(polqual, polrelid)
--     FROM pg_policy
--     WHERE polrelid = 'public.pet_co_owners'::regclass
--       AND polname = 'owner_manages_co_owners';
--   -- Esperado: "user_owns_pet(auth.uid(), pet_id)"
--
--   -- Smoke test: este SELECT no debe tirar 500 (devuelve rows o []):
--   SELECT pet_id, role, permissions FROM pet_co_owners
--     WHERE user_id = auth.uid() AND status = 'accepted';
-- ──────────────────────────────────────────────────────────────
