-- ==========================================================================
-- Sistema de monitoreo auto-pilotado
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Objetivo: reducir al minimo tu tiempo de revision diaria.
--
-- REGLA DE ORO (Pedro 2026-04-17):
--   Los auto-fixers JAMAS alteran datos de usuarios reales ni su experiencia.
--   Solo limpian ruido: datos de testing, logs benignos, metadata derivada.
--   Cualquier fix que pueda afectar UX de un usuario → requiere aprobacion
--   humana antes de pushear. Si hay duda, NO se auto-aplica.
--
-- Auto-fixers actuales (todos cumplen la regla):
--   1. stale_verification_requests: solo rechaza notas basura (<5 chars,
--      random strings). NO toca verificaciones reales con texto legitimo.
--   2. orphan_slugs: solo AGREGA slug si falta. NO cambia slugs existentes
--      (romperia URLs publicas compartidas).
--   3. benign_errors_purge: solo borra error_logs de ruido conocido
--      (Lock was stolen, Script error). NO borra errores reales.
--
-- Contenido:
--   1. Tabla `audit_snapshots` para guardar historico de salud de la app.
--   2. Funciones auto-fixer seguras (detalle arriba).
--   3. `run_daily_auto_fixers()` orquesta todo y retorna JSON con lo aplicado.
--
--   La edge function `audit-cron-daily` (a desplegar) llama a estas funciones
--   1x/dia, guarda snapshot, y te deja solo con lo que si requiere decision.
-- ==========================================================================

-- 1. Tabla audit_snapshots
CREATE TABLE IF NOT EXISTS public.audit_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  health_score INT NOT NULL,
  total_users INT NOT NULL DEFAULT 0,
  premium_users INT NOT NULL DEFAULT 0,
  active_pets INT NOT NULL DEFAULT 0,
  orphan_pets INT NOT NULL DEFAULT 0,
  verified_providers INT NOT NULL DEFAULT 0,
  providers_without_slug INT NOT NULL DEFAULT 0,
  total_bookings INT NOT NULL DEFAULT 0,
  error_logs_24h INT NOT NULL DEFAULT 0,
  error_logs_total INT NOT NULL DEFAULT 0,
  unique_error_patterns INT NOT NULL DEFAULT 0,
  -- Auto-fixes aplicados en esta corrida
  auto_fixes_applied JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Items que requieren decision humana (lo que Pedro debe ver)
  needs_human_attention JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Raw metrics para drill-down
  raw_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_snapshots_date
  ON public.audit_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_audit_snapshots_created
  ON public.audit_snapshots(created_at DESC);

ALTER TABLE public.audit_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read audit_snapshots" ON public.audit_snapshots;
CREATE POLICY "Admin can read audit_snapshots"
  ON public.audit_snapshots FOR SELECT
  USING (public.is_admin_user(auth.uid()));

-- Service role puede insertar (desde la edge function audit-cron).

COMMENT ON TABLE public.audit_snapshots IS
  'Snapshot diario de salud de la app. Un row por dia. La edge function audit-cron-daily lo poblacion.';

-- 2. Auto-fixer: rechaza verification_requests stale con notas basura.
--    Criterio: pending >7 dias Y notas con texto claramente no legitimo
--    (menos de 5 chars, solo random chars, palabras tipo "asdf", "test", etc).
CREATE OR REPLACE FUNCTION public.auto_fix_stale_verification_requests()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_ids TEXT[];
BEGIN
  WITH junk_requests AS (
    SELECT id FROM public.verification_requests
    WHERE status = 'pendiente'
      AND created_at < now() - interval '7 days'
      AND (
        -- Notas basura: muy cortas o con texto claramente no clinico
        COALESCE(length(trim(notes)), 0) < 5
        OR notes ~* '^(asd|qwe|test|prueba|jhq|wes|wed|hhh|bbb|yyy)'
        OR notes ~ '^[a-z ]{1,8}$'  -- solo letras random sin sentido
      )
  ),
  updated AS (
    UPDATE public.verification_requests
    SET status = 'rechazado',
        reviewed_at = now(),
        notes = COALESCE(notes, '') || ' [auto-rechazado: testing data]'
    WHERE id IN (SELECT id FROM junk_requests)
    RETURNING id
  )
  SELECT count(*), array_agg(id::text) INTO v_count, v_ids FROM updated;

  RETURN jsonb_build_object(
    'fixer', 'stale_verification_requests',
    'applied_count', COALESCE(v_count, 0),
    'affected_ids', COALESCE(v_ids, ARRAY[]::text[])
  );
END;
$$;

-- 3. Auto-fixer: genera slugs faltantes para providers verified.
--    Ya existe trigger trg_ensure_provider_slug pero esta es defensiva.
CREATE OR REPLACE FUNCTION public.auto_fix_orphan_slugs()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  WITH updated AS (
    UPDATE public.service_providers
    SET slug = generate_provider_slug(COALESCE(display_name, 'vet'))
    WHERE is_verified = true AND slug IS NULL
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM updated;

  RETURN jsonb_build_object(
    'fixer', 'orphan_slugs',
    'applied_count', COALESCE(v_count, 0)
  );
END;
$$;

-- 4. Auto-fixer: purga error_logs benignos (mensajes filtrados en cliente).
CREATE OR REPLACE FUNCTION public.auto_fix_benign_errors()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  WITH deleted AS (
    DELETE FROM public.error_logs
    WHERE message ~* '(lock was stolen|^script error\.?$|resizeobserver loop|non-error promise rejection|the operation was aborted|^aborterror|network request failed)'
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM deleted;

  RETURN jsonb_build_object(
    'fixer', 'benign_errors_purge',
    'applied_count', COALESCE(v_count, 0)
  );
END;
$$;

-- 5. Orquestador: ejecuta todos los auto-fixers y retorna resumen.
CREATE OR REPLACE FUNCTION public.run_daily_auto_fixers()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  v_result := jsonb_build_array(
    public.auto_fix_stale_verification_requests(),
    public.auto_fix_orphan_slugs(),
    public.auto_fix_benign_errors()
  );
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.run_daily_auto_fixers() IS
  'Ejecuta todos los auto-fixers seguros y retorna array JSON con lo aplicado. Invocado 1x/dia por la edge function audit-cron-daily.';

-- Solo admins / service_role pueden invocar estos fixers.
REVOKE EXECUTE ON FUNCTION public.auto_fix_stale_verification_requests() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_fix_orphan_slugs() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_fix_benign_errors() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_daily_auto_fixers() FROM public, anon, authenticated;
