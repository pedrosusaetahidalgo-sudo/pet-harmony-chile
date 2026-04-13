# Paw Cards Visual Overhaul — Spec de Ejecucion

> Las cards actuales se ven genericas: mismo fondo lavanda, mismo layout, solo cambia el borde.
> Objetivo: que cada card sea visualmente unica y llame la atencion desde el primer vistazo.
> Prioridad: alta. Ejecutar en la proxima sesion.
> Fecha: 2026-04-13.

---

## 0. Diagnostico: por que se ven aburridas

| Problema | Causa |
|---|---|
| Todas las cards se ven iguales | El fondo interior es siempre el mismo gradiente lavanda |
| La rareza solo cambia el borde | El contenido interno no refleja la rareza |
| No hay identidad por especie/raza | Un bengali se ve igual que un labrador |
| Los Paw Points siempre dicen 0 | `getRarity(0)` hardcodeado en PawCollection → todo es "comun" |
| El holo pattern esta oculto por defecto | Solo aparece en hover, el usuario no lo ve al principio |
| El fondo oscuro de la pagina no ayuda | Card lavanda sobre fondo gris oscuro = flat, sin contraste |

---

## 1. Nuevo sistema de identidad visual por especie

En vez de que la rareza sea el unico diferenciador, **la especie/raza define la paleta base de la card**.

### 1.1. Paletas por especie (inner card background)

| Especie | Gradiente base | Accent | Inspiracion |
|---|---|---|---|
| Perro | `#FFF8E7 → #FFE4B5` (warm cream/gold) | `#D4A017` amber | Pelaje dorado, lealtad |
| Gato | `#E8E0F0 → #D4C5E8` (lavanda frio) | `#7C3AED` purple | Misterio, elegancia |
| Conejo | `#E8F5E9 → #C8E6C9` (mint suave) | `#43A047` green | Naturaleza, frescura |
| Ave | `#E0F7FA → #B2EBF2` (sky blue) | `#0097A7` teal | Cielo, libertad |
| Reptil | `#FFF3E0 → #FFCC80` (arena calida) | `#E65100` deep orange | Desierto, escamas |
| Otro | `#F3E5F5 → #E1BEE7` (soft purple) | `#8E24AA` purple | Default actual mejorado |

### 1.2. Variaciones por raza (refinamiento dentro de especie)

Dentro de cada especie, razas populares obtienen un **accent secundario** que tinta sutilmente el fondo:

| Raza | Tinta extra | Efecto visual |
|---|---|---|
| Golden Retriever | warm gold overlay 5% | Mas dorado que otros perros |
| Husky / Pastor Suizo | cool blue overlay 5% | Tinte frio, nieve |
| Pastor Aleman | amber-brown overlay 5% | Terroso, robusto |
| Bulldog Frances | rose overlay 5% | Rosado suave, cute |
| Bengal | amber-orange overlay 5% | Salvaje, tigre |
| Siames | cream-blue overlay 5% | Elegante, contraste |
| Persa | warm pink overlay 5% | Suave, esponjoso |
| Angora / Maine Coon | silver overlay 5% | Majestuoso |

**Implementacion**: un mapa `BREED_TINT: Record<string, string>` en `paw-cards.ts`. Match por `includes()` case-insensitive sobre `pet.breed`. Fallback: sin tinta extra (solo la paleta de especie).

---

## 2. Rediseno del sistema de rareza

### 2.1. Eliminar probabilidades aleatorias para el tipo de tarjeta

**Cambio clave**: la rareza NO es aleatoria. Se gana con merito.

| Criterio | Rareza resultante |
|---|---|
| Mascota recien creada, sin datos | Comun |
| Tiene foto + datos basicos completos | Poco Comun |
| Tiene ficha clinica con 3+ entradas | Rara |
| Tiene vacunas al dia + foto + ficha completa | Epica |
| Todo lo anterior + compartida con vet + 6+ meses activa | Legendaria |
| Todo lo anterior + ha sido coleccionada por 10+ usuarios | Mitica |

