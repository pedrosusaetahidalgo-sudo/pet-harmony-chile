# Propuestas de Funcionalidades — Paw Friend

> Documento validado contra el codigo real el 2026-04-11.
> Cada propuesta fue verificada leyendo los archivos involucrados.
> Las que tenian riesgos o supuestos falsos fueron descartadas.

---

## Como usar este documento

1. Lee las propuestas
2. Responde con los numeros que quieres (ej: "P1, P2, P4")
3. Claude Code las implementa en orden, una por una
4. Cada una se puede testear con `npm run dev` inmediatamente

---

## PARTE 1: Estado actual verificado

### B2C — 25 funcionalidades activas para duenos
### B2B — 16 funcionalidades activas para veterinarios
### 21 Edge Functions + cron diario
### 88 migraciones SQL

(Ver MAPA_FUNCIONAL_COMPLETO.md para el detalle completo)

---

## PARTE 2: Propuestas validadas y seguras

Cada propuesta fue verificada leyendo el codigo real. Se indica:
- **Riesgo**: que puede salir mal
- **Prerequisitos**: que necesita existir antes
- **Archivos exactos**: con numeros de linea reales
- **Complejidad real**: basada en lo que se vio en el codigo

---

### P1. Busqueda y filtro en historial medico
**Para**: Duenos | **Complejidad**: Baja | **Riesgo**: Ninguno

**Que es**: Input de busqueda + dropdown filtro por tipo de registro en Tab Historial de la ficha clinica. Filtrado 100% client-side sobre datos ya cargados en memoria.

**Validacion del codigo**:
- `TabHistorial.tsx` tiene 165 lineas, renderiza con `.map()` sobre array agrupado por ano
- NO tiene ninguna busqueda ni filtro actualmente
- Cada registro tiene: `record_type`, `title`, `description`, `clinic_name`, `veterinarian_name`, `date`
- No toca backend, no toca hooks, no toca DB

**Donde va exactamente**:
- `src/pages/PetClinicalRecord/tabs/TabHistorial.tsx`
  - Agregar arriba del map de anos (~linea 44): un `<Input placeholder="Buscar..." />` + `<Select>` de tipo de registro
  - Agregar estado local: `const [search, setSearch] = useState("")` y `const [filterType, setFilterType] = useState("all")`
  - Filtrar `records` antes del `groupBy`: `.filter(r => matchesSearch && matchesType)`
  - Componentes UI: `Input` y `Select` de shadcn (ya instalados)

**Que NO tocar**: `useMedicalRecords.tsx`, ninguna query de Supabase, ninguna tabla.

---

### P2. Snooze de recordatorios vencidos
**Para**: Duenos | **Complejidad**: Baja | **Riesgo**: Ninguno

**Que es**: Botones "Posponer 1 dia" y "Posponer 1 semana" en cada recordatorio vencido.

**Validacion del codigo**:
- `Reminders.tsx` (247 lineas) tiene seccion "Vencidos" con cards en rosa/rojo
- Cada `ReminderCard` (~linea 234) tiene solo 2 controles: click card (navega a ficha) + boton CheckCircle2 (completar)
- El schema tiene `due_date: string` en la interfaz `Reminder` (useReminders.tsx:7-21)
- `useReminders.tsx` (99 lineas) ya tiene mutation `completeReminder` con patron `.update().eq('id', id)` (lineas 73-85)
- Snooze es identico: `.update({ due_date: nuevaFecha }).eq('id', id)`

**Donde va exactamente**:
- `src/hooks/useReminders.tsx`:
  - Agregar mutation `snoozeReminder(id: string, days: number)` — UPDATE `due_date` sumando dias con `addDays` de date-fns
  - Patron copiado de `completeReminder` (lineas 73-85), cambiando el campo
- `src/pages/Reminders.tsx`:
  - En `ReminderCard` (~linea 234): agregar `DropdownMenu` de shadcn al lado del CheckCircle2
  - Items: "Posponer 1 dia", "Posponer 1 semana"
  - Mostrar solo cuando el recordatorio esta vencido

**Que NO tocar**: No requiere migracion. `due_date` ya existe y es editable. No tocar la logica de `completeReminder`.

---

### P3. Tips estacionales de cuidado
**Para**: Duenos | **Complejidad**: Baja | **Riesgo**: Ninguno

**Que es**: Card en Home con consejos segun epoca del ano y especie. Todo frontend, data estatica, cero backend.

