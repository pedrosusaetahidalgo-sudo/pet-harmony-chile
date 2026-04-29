-- Manada Fondo Refugios — sistema de aportes automáticos del plan Manada
-- a refugios chilenos verificados.
--
-- Contexto: el plan Manada cuesta $9.990/mes/$99.900/año. De cada cuota
-- mensual, $2.000 (20%) se destinan al "Fondo Paw Friend Refugios" que
-- Paw Friend SpA dona efectivamente a refugios.
--
-- Decisión legal: el aporte lo hace Paw Friend SpA (persona jurídica
-- chilena) directamente al refugio — NO el user. Esto evita activar la
-- Ley 19.885 de donatarios (que requiere recibos al donante, calificación
-- SII, etc) que el mentor Roberto Camhi flaggeó 2026-04-22. Paw Friend
-- SpA aprovecha Art. 31 N°7 LIR (donaciones deducibles para personas
-- jurídicas) que es más simple operacionalmente. El user ve UI:
--   "Tu plan Manada apoya el Fondo Paw Friend Refugios. Este mes el
--    fondo aportó $X.XXX al refugio que elegiste."
-- pero contractualmente Paw Friend SpA es el donante.
--
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.

BEGIN;

-- ── 1. Preferencia del user Manada (qué refugio quiere apoyar) ────────
-- 1 fila por user_id Manada. Si user no eligió, va al refugio default
-- (ver tabla pool más abajo).
CREATE TABLE IF NOT EXISTS public.manada_refugio_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- adoption_centers existe desde mig 20260620000000 (rol shelter)
  preferred_shelter_id UUID REFERENCES public.adoption_centers(id) ON DELETE SET NULL,
  set_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Si el user cambió su preferencia, guardamos la previa para auditoría
  previous_shelter_id UUID,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_manada_pref_shelter
  ON public.manada_refugio_preferences(preferred_shelter_id)
  WHERE preferred_shelter_id IS NOT NULL;

ALTER TABLE public.manada_refugio_preferences ENABLE ROW LEVEL SECURITY;

-- RLS: el user ve y edita su propia preferencia. Admin ve todas.
DROP POLICY IF EXISTS manada_pref_owner_select ON public.manada_refugio_preferences;
CREATE POLICY manada_pref_owner_select ON public.manada_refugio_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS manada_pref_owner_upsert ON public.manada_refugio_preferences;
CREATE POLICY manada_pref_owner_upsert ON public.manada_refugio_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS manada_pref_owner_update ON public.manada_refugio_preferences;
CREATE POLICY manada_pref_owner_update ON public.manada_refugio_preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS manada_pref_admin_all ON public.manada_refugio_preferences;
CREATE POLICY manada_pref_admin_all ON public.manada_refugio_preferences
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = TRUE)
  );

-- ── 2. Pool mensual de aportes Manada ────────────────────────────────
-- Una fila por (year, month). Acumula $X aportado por todos los users
-- Manada activos ese mes. Cron mensual al cierre de cada mes consolida
-- el monto. Pedro (admin) ejecuta la transferencia bancaria a refugios
-- y actualiza el status.
CREATE TABLE IF NOT EXISTS public.manada_fondo_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL CHECK (year >= 2026),
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_clp BIGINT NOT NULL DEFAULT 0,
  active_subscriptions INT NOT NULL DEFAULT 0,
  -- 'pending' = el cron lo cerró pero Pedro no transfirió aún
  -- 'distributed' = transferencias bancarias hechas
  -- 'partially_distributed' = hubo issues con un refugio
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'distributed', 'partially_distributed')),
  closed_at TIMESTAMPTZ,
  distributed_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE (year, month)
);

ALTER TABLE public.manada_fondo_pool ENABLE ROW LEVEL SECURITY;

-- RLS: cualquier user autenticado puede LEER el pool (transparencia).
-- Solo admin puede modificar.
DROP POLICY IF EXISTS manada_pool_public_read ON public.manada_fondo_pool;
CREATE POLICY manada_pool_public_read ON public.manada_fondo_pool
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS manada_pool_admin_all ON public.manada_fondo_pool;
CREATE POLICY manada_pool_admin_all ON public.manada_fondo_pool
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = TRUE)
  );

-- ── 3. Bitácora de aportes individuales (auditoría) ──────────────────
-- Cada vez que se cobra una cuota Manada (Flow.cl webhook), se inserta
-- una fila acá con el monto destinado al fondo refugios. Esto da
-- trazabilidad exacta y permite calcular "tu plan ha aportado $X" en UI.
CREATE TABLE IF NOT EXISTS public.manada_aportes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Snapshot del refugio elegido al momento del aporte (no NULL en lookup
  -- si el user cambia preferencia después). NULL = aporte al pool default.
  shelter_id_at_charge UUID REFERENCES public.adoption_centers(id) ON DELETE SET NULL,
  pool_id UUID REFERENCES public.manada_fondo_pool(id) ON DELETE SET NULL,
  -- Monto en CLP que va al fondo (típicamente $2.000)
  amount_clp INT NOT NULL CHECK (amount_clp > 0),
  -- Flow charge_id si aplicable, para idempotencia ante webhooks duplicados
  flow_charge_id TEXT,
  charged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Si el aporte ya se distribuyó al refugio (Pedro hizo la transferencia)
  distributed_at TIMESTAMPTZ,
  UNIQUE (flow_charge_id)
);

