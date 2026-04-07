# MIGRACIÓN GOOGLE MAPS → LEAFLET

**Fecha**: 2026-04-08
**Motivo**: Cobro inesperado en Google Maps Platform por uso descontrolado de Places API.
**Resultado**: La app ya no usa Google Maps. La API key de Maps puede eliminarse.

---

## Resumen

| Métrica | Antes | Después |
|---|---|---|
| Componentes con `@react-google-maps/api` | 4 | **0** ✅ |
| Edge functions de Maps | 1 (`get-google-maps-key`) | **0** ✅ |
| Llamadas a Places API | Sí (`PlacesAutocomplete.tsx`) | **0** ✅ |
| Dependencias npm de Google Maps | 1 | **0** ✅ |
| Variable `VITE_GOOGLE_MAPS_API_KEY` en código | Sí (`googleCalendar.ts` la reusaba) | **No** ✅ |
| Build | verde | verde ✅ |

---

## Inventario inicial (antes de la migración)

### Archivos que usaban Google Maps directo
- `src/components/GoogleMap.tsx`
- `src/components/GoogleMapsLoader.tsx`
- `src/components/GoogleMapsProvider.tsx`
- `src/components/PlacesAutocomplete.tsx`
- `src/components/LostPetsMap.tsx`
- `src/components/AdoptionSheltersList.tsx`
- `src/components/ReportLostPetForm.tsx` (consumía PlacesAutocomplete)
- `src/components/EnhancedBookingDialog.tsx` (consumía PlacesAutocomplete)
- `src/hooks/useGoogleMapsKey.tsx`
- `src/lib/googlePlaces.ts`
- `supabase/functions/get-google-maps-key/`

### Página `/maps`
- `src/pages/Maps.tsx` — **ya estaba migrada a Leaflet** en un turno anterior. Sin cambios en este pase.

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/main.tsx` | Importa `leaflet/dist/leaflet.css` y `./lib/leafletConfig` (fix iconos Vite + setup global) |
| `src/components/LostPetsMap.tsx` | Reescrito completamente con `react-leaflet` (`MapContainer`, `TileLayer`, `Marker`, `Popup`). Iconos custom rojo (perdidas) / verde (encontradas). |
| `src/components/AdoptionSheltersList.tsx` | Reemplazado el bloque del mapa: `GoogleMap` + `MarkerClusterer` → `MapContainer` con markers + `CircleMarker` para userLocation. Eliminado `getMarkerIcon` con `google.maps.Point`. |
| `src/components/ReportLostPetForm.tsx` | `PlacesAutocomplete` + `GoogleMapsLoader` → `<Select>` con `COMUNAS_SANTIAGO`. Helper `handlePlaceSelect` → `handleComunaSelect` que usa `getComunaCoords` para guardar lat/lng del centroide. |
| `src/components/EnhancedBookingDialog.tsx` | Mismo patrón: `PlacesAutocomplete` → `<Select>` con comunas. |
| `src/lib/googleCalendar.ts` | Renombrado `GOOGLE_MAPS_API_KEY` → `GOOGLE_CALENDAR_API_KEY` con `undefined` por default. **Calendar OAuth quedó inerte** (ya estaba marcado como "no implementado" en el audit). |

## Archivos creados

| Archivo | Propósito |
|---|---|
| `src/lib/leafletConfig.ts` | Setup global de iconos (fix bug Vite), 3 iconos custom (`pawFriendIcon`, `lostPetIcon`, `shelterIcon`), constantes `SANTIAGO_CENTER`, `OSM_TILE_URL`, `OSM_ATTRIBUTION` |
| `src/lib/locations.ts` | Catálogo de 32 comunas RM con centroides (`COMUNAS_SANTIAGO`, `COMUNA_COORDS`, `getComunaCoords`) |

## Archivos eliminados

- `src/components/GoogleMap.tsx`
- `src/components/GoogleMapsLoader.tsx`
- `src/components/GoogleMapsProvider.tsx`
- `src/components/PlacesAutocomplete.tsx`
- `src/hooks/useGoogleMapsKey.tsx`
- `src/lib/googlePlaces.ts`
- `supabase/functions/get-google-maps-key/` (carpeta entera)

**Total**: 6 archivos + 1 carpeta de edge function eliminados.

## Dependencias eliminadas

```json
"@react-google-maps/api": "^2.20.7"   // ❌ removed
```

`leaflet` y `react-leaflet` ya estaban instalados. `@types/leaflet` también.

## Variables de entorno a eliminar

| Variable | Dónde estaba | Estado |
|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Código (`googleCalendar.ts`, `GoogleMap.tsx`, `GoogleMapsProvider.tsx`, `PlacesAutocomplete.tsx`, `googlePlaces.ts`) | ✅ **Sin referencias en código** |

---

## ⚠️ Acciones manuales pendientes para Pedro

### 1. Eliminar Edge Function en Supabase Dashboard
La función `get-google-maps-key` ya no está en el repo, pero **sigue desplegada en el servidor de Supabase**. Eliminala:

1. Ir a https://app.supabase.com/project/gwailbjlvevkhwcrovfd/functions
2. Buscar `get-google-maps-key`
3. Click en los 3 puntos → **Delete**
4. Confirmar

### 2. Eliminar variable de entorno en deploy
1. **GitHub Pages / Vercel / donde deployes**: Settings → Environment Variables → eliminar `VITE_GOOGLE_MAPS_API_KEY`
2. **GitHub Secrets**: Settings → Secrets and variables → Actions → eliminar si está
3. **`.env.local`** local: borrar la línea si existe

### 3. Eliminar la API key en Google Cloud Console
1. Ir a https://console.cloud.google.com
2. APIs & Services → **Credentials**
3. Encontrar la API key de Maps
4. **Eliminarla completamente** (no solo deshabilitarla)
5. (Opcional) Deshabilitar las APIs ya no usadas:
   - Maps JavaScript API
   - Places API
   - Geocoding API

### 4. Verificar que NO hay más cobros
1. Google Cloud → **Billing → Reports**
2. Filtrar por servicio "Maps Platform"
3. Verificar que el uso es 0 o muy bajo
4. Configurar **budget alert en $1 USD** para confirmar que no hay tráfico residual

### 5. Push y deploy
```powershell
git add .
git commit -m "feat: complete migration from Google Maps to Leaflet - eliminates paid API dependency"
git push
```

Después esperá 1-2 min y verificá:
- `pawfriend.cl/maps` carga con OpenStreetMap (no Google)
- `pawfriend.cl/adoption` → tab "Refugios" → mapa con OpenStreetMap
- Reportar mascota perdida → form con dropdown de comunas (no autocomplete de direcciones)

---

## Verificación post-migración

### Comandos de verificación

```bash
# 1. No quedan refs a Google Maps en el código
grep -rn "googleapis\|GoogleMap\|google\.maps\|@react-google-maps\|@googlemaps" src/
# Esperado: solo 2 matches en googleCalendar.ts (Calendar API, no Maps)

