# Revision: /provider/profile-edit — "Mi perfil pro"

> Pagina auditada: `https://pawfriend.cl/provider/profile-edit`
> Archivo: `src/pages/ProviderProfileEdit.tsx` (514 lineas)
> Sidebar label: "Mi perfil pro" (seccion "Profesional")
> Fecha: 2026-04-11

---

## 0. Resumen ejecutivo

La pagina `/provider/profile-edit` es un formulario largo de edicion de perfil profesional para veterinarios/proveedores de servicios. Funciona, pero tiene problemas de **identidad, nomenclatura, UX y jerarquia visual** que confunden al usuario sobre que es, para quien es y por que deberia completarlo.

---

## 1. Problemas detectados

### 1.1. Desconexion entre nombre del sidebar y contenido

| Donde | Dice | Deberia decir |
|---|---|---|
| Sidebar | "Mi perfil pro" | Ambiguo. "Pro" no comunica nada. Suena a upgrade de plan, no a edicion de perfil |
| PageHeader title | "Mi perfil profesional" | Mejor pero generico |
| PageHeader subtitle | "Completa tu informacion para aparecer en el directorio publico." | Este es el unico lugar que explica el *objetivo* real |

**Problema de fondo:** el usuario ve "Mi perfil pro" en el sidebar y no sabe si es:
- Su perfil personal con badge premium
- Un upsell a plan Pro
- El perfil que ven los duenos de mascotas en el directorio

La pagina en realidad es: **"Edita como te ven los duenos en pawfriend.cl/veterinarios"**. Eso no queda claro en ningun momento.

### 1.2. No queda claro que es para veterinarios/proveedores

- La seccion del sidebar se llama "Profesional", no "Veterinario" ni "Proveedor"
- El titulo dice "Mi perfil profesional" — podria ser de cualquier profesional
- Solo pistas indirectas revelan que es para vets: el icono Stethoscope, el campo "N Colmevet", las especialidades veterinarias
- Un usuario que acaba de registrarse como proveedor no tiene confirmacion inmediata de que esta en el lugar correcto

### 1.3. Formulario demasiado largo y sin prioridad visual

La pagina es un scroll vertical de **6 cards + MisPreciosEditor + sticky save bar**, sin separacion clara de que es obligatorio vs opcional, ni indicacion de progreso paso a paso.

**Orden actual:**
1. Completitud del perfil (progress bar)
2. Informacion profesional (avatar, nombre, tipo, bio, experiencia, colmevet, email, telefono) — **8 campos en 1 card**
3. Especialidades (multi-select)
4. Zonas de atencion (comuna base + comunas atendidas)
5. Precios (precio minimo)
6. Visibilidad publica (toggle)
7. MisPreciosEditor (tabla de precios por servicio)
8. Sticky save bar

**Problemas especificos:**
- Card 2 tiene 8 campos. Es abrumador para un vet que quiere completar rapido su perfil
- No hay jerarquia de importancia: el campo "N Colmevet" tiene el mismo peso visual que "Nombre"
- La barra de progreso dice "Te falta: X, Y, Z" pero no linkea a los campos faltantes
- MisPreciosEditor (seccion 7) aparece despues de "Visibilidad publica" (seccion 6), rompiendo el flujo logico — primero deberia completar precios, luego decidir si ser visible

### 1.4. Confusion entre precios genericos y MisPreciosEditor

Hay **2 secciones de precios** que compiten:
- **Card 4 "Precios"**: un solo campo "Precio minimo (CLP)" → aparece como "Desde $X" en el perfil publico
- **MisPreciosEditor**: tabla detallada de precios por servicio (consulta, vacuna, cirugia, etc.)

El usuario no entiende la relacion entre ambos. El "precio minimo" deberia calcularse automaticamente del precio mas bajo en MisPreciosEditor, o eliminarse como campo manual.

### 1.5. Boton "Ver como me ven los duenos" escondido

El boton mas valioso de la pagina — previsualizar el perfil publico — esta en el header como un boton `outline` pequeno. Es un diferenciador unico de Paw Friend vs la competencia y esta tratado como un detalle secundario.

### 1.6. UX mobile pobre

- 6+ cards apiladas = scroll interminable en mobile
- Los toggles de especialidades y comunas son listas largas de badges que desbordan en pantallas pequenas
- El sticky save bar funciona pero compite visualmente con el contenido
- No hay manera de "saltar" a una seccion especifica

### 1.7. Visual generico — look shadcn default

- Cards blancas con borde gris, titulos en `text-lg`, sin color ni iconografia
- El unico toque de marca es el color purple en badges activos y en la progress bar
- La pagina parece un formulario administrativo, no la herramienta que le da presencia online a un vet

---

## 2. Objetivo real de la pagina

La pagina tiene un objetivo unico que hoy no esta comunicado con claridad:

> **Permitir que un veterinario/proveedor construya y gestione su perfil publico en el directorio de Paw Friend, para que duenos de mascotas lo encuentren y lo contacten.**

Todo lo que no contribuya a ese objetivo sobra o debe reordenarse.

