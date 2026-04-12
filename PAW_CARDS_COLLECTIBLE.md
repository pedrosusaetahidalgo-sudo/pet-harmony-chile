# Paw Cards Collectible — Spec completo para Claude Code

> Feature nueva: sistema de tarjetas coleccionables estilo TCG/Amiibo para mascotas.
> Fecha: 2026-04-12.
> Estado: por implementar.
> Prioridad: alta (diferenciador unico de producto).

---

## 1. Vision general

Transformar las tarjetas de mascotas de Paw Friend en **Paw Cards**: tarjetas coleccionables premium con estetica TCG (Trading Card Game), efectos holograficos aleatorios, animacion de volteo (flip) con QR unico en el reverso, y un sistema de coleccion social donde los usuarios escanean QR de otras mascotas para agregarlas a su **Paw Collection**.

Inspiracion: Pokemon TCG (bordes, holograficos, rarezas), Amiibo (ID unico, coleccion), sobres de cartas (probabilidad de patron holografico).

---

## 2. Componentes del sistema

### 2.1. Tarjeta frontal (cara A) — Mejoras visuales

#### 2.1.1. Bordes mas anchos y llamativos

**Estado actual**: `padding: 3px` en `.pet-card-tcg` (borde = gradiente visible a traves del padding).

**Cambio**: aumentar a `padding: 5px` para todos, `6px` para legendary/mythic. El borde debe verse claramente como un marco de carta TCG premium.

#### 2.1.2. Nuevo sistema de bordes por rareza

Reemplazar el sistema actual de bordes. Desde el nivel mas basico, cada carta debe sentirse especial:

| Rareza | Borde | Efecto |
|---|---|---|
| **Comun** (0-19) | Gradiente bronce metalico (`#CD7F32 → #E8C07A → #CD7F32`) | Shift lento (10s), brillo sutil. Ya no es gris plata aburrido |
| **Poco Comun** (20-39) | Gradiente plata metalico (`#C0C0C0 → #E8E8E8 → #A8A8A8`) | Shift medio (7s), reflejo metalico |
| **Raro** (40-59) | Gradiente oro (`#FFD700 → #FFA500 → #FFD700 → #FFEC8B`) | Shift rapido (5s), brillo dorado, sombra dorada sutil |
| **Epico** (60-79) | Gradiente holografico frio (`#00CED1 → #7B68EE → #DA70D6 → #00CED1`) | Shift rapido (4s), efecto prismatico, sombra cyan |
| **Legendario** (80-94) | Gradiente fuego (`#FF4500 → #FF6347 → #FFD700 → #FF4500`) | Shift agresivo (3s), particulas de fuego CSS (pseudo-elements), sombra naranja |
| **Mitico** (95-100) | Arcoiris completo con efecto aurora boreal | Shift ultra (2s), hue-rotate continuo, particulas de estrellas, glow pulsante |

#### 2.1.3. Fondos holograficos aleatorios (sistema de sobres)

**Concepto**: cada Paw Card tiene un **patron holografico de fondo** asignado aleatoriamente al momento de creacion de la mascota. Este patron es permanente (se guarda en DB) y determina la apariencia unica de la carta. Similar a abrir un sobre de cartas TCG.

**Patrones holograficos disponibles** (9 variantes):

| ID | Nombre | Probabilidad | Descripcion visual |
|---|---|---|---|
| `holo-none` | Sin holo | 35% | Fondo limpio con watermark sutil de Paw Friend (logo repetido en diagonal, opacidad 3-5%) |
| `holo-paws` | Paw Print Holo | 20% | Patron de huellas de pata en diagonal, efecto holografico que cambia color con el angulo del mouse |
| `holo-stars` | Starlight | 15% | Estrellas pequenas dispersas con brillo holografico, shift de color |
| `holo-hearts` | Heart Burst | 10% | Corazones con efecto prismatico, colores pastel que rotan |
| `holo-diamonds` | Diamond Dust | 8% | Patron de diamantes/rombos con reflejos tipo cristal |
| `holo-waves` | Ocean Wave | 5% | Ondas horizontales con efecto aurora, colores frios |
| `holo-fire` | Phoenix Flame | 4% | Llamas estilizadas con gradiente calido holografico |
| `holo-galaxy` | Galaxy Swirl | 2% | Espiral galaxia con particulas de estrellas y nebulosa |
| `holo-rainbow` | Full Rainbow | 1% | Arcoiris completo diagonal con maximo brillo y refraccion — **LA MAS RARA** |