**Validacion del codigo**:
- `Home.tsx` tiene 628 lineas con ~15 secciones
- Patron existente: `PriceEstimatorCard` y `WeeklyReportCard` son cards importadas y posicionadas
- La mascota seleccionada ya esta disponible con su `species` en el state del componente
- Hemisferio sur Chile: Abr-Sep = otono/invierno, Oct-Mar = primavera/verano

**Donde va exactamente**:
- `src/lib/seasonalTips.ts` — **archivo nuevo**:
  - Objeto con 4 estaciones x tips por especie (al menos perro, gato, conejo, hamster)
  - Ejemplos: "Invierno + Perro: Revisa almohadillas despues de paseos en lluvia"
  - "Verano + Gato: Asegurate de tener agua fresca disponible todo el dia"
- `src/components/home/SeasonalTipsCard.tsx` — **archivo nuevo**:
  - Recibe `species: string` como prop
  - Calcula estacion con `new Date().getMonth()` (invertir para hemisferio sur)
  - Muestra 2-3 tips relevantes
  - Usa `Card` + `CardContent` + icono Leaf o Sun de lucide
- `src/pages/Home.tsx`:
  - Importar `SeasonalTipsCard`
  - Insertar despues de `WeeklyReportCard` (~linea 484)

**Que NO tocar**: No backend, no DB, no hooks existentes, no modificar nada de Home excepto agregar el import y el JSX.

---

### P4. Agenda del dia para veterinarios
**Para**: Vets | **Complejidad**: Media-baja | **Riesgo**: Bajo

**Que es**: Card al inicio del dashboard vet mostrando reservas agendadas para hoy.

**Validacion del codigo**:
- `ProviderDashboard.tsx` (280 lineas) ya tiene `stats.bookingsThisMonth` como numero pero NO lista de reservas
- La tabla `bookings` existe (referenciada en multiples migraciones y hooks)
- Primera seccion actual: `VetFollowupsCard` (linea 114)
- Ya importa `Calendar` icon y componentes Card de shadcn

**Donde va exactamente**:
- `src/components/provider/TodayAgendaCard.tsx` — **archivo nuevo**:
  - Query propia a `bookings` filtrando `booking_date = today` + `provider_id`
  - Join con `pets(name, species, photo_url)` para mostrar info mascota
  - Cada fila: hora, nombre mascota, tipo consulta, Link a ficha
  - Sin reservas: "Sin citas para hoy" con icono Calendar
  - Patron visual identico a `VetFollowupsCard`
- `src/components/provider/ProviderDashboard.tsx`:
  - Importar `TodayAgendaCard`
  - Insertar ANTES de `VetFollowupsCard` (~linea 113)

**Riesgo bajo**: Componente nuevo aislado con su propia query. Si la query falla o no hay datos, muestra estado vacio elegante. No modifica nada existente excepto 2 lineas (import + JSX).

**Que NO tocar**: No modificar `useProviderDashboardStats`. No tocar `VetFollowupsCard` ni `SharedFichasCard`.

---

### P5. Badge "Atiende hoy" en directorio de vets
**Para**: Duenos + Vets | **Complejidad**: Media-baja | **Riesgo**: Bajo

**Que es**: Badge verde "Atiende hoy" en el listado publico del directorio.

**Validacion del codigo**:
- Tabla `provider_availability` EXISTE (migracion `20251201165005`, columnas: `user_id`, `date`, `provider_type`)
- Ya se usa en `ServiceDirectory.tsx:611` y `ServiceAvailabilityCalendar.tsx:77`
- PERO `useDirectoryVets.tsx` NO fetchea availability (solo `select('*')` de `service_providers`)
- El card del listado publico se renderiza dentro de `DirectorioVets.tsx`, NO en `ProviderDirectoryCard.tsx` (ese es el card del propio vet en su dashboard)

**Donde va exactamente**:
- `src/hooks/useDirectoryVets.tsx`:
  - Agregar query secundaria a `provider_availability` para los IDs del resultado actual
  - Filtrar por `date = today` para determinar quienes atienden hoy
  - Agregar `attendsToday: boolean` al objeto de cada vet retornado
- `src/pages/DirectorioVets.tsx`:
  - En el card de cada vet: `{vet.attendsToday && <Badge className="bg-green-100 text-green-700">Atiende hoy</Badge>}`

**Riesgo bajo**: Badge condicional. Si `attendsToday` es false o undefined, no se renderiza. No afecta el listado existente.

**Que NO tocar**: No modificar `ProviderDirectoryCard.tsx` (es otro componente).

