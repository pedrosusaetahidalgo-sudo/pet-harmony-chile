# Feed & Comunidad — Redesign Blueprint (estilo Instagram para mascotas)

> **Estado**: PARCIALMENTE IMPLEMENTADO (2026-04-29)
> **Prioridad**: Media — la estructura base ya existe, quedan polish y features avanzadas
> **Fecha**: 2026-04-11 | **Ultima revision**: 2026-04-29
>
> ### Que ya se implemento (no repetir)
> - 14 componentes en `src/components/feed/`: FeedPost, FeedPostHeader, FeedPostMedia, FeedPostActions, FeedPostCaption, FeedComments, FeedCommentInput, FeedStories, FeedStoryViewer, FeedCreatePost, FeedImageUploader, FeedExplore, FeedSkeleton, FeedEmptyState
> - 6 hooks: `useFeedPosts`, `useFeedActions`, `usePetStories`, `useFeedRealtime`, `useInfiniteScroll`, `useDoubleTapLike`
> - `Feed.tsx` reescrito con tabs (all, following, popular, explore), infinite scroll, realtime banners, search y filtros por tipo de post
> - Migracion SQL `20260429000000_feed_triggers_and_tables.sql` (triggers + tablas nuevas)
> - Estilos feed en `index.css`
>
> ### Que queda pendiente de este blueprint
> - Stories: componentes existen pero falta flujo de creacion/visualizacion completo
> - Moderation: `post_reports` y flujo de moderacion no implementado
> - Explore grid: componente existe pero falta lazy-load con IntersectionObserver y blur hash
> - Pull-to-refresh nativo (Capacitor)
> - Hashtags y location en posts (campos en schema, UI no conectada)

---

## 1. Diagnostico del feed actual

### Bugs criticos encontrados

| Bug | Archivo | Impacto |
|-----|---------|---------|
| **Posts no aparecen despues de publicar** | `Feed.tsx:288-354` | Los posts se renderizan FUERA de cualquier `TabsContent` — quedan visibles siempre pero el layout queda roto porque estan entre el `TabsList` y los `TabsContent`. El contenido principal del feed NO esta dentro de ningun tab activo |
| **Tab "Mascotas" muestra perfiles, no posts** | `Feed.tsx:356-393` | El tab "Mascotas" carga `PetProfileCard` (perfiles de mascotas) en vez de posts con fotos. No es un feed, es un directorio |
| **Contadores de likes/comments no persisten** | `PetCard.tsx` | Solo actualiza state local; nunca escribe `posts.likes_count` ni `posts.comments_count` en la DB. Al refrescar se pierde |
| **useFollows hace 4 queries por card** | `useFollows.tsx:27-51` | Cada PetCard en el feed dispara 4 queries a Supabase. Con 20 posts = 80 queries |
| **Tab "Popular" existe pero no tiene trigger** | `Feed.tsx:432-455` | Hay un `TabsContent value="popular"` pero no hay `TabsTrigger` correspondiente |
| **Siguiendo no aplica filtros** | `Feed.tsx:399-430` | El tab "Siguiendo" ignora searchQuery y filterType |
| **No hay realtime** | `Feed.tsx` | Los posts se cargan una vez y no se actualizan sin refresh manual |

### Problemas de UX

- No hay preview de imagen al crear post (solo se sube)
- No hay indicador visual del tipo de post en el card
- El boton "Publicar" ocupa media pantalla en mobile con un grid 2-col innecesario
- No hay pull-to-refresh
- No hay stories/highlights de mascotas
- La busqueda es basica (solo texto, no tags)
- No hay trending/explore
- No hay notificaciones de interacciones

---

## 2. Vision: Feed estilo Instagram para mascotas

### Principios de diseno

1. **Content-first**: La foto/video de la mascota es protagonista, todo lo demas es secundario
2. **Scroll infinito fluido**: Sin botones "ver mas", carga automatica al hacer scroll
3. **Interacciones rapidas**: Like con doble-tap, comentar sin salir del feed, compartir con 1 tap
4. **Descubrimiento**: Stories, trending, hashtags, explore grid
5. **Identidad mascota-centrica**: El "perfil" que importa es el de la mascota, no el del dueno