**Implementacion del fondo**:
- Cada patron se implementa como un pseudo-element o div overlay dentro de `.pet-card-tcg-inner`
- El patron sigue la posicion del cursor (igual que `.pet-card-tcg-rainbow` actual) para efecto parallax holografico
- Los colores del patron hacen shift/hue-rotate continuo para simular holografia real
- El watermark de Paw Friend (logo SVG) aparece en TODOS los patrones como capa base (opacidad 3-5%), usando el asset existente `src/assets/paw_friend_icon.svg`
- En mobile, el efecto responde al gyroscope (DeviceOrientation API) en vez del mouse

**Asignacion del patron**:
- Se asigna al crear la mascota (`add-pet` flow) usando `Math.random()` contra las probabilidades
- Se guarda en la tabla `pets` como campo `holo_pattern` (varchar, default `'holo-none'`)
- Es inmutable una vez asignado (no se puede cambiar — como abrir un sobre)
- Al asignar, mostrar animacion de "apertura de sobre" con reveal dramatico del patron

#### 2.1.4. Animacion de apertura de sobre (Holo Reveal)

Cuando se crea una mascota nueva y se asigna un patron holografico:

1. Aparece un sobre 3D con branding Paw Friend (animacion CSS)
2. El sobre se abre con efecto de brillo
3. La carta sale del sobre con rotacion 3D
4. Flash de luz segun la rareza del holo obtenido
5. Si es `holo-galaxy` o `holo-rainbow`, efecto de confetti/particulas extra
6. Texto: "Obtuviste: [Nombre del patron]!" con badge de probabilidad

**Componente**: `src/components/paw-cards/HoloRevealAnimation.tsx`

---

### 2.2. Tarjeta reverso (cara B) — QR y branding

#### 2.2.1. Animacion de flip (volteo 3D)

**Trigger**: boton "Voltear" (icono de flip/rotate) posicionado en esquina inferior derecha de la carta.

**Mecanica**:
- `transform: rotateY(180deg)` con `transform-style: preserve-3d` y `backface-visibility: hidden`
- Duracion: 0.6s con easing `cubic-bezier(0.175, 0.885, 0.32, 1.275)` (bounce sutil)
- Ambas caras montadas simultaneamente, la cara B empieza con `rotateY(180deg)`
- En mobile, tambien se puede flipear con swipe horizontal (touch gesture)

#### 2.2.2. Diseno del reverso

El reverso de la carta debe ser visualmente impactante y funcional:

```
+------------------------------------------+
|                                          |
|   [Logo Paw Friend grande, centrado]     |
|   (con efecto holografico animado)       |
|                                          |
|   ┌────────────────────────────────┐     |
|   │                                │     |
|   │       [QR Code grande]         │     |
|   │    (estilizado con colores     │     |
|   │     de la app, no negro)       │     |
|   │                                │     |
|   └────────────────────────────────┘     |
|                                          |
|   "Escanea para coleccionar"             |
|   (texto con efecto shimmer)             |
|                                          |
|   Paw Card #[ID unico]                  |
|   [Nombre mascota] · [Especie]           |
|                                          |
|   ┌──────────┐  ┌──────────┐            |
|   │ Compartir │  │ Descargar│            |
|   └──────────┘  └──────────┘            |
|                                          |
|   ── patron holografico de fondo ──      |
|   ── borde igual que cara frontal ──     |
|                                          |
+------------------------------------------+
```

**Elementos del reverso**:

1. **Logo Paw Friend**: SVG del asset existente, centrado, tamano ~60x60px, con animacion de brillo holografico
2. **QR Code**: generado con `qrcode.react` (`QRCodeSVG`), colores de la marca (foreground: `#7C3AED`, background transparente), tamano 160x160px, con borde decorativo de patitas
3. **ID unico de la carta**: formato `PAW-XXXX-XXXX` (8 caracteres alfanumericos), generado al crear la mascota, guardado en DB
4. **Nombre + especie**: info basica de la mascota
5. **Botones**: "Compartir" (native share / clipboard) y "Descargar" (exportar imagen de la carta completa como PNG)
6. **Fondo**: mismo patron holografico que la cara A, pero con opacidad mayor (15-20%) sobre un fondo de color marca (purple-900/purple-950)
7. **Borde**: identico al de la cara frontal (misma rareza, mismo grosor)

