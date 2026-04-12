-- Paw Cards Collectible: columnas en pets + tabla de colecciones
-- NO aplicar automaticamente. El dueno aplica manualmente desde Supabase Dashboard > SQL Editor.

-- 1. Agregar columnas a pets
ALTER TABLE pets ADD COLUMN IF NOT EXISTS holo_pattern varchar DEFAULT 'holo-none';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS paw_card_id varchar UNIQUE;

-- 2. Backfill: asignar paw_card_id a mascotas existentes
UPDATE pets
SET paw_card_id = 'PAW-' || upper(substr(md5(random()::text), 1, 4)) || '-' || upper(substr(md5(random()::text), 1, 4))
WHERE paw_card_id IS NULL;

-- 3. Backfill: asignar holo_pattern aleatorio segun probabilidades
UPDATE pets
SET holo_pattern = CASE
  WHEN random() < 0.01 THEN 'holo-rainbow'
  WHEN random() < 0.04 THEN 'holo-galaxy'
  WHEN random() < 0.08 THEN 'holo-fire'
  WHEN random() < 0.13 THEN 'holo-waves'
  WHEN random() < 0.21 THEN 'holo-diamonds'
  WHEN random() < 0.31 THEN 'holo-hearts'
  WHEN random() < 0.46 THEN 'holo-stars'
  WHEN random() < 0.66 THEN 'holo-paws'
  ELSE 'holo-none'
END
WHERE holo_pattern IS NULL OR holo_pattern = 'holo-none';

-- 4. Tabla de colecciones
CREATE TABLE IF NOT EXISTS paw_card_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  collected_at timestamptz DEFAULT now(),
  UNIQUE(collector_id, pet_id)
);

-- 5. RLS
ALTER TABLE paw_card_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collection"
  ON paw_card_collections FOR SELECT
  USING (auth.uid() = collector_id);

CREATE POLICY "Users can collect cards"
  ON paw_card_collections FOR INSERT
  WITH CHECK (
    auth.uid() = collector_id
    AND pet_id NOT IN (SELECT id FROM pets WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can remove from collection"
  ON paw_card_collections FOR DELETE
  USING (auth.uid() = collector_id);

-- 6. Indices
CREATE INDEX IF NOT EXISTS idx_paw_card_collections_collector ON paw_card_collections(collector_id);
CREATE INDEX IF NOT EXISTS idx_paw_card_collections_pet ON paw_card_collections(pet_id);
CREATE INDEX IF NOT EXISTS idx_pets_paw_card_id ON pets(paw_card_id);

-- 7. Politica SELECT publica para paw_card_id lookup (landing publica)
CREATE POLICY "Public can view paw card basic info"
  ON pets FOR SELECT
  USING (paw_card_id IS NOT NULL);
