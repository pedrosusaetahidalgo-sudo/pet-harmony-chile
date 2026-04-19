-- Tabla device_tokens: registra push notifications tokens nativos (FCM/APNs).
-- Booking System Overhaul §12.2. Prerrequisito para backend push (Fase 3.4).
--
-- Zero-downtime: tabla nueva. El frontend Capacitor ya recibe tokens; hasta ahora
-- no se persistian. Al correr esta migracion, el cliente empezara a guardarlos
-- en la proxima sesion (ver App.tsx push listener).

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  token TEXT NOT NULL,
  device_name TEXT,                                   -- ej: "iPhone de Pedro"
  app_version TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,              -- user puede desactivar push sin borrar el token
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, token)
);

COMMENT ON TABLE public.device_tokens IS
  'Tokens de push nativo por usuario/dispositivo. Multi-device (un user puede tener varios). Util para enviar push de booking reminders, cancelaciones, etc.';

-- ─── Indexes ───

CREATE INDEX IF NOT EXISTS idx_device_tokens_user
  ON public.device_tokens (user_id) WHERE enabled = true;

-- Busqueda por token para detectar duplicados cross-user (ej: user vendio su telefono)
CREATE INDEX IF NOT EXISTS idx_device_tokens_token
  ON public.device_tokens (token);

-- ─── Trigger: actualizar last_seen_at al update ───

CREATE OR REPLACE FUNCTION public.update_device_token_last_seen()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_seen_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_device_tokens_last_seen ON public.device_tokens;
CREATE TRIGGER trg_device_tokens_last_seen
  BEFORE UPDATE ON public.device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_device_token_last_seen();

-- ─── RLS ───

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_all ON public.device_tokens;
CREATE POLICY service_all ON public.device_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Usuario: CRUD de sus propios tokens (para opt-out/opt-in)
DROP POLICY IF EXISTS owner_crud ON public.device_tokens;
CREATE POLICY owner_crud ON public.device_tokens
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
