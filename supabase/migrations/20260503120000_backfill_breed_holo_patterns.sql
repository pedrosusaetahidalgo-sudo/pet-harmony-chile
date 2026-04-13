-- ============================================================
-- Backfill: asignar holo_pattern tematico por raza a mascotas
-- existentes que tienen 'holo-none' o NULL.
--
-- La logica replica getBreedHoloPattern() de paw-cards.ts:
-- - Razas nordicas → holo-galaxy
-- - Razas acuaticas → holo-waves
-- - Razas toy → holo-hearts
-- - Razas guardianas → holo-fire
-- - Razas elegantes → holo-diamonds
-- - Gatos salvajes → holo-fire
-- - Gatos lujo → holo-diamonds
-- - Gatos exoticos → holo-galaxy
-- - Default perro/otro → holo-paws
-- - Default gato → holo-stars
-- - Aves → holo-rainbow
-- - Reptiles → holo-waves
--
-- NO aplicar automaticamente. Aplicar en Supabase Dashboard > SQL Editor.
-- ============================================================

UPDATE pets SET holo_pattern = CASE
  -- Perros nordicos → galaxy
  WHEN LOWER(breed) SIMILAR TO '%(husky|malamute|samoyedo|pastor suizo|akita)%' THEN 'holo-galaxy'
  -- Perros acuaticos → waves
  WHEN LOWER(breed) SIMILAR TO '%(labrador|golden|cocker|terranova|setter|springer)%' THEN 'holo-waves'
  -- Perros toy → hearts
  WHEN LOWER(breed) SIMILAR TO '%(chihuahua|pomeranian|pomerania|yorkie|yorkshire|maltese|maltes|bichon|shih tzu|papillon)%' THEN 'holo-hearts'
  -- Perros guardianes → fire
  WHEN LOWER(breed) SIMILAR TO '%(pastor aleman|rottweiler|doberman|boxer|pit bull|pitbull|bullmastiff|mastiff|dogo|cane corso|presa canario)%' THEN 'holo-fire'
  -- Perros elegantes → diamonds
  WHEN LOWER(breed) SIMILAR TO '%(caniche|poodle|galgo|dalmata|weimaraner|whippet|greyhound|saluki|afghan)%' THEN 'holo-diamonds'
  -- Perros iconicos → paws
  WHEN LOWER(breed) SIMILAR TO '%(corgi|bulldog|pug|beagle|basset|dachshund|teckel)%' THEN 'holo-paws'
  -- Gatos salvajes → fire
  WHEN LOWER(breed) SIMILAR TO '%(bengal|savannah|abisinio)%' THEN 'holo-fire'
  -- Gatos lujo → diamonds
  WHEN LOWER(breed) SIMILAR TO '%(persa|ragdoll|british|scottish)%' THEN 'holo-diamonds'
  -- Gatos exoticos → galaxy
  WHEN LOWER(breed) SIMILAR TO '%(siames|oriental|sphynx|devon rex|cornish)%' THEN 'holo-galaxy'
  -- Gatos majestuosos → stars
  WHEN LOWER(breed) SIMILAR TO '%(maine coon|angora|noruego|siberiano)%' THEN 'holo-stars'
  -- Species-level defaults
  WHEN LOWER(species) SIMILAR TO '%(gato|cat)%' THEN 'holo-stars'
  WHEN LOWER(species) SIMILAR TO '%(conejo|rabbit)%' THEN 'holo-paws'
  WHEN LOWER(species) SIMILAR TO '%(ave|pajaro|bird)%' THEN 'holo-rainbow'
  WHEN LOWER(species) SIMILAR TO '%(reptil|tortuga|serpiente)%' THEN 'holo-waves'
  -- Default
  ELSE 'holo-paws'
END
WHERE holo_pattern IS NULL OR holo_pattern = 'holo-none';
