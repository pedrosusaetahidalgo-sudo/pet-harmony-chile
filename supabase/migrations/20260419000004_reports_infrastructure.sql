-- ============================================================================
-- REPORTES: Infraestructura para reportes semanales y mensuales
-- Aplicar MANUALMENTE en Supabase Dashboard > SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.periodic_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'owner_weekly', 'vet_weekly', 'owner_monthly', 'vet_monthly'
  )),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  content_jsonb JSONB NOT NULL DEFAULT '{}',
  pdf_url TEXT,
  sent_email_at TIMESTAMPTZ,
  sent_push_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_periodic_reports_user_date
  ON periodic_reports (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_periodic_reports_unread
  ON periodic_reports (user_id, viewed_at) WHERE viewed_at IS NULL;

-- RLS
ALTER TABLE periodic_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own reports"
  ON periodic_reports FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark own reports as viewed"
  ON periodic_reports FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Preferences en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS report_preferences JSONB DEFAULT '{
    "weekly_enabled": true,
    "monthly_enabled": true,
    "email_enabled": true,
    "push_enabled": true
  }'::jsonb;
