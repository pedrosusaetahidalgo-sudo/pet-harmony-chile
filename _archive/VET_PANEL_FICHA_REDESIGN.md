# Spec: Rediseno Panel de Pacientes + Ficha Clinica Veterinaria

> Autor: Claude (perspectiva veterinaria)
> Fecha: 2026-04-15
> Estado: Propuesta para revision
> Prioridad: Alta (mejora core del flujo provider)

---

## 0. Contexto y problema

El veterinario hoy tiene dos vistas principales:

1. **`/provider/pacientes`** — Lista CRM de pacientes (tabla plana con accordion de sesiones)
2. **`/ficha/:petId`** — Ficha clinica compartida con el dueno (misma vista, con `viewMode='vet'`)

### Problemas detectados

**Panel de pacientes:**
- Es una tabla plana sin jerarquia visual. Todos los pacientes se ven igual independiente de si tienen seguimiento pendiente, si son nuevos, o si no se ven hace 6 meses.
- No hay resumen ejecutivo: el vet no sabe de un vistazo cuantos seguimientos tiene pendientes, cuantas consultas hizo hoy, ni que pacientes requieren atencion.
- Las acciones (grabar, nota, ficha) son botones pequenos que se pierden en mobile.
- El accordion de sesiones es util pero rompe el flujo: para ver 5 pacientes hay que expandir/colapsar 5 veces.
- No hay forma de agendar una proxima cita desde la lista.
- No hay distincion entre pacientes activos, nuevos, o inactivos (>3 meses sin visita).

**Ficha clinica (vista vet):**
- Es la misma pagina del dueno con ajustes menores (`viewMode='vet'`). Funcional pero no esta pensada para un profesional en consulta.
- El vet necesita ver rapido: peso actual, alergias, medicamentos activos, ultima consulta, vacunas pendientes. Hoy tiene que navegar por tabs.
- El CTA de PDF ocupa mucho espacio visual (esta pensado para el dueno).
- No hay seccion de signos vitales ni triage rapido.
- El VetActionsBar (sticky bottom) es bueno pero solo tiene 3 acciones. Falta: agendar seguimiento, agregar peso, marcar vacuna.

---

## 1. Principios de diseno (pensando como vet)

| Principio | Razon |
|---|---|
| **Un vistazo = situacion completa** | En consulta, el vet tiene 15 minutos por paciente. No puede estar scrolleando. |
| **Acciones a 1 click** | Grabar consulta, escribir nota, agendar seguimiento: sin modales anidados. |
| **Alertas al frente** | Alergias, medicamentos, seguimientos vencidos: siempre visibles, nunca escondidos en tabs. |
| **Mobile-first en consulta** | Muchos vets usan tablet o celular en el box. Touch targets grandes. |
| **Datos sincronizados** | Lo que el vet escribe se refleja en la ficha del dueno y viceversa. Misma fuente de datos, diferente presentacion. |
| **Sin gamificacion** | Cero PawPoints, Paw Cards, emojis ludicos. Colores sobrios, tipografia clara. |

---

## 2. Panel de Pacientes V2 (`/provider/pacientes`)

### 2.1. Header con KPIs del dia

Reemplazar el header actual (titulo + contador) por una barra de contexto:

```
┌─────────────────────────────────────────────────────────────┐
│  Mis Pacientes                         [+ Nuevo Paciente]   │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 47       │  │ 3        │  │ 2        │  │ 1        │   │
│  │ Activos  │  │ Hoy      │  │ Seguim.  │  │ Pendiente│   │
│  │          │  │          │  │ vencidos │  │ reclamo  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- **Activos**: pacientes con actividad en los ultimos 90 dias
- **Hoy**: consultas/notas registradas hoy
- **Seguimientos vencidos**: followups con fecha pasada (badge rojo)
- **Pendiente reclamo**: mascotas sin dueno asignado

Cada KPI es clickable y filtra la lista abajo.

### 2.2. Filtros mejorados

Agregar a los filtros existentes (busqueda + especie):

- **Estado**: Todos / Activos / Nuevos (< 30 dias) / Inactivos (> 90 dias sin visita) / Con seguimiento pendiente
- **Ordenar por**: Ultima visita (default) / Nombre / Proximo seguimiento / Mas consultas

### 2.3. Vista de pacientes: Cards en vez de tabla

Reemplazar la tabla tipo CRM por cards mas informativas. En desktop: grid 2 columnas. En mobile: stack vertical.

```
┌────────────────────────────────────────────────────────┐
│  [Avatar]  Kai                          hace 3 dias ○  │
│            Pastor Suizo · Perro · 4a 2m               │
│            Dueno: Pedro S.                             │
│                                                        │
│  ⚠ Alergia: pollo    💊 Apoquel 16mg    📋 12 notas  │
│                                                        │
│  Prox. seguimiento: 20 abr (control dermatitis)       │
│                                                        │
│  [🎙 Grabar]  [📝 Nota]  [📊 Resumen IA]  [→ Ficha]  │
└────────────────────────────────────────────────────────┘
```

**Elementos clave por card:**
- **Indicador de estado** (circulo de color): verde=activo, gris=inactivo, amarillo=seguimiento pendiente, rojo=seguimiento vencido
- **Edad calculada** (no solo especie/raza)
- **Alertas en linea**: alergias y medicamentos activos siempre visibles (badges compactos, max 2 + "+N mas")
- **Contador de notas** (total, no expandible aqui)
- **Proximo seguimiento** si existe (con dias restantes)
- **Acciones**: 4 botones con iconos grandes y touch-friendly

### 2.4. Vista alternativa: Tabla compacta (toggle)

Mantener opcion de tabla para vets que prefieren density:

```
[Cards ☐] [Tabla ☑]

