-- ══════════════════════════════════════════════════════════════
-- D.4 — User notification preferences (auditoria top-tier 2026-04-21)
-- ══════════════════════════════════════════════════════════════
-- Pedro: aplicar desde Supabase Dashboard > SQL Editor.
--
-- Tabla de preferencias de notificaciones por usuario, con toggles
-- granulares por tipo. Se consulta antes de:
--   - Enviar push notification (edge fns de booking/reminder/co_owner)
--   - Insertar notis in-app de categorias opt-in (daily_digest)
--   - Enviar email de digest/weekly
--
-- Defaults pensados para minimizar friccion: transaccionales en true
-- (recordatorios, pagos, invitaciones), marketing/digests en false.
--
-- Idempotente: CREATE TABLE IF NOT EXISTS + upsert RLS.
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaccionales: default true (mandar salvo opt-out explicito)
  transactional_push BOOLEAN NOT NULL DEFAULT TRUE,
  transactional_email BOOLEAN NOT NULL DEFAULT TRUE,
  -- Cubren: bookings (confirmada/recordatorio/cancelada), pagos (success/fail),
  -- pet_co_owner_invite, medical_share, review_received.

  -- Recordatorios de la mascota (vacuna proxima, control): default true
  pet_reminders_push BOOLEAN NOT NULL DEFAULT TRUE,
  pet_reminders_email BOOLEAN NOT NULL DEFAULT FALSE,

  -- Daily digest (epica C.1): default false (opt-in)
  daily_digest_push BOOLEAN NOT NULL DEFAULT FALSE,
  daily_digest_email BOOLEAN NOT NULL DEFAULT FALSE,
  daily_digest_in_app BOOLEAN NOT NULL DEFAULT TRUE,
  -- In-app es default true porque ya se muestra hoy; push/email son opt-in.

  -- Weekly report (ya existe cron): default true en email, false push
  weekly_digest_email BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_digest_push BOOLEAN NOT NULL DEFAULT FALSE,

  -- Marketing / growth (nuevos features, tips, encuestas): default false
  marketing_email BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_push BOOLEAN NOT NULL DEFAULT FALSE,

  -- Social (feed, follows, likes): default true in_app, false push/email
  social_push BOOLEAN NOT NULL DEFAULT FALSE,
  social_in_app BOOLEAN NOT NULL DEFAULT TRUE,

  -- Gamificacion (achievements, misiones, Paw Points): in_app default, resto no
  gamification_push BOOLEAN NOT NULL DEFAULT FALSE,
  gamification_in_app BOOLEAN NOT NULL DEFAULT TRUE,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_notification_prefs IS
  'Toggles granulares de notificaciones por user. Las edge fns deben consultar user_can_receive(user_id, category, channel) antes de disparar.';

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION public.touch_user_notification_prefs()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_notification_prefs_touch
  ON public.user_notification_prefs;
CREATE TRIGGER trg_user_notification_prefs_touch
  BEFORE UPDATE ON public.user_notification_prefs
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_user_notification_prefs();