CREATE INDEX IF NOT EXISTS idx_manada_aportes_user
  ON public.manada_aportes_log(user_id, charged_at DESC);

CREATE INDEX IF NOT EXISTS idx_manada_aportes_shelter
  ON public.manada_aportes_log(shelter_id_at_charge, charged_at DESC)
  WHERE shelter_id_at_charge IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_manada_aportes_pool
  ON public.manada_aportes_log(pool_id);

ALTER TABLE public.manada_aportes_log ENABLE ROW LEVEL SECURITY;

-- RLS: user ve su propio log; admin ve todo. Inserts solo via service_role
-- (edge fn webhook Flow).
DROP POLICY IF EXISTS manada_log_owner_read ON public.manada_aportes_log;
CREATE POLICY manada_log_owner_read ON public.manada_aportes_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS manada_log_admin_all ON public.manada_aportes_log;
CREATE POLICY manada_log_admin_all ON public.manada_aportes_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_access WHERE user_id = auth.uid() AND is_active = TRUE)
  );

-- ── 4. RPC set_manada_refugio_preference ─────────────────────────────
CREATE OR REPLACE FUNCTION public.set_manada_refugio_preference(
  p_shelter_id UUID
) RETURNS public.manada_refugio_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_existing_shelter UUID;
  v_result public.manada_refugio_preferences;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- Validar que el shelter exista y esté activo
  IF p_shelter_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.adoption_centers
      WHERE id = p_shelter_id AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'shelter_not_active_or_not_found';
    END IF;
  END IF;

  -- Snapshot del valor previo
  SELECT preferred_shelter_id INTO v_existing_shelter
  FROM public.manada_refugio_preferences
  WHERE user_id = v_user_id;

  INSERT INTO public.manada_refugio_preferences (
    user_id, preferred_shelter_id, set_at, previous_shelter_id
  ) VALUES (
    v_user_id, p_shelter_id, NOW(), v_existing_shelter
  )
  ON CONFLICT (user_id) DO UPDATE SET
    preferred_shelter_id = EXCLUDED.preferred_shelter_id,
    set_at = EXCLUDED.set_at,
    previous_shelter_id = manada_refugio_preferences.preferred_shelter_id
  RETURNING * INTO v_result;

  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.set_manada_refugio_preference(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_manada_refugio_preference(UUID) TO authenticated;

-- ── 5. RPC get_manada_aporte_summary (UI dashboard) ───────────────────
-- Devuelve: total aportado por el user (lifetime), aporte mensual actual,
-- nombre del refugio elegido, count de aportes acumulados.
CREATE OR REPLACE FUNCTION public.get_manada_aporte_summary()
RETURNS TABLE (
  user_id UUID,
  total_aportado_clp BIGINT,
  aportes_count INT,
  current_monthly_clp INT,
  preferred_shelter_id UUID,
  preferred_shelter_name TEXT,
  preferred_shelter_slug TEXT,
  first_aporte_at TIMESTAMPTZ,
  last_aporte_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  RETURN QUERY
  SELECT
    v_user_id,
    COALESCE(SUM(al.amount_clp), 0)::BIGINT AS total_aportado_clp,
    COUNT(al.id)::INT AS aportes_count,
    -- $2.000 como default para Manada activo. Si el user no es Manada
    -- pero consulta, devuelve 0.
    COALESCE(
      (SELECT 2000 FROM public.subscriptions s
       WHERE s.user_id = v_user_id
         AND s.plan_type = 'paw_manada'
         AND s.status = 'active'
       LIMIT 1),
      0
    )::INT AS current_monthly_clp,
    p.preferred_shelter_id,
    sh.name AS preferred_shelter_name,
    sh.slug AS preferred_shelter_slug,
    MIN(al.charged_at) AS first_aporte_at,
    MAX(al.charged_at) AS last_aporte_at
  FROM (SELECT v_user_id AS uid) base
  LEFT JOIN public.manada_aportes_log al ON al.user_id = v_user_id
  LEFT JOIN public.manada_refugio_preferences p ON p.user_id = v_user_id
  LEFT JOIN public.adoption_centers sh ON sh.id = p.preferred_shelter_id
  GROUP BY p.preferred_shelter_id, sh.name, sh.slug;
END $$;

REVOKE ALL ON FUNCTION public.get_manada_aporte_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_manada_aporte_summary() TO authenticated;

-- ── 6. RPC publica get_manada_fondo_transparency ──────────────────────
-- Para la pagina /transparencia + Pedro decks: muestra total acumulado
-- en el fondo, total distribuido, count refugios apoyados, top 5 meses.
-- Sin RLS check, lectura publica.
CREATE OR REPLACE FUNCTION public.get_manada_fondo_transparency()
RETURNS TABLE (
  total_recaudado_clp BIGINT,
  total_distribuido_clp BIGINT,
  pending_distribuir_clp BIGINT,
  meses_activos INT,
  refugios_apoyados INT,
  active_subscriptions INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(al.amount_clp), 0)::BIGINT AS total_recaudado_clp,
    COALESCE(SUM(al.amount_clp) FILTER (WHERE al.distributed_at IS NOT NULL), 0)::BIGINT
      AS total_distribuido_clp,
    COALESCE(SUM(al.amount_clp) FILTER (WHERE al.distributed_at IS NULL), 0)::BIGINT
      AS pending_distribuir_clp,
    (SELECT COUNT(DISTINCT (year, month))::INT FROM public.manada_fondo_pool) AS meses_activos,
    (SELECT COUNT(DISTINCT shelter_id_at_charge)::INT FROM public.manada_aportes_log
       WHERE shelter_id_at_charge IS NOT NULL) AS refugios_apoyados,
    (SELECT COUNT(*)::INT FROM public.subscriptions
       WHERE plan_type = 'paw_manada' AND status = 'active') AS active_subscriptions
  FROM public.manada_aportes_log al;
END $$;

REVOKE ALL ON FUNCTION public.get_manada_fondo_transparency() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_manada_fondo_transparency() TO authenticated, anon;

-- ── 7. Smoke test (regla 9.2.1 CLAUDE.md) ────────────────────────────
-- Esta mig NO crea triggers — solo tablas + RPCs SECURITY DEFINER. El
-- smoke verifica que el catalogo tenga las 3 tablas + 3 RPCs creadas.
-- No insertamos datos dummy porque la FK a auth.users no acepta UUIDs
-- random + crear un user fake para el smoke seria invasivo.
DO $$
DECLARE
  v_tables_count INT;
  v_funcs_count INT;
BEGIN
  -- Verifica las 3 tablas
  SELECT COUNT(*) INTO v_tables_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'manada_refugio_preferences',
      'manada_fondo_pool',
      'manada_aportes_log'
    );

  IF v_tables_count != 3 THEN
    RAISE EXCEPTION 'manada mig smoke failed: esperadas 3 tablas, encontradas %', v_tables_count;
  END IF;

  -- Verifica las 3 RPCs
  SELECT COUNT(*) INTO v_funcs_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'set_manada_refugio_preference',
      'get_manada_aporte_summary',
      'get_manada_fondo_transparency'
    );

  IF v_funcs_count != 3 THEN
    RAISE EXCEPTION 'manada mig smoke failed: esperadas 3 RPCs, encontradas %', v_funcs_count;
  END IF;

  RAISE NOTICE 'Manada Fondo Refugios mig OK — 3 tablas + 3 RPCs verificadas en catalogo';