Nombre       │ Especie │ Edad  │ Alertas      │ Ult. visita │ Seguimiento  │ Acciones
Kai          │ Perro   │ 4a 2m │ ⚠ pollo      │ hace 3d     │ 20 abr       │ 🎙 📝 →
Luna         │ Gato    │ 2a    │ —            │ hace 1 sem  │ —            │ 🎙 📝 →
```

Persistir preferencia en `localStorage`.

### 2.5. Solicitudes pendientes: Banner sticky

Las solicitudes de vinculacion pendientes se mueven a un banner sticky arriba de la lista (no inline), con counter badge en el header:

```
┌──────────────────────────────────────────────────┐
│  🔔 3 solicitudes pendientes de vinculacion      │
│  [Ver solicitudes ▾]                             │
└──────────────────────────────────────────────────┘
```

Se expande como drawer para no ocupar espacio fijo.

### 2.6. Accion rapida: Agendar desde la lista

Nuevo boton en cada card: **Agendar** (icono calendario). Abre mini-modal:

- Fecha + hora
- Motivo (dropdown: control, vacuna, cirugia, seguimiento, otro)
- Nota opcional (1 linea)
- Guarda en `vet_clinical_notes` con `note_type` + `followup_date`

---

## 3. Ficha Clinica Veterinaria (`/ficha/:petId` con `viewMode='vet'`)

### 3.1. Principio: misma data, diferente layout

La ficha del vet lee de las **mismas tablas** que la del dueno (`pets`, `medical_records`, `vet_clinical_notes`, `reminders`). No se duplica data. Lo que cambia es:

- La **disposicion visual** (layout)
- Las **acciones disponibles** (el vet puede escribir, el dueno puede compartir)
- La **prioridad de informacion** (el vet necesita clinica primero, el dueno necesita cuidado primero)

### 3.2. Header clinico compacto

Reemplazar el PetHeader + CTA PDF por un header clinico denso:

```
┌────────────────────────────────────────────────────────────────────┐
│  [Avatar]  KAI · Pastor Suizo Blanco · Macho · 4a 2m · 32 kg    │
│            Chip: 956000012345678 · Dueno: Pedro Susaeta           │
│                                                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│  │ ⚠ ALERGIAS  │ │ 💊 FARMACOS │ │ 🏥 CRONICO  │              │
│  │ Pollo        │ │ Apoquel 16mg │ │ Dermatitis   │              │
│  │              │ │ diario       │ │ atopica      │              │
│  └──────────────┘ └──────────────┘ └──────────────┘              │
│                                                                    │
│  [🎙 Grabar consulta]  [📝 Nota rapida]  [📅 Agendar]  [⬇ PDF] │
└────────────────────────────────────────────────────────────────────┘
```

**Elementos criticos siempre visibles:**
- Nombre, raza, sexo, **edad calculada**, **peso actual** (con fecha del ultimo registro)
- Microchip si existe
- Dueno (nombre + link a perfil)
- **Cards de alerta**: alergias, farmacos activos, condiciones cronicas. Fondo rojo suave para alergias, azul para farmacos, naranja para cronico. Si no hay, no aparecen (no mostrar "Sin alergias registradas").
- **Barra de acciones** (siempre visible, no sticky bottom): 4 acciones principales

### 3.3. Layout de 2 columnas (desktop)

En desktop, usar layout de 2 columnas en vez de tabs secuenciales:

```
┌─────────────────────────┬──────────────────────────┐
│                         │                          │
│  COLUMNA IZQUIERDA      │  COLUMNA DERECHA         │
│  (Timeline clinica)     │  (Datos del paciente)    │
│                         │                          │
│  · Ultima consulta      │  · Signos vitales        │
│  · Nota del 10 abr      │  · Vacunas (status)      │
│  · Vacuna del 2 abr     │  · Habitos alimenticios  │
│  · Control del 15 mar   │  · Peso historico (graf) │
│  · ...                  │  · Documentos adjuntos   │
│                         │                          │
└─────────────────────────┴──────────────────────────┘
```

En mobile: stack vertical, datos primero (colapsable), timeline despues.

### 3.4. Columna izquierda: Timeline clinica unificada

Fusionar `TabHistorial` (notas del vet) con `medical_records` (registros del dueno/otros vets) en una **timeline cronologica unica**:

```
──── Abril 2026 ────────────────────────────
                                            
  12 abr  🎙 Consulta (grabada)            
          Control dermatitis. Piel mejorada,
          mantener Apoquel. Proximo control  
          en 2 semanas.                      
          Seguimiento: 26 abr               
                                            
  2 abr   💉 Vacuna antirabica              
          Lote: VR-2026-1842                 
          Prox. refuerzo: abr 2027           
                                            