-- RLS: user lee/edita sus propias prefs
ALTER TABLE public.user_notification_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_prefs_rw" ON public.user_notification_prefs;
CREATE POLICY "own_prefs_rw"
  ON public.user_notification_prefs
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "service_all" ON public.user_notification_prefs;
CREATE POLICY "service_all"
  ON public.user_notification_prefs
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ──────────────────────────────────────────────────────────────
-- RPC: consulta si un user puede recibir X categoria en Y canal
-- Usada por edge fns antes de enviar push/email.
-- Si el user no tiene row, devuelve default (true para transaccionales,
-- true para pet_reminders, in_app para daily_digest, etc).
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.user_can_receive_notification(
  p_user_id UUID,
  p_category TEXT,       -- 'transactional' | 'pet_reminders' | 'daily_digest' | 'weekly_digest' | 'marketing' | 'social' | 'gamification'
  p_channel  TEXT        -- 'push' | 'email' | 'in_app'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_prefs public.user_notification_prefs;
BEGIN
  SELECT * INTO v_prefs FROM public.user_notification_prefs WHERE user_id = p_user_id;

  -- Si no hay row, usar defaults del schema (mismos valores)
  IF NOT FOUND THEN
    RETURN CASE
      WHEN p_category = 'transactional' AND p_channel IN ('push', 'email') THEN TRUE
      WHEN p_category = 'pet_reminders' AND p_channel = 'push' THEN TRUE
      WHEN p_category = 'pet_reminders' AND p_channel = 'email' THEN FALSE
      WHEN p_category = 'daily_digest' AND p_channel = 'in_app' THEN TRUE
      WHEN p_category = 'daily_digest' THEN FALSE
      WHEN p_category = 'weekly_digest' AND p_channel = 'email' THEN TRUE
      WHEN p_category = 'weekly_digest' THEN FALSE
      WHEN p_category = 'marketing' THEN FALSE
      WHEN p_category = 'social' AND p_channel = 'in_app' THEN TRUE
      WHEN p_category = 'social' THEN FALSE
      WHEN p_category = 'gamification' AND p_channel = 'in_app' THEN TRUE
      WHEN p_category = 'gamification' THEN FALSE
      ELSE TRUE  -- default permisivo si categoria desconocida
    END;
  END IF;

  -- Con prefs explicitas
  RETURN CASE
    WHEN p_category = 'transactional' AND p_channel = 'push' THEN v_prefs.transactional_push
    WHEN p_category = 'transactional' AND p_channel = 'email' THEN v_prefs.transactional_email
    WHEN p_category = 'pet_reminders' AND p_channel = 'push' THEN v_prefs.pet_reminders_push
    WHEN p_category = 'pet_reminders' AND p_channel = 'email' THEN v_prefs.pet_reminders_email
    WHEN p_category = 'daily_digest' AND p_channel = 'push' THEN v_prefs.daily_digest_push
    WHEN p_category = 'daily_digest' AND p_channel = 'email' THEN v_prefs.daily_digest_email
    WHEN p_category = 'daily_digest' AND p_channel = 'in_app' THEN v_prefs.daily_digest_in_app
    WHEN p_category = 'weekly_digest' AND p_channel = 'push' THEN v_prefs.weekly_digest_push
    WHEN p_category = 'weekly_digest' AND p_channel = 'email' THEN v_prefs.weekly_digest_email
    WHEN p_category = 'marketing' AND p_channel = 'push' THEN v_prefs.marketing_push
    WHEN p_category = 'marketing' AND p_channel = 'email' THEN v_prefs.marketing_email
    WHEN p_category = 'social' AND p_channel = 'push' THEN v_prefs.social_push
    WHEN p_category = 'social' AND p_channel = 'in_app' THEN v_prefs.social_in_app
    WHEN p_category = 'gamification' AND p_channel = 'push' THEN v_prefs.gamification_push
    WHEN p_category = 'gamification' AND p_channel = 'in_app' THEN v_prefs.gamification_in_app
    ELSE TRUE
  END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.user_can_receive_notification(UUID, TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.user_can_receive_notification(UUID, TEXT, TEXT) TO authenticated, service_role;

-- ──────────────────────────────────────────────────────────────
-- Verificacion:
--
--   -- Default para user sin prefs explicitas:
--   SELECT public.user_can_receive_notification(
--     auth.uid(), 'transactional', 'push'
--   );  -- true
--   SELECT public.user_can_receive_notification(
--     auth.uid(), 'marketing', 'email'
--   );  -- false
--
--   -- Crear row con opt-out explicito:
--   INSERT INTO public.user_notification_prefs (user_id, transactional_push)
--     VALUES (auth.uid(), false)
--     ON CONFLICT (user_id) DO UPDATE SET transactional_push = false;
--
--   SELECT public.user_can_receive_notification(
--     auth.uid(), 'transactional', 'push'
--   );  -- false ahora
-- ──────────────────────────────────────────────────────────────