**Beneficio**: la rareza se convierte en un indicador real del cuidado de la mascota, no un dado. Motiva al usuario a completar la ficha.

### 2.2. Nuevos bordes por rareza (mas llamativos)

Los bordes actuales son gradientes lineales simples. Propuesta:

| Rareza | Borde actual | Borde nuevo |
|---|---|---|
| Comun | Bronze lineal | Bronze **solido**, borde mas grueso (6px), esquinas redondeadas 16px |
| Poco Comun | Plata lineal | Plata con **brillo pulsante** sutil (opacity 0.7→1.0, 3s) |
| Rara | Oro lineal | Oro con **particulas flotantes** (3-4 sparkles CSS animados en el borde) |
| Epica | Cyan/purple lineal | **Doble borde**: inner white glow + outer prismatic. Mas agresivo |
| Legendaria | Fire lineal | **Llamas animadas** en el borde (pseudo-elements con gradient animation + blur) |
| Mitica | Rainbow lineal | **Aurora borealis** con **glow pulsante** que ilumina el fondo circundante |

### 2.3. Efecto de brillo interior por rareza

Ademas del borde, el interior de la card cambia:

| Rareza | Efecto interior |
|---|---|
| Comun | Fondo solido de especie, sin efecto extra |
| Poco Comun | Sutil shimmer diagonal (shine sweep lento, 15s) |
| Rara | Shimmer + particles de polvo dorado flotando |
| Epica | Fondo con micro-gradiente animado + inner glow en los bordes |
| Legendaria | Todo lo anterior + el avatar tiene ring de fuego animado |
| Mitica | Todo lo anterior + background particles + text con gradiente animado |

---

## 3. Rediseno del layout de la card

### 3.1. Front actual vs propuesto

**Actual**: Avatar centrado, nombre, especie badge, raza, edad. Todo generico.

**Propuesto**:

```
+--[BORDE ANIMADO (rareza)]------------------+
|                                             |
|  +--[INNER CARD (color especie)]----------+|
|  |                                         ||
|  |  [RARITY BADGE ★]    [ESPECIE ICON] 🐕 ||
|  |                                         ||
|  |     +--[AVATAR GRANDE]--+               ||
|  |     |                   |               ||
|  |     |   FOTO MASCOTA    |  ← 80x80px   ||
|  |     |   (ring rarity)   |    (era 64px) ||
|  |     +-------------------+               ||
|  |                                         ||
|  |  ══════ [DIVIDER RARITY] ═══════        ||
|  |                                         ||
|  |  [NOMBRE GRANDE]  ← 20px bold          ||
|  |  [RAZA]           ← 13px, accent color ||
|  |                                         ||
|  |  +--[STATS BAR]--------------------+    ||
|  |  | 🎂 2a  ·  ♂ Macho  ·  ⚕ 5 reg |    ||
|  |  +----------------------------------+   ||
|  |                                         ||
|  |  [PAW POINTS ★ 45]   [HOLO BADGE]      ||
|  |                                         ||
|  +--- HOLO OVERLAY + SHINE + SPARKLES -----+|
|                                             |
+---------------------------------------------+
```

**Cambios clave**:
1. **Icono de especie** en la esquina superior derecha (🐕🐈🐇🦜🦎) — identidad inmediata
2. **Avatar mas grande** (80px vs 64px) — la foto es lo que mas importa
3. **Stats bar compacto** — edad, genero, registros medicos en una linea
4. **Paw Points visible** — no escondido, es el motor de la rareza
5. **Holo badge siempre visible** — no solo en hover
6. **Divider con color de rareza** — no solo una linea gris

### 3.2. Nombre con estilo por rareza

| Rareza | Estilo del nombre |
|---|---|
| Comun | Blanco/negro solido |
| Poco Comun | Gris oscuro con text-shadow sutil |
| Rara | Gradiente dorado (text) |
| Epica | Gradiente prismatico (cyan→purple) |
| Legendaria | Gradiente fuego + text-shadow glow |
| Mitica | Gradiente rainbow animado + shimmer |

