# Propuesta: Sidebar Profesional + Flujo clinico optimizado

> Fecha: 2026-04-13
> Estado: Propuesta para revision y ejecucion
> Archivos clave: `src/components/AppSidebar.tsx`, `src/pages/PetClinicalRecord/`

---

## 1. Diagnostico actual

### 1.1 Sidebar vacio

| Sidebar | Items | Secciones |
|---------|-------|-----------|
| **Owner** | 15 | 3 (Salud, Descubrir, Comunidad) |
| **Provider** | 4-5 | 2 (Consultorio, Negocio) |

El vet entra y ve un sidebar minimo. Chat, Calendario, Reportes, Pacientes -- todo existe pero esta enterrado en el Dashboard o requiere cambiar de rol.

### 1.2 Ficha clinica fragmentada

**Problema critico**: En `TabHistorial.tsx` los registros del dueno (`medical_records`) y las notas del vet (`vet_clinical_notes`) se muestran en **secciones completamente separadas**:

```
TabHistorial actual
├── [Busqueda + filtros] ← solo filtra records del dueno
├── Records del dueno (timeline por ano)
│   ├── 2026: vacuna, control, consulta...
│   └── 2025: cirugia, examen...
└── Notas de veterinarios (seccion aparte, azul)
    ├── Nota vet 1
    └── Nota vet 2  ← sin filtro, sin busqueda, sin transcripcion
```

**Consecuencias**:
- No hay timeline unificada -- imposible ver la historia completa en orden cronologico
- Las transcripciones de voz (`raw_transcript`) se guardan en BD pero **nunca se muestran** despues de guardar
- El campo `source` (manual vs audio_transcription) existe pero no se usa en la UI
- Las notas del vet no tienen filtro ni busqueda
- El dueno y el vet ven realidades distintas de la misma mascota

---

## 2. Propuesta completa

### Parte A: Sidebar profesional enriquecido
### Parte B: Pagina dedicada `/provider/pacientes`
### Parte C: Ficha clinica unificada (timeline unica dueno + vet)

---

## 3. Parte A -- Nuevo sidebar profesional

### Estructura (4 secciones, 11-13 items)

```
CONSULTORIO
  Dashboard              /provider/dashboard        LayoutDashboard
  Pacientes              /provider/pacientes        Users            ← PAGINA NUEVA
  Mis reservas           /mis-reservas              Calendar
  Calendario             /calendario                CalendarDays     ← RESCATADO

COMUNICACION
  Mensajes               /chat                      MessageSquare    ← RESCATADO
  Seguimientos           /provider/seguimientos     Bell             ← NUEVO (badge)

NEGOCIO
  Perfil publico         /provider/profile-edit     UserCog
  Panel Pro              /panel-pro                 Star             (PremiumBadge)
  Reportes               /reportes                  BarChart3        ← RESCATADO
  [Perfil peluquero]     /peluquero/perfil          Scissors         (si groomer)

ADMIN (solo si isAdmin)
  Panel admin            /admin                     Shield
```

```
Link compacto:  My Paws  /my-pets  PawPrint (purple)
```

### Mockup visual

```
┌─────────────────────────┐
│  paw friend             │
├─────────────────────────┤
│ CONSULTORIO        [teal]│
│   Dashboard             │
│   Pacientes         (3) │ ← badge: solicitudes pendientes
│   Mis reservas          │
│   Calendario            │
├─────────────────────────┤
│ COMUNICACION            │
│   Mensajes              │
│   Seguimientos      (2) │ ← badge: followups 7 dias
├─────────────────────────┤
│ NEGOCIO                 │
│   Perfil publico        │
│   Panel Pro        PRO  │
│   Reportes              │
├─────────────────────────┤
│ ADMIN              [si] │
│   Panel admin           │
├─────────────────────────┤
│   My Paws          [lila]│
├─────────────────────────┤
│   Configuracion         │
│   Cerrar sesion         │
└─────────────────────────┘
```

### Bottom Tab Bar mobile (provider)

