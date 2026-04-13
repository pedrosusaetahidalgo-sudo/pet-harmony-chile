# Rutinas Semanales + Calendario Unificado por Mascota

> Especificacion funcional para implementar rutinas recurrentes del animal con alertas de notificacion y un calendario unificado con todo lo planificado.
> Fecha: 2026-04-12

---

## 1. Problema que resuelve

Hoy un dueno puede crear recordatorios puntuales (vacuna, control, medicamento) y ver reservas con proveedores, pero **no puede definir la rutina semanal de su mascota** (paseos, comidas, medicacion diaria, bano, etc.) ni ver **todo** en un solo calendario unificado. El dueno necesita:

1. Definir rutinas semanales recurrentes por mascota (paseo lunes/miercoles/viernes a las 8am, medicacion diaria a las 9pm, bano cada sabado, etc.)
2. Recibir alertas/notificaciones cuando toca cada actividad
3. Ver en **un solo calendario** todas las actividades planificadas: rutinas + recordatorios + reservas + citas vet

---

## 2. Lo que ya existe (punto de partida)

| Componente | Estado actual | Reutilizable |
|---|---|---|
| `pet_reminders` (tabla) | Recordatorios con recurrencia (weekly/monthly/etc), tipos limitados | Si, como fuente de datos del calendario |
| `useReminders` (hook) | CRUD completo + snooze + complete con auto-next | Si, se consultara para el calendario |
| `Reminders.tsx` (pagina) | Lista agrupada por urgencia | No reemplazar, complementar |
| `MyBookings.tsx` (pagina) | Calendario mensual de slots de proveedores | Parcialmente — el `CalendarGrid` se puede reutilizar |
| `CalendarGrid.tsx` | Grid mensual con indicadores por dia | Si, extender para mostrar mas tipos de evento |
| `notifications` (tabla) | Notificaciones in-app con tipos | Si, agregar nuevos tipos |
| `useNotifications` (hook) | Read/markRead | Si |
| `reminder-cron` (edge function) | Escanea recordatorios proximos y envia WhatsApp | Extender para incluir rutinas |
| Push nativo (Capacitor) | Registra token + muestra toasts | Si |
| Google Calendar sync | Sincroniza reminders y appointments | Extender para rutinas |

---

## 3. Modelo de datos

### 3.1. Nueva tabla: `pet_routines`

```sql
CREATE TABLE pet_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Que actividad
  category TEXT NOT NULL CHECK (category IN (
    'paseo',          -- Paseo / caminata
    'comida',         -- Alimentacion
    'medicacion',     -- Medicacion diaria/periodica
    'higiene',        -- Bano, cepillado, limpieza dental, oidos
    'entrenamiento',  -- Sesion de entrenamiento / obediencia
    'juego',          -- Tiempo de juego / ejercicio
    'suplemento',     -- Vitaminas, probioticos, etc.
    'otro'            -- Personalizado
  )),
  title TEXT NOT NULL,              -- ej: "Paseo matutino", "Omeprazol 10mg"
  description TEXT,                 -- Notas libres
  icon TEXT,                        -- Emoji o icono lucide (opcional, default por categoria)

  -- Cuando (patron semanal)
  days_of_week INTEGER[] NOT NULL,  -- 0=domingo, 1=lunes ... 6=sabado. Ej: {1,3,5} = L/Mi/V
  time_of_day TIME NOT NULL,        -- Hora del dia, ej: '08:00'
  duration_minutes INTEGER,         -- Duracion estimada (opcional, para bloqueo en calendario)

  -- Alertas
  notify_before_minutes INTEGER DEFAULT 15,  -- Notificar N min antes (0 = sin alerta)
  notify_channels TEXT[] DEFAULT '{in_app}',  -- '{in_app}', '{in_app,push}', '{in_app,push,whatsapp}'

  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,  -- Desde cuando aplica
  ends_on DATE,                                   -- Hasta cuando (null = indefinido)

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_pet_routines_owner ON pet_routines(owner_id);
CREATE INDEX idx_pet_routines_pet ON pet_routines(pet_id);
CREATE INDEX idx_pet_routines_active ON pet_routines(owner_id) WHERE is_active = true;

-- RLS
ALTER TABLE pet_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their pet routines"
  ON pet_routines FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
```

