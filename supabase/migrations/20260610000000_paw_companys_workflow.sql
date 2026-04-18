-- ==========================================================================
-- Paw Companys: workflow de aplicacion publica (pending/active/inactive/rejected)
-- ==========================================================================
-- Pedro: aplicar manualmente desde Supabase Dashboard > SQL Editor.
--
-- Contexto (2026-04-19):
-- Simetrico con paw_voices: permitimos que empresas apliquen publicamente
-- desde /paw-companys sin intervencion admin inicial. Admin revisa y
-- aprueba via Admin > Comercial > Paw Companys.
--
-- Cambios:
--   - Agrega columna `status` con workflow (pending/active/inactive/rejected).
--     Default 'active' para filas existentes (backward compat: sponsors ya
--     cargados por admin se consideran aprobados).
--   - Agrega columna `contact_email` para notificar al admin que llego una
--     solicitud, y para comunicarse con el aplicante.
--   - Nueva policy RLS INSERT publico con status='pending' AND is_active=false
--     AND featured=false AND notes IS NULL (anti-spam).
--   - La policy SELECT publica existente (WHERE is_active=true) se mantiene
--     para no romper PawCompanysGrid. Admin debe setear is_active=true al
--     aprobar (el flujo admin ya lo permite).
-- ==========================================================================

ALTER TABLE public.paw_companys
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

CREATE INDEX IF NOT EXISTS idx_paw_companys_status
  ON public.paw_companys(status, created_at DESC);

COMMENT ON COLUMN public.paw_companys.status IS
  'Workflow de aprobacion: pending (aplicacion publica pendiente) -> active (aprobado + is_active=true) | rejected | inactive. Default active para retrocompat.';

COMMENT ON COLUMN public.paw_companys.contact_email IS
  'Email de contacto para coordinar con el aplicante. Uso admin only (no se expone en grid publico).';

-- Nueva policy: permitir INSERT publico SOLO con status='pending' + is_active=false.
-- Combinado con los CHECKs existentes (name no vacio, slug valido, etc).
DROP POLICY IF EXISTS "paw_companys_public_apply" ON public.paw_companys;
CREATE POLICY "paw_companys_public_apply"
  ON public.paw_companys FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND is_active = false
    AND featured = false
    AND notes IS NULL
  );
