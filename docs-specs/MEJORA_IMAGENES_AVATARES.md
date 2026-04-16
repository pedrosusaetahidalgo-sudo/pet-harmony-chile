# Mejora integral de imagenes, avatares y fotos de mascotas

> **Estado**: Pendiente de ejecucion
> **Prioridad**: Media-alta (impacto visual directo en toda la app)
> **Fecha**: 2026-04-15

---

## 1. Problema actual

### 1.1. Avatares de usuario (DiceBear "thumbs")

Los avatares predeterminados usan el estilo **DiceBear `thumbs`** — figuras con ojos grandes y expresiones que parecen de Halloween o monstruos. No transmiten confianza ni calidez para una app de salud de mascotas.

**Estado actual**:
- Se generan via `https://api.dicebear.com/9.x/thumbs/svg?seed=...`
- 10 seeds fijos (Luna, Rocky, Simba, etc.) + 6 colores
- **No se puede subir foto propia** — solo elegir entre avatares generados
- Almacenado en `profiles.avatar_url` como URL de DiceBear

### 1.2. Fotos de mascotas

- **Sin compresion client-side**: se suben a tamano completo (hasta 10 MB)
- **Sin validacion de dimensiones**: una foto de 200x200 y una de 5000x5000 se tratan igual
- **Sin redimensionado**: el navegador hace el trabajo pesado via `object-cover`
- **Fallbacks inconsistentes**: PetCard usa Unsplash, PetIdentityCard usa icono PawPrint

### 1.3. Fotos de proveedores/vets

- **Bucket separado** (`avatars`) con limite 5 MB, solo JPG/PNG
- Sin compresion ni redimensionado
- Fallback: icono Stethoscope

### 1.4. Imagenes del feed

- Hasta 10 imagenes por post, 10 MB cada una
- Sin compresion — feed pesado en mobile
- Aceptan WebP y GIF (correcto)

---

## 2. Especificacion de formato estandar

### 2.1. Requisitos minimos para subida

| Tipo de imagen | Dimensiones minimas | Dimensiones recomendadas | Aspect ratio | Formatos aceptados | Peso maximo |
|---|---|---|---|---|---|
| Avatar usuario | 200x200 px | 400x400 px | 1:1 (cuadrado) | JPG, PNG, WebP | 5 MB (pre-compresion) |
| Foto mascota | 300x300 px | 800x800 px | 1:1 (cuadrado) | JPG, PNG, WebP | 10 MB (pre-compresion) |
| Avatar vet/provider | 200x200 px | 400x400 px | 1:1 (cuadrado) | JPG, PNG, WebP | 5 MB (pre-compresion) |
| Foto feed/post | 400x300 px | 1200x900 px | Libre | JPG, PNG, WebP, GIF | 10 MB (pre-compresion) |

### 2.2. Compresion y redimensionado client-side (ANTES de subir)

Implementar un helper `compressImage()` en `src/lib/imageUtils.ts`:

```
Entrada: File original del usuario
Proceso:
  1. Leer imagen con createImageBitmap() o Image + Canvas
  2. Validar dimensiones minimas → rechazar si no cumple, con toast explicativo
  3. Redimensionar al maximo almacenado:
     - Avatares: 512x512 px max
     - Fotos mascota: 1200x1200 px max
     - Fotos feed: 1600px lado largo max (mantener aspect ratio)
  4. Comprimir a WebP con quality 0.82
     - Fallback a JPEG quality 0.85 si el navegador no soporta WebP canvas
  5. Si resultado > 500 KB, reducir quality iterativamente (0.75, 0.65)
Salida: Blob comprimido + metadata (width, height, size, format)
```

**Resultado esperado**: imagenes de ~100-400 KB en vez de 2-10 MB actuales.

### 2.3. Formato de almacenamiento

| Bucket | Formato almacenado | Naming pattern |
|---|---|---|
| `pet-photos` | WebP (fallback JPG) | `{user_id}/{pet_id}/{timestamp}.webp` |
| `avatars` | WebP (fallback JPG) | `{user_id}/avatar-{timestamp}.webp` |
| `medical-documents` | Original (sin comprimir) | Sin cambio — documentos medicos necesitan fidelidad |

---

## 3. Avatares de usuario: nuevo sistema

### 3.1. Cambiar estilo DiceBear predeterminado

Reemplazar el estilo `thumbs` (monstruos/Halloween) por uno de estos estilos mas amigables:

**Opcion recomendada**: `adventurer-neutral`
- Rostros humanos estilizados, amigables, sin genero marcado
- URL: `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=...`

**Alternativas aceptables**:
- `lorelei` — ilustracion minimalista de rostros
- `notionists` — estilo Notion, profesional y limpio
- `bottts-neutral` — robots amigables (si se quiere algo mas ludico)

### 3.2. Permitir subir foto propia

Agregar opcion de **subir foto real** ademas de elegir avatar generado:

**Flujo en `EditProfileDrawer.tsx`**:
```
[Pestana 1: "Elige un avatar"]     [Pestana 2: "Sube tu foto"]
  - Grid de avatares generados        - Dropzone / boton "Subir foto"
  - Selector de color                  - Preview circular con crop
  - Preview en tiempo real             - Boton "Guardar"
```