### 3.2. Nueva tabla: `routine_completions` (log de cumplimiento)

```sql
CREATE TABLE routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES pet_routines(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,       -- Dia que se completo
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,                         -- Nota opcional ("hoy camino 3km", "vomito la pastilla")
  skipped BOOLEAN NOT NULL DEFAULT false,  -- Marcado como saltado (con razon)
  skip_reason TEXT,

  UNIQUE(routine_id, completed_date)  -- Maximo 1 registro por rutina por dia
);

CREATE INDEX idx_routine_completions_routine ON routine_completions(routine_id);
CREATE INDEX idx_routine_completions_date ON routine_completions(completed_date DESC);

ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage routine completions"
  ON routine_completions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pet_routines r
      WHERE r.id = routine_completions.routine_id
      AND r.owner_id = auth.uid()
    )
  );
```

### 3.3. Extender `external_calendar_events`

Agregar soporte para rutinas en la tabla existente:

```sql
-- Permitir 'routine' como source_type
ALTER TABLE external_calendar_events
  DROP CONSTRAINT IF EXISTS external_calendar_events_source_type_check;

ALTER TABLE external_calendar_events
  ADD CONSTRAINT external_calendar_events_source_type_check
  CHECK (source_type IN ('pet_reminder', 'appointment', 'routine'));
```

---

## 4. Arquitectura de componentes

### 4.1. Nuevos archivos a crear

```
src/
  hooks/
    useRoutines.ts              -- CRUD + completions de rutinas
    useUnifiedCalendar.ts       -- Agrega rutinas + reminders + bookings en un solo feed

  pages/
    PetRoutines.tsx             -- Pagina de gestion de rutinas por mascota
    UnifiedCalendar.tsx         -- Calendario unificado con todo lo planificado

  components/
    routines/
      RoutineForm.tsx           -- Dialog/sheet para crear/editar rutina
      RoutineCard.tsx           -- Card de una rutina con toggle completar hoy
      RoutineWeekView.tsx       -- Vista semanal de rutinas (grilla L-D)
      DaySelector.tsx           -- Selector de dias de la semana (chips toggleables)
      TimePickerSimple.tsx      -- Selector de hora (si no hay uno en shadcn/ui)

    calendar/
      UnifiedDayView.tsx        -- Vista de un dia con todos los eventos mezclados
      CalendarEventCard.tsx     -- Card generica que renderiza rutina, reminder o booking
      CalendarFilters.tsx       -- Filtros por tipo de evento y por mascota
```

### 4.2. Nuevas rutas (agregar en `App.tsx`)

```tsx
// Protegidas
'/rutinas'                     // Lista de rutinas del usuario
'/mascota/:petId/rutinas'      // Rutinas de una mascota especifica
'/calendario'                  // Calendario unificado
```

---

## 5. Hook: `useRoutines.ts`

### Interface

```typescript
interface Routine {
  id: string;
  pet_id: string;
  owner_id: string;
  category: RoutineCategory;
  title: string;
  description: string | null;
  icon: string | null;
  days_of_week: number[];       // [0..6]
  time_of_day: string;          // "HH:mm"
  duration_minutes: number | null;
  notify_before_minutes: number;
  notify_channels: string[];
  is_active: boolean;
  starts_on: string;
  ends_on: string | null;
  created_at: string;
  pets?: { name: string; species: string; photo_url: string | null };
}

type RoutineCategory =
  | 'paseo' | 'comida' | 'medicacion' | 'higiene'
  | 'entrenamiento' | 'juego' | 'suplemento' | 'otro';

interface RoutineCompletion {
  id: string;
  routine_id: string;
  completed_date: string;
  completed_at: string;
  notes: string | null;
  skipped: boolean;
  skip_reason: string | null;
}

// Hook return
interface UseRoutinesReturn {
  routines: Routine[];
  isLoading: boolean;
  addRoutine: UseMutationResult;
  updateRoutine: UseMutationResult;
  deleteRoutine: UseMutationResult;
  toggleActive: UseMutationResult;
  completeToday: UseMutationResult;      // Marca como hecha hoy
  skipToday: UseMutationResult;          // Marca como saltada hoy
  getCompletionsForDate: (date: string) => RoutineCompletion[];
  completionRate: (routineId: string, days: number) => number; // % cumplimiento ultimos N dias
}
```

