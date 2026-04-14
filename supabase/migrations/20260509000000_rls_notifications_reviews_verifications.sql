-- RLS: proteger notifications, review_invitations y provider_verifications
-- Hallazgo de auditoría backend 2026-04-14

-- =============================================
-- 1. NOTIFICATIONS — asegurar RLS (tabla ya existe)
-- =============================================
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

-- =============================================
-- 2. REVIEW_INVITATIONS — habilitar RLS
-- =============================================
ALTER TABLE public.review_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can view own invitations" ON public.review_invitations;
CREATE POLICY "Providers can view own invitations"
  ON public.review_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE service_providers.id = review_invitations.provider_id
        AND service_providers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Providers can create invitations" ON public.review_invitations;
CREATE POLICY "Providers can create invitations"
  ON public.review_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE service_providers.id = review_invitations.provider_id
        AND service_providers.user_id = auth.uid()
    )
  );

-- Admins can manage all
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.review_invitations;
CREATE POLICY "Admins can manage invitations"
  ON public.review_invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- 3. PROVIDER_VERIFICATIONS — habilitar RLS
-- =============================================
ALTER TABLE public.provider_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can view own verification" ON public.provider_verifications;
CREATE POLICY "Providers can view own verification"
  ON public.provider_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE service_providers.id = provider_verifications.provider_id
        AND service_providers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Providers can submit verification" ON public.provider_verifications;
CREATE POLICY "Providers can submit verification"
  ON public.provider_verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE service_providers.id = provider_verifications.provider_id
        AND service_providers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage verifications" ON public.provider_verifications;
CREATE POLICY "Admins can manage verifications"
  ON public.provider_verifications FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