#### 2.2.3. QR Code — Contenido y formato

El QR del reverso codifica una URL unica para coleccionar la carta:

```
https://pawfriend.cl/paw-card/{paw_card_id}
```

Donde `paw_card_id` es el ID unico de la Paw Card (UUID o nanoid). Esta URL:
- Si el usuario NO esta logueado: muestra preview publica de la carta (solo nombre, especie, raza, patron holo, rareza)
- Si el usuario SI esta logueado: muestra preview + boton "Agregar a mi coleccion"
- Si el usuario ya la tiene: muestra "Ya tienes esta Paw Card" con check verde

---

### 2.3. Sistema de coleccion (Paw Collection)

#### 2.3.1. Flujo de coleccion

1. Usuario A muestra el reverso de su Paw Card (QR visible)
2. Usuario B escanea el QR con la camara de su telefono
3. Se abre `pawfriend.cl/paw-card/{id}` en el navegador/app
4. Usuario B ve preview de la carta con efectos holograficos
5. Usuario B presiona "Agregar a mi coleccion"
6. Animacion de "carta obtenida" (similar al holo reveal pero mas corta)
7. La carta se guarda en la coleccion de Usuario B

#### 2.3.2. Reglas de coleccion

- Un usuario NO puede coleccionar sus propias Paw Cards (ya las tiene)
- Cada Paw Card se puede coleccionar una sola vez por usuario (no duplicados)
- La coleccion muestra cuantos "coleccionistas" tiene cada carta (social proof)
- No hay limite de cuantas cartas puedes coleccionar
- Las cartas coleccionadas muestran el patron holografico ORIGINAL del dueno (no se re-rolla)

#### 2.3.3. Pagina de coleccion

**Ruta**: `/paw-collection` (protegida, requiere auth)

**Contenido**:
- Grid de Paw Cards coleccionadas (misma estetica TCG, con efectos holograficos)
- Filtros: por especie, por rareza, por patron holografico
- Ordenar: por fecha de coleccion, por rareza, por nombre
- Estadisticas: total coleccionadas, desglose por rareza, patron mas raro obtenido
- Seccion "Mis Paw Cards" (las propias) vs "Coleccionadas" (de otros)
- Badge/logro si completas ciertos hitos (ej: "Coleccionista Bronce: 10 cartas", "Cazador de Holos: 5 patrones diferentes")

#### 2.3.4. Landing publica de Paw Card

**Ruta**: `/paw-card/:pawCardId` (publica)

**Componente**: `src/pages/PawCardLanding.tsx`

**Contenido**:
- Preview 3D interactiva de la carta (con tilt de mouse/gyro)
- Nombre de la mascota, especie, raza
- Rareza y patron holografico visibles con efectos
- Contador de coleccionistas
- Si logueado: boton "Agregar a mi coleccion" o "Ya la tienes"
- Si no logueado: boton "Inicia sesion para coleccionar"
- Branding Paw Friend + CTA para descargar la app

---

### 2.4. Modelo de datos

#### 2.4.1. Cambios en tabla `pets`

Agregar columnas:

```sql
ALTER TABLE pets ADD COLUMN holo_pattern varchar DEFAULT 'holo-none';
ALTER TABLE pets ADD COLUMN paw_card_id varchar UNIQUE;
```

- `holo_pattern`: uno de los 9 patrones (`holo-none`, `holo-paws`, `holo-stars`, `holo-hearts`, `holo-diamonds`, `holo-waves`, `holo-fire`, `holo-galaxy`, `holo-rainbow`)
- `paw_card_id`: ID unico de la Paw Card, formato `PAW-XXXX-XXXX` (generado al crear la mascota). Usar `nanoid` o similar

#### 2.4.2. Nueva tabla `paw_card_collections`

