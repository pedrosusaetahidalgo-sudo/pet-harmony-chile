-- ═══════════════════════════════════════════════════════════════════════════
-- Fix Multiple Permissive Policies — Advisor warnings (2026-05-05)
--
-- Hallazgo: el Advisor reporta "Multiple Permissive Policies" cuando una
-- tabla tiene 2+ policies PERMISSIVE para el mismo (role, cmd). Postgres
-- las evalua todas (logica OR) → perf hit en queries grandes.
--
-- Caso #1 (introducido por mig 20261005000005):
--   vaccine_schedule_doses tiene:
--     - vaccine_schedule_doses_public_select  FOR SELECT
--     - vaccine_schedule_doses_admin_write    FOR ALL  ← solapa con SELECT
--   Fix: splitear admin_write en INSERT + UPDATE + DELETE (sin ALL).
--
-- Otras tablas con el mismo problema (user_blocks, user_guardian_progress,
-- user_mission_progress, user_reports, vet_clinical_notes) requieren
-- analisis caso por caso porque las policies ajenas pueden tener semantica
-- intencional. Esta mig SOLO arregla el caso introducido por nosotros;
-- las demas se atacan en una mig posterior con diagnostico previo.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- vaccine_schedule_doses: split FOR ALL en INSERT + UPDATE + DELETE
-- ─────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "vaccine_schedule_doses_admin_write" ON public.vaccine_schedule_doses;

DROP POLICY IF EXISTS "vaccine_schedule_doses_admin_insert" ON public.vaccine_schedule_doses;
CREATE POLICY "vaccine_schedule_doses_admin_insert"
  ON public.vaccine_schedule_doses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = (SELECT auth.uid()) AND is_active = true
    )
  );

DROP POLICY IF EXISTS "vaccine_schedule_doses_admin_update" ON public.vaccine_schedule_doses;
CREATE POLICY "vaccine_schedule_doses_admin_update"
  ON public.vaccine_schedule_doses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = (SELECT auth.uid()) AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = (SELECT auth.uid()) AND is_active = true
    )
  );

DROP POLICY IF EXISTS "vaccine_schedule_doses_admin_delete" ON public.vaccine_schedule_doses;
CREATE POLICY "vaccine_schedule_doses_admin_delete"
  ON public.vaccine_schedule_doses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_access
      WHERE user_id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- public_select queda intacta (FOR SELECT USING true) — el SELECT publico
-- es legitimo para esta tabla de referencia.

-- ─────────────────────────────────────────────────────────────────────────
-- Smoke: verificar que vaccine_schedule_doses tiene 4 policies (1 SELECT
-- public + 3 admin para INSERT/UPDATE/DELETE), sin solape FOR ALL.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_policy_count INT;
  v_all_policies INT;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname='public' AND tablename='vaccine_schedule_doses';

  SELECT COUNT(*) INTO v_all_policies
    FROM pg_policies
    WHERE schemaname='public' AND tablename='vaccine_schedule_doses' AND cmd='ALL';

  IF v_all_policies > 0 THEN
    RAISE EXCEPTION 'Smoke FAILED: vaccine_schedule_doses aun tiene % policy con FOR ALL', v_all_policies;
  END IF;

  IF v_policy_count <> 4 THEN
    RAISE NOTICE 'Smoke WARN: vaccine_schedule_doses tiene % policies (esperaba 4)', v_policy_count;
  ELSE
    RAISE NOTICE 'Smoke OK: vaccine_schedule_doses tiene 4 policies, 0 con FOR ALL';
  END IF;
END $$;
