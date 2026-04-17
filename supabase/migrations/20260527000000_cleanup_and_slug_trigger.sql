-- ==========================================================================
-- Limpieza + hardening para partir monitoreo diario limpio
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contenido:
--   1. Backfill de slugs en service_providers verified sin slug.
--   2. Trigger AFTER INSERT/UPDATE para mantener slug poblado siempre.
--   3. Purge de error_logs antiguos (>30 dias) para reset de monitoreo.
--      Los 281 errores "Lock was stolen" son benignos y ya no se reportaran
--      mas (fix en useErrorReporter.ts + client.ts con storageKey+lock custom).
--   4. Purge de system_health_log antiguos (>14 dias) — metricas efimeras.
--   5. Purge de analytics_events antiguos (>90 dias) — retencion de compliance.
-- ==========================================================================

-- 1. Backfill de slugs para providers verified sin slug.
--    generate_provider_slug ya existe (migracion 20260406).
UPDATE public.service_providers
SET slug = generate_provider_slug(COALESCE(display_name, 'vet'))
WHERE is_verified = true
  AND slug IS NULL;

-- 2. Trigger para generar slug automaticamente al crear/actualizar provider.
--    Solo genera si display_name cambio y slug es NULL o quedo obsoleto.
CREATE OR REPLACE FUNCTION public.ensure_provider_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Caso 1: insert sin slug → generar.
  IF TG_OP = 'INSERT' AND NEW.slug IS NULL THEN
    NEW.slug := generate_provider_slug(COALESCE(NEW.display_name, 'vet'));
  END IF;

  -- Caso 2: update sin slug (raro, pero cubre reactivacion) → generar.
  IF TG_OP = 'UPDATE' AND NEW.slug IS NULL AND NEW.display_name IS NOT NULL THEN
    NEW.slug := generate_provider_slug(NEW.display_name);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_provider_slug ON public.service_providers;
CREATE TRIGGER trg_ensure_provider_slug
  BEFORE INSERT OR UPDATE OF display_name, slug ON public.service_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_provider_slug();

COMMENT ON FUNCTION public.ensure_provider_slug() IS
  'Garantiza que todo service_provider tenga slug al crearse o actualizar display_name. Complementa el backfill manual.';

-- 3. Purge error_logs antiguos (>30 dias) para reset de monitoreo.
--    Conservamos los ultimos 30 dias para diagnostico reciente.
DELETE FROM public.error_logs
WHERE created_at < now() - interval '30 days';

-- 3b. Purge errores benignos conocidos (ya filtrados en useErrorReporter).
--     Estos mensajes son ruido del navegador/Supabase y no representan bugs.
DELETE FROM public.error_logs
WHERE message ~* '(lock was stolen|^script error\.?$|resizeobserver loop|non-error promise rejection|the operation was aborted|^aborterror|network request failed)';

-- 4. Purge system_health_log antiguos (>14 dias) — ya se regenera a diario.
DELETE FROM public.system_health_log
WHERE created_at < now() - interval '14 days';

-- 5. Purge analytics_events antiguos (>90 dias) — retencion sana.
DELETE FROM public.analytics_events
WHERE created_at < now() - interval '90 days';

-- Verificacion post-purge (informativo en los logs de Supabase):
DO $$
DECLARE
  v_error_count INT;
  v_health_count INT;
  v_analytics_count INT;
  v_slugless INT;
BEGIN
  SELECT count(*) INTO v_error_count FROM public.error_logs;
  SELECT count(*) INTO v_health_count FROM public.system_health_log;
  SELECT count(*) INTO v_analytics_count FROM public.analytics_events;
  SELECT count(*) INTO v_slugless
  FROM public.service_providers WHERE is_verified = true AND slug IS NULL;

  RAISE NOTICE 'Cleanup aplicado. error_logs=%, system_health_log=%, analytics_events=%, providers_verified_sin_slug=%',
    v_error_count, v_health_count, v_analytics_count, v_slugless;
END;
$$;
