-- ══════════════════════════════════════════════════════════════
-- CC-31 — Auto-cancel bookings pendientes tras 24h sin confirmar
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
-- DEPENDENCIAS: pg_cron extension
--
-- Contexto (BOOKING_SYSTEM_MASTER_PLAN §13.3 + TICKET-27):
--   Bookings en status='pendiente' que el vet no confirmó en 24h
--   contaminan el inbox del tutor y ocupan slots. Política:
--   auto-cancelar con motivo "No confirmado a tiempo" para liberar
--   el slot y notificar al tutor (via trigger existente).
--
--   El trigger `log_booking_status_change` (20260520) ya registra el
--   evento. El trigger `notify_booking_status_change` (20260701) ya
--   envía push al owner si es el vet quien cancela — este cron NO
--   notifica (actor='system' skipea el push), pero la notif in-app
--   sigue disparando.
--
-- Frecuencia: cada 1 hora (UTC). Ventana efectiva: cancela los
-- bookings que crearon hace >= 24h Y siguen en 'pendiente'.
--
-- Idempotente: cron con mismo nombre se replace.
-- ══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ─── Función: hace el UPDATE ───
CREATE OR REPLACE FUNCTION public.auto_cancel_stale_pending_bookings()
RETURNS TABLE (cancelled_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH stale AS (
    SELECT id
    FROM vet_bookings
    WHERE status = 'pendiente'
      AND created_at < NOW() - INTERVAL '24 hours'
      -- No cancelar los que ya pasaron por otro estado: redundante
      -- porque status='pendiente' ya implica no confirmado, pero lo
      -- dejamos explícito para claridad.
      AND confirmed_at IS NULL
      AND canceled_at IS NULL
    LIMIT 200  -- safety cap: evita corridas masivas inesperadas.
  )
  UPDATE vet_bookings b
  SET
    status = 'cancelado',
    canceled_at = NOW(),
    canceled_by = NULL,  -- system-cancel, no hay actor user
    cancellation_reason = 'No confirmado por el veterinario dentro de 24h',
    updated_at = NOW()
  FROM stale
  WHERE b.id = stale.id;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  cancelled_count := v_count;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auto_cancel_stale_pending_bookings() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_cancel_stale_pending_bookings() TO service_role;

COMMENT ON FUNCTION public.auto_cancel_stale_pending_bookings IS
  'Booking V3 CC-31: cron cancela bookings pendientes >24h. Safety cap 200 filas por corrida.';

-- ─── Cron job ───
-- Desprogramar si existe (idempotencia).
SELECT cron.unschedule('auto-cancel-stale-pending-bookings')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-cancel-stale-pending-bookings'
);

-- Programar: cada hora en el minuto 17 (evita colisiones con otros crons
-- programados en :00).
SELECT cron.schedule(
  'auto-cancel-stale-pending-bookings',
  '17 * * * *',
  $$SELECT public.auto_cancel_stale_pending_bookings();$$
);

-- ──────────────────────────────────────────────────────────────
-- Verificación:
--
--   -- Ver el cron programado
--   SELECT jobname, schedule, active FROM cron.job
--   WHERE jobname = 'auto-cancel-stale-pending-bookings';
--
--   -- Probar manualmente
--   SELECT * FROM auto_cancel_stale_pending_bookings();
--
--   -- Auditar bookings cancelados por este cron (motivo único)
--   SELECT id, canceled_at, cancellation_reason
--   FROM vet_bookings
--   WHERE cancellation_reason LIKE '%No confirmado por el veterinario%'
--   ORDER BY canceled_at DESC
--   LIMIT 20;
--
-- Rollback:
--   SELECT cron.unschedule('auto-cancel-stale-pending-bookings');
--   DROP FUNCTION IF EXISTS public.auto_cancel_stale_pending_bookings();
-- ──────────────────────────────────────────────────────────────
