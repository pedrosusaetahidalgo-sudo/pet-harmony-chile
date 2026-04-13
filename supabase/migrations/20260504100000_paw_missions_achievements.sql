-- Paw Missions + Logros desbloqueables
-- Sistema de misiones tipo TCG vinculado a la coleccion de Paw Cards

-- 0. Limpiar version anterior si existe (tabla de seed, sin datos de usuario)
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS paw_missions CASCADE;

-- 1. Tabla de definiciones de misiones (seed estatico)
CREATE TABLE paw_missions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'collection_species', 'collection_quantity', 'collection_rarity',
    'social', 'care'
  )),
  icon TEXT NOT NULL,
  achievement_title TEXT NOT NULL,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN (
    'collect_species', 'collect_count', 'collect_rarity',
    'be_collected', 'collect_owners', 'complete_reminders',
    'book_vet', 'complete_profile', 'memorial', 'collect_all_rarities',
    'collect_species_count'
  )),
  requirement_value JSONB NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de logros desbloqueados por usuario
CREATE TABLE user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL REFERENCES paw_missions(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their achievements"
  ON user_achievements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Titulo activo en perfil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_title TEXT;

-- 4. Seed de misiones
INSERT INTO paw_missions (id, title, description, category, icon, achievement_title, requirement_type, requirement_value, sort_order)
VALUES
  -- Coleccion por especie
  ('dog_lover', 'Amigo de los perros', 'Colecciona 3 Paw Cards de perros', 'collection_species', 'dog', 'Dog Lover', 'collect_species', '{"species":"perro","count":3}', 10),
  ('cat_whisperer', 'Amigo de los gatos', 'Colecciona 3 Paw Cards de gatos', 'collection_species', 'cat', 'Cat Whisperer', 'collect_species', '{"species":"gato","count":3}', 11),
  ('aqua_friend', 'Mundo acuatico', 'Colecciona 2 Paw Cards acuaticas', 'collection_species', 'fish', 'Aqua Friend', 'collect_species', '{"species":"pez,tortuga","count":2}', 12),
  ('reptile_explorer', 'Reptil hunter', 'Colecciona 2 Paw Cards de reptiles', 'collection_species', 'leaf', 'Reptile Explorer', 'collect_species', '{"species":"reptil,iguana,lagartija","count":2}', 13),
  ('bird_keeper', 'Aves del mundo', 'Colecciona 2 Paw Cards de aves', 'collection_species', 'bird', 'Bird Keeper', 'collect_species', '{"species":"ave,pajaro,loro,canario","count":2}', 14),
  ('furry_collector', 'Roedor lover', 'Colecciona 2 Paw Cards de roedores', 'collection_species', 'rabbit', 'Furry Collector', 'collect_species', '{"species":"hamster,conejo,cobaya,cuyo","count":2}', 15),
  ('exotic_finder', 'Amigo exotico', 'Colecciona 1 Paw Card rara', 'collection_species', 'sparkles', 'Exotic Finder', 'collect_species', '{"species":"huron,erizo,chinchilla,axolotl","count":1}', 16),
  ('noahs_ark', 'Arca de Noe', 'Colecciona de 5 especies distintas', 'collection_species', 'ship', 'Noahs Ark', 'collect_species_count', '{"distinct_species":5}', 17),

  -- Cantidad
  ('first_scan', 'Primer scan', 'Escanea tu primera Paw Card', 'collection_quantity', 'scan-line', 'First Scan', 'collect_count', '{"count":1}', 20),
  ('rookie_collector', 'Coleccionista novato', 'Colecciona 5 Paw Cards', 'collection_quantity', 'trophy', 'Rookie Collector', 'collect_count', '{"count":5}', 21),
  ('paw_collector', 'Coleccionista', 'Colecciona 15 Paw Cards', 'collection_quantity', 'trophy', 'Paw Collector', 'collect_count', '{"count":15}', 22),
  ('super_collector', 'Super coleccionista', 'Colecciona 30 Paw Cards', 'collection_quantity', 'medal', 'Super Collector', 'collect_count', '{"count":30}', 23),
  ('master_collector', 'Maestro coleccionista', 'Colecciona 50 Paw Cards', 'collection_quantity', 'crown', 'Master Collector', 'collect_count', '{"count":50}', 24),
  ('living_legend', 'Leyenda', 'Colecciona 100 Paw Cards', 'collection_quantity', 'flame', 'Living Legend', 'collect_count', '{"count":100}', 25),

  -- Rareza
  ('common_ground', 'Brillo comun', 'Colecciona 5 cartas Common', 'collection_rarity', 'circle', 'Common Ground', 'collect_rarity', '{"rarity":"common","count":5}', 30),
  ('rare_find', 'Destello raro', 'Colecciona 3 cartas Rare', 'collection_rarity', 'sparkle', 'Rare Find', 'collect_rarity', '{"rarity":"rare","count":3}', 31),
  ('epic_hunter', 'Epica victoria', 'Colecciona 1 carta Epic', 'collection_rarity', 'zap', 'Epic Hunter', 'collect_rarity', '{"rarity":"epic","count":1}', 32),
  ('legend_seeker', 'Legendario', 'Colecciona 1 carta Legendary', 'collection_rarity', 'star', 'Legend Seeker', 'collect_rarity', '{"rarity":"legendary","count":1}', 33),
  ('myth_buster', 'Mitico', 'Colecciona 1 carta Mythic', 'collection_rarity', 'flame', 'Myth Buster', 'collect_rarity', '{"rarity":"mythic","count":1}', 34),
  ('rarity_master', 'Full rarity', 'Al menos 1 de cada rareza', 'collection_rarity', 'layers', 'Rarity Master', 'collect_all_rarities', '{"rarities":["common","uncommon","rare","epic","legendary","mythic"]}', 35),

  -- Social
  ('popular_pet', 'Compartidor', 'Tu Paw Card: 5 coleccionistas', 'social', 'users', 'Popular Pet', 'be_collected', '{"count":5}', 40),
  ('viral_paw', 'Viral', 'Tu Paw Card: 20 coleccionistas', 'social', 'trending-up', 'Viral Paw', 'be_collected', '{"count":20}', 41),
  ('social_butterfly', 'Conector social', '10 duenos distintos', 'social', 'heart-handshake', 'Social Butterfly', 'collect_owners', '{"count":10}', 42),

  -- Cuidado
  ('dedicated_owner', 'Cuidador responsable', '7 recordatorios seguidos', 'care', 'check-circle', 'Dedicated Owner', 'complete_reminders', '{"streak":7}', 50),
  ('vet_visitor', 'Primera visita', 'Reserva una cita con un vet', 'care', 'stethoscope', 'Vet Visitor', 'book_vet', '{"count":1}', 51),
  ('health_hero', 'Ficha completa', 'Completa la ficha clinica', 'care', 'clipboard-check', 'Health Hero', 'complete_profile', '{"complete":true}', 52),
  ('forever_loved', 'Memorial', 'Mascota en memorial', 'care', 'heart', 'Forever Loved', 'memorial', '{"count":1}', 53)
ON CONFLICT (id) DO NOTHING;
