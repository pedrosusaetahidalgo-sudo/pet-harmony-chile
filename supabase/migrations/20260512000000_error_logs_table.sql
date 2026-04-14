-- Error logs: recopilacion centralizada de errores de toda la plataforma
-- Frontend JS, edge functions, Supabase queries, pagos, IA

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('frontend', 'edge_function', 'database', 'external')),
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('error', 'warning', 'critical')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_unresolved ON error_logs(resolved, created_at DESC) WHERE resolved = false;
CREATE INDEX idx_error_logs_source ON error_logs(source, created_at DESC);
CREATE INDEX idx_error_logs_severity ON error_logs(severity) WHERE severity = 'critical';

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read/manage all errors
CREATE POLICY "Admin can manage error logs"
  ON error_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true)
  );

-- Service role can insert (edge functions use service_role key)
-- Frontend inserts via log-error edge function (service_role)

-- Auto-cleanup: errors older than 90 days (run via cron or manual)
-- DELETE FROM error_logs WHERE created_at < now() - interval '90 days' AND resolved = true;
