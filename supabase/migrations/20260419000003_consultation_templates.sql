-- ============================================================================
-- DIFERENCIADOR: Plantillas de consulta para veterinarios
-- Reduce 30-40% del tiempo de data entry del vet
-- Aplicar MANUALMENTE en Supabase Dashboard > SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.consultation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'vacunacion', 'control_sano', 'post_esterilizacion',
    'dermatologia', 'geriatrico', 'urgencia', 'otro'
  )),
  template_body JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT TRUE,
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultation_templates_provider
  ON consultation_templates (provider_id) WHERE provider_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consultation_templates_system
  ON consultation_templates (is_system) WHERE is_system = TRUE;

-- RLS
ALTER TABLE consultation_templates ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver plantillas del sistema
CREATE POLICY "System templates visible to all"
  ON consultation_templates FOR SELECT
  USING (is_system = TRUE);

-- Providers ven sus propias plantillas custom
CREATE POLICY "Provider sees own templates"
  ON consultation_templates FOR SELECT
  USING (provider_id IN (
    SELECT id FROM service_providers WHERE user_id = auth.uid()
  ));

-- Providers pueden crear plantillas custom
CREATE POLICY "Provider creates own templates"
  ON consultation_templates FOR INSERT
  WITH CHECK (
    is_system = FALSE
    AND provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

-- Providers pueden actualizar sus propias plantillas
CREATE POLICY "Provider updates own templates"
  ON consultation_templates FOR UPDATE
  USING (
    is_system = FALSE
    AND provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

-- Providers pueden eliminar sus propias plantillas
CREATE POLICY "Provider deletes own templates"
  ON consultation_templates FOR DELETE
  USING (
    is_system = FALSE
    AND provider_id IN (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- SEED: 5 plantillas del sistema
-- ============================================================================

INSERT INTO consultation_templates (name, category, template_body, is_system, provider_id) VALUES
(
  'Vacunación rutinaria',
  'vacunacion',
  '{
    "note_type": "vacuna",
    "title": "Vacunación rutinaria",
    "description_template": "Paciente {pet_name} ({species}, {breed}). Se administra vacuna {vaccine_name}. Lote: {batch}. Vía: {route}. Sin reacciones adversas inmediatas.",
    "fields": ["vaccine_name", "batch", "route", "next_date"],
    "defaults": {"route": "SC"}
  }'::jsonb,
  TRUE,
  NULL
),
(
  'Control sano anual',
  'control_sano',
  '{
    "note_type": "control",
    "title": "Control sano anual",
    "description_template": "Control anual de {pet_name}. Peso: {weight} kg. Temperatura: {temp}°C. FC: {heart_rate} bpm. FR: {resp_rate} rpm. Mucosas rosadas, hidratación adecuada. {observations}",
    "fields": ["weight", "temp", "heart_rate", "resp_rate", "observations"],
    "defaults": {}
  }'::jsonb,
  TRUE,
  NULL
),
(
  'Post-esterilización día 1',
  'post_esterilizacion',
  '{
    "note_type": "cirugia",
    "title": "Control post-esterilización día 1",
    "description_template": "Control post-quirúrgico día 1. Herida: {wound_status}. Apetito: {appetite}. Actividad: {activity}. Dolor (escala 0-5): {pain_score}. {observations}",
    "fields": ["wound_status", "appetite", "activity", "pain_score", "observations"],
    "defaults": {"wound_status": "Limpia, sin signos de infección", "appetite": "Normal", "activity": "Reducida (esperable)"}
  }'::jsonb,
  TRUE,
  NULL
),
(
  'Consulta dermatológica',
  'dermatologia',
  '{
    "note_type": "consulta",
    "title": "Consulta dermatológica",
    "description_template": "Motivo: {reason}. Localización lesiones: {location}. Tipo: {lesion_type}. Prurito (0-10): {pruritus}. Tiempo evolución: {duration}. Tratamientos previos: {previous_tx}. Plan: {plan}",
    "fields": ["reason", "location", "lesion_type", "pruritus", "duration", "previous_tx", "plan"],
    "defaults": {}
  }'::jsonb,
  TRUE,
  NULL
),
(
  'Control geriátrico',
  'geriatrico',
  '{
    "note_type": "control",
    "title": "Control geriátrico",
    "description_template": "Control geriátrico de {pet_name} ({age} años). Peso: {weight} kg ({weight_trend}). Movilidad: {mobility}. Visión: {vision}. Audición: {hearing}. Apetito: {appetite}. Exámenes sugeridos: {exams}. {observations}",
    "fields": ["weight", "weight_trend", "mobility", "vision", "hearing", "appetite", "exams", "observations"],
    "defaults": {"exams": "Hemograma, perfil bioquímico, orina completa"}
  }'::jsonb,
  TRUE,
  NULL
)
ON CONFLICT (id) DO NOTHING;