---

## 3. Arquitectura de datos

### 3.1 Tabla `posts` (ya existe — agregar campos)

```sql
-- Campos nuevos a agregar via migracion
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}';
-- Multiples imagenes/videos por post (hasta 10)

ALTER TABLE posts ADD COLUMN IF NOT EXISTS aspect_ratio text DEFAULT '1:1';
-- Para renderizar placeholders antes de cargar la imagen

ALTER TABLE posts ADD COLUMN IF NOT EXISTS hashtags text[] DEFAULT '{}';
-- Hashtags extraidos del contenido (para busqueda rapida)

ALTER TABLE posts ADD COLUMN IF NOT EXISTS location text;
-- Comuna/ciudad del post (ej: "Providencia, Santiago")

ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
-- Posts fijados por el usuario en su perfil

ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private'));
-- Control de visibilidad

-- Indice para feed por tiempo
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts (created_at DESC);

-- Indice para feed de seguidos
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts (user_id, created_at DESC);

-- Indice para busqueda por hashtags (GIN)
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN (hashtags);
```

### 3.2 Tabla `post_likes` (ya existe — agregar trigger)

```sql
-- Trigger para mantener likes_count sincronizado
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON post_likes;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();
```

### 3.3 Tabla `post_comments` (ya existe — agregar trigger)

```sql
-- Trigger para mantener comments_count sincronizado
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON post_comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();
```

### 3.4 Nueva tabla `post_saves` (bookmarks)

```sql
CREATE TABLE IF NOT EXISTS post_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saves" ON post_saves
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Post owners can see save count" ON post_saves
  FOR SELECT USING (
    post_id IN (SELECT id FROM posts WHERE user_id = auth.uid())
  );
```

### 3.5 Nueva tabla `pet_stories` (stories de 24h)

```sql
CREATE TABLE IF NOT EXISTS pet_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  media_url text NOT NULL,
  media_type text DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pet_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stories are public while active" ON pet_stories
  FOR SELECT USING (expires_at > now());
CREATE POLICY "Users manage own stories" ON pet_stories
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_pet_stories_active ON pet_stories (expires_at DESC) WHERE expires_at > now();
```

### 3.6 Nueva tabla `post_reports` (moderacion)

```sql
CREATE TABLE IF NOT EXISTS post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'misinformation', 'other')),
  details text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, reporter_id)
);

ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can report" ON post_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can manage" ON post_reports
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
```

### 3.7 RPC: Feed optimizado