**Detalles del upload de foto**:
- Bucket: `avatars` (reutilizar el existente)
- Path: `{user_id}/avatar-{timestamp}.webp`
- Compresion via `compressImage()` → 512x512 max, WebP
- Upsert: true (sobreescribir avatar anterior)
- Al guardar, actualizar `profiles.avatar_url` con la URL publica
- **Crop circular**: usar una libreria liviana como `react-easy-crop` para que el usuario ajuste el encuadre antes de subir

### 3.3. Paleta de colores para avatares generados

Actualizar la paleta actual (6 colores) a tonos mas calidos y alineados con la marca Paw Friend:

| Color | Hex fondo | Hex forma | Nombre UI |
|---|---|---|---|
| Coral | `ffc2a1` | `f28c6e` | Coral |
| Lavanda | `c4b5fd` | `8b5cf6` | Lavanda |
| Menta | `a7f3d0` | `34d399` | Menta |
| Celeste | `bfdbfe` | `60a5fa` | Celeste |
| Durazno | `fde68a` | `f59e0b` | Durazno |
| Rosa | `fecdd3` | `fb7185` | Rosa |

### 3.4. Seeds de avatar (ampliar)

Mantener los 10 seeds actuales + agregar 10 mas para mayor variedad:
- Actuales: Luna, Rocky, Simba, Nala, Max, Miso, Buddy, Pelusa, Canela, Toby
- Nuevos: Coco, Thor, Kira, Zeus, Lola, Bruno, Miel, Otto, Indie, Chloe

---

## 4. Fotos de mascotas: mejora integral

### 4.1. Upload mejorado en AddPet y EditPet

```
Flujo actual:
  [Seleccionar archivo] → upload directo a Supabase → guardar URL

Flujo nuevo:
  [Seleccionar archivo]
    → validar dimensiones minimas (300x300)
    → mostrar preview con crop cuadrado (1:1)
    → comprimir a 1200x1200 max, WebP
    → upload a Supabase
    → guardar URL
```

### 4.2. Sincronizacion de foto de mascota

La foto de la mascota debe ser **una sola fuente de verdad** (`pets.photo_url`) y mostrarse consistente en:

| Ubicacion | Componente | Cambio necesario |
|---|---|---|
| Dashboard home | `PetCard.tsx` | Usar `photo_url` directo, eliminar fallback Unsplash |
| Perfil usuario | `PetIdentityCard.tsx` | Idem |
| Ficha clinica | `PetClinicalRecord/` | Verificar que usa `photo_url` |
| Feed posts | `FeedPostCard.tsx` | Si el post referencia mascota, mostrar su foto actualizada |
| Paw Cards | `PawCardDisplay.tsx` | Usar `photo_url` de la mascota |
| Calendario | Eventos con icono mascota | Usar `photo_url` |
| Sidebar/Header | Si se muestra mascota activa | Usar `photo_url` |

**Regla**: si el usuario cambia la foto de su mascota, debe actualizarse en **todos** estos puntos automaticamente (ya deberia funcionar si todos leen de `pets.photo_url` via react-query, pero verificar que no haya URLs cacheadas en otros estados).

### 4.3. Fallback unificado

Eliminar fallbacks inconsistentes. Nuevo fallback universal:

```
Prioridad:
  1. photo_url de la mascota (real)
  2. Icono generado por especie + color:
     - Perro: icono Dog en circulo con fondo amber-100
     - Gato: icono Cat en circulo con fondo purple-100
     - Otro: icono PawPrint en circulo con fondo slate-100
```

**Eliminar**: URLs de Unsplash como fallback (dependencia externa, imagenes genericas).

---

## 5. Display y CSS: reglas de presentacion

### 5.1. Componente `<OptimizedImage>`

Crear un componente wrapper que reemplace usos directos de `<img>`:

```
Props:
  - src: string (URL de la imagen)
  - alt: string
  - size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' (predefinidos)
  - shape: 'circle' | 'square' | 'rounded' (default: 'rounded')
  - fallback: ReactNode (icono o iniciales)
  - className?: string

Comportamiento:
  - Lazy loading nativo (loading="lazy")
  - object-fit: cover (siempre)
  - Transicion de opacidad al cargar (fade-in)
  - Skeleton pulse mientras carga
  - onError → mostrar fallback
  - Tamanos predefinidos:
    xs: 32x32 (h-8 w-8)
    sm: 40x40 (h-10 w-10)
    md: 64x64 (h-16 w-16)
    lg: 96x96 (h-24 w-24)
    xl: 128x128 (h-32 w-32)
```

### 5.2. Reglas CSS uniformes

Todas las imagenes de avatar/mascota deben usar:
```css
.pf-image {
  object-fit: cover;        /* Nunca deformado */
  object-position: center;  /* Centrado en el sujeto */
  aspect-ratio: 1 / 1;      /* Cuadrado por defecto */
  overflow: hidden;          /* Sin desborde */
  background: var(--muted);  /* Fondo mientras carga */
}
```

---