```
Actual:    Dashboard | My Paws  | Reservas | Perfil Pro | Perfil
Propuesto: Dashboard | Pacientes | Reservas | Mensajes  | Perfil
```

### Items que NO se mueven al provider

| Item | Razon |
|------|-------|
| Recordatorios, Rutinas | Contexto dueno: rutinas de SUS mascotas |
| Buscar vet, Servicios, Mapa | Orientados a consumidores |
| Banco de sangre, Comunidad | Accesibles cambiando a modo dueno |
| Coleccion, Misiones, Paw Game | Gamificacion para duenos |
| Feed | Accesible via cambio de rol; a futuro podria haber feed profesional |

---

## 4. Parte B -- Pagina `/provider/pacientes`

### Concepto

Pagina dedicada donde el vet ve **todos sus pacientes** con acceso rapido a fichas, sesiones grabadas y acciones clinicas. Es el hub central de trabajo diario.

### Wireframe

```
┌──────────────────────────────────────────────────────────┐
│  Mis pacientes                              [+ Nuevo]    │
│  ─────────────────────────────────────────────────────── │
│  [Buscar por nombre...]  [Especie ▾]  [Estado ▾]        │
│                                                          │
│  SOLICITUDES PENDIENTES (3)              [seccion amber] │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Luna (Gato) · Maria Lopez · hace 2h   [Aceptar][X] │ │
│  │ Rocky (Perro) · Juan Soto · hace 1d   [Aceptar][X] │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  PACIENTES ACTIVOS (12)                                  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [foto] Kai · Pastor suizo · Pedro S.                │ │
│  │        Ultima consulta: 10 abr 2026                 │ │
│  │        3 sesiones grabadas                          │ │
│  │                                                     │ │
│  │  ▸ Sesiones transcritas (3)          [Ver ficha →]  │ │
│  │  ┌───────────────────────────────────────────────┐  │ │
│  │  │ 10 abr · Consulta · "Control general post..." │  │ │
│  │  │   Resumen IA: Control de peso OK, vacuna...   │  │ │
│  │  │   [▸ Ver transcripcion completa]              │  │ │
│  │  ├───────────────────────────────────────────────┤  │ │
│  │  │ 28 mar · Urgencia · "Vomitos recurrentes..."  │  │ │
│  │  │   Resumen IA: Gastroenteritis leve, ayuno...  │  │ │
│  │  │   [▸ Ver transcripcion completa]              │  │ │
│  │  └───────────────────────────────────────────────┘  │ │
│  │                                                     │ │
│  │  [Grabar consulta]  [Escribir nota]  [Ver ficha →]  │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  MASCOTAS PENDIENTES DE DUENO (1)        [seccion gris]  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Copito (Gato) · Creado por ti · Invitacion enviada  │ │
│  │ ana@mail.com · hace 3d          [Reenviar invitacion]│ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Funcionalidades clave

#### 4.1 Lista de pacientes con filtros

- **Busqueda**: por nombre de mascota o nombre del dueno
- **Filtro especie**: Todos / Perro / Gato / Otro
- **Filtro estado**: Todos / Activos / Pendientes de vinculacion / Creados por mi
- **Orden**: Ultima consulta (desc) | Nombre (A-Z) | Fecha vinculacion

**Fuentes de datos** (reutilizar logica de `VetPatientsList`):
- `pet_vet_links` (status='active') → pacientes vinculados
- `vet_clinical_notes` (provider_id=user) → pacientes atendidos
- `medical_share_tokens` (target_provider_id) → fichas compartidas
- `pets` (created_by_vet_id=user, owner=null) → mascotas pendientes de dueno

#### 4.2 Dropdown de sesiones transcritas por paciente

Cada paciente tiene un **accordion/collapsible** que muestra todas las notas clinicas del vet para esa mascota, con enfasis en las sesiones grabadas:

```tsx
// Query: vet_clinical_notes WHERE pet_id=X AND provider_id=user ORDER BY consultation_date DESC
```

**Cada sesion muestra**:
- **Fecha** + **tipo** (badge: consulta, vacuna, control, cirugia, urgencia)
- **Icono de fuente**: microfono si `source='audio_transcription'`, lapiz si `source='manual'`
- **Titulo** (el resumen generado por IA o escrito manualmente)
- **Descripcion** (truncada a 2 lineas con expand)
- **Transcripcion completa** (collapsible, solo si `raw_transcript` no es null):
  - Fondo gris claro, monospace, con scroll vertical
  - Label: "Transcripcion original de la consulta"
- **Followup** (si aplica): fecha + razon en badge amber
- **Alternativas discutidas** (si aplica): texto en badge verde

#### 4.3 Acciones rapidas por paciente

Desde la card de cada paciente, sin navegar a otra pagina:
- **[Grabar consulta]** → abre `ConsultationRecorderModal` directo
- **[Escribir nota]** → abre `VetNoteEditor` inline o modal
- **[Ver ficha →]** → navega a `/ficha/:petId` (ficha completa unificada)

**Requisito**: ambas acciones necesitan un `share_token_id` valido. Si no hay token activo, mostrar CTA: "Pide al dueno que comparta la ficha" o generar token automatico si el vet tiene link activo.

#### 4.4 Consolidado IA al entrar a la ficha

Cuando el vet hace click en **[Ver ficha]**, antes de mostrar la ficha completa, se genera un **consolidado automatico** de todas las sesiones grabadas:

```
┌──────────────────────────────────────────────────────────┐
│  Consolidado clinico — Kai                     [×]       │
│  Generado a partir de 5 sesiones (oct 2025 – abr 2026)  │
│  ─────────────────────────────────────────────────────── │
│                                                          │
│  DIAGNOSTICOS RECURRENTES                                │
│  • Dermatitis atopica (3 consultas)                      │
│  • Sobrepeso leve (2 controles)                          │
│                                                          │
│  TRATAMIENTOS ACTIVOS                                    │
│  • Apoquel 16mg 1x/dia (desde mar 2026)                  │
│  • Dieta hipoalergenica Royal Canin                      │
│                                                          │
│  VACUNAS AL DIA                                          │
│  • Sextuple: 15 mar 2026 ✓  Proxima: mar 2027           │
│  • Antirrabica: 20 ene 2026 ✓  Proxima: ene 2027        │
│                                                          │
│  ALERTAS                                                 │
│  ⚠ Alergia a cefalosporinas (reportada 28 mar 2026)     │
│  ⚠ Peso: 38kg → meta 34kg (tendencia: bajando)          │
│                                                          │
│  PROXIMOS SEGUIMIENTOS                                   │
│  • 20 abr: Control peso (agendado desde consulta 10 abr)│
│  • 15 may: Control dermatologico                         │
│                                                          │
│  [Copiar al portapapeles]  [Continuar a ficha completa →]│
└──────────────────────────────────────────────────────────┘
```

**Implementacion**:
- Edge function nueva: `generate-vet-patient-summary`
- Input: todas las `vet_clinical_notes` + `medical_records` de ese pet_id
- Output: JSON estructurado con secciones (diagnosticos, tratamientos, vacunas, alertas, seguimientos)
- Cache: guardar en `vet_patient_summaries` con TTL de 24h (invalidar cuando se agrega nueva nota)
- El vet puede saltarse el consolidado y ir directo a la ficha

---

## 5. Parte C -- Ficha clinica unificada

### Problema actual (TabHistorial)

```
ANTES (separado):
├── Records del dueno (timeline bonita, con filtros)
└── Notas del vet (lista plana, sin filtros, sin transcripcion)
```

### Propuesta: Timeline unica

```
DESPUES (unificado):
├── [Busqueda] [Filtro tipo ▾] [Filtro fuente ▾] [Filtro vet ▾]
└── Timeline cronologica (mas reciente primero)
    ├── 2026
    │   ├── 10 abr · [CONSULTA] [Dr. Sofia Rosi] [🎙 Grabada]
    │   │   "Control general post-tratamiento dermatitis"
    │   │   Peso: 36.5kg. Lesiones en remision...
    │   │   ▸ Ver transcripcion original
    │   │   ▸ Seguimiento: 20 abr — control peso
    │   │
    │   ├── 05 abr · [VACUNA] [Dueno] [✏ Manual]
    │   │   "Sextuple anual — Clinica VetPlus"
    │   │   Lote: ABC123, Dr. Martinez
    │   │
    │   ├── 28 mar · [URGENCIA] [Dr. Sofia Rosi] [🎙 Grabada]
    │   │   "Vomitos recurrentes — gastroenteritis"
    │   │   ▸ Ver transcripcion original
    │   │   Alternativas discutidas: Endoscopia vs tratamiento...
    │   │
    │   └── 15 mar · [CONTROL] [Dueno] [✏ Manual]
    │       "Control peso mensual"
    │       38kg → meta 34kg
    └── 2025
        └── ...