### Queries clave

```typescript
// Traer rutinas activas del usuario con datos de mascota
const fetchRoutines = async (userId: string) => {
  const { data } = await supabase
    .from('pet_routines')
    .select('*, pets(name, species, photo_url)')
    .eq('owner_id', userId)
    .eq('is_active', true)
    .order('time_of_day', { ascending: true });
  return data;
};

// Traer completions de un rango de fechas
const fetchCompletions = async (routineIds: string[], from: string, to: string) => {
  const { data } = await supabase
    .from('routine_completions')
    .select('*')
    .in('routine_id', routineIds)
    .gte('completed_date', from)
    .lte('completed_date', to);
  return data;
};
```

---

## 6. Hook: `useUnifiedCalendar.ts`

Combina **tres fuentes** en un solo feed ordenado por fecha/hora:

```typescript
interface CalendarEvent {
  id: string;
  type: 'routine' | 'reminder' | 'booking';
  title: string;
  description: string | null;
  pet_name: string;
  pet_id: string;
  date: string;           // YYYY-MM-DD
  time: string | null;    // HH:mm (null si es all-day)
  duration_minutes: number | null;
  status: 'pending' | 'completed' | 'skipped' | 'overdue';
  category: string;       // Tipo especifico (paseo, vaccine, vet, grooming...)
  color: string;          // Color para el calendario
  source_id: string;      // ID en tabla origen
  is_recurring: boolean;
}

interface UseUnifiedCalendarReturn {
  events: CalendarEvent[];
  isLoading: boolean;
  eventsForDate: (date: string) => CalendarEvent[];
  eventsForMonth: (year: number, month: number) => CalendarEvent[];
  datesWithEvents: (year: number, month: number) => Set<string>; // Para pintar dots en CalendarGrid
}
```

### Logica de merge

```typescript
function buildCalendarEvents(
  routines: Routine[],
  completions: RoutineCompletion[],
  reminders: Reminder[],
  bookings: VetBooking[],
  dateRange: { from: Date; to: Date }
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // 1. Expandir rutinas en el rango de fechas
  for (const routine of routines) {
    for (let d = dateRange.from; d <= dateRange.to; d = addDays(d, 1)) {
      const dow = d.getDay(); // 0=dom
      if (!routine.days_of_week.includes(dow)) continue;
      if (d < new Date(routine.starts_on)) continue;
      if (routine.ends_on && d > new Date(routine.ends_on)) continue;

      const dateStr = format(d, 'yyyy-MM-dd');
      const completion = completions.find(
        c => c.routine_id === routine.id && c.completed_date === dateStr
      );

      events.push({
        id: `routine-${routine.id}-${dateStr}`,
        type: 'routine',
        title: routine.title,
        description: routine.description,
        pet_name: routine.pets?.name ?? '',
        pet_id: routine.pet_id,
        date: dateStr,
        time: routine.time_of_day,
        duration_minutes: routine.duration_minutes,
        status: completion
          ? (completion.skipped ? 'skipped' : 'completed')
          : (isPast(d) ? 'overdue' : 'pending'),
        category: routine.category,
        color: ROUTINE_COLORS[routine.category],
        source_id: routine.id,
        is_recurring: true,
      });
    }
  }

  // 2. Reminders (ya vienen con fecha, mapear directo)
  for (const r of reminders) {
    events.push({
      id: `reminder-${r.id}`,
      type: 'reminder',
      title: r.title,
      description: r.description,
      pet_name: r.pets?.name ?? '',
      pet_id: r.pet_id,
      date: r.due_date,
      time: null, // Reminders son all-day
      duration_minutes: null,
      status: r.is_completed ? 'completed' : (isPast(new Date(r.due_date)) ? 'overdue' : 'pending'),
      category: r.type,
      color: REMINDER_COLORS[r.type],
      source_id: r.id,
      is_recurring: r.is_recurring,
    });
  }

  // 3. Bookings / citas
  for (const b of bookings) {
    events.push({
      id: `booking-${b.id}`,
      type: 'booking',
      title: `Cita: ${b.service_type}`,
      description: b.symptoms,
      pet_name: '', // Resolver desde pet_id
      pet_id: b.pet_id,
      date: format(new Date(b.scheduled_date), 'yyyy-MM-dd'),
      time: format(new Date(b.scheduled_date), 'HH:mm'),
      duration_minutes: 60,
      status: b.status === 'completado' ? 'completed'
            : b.status === 'cancelado' ? 'skipped'
            : 'pending',
      category: b.service_type,
      color: '#6366f1',
      source_id: b.id,
      is_recurring: false,
    });
  }

  return events.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return (a.time ?? '23:59').localeCompare(b.time ?? '23:59');
  });
}
```

