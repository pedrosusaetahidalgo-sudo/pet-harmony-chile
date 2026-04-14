-- Cambiar default de service_providers a 'pending' + índices de performance
-- Hallazgo de auditoría backend 2026-04-14

-- =============================================
-- 1. Cambiar default de 'approved' a 'pending'
-- =============================================
ALTER TABLE public.service_providers
  ALTER COLUMN status SET DEFAULT 'pending';

-- =============================================
-- 2. Índices faltantes para queries frecuentes
-- =============================================

-- Posts: feed "siguiendo" filtra por user_id + orden cronológico
CREATE INDEX IF NOT EXISTS idx_posts_user_created
  ON public.posts (user_id, created_at DESC);

-- Medical records: ficha clínica filtrada por tipo y fecha
CREATE INDEX IF NOT EXISTS idx_medical_records_pet_type_date
  ON public.medical_records (pet_id, record_type, date DESC);

-- Service reviews: dashboard vet filtra por proveedor + visibilidad
CREATE INDEX IF NOT EXISTS idx_service_reviews_provider_visible
  ON public.service_reviews (provider_id, is_visible);

-- Pet vet links: listar solicitudes pendientes
CREATE INDEX IF NOT EXISTS idx_pet_vet_links_status_date
  ON public.pet_vet_links (status, created_at DESC);

-- Post saves: bookmarks del usuario (solo si la tabla existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_saves') THEN
    CREATE INDEX IF NOT EXISTS idx_post_saves_user_date ON public.post_saves (user_id, created_at DESC);
  END IF;
END $$;
