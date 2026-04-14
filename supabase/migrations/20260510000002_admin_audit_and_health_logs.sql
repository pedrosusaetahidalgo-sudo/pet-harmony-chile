-- Tablas de auditoria y monitoreo para el Admin Powerhouse
-- Spec: ADMIN_POWERHOUSE_SPEC.md secciones 11.2, 11.3

-- =============================================
-- 1. Admin Audit Log — registro de acciones admin
-- =============================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  -- Ejemplos: 'provider.approve', 'provider.reject', 'provider.suspend',
  -- 'provider.verify', 'user.add_role', 'user.remove_role', 'user.suspend',
  -- 'reward.create', 'reward.update', 'reward.delete',
  -- 'mission.create', 'ad.activate', 'ad.deactivate', 'ad.delete',
  -- 'settings.update_commission', 'verification.approve', 'verification.reject',
  -- 'moderation.dismiss', 'moderation.delete_content'
  target_type TEXT,
  -- 'provider' | 'user' | 'post' | 'comment' | 'reward' | 'mission' | 'ad' | 'promotion' | 'settings' | 'verification'
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  -- { "old_status": "pending", "new_status": "approved", "reason": "..." }
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_admin ON admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_target ON admin_audit_log(target_type, target_id);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Solo admins activos pueden leer audit log
CREATE POLICY "Admin can read audit log"
  ON admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Solo admins activos pueden insertar
CREATE POLICY "Admin can insert audit log"
  ON admin_audit_log FOR INSERT
  WITH CHECK (admin_user_id = auth.uid());

-- =============================================
-- 2. System Health Log — monitoreo de edge functions
-- =============================================

CREATE TABLE IF NOT EXISTS public.system_health_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  execution_time_ms INT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_health_created ON system_health_log(created_at DESC);
CREATE INDEX idx_health_function ON system_health_log(function_name, created_at DESC);
CREATE INDEX idx_health_errors ON system_health_log(status) WHERE status = 'error';

ALTER TABLE system_health_log ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer health logs
CREATE POLICY "Admin can read health logs"
  ON system_health_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Edge functions insertan via service_role (no necesita policy INSERT para anon/authenticated)
-- Se insertan desde edge functions con supabaseAdmin (service_role key)

-- =============================================
-- 3. Vet Verification Results — para IA-assisted verification (futuro)
-- =============================================

CREATE TABLE IF NOT EXISTS public.vet_verification_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  confidence_score INT NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  extracted_name TEXT,
  extracted_license TEXT,
  name_match_score FLOAT,
  document_quality TEXT CHECK (document_quality IN ('high', 'medium', 'low', 'unreadable')),
  auto_approved BOOLEAN DEFAULT false,
  admin_override BOOLEAN DEFAULT false,
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT, -- 'ai-verification' o UUID del admin
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vet_verif_provider ON vet_verification_results(provider_id);

ALTER TABLE vet_verification_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage vet verification results"
  ON vet_verification_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Cleanup: auto-purge health logs older than 30 days (run via cron or manual)
-- DELETE FROM system_health_log WHERE created_at < now() - interval '30 days';