──── Marzo 2026 ────────────────────────────
                                            
  15 mar  📋 Control general                
          Peso: 32 kg. Sin novedades.        
          [📎 Hemograma adjunto]             
```

**Filtros inline**: Todos / Consultas / Vacunas / Controles / Cirugias / Urgencias

Cada item es expandible (click para ver detalle completo + transcripcion si es grabada).

### 3.5. Columna derecha: Panel de datos del paciente

#### Seccion: Signos vitales (nuevo)

Card para registrar rapidamente signos en consulta:

```
┌─ Signos vitales ──────────────────────────┐
│                                            │
│  Peso: [32.0] kg    Temp: [__] °C         │
│  FC: [__] lpm       FR: [__] rpm          │
│  Condicion corp: [1-9 slider]             │
│                                            │
│  [Guardar signos]                          │
│                                            │
│  Ultimo registro: 12 abr · 32 kg · 38.5°C │
└────────────────────────────────────────────┘
```

- Se guarda como `medical_record` tipo `signos_vitales` (sincronizado con la vista del dueno)
- Peso se actualiza automaticamente en `pets.weight`
- Historial de peso como mini-grafico (sparkline, ultimos 6 registros)

#### Seccion: Vacunas

Vista compacta tipo checklist (no tab completo):

```
┌─ Vacunas ────────────────────────────────┐
│                                           │
│  ✅ Antirabica      · 2 abr 2026         │
│     Prox: abr 2027                        │
│  ✅ Sextuple        · 15 ene 2026        │
│     Prox: ene 2027                        │
│  ⚠️ Bordetella      · vencida (dic 2025) │
│  ⬜ Leptospira      · nunca aplicada     │
│                                           │
│  [+ Registrar vacuna]                     │
└───────────────────────────────────────────┘
```

Status: ✅ al dia / ⚠️ vencida o proxima / ⬜ sin registro

#### Seccion: Habitos y alimentacion

Resumen compacto (1-2 lineas) de lo que el dueno registro. No editable por el vet directamente (es data del dueno), pero visible:

```
Alimentacion: Royal Canin Dermacomfort, 2x dia, 250g
Actividad: Paseos 2x/dia, 30 min
Esterilizado: Si (2024)
```

#### Seccion: Documentos

Lista compacta de archivos adjuntos (examenes, imagenes, PDFs):

```
📎 Hemograma 15-mar-2026.pdf
📎 Ecografia abdominal 10-ene-2026.jpg
📎 Receta Apoquel.pdf
[+ Subir documento]
```

### 3.6. Barra de acciones: expandida

Reemplazar el VetActionsBar sticky de 3 botones por una barra de acciones mas completa integrada en el header (no sticky bottom, para liberar espacio mobile):

| Accion | Icono | Comportamiento |
|---|---|---|
| Grabar consulta | 🎙 Mic | Abre ConsultationRecorderModal |
| Nota rapida | 📝 Pencil | Abre VetNoteEditor inline (no modal si hay espacio) |
| Agendar seguimiento | 📅 Calendar | Mini-form: fecha + motivo |
| Registrar vacuna | 💉 Syringe | Form rapido: vacuna + lote + fecha + prox refuerzo |
| Signos vitales | ❤ Heart | Scroll a seccion signos vitales |
| PDF | ⬇ Download | Genera PDF (bypass gate para vet) |

En mobile: los 2 primeros (Grabar + Nota) como botones prominentes, el resto en menu "Mas acciones" (dropdown).

### 3.7. Que NO cambia

- Los datos se leen de las mismas tablas (`pets`, `medical_records`, `vet_clinical_notes`)
- Las mutaciones usan los mismos hooks existentes (`useCreateVetClinicalNote`, `useVetClinicalNotesByPet`)
- La ficha del dueno (`viewMode='owner'`) no se modifica
- El consolidado IA sigue disponible (boton en header)
- La generacion de PDF usa la misma funcion `generatePDF`

---

## 4. Nuevas features transversales

### 4.1. Estado del paciente (triage visual)

Agregar campo virtual (calculado, no en DB) para estado del paciente:

| Estado | Criterio | Color |
|---|---|---|
| **Nuevo** | Primera consulta hace < 30 dias | Azul |
| **Activo** | Ultima visita < 90 dias | Verde |
| **Seguimiento pendiente** | `followup_date` en los proximos 7 dias | Amarillo |
| **Seguimiento vencido** | `followup_date` pasada | Rojo |
| **Inactivo** | Ultima visita > 90 dias | Gris |

Se muestra como dot/indicator en la card y en el header de la ficha.

### 4.2. Busqueda global de pacientes

Agregar al panel de pacientes un shortcut de teclado (`Ctrl+K` / `Cmd+K`) que abre un command palette:

- Buscar por nombre de mascota, nombre de dueno, o raza
- Resultados muestran directamente los botones de accion (Ficha, Grabar, Nota)
- Navegar con teclado (flechas + Enter)

### 4.3. Historial de peso como grafico

En la ficha vet, mostrar un sparkline/mini-grafico con la evolucion de peso (ultimos 12 registros). Usa `Recharts` que ya esta en el proyecto (lazy-loaded).

---

## 5. Modelo de datos: cambios necesarios

### 5.1. Signos vitales

No se necesita tabla nueva. Usar `medical_records` con un tipo nuevo:

```sql
-- Agregar tipo 'vitals' al enum o manejarlo como string en record_type
-- Campos se guardan en el JSON existente 'notes' o en columnas:
ALTER TABLE medical_records
  ADD COLUMN IF NOT EXISTS vitals_data JSONB DEFAULT NULL;
