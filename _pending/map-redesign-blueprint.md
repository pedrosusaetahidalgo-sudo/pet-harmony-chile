# Paw Friend — Map Redesign Blueprint (estilo SoSafe)

> Blueprint maestro para redisenar la pestana **Mapa** de Paw Friend con estandar de Principal Product Designer + Senior UX/UI + Mobile Map UX Architect.
> Autor: Claude Code · Fecha: 2026-04-11
> **Estado:** pendiente — no implementado. Ningun componente nuevo creado, `Maps.tsx` intacto.
> Archivos auditados:
> - [src/pages/Maps.tsx](src/pages/Maps.tsx) — pantalla actual (626 lineas, 3 vistas, Leaflet)
> - [src/components/maps/MapFilters.tsx](src/components/maps/MapFilters.tsx) — dialogo de filtros
> - [src/components/maps/MapPinPopup.tsx](src/components/maps/MapPinPopup.tsx) — popups de markers (428 lineas)
> - [src/components/maps/ServiceDetailCard.tsx](src/components/maps/ServiceDetailCard.tsx) — card detalle proveedor
> - [src/components/maps/AdoptionDetailCard.tsx](src/components/maps/AdoptionDetailCard.tsx) — card adopcion
> - [src/components/maps/LostPetDetailCard.tsx](src/components/maps/LostPetDetailCard.tsx) — card mascota perdida
> - [src/components/maps/ShelterDetailCard.tsx](src/components/maps/ShelterDetailCard.tsx) — card refugio
> - [src/components/maps/PlacesAutocomplete.tsx](src/components/maps/PlacesAutocomplete.tsx) — autocomplete de direccion
> - [src/hooks/useServiceProviders.tsx](src/hooks/useServiceProviders.tsx) — hook de proveedores
> - [src/hooks/useAdoptionShelters.tsx](src/hooks/useAdoptionShelters.tsx) — hook de refugios
> - [src/lib/leafletConfig.ts](src/lib/leafletConfig.ts) — config Leaflet + iconos
> - [src/lib/distance.ts](src/lib/distance.ts) — calculo Haversine

---

## 0. TL;DR ejecutivo

El mapa actual ([src/pages/Maps.tsx](src/pages/Maps.tsx)) funciona pero se siente como un **prototipo tecnico**, no como un producto pulido. Tres vistas (perdidas, adopcion, servicios) comparten la misma pantalla con tabs genericos, popups de Leaflet nativos, filtros encerrados en un dialog modal, y cero feedback visual de ubicacion del usuario. Comparado con SoSafe — que usa bottom sheets arrastables, chips de categoria flotantes, marker clustering, y un FAB de reporte prominente — nuestro mapa parece de 2019.

**Problemas criticos detectados:**

