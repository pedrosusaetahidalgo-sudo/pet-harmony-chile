-- Tabla para guardar conversaciones del BereavementChat (con consentimiento del usuario)
CREATE TABLE IF NOT EXISTS bereavement_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id uuid REFERENCES pets(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  safety_flag boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS: solo el usuario puede ver sus propios mensajes
ALTER TABLE bereavement_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bereavement messages"
  ON bereavement_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bereavement messages"
  ON bereavement_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin puede leer todo (para safety logs)
CREATE POLICY "Admins can read all bereavement messages"
  ON bereavement_chat_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Índice para queries por usuario+pet
CREATE INDEX IF NOT EXISTS idx_bereavement_chat_user_pet
  ON bereavement_chat_messages(user_id, pet_id, created_at DESC);