```sql
-- Feed principal con toda la info necesaria en 1 query
CREATE OR REPLACE FUNCTION get_feed_posts(
  p_user_id uuid DEFAULT NULL,
  p_cursor timestamptz DEFAULT now(),
  p_limit integer DEFAULT 20,
  p_filter_type text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_feed_type text DEFAULT 'all' -- 'all', 'following', 'popular'
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  pet_id uuid,
  content text,
  image_url text,
  media_urls text[],
  post_type text,
  hashtags text[],
  location text,
  likes_count integer,
  comments_count integer,
  created_at timestamptz,
  owner_name text,
  owner_avatar text,
  pet_name text,
  pet_photo text,
  is_liked boolean,
  is_saved boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.pet_id,
    p.content,
    p.image_url,
    p.media_urls,
    p.post_type,
    p.hashtags,
    p.location,
    p.likes_count,
    p.comments_count,
    p.created_at,
    pr.display_name AS owner_name,
    pr.avatar_url AS owner_avatar,
    pet.name AS pet_name,
    pet.photo_url AS pet_photo,
    EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = p_user_id) AS is_liked,
    EXISTS(SELECT 1 FROM post_saves ps WHERE ps.post_id = p.id AND ps.user_id = p_user_id) AS is_saved
  FROM posts p
  LEFT JOIN profiles pr ON pr.id = p.user_id
  LEFT JOIN pets pet ON pet.id = p.pet_id
  WHERE p.created_at < p_cursor
    AND (p.visibility = 'public' OR p.user_id = p_user_id)
    AND (p_filter_type IS NULL OR p.post_type = p_filter_type)
    AND (p_search IS NULL OR p.content ILIKE '%' || p_search || '%' OR pet.name ILIKE '%' || p_search || '%')
    AND (p_feed_type != 'following' OR p.user_id IN (
      SELECT following_id FROM user_follows WHERE follower_id = p_user_id
    ))
    -- Excluir usuarios bloqueados
    AND p.user_id NOT IN (
      SELECT blocked_id FROM user_blocks WHERE blocker_id = p_user_id
      UNION
      SELECT blocker_id FROM user_blocks WHERE blocked_id = p_user_id
    )
  ORDER BY
    CASE WHEN p_feed_type = 'popular' THEN p.likes_count ELSE 0 END DESC,
    p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 4. Estructura de componentes (nueva)

```
src/
  pages/
    Feed.tsx                    # Pagina principal — REESCRIBIR COMPLETO
  components/
    feed/                       # NUEVA carpeta
      FeedLayout.tsx            # Layout principal (stories + feed + sidebar)
      FeedPost.tsx              # Card de post individual (reemplaza PetCard para feed)
      FeedPostActions.tsx       # Like, comment, share, save (barra de acciones)
      FeedPostHeader.tsx        # Avatar + nombre + tiempo + menu (...)
      FeedPostMedia.tsx         # Carrusel de imagenes/video con aspect ratio
      FeedPostCaption.tsx       # Texto + hashtags clickeables + "ver mas"
      FeedComments.tsx          # Comentarios inline (2 preview + "ver todos")
      FeedCommentInput.tsx      # Input de comentario sticky
      FeedStories.tsx           # Barra horizontal de stories (circulos)
      FeedStoryViewer.tsx       # Fullscreen story viewer con progress bar
      FeedCreatePost.tsx        # Modal/sheet de creacion mejorado
      FeedImageUploader.tsx     # Upload multi-imagen con preview, crop, reorder
      FeedPostTypeSelector.tsx  # Selector visual de tipo de post
      FeedExplore.tsx           # Grid estilo Explore de Instagram
      FeedHashtagPage.tsx       # Posts filtrados por hashtag
      FeedSearchResults.tsx     # Resultados de busqueda (posts + mascotas + usuarios)
      FeedEmptyState.tsx        # Empty states contextuales por tab
      FeedSkeleton.tsx          # Skeleton loaders para cada seccion
    social/
      ActivityFeed.tsx          # MANTENER — integrar como tab
  hooks/
    useFeedPosts.ts             # NUEVO — react-query hook para get_feed_posts RPC
    useFeedActions.ts           # NUEVO — like, save, report mutations
    usePetStories.ts            # NUEVO — stories CRUD + auto-expire
    useFeedRealtime.ts          # NUEVO — suscripcion realtime a nuevos posts
    useInfiniteScroll.ts        # NUEVO — intersection observer para scroll infinito
    useDoubleTapLike.ts         # NUEVO — deteccion de doble-tap para like
```

---

## 5. Diseno visual detallado

### 5.1 Layout principal (mobile-first)

```
+------------------------------------------+
|  [Stories: O O O O O O O ...]  (scroll-x) |
+------------------------------------------+
|  [Para ti]  [Siguiendo]  [Popular]  [+]   |  <-- Tabs sticky
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  | [avatar] NombreMascota  · 2h  ...  |  |  <-- Header
|  +------------------------------------+  |
|  |                                    |  |
|  |        [IMAGEN/CARRUSEL]           |  |  <-- Media (aspect ratio real)
|  |         16:9 / 4:5 / 1:1          |  |
|  |                                    |  |
|  +------------------------------------+  |
|  | [heart] [comment] [share]  [save]  |  |  <-- Actions
|  +------------------------------------+  |
|  | 42 me gusta                        |  |
|  | NombreMascota Lorem ipsum dolor... |  |  <-- Caption
|  | #perro #goldenretriever            |  |
|  | Ver los 8 comentarios              |  |
|  | [avatar] usuario: que lindo! 💕   |  |  <-- Preview 1 comment
|  | [Agrega un comentario...]          |  |  <-- Quick comment input
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |        [SIGUIENTE POST]            |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```

### 5.2 Stories bar

```
+---+  +---+  +---+  +---+  +---+  +---+
| + |  |🐕 |  |🐈 |  |🐕 |  |🐈 |  |🐕 |   <-- Scroll horizontal
| Tu |  |Max |  |Mia |  |Kai |  |Tom |  |Rex |
+---+  +---+  +---+  +---+  +---+  +---+
  ^       ^
  |       Borde gradiente morado si tiene story activa
  Boton para crear story propia