1. **Markers de adopcion son falsos**: `adoption_posts` no tiene columnas lat/lng, asi que las mascotas en adopcion se dispersan aleatoriamente alrededor de Santiago ([Maps.tsx:234-236](src/pages/Maps.tsx#L234-L236)). El usuario ve puntos inventados.
2. **Popups nativos de Leaflet**: pequenos, sin scroll, se cierran al tocar fuera. En mobile son practicamente inutilizables. SoSafe usa bottom sheets que el usuario arrastra.
3. **Filtros escondidos en un dialog**: el usuario debe tocar un icono, abrir el dialog, ajustar, y cerrar. SoSafe muestra chips de categoria visibles siempre en la parte superior del mapa.
4. **Sin clustering**: 50+ markers en Santiago se superponen y forman una mancha ilegible. No hay agrupacion por zoom.
5. **Sin indicador visual de ubicacion**: la geolocalizacion se pide pero el punto azul del usuario es un DivIcon basico sin pulso ni halo animado.
6. **Coverage radius invisible**: `service_providers.coverage_radius_km` se consulta pero nunca se dibuja en el mapa.
7. **Sin busqueda por direccion en el mapa**: `PlacesAutocomplete` existe pero no esta integrado en la pantalla del mapa.
8. **Sin realtime**: nuevos reportes de mascotas perdidas no aparecen en vivo.

**Tesis del rediseno**: El mapa debe convertirse en el **centro de comando geografico** de Paw Friend — donde el dueno ve todo lo que pasa cerca de el en una sola pantalla, con la experiencia fluida de una app nativa tipo SoSafe: chips de filtro flotantes, bottom sheet arrastable para detalles, marker clustering inteligente, y un FAB de reporte/accion prominente.

---

## 1. Referencia de diseno: SoSafe

SoSafe (sosafe.app) es la app de seguridad vecinal mas popular de Chile (+1.5M usuarios). Su mapa es el estandar local que los usuarios chilenos conocen y esperan. Elementos clave que adaptaremos:

### 1.1. Patrones SoSafe que adoptamos

| Patron SoSafe | Adaptacion Paw Friend |
|---|---|
| **Mapa full-bleed** sin header fijo | Mapa ocupa 100vh, controles flotantes sobre el mapa |
| **Chips de categoria** horizontales arriba | Chips: Todos, Veterinarias, Perdidas, Adopcion, Paseos, Grooming, Refugios |
| **Bottom sheet arrastable** para detalles | Reemplaza popup nativo de Leaflet. 3 estados: peek (mini), half, full |
| **FAB de reporte** prominente abajo-derecha | FAB con menu radial: Reportar perdida, Publicar adopcion, Pedir ayuda |
| **Marker clustering** con conteo | Clusters con icono de patita + numero, se desagregan al zoom in |
| **Pin central draggable** para reportar | Al crear reporte, pin central con crosshair + "Arrastra para ubicar" |
| **Pulso en ubicacion del usuario** | Punto azul animado con halo pulsante (CSS `@keyframes pulse`) |
| **Busqueda de direccion** integrada | Barra de busqueda flotante arriba con PlacesAutocomplete |
| **Realtime** | Nuevos reportes de perdidas aparecen en vivo (Supabase realtime) |

### 1.2. Patrones que NO adoptamos

| Patron SoSafe | Razon de exclusion |
|---|---|
| Mapa oscuro (dark tiles) | Nuestra app es light-themed, tiles claros mantienen coherencia |
| Boton de panico/emergencia | No aplica para mascotas (el FAB de reporte cubre la urgencia) |
| Chat vecinal en mapa | Paw Friend ya tiene `/chat` separado |
| Zona de riesgo con heatmap | Podria servir futuro para zonas de perdidas, pero no en v1 |

---

## 2. Arquitectura de la pantalla rediseñada

### 2.1. Layout (mobile-first, 100vh)

```
+--------------------------------------------------+
|  [🔍 Buscar direccion...            ] [📍]  ← Barra busqueda flotante
+--------------------------------------------------+
|  [Todos] [🏥 Vets] [🐾 Perdidas] [🏠 Adopcion]  ← Chips scroll horizontal
|  [🚶 Paseos] [✂️ Grooming] [🏛️ Refugios]         |
+--------------------------------------------------+
|                                                    |
|              M A P A   F U L L                     |
|              (Leaflet / futuro Google)              |
|                                                    |
|         [cluster]    [marker]                      |
|                          [marker]                  |
|    [user 📍]                                       |
|                    [marker]                        |
|                                                    |
|                                    [FAB ➕]  ←── Boton de accion
|                                                    |
+--------------------------------------------------+
|  ▂▂▂  Bottom Sheet (peek: 80px)                   |
|  "3 veterinarias cerca de ti"                      |
|  [card] [card] [card] →                            |
+--------------------------------------------------+
|  [🏠] [🐾] [🏥] [⏰] [👤]  ← BottomTabBar       |
+--------------------------------------------------+
```

### 2.2. Bottom sheet — 3 estados

| Estado | Altura | Contenido | Trigger |
|---|---|---|---|
| **Peek** | 80px | Resumen: "5 resultados cerca de ti" + scroll horizontal de mini-cards | Estado por defecto |
| **Half** | 50vh | Lista vertical de cards con preview (foto, nombre, distancia, rating) | Swipe up desde peek o tap en "Ver todos" |
| **Full** | 90vh | Detalle completo del item seleccionado (reemplaza MapPinPopup actual) | Tap en un card o en un marker del mapa |

**Interaccion clave**: Al tocar un marker en el mapa, el bottom sheet sube a estado **full** con el detalle de ese item. El mapa se centra en el marker con animacion `flyTo`. Al bajar el sheet, vuelve a peek.

### 2.3. Chips de categoria (reemplazan tabs + filtros)

```typescript
// Categorias unificadas — ya no hay 3 vistas separadas
const MAP_CATEGORIES = [
  { id: 'all',       label: 'Todos',        icon: Globe,      color: '#6366f1' },
  { id: 'vet',       label: 'Veterinarias',  icon: Stethoscope, color: '#10b981' },
  { id: 'lost',      label: 'Perdidas',      icon: Search,     color: '#ef4444' },
  { id: 'adoption',  label: 'Adopcion',      icon: Heart,      color: '#f97316' },
  { id: 'walker',    label: 'Paseos',        icon: Footprints, color: '#3b82f6' },
  { id: 'grooming',  label: 'Grooming',      icon: Scissors,   color: '#ec4899' },
  { id: 'shelter',   label: 'Refugios',      icon: Home,       color: '#8b5cf6' },
  { id: 'trainer',   label: 'Entrenadores',  icon: Dumbbell,   color: '#f59e0b' },
  { id: 'sitter',    label: 'Cuidadores',    icon: ShieldCheck, color: '#8b5cf6' },
] as const;
```

**Comportamiento**:
- Seleccion multiple: el usuario puede activar "Vets + Perdidas" a la vez
- Chip "Todos" es toggle global (activa/desactiva todos)
- Cada chip muestra un badge con el conteo de markers visibles en viewport
- Scroll horizontal con `overflow-x-auto snap-x`
- Al seleccionar una categoria, el mapa NO cambia de zoom ni posicion — solo filtra markers

### 2.4. FAB de accion (reemplaza FAB actual)

```
FAB cerrado:  [➕]

FAB abierto (menu radial):
         [🐾 Reportar perdida]
    [🏠 Publicar adopcion]
         [📍 Marcar zona peligrosa]
```

- **Reportar perdida**: abre el flujo actual de `ReportLostPetForm` pero con pin central draggable para ubicacion exacta
- **Publicar adopcion**: abre `CreateAdoptionPost` con geocoding obligatorio
- **Marcar zona peligrosa**: (v2) — reportar zona donde se pierden mascotas frecuentemente

---

## 3. Componentes nuevos y refactorizados

### 3.1. Componentes nuevos a crear

| Componente | Archivo | Responsabilidad |
|---|---|---|
| `MapBottomSheet` | `src/components/maps/MapBottomSheet.tsx` | Bottom sheet arrastable con 3 estados (peek/half/full) |
| `MapCategoryChips` | `src/components/maps/MapCategoryChips.tsx` | Fila de chips de categoria con seleccion multiple y conteo |
| `MapSearchBar` | `src/components/maps/MapSearchBar.tsx` | Barra de busqueda flotante con PlacesAutocomplete integrado |
| `MapMarkerCluster` | `src/components/maps/MapMarkerCluster.tsx` | Wrapper de Leaflet.markercluster con iconos custom |
| `MapUserLocation` | `src/components/maps/MapUserLocation.tsx` | Punto azul animado con halo pulsante + boton "Centrar en mi" |
| `MapFABMenu` | `src/components/maps/MapFABMenu.tsx` | FAB con menu radial de acciones (reportar, adopcion) |
| `MapResultCard` | `src/components/maps/MapResultCard.tsx` | Card unificada para bottom sheet (compacta + expandida) |
| `MapCoverageCircle` | `src/components/maps/MapCoverageCircle.tsx` | Circulo semitransparente de cobertura para providers |
| `MapPinSelector` | `src/components/maps/MapPinSelector.tsx` | Pin central draggable para seleccionar ubicacion al reportar |

### 3.2. Componentes a refactorizar

| Componente actual | Cambio |
|---|---|
| [Maps.tsx](src/pages/Maps.tsx) | Reescribir como orquestador: mapa + chips + sheet + FAB. Eliminar tabs y vista triple |
| [MapFilters.tsx](src/components/maps/MapFilters.tsx) | Mover logica a chips + sub-filtros dentro del bottom sheet (radio, tamano, etc.) |
| [MapPinPopup.tsx](src/components/maps/MapPinPopup.tsx) | Deprecar. El bottom sheet en estado full reemplaza los popups |
| [PlacesAutocomplete.tsx](src/components/maps/PlacesAutocomplete.tsx) | Integrar dentro de MapSearchBar con estilos flotantes |
| [leafletConfig.ts](src/lib/leafletConfig.ts) | Agregar config de clustering + nuevos iconos SVG por categoria |

### 3.3. Hooks nuevos

| Hook | Archivo | Responsabilidad |
|---|---|---|
| `useMapMarkers` | `src/hooks/useMapMarkers.ts` | Unifica datos de lost_pets + adoption_posts + service_providers + adoption_shelters en un solo array de markers tipado |
| `useUserGeolocation` | `src/hooks/useUserGeolocation.ts` | Geolocation API con watch, permisos, fallback a Santiago, estado de carga |
| `useMapRealtime` | `src/hooks/useMapRealtime.ts` | Suscripcion Supabase realtime a `lost_pets` e inserts de `service_providers` |
| `useBottomSheet` | `src/hooks/useBottomSheet.ts` | Estado del sheet (peek/half/full), gestos de drag, snap points |
| `useMapViewport` | `src/hooks/useMapViewport.ts` | Bounds del mapa visible, conteo de markers por categoria en viewport |

---

## 4. Markers e iconos

### 4.1. Iconos custom por categoria

Reemplazar los DivIcon actuales (circulos de color con punto) por SVG custom con identidad de Paw Friend:

```
Veterinaria:    🏥 verde (#10b981) — cruz medica en circulo
Perdida:        🔴 rojo (#ef4444) — silueta mascota con "?" — PULSA si < 24h
Encontrada:     ✅ verde (#22c55e) — silueta mascota con check
Adopcion:       🧡 naranja (#f97316) — corazon con patita
Refugio:        🏛️ violeta (#8b5cf6) — casa con patita
Paseos:         🚶 azul (#3b82f6) — persona caminando con perro
Grooming:       ✂️ rosa (#ec4899) — tijera con estrella
Entrenador:     💪 ambar (#f59e0b) — silbato
Cuidador:       🛡️ violeta (#7c3aed) — escudo con patita
Usuario:        📍 indigo (#4F46E5) — punto con halo animado
```

**Tamano**: 36x36px en mobile, 28x28px en desktop. Al hacer hover/tap: escala a 1.2x con `transition: transform 150ms`.

### 4.2. Marker clustering

Dependencia: `leaflet.markercluster` (ya esta en el ecosistema Leaflet, ~14kB gzip).

```
npm install leaflet.markercluster @types/leaflet.markercluster
```

**Cluster visual**:
- Circulo con gradiente segun la categoria dominante
- Numero blanco en el centro (font-weight 700)
- Tamanos: <10 markers = 36px, 10-50 = 44px, 50+ = 52px
- Al hacer tap en cluster: zoom in con `spiderfyOnMaxZoom` + bounds animation
- `maxClusterRadius`: 60px (ajustable)

### 4.3. Marker seleccionado

Cuando el usuario toca un marker:
1. El marker escala a 1.3x con bounce (`transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)`)
2. Una sombra se proyecta debajo (`drop-shadow`)
3. El mapa hace `flyTo` al marker con zoom 15 y duracion 0.8s
4. El bottom sheet sube a estado full con el detalle

---

## 5. Bottom sheet — especificacion detallada

### 5.1. Estados y transiciones

```
Estado PEEK (default):
┌─────────────────────────────────────────┐
│  ▂▂▂  (handle de drag)                 │
│  🐾 5 resultados cerca de ti            │
│  [mini-card] [mini-card] [mini-card] →  │
└─────────────────────────────────────────┘
Altura: 100px. Touch en handle o swipe up → HALF

Estado HALF:
┌─────────────────────────────────────────┐
│  ▂▂▂                                   │
│  🐾 5 resultados · Ordenar: Distancia ▾│
│  ┌─────────────────────────────────┐    │
│  │ 🏥 Vet Patitas Felices    0.8km│    │
│  │ ⭐ 4.8 (23) · Consulta $15.000 │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🔴 Luna (perdida)         1.2km│    │
│  │ Labrador · Vista por ultima... │    │
│  └─────────────────────────────────┘    │
│  [...]                                  │
└─────────────────────────────────────────┘
Altura: 50vh. Swipe up → FULL. Swipe down → PEEK.

Estado FULL (detalle de item):
┌─────────────────────────────────────────┐
│  ▂▂▂                    [✕ Cerrar]     │
│  ┌─────────────────────────────────────┐│
│  │         FOTO / GALERIA             ││
│  │         (aspect 16:9)              ││
│  └─────────────────────────────────────┘│
│  🏥 Vet Patitas Felices                │
│  ⭐ 4.8 (23 resenas) · Verificado ✓   │
│                                         │
│  📍 Providencia, Santiago · 0.8 km     │
│  🕐 Lun-Vie 9:00-18:00                │
│  💰 Consulta general: $15.000          │
│                                         │
│  "Clinica veterinaria especializada..." │
│                                         │
│  [📞 Llamar]  [💬 Chat]  [📅 Reservar] │
│                                         │
│  ── Servicios ──                        │
│  Consulta · Vacunacion · Cirugia       │
│                                         │
│  ── Cobertura ──                        │
│  🔵 Radio de 5 km (se dibuja en mapa)  │
└─────────────────────────────────────────┘
Altura: 90vh. Swipe down → HALF.
```

### 5.2. Mini-cards (estado peek, scroll horizontal)

Cada mini-card mide 120x80px:
- Foto o icono de categoria (40x40px)
- Nombre (1 linea, truncado)
- Distancia ("0.8 km")
- Indicador de categoria (borde de color)

### 5.3. Ordenamiento

Opciones de orden en estado HALF:
1. **Distancia** (default) — mas cercano primero
2. **Rating** — mejor puntuacion primero (solo servicios)
3. **Reciente** — ultimo creado primero (perdidas y adopcion)
4. **Precio** — mas barato primero (solo servicios)

### 5.4. Gestos

- **Swipe up**: peek → half → full
- **Swipe down**: full → half → peek
- **Tap en handle**: toggle peek ↔ half
- **Tap fuera del sheet** (en el mapa): sheet baja a peek
- **Tap en marker del mapa**: sheet va directo a full con ese item
- **Tap en card de lista**: sheet va a full con detalle
- **Velocity-based snapping**: si el swipe es rapido, salta un estado

---

## 6. Barra de busqueda flotante

### 6.1. Posicion y layout

```
+--------------------------------------------------+
|  [🔍 Buscar direccion, vet, comuna...   ] [📍]   |
+--------------------------------------------------+
```

- **Posicion**: `absolute top-4 left-4 right-4 z-[1000]` — flotante sobre el mapa
- **Estilo**: `bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 h-12`
- **Icono busqueda**: Search (lucide) a la izquierda
- **Boton centrar**: MapPin (lucide) a la derecha — centra el mapa en la ubicacion del usuario
- **Integracion**: `PlacesAutocomplete` adentro, restringido a Chile

### 6.2. Comportamiento

1. Al escribir: autocomplete de Google Places (si API key presente) o busqueda local en nombres de providers/shelters
2. Al seleccionar resultado: `flyTo` a la coordenada con zoom 15
3. Al tocar boton centrar (📍): `flyTo` a ubicacion del usuario + zoom 14
4. Si no hay permiso de geolocalizacion: mostrar toast "Activa tu ubicacion para ver resultados cercanos"

---

## 7. Filtros avanzados (sub-filtros dentro del bottom sheet)

Los chips de categoria son el filtro primario. Para filtros secundarios, un boton "Filtros" en el header del bottom sheet abre una seccion expandible:

### 7.1. Filtros por categoria

| Categoria | Filtros secundarios |
|---|---|
| **Veterinarias** | Especialidad (general, urgencias, exoticos, dental), precio max, verificado, rating minimo |
| **Perdidas** | Estado (perdida/encontrada), especie, raza, fecha (ultimas 24h, semana, mes) |
| **Adopcion** | Especie, tamano, genero, edad, compatible con ninos/perros/gatos |
| **Paseos** | Precio max, rating minimo, disponibilidad hoy, acepta emergencias |
| **Grooming** | Precio max, tipo mascota (perro/gato), tamano aceptado |
| **Refugios** | Tipo (ONG, fundacion, refugio, casa de acogida), verificado, animales aceptados |
| **Entrenadores** | Especialidad, precio max, experiencia minima |
| **Cuidadores** | Precio max, rating, acepta emergencias |

### 7.2. Filtro de radio

- **Slider de radio**: 1-50 km (paso de 1 km), reemplaza el actual 5-100 km
- **Visual**: circulo semitransparente en el mapa centrado en el usuario
- **Default**: 10 km (el actual de 5 km es muy restrictivo)
- **Responsivo**: al mover el slider, el circulo y los markers se actualizan en tiempo real

---

## 8. Integraciones con el resto de la app

### 8.1. Conexiones desde el mapa

| Desde | Hacia | Accion |
|---|---|---|
| Card de vet en sheet | `/veterinarios/:slug` | Ver perfil publico completo |
| Card de vet en sheet | Reservar | Deep-link a `/mis-reservas` con provider pre-seleccionado |
| Card de vet en sheet | Chat | Abre `/chat` con conversacion del provider |
| Card de perdida | Contactar | `tel:` o `mailto:` del reportante |
| Card de perdida | Compartir | `navigator.share()` con datos + foto |
| Card de adopcion | Contactar | Chat con publicador |
| Card de refugio | Ver detalle | Link a seccion de adopcion filtrada |
| Chip "Perdidas" | FAB | Sugerir reportar si no hay resultados cercanos |
| Cualquier card | Ficha clinica | Si la mascota tiene `pet_id`, link a `/mascota/:petId/ficha-clinica` |

### 8.2. Conexiones hacia el mapa

| Desde | Hacia | Deep-link |
|---|---|---|
| Home dashboard | "Ver en mapa" en card de recordatorio | `/maps?focus=vet&id=xxx` |
| Perfil de vet | "Ver en mapa" | `/maps?focus=vet&id=xxx&zoom=16` |
| Adopcion | "Ver en mapa" | `/maps?category=adoption` |
| Mis mascotas | "Reportar perdida" | `/maps?action=report-lost&petId=xxx` |
| Recordatorios | "Buscar vet cercano" | `/maps?category=vet` |
| QR landing publica | "Encontre esta mascota" | `/maps?action=report-found&petId=xxx` |

### 8.3. Query params del mapa

```typescript
interface MapQueryParams {
  category?: MapCategoryId;          // Filtro de categoria inicial
  focus?: 'vet' | 'lost' | 'adopt'; // Tipo de item a enfocar
  id?: string;                       // ID del item a mostrar en sheet full
  lat?: number;                      // Coordenada para centrar
  lng?: number;                      // Coordenada para centrar
  zoom?: number;                     // Zoom inicial
  action?: 'report-lost' | 'report-found'; // Accion directa
  petId?: string;                    // Mascota asociada a la accion
}
```

---

## 9. Correccion de geodatos

### 9.1. BUG CRITICO: adoption_posts sin coordenadas

**Problema**: La tabla `adoption_posts` no tiene columnas `latitude`/`longitude`. El mapa genera coordenadas aleatorias ([Maps.tsx:234-236](src/pages/Maps.tsx#L234-L236)):

```typescript
// ACTUAL — datos inventados
position: [
  SANTIAGO_CENTER[0] + (Math.random() - 0.5) * 0.1,
  SANTIAGO_CENTER[1] + (Math.random() - 0.5) * 0.1,
]
```

**Solucion**:

1. **Migracion SQL** — agregar columnas geo:
```sql
-- migracion: YYYYMMDDHHMMSS_add_geo_to_adoption_posts.sql
ALTER TABLE adoption_posts
  ADD COLUMN latitude NUMERIC,
  ADD COLUMN longitude NUMERIC;

CREATE INDEX idx_adoption_posts_location ON adoption_posts (latitude, longitude);

-- Backfill: adopciones existentes sin coords quedan NULL
-- y se muestran con badge "Ubicacion aproximada" usando la comuna como texto
```

2. **UI de creacion** — Hacer geocoding obligatorio en `CreateAdoptionPost`:
   - Agregar `PlacesAutocomplete` al formulario
   - Guardar `latitude`, `longitude` y `comuna` al crear
   - Validar con zod: `latitude` y `longitude` requeridos

3. **Rendering** — Posts sin coords reales:
   - NO mostrar en mapa (solo en lista de adopcion)
   - O mostrar con icono gris "ubicacion aproximada" en centro de su comuna

### 9.2. Validacion de coordenadas

Centralizar la validacion actual ([Maps.tsx:324-337](src/pages/Maps.tsx#L324-L337)) en un util:

```typescript
// src/lib/geo.ts
export function isValidCoord(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

export function getMapCenter(
  userLat?: number, userLng?: number,
  markers?: Array<{ lat: number; lng: number }>
): [number, number] {
  if (userLat && userLng && isValidCoord(userLat, userLng)) {
    return [userLat, userLng];
  }
  if (markers?.length) {
    const valid = markers.filter(m => isValidCoord(m.lat, m.lng));
    if (valid.length) {
      const avgLat = valid.reduce((s, m) => s + m.lat, 0) / valid.length;
      const avgLng = valid.reduce((s, m) => s + m.lng, 0) / valid.length;
      return [avgLat, avgLng];
    }
  }
  return SANTIAGO_CENTER;
}
```

### 9.3. Geocoding inverso para datos legacy

Para `adoption_posts` y `lost_pets` que solo tienen `location` (texto) sin coords:
- Crear edge function `geocode-address/` que usa la API de Google Geocoding (o Nominatim gratis) para convertir texto → lat/lng
- Correr como batch sobre registros existentes con `latitude IS NULL`
- Costo estimado: $5/1000 direcciones con Google, gratis con Nominatim (rate limited)

---

## 10. Ubicacion del usuario

### 10.1. Hook `useUserGeolocation`

```typescript
interface GeoState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';
  error: string | null;
}
```

**Flujo**:
1. Al montar el mapa, pedir permiso con `navigator.geolocation.getCurrentPosition`
2. Si concedido: activar `watchPosition` para tracking continuo
3. Si denegado: centrar en Santiago, mostrar banner "Activa tu ubicacion"
4. Si no disponible (desktop sin GPS): usar IP-based fallback o Santiago

### 10.2. Indicador visual

```css
/* Punto azul con halo pulsante — estilo SoSafe */
.user-location-marker {
  width: 16px;
  height: 16px;
  background: #4F46E5;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4);
  animation: user-pulse 2s ease-in-out infinite;
}

@keyframes user-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
  70%  { box-shadow: 0 0 0 20px rgba(79, 70, 229, 0); }
  100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
}

/* Circulo de precision (accuracy) */
.user-accuracy-circle {
  fill: rgba(79, 70, 229, 0.08);
  stroke: rgba(79, 70, 229, 0.2);
  stroke-width: 1;
}
```

### 10.3. Boton "Centrar en mi"

- **Icono**: `Navigation` de lucide (brujula)
- **Posicion**: dentro de la barra de busqueda, a la derecha
- **Estado activo**: icono rota a azul cuando el mapa esta centrado en el usuario
- **Estado inactivo**: icono gris cuando el usuario movio el mapa manualmente
- **Tap**: `flyTo(userLocation, 14, { duration: 0.8 })`

---

## 11. Realtime

### 11.1. Suscripciones

```typescript
// useMapRealtime.ts
// Escuchar inserts y updates en lost_pets
supabase
  .channel('map-lost-pets')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'lost_pets',
    filter: 'is_active=eq.true'
  }, (payload) => {
    // Agregar/actualizar marker en el mapa sin refetch completo
    queryClient.setQueryData(['lost-pets'], ...)
  })
  .subscribe();
```

### 11.2. Indicador de nuevo reporte

Cuando llega un nuevo reporte de mascota perdida:
1. Toast temporal: "🐾 Nueva mascota perdida reportada cerca de ti"
2. Marker aparece con animacion de drop (cae desde arriba)
3. Si esta a <2km del usuario: notificacion push (si tiene permisos)

---

## 12. Preparacion para migracion a Google Maps

El diseno esta pensado para que el cambio de Leaflet a Google Maps sea una sustitucion de capa, no un rediseno:

### 12.1. Abstraccion de mapa

```typescript
// src/lib/mapProvider.ts
export interface MapProvider {
  setCenter(lat: number, lng: number, zoom?: number): void;
  flyTo(lat: number, lng: number, zoom: number, duration?: number): void;
  addMarker(id: string, lat: number, lng: number, icon: MarkerIcon): void;
  removeMarker(id: string): void;
  addCircle(id: string, lat: number, lng: number, radiusKm: number): void;
  getBounds(): { ne: LatLng; sw: LatLng };
  onBoundsChange(cb: (bounds: Bounds) => void): void;
  onMarkerClick(cb: (markerId: string) => void): void;
}
```

### 12.2. Lo que cambia vs lo que no

| Componente | Cambia con Google Maps? |
|---|---|
| `MapBottomSheet` | No — es UI pura sobre el mapa |
| `MapCategoryChips` | No — es UI pura |
| `MapSearchBar` | Parcial — Google Places ya tiene autocomplete nativo |
| `MapMarkerCluster` | Si — Google Maps tiene su propio clustering (@googlemaps/markerclusterer) |
| `MapUserLocation` | Parcial — Google Maps tiene soporte nativo de "mi ubicacion" |
| `useMapMarkers` | No — es logica de datos |
| `useUserGeolocation` | No — usa navigator.geolocation, no depende de Leaflet |
| `MapCoverageCircle` | Si — cambia de L.circle a google.maps.Circle |
| Tile layer config | Si — se elimina OpenStreetMap, se usa Google tiles |

---

## 13. Performance

### 13.1. Optimizaciones criticas

| Problema actual | Solucion |
|---|---|
| Todos los markers cargados en memoria | **Viewport-based loading**: solo cargar markers dentro del bbox visible + buffer de 20% |
| Distancia calculada client-side en cada render | **Memoizacion**: `useMemo` con deps en `[markers, userLocation, filters]` |
| 3 queries paralelas (lost + adoption + services) | **Hook unificado** `useMapMarkers` con query combinada y cache de react-query |
| Sin paginacion | **Virtual scrolling** en bottom sheet con `react-window` o similar |
| DivIcon creados en cada render | **Icon cache**: crear iconos una vez y reutilizar por referencia |

### 13.2. Lazy loading

- `leaflet.markercluster`: importar con `React.lazy` + `Suspense`
- Bottom sheet: skeleton de 80px mientras carga
- Fotos en cards: `loading="lazy"` + placeholder blur

### 13.3. Metricas objetivo

| Metrica | Actual (estimado) | Objetivo |
|---|---|---|
| Time to interactive (mapa visible) | ~3s | <1.5s |
| Markers renderizados sin lag | ~100 | 500+ (con clustering) |
| Scroll de bottom sheet | Sin optimizar | 60fps con will-change |
| Bundle size del modulo mapa | ~50kB | <70kB (con clustering) |

---

## 14. Accesibilidad

| Area | Requisito |
|---|---|
| **Chips** | `role="checkbox"`, `aria-checked`, navegable con Tab + Space |
| **Bottom sheet** | `role="dialog"`, `aria-label`, focus trap en estado full |
| **Markers** | `aria-label` descriptivo ("Veterinaria Patitas Felices, 0.8km, 4.8 estrellas") |
| **Barra busqueda** | `role="combobox"`, `aria-expanded`, `aria-activedescendant` |
| **Contraste** | Iconos de markers con borde blanco 2px para contraste sobre cualquier tile |
| **Motion** | Respetar `prefers-reduced-motion`: sin animaciones de pulso, flyTo instantaneo |

---

## 15. Casos de borde

| Caso | Comportamiento |
|---|---|
| Sin permiso de geolocalizacion | Centrar en Santiago, banner "Activa tu ubicacion", filtro por radio deshabilitado |
| 0 resultados en viewport | Empty state en bottom sheet: "No hay resultados aqui. Prueba alejando el mapa o cambiando los filtros" |
| 0 resultados en toda la base | Mensaje: "Todavia no hay [categoria] registrados. Se el primero!" + CTA al FAB |
| Marker sin foto | Icono de categoria como fallback (no broken image) |
| Internet lento / offline | Tiles de OpenStreetMap cacheados en service worker, markers desde react-query cache |
| Adoption post sin coords reales | No aparece en mapa, solo en lista de adopcion con badge "Sin ubicacion exacta" |
| Multiples markers en mismo punto | Clustering los agrupa; al max zoom, spiderfy los separa en circulo |
| Bottom sheet + teclado virtual | Sheet sube con el teclado, input de busqueda siempre visible |
| Pantalla muy pequena (<360px) | Chips en 1 fila scrollable, sheet peek a 72px, mini-cards de 100px |

---

## 16. Dependencias nuevas

| Paquete | Version | Tamano | Razon |
|---|---|---|---|
| `leaflet.markercluster` | ^1.5.3 | ~14kB gzip | Clustering de markers |
| `@types/leaflet.markercluster` | ^1.5.4 | dev | Tipos TS |

**NO agregar**: react-spring, framer-motion (el bottom sheet se hace con CSS transitions + touch events para no inflar el bundle). Si la complejidad de gestos lo requiere, evaluar `@use-gesture/react` (~5kB).

---

## 17. Plan de ejecucion por fases

### Fase 1 — Fundamentos (1 sesion)

- [ ] Crear `src/lib/geo.ts` con `isValidCoord`, `getMapCenter`, `calculateDistance` (mover desde distance.ts)
- [ ] Crear hook `useUserGeolocation` con watch + estados
- [ ] Crear hook `useMapMarkers` que unifica las 3 fuentes de datos
- [ ] Crear migracion SQL para `latitude`/`longitude` en `adoption_posts`
- [ ] Actualizar `CreateAdoptionPost` para capturar coords

### Fase 2 — Layout y chips (1 sesion)

- [ ] Reescribir `Maps.tsx` como orquestador: mapa full-bleed + overlays
- [ ] Crear `MapCategoryChips` con seleccion multiple
- [ ] Crear `MapSearchBar` flotante con PlacesAutocomplete
- [ ] Crear `MapUserLocation` con punto azul animado
- [ ] Eliminar sistema de tabs actual (lost/adoption/services)

### Fase 3 — Bottom sheet (1 sesion)

- [ ] Crear `MapBottomSheet` con 3 estados + gestos de drag
- [ ] Crear `MapResultCard` unificada (compact + expanded)
- [ ] Integrar bottom sheet con tap en markers
- [ ] Deprecar `MapPinPopup` — todo el detalle va al sheet
- [ ] Implementar ordenamiento (distancia, rating, reciente, precio)

### Fase 4 — Clustering y polish (1 sesion)

- [ ] Instalar y configurar `leaflet.markercluster`
- [ ] Crear `MapMarkerCluster` con iconos custom
- [ ] Crear `MapCoverageCircle` para providers
- [ ] Implementar animacion de marker seleccionado (bounce + shadow)
- [ ] Crear `MapFABMenu` con menu radial

### Fase 5 — Realtime y deep-links (1 sesion)

- [ ] Crear `useMapRealtime` para lost_pets
- [ ] Implementar query params (`/maps?category=vet&id=xxx`)
- [ ] Agregar deep-links desde Home, Adopcion, Mis Mascotas, QR landing
- [ ] Crear `MapPinSelector` para flujo de reportar con pin draggable

### Fase 6 — Polish final

- [ ] Viewport-based loading (solo markers en bounds visible)
- [ ] Accesibilidad (aria labels, focus trap, reduced motion)
- [ ] Tests manuales en mobile (Android + iOS Safari)
- [ ] Actualizar `diagrams/FLUJO_COMPLETO.mmd` con nuevo flujo de mapa
- [ ] Actualizar `MAPA_FUNCIONAL_COMPLETO.md`

---

## 18. Wireframe ASCII — pantalla final mobile

```
┌──────────────────────────────────┐
│ [🔍 Buscar...            ] [📍] │ ← z-1000, flotante
├──────────────────────────────────┤
│ [Todos][🏥Vets][🔴Perdidas][🧡] │ ← chips scroll, z-900
│──────────────────────────────────│
│                                  │
│         🏥          🏥           │
│    cluster(4)                    │
│              📍←tu               │
│                   🔴             │
│        🧡                        │
│                        🏥        │
│              🔴                  │
│                                  │
│                          [➕]    │ ← FAB, z-800
│──────────────────────────────────│
│ ▂▂▂                             │
│ 8 resultados · 📍 Providencia   │
│ [mini][mini][mini][mini] →       │ ← bottom sheet peek
├──────────────────────────────────┤
│ [🏠] [🐾] [🏥] [⏰] [👤]       │ ← BottomTabBar
└──────────────────────────────────┘
```

---

## 19. Metricas de exito

| Metrica | Baseline actual | Objetivo post-redesign |
|---|---|---|
| Tiempo promedio en /maps | (sin tracking) | >60s por sesion |
| % usuarios que interactuan con marker | (sin tracking) | >40% |
| Reportes de mascotas perdidas/mes | ~5 | >20 |
| Clicks a "Reservar" desde mapa | 0 | >50/mes |
| Bounce rate en /maps | (sin tracking) | <30% |

---

## 20. Notas para la migracion futura a Google Maps

Cuando se decida migrar de Leaflet a Google Maps:

1. **Instalar**: `@react-google-maps/api` o `@vis.gl/react-google-maps`
2. **Reemplazar**: componente `<MapContainer>` por `<Map>` de Google
3. **Markers**: cambiar de `L.marker` a `<AdvancedMarkerElement>`
4. **Clustering**: cambiar `leaflet.markercluster` por `@googlemaps/markerclusterer`
5. **Tiles**: se eliminan, Google Maps provee los suyos
6. **Places API**: ya integrado nativamente, simplificar `PlacesAutocomplete`
7. **Directions**: bonus — se puede agregar rutas desde usuario hasta vet/refugio
8. **Street View**: bonus — preview visual de la ubicacion del provider
9. **Lo que NO cambia**: bottom sheet, chips, FAB, hooks de datos, realtime, deep-links

**Estimacion**: la migracion deberia tomar ~1 sesion si la abstraccion de la Fase 1-5 esta bien hecha, ya que toda la UI (sheet, chips, cards) es agnositca al provider de mapa.