---

## 7. Pantallas y UX

### 7.1. Pagina: Rutinas (`/rutinas`)

**Layout**:
```
+--------------------------------------------------+
| PageHeader: "Rutinas de tus mascotas"    [+ Nueva]|
+--------------------------------------------------+
| Tabs: [Kai]  [Luna]  [Todas]                     |
+--------------------------------------------------+
| Vista semanal (RoutineWeekView)                   |
|                                                    |
|        L    M    Mi   J    V    S    D             |
| 08:00  Paseo     Paseo     Paseo                  |
| 09:00                                              |
| ...                                                |
| 21:00  Omeprazol (todos los dias)                  |
+--------------------------------------------------+
| Lista de rutinas (RoutineCard x N)                |
|                                                    |
| [Paseo matutino]  L Mi V 08:00  [Hecho hoy v]    |
| [Omeprazol 10mg]  Diario 21:00  [Hecho hoy v]    |
| [Bano]             Sabado 10:00  [ ]              |
+--------------------------------------------------+
```

**RoutineCard muestra**:
- Icono de categoria + titulo
- Dias activos (chips: L M Mi J V S D, resaltados los activos)
- Hora
- Nombre de la mascota (si filtro = Todas)
- Boton "Hecho" / "Saltado" para hoy
- Menu: editar, pausar, eliminar
- Barra de progreso semanal (ej: 4/5 completados esta semana)

### 7.2. Dialog: Crear/Editar Rutina (`RoutineForm`)

**Campos**:
1. **Mascota** — Select con foto y nombre (obligatorio)
2. **Categoria** — Grid de iconos: paseo, comida, medicacion, higiene, entrenamiento, juego, suplemento, otro
3. **Titulo** — Input texto (obligatorio). Placeholder dinamico segun categoria ("ej: Paseo matutino")
4. **Descripcion** — Textarea opcional
5. **Dias de la semana** — 7 chips toggleables (L M Mi J V S D). Shortcut: "Todos los dias", "Dias de semana", "Fines de semana"
6. **Hora** — Time picker (obligatorio)
7. **Duracion** — Select: 15min, 30min, 45min, 1h, 1.5h, 2h, sin definir
8. **Notificacion** — Select: sin alerta, 5 min antes, 15 min antes, 30 min antes, 1 hora antes
9. **Canal de alerta** — Checkboxes: en la app, push movil, WhatsApp (este ultimo solo si `whatsapp_opted_in`)
10. **Fecha inicio** — Date picker (default: hoy)
11. **Fecha fin** — Date picker opcional ("Indefinido" por defecto)

