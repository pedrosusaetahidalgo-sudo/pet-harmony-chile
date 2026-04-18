-- ==========================================================================
-- Donations: capturar info del donante + trigger email de agradecimiento
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-18):
-- Extendemos la tabla donations para:
--  - Guardar el nombre del donante (aunque este anonimo a futuro).
--  - Opcion is_public para mostrar el nombre en una futura muralla de apoyo.
--  - thanked_at: marca cuando se envio el mail de agradecimiento personalizado.
--  - email_contact: email alternativo si el user no lo quiere del auth.
--
-- donor_name default al display_name del perfil o "Amigue peludo".
-- ==========================================================================

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS donor_name TEXT,
  ADD COLUMN IF NOT EXISTS email_contact TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS thanked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.donations.donor_name IS
  'Nombre que el donante quiere usar (puede ser nombre real o apodo). NULL = anonimo.';
COMMENT ON COLUMN public.donations.email_contact IS
  'Email alternativo para el agradecimiento si difiere del auth.users.email. NULL = usar auth email.';
COMMENT ON COLUMN public.donations.is_public IS
  'Si el donante autoriza mostrar su nombre y mensaje en una muralla publica de apoyo.';
COMMENT ON COLUMN public.donations.thanked_at IS
  'Timestamp en que el edge fn send-donation-thanks envio el mail de agradecimiento.';

CREATE INDEX IF NOT EXISTS idx_donations_pending_thanks
  ON public.donations(status)
  WHERE status = 'paid' AND thanked_at IS NULL;