```

### Cambios en TabHistorial.tsx

#### 5.1 Merge de datos en un solo array

```typescript
// Pseudo-codigo del merge
type UnifiedRecord = {
  id: string;
  date: string;               // consultation_date o date
  title: string;
  description: string | null;
  recordType: string;          // note_type o record_type
  source: 'owner' | 'vet_manual' | 'vet_audio';
  providerName: string | null; // null si es del dueno
  rawTranscript: string | null;
  followupDate: string | null;
  followupReason: string | null;
  alternativeOffered: boolean;
  alternativesDiscussed: string | null;
  clinicName: string | null;   // solo medical_records
  vetName: string | null;      // solo medical_records
  nextDate: string | null;     // solo medical_records
};

const unified = [
  ...medicalRecords.map(r => ({
    ...r,
    source: 'owner',
    providerName: null,
    rawTranscript: null,
    // mapear campos
  })),
  ...vetNotes.map(n => ({
    ...n,
    source: n.source === 'audio_transcription' ? 'vet_audio' : 'vet_manual',
    providerName: n.provider_name,
    // mapear campos
  })),
].sort((a, b) => new Date(b.date) - new Date(a.date));
```

#### 5.2 Badges visuales por fuente

| Fuente | Badge | Color | Icono |
|--------|-------|-------|-------|
| Dueno (manual) | `Dueno` | purple-100 | User |
| Vet (manual) | `Dr. Nombre` | teal-100 | Stethoscope |
| Vet (grabado) | `Dr. Nombre` + `Grabada` | teal-100 + red-100 | Stethoscope + Mic |

#### 5.3 Filtros ampliados

Agregar al filtro existente:
- **Fuente**: Todos / Dueno / Veterinario / Solo grabaciones
- **Veterinario**: Todos / [lista de vets que han escrito notas] (si hay mas de 1)
- **Busqueda**: incluir `raw_transcript` en el texto buscable

#### 5.4 Transcripcion expandible

Para notas con `source='vet_audio'` y `raw_transcript` no null:

```tsx
<Collapsible>
  <CollapsibleTrigger className="text-xs text-muted-foreground flex items-center gap-1">
    <Mic className="h-3 w-3" />
    Ver transcripcion original
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
      {record.rawTranscript}
    </div>
  </CollapsibleContent>
