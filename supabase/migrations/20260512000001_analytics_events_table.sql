-- Analytics events: telemetria completa de uso de la plataforma
-- Page views, dwell time, feature usage, edge function calls, sessions

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view', 'page_leave', 'feature_use', 'edge_function_call',
    'session_start', 'session_end', 'button_click', 'error'
  )),
  event_name TEXT NOT NULL,
  -- page_view: '/home', '/ficha/abc123'
  -- feature_use: 'pdf_download', 'ocr_scan', 'ai_assistant', 'booking_create'
  -- edge_function_call: 'generate-medical-summary', 'pet-assistant'
  -- button_click: 'upgrade_cta', 'share_medical'
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT, -- UUID generado client-side por sesion de navegador
  metadata JSONB DEFAULT '{}'::jsonb,
  -- page_view: { referrer, device, browser }
  -- page_leave: { dwell_time_ms, scroll_depth }
  -- feature_use: { context, result }
  -- edge_function_call: { execution_time_ms, status, model }
  duration_ms INT, -- dwell time para page_leave, execution time para edge functions
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices para queries de analytics
CREATE INDEX idx_analytics_type_created ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_name_created ON analytics_events(event_name, created_at DESC);
CREATE INDEX idx_analytics_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_session ON analytics_events(session_id, created_at DESC);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);

-- Particionar por fecha para performance (manual cleanup)
-- DELETE FROM analytics_events WHERE created_at < now() - interval '180 days';

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer analytics
CREATE POLICY "Admin can read analytics"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true)
  );

-- Authenticated users can insert their own events
CREATE POLICY "Users can insert own events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Service role inserts from edge functions (no policy needed, bypasses RLS)
