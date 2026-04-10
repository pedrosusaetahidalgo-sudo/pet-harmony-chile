# Plan: Migrar de Leaflet/OSM a Google Maps + Places (con control de costos)

**Fecha**: 2026-04-10  
**Estado**: Propuesta para revision

---

## Contexto

Actualmente Paw Friend usa Leaflet + OpenStreetMap (gratis, sin API key). Se migro desde Google Maps el 2026-04-08 para eliminar costos. Ahora se quiere volver a Google Maps con Places Autocomplete, pero con restricciones estrictas de uso para evitar cobros excesivos.

---

## Inventario actual de Leaflet (16+ archivos)

### Dependencias (package.json)
- `leaflet: ^1.9.4`
- `react-leaflet: ^4.2.1`
- `@types/leaflet: ^1.9.21`

### Configuracion
| Archivo | Que hace |
|---|---|
| `src/lib/leafletConfig.ts` | Iconos SVG custom, centro Santiago, tile URL de OSM |
| `src/lib/locations.ts` | 32 comunas con coordenadas hardcodeadas |
| `src/lib/distance.ts` | Calculo haversine (se mantiene, no depende de Leaflet) |
| `src/main.tsx` | Import de `leaflet.css` + `leafletConfig` |

### Paginas y componentes de mapa
| Archivo | Lineas | Descripcion |
|---|---|---|
| `src/pages/Maps.tsx` | ~625 | Pagina principal con 3 vistas (Perdidas, Adopcion, Servicios) |
| `src/components/LostPetsMap.tsx` | ~98 | Mapa embebido de mascotas perdidas |
| `src/components/AdoptionSheltersList.tsx` | ~386 | Lista/mapa de refugios (toggle) |

### Popups y cards de mapa
| Archivo | Descripcion |
|---|---|
| `src/components/maps/MapPinPopup.tsx` | Popup universal en marker click |
| `src/components/maps/MapFilters.tsx` | Dialog de filtros avanzados |
| `src/components/maps/LostPetDetailCard.tsx` | Card detalle mascota perdida |
| `src/components/maps/AdoptionDetailCard.tsx` | Card detalle adopcion |
| `src/components/maps/ShelterDetailCard.tsx` | Card detalle refugio |
| `src/components/maps/ServiceDetailCard.tsx` | Card detalle proveedor |

### Forms con seleccion de ubicacion
| Archivo | Mecanismo actual |
|---|---|
| `src/components/ReportLostPetForm.tsx` | Dropdown de comunas → centroide |
| Formularios de proveedor | Campo comuna manual |

### Hooks con datos de ubicacion
| Hook | Campos lat/lng |
|---|---|
| `useAdoptionShelters.tsx` | latitude, longitude de shelters |
| `useServiceProviders.tsx` | latitude, longitude de providers |
| `useGroomerProfile.tsx` | latitude, longitude de groomers |

---

## Paquetes nuevos a instalar

```bash
npm install @react-google-maps/api
npm uninstall leaflet react-leaflet @types/leaflet
```

Paquete principal: `@react-google-maps/api` (incluye Map, Marker, InfoWindow, Places Autocomplete, Geocoder).

---

## Estrategia de control de costos de Google Maps

### Pricing de Google Maps Platform (2026)

| API | Costo por 1,000 requests | Free tier mensual |
|---|---|---|
| Maps JavaScript API | $7.00 | $200 credito = ~28,500 cargas de mapa |
| Places Autocomplete (session) | $17.00 | $200 credito = ~11,700 sesiones |
| Places Autocomplete (per request) | $2.83 | $200 credito = ~70,600 requests |
| Geocoding API | $5.00 | $200 credito = ~40,000 requests |

Google da **$200 USD gratis/mes** = suficiente para ~10,000-15,000 usuarios activos mensuales.

### Restricciones a implementar

#### 1. API Key restrictions (Google Cloud Console)
```
- Restringir por HTTP referrer: pawfriend.cl/*, localhost:8080/*
- Habilitar SOLO estas APIs:
  - Maps JavaScript API
  - Places API (New)
  - Geocoding API
- Establecer cuota maxima: $50 USD/mes (billing alert + cap)
- Separar key de dev y prod
```

#### 2. Session-based Autocomplete (no per-keystroke)
```tsx
// Usar Autocomplete widget nativo de Google (session-based billing)
// Costo: $0.017 por sesion completa (seleccion), NO por cada tecla
<Autocomplete
  onLoad={onLoad}
  onPlaceChanged={onPlaceChanged}
  options={{
    componentRestrictions: { country: "cl" },  // Solo Chile
    types: ["address"],                         // Solo direcciones
    fields: ["formatted_address", "geometry.location", "address_components"]
  }}
>
  <input placeholder="Escribe tu direccion..." />
</Autocomplete>
```

#### 3. Cachear coordenadas en Supabase
```
- Cuando un usuario selecciona una direccion, guardar lat/lng en DB
- Nunca re-geocodificar una direccion que ya tiene coordenadas
- Para proveedores: guardar al crear/editar perfil, no cada vez que se muestra
```

