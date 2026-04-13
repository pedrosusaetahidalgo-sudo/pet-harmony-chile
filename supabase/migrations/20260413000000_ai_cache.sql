-- =============================================================
-- Tabla de cache para resultados de IA (breed-tips, medical-suggestions, shelters)
-- Evita llamadas redundantes a la API de Anthropic para datos que no cambian frecuentemente.
-- =============================================================

CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,        -- ej: "breed-tips:perro:labrador", "medical-suggestions:vacuna:perro:labrador"
  function_name TEXT NOT NULL,            -- ej: "breed-tips", "medical-suggestions", "generate-shelters"
  result JSONB NOT NULL,                  -- Respuesta cacheada (texto o JSON)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,        -- TTL: breed-tips=90d, medical-suggestions=30d, shelters=30d
  hit_count INTEGER NOT NULL DEFAULT 0    -- Cuantas veces se ha usado el cache
);

-- Indice para busqueda rapida por clave
CREATE INDEX idx_ai_cache_key ON ai_cache(cache_key);

-- Indice para limpieza de expirados
CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);

-- RLS: los datos de cache son publicos (lectura) pero solo el service role puede escribir
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer el cache
CREATE POLICY "Authenticated users can read cache"
  ON ai_cache FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Solo service role puede insertar/actualizar/eliminar
CREATE POLICY "Service role manages cache"
  ON ai_cache FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