</Collapsible>
```

#### 5.5 Followup y alternativas inline

Si la nota tiene followup:
```
📅 Seguimiento: 20 abr 2026 — Control de peso post-dieta
```

Si la nota tiene alternativas:
```
💬 Alternativas discutidas: Se ofrecio endoscopia como opcion...
```

Ambos como sub-secciones del mismo card, no en seccion separada.

---

## 6. Flujo completo del vet (optimizado)

### Atencion de un paciente (de principio a fin)

```
1. Vet abre app → Sidebar "Pacientes" (1 click)
   │
2. Ve lista de pacientes → Busca o filtra
   │
3. Expande accordion del paciente
   │  → Ve todas las sesiones previas con transcripciones
   │  → Lee contexto rapido sin salir de la pagina
   │
4. Decide accion:
   │
   ├─ [Grabar consulta] → ConsultationRecorderModal
   │   → Graba → IA transcribe → Edita resumen → Guarda
   │   → Nota aparece en la lista del paciente
   │   → Si marco followup → trigger crea recordatorio
   │   → Si marco alternativa → queda en la nota
   │
   ├─ [Escribir nota] → VetNoteEditor (rapido, sin audio)
   │   → Puede usar template → Guarda → Misma logica
   │
   └─ [Ver ficha] → Consolidado IA (modal rapido)
       │  → Ve diagnosticos, tratamientos, alertas
       │  → Click "Continuar" → Ficha completa unificada
       │
       └─ Ficha unificada (TabHistorial mejorado)
          → Timeline unica: records dueno + notas vet
          → Filtra por fuente, tipo, vet
          → Expande transcripciones
          → Agrega nueva nota desde la ficha