---

## 3. Propuesta de rediseno

### 3.1. Renombrar

| Donde | Actual | Propuesto |
|---|---|---|
| Sidebar seccion | "Profesional" | "Mi consulta" |
| Sidebar link | "Mi perfil pro" | "Perfil publico" |
| Ruta | `/provider/profile-edit` | Mantener (no romper URLs) |
| PageHeader title | "Mi perfil profesional" | "Tu perfil en el directorio" |
| PageHeader subtitle | "Completa tu informacion..." | "Asi te ven los duenos de mascotas en pawfriend.cl/veterinarios" |

### 3.2. Elevar la preview del perfil publico

**Cambio critico:** agregar una **preview card en vivo** en la parte superior de la pagina (despues de la progress bar), que muestre en tiempo real como se vera el perfil en el directorio. Esto:
- Da feedback inmediato al vet mientras edita
- Justifica llenar cada campo ("si dejo la bio vacia, mi perfil se ve incompleto")
- Hace innecesario el boton "Ver como me ven los duenos" como accion separada

La preview debe mostrar:
- Avatar (o placeholder)
- Nombre
- Especialidades como badges
- Comuna
- Rating (o "Sin resenas aun")
- "Desde $X"
- Bio truncada

### 3.3. Reorganizar el formulario en 3 bloques logicos

En vez de 6 cards separadas, agrupar en **3 bloques con titulos claros**:

**Bloque A — "Informacion basica" (lo minimo para existir)**
- Avatar + Nombre + Tipo de atencion
- Bio profesional
- Estos 4 campos son el nucleo. Sin ellos no hay perfil

**Bloque B — "Detalles profesionales" (lo que genera confianza)**
- Experiencia (anos)
- N Colmevet
- Especialidades (multi-select)
- Precios por servicio (MisPreciosEditor integrado aqui, no separado)
- Contacto publico (email, telefono)

**Bloque C — "Donde te encuentran" (ubicacion + visibilidad)**
- Comuna base
- Comunas que atiendes
- Toggle de visibilidad publica (con la preview card al lado mostrando el resultado)

### 3.4. Eliminar la card "Precios" (precio minimo manual)

El "Desde $X" deberia calcularse automaticamente del precio mas bajo ingresado en MisPreciosEditor. No tiene sentido que el vet escriba un numero suelto que puede contradecir su tabla de precios.

### 3.5. Mejorar la progress bar

Cambiar de "Te falta: X, Y, Z" a una **checklist visual** con items clickeables que hagan scroll al campo correspondiente:

```
[x] Nombre          [ ] Bio (min 50 caracteres)
[x] Avatar          [ ] Al menos 1 especialidad
[ ] Comuna base     [x] Precio minimo
```

### 3.6. Mejorar el selector de comunas

El selector actual muestra **todas las comunas de Santiago como badges clicables** — son ~37 comunas en una nube de tags. En mobile es inusable.

Propuesta: reemplazar por un **combobox con busqueda** + chips de comunas seleccionadas debajo. Patron estandar de multi-select con typeahead.

### 3.7. Agregar indicadores visuales de campos requeridos vs opcionales

Hoy solo "Nombre" y "Bio" tienen asterisco `*`. Los otros campos obligatorios para llegar al 80% (avatar, especialidades, zonas, precio) no tienen ningun indicador. El vet no sabe que campos completar primero.

Propuesta: marcar visualmente los campos que contribuyen al score de completitud, con un indicador tipo "Requerido para el directorio".

### 3.8. Visual refresh

| Aspecto | Actual | Propuesto |
|---|---|---|
| Cards | Blancas con borde gris | Fondo `neutral-50` sin borde, shadow sutil, `rounded-2xl` |
| Titulos de card | `text-lg` gris | `text-xl font-semibold` con icono a la izquierda |
| Badges especialidades | Purple solid vs white con borde | Mantener pero agregar icono por especialidad |
| Progress bar | Barra generica purple | Barra con gradiente + porcentaje grande |
| Boton guardar | Boton purple estandar | Boton mas grande, sticky, con feedback de estado |
| Preview del perfil | No existe | Card prominente arriba con vista previa en vivo |

---

## 4. Implementacion paso a paso

### Fase 1 — Renombrar y reordenar (rapido, alto impacto)

1. **Cambiar labels del sidebar** en `src/components/AppSidebar.tsx`:
   - Seccion: "Profesional" → "Mi consulta"
   - Link: "Mi perfil pro" → "Perfil publico"

2. **Cambiar titulo y subtitulo** en `src/pages/ProviderProfileEdit.tsx`:
   - Title: "Tu perfil en el directorio"
   - Subtitle: "Asi te ven los duenos de mascotas en pawfriend.cl/veterinarios"

3. **Reordenar cards**: mover MisPreciosEditor despues de Especialidades y antes de Visibilidad

4. **Eliminar Card 4 "Precios"** (precio minimo manual), calcular automaticamente desde MisPreciosEditor

