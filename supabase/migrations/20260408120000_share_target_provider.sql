-- Permite vincular un medical_share_token con un provider (vet) objetivo.
-- Cuando el dueño elige un vet en particular al generar el enlace, se setea
-- target_provider_id. El dashboard del vet usa esta columna para mostrar
-- "Fichas compartidas contigo" sin necesidad de que el vet abra el enlace.
--
-- Nullable: mantiene compatibilidad con tokens "publicos" sin destinatario.

ALTER TABLE medical_share_tokens
  ADD COLUMN target_provider_id uuid
  REFERENCES service_providers(id) ON DELETE SET NULL;

CREATE INDEX idx_medical_share_tokens_target_provider
  ON medical_share_tokens(target_provider_id)
  WHERE target_provider_id IS NOT NULL;

COMMENT ON COLUMN medical_share_tokens.target_provider_id IS
  'Provider (vet) al que el dueño dirigio explicitamente este enlace. NULL = enlace publico.';