---

## 4. Holo patterns: siempre visibles

### 4.1. Cambio de visibilidad

**Actual**: Los holo patterns estan ocultos (opacity 0) y solo aparecen en hover.
**Nuevo**: Siempre visibles a opacity 0.15-0.25 base, intensificandose a 0.6-1.0 en hover/tilt.

Esto hace que incluso sin interaccion, la card ya muestra su patron holografico.

### 4.2. Holo pattern asignado por raza (no aleatorio)

En vez de `rollHoloPattern()` con probabilidades, cada raza tiene un holo pattern tematico:

| Raza / Grupo | Holo pattern | Razon |
|---|---|---|
| Razas nordicas (Husky, Malamute, Samoyedo) | `holo-galaxy` | Cielo artico |
| Razas acuaticas (Labrador, Golden, Cocker) | `holo-waves` | Agua, natacion |
| Razas toy (Chihuahua, Pomeranian, Yorkie) | `holo-hearts` | Pequenos y adorables |
| Razas guardianas (Pastor Aleman, Rottweiler, Doberman) | `holo-fire` | Fuerza, proteccion |
| Razas elegantes (Caniche, Galgo, Dalmata) | `holo-diamonds` | Distincion |
| Gatos (default) | `holo-stars` | Misteriosos, nocturnos |
| Bengal / Savannah | `holo-fire` | Salvajes |
| Persa / Ragdoll | `holo-diamonds` | Lujo |
| Siames / Oriental | `holo-galaxy` | Exoticos |
| Conejos | `holo-paws` | Huellas tiernas |
| Aves | `holo-rainbow` | Plumaje colorido |
| Reptiles | `holo-waves` | Escamas, agua |
| Default (sin match) | `holo-paws` | Clasico Paw Friend |

**Implementacion**: `getBreedHoloPattern(species: string, breed: string): HoloPattern` en `paw-cards.ts`. Aplica al crear la mascota (trigger SQL o logica en frontend). Las mascotas existentes se migran con una funcion de backfill.

> **Nota**: `rollHoloPattern()` se mantiene como fallback si no hay match de raza, pero deja de ser el mecanismo principal.

---

## 5. Mejoras a la pagina de Coleccion

### 5.1. Bug actual: `getRarity(0)` hardcodeado