-- vitals_data: { weight_kg, temp_c, heart_rate, respiratory_rate, body_condition_score }
```

### 5.2. Vacunas con lote y prox refuerzo

Ya pedido por Sofia (vet beta tester). Verificar si `medical_records` ya tiene campos para `lot_number` y `next_due_date` o si se necesitan:

```sql
ALTER TABLE medical_records
  ADD COLUMN IF NOT EXISTS lot_number TEXT,
  ADD COLUMN IF NOT EXISTS next_due_date DATE;
```

### 5.3. Ningun cambio en `vet_clinical_notes`

La tabla actual ya soporta todo lo necesario: `note_type`, `followup_date`, `followup_reason`, `raw_transcript`, `ai_summary`, `alternative_offered`, `alternatives_discussed`.

---

## 6. Archivos a crear/modificar

### Nuevos archivos

| Archivo | Descripcion |
|---|---|
| `src/pages/PetClinicalRecord/VetFichaView.tsx` | Layout 2 columnas para vista vet |
| `src/pages/PetClinicalRecord/VetClinicalTimeline.tsx` | Timeline unificada (notas + medical_records) |
| `src/pages/PetClinicalRecord/VetVitalsCard.tsx` | Card de signos vitales con form rapido |
| `src/pages/PetClinicalRecord/VetVaccinesCard.tsx` | Card de vacunas tipo checklist |
| `src/pages/PetClinicalRecord/VetPatientSidebar.tsx` | Columna derecha (datos del paciente) |
| `src/pages/PetClinicalRecord/VetActionsHeader.tsx` | Barra de acciones expandida (reemplaza VetActionsBar) |
| `src/components/provider/PatientCard.tsx` | Card individual de paciente para la lista V2 |
| `src/components/provider/PatientKPIBar.tsx` | Barra de KPIs del dia |
| `src/components/provider/QuickScheduleForm.tsx` | Mini-form para agendar seguimiento |
| `src/hooks/usePatientStatus.ts` | Hook para calcular estado del paciente (triage visual) |

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/ProviderPatients.tsx` | Refactor completo: KPIs + Cards + filtros + vista toggle |
| `src/pages/PetClinicalRecord/index.tsx` | Bifurcar render: si `viewMode='vet'` → `<VetFichaView>`, si `owner` → layout actual |
| `src/pages/PetClinicalRecord/VetActionsBar.tsx` | Deprecar a favor de `VetActionsHeader` |
| `src/hooks/useVetClinicalNotes.ts` | Agregar query para timeline unificada (notas + medical_records) |

