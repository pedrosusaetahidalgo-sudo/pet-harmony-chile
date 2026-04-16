# Spec: Vista Veterinaria de Ficha Clínica + Sync + Onboarding + Quick Wins

> Fecha: 2026-04-14
> Estado: PENDIENTE DE EJECUCIÓN
> Prioridad: ALTA — desbloquea el flujo completo B2B
> Punto de encuentro: **la mascota** — todo se sincroniza a través de ella

---

## Índice

1. [Problema actual](#1-problema-actual)
2. [Vista diferenciada por rol](#2-vista-diferenciada-por-rol)
3. [Auditoría de sincronización](#3-auditoría-de-sincronización)
4. [Auditoría de onboarding](#4-auditoría-de-onboarding)
5. [Navegación y coherencia UX](#5-navegación-y-coherencia-ux)
6. [Features propuestas (alto impacto, bajo costo)](#6-features-propuestas)
7. [Plan de ejecución](#7-plan-de-ejecución)
8. [Criterios de aceptación](#8-criterios-de-aceptación)

---

## 1. Problema actual

### 1.1 Vista de ficha idéntica para dueño y vet

Cuando un vet accede a `/ficha/:petId`, ve la **misma vista que el dueño**:
- Formularios de edición (alergias, dieta, medicamentos) que el vet no puede guardar (RLS bloquea)
- Tab "Compartir" que no tiene sentido para el vet
- `AddMedicalRecord` que insertaría con `owner_id = vet.user.id` (incorrecto)
- Sin acceso rápido al grabador de voz ni al editor de notas clínicas
- El param `?grabar=1` desde ProviderPatients no hace nada

### 1.2 Sidebar "Mi consultorio" roto

Navega a `/veterinarios/null` cuando el vet no tiene `slug` asignado.

### 1.3 Invitación de mascota no se procesa para usuarios nuevos

El email de invitación lleva a `/auth?returnTo=/my-pets&invitation={token}`, pero no existe código que lea el param `?invitation=` y vincule la mascota al usuario recién registrado.

---

## 2. Vista diferenciada por rol

### 2.1 Principio de diseño

Reutilizar el 100% de los componentes existentes. No crear una página nueva. Agregar `viewMode: 'owner' | 'vet'` y condicionar la UI.

### 2.2 Tabla de permisos por rol

| Elemento | Dueño | Vet vinculado |
|---|---|---|
| **Datos del animal** (nombre, raza, peso, edad) | Lee + edita vía `/edit-pet` | Solo lee |
| **Alergias** | Lee + agrega | Solo lee |
| **Medicamentos actuales** | Lee + agrega | Solo lee |
| **Condiciones crónicas** | Lee + agrega | Solo lee |
| **Info emergencia, seguro** | Lee + edita | Solo lee |
| **Historial completo** (timeline unificado) | Lee | Lee (misma data) |
| **Vacunas** (tabla) | Lee | Lee |
| **Dieta / hábitos** | Lee + edita | Solo lee |
| **Documentos** | Sube + descarga | **Sube + descarga** |
| **Tab Compartir** | Gestiona tokens/links | **No aparece** |
| **Agregar record médico** (`AddMedicalRecord`) | ✅ | ❌ (usa VetNoteEditor) |
| **OCR carnet vacunas** | ✅ | ❌ |
| **Editar datos clínicos** | ✅ | ❌ |
| **Crear memorial** | ✅ | ❌ |
| **Crear recordatorio** | ✅ | ❌ |
| **Nueva nota clínica** | ❌ | ✅ (VetNoteEditor) |
| **Grabar consulta** (voz) | ❌ | ✅ (ConsultationRecorderModal) |
| **Asistente IA** | ✅ | ✅ |
| **Descargar PDF** | ✅ | ✅ (+ incluye notas vet) |

### 2.3 Arquitectura de cambios

#### `PetClinicalRecord/index.tsx`

```ts
type ViewMode = 'owner' | 'vet';
const viewMode: ViewMode = isOwner ? 'owner' : 'vet';
```

- Pasar `viewMode` como prop a cada tab
- Leer `?grabar=1` → auto-abrir `ConsultationRecorderModal` si `viewMode === 'vet'`
- Cuando `viewMode === 'vet'`:
  - Ocultar: `AddMedicalRecord`, `VaccinationCardOCR`, "Editar datos", "Crear memorial", reminder form
  - Mostrar: `VetActionsBar` (barra sticky inferior)
  - Ocultar tab "Compartir" del `TabsList`

#### Nuevo componente: `VetActionsBar`

Barra sticky inferior (solo `viewMode === 'vet'`):

```
┌──────────────────────────────────────────────────────┐
│  📝 Nueva nota    🎙️ Grabar consulta    📎 Subir doc  │
└──────────────────────────────────────────────────────┘
```

- "Nueva nota" → Dialog con `VetNoteEditor`
- "Grabar consulta" → `ConsultationRecorderModal`
- "Subir doc" → upload dialog (reutiliza el de TabDocumentos)

#### `TabResumen` (prop `viewMode`)

- `'owner'`: sin cambios (formularios de alergias, medicamentos, condiciones)
- `'vet'`: mostrar datos como **read-only cards** sin botones "Agregar". Banner: "Para modificar estos datos, contacta al dueño"

#### `TabAlimentacion` (prop `viewMode`)

- `'owner'`: sin cambios
- `'vet'`: ocultar botón "Editar dieta". Todo read-only.

#### `TabDocumentos` (prop `viewMode`)

- `'owner'`: sin cambios
- `'vet'`: **PERMITIR upload** (exámenes, radiografías). Agregar campo `uploaded_by` para tracking. Permitir al vet eliminar solo sus propios uploads.

#### `TabCompartir`

- `'owner'`: sin cambios
- `'vet'`: **NO renderizar** en el TabsList

#### `TabHistorial`, `TabVacunas`

- Sin cambios — ya funcionan para ambos roles

#### `pdf.ts` — Actualizar

- Agregar sección "Notas clínicas veterinarias" al PDF
- Incluir: fecha, tipo, título, descripción, nombre del vet
- Badge "Transcripción de audio" si `source === 'audio_transcription'`
- Followup info si existe

---

## 3. Auditoría de sincronización

### 3.1 Estado actual de sync

| Acción | Tabla destino | ¿Se ve en la otra vista? | Timing |
|---|---|---|---|
| Vet crea nota clínica | `vet_clinical_notes` | ✅ Dueño ve en TabHistorial | Próximo page load |
| Dueño agrega record médico | `medical_records` | ✅ Vet ve en TabHistorial | Próximo page load |
| Dueño actualiza alergias/meds/dieta | `pets` | ✅ Vet ve en TabResumen | Próximo page load |
| Vet sube documento | `medical_documents` | ✅ Dueño ve en TabDocumentos | Próximo page load |
| Dueño sube documento | `medical_documents` | ✅ Vet ve en TabDocumentos | Próximo page load |

**Conclusión:** La sincronización funciona correctamente por diseño — ambas vistas leen de las mismas tablas vía React Query. No hay cache local separado.

### 3.2 Gaps de sync identificados

| Gap | Severidad | Solución propuesta |
|---|---|---|
| No hay notificación al vet cuando el dueño agrega un record | MEDIUM | Crear fila en `notifications` para linked vets |
| No hay notificación al dueño cuando el vet agrega una nota | MEDIUM | Crear fila en `notifications` para el owner |
| No hay realtime push — requiere refresh | LOW | Opcional: suscripción Supabase Realtime por `pet_id` |
| `TabResumen` usa `supabase.from('pets').update()` directo (sin React Query mutation) | LOW | Funciona con `onRefresh()` callback pero es frágil |
| `owner_id` en `medical_documents` significa "uploader", no "dueño" | MEDIUM | Agregar columna `uploaded_by` o permitir delete por `owner_id` del pet |

### 3.3 La mascota como punto de encuentro

```
              ┌──────────┐
              │  MASCOTA  │ ← pets.id = punto de encuentro
              │  (pets)   │
              └─────┬─────┘
         ┌──────────┼──────────┐
    ┌────▼────┐  ┌──▼───┐  ┌──▼──────────────┐
    │ Dueño   │  │ Vet  │  │ Datos compartidos│
    │ escribe │  │escribe│  │  (read by both)  │
    └────┬────┘  └──┬───┘  └──────────────────┘
         │          │
    ┌────▼────┐  ┌──▼───────────┐
    │medical_ │  │vet_clinical_ │
    │records  │  │notes         │
    └────┬────┘  └──┬───────────┘
         │          │
         └────┬─────┘
         ┌────▼────────────┐
         │ TabHistorial    │ ← merge unificado
         │ (timeline view) │
         └─────────────────┘
```

---

## 4. Auditoría de onboarding

### 4.1 Flujo dueño nuevo

```
Auth → OnboardingDuenoMinimal → /home → ???
```

**Estado actual:** Funciona pero el usuario llega a Home sin saber dónde está la ficha.

**Problema:** `OnboardingDuenoMinimal.tsx:156` navega a `/home`. El Home muestra el dashboard con la mascota, pero no hay CTA directo a la ficha clínica.

**Fix:** Después del onboarding, navegar a `/ficha/:petId` directamente. O mostrar toast con link.

### 4.2 Flujo vet nuevo (RegistroVeterinario)

```
Registro → StepDone → /provider/profile-edit o /provider/dashboard
```

**Estado actual:** ✅ Funciona correctamente. El vet puede acceder al dashboard y editar perfil.

**Gap menor:** El StepDone no explica qué hacer primero (completar perfil vs explorar dashboard).

### 4.3 Flujo vet nuevo (OnboardingVetMinimal)

```
Auth → /onboarding-vet → 3 pasos → /provider/dashboard
```

**Estado actual:** ✅ Funciona. El dashboard muestra empty state con "Nuevo paciente".

### 4.4 Vet agrega primer paciente

```
Dashboard → Pacientes tab → "Nuevo paciente" → NewPatientForm → paciente creado
```

**Estado actual:** ✅ Funciona. El paciente aparece en la lista y el vet puede navegar a su ficha.

### 4.5 Dueño recibe invitación del vet

**CRITICAL GAP:**

- **Dueño YA registrado:** ✅ Funciona — la edge function auto-vincula (`owner_id` set, `pet_vet_links` created)
- **Dueño NUEVO:** ❌ **ROTO** — El email lleva a `/auth?returnTo=/my-pets&invitation={token}`, pero no existe código que procese el param `?invitation=` después del registro. La mascota queda sin `owner_id`.

**Fix necesario:**
1. En Auth.tsx: después de login/signup, si `?invitation=` existe, llamar endpoint que vincule la mascota
2. O: crear un handler en Home/MyPets que detecte el param y procese

### 4.6 Flujo completo esperado (post-fix)

```
DUEÑO:
  Auth → Onboarding → /ficha/:petId (directo) → explorar ficha → agregar records

VET (registro completo):
  RegistroVet → StepDone → Completar perfil → Dashboard → Agregar paciente → /ficha/:petId (vista vet)

VET (onboarding rápido):
  Auth → OnboardingVet → Dashboard → Agregar paciente → /ficha/:petId (vista vet)

DUEÑO INVITADO POR VET:
  Email invitación → Auth (signup) → auto-link mascota → /my-pets → ver mascota ya vinculada
```

---

## 5. Navegación y coherencia UX

### 5.1 Estado actual

| Path | Taps desde Home | ¿Funciona? |
|---|---|---|
| Dueño → ficha de mascota | 1 (tap avatar) o 2 (My Paws → pet) | ✅ |
| Vet → lista pacientes | 1 (tab Pacientes en dashboard) | ✅ |
| Vet → ficha paciente | 2 (Pacientes → Ficha) | ✅ (con fix de hoy) |
| Vet → grabar consulta | 3 (Pacientes → Ficha → Grabar) | ⚠️ Será 2 con VetActionsBar |
| Vet → su perfil público | Sidebar "Mi consultorio" | ❌ `/veterinarios/null` si no tiene slug |
| Dual-role → cambiar modo | Header toggle | ✅ |

### 5.2 Fixes de navegación

1. **Sidebar "Mi consultorio":** Si `slug` es null → navegar a `/provider/profile-edit` con toast "Completa tu perfil para tener tu página pública"
2. **Profile page para dual-role:** Agregar card "Ver/editar mi perfil veterinario" → `/provider/profile-edit`
3. **Home empty state (0 pets):** Mostrar ilustración + CTA en vez de `null`

---

## 6. Features propuestas (alto impacto, bajo costo)

### 6.1 Para DUEÑOS

| Feature | Esfuerzo | Impacto | Descripción |
|---|---|---|---|
| **Post-onboarding → ficha directa** | 5 min | ALTO | Navegar a `/ficha/:petId` después de crear mascota en onboarding |
| **Toast "Tu vet agregó una nota"** | 20 min | ALTO | Notificación cuando vet escribe en la ficha (via tabla `notifications`) |
| **Home empty state mejorado** | 10 min | MEDIO | Ilustración + CTA "Agrega tu primera mascota" en vez de vacío |
| **Invitation acceptance handler** | 30 min | CRÍTICO | Procesar `?invitation=` param para vincular mascota a dueño nuevo |
| **PDF con notas vet incluidas** | 15 min | ALTO | La ficha PDF descargable incluye TODAS las notas (owner + vet) |

### 6.2 Para VETS

| Feature | Esfuerzo | Impacto | Descripción |
|---|---|---|---|
| **VetActionsBar en ficha** | 20 min | CRÍTICO | Barra sticky con Nueva nota / Grabar / Subir doc |
| **Auto-open grabador** (`?grabar=1`) | 5 min | ALTO | Click en "Grabar" desde CRM abre el grabador automáticamente |
| **Vista read-only de datos del animal** | 15 min | ALTO | Ocultar formularios de edición, mostrar datos como cards |
| **Fix sidebar "Mi consultorio"** | 5 min | MEDIO | No navegar a `/veterinarios/null` |
| **"Última actividad" en lista pacientes** | 15 min | MEDIO | Mostrar "Hace 3 días" junto a cada paciente (último record o nota) |
| **Búsqueda rápida de pacientes** | 10 min | MEDIO | Input de búsqueda por nombre de mascota/dueño en CRM |

### 6.3 Para AMBOS

| Feature | Esfuerzo | Impacto | Descripción |
|---|---|---|---|
| **Badge "Nuevo" en historial** | 10 min | MEDIO | Marcar records/notas no vistos desde última visita |
| **Contador de records en tab** | 5 min | BAJO | "Historial (12)" en vez de solo "Historial" |
| **Compartir ficha por QR mejorado** | 10 min | MEDIO | QR que lleva directo a `/ficha/:petId` (no al share token) para vets linked |
| **Quick Actions desde historial** | 15 min | MEDIO | Botón "Repetir" en un record para crear uno similar (misma clínica, vet, tipo) |

---

## 7. Plan de ejecución

### Bloque A: Fixes críticos (30 min)

| # | Tarea | Archivo(s) |
|---|---|---|
| A1 | Fix sidebar `/veterinarios/null` | `AppSidebar.tsx` |
| A2 | Invitation acceptance handler (`?invitation=` param) | `Auth.tsx` o `MyPets.tsx` |
| A3 | Post-onboarding navegar a `/ficha/:petId` | `OnboardingDuenoMinimal.tsx` |

### Bloque B: Vista vet en ficha clínica (45 min)

| # | Tarea | Archivo(s) |
|---|---|---|
| B1 | Agregar `viewMode` prop y pasarlo a tabs | `PetClinicalRecord/index.tsx` |
| B2 | Adaptar `TabResumen` — read-only para vets | `TabResumen.tsx` |
| B3 | Adaptar `TabAlimentacion` — ocultar edit | `TabAlimentacion.tsx` |
| B4 | Ocultar tab "Compartir" para vets | `PetClinicalRecord/index.tsx` |
| B5 | Ocultar controles owner-only (AddMedicalRecord, OCR, Memorial, etc.) | `PetClinicalRecord/index.tsx` |
| B6 | Crear `VetActionsBar` (3 botones sticky) | `PetClinicalRecord/VetActionsBar.tsx` (nuevo) |
| B7 | Implementar `?grabar=1` auto-open | `PetClinicalRecord/index.tsx` |

### Bloque C: Documentos vet + PDF (20 min)

| # | Tarea | Archivo(s) |
|---|---|---|
| C1 | Permitir upload vet en `TabDocumentos` | `TabDocumentos.tsx`, `useMedicalDocuments.tsx` |
| C2 | Actualizar PDF para incluir notas vet | `PetClinicalRecord/pdf.ts` |

### Bloque D: Quick wins UX (20 min)

| # | Tarea | Archivo(s) |
|---|---|---|
| D1 | Home empty state mejorado | `Home.tsx` |
| D2 | Profile page: link a perfil vet para dual-role | `Profile.tsx` |
| D3 | Toast notificación vet→dueño y dueño→vet | `AddMedicalRecord.tsx`, `useVetClinicalNotes.ts` |

### Bloque E: Build + Test (15 min)

| # | Tarea |
|---|---|
| E1 | `npx tsc -b` — 0 errores |
| E2 | `npm run build` — pasa |
| E3 | Test flujo dueño: onboarding → ficha → agregar record → PDF |
| E4 | Test flujo vet: onboarding → dashboard → agregar paciente → ficha (vista vet) → nota → grabar |
| E5 | Test sync: vet agrega nota → dueño ve en historial |
| E6 | Test invitación: vet invita → dueño acepta → mascota vinculada |

---

## 8. Criterios de aceptación

### Vista vet
- [ ] Vet vinculado ve la ficha en modo lectura con datos del animal
- [ ] Formularios de edición (alergias, dieta, etc.) NO aparecen para vets
- [ ] Tab "Compartir" NO aparece para vets
- [ ] `VetActionsBar` visible con 3 botones (nota, grabar, subir doc)
- [ ] Vet puede agregar notas manuales desde la ficha
- [ ] Vet puede grabar consulta por voz desde la ficha
- [ ] Vet puede subir documentos (exámenes, radiografías)
- [ ] `?grabar=1` abre el grabador automáticamente

### Sincronización
- [ ] Nota del vet aparece en historial del dueño al recargar
- [ ] Record del dueño aparece en historial del vet al recargar
- [ ] Documentos subidos por vet son visibles para el dueño
- [ ] Cambios en datos del animal (alergias, meds) se reflejan en vista vet

### Onboarding
- [ ] Dueño nuevo llega a la ficha de su mascota después del onboarding
- [ ] Vet nuevo puede acceder a su dashboard sin bouncing
- [ ] Invitación para dueño NUEVO vincula la mascota automáticamente
- [ ] Invitación para dueño EXISTENTE vincula la mascota (ya funciona)

### Navegación
- [ ] Sidebar "Mi consultorio" no navega a `/veterinarios/null`
- [ ] Profile page muestra link a perfil vet para dual-role users
- [ ] Home con 0 mascotas muestra CTA (no vacío)

### Integridad
- [ ] Dueño ve la ficha exactamente igual que antes (regresión = 0)
- [ ] PDF incluye notas clínicas del vet
- [ ] Build pasa sin errores
- [ ] `npx tsc -b` = 0 errores