En [PawCollection.tsx:17](src/pages/PawCollection.tsx#L17), la mini card siempre pasa `getRarity(0)` → todo se ve comun. Fix: pasar el paw_points real de la mascota.

### 5.2. Grid mas visual

**Actual**: Grid plano con mini cards identicas.
**Nuevo**: 
- Cards un poco mas grandes en mobile (2 columnas, no tan apretadas)
- Efecto de "album de figuritas": fondo con textura sutil tipo cuero/tela
- Contador de rareza en los stats: "3 Comunes · 1 Rara · 1 Epica"
- Filtro por rareza ademas de por especie

### 5.3. Tus mascotas dentro de la coleccion

La coleccion muestra **todo junto**: tus propias mascotas + las que coleccionaste de otros.
- Las tuyas tienen un badge "TUYA" o borde especial para diferenciarlas
- Las coleccionadas muestran "de @username"
- Esto unifica la experiencia: mascotas = coleccion

---

## 6. Fondo de pagina y contraste

### 6.1. Fondo actual: gris oscuro plano → aburrido

**Nuevo fondo para paginas de Paw Cards**:
- Gradiente muy sutil de deep purple a dark blue (`#0A0A1A → #12102B`)
- Pattern de huellas o estrellas a 2% de opacity (como el watermark del back de la card)
- Esto crea un "escenario" que hace que las cards brillen por contraste

### 6.2. Animacion de entrada

Cuando aparece una card (en coleccion, en my-pets, al crear):
- Fade in + scale de 0.9 a 1.0 (200ms, con stagger de 50ms entre cards en grid)
- Las cards de rareza alta tienen un micro-flash de su color al aparecer

---

## 7. Plan de ejecucion (orden de implementacion)

### Fase 1: Datos reales (30 min)
1. Fix `getRarity(0)` → usar paw_points real de la mascota
2. Implementar `calculateRarity(pet)` basado en completitud (seccion 2.1)
3. Implementar `getBreedHoloPattern(species, breed)` (seccion 4.2)
4. Migracion SQL para backfill holo patterns por raza en mascotas existentes

### Fase 2: Paletas por especie (45 min)
5. Crear `SPECIES_PALETTE` map en `paw-cards.ts` (seccion 1.1)
6. Crear `BREED_TINT` map para razas populares (seccion 1.2)
7. Aplicar paleta como CSS variable en `PawCardFlippable.tsx` / `PetCardCompact.tsx`
8. Agregar icono de especie en la card (esquina superior derecha)

### Fase 3: Bordes y efectos de rareza (45 min)
9. Redisenar `RARITY_BORDER_STYLES` con bordes mas llamativos (seccion 2.2)
10. Agregar efectos interiores por rareza (seccion 2.3)
11. Implementar estilo de nombre por rareza (seccion 3.2)
12. Hacer holo patterns siempre visibles a baja opacidad (seccion 4.1)

### Fase 4: Layout de la card (30 min)
13. Redisenar front layout (seccion 3.1): avatar mas grande, stats bar, divider
14. Asegurar que Paw Points y holo badge sean siempre visibles

### Fase 5: Coleccion y pagina (30 min)
15. Unificar mascotas propias + coleccionadas en la coleccion (seccion 5.3)
16. Mejorar grid y filtros (seccion 5.2)
17. Mejorar fondo de pagina (seccion 6)
18. Animaciones de entrada (seccion 6.2)

### Fase 6: Sincronizacion y QA (20 min)
19. Verificar que todos los cambios se reflejan en: PawCardFlippable, PawCardBack, MiniPawCard, PetCardCompact, PawCardRevealCeremony
20. Verificar mobile (touch, swipe, flip)
21. Verificar dark mode
22. Build limpio (`npx tsc -b && npm run build`)

---

## 8. Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/paw-cards.ts` | Paletas especie, tints raza, `getBreedHoloPattern()`, `calculateRarity()` |
| `src/components/PetCardCompact.tsx` | Nuevo `getRarity()` basado en completitud, aplicar paleta especie |
| `src/components/paw-cards/PawCardFlippable.tsx` | Layout nuevo, paleta especie, holo siempre visible |
| `src/components/paw-cards/PawCardBack.tsx` | Paleta especie en el reverso |
| `src/components/paw-cards/PawCardHoloPattern.tsx` | Opacidad base > 0 |
| `src/pages/PawCollection.tsx` | Fix getRarity(0), unificar propias+coleccionadas, grid mejorado |
| `src/pages/MyPets.tsx` | Asegurar que las cards reflejen los nuevos estilos |
| `src/index.css` | Nuevos keyframes, bordes mejorados, fondo pagina cards |
| `supabase/migrations/YYYYMMDD_breed_holo_backfill.sql` | Backfill holo patterns por raza |

---

## 9. Lo que NO cambia

- La ceremonia de reveal (HoloRevealAnimation, PawCardRevealCeremony) — ya esta pulida
- El QR y la mecanica de coleccion — funciona bien
- El flip 3D y gyroscopio — ya esta excelente
- El back de la card — solo ajuste de paleta, estructura intacta
- El sistema de Paw Points como score — se mantiene, pero ahora drives rareza de verdad

---

## 10. Criterio de exito

- [ ] Abrir `/my-pets` y que cada card se vea visualmente distinta segun especie/raza
- [ ] Que una card de gato bengali se distinga inmediatamente de un golden retriever
- [ ] Que la rareza refleje el cuidado real de la mascota, no un dado
- [ ] Que los holo patterns se vean sin necesidad de hover
- [ ] Que la coleccion muestre tus mascotas + coleccionadas con identidad clara
- [ ] Build limpio, 0 errores TS, mobile funcional