---

### P6. Recordatorios recurrentes automaticos
**Para**: Duenos | **Complejidad**: Media-baja | **Riesgo**: Bajo

**Que es**: Al completar un recordatorio, crear automaticamente el proximo segun el protocolo de la especie.

**Validacion del codigo** (hallazgo clave):
- La tabla `pet_reminders` YA TIENE columnas `is_recurring BOOLEAN` y `recurrence_interval TEXT` (migracion `20260402000000`, lineas 44-45)
- Valores BD permitidos: `'weekly'`, `'monthly'`, `'quarterly'`, `'biannual'`, `'yearly'`
- `reminderTypes.ts` tiene `defaultRecurrence` por tipo PERO usa valores incorrectos: `"3months"` y `"6months"` que NO coinciden con la BD
- Mapeo necesario: `"3months" -> "quarterly"`, `"6months" -> "biannual"`

**Donde va exactamente**:
- `src/lib/reminderTypes.ts`:
  - Corregir `defaultRecurrence`: cambiar `"3months"` a `"quarterly"` y `"6months"` a `"biannual"`
  - Agregar helper `recurrenceToMonths(interval: string): number` para calcular dias
- `src/hooks/useReminders.tsx`:
  - En la mutation `completeReminder` (lineas 73-85), despues del UPDATE exitoso:
  - Si el recordatorio tiene `is_recurring === true` y `recurrence_interval`:
    - Calcular nueva `due_date` con `addMonths`/`addWeeks` de date-fns
    - INSERT nuevo recordatorio con la nueva fecha
  - Invalidar queries para que se refresque la lista
- `src/pages/Reminders.tsx`:
  - Despues de completar con recurrencia, mostrar toast: "Proximo recordatorio creado para {fecha}"

**Riesgo bajo**: La recurrencia es un INSERT nuevo, no modifica el completado. Si el INSERT falla, el recordatorio original queda completado normalmente (comportamiento actual sin cambios).

**Que NO tocar**: No crear migracion (las columnas ya existen). No modificar la estructura de la tabla.

---

### P7. Vista rapida de paciente para vets
**Para**: Vets | **Complejidad**: Media | **Riesgo**: Bajo

**Que es**: Panel lateral (Sheet) que muestra resumen del paciente al hacer click, sin navegar fuera del dashboard.

**Validacion del codigo**:
- `VetPatientsList.tsx` (221 lineas): cada paciente es un `div` con Avatar + nombre + especie
- Click actual: solo un `<Link>` a ficha completa (linea 206). No hay click en la fila
- Data por paciente: `pet_id`, `pet_name`, `species`, `photo_url`, `last_visit`, `source`
- Sheet de shadcn esta en `ui/sheet.tsx` pero NO se usa en componentes provider

**Donde va exactamente**:
- `src/components/provider/PatientQuickView.tsx` — **archivo nuevo**:
  - `Sheet` + `SheetContent` + `SheetHeader` de shadcn
  - Props: `petId: string | null`, `open: boolean`, `onClose: () => void`
  - Queries internas:
    - `pets` filtrado por `id` para nombre, especie, alergias, medicamentos
    - `medical_records` con `limit(5).order('date', { ascending: false })` para ultimos registros
  - Boton "Ver ficha completa" → Link a `/mascota/:id/ficha-clinica`
- `src/components/provider/VetPatientsList.tsx`:
  - State: `const [selectedPetId, setSelectedPetId] = useState<string | null>(null)`
  - `onClick` en cada fila: `setSelectedPetId(patient.pet_id)`
  - Agregar `<PatientQuickView>` al final del componente

**Riesgo bajo**: Sheet es overlay, no afecta layout. El Link existente a ficha completa sigue funcionando identico.

**Que NO tocar**: No cambiar la query principal de pacientes. No tocar el Link existente de "Ver ficha".

---

### P8. Fix export CSV del Panel Pro
**Para**: Vets | **Complejidad**: Baja-media | **Riesgo**: Bajo

**Que es**: Implementar descarga CSV real (hoy es placeholder con boton visible pero sin funcion).

**Validacion del codigo**:
- `ProDashboard.tsx` (479 lineas), `handleExport` en lineas 132-135 es un stub confirmado:
  ```ts
  const handleExport = (format: string) => {
    track({ event: EVENTS.PRO_PANEL_EXPORT_CLICKED, properties: { format } });
    // Export functionality — placeholder for future implementation
  };
  ```