```

- Circulo de 64px con borde gradiente warm (morado → rosa) si hay story sin ver
- Circulo gris si ya se vio
- "+" para crear story propia con preview de camara
- Auto-desaparece a las 24h (filtrado por `expires_at`)

### 5.3 Post card detallado

#### Header
```
[Avatar 36px]  NombreMascota (bold)  ·  hace 2h
               @duenoName (gris, link)          [...] menu
```
- Menu "..." con: Reportar, Copiar enlace, Silenciar, Bloquear
- Si es propio: Editar, Eliminar, Fijar en perfil

#### Media
- Imagenes: aspect ratio real (no forzar cuadrado)
- Carrusel: dots indicator abajo, swipe horizontal
- Lazy loading con placeholder blur (color dominante)
- Doble-tap = like con animacion de corazon grande

#### Actions bar
```
[❤️ Heart]  [💬 Comment]  [↗️ Share]          [🔖 Bookmark]
```
- Heart: rojo cuando liked, animacion spring
- Comment: abre inline o fullscreen segun contexto
- Share: copia link + opcion WhatsApp (deep link)
- Bookmark: save para ver despues

#### Caption
- Nombre mascota en bold al inicio
- Hashtags en color primary, clickeables (navegan a `/feed/tag/:tag`)
- "...ver mas" si supera 3 lineas
- Tipo de post como badge sutil arriba del caption: `📸 Foto`, `❓ Pregunta`, etc.

#### Comments preview
- Mostrar 1-2 comentarios mas recientes inline
- "Ver los N comentarios" abre panel/modal completo
- Input de comentario rapido siempre visible abajo del post

### 5.4 Modal de creacion (rediseñado)

```
+------------------------------------------+
|  [X]    Nueva publicacion     [Publicar]  |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  |  [📸] [📸] [📸] [+]               |  |  <-- Preview grid (drag to reorder)
|  |  Arrastra para reordenar           |  |
|  +------------------------------------+  |
|                                          |
|  +----- Tipo de publicacion ----------+  |
|  | [📸 Foto] [❓Pregunta] [💡Consejo] |  |
|  | [🔍Perdido] [🏠Adopcion] [🏆Logro]|  |
|  +------------------------------------+  |
|                                          |
|  [Escribe algo sobre tu mascota...]      |
|  (textarea auto-grow)                    |
|                                          |
|  🐾 Mascota: [Kai ▼]                    |  <-- Selector de mascota
|  📍 Ubicacion: [Agregar ubicacion]       |  <-- Opcional
|  👁 Visibilidad: [Publica ▼]            |  <-- Selector
|                                          |
+------------------------------------------+
```

**Mejoras sobre el actual:**
- Preview de imagenes ANTES de publicar (thumbnails)
- Soporte multi-imagen (hasta 10) con drag-to-reorder
- Auto-deteccion de hashtags del texto
- Tipo de post como chips visuales (no dropdown)
- Validacion inline (imagen requerida para tipo "foto")
- Loading state con progress bar durante upload

### 5.5 Explore grid (tab "Explorar")

```
+------+------+------+
|      |      |      |
| img  | img  | img  |  3 columnas, masonry-like
|      |      |      |
+------+------+------+
|      |             |
| img  |   img big   |  Cada ciertos posts, uno grande (2 cols)
|      |             |
+------+------+------+
|      |      |      |
| img  | img  | img  |
|      |      |      |
+------+------+------+
```

- Grid de thumbnails clickeables
- Al hacer tap, abre el post en fullscreen
- Mezcla contenido popular + reciente + sugerido
- Categorias arriba: Todos, Perros, Gatos, Perdidos, Adopcion

---

## 6. Tabs del feed (nueva estructura)

| Tab | Icono | Contenido | Algoritmo |
|-----|-------|-----------|-----------|
| **Para ti** | `Sparkles` | Posts de todos | Cronologico reciente (futuro: con ranking) |
| **Siguiendo** | `Users` | Posts de gente que sigues | Cronologico |
| **Popular** | `TrendingUp` | Posts con mas likes/comentarios | Por engagement (likes + comments) |
| **Explorar** | `Compass` | Grid masonry de fotos | Mixto popular + reciente |

**Eliminar tabs actuales:**
- "Mascotas" (directorio de perfiles) → mover a `/my-pets` o pagina aparte
- "Ranking" (TopRatedProviders) → mover a `/servicios` o dejarlo en sidebar desktop

---

## 7. Hooks nuevos (detalle)

### 7.1 `useFeedPosts.ts`

```typescript
// Hook principal del feed usando react-query + RPC
interface UseFeedPostsOptions {
  feedType: 'all' | 'following' | 'popular';
  filterType?: string | null;
  search?: string;
}