END $$;

COMMIT;

-- ── Acciones manuales pendientes para Pedro ──────────────────────────
-- 1. La tabla `subscriptions` usa la columna `plan_type` (no `plan_id`).
--    Verificar que tenga el valor 'paw_manada' en su CHECK constraint.
--    Buscar el nombre real del constraint con:
--      SELECT conname FROM pg_constraint
--      WHERE conrelid = 'public.subscriptions'::regclass AND contype = 'c';
--    Y luego DROP/CREATE como sigue (ajustar nombre del constraint):
--      ALTER TABLE public.subscriptions
--        DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
--      ALTER TABLE public.subscriptions
--        ADD CONSTRAINT subscriptions_plan_type_check
--        CHECK (plan_type IN ('free', 'premium', 'paw_manada'));
--    Si no existe ningun CHECK constraint sobre plan_type, simplemente
--    ejecutar el ADD. Si el constraint actual permite cualquier string
--    (no hay CHECK), no hace falta tocar nada — la mig funciona igual.
--
-- 2. Registrar cron mensual para cerrar el pool del mes:
--      SELECT cron.schedule(
--        'manada-pool-monthly-close',
--        '0 0 1 * *',  -- 1ro de cada mes a las 00:00 UTC
--        $$ SELECT public.close_manada_pool_for_previous_month(); $$
--      );
--    (Esa fn aún NO existe — generar en próxima mig cuando Pedro confirme
--    workflow de transferencia bancaria a refugios.)
--
-- 3. Edge fn `flow-create-subscription` y `flow-webhook` deben:
--    - Aceptar `plan_id='paw_manada'` con monto $9.990/mes o $99.900/año.
--    - En webhook de cobro exitoso, INSERT en `manada_aportes_log` con
--      amount_clp=2000 + flow_charge_id (idempotencia) + shelter del user.
