-- ══════════════════════════════════════════════════════════════
-- AI Quality Improvements Migration
-- Adds AI classification columns to feedback_in_app
-- NO aplicar automaticamente. Pedro lo aplica desde Supabase Dashboard > SQL Editor.
-- ══════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────
-- feedback_in_app: columnas para clasificacion IA
-- ────────────────────────────────────────────────────────
ALTER TABLE public.feedback_in_app
  ADD COLUMN IF NOT EXISTS ai_category TEXT,
  ADD COLUMN IF NOT EXISTS ai_sentiment TEXT,
  ADD COLUMN IF NOT EXISTS ai_urgency TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_suggested_response TEXT,
  ADD COLUMN IF NOT EXISTS ai_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_classified_at TIMESTAMPTZ;

-- Index for filtering by AI classification
CREATE INDEX IF NOT EXISTS idx_feedback_ai_category
  ON public.feedback_in_app (ai_category)
  WHERE ai_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_ai_urgency
  ON public.feedback_in_app (ai_urgency)
  WHERE ai_urgency IS NOT NULL;

COMMENT ON COLUMN public.feedback_in_app.ai_category IS 'AI-classified category: bug|ux|feature_request|praise|complaint|question|content|security|other';
COMMENT ON COLUMN public.feedback_in_app.ai_sentiment IS 'AI-detected sentiment: positive|neutral|negative';
COMMENT ON COLUMN public.feedback_in_app.ai_urgency IS 'AI-assessed urgency: critical|high|medium|low';
COMMENT ON COLUMN public.feedback_in_app.ai_summary IS 'AI-generated 1-line summary';
COMMENT ON COLUMN public.feedback_in_app.ai_suggested_response IS 'AI-suggested response to user';
COMMENT ON COLUMN public.feedback_in_app.ai_tags IS 'AI-generated tags array';
COMMENT ON COLUMN public.feedback_in_app.ai_classified_at IS 'When AI classification was performed';
