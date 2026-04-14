-- Tabla ai_usage: rate limiting por skill/día para edge functions de IA.
-- Usada por pet-assistant, ocr-vaccination-card y _shared/ai-base.ts.
-- NO aplicar automáticamente. Pedro la aplica desde Supabase Dashboard > SQL Editor.

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  calls_today INTEGER NOT NULL DEFAULT 0,
  calls_total INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_called_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_name)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- service_role: acceso total (para edge functions con service_role key puro)
DROP POLICY IF EXISTS "ai_usage_service_role_only" ON public.ai_usage;
CREATE POLICY "ai_usage_service_role_only"
  ON public.ai_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- authenticated: usuario puede leer/escribir sus propias filas
-- (necesario porque algunas edge functions crean el client con SERVICE_ROLE_KEY
--  pero pasan el Authorization header del usuario, lo que hace que PostgREST
--  aplique RLS como authenticated en vez de service_role)
DROP POLICY IF EXISTS "ai_usage_authenticated_own_rows" ON public.ai_usage;
CREATE POLICY "ai_usage_authenticated_own_rows"
  ON public.ai_usage
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indice para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_skill
  ON public.ai_usage (user_id, skill_name);

COMMENT ON TABLE public.ai_usage IS 'Rate limiting diario por usuario y skill para edge functions de IA';