**Archivos a modificar:**
- `src/components/AppSidebar.tsx` (lineas 190, 210)
- `src/pages/ProviderProfileEdit.tsx` (lineas 157-159, 434-455, 489-490)
- `src/hooks/useProviderProfile.tsx` (logica de `price_from` auto-calculado)

### Fase 2 — Preview card en vivo

1. **Crear componente** `src/components/provider/ProfilePreviewCard.tsx`
   - Recibe `form: ProviderProfileForm` como prop
   - Renderiza una mini-card identica a como se ve en el directorio (`/veterinarios`)
   - Se actualiza en tiempo real mientras el vet edita

2. **Insertar** despues de la progress bar, antes del primer bloque de formulario

3. **Mantener el boton "Ver como me ven los duenos"** en el header como link al perfil publico real, pero ahora es complementario, no la unica manera de previsualizar

**Archivos a crear:**
- `src/components/provider/ProfilePreviewCard.tsx`

**Archivos a modificar:**
- `src/pages/ProviderProfileEdit.tsx`

### Fase 3 — Mejorar UX del formulario

1. **Reemplazar nube de comunas** por combobox multi-select con busqueda
   - Usar un componente basado en Popover + Command de shadcn/ui (ya disponibles)
   - Comunas seleccionadas se muestran como chips removibles debajo

2. **Checklist de completitud clickeable** que reemplaza el texto "Te falta: X, Y, Z"
   - Cada item es un link que hace scroll suave al campo correspondiente
   - Items completados se muestran tachados o con check verde

3. **Indicadores "Requerido para directorio"** en campos que suman al score
   - Pequeno badge o texto bajo el label del campo

**Archivos a modificar:**
- `src/pages/ProviderProfileEdit.tsx`
- `src/hooks/useProviderProfile.tsx` (refactorear `calculateProfileCompleteness` para exponer IDs de campos)

### Fase 4 — Visual refresh

1. **Aplicar nuevo sistema de cards** (sin borde, shadow sutil, `rounded-2xl`)
2. **Agregar iconos** a titulos de bloques (Stethoscope, MapPin, DollarSign, Eye)
3. **Mejorar progress bar** con gradiente y porcentaje grande
4. **Mejorar sticky save bar** — mas grande, con indicador de cambios sin guardar
5. **Responsive polish** — verificar mobile, reducir padding en cards, colapsar grids

**Archivos a modificar:**
- `src/pages/ProviderProfileEdit.tsx`

---

## 5. Validacion

### Desktop
- [ ] Sidebar dice "Perfil publico" y al clickear llega a la pagina correcta
- [ ] Preview card se actualiza en tiempo real al editar campos
- [ ] Formulario organizado en 3 bloques logicos claros
- [ ] No hay 2 secciones de precios separadas
- [ ] Checklist de completitud es clickeable
- [ ] Boton "Ver como me ven los duenos" funciona y abre en nueva pestana

### Mobile
- [ ] Formulario no se siente interminable (bloques colapsables o tabs)
- [ ] Selector de comunas es usable (combobox, no nube de 37 badges)
- [ ] Sticky save bar no tapa contenido
- [ ] Preview card no ocupa demasiado viewport
- [ ] Tap targets minimo 44x44px en toggles de especialidades

### Funcional
- [ ] Guardar perfil funciona correctamente (upsert)
- [ ] Precio minimo se calcula automaticamente de MisPreciosEditor
- [ ] Toggle de visibilidad se bloquea correctamente si < 80%
- [ ] VetOnboardingWizard sigue apareciendo para usuarios sin perfil
- [ ] No se rompen rutas existentes

### Copy chileno
- [ ] Tuteo chileno en todo (tu, tienes, puedes)
- [ ] "Comuna" (no distrito/barrio)
- [ ] "Ficha clinica" donde aplique
- [ ] "Paw Friend" con mayusculas

---

## 6. Archivos involucrados

| Archivo | Cambios |
|---|---|
| `src/pages/ProviderProfileEdit.tsx` | Renombrar, reordenar, eliminar card precios, integrar preview, visual refresh |
| `src/components/AppSidebar.tsx` | Renombrar seccion y link |
| `src/hooks/useProviderProfile.tsx` | Auto-calculo de price_from, refactorear completeness |
| `src/components/provider/ProfilePreviewCard.tsx` | **NUEVO** — preview card en vivo |
| `src/components/provider/MisPreciosEditor.tsx` | Exponer precio minimo para auto-calculo |
| `src/components/provider/ProviderDashboard.tsx` | Actualizar texto del link "Editar mi perfil publico" si cambia |

---

## 7. Lo que NO se toca

- Ruta `/provider/profile-edit` — no romper URLs
- `VetOnboardingWizard` — flujo de onboarding para nuevos proveedores se mantiene
- Tabla `service_providers` — no requiere migracion SQL
- Logica de `useUpsertProviderProfile` — el upsert sigue igual
- Bucket `avatars` en Supabase Storage
- Ruta `/peluquero/perfil` — perfil de peluqueros es independiente y no se modifica

---

**Fin de la revision.**