- Botones PDF y CSV visibles (lineas 415-433), gateados por `LockedOverlay` segun plan
- Data disponible: `analytics.summary`, `analytics.activityTimeline`, `analytics.periodComparison`, `vetData.summary`

**Donde va exactamente**:
- `src/pages/ProDashboard.tsx`:
  - Reemplazar cuerpo de `handleExport` (~linea 132):
  - Si `format === "csv"`:
    - Serializar datos como CSV (headers + rows)
    - Descargar con `Blob` + `URL.createObjectURL` + click en `<a>` temporal
    - Sin dependencias nuevas (todo nativo del browser)
  - Si `format === "pdf"`: toast "Proximamente — estamos trabajando en esta funcion"
  - Mantener el evento analytics existente

**Que NO tocar**: No agregar dependencias. No modificar `useProAnalytics` ni `useVetAnalytics`. No cambiar el gating de `LockedOverlay`.

---

## PROPUESTAS DESCARTADAS (con razon)

| Propuesta original | Por que se descarto |
|---|---|
| **Grafico de peso** | `medical_records` NO tiene columna `weight`. Requiere migracion + cambio en form + types. Demasiado invasivo. |
| **Resumen de gastos medicos** | No existe campo `cost`/`price` en `medical_records`. Sin datos no hay feature. |
| **Mensaje al dueno desde nota clinica** | `VetNoteEditor` no recibe `ownerId` en props + `useStartConversation` tiene guard de follow mutuo que bloquea vet→dueno. Riesgo medio-alto. |
| **Vet favorito** | Requiere migracion nueva (tabla). Buena idea pero necesita sesion dedicada con Pedro aplicando la migracion. |

---

## PARTE 3: Matriz de decision

| # | Propuesta | Complejidad | Valor | Archivos nuevos | Migracion? |
|---|---|---|---|---|---|
| **P1** | Busqueda en historial | Baja | Alto dueno | 0 | No |
| **P2** | Snooze recordatorios | Baja | Alto dueno | 0 | No |
| **P3** | Tips estacionales | Baja | Medio dueno | 2 | No |
| **P4** | Agenda del dia vet | Media-baja | Alto vet | 1 | No |
| **P5** | Badge "Atiende hoy" | Media-baja | Alto ambos | 0 | No |
| **P6** | Recordatorios recurrentes | Media-baja | Alto dueno | 0 | No |
| **P7** | Vista rapida paciente | Media | Alto vet | 1 | No |
| **P8** | Fix export CSV | Baja-media | Medio vet | 0 | No |

### Orden recomendado:

**Bloque 1 — Zero risk, alto impacto** (solo editan 1-2 archivos existentes, cero archivos nuevos):
- P1 → Busqueda en historial medico
- P2 → Snooze de recordatorios

**Bloque 2 — Riesgo bajo, valor alto** (agregan componentes nuevos aislados):
- P4 → Agenda del dia vet
- P6 → Recordatorios recurrentes
- P3 → Tips estacionales

**Bloque 3 — Medio esfuerzo, buen complemento**:
- P5 → Badge "Atiende hoy"
- P7 → Vista rapida paciente
- P8 → Fix export CSV

---

## Instrucciones para ejecutar en otro chat

Copiar este bloque al iniciar la sesion de implementacion:

```
Implementar las propuestas seleccionadas del archivo _pending/PROPUESTAS_FUNCIONALIDADES.md.

Reglas:
1. Leer CLAUDE.md primero (reglas del proyecto)
2. Leer el archivo de cada propuesta ANTES de editarlo
3. Una propuesta a la vez, en el orden indicado
4. Despues de cada una: verificar con npx tsc -b que no hay errores de tipos
5. NO crear migraciones SQL a menos que la propuesta lo indique explicitamente
6. NO instalar dependencias nuevas (npm install)
7. NO modificar archivos que la propuesta marque como "Que NO tocar"
8. Usar componentes shadcn/ui ya existentes (Input, Select, Badge, Card, Sheet, DropdownMenu)
9. Copy en espanol chileno (tuteo: tu, tienes, puedes — NO voseo)
10. Al terminar todas: npm run build para verificar que compila limpio
11. NO hacer commit automaticamente — esperar instruccion del usuario

Propuestas a implementar: [PEGAR NUMEROS AQUI, ej: P1, P2, P4, P6]
```

---

## Tu turno

Responde con los numeros. Ejemplo: "P1, P2, P4" o "Todo el bloque 1 y 2" o "Todas"
