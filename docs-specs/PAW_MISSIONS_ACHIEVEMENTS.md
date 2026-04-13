# Paw Missions + Logros Desbloqueables

> Spec para sistema de misiones y logros coleccionables vinculados a Paw Cards.
> Fecha: 2026-04-13
> Estado: en construccion

---

## 1. Vision

Convertir la coleccion de Paw Cards en un **juego con progresion**: el usuario completa misiones para desbloquear logros (achievements) que funcionan como **titulos seleccionables** visibles en su perfil. Inspirado en sistemas de logros de juegos tipo Pokemon/TCG.

---

## 2. Tipos de misiones

### 2.1. Misiones de coleccion (por especie)

| Mision | Condicion | Logro desbloqueado |
|---|---|---|
| Amigo de los perros | Colecciona 3 Paw Cards de perros | "Dog Lover" |
| Amigo de los gatos | Colecciona 3 Paw Cards de gatos | "Cat Whisperer" |
| Mundo acuatico | Colecciona 2 Paw Cards de peces/tortugas acuaticas | "Aqua Friend" |
| Reptil hunter | Colecciona 2 Paw Cards de reptiles (tortuga, iguana, etc.) | "Reptile Explorer" |
| Aves del mundo | Colecciona 2 Paw Cards de aves | "Bird Keeper" |
| Roedor lover | Colecciona 2 Paw Cards de hamsters/conejos/cobayas | "Furry Collector" |
| Amigo exotico | Colecciona 1 Paw Card de especie rara (huron, erizo, etc.) | "Exotic Finder" |
| Arca de Noe | Colecciona al menos 1 Paw Card de 5 especies distintas | "Noah's Ark" |

### 2.2. Misiones de cantidad

| Mision | Condicion | Logro desbloqueado |
|---|---|---|
| Primer scan | Escanea tu primera Paw Card | "First Scan" |
| Coleccionista novato | Colecciona 5 Paw Cards | "Rookie Collector" |
| Coleccionista | Colecciona 15 Paw Cards | "Paw Collector" |
| Super coleccionista | Colecciona 30 Paw Cards | "Super Collector" |
| Maestro coleccionista | Colecciona 50 Paw Cards | "Master Collector" |
| Leyenda | Colecciona 100 Paw Cards | "Living Legend" |

### 2.3. Misiones de rareza

| Mision | Condicion | Logro desbloqueado |
|---|---|---|
| Brillo comun | Colecciona 5 cartas Common | "Common Ground" |
| Destello raro | Colecciona 3 cartas Rare | "Rare Find" |
| Epica victoria | Colecciona 1 carta Epic | "Epic Hunter" |
| Legendario | Colecciona 1 carta Legendary | "Legend Seeker" |
| Mitico | Colecciona 1 carta Mythic | "Myth Buster" |
| Full rarity | Colecciona al menos 1 de cada rareza | "Rarity Master" |

### 2.4. Misiones sociales

| Mision | Condicion | Logro desbloqueado |
|---|---|---|
| Compartidor | Tu Paw Card fue coleccionada por 5 personas | "Popular Pet" |
| Viral | Tu Paw Card fue coleccionada por 20 personas | "Viral Paw" |
| Conector social | Colecciona Paw Cards de 10 duenos distintos | "Social Butterfly" |

### 2.5. Misiones de cuidado (vinculadas a la app)

| Mision | Condicion | Logro desbloqueado |
|---|---|---|
| Cuidador responsable | Completa 7 recordatorios seguidos | "Dedicated Owner" |
| Primera visita | Reserva tu primera cita con un vet | "Vet Visitor" |
| Ficha completa | Completa todos los campos de la ficha clinica | "Health Hero" |
| Memorial | Registra una mascota en memorial | "Forever Loved" |

---

## 3. Modelo de datos

### 3.1. Tabla: `paw_missions`