**Validacion**:
- Al menos 1 dia seleccionado
- Hora obligatoria
- Titulo max 100 chars
- No permitir duplicados exactos (misma mascota + misma hora + mismos dias)

### 7.3. Pagina: Calendario Unificado (`/calendario`)

**Layout**:
```
+--------------------------------------------------+
| PageHeader: "Calendario"                          |
+--------------------------------------------------+
| Filtros: [Todas las mascotas v] [Todos los tipos v]|
+--------------------------------------------------+
| CalendarGrid (mes)                                |
|   Cada dia muestra dots de colores segun tipos    |
|   de evento que tiene ese dia                     |
|   - Azul: rutinas                                 |
|   - Amarillo: recordatorios                       |
|   - Morado: citas/reservas                        |
+--------------------------------------------------+
| Vista del dia seleccionado (UnifiedDayView)       |
|                                                    |
| 08:00  [Paseo matutino - Kai]        [v Hecho]   |
| 10:00  [Vacuna antirrAbica - Luna]   [Pendiente]  |
| 15:00  [Cita veterinaria - Kai]      [Confirmada] |
| 21:00  [Omeprazol - Kai]             [v Hecho]   |
|                                                    |
| Sin hora:                                          |
|   [Control peso mensual - Luna]      [Pendiente]  |
+--------------------------------------------------+
```

**Interacciones**:
- Tap en un evento de rutina → marcar como hecho/saltado o ver detalle
- Tap en un recordatorio → navegar a `/reminders` o marcar completo
- Tap en una cita → navegar a detalle de la reserva
- Swipe izquierda/derecha para cambiar de dia (mobile)
- Flechas para cambiar de mes

### 7.4. Widget: Rutinas de Hoy (para `/home`)

Agregar una seccion en el Home dashboard:

```
+--------------------------------------------------+
| Rutinas de hoy                          [Ver mas] |
+--------------------------------------------------+
| [v] Paseo matutino - Kai          08:00           |
| [ ] Omeprazol - Kai               21:00           |
| [~] Bano - saltado                 10:00           |
+--------------------------------------------------+
| 1 de 3 completadas                                |
+--------------------------------------------------+
```

---

## 8. Sistema de notificaciones para rutinas

### 8.1. Notificaciones in-app

Cuando una rutina esta a N minutos de su hora programada, insertar en tabla `notifications`:

```sql
INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
VALUES (
  owner_id,
  'routine_due',
  'Es hora de: Paseo matutino',
  'Kai tiene paseo programado a las 08:00',
  '/rutinas',
  routine_id
);
```

**Nuevos tipos de notificacion**:
- `routine_due` — La rutina esta por empezar
- `routine_missed` — La rutina no fue completada (30 min despues de la hora)
- `routine_streak` — Felicitacion por racha ("7 dias seguidos de paseo con Kai")

### 8.2. Push nativo (Capacitor)

Usar `@capacitor/local-notifications` para programar notificaciones locales (no dependen de edge function):

```typescript
import { LocalNotifications } from '@capacitor/local-notifications';

// Programar notificacion para cada rutina activa del dia
async function scheduleRoutineNotifications(routines: Routine[]) {
  const today = new Date();
  const dow = today.getDay();

  const todayRoutines = routines.filter(r =>
    r.is_active && r.days_of_week.includes(dow)
  );

  const notifications = todayRoutines
    .filter(r => r.notify_before_minutes > 0)
    .map(r => {
      const [h, m] = r.time_of_day.split(':').map(Number);
      const at = new Date(today);
      at.setHours(h, m - r.notify_before_minutes, 0, 0);

      // Solo programar si es en el futuro
      if (at <= new Date()) return null;

      return {
        id: hashCode(r.id + format(today, 'yyyy-MM-dd')),
        title: `Es hora de: ${r.title}`,
        body: `${r.pets?.name} - ${CATEGORY_LABELS[r.category]}`,
        schedule: { at },
        actionTypeId: 'routine',
        extra: { routineId: r.id, date: format(today, 'yyyy-MM-dd') },
      };
    })
    .filter(Boolean);

  await LocalNotifications.schedule({ notifications });
}
```

