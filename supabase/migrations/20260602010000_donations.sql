-- ==========================================================================
-- Donations: validacion MVP del sistema de donaciones via Flow
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-18):
-- Tras el rating + would_pay, cuando el usuario contesta "yes" mostramos una
-- invitacion opcional: "Y si la dejamos gratis? Aceptas hacer una donacion?"
-- Esto es un experimento de validacion. NO se muestra en ningun otro lugar
-- todavia. El pago va por Flow (misma pasarela que Premium) pero NO otorga
-- plan Premium: es una donacion pura.
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_clp INT NOT NULL CHECK (amount_clp >= 500 AND amount_clp <= 500000),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  payment_provider TEXT NOT NULL DEFAULT 'flow',
  payment_provider_id TEXT,                 -- token de Flow
  commerce_order TEXT UNIQUE,               -- PFDON-<userShort>-<ts>
  source TEXT DEFAULT 'feedback_widget',    -- de donde vino
  feedback_id UUID REFERENCES public.feedback_in_app(id) ON DELETE SET NULL,
  message TEXT CHECK (message IS NULL OR length(message) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donations_user ON public.donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_provider_id ON public.donations(payment_provider_id)
  WHERE payment_provider_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_feedback ON public.donations(feedback_id)
  WHERE feedback_id IS NOT NULL;

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Usuario autenticado puede leer solo las suyas.
DROP POLICY IF EXISTS "donations_own_read" ON public.donations;
CREATE POLICY "donations_own_read"
  ON public.donations FOR SELECT
  USING (user_id = auth.uid());

-- Nadie inserta ni actualiza desde el cliente: todo pasa por la edge fn
-- que usa service role. Admin usa el helper is_active_admin.
DROP POLICY IF EXISTS "donations_admin_all" ON public.donations;
CREATE POLICY "donations_admin_all"
  ON public.donations FOR ALL
  USING (public.is_active_admin(auth.uid()))
  WITH CHECK (public.is_active_admin(auth.uid()));