```sql
CREATE TABLE IF NOT EXISTS paw_missions (
  id TEXT PRIMARY KEY,                -- ej: 'dog_lover', 'first_scan'
  title TEXT NOT NULL,                -- Nombre de la mision
  description TEXT NOT NULL,          -- Descripcion corta
  category TEXT NOT NULL CHECK (category IN (
    'collection_species', 'collection_quantity', 'collection_rarity',
    'social', 'care'
  )),
  icon TEXT NOT NULL,                 -- Emoji o nombre de icono lucide
  achievement_title TEXT NOT NULL,    -- Titulo desbloqueado (ej: "Dog Lover")
  achievement_badge_url TEXT,         -- URL de badge SVG (opcional, futuro)
  requirement_type TEXT NOT NULL CHECK (requirement_type IN (
    'collect_species', 'collect_count', 'collect_rarity',
    'be_collected', 'collect_owners', 'complete_reminders',
    'book_vet', 'complete_profile', 'memorial', 'collect_all_rarities',
    'collect_species_count'
  )),
  requirement_value JSONB NOT NULL,   -- ej: {"species":"perro","count":3} o {"count":5}
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.2. Tabla: `user_achievements`

```sql
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL REFERENCES paw_missions(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active_title BOOLEAN DEFAULT false,  -- Si este logro es el titulo activo del usuario
  UNIQUE(user_id, mission_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their achievements"
  ON user_achievements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 3.3. Agregar `active_title` a profiles

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_title TEXT;
-- Titulo de logro activo que se muestra en el perfil
```

---

## 4. Seed de misiones

```sql
INSERT INTO paw_missions (id, title, description, category, icon, achievement_title, requirement_type, requirement_value, sort_order)
VALUES
  -- Coleccion por especie
  ('dog_lover', 'Amigo de los perros', 'Colecciona 3 Paw Cards de perros', 'collection_species', 'dog', 'Dog Lover', 'collect_species', '{"species":"perro","count":3}', 10),
  ('cat_whisperer', 'Amigo de los gatos', 'Colecciona 3 Paw Cards de gatos', 'collection_species', 'cat', 'Cat Whisperer', 'collect_species', '{"species":"gato","count":3}', 11),
  ('aqua_friend', 'Mundo acuatico', 'Colecciona 2 Paw Cards de peces o tortugas', 'collection_species', 'fish', 'Aqua Friend', 'collect_species', '{"species":"pez,tortuga","count":2}', 12),
  ('reptile_explorer', 'Reptil hunter', 'Colecciona 2 Paw Cards de reptiles', 'collection_species', 'leaf', 'Reptile Explorer', 'collect_species', '{"species":"reptil,iguana,lagartija","count":2}', 13),
  ('bird_keeper', 'Aves del mundo', 'Colecciona 2 Paw Cards de aves', 'collection_species', 'bird', 'Bird Keeper', 'collect_species', '{"species":"ave,pajaro,loro,canario","count":2}', 14),
  ('furry_collector', 'Roedor lover', 'Colecciona 2 Paw Cards de roedores', 'collection_species', 'rabbit', 'Furry Collector', 'collect_species', '{"species":"hamster,conejo,cobaya,cuyo","count":2}', 15),
  ('exotic_finder', 'Amigo exotico', 'Colecciona 1 Paw Card de especie rara', 'collection_species', 'sparkles', 'Exotic Finder', 'collect_species', '{"species":"huron,erizo,chinchilla,axolotl","count":1}', 16),
  ('noahs_ark', 'Arca de Noe', 'Colecciona Paw Cards de 5 especies distintas', 'collection_species', 'ship', 'Noahs Ark', 'collect_species_count', '{"distinct_species":5}', 17),

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
  ('rarity_master', 'Full rarity', 'Colecciona al menos 1 de cada rareza', 'collection_rarity', 'layers', 'Rarity Master', 'collect_all_rarities', '{"rarities":["common","uncommon","rare","epic","legendary","mythic"]}', 35),

  -- Social
  ('popular_pet', 'Compartidor', 'Tu Paw Card fue coleccionada por 5 personas', 'social', 'users', 'Popular Pet', 'be_collected', '{"count":5}', 40),
  ('viral_paw', 'Viral', 'Tu Paw Card fue coleccionada por 20 personas', 'social', 'trending-up', 'Viral Paw', 'be_collected', '{"count":20}', 41),
  ('social_butterfly', 'Conector social', 'Colecciona Paw Cards de 10 duenos distintos', 'social', 'heart-handshake', 'Social Butterfly', 'collect_owners', '{"count":10}', 42),

  -- Cuidado
  ('dedicated_owner', 'Cuidador responsable', 'Completa 7 recordatorios seguidos', 'care', 'check-circle', 'Dedicated Owner', 'complete_reminders', '{"streak":7}', 50),
  ('vet_visitor', 'Primera visita', 'Reserva tu primera cita con un vet', 'care', 'stethoscope', 'Vet Visitor', 'book_vet', '{"count":1}', 51),
  ('health_hero', 'Ficha completa', 'Completa todos los campos de la ficha', 'care', 'clipboard-check', 'Health Hero', 'complete_profile', '{"complete":true}', 52),
  ('forever_loved', 'Memorial', 'Registra una mascota en memorial', 'care', 'heart', 'Forever Loved', 'memorial', '{"count":1}', 53)
ON CONFLICT (id) DO NOTHING;
```

---

## 5. Frontend: componentes nuevos

### 5.1. Archivos a crear

```
src/
  hooks/
    useMissions.ts              -- Fetch misiones + progreso del usuario
    useAchievements.ts          -- Logros desbloqueados + titulo activo

  components/
    achievements/
      MissionCard.tsx           -- Card de mision con barra de progreso
      AchievementBadge.tsx      -- Badge de logro (desbloqueado vs bloqueado)
      AchievementSelector.tsx   -- Grid para elegir titulo activo (estilo juego)
      MissionsGrid.tsx          -- Grid de todas las misiones por categoria

  pages/
    Missions.tsx                -- Pagina /misiones con tabs por categoria
```

### 5.2. Ruta nueva

```tsx
'/misiones'  // Pagina de misiones y logros
```

### 5.3. Titulo activo en perfil

El usuario puede seleccionar un logro desbloqueado como "titulo activo". Se muestra como badge debajo de su nombre en:
- Perfil publico (`/user/:userId`)
- Perfil propio (`/profile`)
- Header
- Paw Cards propias (debajo del nombre de la mascota)
- Ranking de Paw Cards

---

## 6. UX de la pagina de misiones

```
+--------------------------------------------------+
| Misiones                                [X logros]|
+--------------------------------------------------+
| Titulo activo: [Dog Lover v]  (selector dropdown) |
+--------------------------------------------------+
| Tabs: [Coleccion] [Rareza] [Social] [Cuidado]    |
+--------------------------------------------------+
|                                                    |
| [Amigo de los perros]                              |
| Colecciona 3 Paw Cards de perros                  |
| [=======----] 2/3                                  |
| Logro: "Dog Lover"                                |
|                                                    |
| [Primer scan]          DESBLOQUEADO               |
| Escanea tu primera Paw Card                       |
| [==========] 1/1  Logro: "First Scan"            |
|                                                    |
| [Arca de Noe]                                     |
| Colecciona de 5 especies distintas                 |
| [===-------] 2/5                                  |
| Logro: "Noah's Ark"    BLOQUEADO                  |
|                                                    |
+--------------------------------------------------+
```

---

## 7. Embellecimiento de otras paginas

Aplicar el estilo visual de Paw Cards (holograficos, gradientes, animaciones suaves) a:

| Pagina | Mejora visual |
|---|---|
| Home `/home` | Cards de mascotas con mini paw-card style + borde de rareza |
| Feed `/feed` | Posts con avatar que tenga ring de rareza del usuario |
| Perfil `/profile` | Titulo activo + badges de logros desbloqueados |
| Sidebar | Icono de coleccion con sparkle si hay mision por completar |
| PawCollection | Seccion de misiones rapida (progreso de las 3 mas cercanas) |

---

## 8. Orden de ejecucion

### Fase 1: Migracion (DB)
1. [ ] Crear migracion SQL con tablas + seed
2. [ ] Agregar `active_title` a profiles

### Fase 2: Hooks
3. [ ] `useMissions.ts` — fetch misiones + calcular progreso
4. [ ] `useAchievements.ts` — logros del usuario + set titulo activo

### Fase 3: Componentes + pagina
5. [ ] `MissionCard.tsx`
6. [ ] `AchievementBadge.tsx`
7. [ ] `AchievementSelector.tsx`
8. [ ] `MissionsGrid.tsx`
9. [ ] `Missions.tsx` (pagina)
10. [ ] Ruta en `App.tsx`

### Fase 4: Integracion
11. [ ] Mostrar titulo activo en perfil y header
12. [ ] Sidebar: link a misiones con indicador
13. [ ] PawCollection: resumen de progreso

### Fase 5: Embellecimiento
14. [ ] Home: mini paw-card style en pets
15. [ ] Feed: ring de rareza en avatares
16. [ ] Animacion de desbloqueo de logro (confetti/sparkle)

---

## 9. Restricciones por plan

| Feature | Gratis | Premium |
|---|---|---|
| Ver misiones | Si | Si |
| Desbloquear logros | Si | Si |
| Titulo activo | 1 a la vez | 1 a la vez |
| Misiones de cuidado | Solo basicas | Todas |

Las misiones no tienen gate de plan — son incentivo para engagement.