**Cuando reprogramar**:
- Al abrir la app
- Al crear/editar/eliminar una rutina
- A medianoche (programar con `LocalNotifications.schedule` para el dia siguiente)

### 8.3. Extender `reminder-cron` para rutinas

Agregar al edge function `reminder-cron` un bloque que:
1. Consulte `pet_routines` activas cuyo `time_of_day` este dentro de la ventana de escaneo
2. Verifique que el `dow` actual esta en `days_of_week`
3. Verifique que no existe `routine_completions` para hoy
4. Si `notify_channels` incluye `whatsapp`, envie via `send-whatsapp-reminder`

### 8.4. Extender Google Calendar sync

Cuando se crea una rutina, crear un evento recurrente en Google Calendar:

```typescript
// RRULE para dias especificos
// Ejemplo: L, Mi, V = MO,WE,FR
const rruleDays = routine.days_of_week.map(d => RRULE_DAYS[d]).join(',');
const event = {
  summary: `${routine.title} - ${petName}`,
  start: { dateTime: `${todayStr}T${routine.time_of_day}:00`, timeZone: 'America/Santiago' },
  end: { dateTime: `${todayStr}T${endTime}:00`, timeZone: 'America/Santiago' },
  recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${rruleDays}`],
  reminders: {
    useDefault: false,
    overrides: [{ method: 'popup', minutes: routine.notify_before_minutes }],
  },
};
```

---

## 9. Colores y categorias

```typescript
const ROUTINE_CATEGORIES = {
  paseo:         { label: 'Paseo',          icon: 'Footprints',  color: '#22c55e' }, // green
  comida:        { label: 'Comida',         icon: 'UtensilsCrossed', color: '#f59e0b' }, // amber
  medicacion:    { label: 'Medicacion',     icon: 'Pill',        color: '#ef4444' }, // red
  higiene:       { label: 'Higiene',        icon: 'Droplets',    color: '#06b6d4' }, // cyan
  entrenamiento: { label: 'Entrenamiento',  icon: 'Dumbbell',    color: '#8b5cf6' }, // violet
  juego:         { label: 'Juego',          icon: 'Gamepad2',    color: '#ec4899' }, // pink
  suplemento:    { label: 'Suplemento',     icon: 'Leaf',        color: '#10b981' }, // emerald
  otro:          { label: 'Otro',           icon: 'MoreHorizontal', color: '#6b7280' }, // gray
};
```

---

## 10. Navegacion

### BottomTabBar / Sidebar

Agregar entrada al menu principal:

```
Calendario  →  /calendario   (icono: CalendarDays)
```

### Links internos

- Desde `/home` → widget "Rutinas de hoy" → link a `/rutinas`
- Desde `/my-pets` → cada mascota → boton "Rutinas" → `/mascota/:petId/rutinas`
- Desde `/mascota/:petId/ficha-clinica` → seccion "Rutinas activas" (resumen, link a gestion)
- Desde `/reminders` → banner top: "Tambien puedes configurar rutinas semanales" → `/rutinas`

---

## 11. Migracion SQL

Crear archivo: `supabase/migrations/YYYYMMDDHHMMSS_pet_routines.sql`

Contenido: las dos tablas de la seccion 3.1 y 3.2, mas el ALTER de la seccion 3.3.

**Recordar**: el dueno aplica la migracion manualmente desde Supabase Dashboard > SQL Editor.

---

## 12. Restricciones por plan

| Feature | Gratis | Premium |
|---|---|---|
| Rutinas por mascota | 3 | Ilimitadas |
| Categorias | Todas | Todas |
| Notificacion in-app | Si | Si |
| Push nativo | Si | Si |
| WhatsApp | No | Si |
| Google Calendar sync | No | Si |
| Calendario unificado | Solo hoy | Mes completo + historial |
| Estadisticas de cumplimiento | Ultima semana | Historico completo |

---

## 13. Orden de implementacion sugerido

### Fase 1: Base de datos + CRUD (backend)
1. [ ] Crear migracion `pet_routines` + `routine_completions`
2. [ ] Verificar RLS y permisos
3. [ ] Actualizar tipos de Supabase (`npx supabase gen types typescript`)

### Fase 2: Hook + pagina de rutinas (frontend core)
4. [ ] Crear `useRoutines.ts` con CRUD + completions
5. [ ] Crear `DaySelector.tsx` (chips L-D)
6. [ ] Crear `RoutineForm.tsx` (dialog crear/editar)
7. [ ] Crear `RoutineCard.tsx` (card con estado del dia)
8. [ ] Crear `RoutineWeekView.tsx` (grilla semanal)
9. [ ] Crear `PetRoutines.tsx` (pagina `/rutinas`)
10. [ ] Agregar rutas en `App.tsx`

### Fase 3: Calendario unificado
11. [ ] Crear `useUnifiedCalendar.ts` (merge de 3 fuentes)
12. [ ] Crear `CalendarEventCard.tsx` (card generica)
13. [ ] Crear `UnifiedDayView.tsx` (lista de eventos del dia)
14. [ ] Crear `CalendarFilters.tsx` (por mascota y tipo)
15. [ ] Crear `UnifiedCalendar.tsx` (pagina `/calendario`)
16. [ ] Extender `CalendarGrid.tsx` para dots multi-color

### Fase 4: Notificaciones
17. [ ] Agregar tipos `routine_due`, `routine_missed`, `routine_streak` a notificaciones
18. [ ] Implementar `LocalNotifications` en Capacitor para rutinas
19. [ ] Extender `reminder-cron` para escanear rutinas

### Fase 5: Integraciones
20. [ ] Extender Google Calendar sync para rutinas recurrentes
21. [ ] Agregar widget "Rutinas de hoy" en Home
22. [ ] Agregar seccion rutinas en ficha clinica
23. [ ] Agregar link a rutinas desde My Pets

### Fase 6: Gamificacion y polish
24. [ ] Implementar rachas (streaks) y notificacion de racha
25. [ ] Estadisticas de cumplimiento (% semanal/mensual)
26. [ ] Restricciones por plan (free vs premium)
27. [ ] Actualizar `FLUJO_COMPLETO.mmd` y `MAPA_FUNCIONAL_COMPLETO.md`

---

## 14. Archivos que se modifican (existentes)

| Archivo | Cambio |
|---|---|
| `src/App.tsx` | Agregar rutas `/rutinas`, `/mascota/:petId/rutinas`, `/calendario` |
| `src/components/home/` | Widget "Rutinas de hoy" |
| `src/components/calendar/CalendarGrid.tsx` | Soporte para dots multi-color |
| `src/hooks/useNotifications.tsx` | Manejar nuevos tipos `routine_*` |
| `supabase/functions/reminder-cron/index.ts` | Escanear `pet_routines` ademas de `pet_reminders` |
| `supabase/functions/google-calendar-sync/index.ts` | Crear eventos recurrentes para rutinas |
| `src/pages/MyPets.tsx` | Boton/link a rutinas por mascota |
| `diagrams/FLUJO_COMPLETO.mmd` | Agregar flujo de rutinas |
| `MAPA_FUNCIONAL_COMPLETO.md` | Documentar modulo de rutinas |

---

## 15. Consideraciones tecnicas

- **Timezone**: Todas las horas en `America/Santiago`. Guardar `time_of_day` como TIME sin zona, y resolver en cliente con la zona del usuario.
- **Performance**: Al expandir rutinas en el calendario, limitar el rango a 1 mes maximo para evitar generar miles de eventos.
- **Offline (Capacitor)**: Las notificaciones locales funcionan sin conexion. El CRUD de completions necesita conexion; considerar queue local con retry.
- **Bundle size**: Los nuevos componentes se cargan con `React.lazy()` como las demas paginas.
- **Tipos Supabase**: Despues de aplicar la migracion, regenerar tipos con `npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.ts`.