---

## 7. Plan de ejecucion (fases)

### Fase 1: Panel de pacientes V2 (prioridad maxima)
1. Crear `PatientKPIBar` con metricas del dia
2. Crear `PatientCard` con alertas, edad, estado
3. Crear `usePatientStatus` hook
4. Refactorizar `ProviderPatients.tsx` con nuevo layout
5. Agregar filtro por estado + ordenamiento
6. Toggle cards/tabla con persistencia en localStorage
7. Mover solicitudes pendientes a banner colapsable

### Fase 2: Ficha clinica vet — layout 2 columnas
1. Crear `VetFichaView` como wrapper con layout 2-col
2. Crear `VetClinicalTimeline` fusionando historial + notas
3. Crear `VetPatientSidebar` con datos compactos
4. Crear `VetActionsHeader` (reemplaza sticky bottom)
5. Bifurcar `index.tsx` segun viewMode

### Fase 3: Features clinicas nuevas
1. Crear `VetVitalsCard` con form rapido de signos vitales
2. Crear `VetVaccinesCard` tipo checklist con lote/refuerzo
3. Crear `QuickScheduleForm` para agendar desde cualquier vista
4. Migracion SQL para `vitals_data` + `lot_number` + `next_due_date`

### Fase 4: Polish
1. Sparkline de peso (Recharts lazy)
2. Command palette `Ctrl+K` para busqueda rapida
3. Responsive testing (mobile tablet)
4. Animaciones de transicion entre vistas

---

## 8. Metricas de exito

| Metrica | Baseline actual | Objetivo |
|---|---|---|
| Clicks para ver estado de un paciente | 3-4 (buscar → expandir → leer) | 1 (card visible) |
| Tiempo para registrar consulta | ~8 clicks (ir a ficha → scroll → abrir modal) | 2 clicks (desde lista: boton Grabar) |
| Info visible sin scroll en ficha | Nombre + foto + CTA PDF | Nombre + peso + alergias + farmacos + cronico |
| Seguimientos vencidos visibles | Solo en tab clinico del dashboard | KPI en header + badge en cada card |
| Actions disponibles para vet en ficha | 3 (nota, grabar, documentos) | 6 (+ agendar, vacuna, signos vitales) |

---

## 9. Wireframes de referencia

### Panel de pacientes — Mobile

```
┌──────────────────────────┐
│  Mis Pacientes    [+ ☐]  │
│                          │
│  47 act · 3 hoy · 2 seg │
│                          │
│  🔔 3 solicitudes pend.  │
│                          │
│  [🔍 Buscar...        ]  │
│  [Estado ▾] [Especie ▾]  │
│                          │
│  ┌──────────────────────┐│
│  │ 🟡 Kai · 4a 2m      ││
│  │ Pastor Suizo · Pedro ││
│  │ ⚠ pollo · 💊 Apoquel││
│  │ Seguim: 20 abr       ││
│  │ [🎙] [📝] [📊] [→]  ││
│  └──────────────────────┘│
│                          │
│  ┌──────────────────────┐│
│  │ 🟢 Luna · 2a        ││
│  │ Gato · Maria L.     ││
│  │ Sin alertas          ││
│  │ Ult: hace 1 sem      ││
│  │ [🎙] [📝] [📊] [→]  ││
│  └──────────────────────┘│
└──────────────────────────┘
```

### Ficha vet — Desktop