# 2. No queda VITE_GOOGLE_MAPS_API_KEY
grep -rn "VITE_GOOGLE_MAPS\|GOOGLE_MAPS_API_KEY" src/
# Esperado: 0 matches

# 3. Edge function eliminada
ls supabase/functions/get-google-maps-key/ 2>/dev/null
# Esperado: directorio no encontrado

# 4. Dependencias limpias
grep -i "google.*maps\|googlemaps" package.json
# Esperado: 0 matches

# 5. Build limpio
npm run build
# Esperado: ✓ built sin errores
```

### Resultados (verificados al cerrar la migración)

| Check | Resultado |
|---|---|
| `googleapis\|GoogleMap\|google\.maps` en src/ | **2 matches** (ambos en `googleCalendar.ts`, son llamadas a Calendar API, no Maps) |
| `VITE_GOOGLE_MAPS_API_KEY` en src/ | **0** ✅ |
| `supabase/functions/get-google-maps-key/` | **no existe** ✅ |
| `@react-google-maps/api` en `package.json` | **no existe** ✅ |
| `npm run build` | **verde** ✅ |
| Bundle final | 500kB index + 96kB vendor (gzipped 144kB total) |

---

## Casos especiales

### Google Calendar (no migrado, no relacionado)
`src/lib/googleCalendar.ts` sigue existiendo pero con `GOOGLE_CALENDAR_API_KEY = undefined`. Esto significa:
- La función `isAvailable()` retorna `false`
- Los métodos de sync nunca se ejecutan en runtime
- El feature de sync con Google Calendar está **inerte** hasta que se implemente OAuth real con su propia API key separada

**No bloquea la migración de Maps**: Calendar API es un servicio distinto en Google Cloud Console y tiene cuota gratuita generosa.

### `@codetrix-studio/capacitor-google-auth` (no migrado, no relacionado)
Este paquete es para **Google OAuth login** (Sign in with Google), no para Maps. Se mantiene intacto.

---

## Diferencias de UX entre Google Places Autocomplete y dropdown de comunas

**Antes** (Google Places):
- Usuario escribía "Av. Apoquindo 4500"
- Autocomplete sugería direcciones reales
- Se guardaba dirección exacta + lat/lng exactos

**Ahora** (dropdown de comunas):
- Usuario elige "Las Condes" del dropdown
- Se guarda el nombre de la comuna + lat/lng del centroide
- **Pérdida**: precisión de la dirección exacta
- **Ganancia**: cero costo, cero llamadas a API externa, dato suficiente para directorio de servicios

**Recomendación**: si en el futuro quieren dirección exacta, agregar un campo `<Input>` de texto libre adicional ("Detalle de la dirección — opcional") sin geocoding.

---

## Cierre del ciclo

Después de los pasos manuales del paso "⚠️ Acciones manuales pendientes para Pedro" arriba, la app queda **100% libre de costos de Google Maps**. La migración técnica está completa.