```sql
CREATE TABLE paw_card_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  collected_at timestamptz DEFAULT now(),
  UNIQUE(collector_id, pet_id)
);

-- RLS: usuario solo puede ver/insertar sus propias colecciones
ALTER TABLE paw_card_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collection"
  ON paw_card_collections FOR SELECT
  USING (auth.uid() = collector_id);

CREATE POLICY "Users can collect cards"
  ON paw_card_collections FOR INSERT
  WITH CHECK (auth.uid() = collector_id);

-- No se puede coleccionar su propia mascota
CREATE POLICY "Cannot collect own pets"
  ON paw_card_collections FOR INSERT
  WITH CHECK (
    pet_id NOT IN (SELECT id FROM pets WHERE owner_id = auth.uid())
  );

-- Indice para consultas de coleccion
CREATE INDEX idx_paw_card_collections_collector ON paw_card_collections(collector_id);
CREATE INDEX idx_paw_card_collections_pet ON paw_card_collections(pet_id);
```

#### 2.4.3. Vista para contar coleccionistas

```sql
CREATE VIEW paw_card_stats AS
SELECT
  p.id AS pet_id,
  p.paw_card_id,
  p.holo_pattern,
  COUNT(pcc.id) AS collector_count
FROM pets p
LEFT JOIN paw_card_collections pcc ON pcc.pet_id = p.id
GROUP BY p.id, p.paw_card_id, p.holo_pattern;
```

---

### 2.5. Estructura de archivos nuevos

```
src/
  components/
    paw-cards/
      PawCardFront.tsx           # Cara frontal mejorada (evoluciona de PetCardCompact)
      PawCardBack.tsx            # Cara reverso con QR
      PawCardFlippable.tsx       # Wrapper con logica de flip 3D
      PawCardHoloPattern.tsx     # Renderiza el patron holografico segun tipo
      PawCardQR.tsx              # QR estilizado del reverso
      PawCardBorder.tsx          # Sistema de bordes por rareza (CSS classes helper)
      HoloRevealAnimation.tsx    # Animacion de apertura de sobre
      PawCardMini.tsx            # Version mini para grids de coleccion
      PawCardCollection.tsx      # Grid de coleccion del usuario
      PawCardPreview.tsx         # Preview 3D para landing publica
      FlipButton.tsx             # Boton de voltear la carta
  hooks/
    usePawCard.ts                # Hook para datos de paw card (holo, card_id, collectors)
    usePawCollection.ts          # Hook para la coleccion del usuario
    useHoloPattern.ts            # Hook para asignar patron holografico con probabilidades
    useGyroscope.ts              # Hook para efecto holografico en mobile (DeviceOrientation)
  pages/
    PawCollection.tsx            # Pagina de coleccion (/paw-collection)
    PawCardLanding.tsx           # Landing publica de paw card (/paw-card/:id)
  lib/
    paw-cards.ts                 # Constantes: patrones, probabilidades, IDs, colores de borde
```

---

### 2.6. Integracion con secciones existentes

Las Paw Cards deben verse consistentes en TODA la app. Donde actualmente aparece una mascota:

| Seccion | Componente actual | Accion |
|---|---|---|
| `/my-pets` | `PetCardCompact` | Reemplazar por `PawCardFlippable` (cara A = frontal mejorada, cara B = QR) |
| Feed social | `PetCard` | Agregar mini-badge del patron holografico + boton "Ver Paw Card" |
| Perfil de usuario | `PetProfileCard` | Mostrar borde de rareza + indicador de holo pattern |
| Perfil propio | `PetIdentityCard` (carousel) | Agregar borde de rareza al mini-card |
| Ficha clinica | Header de mascota | Mostrar mini Paw Card con patron holo en el header |
| `/paw-collection` | **NUEVO** | Grid completo de cartas coleccionadas con filtros |
| `/paw-card/:id` | **NUEVO** | Landing publica con preview interactiva |
| QR Landing (`/qr/:token`) | `QRLanding.tsx` | Agregar link "Ver Paw Card" si la mascota tiene paw_card_id |

---

### 2.7. CSS y animaciones

#### 2.7.1. Nuevas animaciones requeridas (agregar a `index.css`)