// Usa useInfiniteQuery de @tanstack/react-query
// - Cursor-based pagination (created_at del ultimo post)
// - 20 posts por pagina
// - Llama a get_feed_posts RPC
// - Stale time: 30s para "Para ti", 60s para "Popular"
// - Refetch on window focus
```

### 7.2 `useFeedActions.ts`

```typescript
// Mutations para interacciones
// - toggleLike(postId) — optimistic update + insert/delete post_likes
// - toggleSave(postId) — optimistic update + insert/delete post_saves  
// - reportPost(postId, reason) — insert post_reports
// - deletePost(postId) — delete + invalidate feed queries
// - Todas usan useMutation con onMutate para optimistic updates
```

### 7.3 `useFeedRealtime.ts`

```typescript
// Suscripcion realtime a nuevos posts
// - Canal: postgres_changes en tabla posts
// - Cuando llega INSERT: mostrar banner "N publicaciones nuevas" arriba del feed
// - El usuario hace click para cargar (no auto-insert, evita saltos de scroll)
// - Solo escucha posts con visibility = 'public'
```

### 7.4 `useInfiniteScroll.ts`

```typescript
// Intersection Observer generico
// - Ref a un div sentinel al final del feed
// - Cuando entra en viewport, llama fetchNextPage()
// - Debounce de 300ms para evitar multiples triggers
// - Desactivado cuando isFetchingNextPage o !hasNextPage
```

### 7.5 `useDoubleTapLike.ts`

```typescript
// Deteccion de doble-tap para like (estilo Instagram)
// - Detecta 2 taps en <300ms en el area de la imagen
// - Dispara animacion de corazon grande + toggleLike
// - Haptic feedback en mobile (Capacitor Haptics)
// - Previene zoom en mobile (touch-action: manipulation)
```

### 7.6 `usePetStories.ts`

```typescript
// CRUD de stories
// - createStory(petId, file, caption?) — upload + insert
// - useActiveStories() — stories no expiradas, agrupadas por mascota
// - useMyStories() — stories del usuario actual
// - markAsViewed(storyId) — tracking de vistas (opcional, puede ser local)
// - Auto-expire: la query ya filtra por expires_at > now()
```

---

## 8. Interacciones y animaciones

### 8.1 Doble-tap like
1. Usuario hace doble-tap en la imagen
2. Corazon grande (96px) aparece en el centro con `scale(0) → scale(1.2) → scale(1)` (spring, 600ms)
3. Corazon se desvanece con `opacity 1 → 0` (200ms delay + 300ms fade)
4. Icono de corazon en la action bar se llena de rojo con bounce
5. Contador incrementa con animacion de flip numerico
6. Si ya estaba liked, no hace nada (no unlike con doble-tap)

### 8.2 Pull to refresh (mobile)
1. Scroll arriba del todo → drag down muestra indicador circular
2. Al soltar con suficiente distancia → refetch de la primera pagina
3. Animacion de giro del indicador durante la carga

### 8.3 Scroll infinito
1. Sentinel div al final de los posts
2. Cuando IntersectionObserver lo detecta, carga siguiente pagina
3. Skeleton loader de 2 posts aparece durante la carga
4. Al llegar al final real: "Has visto todas las publicaciones recientes"

### 8.4 Post creation
1. Imagen seleccionada → thumbnail preview inmediato (URL.createObjectURL)
2. Upload → progress bar real (XHR con onUploadProgress o tus.io)
3. Post creado → toast de confirmacion + scroll al post nuevo
4. Animacion de entrada del post nuevo (slide-down + fade-in)

### 8.5 Story viewer
1. Tap en circulo → fullscreen overlay con imagen/video
2. Progress bar lineal arriba (5s por imagen, duracion real para video)
3. Tap izquierda = anterior, tap derecha = siguiente
4. Swipe horizontal = cambiar de mascota
5. Swipe down = cerrar

---

## 9. Performance

### 9.1 Estrategia de carga
- **Feed principal**: 20 posts iniciales, scroll infinito
- **Imagenes**: lazy loading con `loading="lazy"` + IntersectionObserver
- **Placeholders**: blur hash o color dominante mientras carga la imagen
- **Virtualizacion**: NO usar virtualizacion compleja (react-window) por ahora — el feed no tendra mas de ~100 posts en viewport. Revisar si se necesita mas adelante

### 9.2 Optimizaciones de queries
- **RPC unica** `get_feed_posts`: reemplaza las 4+ queries actuales por 1 sola
- **Indices**: ya definidos en seccion 3
- **Optimistic updates**: likes, saves, comments actualizan UI inmediatamente
- **Stale-while-revalidate**: react-query maneja cache automaticamente
- **Blocked users**: filtrado en el servidor (RPC), no en el cliente

### 9.3 Bundle
- **Lazy load** del modal de creacion de post (no cargarlo hasta que se abra)
- **Lazy load** del story viewer
- **Lazy load** del tab Explorar (grid pesado)

---

## 10. Plan de implementacion por fases

### Fase 1: Foundation (triggers + RPC + hooks) — ~4h
1. Crear migracion SQL con triggers de likes/comments count
2. Crear migracion SQL con tabla `post_saves`
3. Crear RPC `get_feed_posts`
4. Crear hook `useFeedPosts.ts` con `useInfiniteQuery`
5. Crear hook `useFeedActions.ts` (like, save, report)
6. Crear hook `useInfiniteScroll.ts`
7. **Test**: verificar que los posts se cargan correctamente via RPC

### Fase 2: Feed core (post card + layout) — ~6h
1. Crear `FeedPostHeader.tsx` (avatar, nombre mascota, tiempo, menu)
2. Crear `FeedPostMedia.tsx` (imagen unica con aspect ratio, placeholder)
3. Crear `FeedPostActions.tsx` (like, comment, share, save)
4. Crear `FeedPostCaption.tsx` (texto + hashtags + "ver mas")
5. Crear `FeedPost.tsx` (composicion de los anteriores)
6. Crear `FeedComments.tsx` (preview de 1-2 comments inline)
7. Crear `FeedCommentInput.tsx` (input rapido)
8. Crear `FeedSkeleton.tsx`
9. Reescribir `Feed.tsx` con nuevo layout y tabs
10. **Test**: publicar un post y verlo aparecer correctamente

### Fase 3: Interacciones (doble-tap, realtime, crear post mejorado) — ~4h
1. Crear hook `useDoubleTapLike.ts`
2. Integrar doble-tap en `FeedPostMedia`
3. Crear hook `useFeedRealtime.ts` (banner "N nuevos posts")
4. Crear `FeedCreatePost.tsx` mejorado (multi-imagen preview, tipo visual)
5. Crear `FeedImageUploader.tsx` (preview, validacion, progress)
6. **Test**: doble-tap like funciona, realtime muestra banner

### Fase 4: Stories — ~4h
1. Crear migracion SQL tabla `pet_stories`
2. Crear hook `usePetStories.ts`
3. Crear `FeedStories.tsx` (barra de circulos)
4. Crear `FeedStoryViewer.tsx` (fullscreen con progress)
5. Integrar stories en layout del feed
6. **Test**: crear story, verla en el feed, que expire a las 24h

### Fase 5: Explore + polish — ~3h
1. Crear `FeedExplore.tsx` (grid masonry)
2. Crear `FeedHashtagPage.tsx`
3. Agregar tab "Explorar" al feed
4. Mover "Mascotas" (PetProfileCard grid) fuera del feed
5. Mover "Ranking" (TopRatedProviders) fuera del feed
6. Pull-to-refresh en mobile
7. Empty states por tab
8. **Test**: navegacion completa, explore grid, hashtags

### Fase 6: Moderacion + seguridad — ~2h
1. Crear migracion SQL tabla `post_reports`
2. Menu de reporte en posts
3. Agregar seccion de reportes pendientes en panel admin
4. Validar visibilidad en RPC
5. Rate limiting en creacion de posts (max 10/hora)

---

## 11. Archivos a modificar/crear

### Crear nuevos
| Archivo | Descripcion |
|---------|-------------|
| `src/components/feed/FeedLayout.tsx` | Layout principal |
| `src/components/feed/FeedPost.tsx` | Post card completo |
| `src/components/feed/FeedPostHeader.tsx` | Header del post |
| `src/components/feed/FeedPostMedia.tsx` | Imagen/carrusel |
| `src/components/feed/FeedPostActions.tsx` | Barra de acciones |
| `src/components/feed/FeedPostCaption.tsx` | Caption + hashtags |
| `src/components/feed/FeedComments.tsx` | Preview de comments |
| `src/components/feed/FeedCommentInput.tsx` | Input de comentario |
| `src/components/feed/FeedStories.tsx` | Stories bar |
| `src/components/feed/FeedStoryViewer.tsx` | Visor fullscreen |
| `src/components/feed/FeedCreatePost.tsx` | Creacion mejorada |
| `src/components/feed/FeedImageUploader.tsx` | Upload multi-imagen |
| `src/components/feed/FeedPostTypeSelector.tsx` | Tipo de post visual |
| `src/components/feed/FeedExplore.tsx` | Grid explore |
| `src/components/feed/FeedHashtagPage.tsx` | Posts por hashtag |
| `src/components/feed/FeedSearchResults.tsx` | Busqueda |
| `src/components/feed/FeedEmptyState.tsx` | Empty states |
| `src/components/feed/FeedSkeleton.tsx` | Skeletons |
| `src/hooks/useFeedPosts.ts` | Query del feed |
| `src/hooks/useFeedActions.ts` | Mutations (like, save) |
| `src/hooks/usePetStories.ts` | Stories CRUD |
| `src/hooks/useFeedRealtime.ts` | Suscripcion realtime |
| `src/hooks/useInfiniteScroll.ts` | Scroll infinito |
| `src/hooks/useDoubleTapLike.ts` | Doble-tap like |
| `supabase/migrations/YYYYMMDD_feed_triggers_and_tables.sql` | Migracion SQL |

### Reescribir
| Archivo | Cambio |
|---------|--------|
| `src/pages/Feed.tsx` | Reescritura completa con nuevos componentes |
| `src/components/CreatePost.tsx` | Reemplazar por `FeedCreatePost.tsx` |

### Modificar
| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Agregar ruta `/feed/tag/:tag` para hashtags |
| `src/lib/postTypes.ts` | Sin cambios (ya esta bien) |
| `src/components/PostComments.tsx` | Refactorizar para reusar en `FeedComments` |

### Deprecar (eliminar cuando todo funcione)
| Archivo | Razon |
|---------|-------|
| `src/components/PetCard.tsx` | Reemplazado por `FeedPost.tsx` |

### Mantener sin cambios
| Archivo | Razon |
|---------|-------|
| `src/components/PetProfileCard.tsx` | Se mueve fuera del feed, pero sigue util |
| `src/components/social/ActivityFeed.tsx` | Se integra como tab opcional |
| `src/components/AdoptionPostCard.tsx` | Se usa en pagina de adopcion, no en feed |
| `src/hooks/useFollows.tsx` | Se mantiene pero optimizar (menos queries) |
| `src/hooks/useBlockedUsers.tsx` | Se mantiene, bloqueo se mueve al server |

---

## 12. Mockup de copy (espanol chileno)

| Elemento | Copy |
|----------|------|
| Tab 1 | "Para ti" |
| Tab 2 | "Siguiendo" |
| Tab 3 | "Popular" |
| Tab 4 | "Explorar" |
| Story crear | "Tu historia" |
| Empty feed | "No hay publicaciones todavia. ¡Se el primero en compartir!" |
| Empty following | "Aun no sigues a nadie. Explora para encontrar mascotas increibles." |
| New posts banner | "3 publicaciones nuevas" |
| Like | "Me gusta" |
| Comments link | "Ver los 8 comentarios" |
| Comment placeholder | "Agrega un comentario..." |
| Caption "ver mas" | "...mas" |
| Post type foto | "📸 Foto" |
| Post type pregunta | "❓ Pregunta" |
| Post type consejo | "💡 Consejo" |
| Post type perdido | "🔍 Perdido / Encontrado" |
| Post type adopcion | "🏠 Adopcion" |
| Post type logro | "🏆 Logro" |
| Report options | "Spam", "Contenido inapropiado", "Acoso", "Informacion falsa", "Otro" |
| End of feed | "Estas al dia — ya viste todas las publicaciones recientes 🐾" |
| Create post title | "Nueva publicacion" |
| Create post btn | "Publicar" |
| Image upload | "Sube hasta 10 fotos" |
| Location placeholder | "Agregar ubicacion (ej: Providencia)" |

---

## 13. Consideraciones mobile (Capacitor)

- **Doble-tap**: usar `touch-action: manipulation` en el area de imagen para evitar zoom
- **Pull-to-refresh**: implementar con touch events nativos, no con plugin externo
- **Stories**: camara nativa con `@capacitor/camera` para captura directa
- **Haptics**: `@capacitor/haptics` para feedback en like (ImpactStyle.Light)
- **Share**: `@capacitor/share` para compartir post nativo (WhatsApp, IG, etc.)
- **StatusBar**: ocultar en story viewer fullscreen
- **Safe areas**: padding-top para notch en stories y modal de creacion

---

## 14. Metricas de exito

| Metrica | Antes | Objetivo |
|---------|-------|----------|
| Posts visibles al publicar | 0 (bug) | 100% |
| Queries por carga de feed | ~80 (4 por post) | 1 (RPC) |
| Tiempo de carga inicial | ~3-4s | <1.5s |
| Interacciones por sesion | ? (no se mide) | +50% |
| Posts creados por dia | ? | Medir baseline y duplicar |
| Retencion en feed (tiempo) | ? | >2 min promedio |

---

## 15. Fuera de alcance (para despues)

- [ ] Reels/videos cortos (requiere transcoding + CDN)
- [ ] Algoritmo de recomendacion IA (requiere data de engagement)
- [ ] Direct messages (ya existe chat, mejorar aparte)
- [ ] Anuncios/sponsored posts (requiere modelo de monetizacion)
- [ ] Multi-idioma (todo en espanol chileno por ahora)
- [ ] Notificaciones push de interacciones (implementar con reminder-cron existente)

---

> **Nota**: Este blueprint NO toca la joya de la corona (ficha medica PDF + directorio de vets). El feed es una feature social paralela.
