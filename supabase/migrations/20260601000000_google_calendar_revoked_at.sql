-- ==========================================================================
-- Agrega columna revoked_at a google_calendar_tokens
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-18):
-- Cuando Google devuelve 'invalid_grant' el refresh token esta revocado
-- o expiro (usuario dijo no quiero mas + pasaron 7 meses, o cambio de
-- scopes). Fix escalable: marcar el token como revocado en DB para que
-- el frontend sepa que debe mostrar "Reconecta Google Calendar" en vez
-- de reintentar y generar mas errores 500.
--
-- Null = activo. Timestamp = cuando se detecto la revocacion.
-- ==========================================================================

ALTER TABLE public.google_calendar_tokens
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.google_calendar_tokens.revoked_at IS
  'NULL = token activo. Timestamp = cuando la edge fn detecto invalid_grant. El frontend debe mostrar CTA de reconectar si revoked_at IS NOT NULL.';

-- Index parcial: consultas rapidas para "tokens activos del usuario X".
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_active
  ON public.google_calendar_tokens(user_id)
  WHERE revoked_at IS NULL;