```css
/* ── Card flip ── */
@keyframes paw-card-flip {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(180deg); }
}

@keyframes paw-card-flip-back {
  0% { transform: rotateY(180deg); }
  100% { transform: rotateY(360deg); }
}

/* ── Holo patterns ── */
@keyframes holo-paws-drift {
  0% { background-position: 0% 0%; }
  100% { background-position: 100% 100%; }
}

@keyframes holo-stars-twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

@keyframes holo-fire-flicker {
  0%, 100% { filter: hue-rotate(0deg) brightness(1); }
  33% { filter: hue-rotate(15deg) brightness(1.1); }
  66% { filter: hue-rotate(-10deg) brightness(0.95); }
}

@keyframes holo-galaxy-rotate {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.05); }
  100% { transform: rotate(360deg) scale(1); }
}

/* ── Sobre (envelope) reveal ── */
@keyframes envelope-open {
  0% { transform: perspective(600px) rotateX(0deg); }
  100% { transform: perspective(600px) rotateX(-180deg); }
}

@keyframes card-emerge {
  0% { transform: translateY(0) scale(0.8); opacity: 0; }
  50% { transform: translateY(-40px) scale(1.05); opacity: 1; }
  100% { transform: translateY(-20px) scale(1); opacity: 1; }
}

/* ── Shimmer text (para "Escanea para coleccionar") ── */
@keyframes shimmer-text {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* ── Fire particles (para legendary border) ── */
@keyframes fire-particle {
  0% { transform: translateY(0) scale(1); opacity: 0.8; }
  100% { transform: translateY(-20px) scale(0); opacity: 0; }
}
```

#### 2.7.2. Clases de patron holografico

Cada patron necesita una clase CSS que se aplica dentro de `.pet-card-tcg-inner`:

```css
.paw-holo-paws { /* SVG de huellas como background-image, con hue-rotate */ }
.paw-holo-stars { /* radial-gradients como estrellas, con twinkle animation */ }
.paw-holo-hearts { /* SVG hearts pattern, prismatic color shift */ }
.paw-holo-diamonds { /* repeating-linear-gradient rombos, crystal refraction */ }
.paw-holo-waves { /* repeating gradient ondas, aurora colors */ }
.paw-holo-fire { /* gradient calido, flicker animation */ }
.paw-holo-galaxy { /* conic-gradient espiral + radial nebula, rotate animation */ }
.paw-holo-rainbow { /* full spectrum diagonal, max brightness, max hue-rotate */ }
```

Todos los patrones:
- Siguen la posicion del cursor via CSS variables (`--tcg-glow-x`, `--tcg-glow-y`)
- Tienen `mix-blend-mode: overlay` o `soft-light`
- Usan `pointer-events: none`
- Se intensifican en hover
- Tienen una capa base de watermark Paw Friend (logo SVG como `background-image` repetido)

---

### 2.8. Navegacion y acceso

#### 2.8.1. Nuevas rutas en `App.tsx`

```tsx
// Publica
<Route path="/paw-card/:pawCardId" element={<PawCardLanding />} />

// Protegida
<Route path="/paw-collection" element={<ProtectedRoute><PawCollection /></ProtectedRoute>} />
```

#### 2.8.2. Acceso desde la UI

- **My Pets**: cada carta tiene boton de flip para ver QR
- **BottomTabBar / Sidebar**: agregar entrada "Coleccion" con icono de cartas/album (puede ir dentro del menu de perfil o como item secundario)
- **Perfil propio**: seccion "Mi Paw Collection" con contador y link a `/paw-collection`
- **Notificaciones**: "Alguien colecciono tu Paw Card de [nombre mascota]!"

---

## 3. Backfill de mascotas existentes

Las mascotas ya creadas necesitan recibir `holo_pattern` y `paw_card_id`:

```sql
-- Migracion de backfill
-- Asignar paw_card_id a mascotas existentes que no tengan
UPDATE pets
SET paw_card_id = 'PAW-' || upper(substr(md5(random()::text), 1, 4)) || '-' || upper(substr(md5(random()::text), 1, 4))
WHERE paw_card_id IS NULL;

-- Asignar holo_pattern aleatorio segun probabilidades
-- (esto se ejecuta una sola vez como backfill)
UPDATE pets
SET holo_pattern = CASE
  WHEN random() < 0.01 THEN 'holo-rainbow'
  WHEN random() < 0.03 THEN 'holo-galaxy'
  WHEN random() < 0.07 THEN 'holo-fire'
  WHEN random() < 0.12 THEN 'holo-waves'
  WHEN random() < 0.20 THEN 'holo-diamonds'
  WHEN random() < 0.30 THEN 'holo-hearts'
  WHEN random() < 0.45 THEN 'holo-stars'
  WHEN random() < 0.65 THEN 'holo-paws'
  ELSE 'holo-none'
END
WHERE holo_pattern IS NULL OR holo_pattern = 'holo-none';
```

