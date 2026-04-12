-- Tablas para grupos/comunidad por raza o condición médica
CREATE TABLE IF NOT EXISTS community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  category text,
  group_type text CHECK (group_type IN ('breed', 'condition', 'location', 'general')),
  is_public boolean DEFAULT true,
  member_count int DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_group_members (
  group_id uuid REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON community_group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON community_group_members(user_id);

-- RLS
ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_messages ENABLE ROW LEVEL SECURITY;

-- Políticas: drop si existen + recrear (idempotente)
DROP POLICY IF EXISTS "Grupos públicos visibles" ON community_groups;
CREATE POLICY "Grupos públicos visibles" ON community_groups
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Miembros pueden ver su membresía" ON community_group_members;
CREATE POLICY "Miembros pueden ver su membresía" ON community_group_members
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Miembros pueden unirse" ON community_group_members;
CREATE POLICY "Miembros pueden unirse" ON community_group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Miembros pueden salir" ON community_group_members;
CREATE POLICY "Miembros pueden salir" ON community_group_members
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Miembros pueden leer mensajes de sus grupos" ON community_group_messages;
CREATE POLICY "Miembros pueden leer mensajes de sus grupos" ON community_group_messages
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM community_group_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Miembros pueden enviar mensajes" ON community_group_messages;
CREATE POLICY "Miembros pueden enviar mensajes" ON community_group_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND group_id IN (SELECT group_id FROM community_group_members WHERE user_id = auth.uid())
  );

-- Trigger para actualizar member_count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_group_member_count ON community_group_members;
CREATE TRIGGER trg_update_group_member_count
  AFTER INSERT OR DELETE ON community_group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Grupos semilla
INSERT INTO community_groups (name, slug, description, category, group_type) VALUES
  ('Displasia de cadera', 'displasia-cadera', 'Comunidad para dueños de mascotas con displasia de cadera. Comparte experiencias y tips.', 'Salud', 'condition'),
  ('Diabetes felina', 'diabetes-felina', 'Grupo de apoyo para dueños de gatos diabéticos. Control de glucosa y alimentación.', 'Salud', 'condition'),
  ('Labradores Chile', 'labradores-chile', 'Todo sobre Labradores Retriever en Chile. Fotos, consejos y diversión.', 'Razas', 'breed'),
  ('Gatos rescatados', 'gatos-rescatados', 'Comunidad de gatos rescatados y adoptados. Historias de éxito y apoyo.', 'Adopción', 'general'),
  ('Perros senior', 'perros-senior', 'Cuidados especiales para perros mayores de 8 años. Salud, alimentación y bienestar.', 'Salud', 'condition')
ON CONFLICT (slug) DO NOTHING;