```

### Agregar a la ficha desde cualquier punto

El vet puede agregar notas desde **3 puntos de entrada**:
1. **Pagina Pacientes** → botones en card del paciente
2. **Ficha unificada** → boton flotante "Agregar nota" en TabHistorial
3. **Dashboard** → SharedFichasCard (flujo legacy, se mantiene)

Todas las entradas usan los mismos componentes (`VetNoteEditor`, `ConsultationRecorderModal`) y escriben a la misma tabla (`vet_clinical_notes`).

### Triggers automaticos al agregar nota

| Accion del vet | Trigger |
|----------------|---------|
| Marca `followup_required=true` | Crea `pet_reminder` para el dueno (trigger SQL existente) |
| Tipo `vacuna` con `next_date` | Crea recordatorio de proxima vacuna |
| Marca `alternative_offered=true` | Queda registrado en la nota (compliance) |
| Cualquier nota nueva | Invalida cache del consolidado IA |
| Cualquier nota nueva | Notificacion al dueno: "Tu vet agrego una nota a la ficha de [mascota]" |

### Trigger nuevo propuesto: notificacion al dueno

```sql
-- Trigger: notificar al dueno cuando el vet agrega una nota
CREATE OR REPLACE FUNCTION notify_owner_on_vet_note()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link, created_at)
  SELECT
    p.owner_id,
    'vet_note',
    'Nueva nota clinica',
    'Tu veterinario agrego una nota a la ficha de ' || p.name,
    '/ficha/' || NEW.pet_id,
    NOW()
  FROM pets p
  WHERE p.id = NEW.pet_id AND p.owner_id IS NOT NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_owner_on_vet_note
  AFTER INSERT ON vet_clinical_notes
  FOR EACH ROW EXECUTE FUNCTION notify_owner_on_vet_note();