**Nota**: para mascotas existentes, NO mostrar animacion de apertura de sobre. Solo asignar silenciosamente.

---

## 4. Dependencias nuevas

Ninguna dependencia nueva requerida. Todo se puede lograr con:
- `qrcode.react` (ya instalado) para QR del reverso
- CSS puro para animaciones, patrones holograficos, flip 3D
- `nanoid` (considerar agregar, ~130 bytes) para generar `paw_card_id` en frontend — o usar `crypto.randomUUID()` + formato custom

---

## 5. Consideraciones de performance

- Los patrones holograficos son CSS puro (gradients + animations), no imagenes pesadas
- El watermark SVG de Paw Friend se inlinea como data URI para evitar requests extra
- La animacion de flip usa `will-change: transform` y GPU compositing
- En grids grandes (coleccion), usar version mini (`PawCardMini`) con efectos reducidos
- Lazy load de cartas en coleccion con intersection observer (ya disponible via React Query)
- El gyroscope hook (`useGyroscope`) solo se activa en mobile y con throttle de 60fps

---

## 6. Orden de implementacion sugerido

### Fase 1 — Fundamentos visuales
1. Crear `src/lib/paw-cards.ts` con constantes (patrones, probabilidades, colores de borde)
2. Actualizar CSS en `index.css`: nuevos bordes por rareza, padding mas ancho
3. Crear `PawCardHoloPattern.tsx` con los 9 patrones
4. Crear `useHoloPattern.ts` con logica de probabilidades
5. Integrar patrones en `PetCardCompact` existente (antes de refactorear a componentes nuevos)

### Fase 2 — Flip y reverso
6. Crear `PawCardBack.tsx` con QR estilizado
7. Crear `PawCardFlippable.tsx` con animacion de flip 3D
8. Crear `PawCardQR.tsx` (QR con colores de marca)
9. Reemplazar `PetCardCompact` en `MyPets.tsx` con `PawCardFlippable`

### Fase 3 — Base de datos
10. Crear migracion SQL: columnas en `pets` + tabla `paw_card_collections` + RLS + vista
11. Backfill de mascotas existentes
12. Crear `usePawCard.ts` hook para datos

### Fase 4 — Coleccion
13. Crear `PawCardLanding.tsx` (landing publica)
14. Crear `PawCollection.tsx` (pagina de coleccion)
15. Crear `usePawCollection.ts` hook
16. Agregar rutas en `App.tsx`
17. Agregar entrada en navegacion (BottomTabBar/Sidebar)

### Fase 5 — Polish
18. Animacion de apertura de sobre (`HoloRevealAnimation.tsx`)
19. `useGyroscope.ts` para mobile
20. Integracion en secciones existentes (feed, perfil, ficha clinica)
21. Notificaciones de coleccion
22. Actualizar diagramas Mermaid y documentacion viva

---

## 7. Metricas de exito

- **Engagement**: % de usuarios que flipean la carta al menos 1 vez
- **Viralidad**: # de QR escaneados / # de colecciones creadas
- **Retencion**: usuarios que vuelven a ver su coleccion
- **Social**: conversaciones/compartidas generadas por el sistema de cartas

---

## 8. Notas para Claude Code

- **NO** tocar la logica de ficha clinica ni directorio de vets (joya de la corona, rule 9.6 de CLAUDE.md)
- **SI** reusar el asset `src/assets/paw_friend_icon.svg` para watermarks y logo del reverso
- **SI** reusar el sistema de rareza existente (`getRarity`, `RARITY_LABELS`) — solo cambiar los colores/estilos de borde
- Mantener copy en espanol chileno (tuteo chileno, rule 9.5)
- Las migraciones SQL van en `supabase/migrations/` con timestamp, NUNCA aplicar automaticamente
- Actualizar `diagrams/FLUJO_COMPLETO.mmd` con las nuevas rutas y flujos en el mismo commit
- El QR del reverso es DISTINTO al QR medico existente (`qr_token`). Son dos sistemas separados:
  - `qr_token`: acceso a ficha clinica (para vets)
  - `paw_card_id`: coleccion social (para usuarios)