## 6. Archivos a modificar

### Nuevos archivos

| Archivo | Contenido |
|---|---|
| `src/lib/imageUtils.ts` | `compressImage()`, `validateImageDimensions()`, `generateFallbackUrl()` |
| `src/components/OptimizedImage.tsx` | Componente wrapper de imagen optimizada |

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/profile/EditProfileDrawer.tsx` | Cambiar estilo DiceBear + agregar tab upload foto real + crop |
| `src/components/ui/avatar.tsx` | Integrar `OptimizedImage` como base |
| `src/components/PetCard.tsx` | Eliminar fallback Unsplash, usar fallback unificado |
| `src/components/profile/PetIdentityCard.tsx` | Usar fallback unificado |
| `src/components/LazyImage.tsx` | Refactorizar para usar logica compartida con `OptimizedImage` |
| `src/pages/AddPet.tsx` | Agregar crop + compresion antes de upload |
| `src/pages/EditPet.tsx` | Idem |
| `src/hooks/useProviderProfile.tsx` | Usar `compressImage()` en `uploadProviderAvatar` |
| `src/components/feed/FeedImageUploader.tsx` | Agregar compresion antes de upload |
| `src/components/feed/FeedCreatePost.tsx` | Integrar compresion |
| `src/components/CreatePost.tsx` | Integrar compresion |
| `src/components/CreateAdoptionPost.tsx` | Integrar compresion |

### Dependencia nueva

| Paquete | Uso | Tamano |
|---|---|---|
| `react-easy-crop` | Crop circular/cuadrado para avatares y fotos mascota | ~12 KB gzip |

> **Nota**: la compresion se hace con Canvas API nativa del navegador — no requiere libreria adicional.

---

## 7. Plan de ejecucion

### Fase 1 — Infraestructura (sin cambios visuales)
1. Crear `src/lib/imageUtils.ts` con `compressImage()` y `validateImageDimensions()`
2. Crear `src/components/OptimizedImage.tsx`
3. Instalar `react-easy-crop`

### Fase 2 — Avatares de usuario
4. Cambiar estilo DiceBear de `thumbs` a `adventurer-neutral` en `EditProfileDrawer.tsx`
5. Actualizar paleta de colores y seeds
6. Agregar tab "Sube tu foto" con crop circular + compresion + upload al bucket `avatars`

### Fase 3 — Fotos de mascotas
7. Integrar crop cuadrado + compresion en `AddPet.tsx` y `EditPet.tsx`
8. Unificar fallback (eliminar Unsplash) en `PetCard.tsx` y `PetIdentityCard.tsx`
9. Verificar sincronizacion de `photo_url` en todos los componentes que muestran mascotas

### Fase 4 — Feed y posts
10. Integrar compresion en `FeedImageUploader.tsx`, `CreatePost.tsx`, `CreateAdoptionPost.tsx`

### Fase 5 — Provider
11. Integrar compresion en `uploadProviderAvatar` de `useProviderProfile.tsx`

### Fase 6 — Reemplazo progresivo
12. Migrar usos de `<img>` y `<LazyImage>` a `<OptimizedImage>` donde aplique
13. QA visual en mobile (Capacitor) y desktop

---

## 8. Compatibilidad

| Plataforma | Canvas WebP | createImageBitmap | react-easy-crop |
|---|---|---|---|
| Chrome 90+ | Si | Si | Si |
| Firefox 96+ | Si | Si | Si |
| Safari 16+ | Si | Si | Si |
| Safari iOS 16+ | Si | Si | Si |
| Chrome Android | Si | Si | Si |
| WebView Capacitor | Si | Si | Si |

**Fallback**: si `canvas.toBlob('image/webp')` no es soportado, usar `image/jpeg` quality 0.85.

---

## 9. Metricas de exito

| Metrica | Antes | Despues (esperado) |
|---|---|---|
| Peso promedio foto mascota subida | 2-8 MB | 100-400 KB |
| Peso promedio avatar subido | N/A (solo DiceBear) | 30-80 KB |
| Peso promedio imagen feed | 2-10 MB | 150-500 KB |
| Fallbacks usando URLs externas (Unsplash) | Si | No |
| Consistencia visual de avatares | Estilo Halloween | Calido y profesional |
| Usuarios pueden subir foto propia | No | Si |
| Crop antes de subir | No | Si |

---

## 10. UX Copy (espanol chileno)

| Contexto | Texto |
|---|---|
| Tab avatar generado | "Elige un avatar" |
| Tab foto propia | "Sube tu foto" |
| Boton upload | "Seleccionar foto" |
| Crop dialog titulo | "Ajusta tu foto" |
| Crop dialog confirmar | "Guardar" |
| Error foto muy chica | "La foto debe tener al menos {min}x{min} pixeles" |
| Error formato | "Solo se aceptan imagenes JPG, PNG o WebP" |
| Error peso | "La imagen no puede pesar mas de {max} MB" |
| Toast exito avatar | "Avatar actualizado" |
| Toast exito mascota | "Foto de {nombre} actualizada" |
| Placeholder sin foto mascota | "Agrega una foto de {nombre}" |