```
┌─────────────────────────────────────────────────────────────┐
│  ← Pacientes / Kai / Ficha clinica                         │
│                                                             │
│  [🐕 Avatar]  KAI · Pastor Suizo · M · 4a 2m · 32 kg     │
│               Chip: 956000012345678 · Pedro Susaeta         │
│                                                             │
│  ┌─⚠ ALERGIAS──┐ ┌─💊 FARMACOS──┐ ┌─🏥 CRONICO──┐       │
│  │ Pollo        │ │ Apoquel 16mg │ │ Dermatitis  │       │
│  └──────────────┘ │ 1x/dia       │ │ atopica     │       │
│                   └──────────────┘ └─────────────┘       │
│                                                             │
│  [🎙 Grabar] [📝 Nota] [📅 Agendar] [💉 Vacuna] [⬇ PDF] │
├────────────────────────────┬────────────────────────────────┤
│                            │                                │
│  TIMELINE CLINICA          │  DATOS DEL PACIENTE            │
│  [Todos ▾]                 │                                │
│                            │  ┌─ Signos vitales ──────────┐│
│  ── Abril 2026 ──          │  │ Peso: 32 kg  Temp: 38.5°C ││
│                            │  │ FC: 80 lpm   FR: 18 rpm   ││
│  12 abr 🎙 Consulta       │  │ CC: 6/9                    ││
│  Control dermatitis.       │  │ [+ Registrar]              ││
│  Piel mejorada...          │  └────────────────────────────┘│
│  Seguim: 26 abr            │                                │
│                            │  ┌─ Vacunas ─────────────────┐│
│  2 abr 💉 Antirabica      │  │ ✅ Antirabica  · abr 2026 ││
│  Lote: VR-2026-1842       │  │ ✅ Sextuple   · ene 2026  ││
│  Prox: abr 2027            │  │ ⚠️ Bordetella · vencida   ││
│                            │  │ [+ Registrar vacuna]       ││
│  ── Marzo 2026 ──          │  └────────────────────────────┘│
│                            │                                │
│  15 mar 📋 Control         │  ┌─ Alimentacion ────────────┐│
│  Peso: 32 kg.              │  │ Royal Canin Dermacomfort  ││
│  📎 Hemograma.pdf          │  │ 2x/dia, 250g              ││
│                            │  │ Esterilizado: Si (2024)   ││
│                            │  └────────────────────────────┘│
│                            │                                │
│                            │  ┌─ Documentos ──────────────┐│
│                            │  │ 📎 Hemograma 15-mar.pdf   ││
│                            │  │ 📎 Ecografia 10-ene.jpg   ││
│                            │  │ [+ Subir documento]        ││
│                            │  └────────────────────────────┘│
└────────────────────────────┴────────────────────────────────┘
```

### Ficha vet — Mobile

```
┌──────────────────────────┐
│  ← Kai · Ficha clinica   │
│                          │
│  🐕 KAI · 4a 2m · 32 kg │
│  Pastor Suizo · M        │
│                          │
│  ⚠ Pollo · 💊 Apoquel   │
│  🏥 Dermatitis atopica   │
│                          │
│  [🎙 Grabar] [📝 Nota]  │
│  [Mas acciones ▾]        │
│                          │
│  ▸ Datos del paciente    │
│  (colapsable, toca para  │
│   expandir signos, vacs) │
│                          │
│  ── Timeline ──          │
│  12 abr 🎙 Consulta...  │
│  2 abr  💉 Antirabica   │
│  15 mar 📋 Control...   │
│                          │
└──────────────────────────┘
```

---

## 10. Consideraciones tecnicas

### Sincronizacion ficha dueno ↔ vet

- **Peso**: cuando el vet guarda signos vitales → actualiza `pets.weight` + crea `medical_record`. El dueno ve el peso actualizado instantaneamente.
- **Vacunas**: mismo mecanismo actual de `medical_records` tipo vacuna. Visible en ambas vistas.
- **Notas clinicas**: `vet_clinical_notes` ya esta integrada en `TabHistorial` del dueno (solo lectura para el dueno).
- **Documentos**: tabla `pet_documents` o adjuntos en `medical_records`. Visibles en ambas vistas.

### Performance

- La timeline unificada necesita fusionar 2 queries (`medical_records` + `vet_clinical_notes`). Hacerlo client-side con `useMemo` es suficiente (ambos datasets < 200 rows por mascota).
- Las KPIs del panel se calculan a partir de datos ya en cache (no nuevas queries).
- El sparkline de peso usa Recharts lazy-loaded (ya existe el chunk split).

### Compatibilidad mobile

- Layout 2 columnas usa CSS Grid con `grid-cols-1 lg:grid-cols-[1fr_380px]`
- Seccion de datos en mobile es un `Collapsible` (expandir/colapsar)
- Touch targets: minimo 44x44px para todos los botones de accion
- El `VetActionsHeader` en mobile se convierte en 2 botones + dropdown "Mas"
