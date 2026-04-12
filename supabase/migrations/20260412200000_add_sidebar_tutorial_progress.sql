-- =============================================================================
-- Agrega columna JSONB para persistir progreso del tutorial guiado del sidebar.
-- Estructura: { completedSections: string[], dismissed: boolean }
-- =============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS sidebar_tutorial_progress jsonb DEFAULT '{"completedSections":[],"dismissed":false}'::jsonb;

COMMENT ON COLUMN public.profiles.sidebar_tutorial_progress IS 'Progreso del tutorial guiado del sidebar. Estructura: {completedSections: SectionKey[], dismissed: boolean}';