```

---

## 7. Archivos a crear/modificar

### Nuevos

| Archivo | Descripcion |
|---------|-------------|
| `src/pages/ProviderPatients.tsx` | Pagina `/provider/pacientes` |
| `src/components/provider/PatientCard.tsx` | Card de paciente con accordion de sesiones |
| `src/components/provider/SessionDropdown.tsx` | Dropdown de sesiones transcritas |
| `src/components/provider/PatientConsolidatedSummary.tsx` | Modal de consolidado IA |
| `src/hooks/useVetPatients.ts` | Hook que unifica las 4 fuentes de pacientes |
| `supabase/functions/generate-vet-patient-summary/` | Edge function consolidado IA |
| `supabase/migrations/XXXX_notify_owner_vet_note.sql` | Trigger notificacion |

### Modificados

| Archivo | Cambio |
|---------|--------|
| `src/components/AppSidebar.tsx` | Agregar items: Pacientes, Calendario, Mensajes, Seguimientos, Reportes, Admin |
| `src/components/BottomTabBar.tsx` | Reorganizar tabs mobile provider |
| `src/pages/PetClinicalRecord/tabs/TabHistorial.tsx` | Timeline unificada (merge records + notes) + filtros ampliados + transcripcion expandible |
| `src/hooks/useVetClinicalNotes.ts` | Exponer `raw_transcript` y `source` en queries |
| `src/App.tsx` | Agregar ruta `/provider/pacientes` |

---

## 8. Plan de ejecucion por fases

### Fase 1 — Sidebar + rutas (sin paginas nuevas)

Agregar al sidebar los items que ya tienen ruta funcional:

| Item | Ruta | Esfuerzo |
|------|------|----------|
| Calendario | `/calendario` | 1 linea |
| Mensajes | `/chat` | 1 linea |
| Reportes | `/reportes` | 1 linea |
| Panel admin | `/admin` | ~15 lineas (condicional `useIsAdmin`) |

Archivos: `AppSidebar.tsx`, `BottomTabBar.tsx`

### Fase 2 — Ficha unificada (TabHistorial)

1. Modificar `TabHistorial.tsx`: merge `medical_records` + `vet_clinical_notes` en array unico
2. Agregar badges de fuente (dueno / vet manual / vet grabada)
3. Agregar collapsible de transcripcion para notas de audio
4. Ampliar filtros (fuente, veterinario)
5. Incluir followup y alternativas inline en cada card

Archivos: `TabHistorial.tsx`, `useVetClinicalNotes.ts`

### Fase 3 — Pagina Pacientes

1. Crear `ProviderPatients.tsx` con lista filtrable
2. Crear `PatientCard.tsx` con accordion de sesiones
3. Crear `SessionDropdown.tsx` con transcripciones expandibles
4. Integrar `ConsultationRecorderModal` y `VetNoteEditor` desde la card
5. Agregar ruta en `App.tsx`
6. Actualizar sidebar con link a `/provider/pacientes`

### Fase 4 — Consolidado IA + triggers

1. Crear edge function `generate-vet-patient-summary`
2. Crear `PatientConsolidatedSummary.tsx` (modal)
3. Crear migracion para trigger de notificacion al dueno
4. Cache del consolidado con invalidacion al agregar nota

---

## 9. Impacto esperado

| Metrica | Antes | Despues |
|---------|-------|---------|
| Items sidebar provider | 4 | 12 |
| Clicks para ver pacientes | 3+ (scroll dashboard) | 1 (sidebar) |
| Clicks para grabar consulta | 4+ (dashboard → ficha → grabar) | 2 (pacientes → grabar) |
| Transcripcion visible post-guardado | No | Si (collapsible) |
| Timeline unificada dueno + vet | No (separadas) | Si (merge cronologico) |
| Filtro por fuente (dueno/vet/audio) | No | Si |
| Consolidado IA de sesiones | No existe | Modal automatico |
| Notificacion al dueno por nota nueva | No | Si (trigger) |
| Acceso admin desde sidebar | URL manual | 1 click |

---

## 10. Riesgos y mitigaciones

| Riesgo | Mitigacion |
|--------|-----------|
| Timeline unificada rompe expectativas del dueno | Badges claros de fuente; filtro "Solo mis registros" disponible |
| Transcripcion larga ocupa mucho espacio | Collapsible cerrado por defecto, max-height con scroll |
| Consolidado IA lento | Cache 24h + skeleton loader; vet puede saltarselo |
| Share token requerido para escribir notas | Si hay `pet_vet_link` activo, generar token automatico o permitir escritura directa |
| Muchos pacientes en la lista | Paginacion (20 por pagina) + busqueda eficiente |

---

## 11. Decision requerida

- [ ] Aprobar Fase 1 (sidebar: Calendario, Mensajes, Reportes, Admin)
- [ ] Aprobar Fase 2 (ficha unificada: timeline merge + transcripciones + filtros)
- [ ] Aprobar Fase 3 (pagina Pacientes con accordion de sesiones)
- [ ] Aprobar Fase 4 (consolidado IA + trigger notificacion)
- [ ] Aprobar cambio Bottom Tab Bar mobile
