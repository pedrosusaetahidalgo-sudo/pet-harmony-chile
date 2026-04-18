-- ==========================================================================
-- Deprecate auto_fix_benign_errors: la causa se fixea en origen.
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-17):
-- El auto_fix_benign_errors BORRABA filas de error_logs cuyo message
-- matcheaba patrones benignos ("Lock was stolen", "Script error", etc).
-- Eso es un PARCHE: arregla el sintoma (log inflado) no la CAUSA (que
-- esos errores se reporten).
--
-- Fix escalable aplicado en supabase/functions/log-error/index.ts:
-- la edge function ahora rechaza esos mensajes ANTES de insertar.
-- Respuesta 200 con { filtered: 'benign_noise' } en vez de fila en DB.
--
-- Resultado: error_logs nunca mas se llena con ruido benigno desde
-- clientes actualizados, sin importar cuantas veces disparen.
--
-- Esta migracion:
--   1. Hace no-op la funcion auto_fix_benign_errors (retorna 0 fixes).
--   2. Actualiza run_daily_auto_fixers() para no invocarla.
--   3. Mantiene la funcion por compatibilidad (edge functions deployadas
--      antes del rollout pueden seguir llamandola).
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.auto_fix_benign_errors()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deprecated: el filtro ahora vive en log-error edge fn.
  -- No-op para no romper edge functions que aun la invoquen.
  RETURN jsonb_build_object(
    'fixer', 'benign_errors_purge',
    'applied_count', 0,
    'deprecated', true,
    'replacement', 'log-error edge fn filters at insert time'
  );
END;
$$;

COMMENT ON FUNCTION public.auto_fix_benign_errors() IS
  'DEPRECATED 2026-04-17: causa raiz fixeada en log-error edge fn. No-op.';

-- Orquestador: remueve la llamada al fixer deprecado. Los otros dos
-- siguen vigentes porque atacan causas reales.
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
    public.auto_fix_orphan_slugs()
    -- auto_fix_benign_errors: REMOVIDO. Causa fixeada en log-error.
  );
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.run_daily_auto_fixers() IS
  'Ejecuta auto-fixers que atacan causa raiz. Invocado 1x/dia por audit-cron-daily.';