#### 4. Lazy loading del mapa
```tsx
// Solo cargar Google Maps cuando el usuario navega a /maps o abre un form con mapa
// Usar loadScriptOnlyIfNeeded del @react-google-maps/api
const { isLoaded } = useJsApiLoader({
  id: 'google-map-script',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  libraries: ['places'],  // Solo cargar Places cuando se necesite
});
```

#### 5. Mantener fallback de comunas
```
- Si el usuario no interactua con Places, usar dropdown de comunas (gratis)
- Places Autocomplete es un "upgrade" del input, no reemplaza completamente
- locations.ts se mantiene como fallback
```

#### 6. Rate limiting en frontend
```tsx
// Debounce de 500ms en el autocomplete (evita requests excesivos)
// Minimo 3 caracteres antes de activar busqueda
// Maximo 10 sugerencias por sesion
```

---

## Plan de migracion paso a paso

### Fase 1: Setup y Google Maps Provider

**Archivos nuevos:**
- `src/lib/googleMapsConfig.ts` — Config centralizada (API key, opciones default, estilos)
- `src/components/maps/GoogleMapsProvider.tsx` — Wrapper con `useJsApiLoader`

**Archivos a modificar:**
- `src/main.tsx` — Quitar import de `leaflet.css` y `leafletConfig`
- `package.json` — Swap dependencias
- `.env` — Agregar `VITE_GOOGLE_MAPS_API_KEY`

### Fase 2: Componente de mapa base

**Reemplazar** los usos de `MapContainer` + `TileLayer` + `Marker` + `Popup` por:
- `GoogleMap` + `MarkerF` + `InfoWindowF`
- Mantener la misma logica de filtrado, solo cambiar el renderizado

**Archivos a migrar:**
1. `src/pages/Maps.tsx` — Pagina principal (el mas grande, ~625 lineas)
2. `src/components/LostPetsMap.tsx` — Mapa embebido
3. `src/components/AdoptionSheltersList.tsx` — Mapa de refugios

### Fase 3: Places Autocomplete en formularios

**Reemplazar** el dropdown de comunas por input con autocomplete en:
1. `src/components/ReportLostPetForm.tsx` — Reportar mascota perdida
2. `src/pages/GroomerProfileEdit.tsx` — Perfil de peluquero
3. `src/pages/ProviderProfileEdit.tsx` — Perfil de proveedor
4. Cualquier otro form que pida direccion

**Componente reutilizable:**
```tsx
// src/components/maps/PlacesAutocomplete.tsx
// Input con autocomplete restringido a Chile
// Props: onSelect(place: { address, lat, lng, comuna })
// Restricciones: country="cl", types=["address"], debounce 500ms
```

### Fase 4: Cleanup

- Eliminar `src/lib/leafletConfig.ts`
- Eliminar o reducir `src/lib/locations.ts` (mantener como fallback)
- Desinstalar paquetes Leaflet
- Actualizar `_archive/MIGRATION_GOOGLE_TO_LEAFLET.md` con nota de re-migracion

---

## Variables de entorno necesarias

```env
# .env.local (dev)
VITE_GOOGLE_MAPS_API_KEY=AIza...

# Supabase secrets (para edge functions si se necesita geocoding server-side)
GOOGLE_MAPS_API_KEY=AIza...
```

**Importante**: La key de frontend es distinta a la de backend. La de frontend se restringe por referrer HTTP, la de backend por IP del servidor Supabase.

---

## Estimacion de costos mensuales

| Escenario | Usuarios/mes | Costo estimado |
|---|---|---|
| MVP actual | < 500 | $0 (dentro del free tier de $200) |
| Crecimiento temprano | 500 - 2,000 | $0 - $10 |
| Traccion | 2,000 - 5,000 | $10 - $40 |
| Escala | 5,000 - 15,000 | $40 - $100 |
| Limite sin optimizar | > 15,000 | Evaluar server-side caching |

Con las restricciones propuestas, el costo se mantiene en **$0 hasta ~2,000 usuarios activos mensuales**.

---

## Riesgos y mitigaciones

| Riesgo | Mitigacion |
|---|---|
| API key expuesta en frontend | Restringir por HTTP referrer + quotas |
| Costos inesperados | Billing alert a $20, cap a $50/mes |
| Google cambia pricing | Mantener `locations.ts` como fallback |
| Autocomplete lento | Debounce + minimo 3 chars |
| Usuarios sin JS/Maps bloqueado | Fallback a dropdown de comunas |

---

## Checklist de implementacion

- [ ] Crear proyecto en Google Cloud Console
- [ ] Habilitar Maps JS API + Places API + Geocoding API
- [ ] Crear API key restringida (referrer: pawfriend.cl, localhost)
- [ ] Configurar billing alert ($20) y cap ($50)
- [ ] Instalar `@react-google-maps/api`
- [ ] Crear `GoogleMapsProvider` y `googleMapsConfig.ts`
- [ ] Crear `PlacesAutocomplete` reutilizable
- [ ] Migrar `Maps.tsx` (pagina principal)
- [ ] Migrar `LostPetsMap.tsx`
- [ ] Migrar `AdoptionSheltersList.tsx`
- [ ] Integrar Places en formularios de reporte y perfil
- [ ] Desinstalar Leaflet y limpiar imports
- [ ] Testing en dev con key restringida
- [ ] Deploy a prod con key de produccion
- [ ] Verificar billing despues de 1 semana
