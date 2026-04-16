-- ==========================================================================
-- Audit Export System: tabla export_jobs para tracking de exports
-- Permite generar snapshots Excel de toda la data del sistema.
--
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.
-- ==========================================================================

-- 1. Tabla export_jobs
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('full', 'period')),
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'processing', 'ready', 'failed', 'expired'
  )),
  progress_pct INT DEFAULT 0,
  error_message TEXT,
  file_path TEXT,
  file_size_bytes BIGINT,
  file_hash_sha256 TEXT,
  rows_total INT,
  sheets_count INT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  download_count INT DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ
);

-- 2. Indices
CREATE INDEX IF NOT EXISTS idx_export_jobs_requested_by ON export_jobs(requested_by);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_requested_at ON export_jobs(requested_at DESC);

-- 3. RLS
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- Solo admin puede ver y crear exports
CREATE POLICY "admin_read_export_jobs" ON export_jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "admin_insert_export_jobs" ON export_jobs
  FOR INSERT WITH CHECK (
    requested_by = auth.uid() AND
    EXISTS (SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "admin_update_export_jobs" ON export_jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_access WHERE user_id = auth.uid() AND is_active = true)
  );

-- 4. Comentarios
COMMENT ON TABLE export_jobs IS 'Tracking de exports de auditoria generados por admin';
COMMENT ON COLUMN export_jobs.export_type IS 'full = snapshot completo, period = filtrado por fechas';
COMMENT ON COLUMN export_jobs.filters IS 'JSON con from_date, to_date para exports por periodo';
COMMENT ON COLUMN export_jobs.file_path IS 'Ruta en Supabase Storage bucket audit-exports';
