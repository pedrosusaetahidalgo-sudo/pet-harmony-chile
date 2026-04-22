# Booking System Overhaul Plan — Paw Friend

> **Propósito**: plan maestro de rediseño y fortalecimiento integral del sistema de reservas/citas/agenda de Paw Friend.
> **Autor**: auditoría técnica/UX/PM ejecutada por agente IA.
> **Fecha**: 2026-04-18.
> **Estado del sistema actual**: Booking V2 implementado (~80%), con V1 legacy aún presente.
> **Audiencia**: equipo de producto/ingeniería que va a ejecutar el overhaul.

---

## 1. Resumen ejecutivo

### Propósito del rediseño

Paw Friend ya tiene **Booking System V2** operativo (migración `20260520000000_booking_system_v2.sql`) con reglas de disponibilidad, audit trail y cuatro verticales (vet, walk, dogsitter, training). El sistema funciona pero **arrastra deuda del V1 legacy**, tiene **UX fragmentada entre tres superficies** (`/mis-reservas`, `/calendario`, `/provider/dashboard`), **nombres de FK inconsistentes** entre tablas, **confirmación manual sin UI expuesta**, y **Google Calendar sólo unidireccional**. No es un sistema "listo para operar en serio" — es un sistema que **funciona en happy path** pero que falla o confunde en las esquinas que importan para una clínica veterinaria real.

### Problema que se busca resolver

1. Un dueño que reserva no sabe con claridad **qué va a pasar después** (¿me confirman? ¿hay recordatorio? ¿si cancelo a última hora qué pasa?).
2. Un veterinario recibe reservas pero **no tiene un "inbox clínico"** comparable a Timely/Petly — está disperso entre [ProviderBookingsInbox.tsx](../src/components/provider/ProviderBookingsInbox.tsx), [ProviderDashboard.tsx](../src/pages/ProviderDashboard.tsx) y [AvailabilityRulesEditor.tsx](../src/components/provider/AvailabilityRulesEditor.tsx) sin flujo único.
3. La **ficha clínica y la cita viven en paralelo**, sin hand-off automático (crear nota clínica desde una cita completada, adjuntar PDF de la consulta a la ficha, etc).
4. Los **recordatorios son parciales**: WhatsApp sólo para `pet_reminders`, in-app para `vet_bookings`, push configurado pero sin backend, email inexistente.
5. **V1 y V2 coexisten**: `bookings` + `service_slots` (V1) y `vet_bookings` + `provider_availability_rules` (V2). Drift latente.

### Por qué es crítico para Paw Friend

- La **joya de la corona** del producto es la ficha clínica PDF. Las citas son la **fuente principal** de datos para esa ficha (consulta → nota clínica → PDF). Si el flujo de citas está roto, la joya se desangra río arriba.
- El **modelo B2B vet** (Paw Friend Premium/Pro Max) vende productividad clínica. Un sistema de reservas débil = churn inmediato cuando un vet lo compara con Timely, Vetion, PetDesk.
- El **lanzamiento 1 de mayo** necesita flujos confiables. Una reserva perdida o una cita duplicada en los primeros 30 días hace mucho daño a la reputación.

### Impacto esperado

| Dimensión | Antes | Después |
|---|---|---|
| Tiempo de reserva (dueño) | ~4-5 clicks + formulario | 3 clicks + confirmación |
| Confianza en confirmación | "¿me confirmaron?" | Estado visible siempre + recordatorio 24h |
| Inbox vet | 3 pantallas | 1 inbox + agenda unificada |
| Cita → ficha clínica | Manual (re-tipear) | 1 botón "Crear nota desde cita" |
| No-show rate (objetivo) | s/medir | < 8% |
| Tasa de confirmación en 24h | s/medir | > 90% |

---

## 2. Estado actual del sistema

### 2.1 Arquitectura actual (verificada en código)

**Stack**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase (Postgres + Edge Functions Deno). Ver [CLAUDE.md](../CLAUDE.md) sección 2.

**Superficies**:

| Superficie | Ruta | Archivo | Rol |
|---|---|---|---|
| Mis reservas (dueño) | `/mis-reservas` | [src/pages/MyBookings.tsx](../src/pages/MyBookings.tsx) (628 líneas) | Owner |
| Calendario unificado | `/calendario` | [src/pages/UnifiedCalendar.tsx](../src/pages/UnifiedCalendar.tsx) (333 líneas) | Owner |
| Dashboard provider | `/provider/dashboard` | [src/pages/ProviderDashboard.tsx](../src/pages/ProviderDashboard.tsx) | Provider |
| Inbox bookings | (dentro de dashboard) | [src/components/provider/ProviderBookingsInbox.tsx](../src/components/provider/ProviderBookingsInbox.tsx) | Provider |
| Availability editor | (dentro de dashboard) | [src/components/provider/AvailabilityRulesEditor.tsx](../src/components/provider/AvailabilityRulesEditor.tsx) | Provider |
| Booking flow | modal/drawer | [src/components/booking/BookingFlow.tsx](../src/components/booking/BookingFlow.tsx) | Owner |

### 2.2 Modelo de datos actual

**Dos sistemas coexistiendo**:

- **V1 (legacy)**: `bookings` (pet_ids[] array, slot_id FK), `service_slots` (slots pre-creados por provider).
- **V2 (actual)**: `vet_bookings` / `walk_bookings` / `dogsitter_bookings` / `training_bookings` + `provider_availability_rules` (reglas semanales recurrentes) + `provider_availability_exceptions` (bloqueos/overrides puntuales) + `booking_events` (audit trail).

**Tablas auxiliares**:
- `pet_reminders` — vacunas, antiparasitarios, checkups.
- `appointments` — citas genéricas (legacy, poco usada).
- `google_calendar_tokens` + `external_calendar_events` — integración Google.
- `whatsapp_message_log` — tracking WhatsApp Meta Cloud API.
- `notifications` — notificaciones in-app.

### 2.3 Estados de cita (`src/lib/bookingStateMachine.ts`)

```
pendiente → { confirmado, cancelado }
confirmado → { en_camino, en_curso, cancelado, no_show }
en_camino → { en_curso, cancelado }
en_curso → { completado }
completado → (terminal)
cancelado → (terminal)
no_show → (terminal)
```

**Registrado en**: `booking_events` (audit trail con actor, actor_role, previous_status, new_status, metadata JSONB).

### 2.4 Edge functions relevantes

| Function | Schedule | Propósito |
|---|---|---|
| `reminder-cron` | `0 11 * * *` (8am Chile) | Recordatorios 1 día antes para `pet_reminders` y `appointments` via WhatsApp/email |
| `booking-reminders-cron` | Cada 30 min | Recordatorios 24h y 2h antes para `vet_bookings` et al (notifications in-app) |
| `send-whatsapp-reminder` | on-demand | Envío WhatsApp vía Meta Cloud API |
| `google-calendar-oauth-init` | on-demand | Inicio OAuth |
| `google-calendar-callback` | on-demand | Callback + canje tokens |
| `google-calendar-sync` | on-demand | Sync app → Google (unidireccional) |
| `google-calendar-disconnect` | on-demand | Revoca tokens |

### 2.5 Fortalezas existentes

1. **Audit trail completo** en `booking_events` — cada transición queda registrada con actor y metadata.
2. **State machine** centralizada y validada — evita estados imposibles.
3. **RLS granular** — owner ve sus bookings, provider ve los suyos, admin ve todo.
4. **Disponibilidad estructurada** — `provider_availability_rules` (semanales) + `exceptions` (puntuales) es el patrón estándar de Calendly/Cal.com.
5. **Multi-vertical**: vet/walk/dogsitter/training en tablas separadas pero con flujo unificado vía [useMyBookingsV2.ts](../src/hooks/useMyBookingsV2.ts).
6. **Audit visible**: trigger `auto_confirm_vet_booking()` registra auto-confirmaciones en `booking_events`.
7. **Google Calendar unidireccional funciona**: OAuth + token refresh + mapeo en `external_calendar_events`.
8. **Rate limiting** en `google-calendar-sync` (10 req/min).

### 2.6 Debilidades existentes

1. **V1/V2 coexistiendo**: [MyBookings.tsx](../src/pages/MyBookings.tsx) consulta ambos (`my-bookings-v1` + `my-bookings-v2` queryKeys). Drift latente.
2. **`provider_availability` legacy vs `provider_availability_rules` V2**: dos fuentes de verdad de disponibilidad, ninguna marcada como deprecada.
3. **FK inconsistentes**: `vet_bookings.service_provider_id` vs `walk_bookings.walker_id` vs `dogsitter_bookings.dogsitter_id` vs `training_bookings.trainer_id` vs `bookings.provider_id`. Obliga a `getProviderColumn(type)` en [useBookingMutations.ts](../src/hooks/useBookingMutations.ts).
4. **Confirmación manual sin UI**: `confirmation_mode='manual'` existe en DB y `useConfirmBooking()` en el hook, pero el tab "Pendientes" de [ProviderBookingsInbox.tsx](../src/components/provider/ProviderBookingsInbox.tsx) no expone el botón Confirmar con claridad.
5. **Google Calendar sólo one-way**: si el dueño cancela en Google, la app no se entera. Sin webhooks Google Calendar Push Notifications.
6. **Revocación Google no propagada al frontend**: columna `revoked_at` existe (migración `20260601000000`) pero la UI no muestra "Reconecta tu calendario".
7. **`ON DELETE SET NULL` en `service_provider_id`**: bookings huérfanos si el provider se borra.
8. **Sin retry queue** para Google Calendar sync fallidos.
9. **Formato de hora ad-hoc**: `booking.start_time.substring(0, 5)` se repite en 8+ lugares. No hay helper `formatTime()` centralizado en [src/lib/format.ts](../src/lib/format.ts).
10. **Submit buttons sin `isPending`**: [BookingFlow.tsx](../src/components/booking/BookingFlow.tsx) permite doble-click en crear reserva.
11. **Sin draft/autosave**: si el dueño tipeó síntomas y navega, pierde el texto.
12. **No hay sugerencia de slot alternativo**: si dos usuarios reservan el mismo slot, el segundo recibe error 23505 sin propuesta alternativa.
13. **Filtros pobres en inbox vet**: sólo por tab (pendiente/hoy/próximas/pasadas), sin filtro por mascota, servicio, rango.
14. **WhatsApp sólo para `pet_reminders`** (no para `vet_bookings`). Inconsistencia de canales.
15. **Email reminders: inexistentes**. Push nativo: cliente listo pero sin backend enviando payloads.
16. **Documentación dispersa**: no hay `docs-specs/BOOKING_*.md` previo que describa el sistema V2.

### 2.7 Ambigüedades

- ¿`appointments` se sigue usando o está deprecada? Tiene trigger que crea `pet_reminders` pero su UI casi no aparece.
- ¿`bookings` V1 se mantiene por compatibilidad mobile o se puede borrar? [MyBookings.tsx](../src/pages/MyBookings.tsx) aún la consulta.
- ¿`payment_status` está integrado con Flow.cl edge functions? En V2 `vet_bookings` tiene la columna pero no está claro si se actualiza desde `flow-webhook`.
- ¿`confirmation_mode` default es `auto` o `manual`? El trigger `auto_confirm_vet_booking()` sugiere default auto, pero la UX para vet de aceptar/rechazar manualmente no está expuesta.

---

## 3. Diagnóstico de gaps

### 3.1 Gaps funcionales

| # | Gap | Severidad | Evidencia |
|---|---|---|---|
| F1 | No hay UI clara para que el vet **confirme o rechace** una reserva pendiente | Alta | [ProviderBookingsInbox.tsx](../src/components/provider/ProviderBookingsInbox.tsx) no tiene tab "Pendientes de tu acción" con botón Confirmar prominente |
| F2 | No hay flujo de **reprograma con aviso al otro lado** (owner reprograma → vet se entera, y viceversa) | Alta | [useBookingMutations.ts](../src/hooks/useBookingMutations.ts) tiene `rescheduleBooking` pero sin notificación al otro rol |
| F3 | No hay **check-in** (vet/recepción marca "paciente llegó") | Media | Estado `en_camino` existe pero es para vet-a-domicilio; sin estado "arrived" para clínica |
| F4 | **Cita completada → ficha clínica** es manual | Alta | No hay botón "Crear nota clínica desde esta cita" en el detalle del booking |
| F5 | **Follow-up** (cita de control en N días) no se crea automáticamente desde una cita completada | Media | No existe mecanismo |
| F6 | No hay **sugerencia de slot alternativo** en colisión | Media | Error 23505 cae a toast genérico |
| F7 | **Bidirectional Google Calendar sync** no existe | Media | Sólo app → Google |
| F8 | **Bulk actions** en inbox vet (confirmar 5, reprogramar por feriado) | Baja | No existe |
| F9 | **Plantillas post-consulta** ya existen en `consultation_templates` pero no están conectadas al flujo cita-completada → ficha | Media | Gap de integración |
| F10 | **Waitlist / lista de espera** cuando no hay slots | Baja | No existe |

### 3.2 Gaps de UX/UI

| # | Gap | Severidad | Archivo |
|---|---|---|---|
| U1 | [BookingFlow.tsx](../src/components/booking/BookingFlow.tsx) permite doble-click en crear | Alta | `isPending` no se usa en el botón submit |
| U2 | Sin draft/autosave de síntomas y notas | Media | BookingFlow.tsx |
| U3 | Estados sólo por color (not-compliant WCAG AA en algunos badges) | Media | [src/lib/bookingStateMachine.ts:getStatusColor()](../src/lib/bookingStateMachine.ts) |
| U4 | Formato de hora inconsistente (`09:00` vs `09:00:00`) | Baja | 8+ lugares |
| U5 | Empty states débiles en [MyBookings.tsx](../src/pages/MyBookings.tsx) | Media | No guía al user a "Reservar ahora" |
| U6 | Sin filtros avanzados en [ProviderBookingsInbox.tsx](../src/components/provider/ProviderBookingsInbox.tsx) | Media | Solo tabs, sin date range / mascota / servicio |
| U7 | [UnifiedCalendar.tsx](../src/pages/UnifiedCalendar.tsx) no tiene vista semanal (solo mensual + lista del día) | Media | Vet necesita vista semanal para planificar |
| U8 | [AvailabilityRulesEditor.tsx](../src/components/provider/AvailabilityRulesEditor.tsx) es denso — muchos campos en un form | Media | Wizard sería más amigable |
| U9 | Sin preview "así se verá tu disponibilidad" en el editor | Baja | Vet edita reglas a ciegas |
| U10 | No hay **vista del paciente** (historial de citas del pet) accesible desde el booking | Media | Sin botón "Ver ficha" en `BookingDetailDrawer.tsx` |
| U11 | **Mobile**: `AvailabilityRulesEditor` tiene campos time que en iOS WebView se ven mal | Media | Requiere pruebas con `cross-platform-validator` |
| U12 | Status badges no tienen **iconos** (solo texto + color) | Baja | Accesibilidad mejorable |
| U13 | Falta **feedback inmediato** al marcar completado (confetti/animación opcional) | Baja | Refuerzo positivo vet |
| U14 | Sin **deep links** para crear booking desde WhatsApp/QR (`/provider/:id/book?pet=:petId`) | Media | Reduce fricción |
| U15 | Sin **vista "Hoy"** para el vet con toda la jornada visible de 7am a 8pm | Alta | Inbox no reemplaza agenda del día |

### 3.3 Gaps de datos/sincronización

| # | Gap | Severidad | Evidencia |
|---|---|---|---|
| D1 | `provider_availability` (legacy) y `provider_availability_rules` (V2) coexisten | Alta | Ambas tablas activas, sin flag deprecation |
| D2 | FK inconsistentes entre booking tables | Media | `service_provider_id` / `walker_id` / `dogsitter_id` / `trainer_id` |
| D3 | `V1.bookings` aún consultado por [MyBookings.tsx](../src/pages/MyBookings.tsx) | Media | queryKey `my-bookings-v1` |
| D4 | `appointments` table: ¿deprecada o no? | Baja | Uso residual, ambigüedad |
| D5 | `payment_status` no se actualiza desde `flow-webhook` para vet_bookings | Alta | Falta integración, validar |
| D6 | `google_calendar_tokens.revoked_at` no consumido por frontend | Media | Usuario no se entera que su sync está caído |
| D7 | `ON DELETE SET NULL` en FK a service_providers → orphaned bookings | Media | Riesgo de integridad |
| D8 | `slot_duration_minutes` duplicado en rule y en booking sin sync garantizado | Baja | Drift posible |
| D9 | Sin tabla `device_tokens` para push nativo | Media | Capacitor registra token pero no se persiste |
| D10 | Sin índice compuesto en `booking_events (booking_type, booking_id, created_at DESC)` — sí existe (verificado); mantener | OK | idx_booking_events_lookup |

### 3.4 Gaps técnicos

| # | Gap | Severidad | Solución |
|---|---|---|---|
| T1 | Sin retry queue para `google-calendar-sync` fallidos | Media | Job table + dead-letter |
| T2 | `reminder-cron` no idempotente por completo (aunque pre-filtra opt-in) | Baja | Validar idempotencia `whatsapp_message_log` |
| T3 | Sin circuit breaker en Meta Cloud API | Baja | Rate-limit ya existe pero no breaker |
| T4 | Errores de concurrencia no retornan slots alternativos | Media | Backend: sugerir ±30min |
| T5 | Sin tests E2E para flujos de booking | Alta | Playwright smoke existe para rutas pero no para "reservar → confirmar → completar" |
| T6 | Sin observabilidad específica (conversion funnel, cancel rate por provider) | Media | PostHog events existen parcialmente |
| T7 | [useAvailableSlots.ts](../src/hooks/useAvailableSlots.ts) recomputa en cliente — debería ser RPC | Media | Mover a RPC `get_available_slots(provider_id, date, service_type)` |
| T8 | `useMyBookingsV2.ts` hace 4 queries paralelas (N+1 latente) | Media | RPC `get_my_bookings(owner_id, filters)` |
| T9 | Sin cache TTL explícito en `useAvailableSlots` (staleTime default) | Baja | `staleTime: 60_000` para slots |
| T10 | Booking V1 `bookings` table requiere limpieza post-migración | Media | Deprecation + migración de datos |

### 3.5 Gaps operacionales

| # | Gap | Severidad | |
|---|---|---|---|
| O1 | Sin runbook de "cómo diagnosticar una cita que no llegó" | Alta | |
| O2 | Sin runbook de "cómo reactivar Google Calendar para un usuario" | Media | |
| O3 | Sin alertas en Sentry específicas de fallo de cron de recordatorios | Media | |
| O4 | Sin dashboard admin de KPIs de booking (confirmation rate, cancel rate, no-show) | Alta | |
| O5 | Sin proceso para **validar que los crones están corriendo** (health check) | Alta | Cron podría estar caído y nadie se enteraría |
| O6 | Sin documentación de `booking_events` para soporte | Media | Qué ve el usuario al reclamar "no me avisaron" |

---

## 4. Objetivos del nuevo sistema de reservas

El sistema objetivo debe cumplir **10 objetivos medibles**:

1. **Reserva en ≤ 60 segundos** desde que el dueño entra a un perfil de vet hasta confirmación visible.
2. **Confirmación visible siempre**: nunca dejar al dueño en duda sobre si su cita fue recibida/confirmada.
3. **Inbox clínico único** para el vet: agenda del día, pendientes, acciones bulk.
4. **Estados/checks accesibles en 1 tap**: confirmar, marcar en curso, completar, no-show.
5. **Cita ↔ ficha clínica integradas**: de cita completada a nota clínica con 1 click.
6. **Recordatorios multi-canal fiables**: WhatsApp + push + email + in-app con fallback.
7. **Trazabilidad end-to-end**: cada booking muestra timeline (`booking_events`) visible a owner, vet y admin.
8. **Reprograma y cancelación con políticas claras**: ventanas de tiempo, avisos al otro lado, penalidades opcionales.
9. **Sincronización bidireccional con Google Calendar** (mínimo: detectar cancelaciones en Google).
10. **Resiliente a concurrencia**: si dos reservan el mismo slot, uno gana y el otro recibe alternativas.

---

## 5. Roles y permisos

### 5.1 Dueño (owner)

**Necesita ver**:
- Listado de sus reservas (activas, pasadas, canceladas).
- Calendario unificado (reservas + recordatorios + rutinas).
- Detalle de cada cita con timeline de eventos.
- Ficha del vet/servicio que reservó.

**Necesita hacer**:
- Reservar en 3 clicks (vet → fecha → hora).
- Confirmar llegada si el vet lo pide.
- Cancelar/reprogramar dentro de ventana.
- Ver recordatorios recibidos.
- Conectar/desconectar Google Calendar.

**Dolores actuales**:
- No sabe si fue confirmado hasta que recibe (o no) el recordatorio 24h.
- Al cancelar no tiene feedback de si el vet fue notificado.
- Si conecta Google Calendar y falla, no se entera.

**Restricciones**:
- Sólo ve/edita sus propios bookings (`owner_id = auth.uid()`, RLS activa).
- No puede cancelar < 2h antes (política configurable).
- No puede reservar retroactivo.

### 5.2 Veterinario / proveedor (provider)

**Necesita ver**:
- **Agenda del día** (vista principal, 7am-8pm).
- Inbox de pendientes (requieren su acción).
- Vista semanal/mensual para planificación.
- Detalle de paciente + historial al abrir una cita.

**Necesita hacer**:
- Editar reglas de disponibilidad recurrente.
- Crear excepciones (feriados, vacaciones, emergencias).
- Confirmar/rechazar reservas manuales.
- Marcar check-in, en curso, completado, no-show.
- Crear nota clínica desde cita completada.
- Agendar follow-up al completar.
- Reprogramar con motivo visible al dueño.

**Dolores actuales**:
- Inbox disperso (dashboard + inbox + availability editor en pantallas distintas).
- No hay "vista Hoy" clara.
- No puede crear nota clínica desde una cita con 1 click.
- Availability editor es denso.

**Restricciones**:
- Sólo edita sus propios bookings (`provider_id = auth.uid()` vía service_providers lookup).
- No puede completar citas futuras.
- No puede editar notas clínicas si no tiene permiso sobre el pet (vet del paciente o invitado).

### 5.3 Staff / admin

**Necesita ver**:
- KPIs globales (confirmation rate, cancel rate, no-show rate).
- Inbox de incidencias (Google Calendar revocado, crones fallidos).
- Búsqueda de bookings por owner, pet, vet, fecha.

**Necesita hacer**:
- Cancelar/ajustar bookings por disputa o error.
- Reactivar Google Calendar (dar instrucciones al user).
- Ver timeline completo de eventos.
- Exportar datos para análisis.

**Restricciones**:
- Acceso sólo si `admin_access.is_active = true`.
- Acciones registradas en `booking_events` con `actor_role = 'admin'`.

### 5.4 Matriz de permisos (resumen)

| Acción | Owner | Provider | Admin |
|---|---|---|---|
| Crear booking | ✅ (propios) | ✅ (si crea cita p/ paciente huérfano) | ✅ |
| Ver booking | ✅ (propios) | ✅ (propios) | ✅ (todos) |
| Confirmar | — | ✅ | ✅ |
| Cancelar | ✅ (propios, >2h antes) | ✅ (propios, con motivo) | ✅ |
| Reprogramar | ✅ (propios, >24h antes) | ✅ (propios) | ✅ |
| Marcar check-in/en curso | — | ✅ | ✅ |
| Completar | — | ✅ | ✅ |
| Marcar no-show | — | ✅ | ✅ |
| Crear nota clínica desde cita | — | ✅ (si vet del pet) | ✅ |
| Ver audit trail | ✅ (su booking) | ✅ (su booking) | ✅ (todos) |

---

## 6. Flujos ideales end-to-end

Cada flujo descrito con **precondición → pasos → postcondición + eventos `booking_events`**.

### 6.1 Crear cita (owner, auto-confirm)

**Precondición**: owner autenticado, vet tiene `provider_availability_rules` para el servicio.

**Pasos**:
1. Owner entra a `/veterinarios/:slug` o perfil del vet.
2. Click "Reservar cita".
3. Selecciona mascota (default: la última usada).
4. Selecciona fecha (calendario muestra días con slots disponibles).
5. Selecciona slot (lista de horas con duración visible).
6. Opcional: síntomas/motivo.
7. Click "Confirmar" → loading state → toast "Reserva confirmada".
8. Redirect a detalle con timeline.

**Postcondición**:
- Row en `vet_bookings` con `status='pendiente'`.
- Trigger `auto_confirm_vet_booking()` ejecuta si `confirmation_mode='auto'` → `status='confirmado'`.
- Row en `booking_events` (type='created').
- Row en `booking_events` (type='confirmed', actor_role='system').
- Notificación in-app al vet.
- Google Calendar sync (si owner conectó).

### 6.2 Crear cita (owner, manual-confirm)

Igual al anterior, pero:
- `confirmation_mode='manual'` → `status` queda `pendiente`.
- Toast: "Reserva enviada, el vet te confirmará dentro de 24h".
- Vet recibe en inbox tab "Requieren tu acción".
- Si vet no actúa en 24h, recordatorio automático al vet.

### 6.3 Confirmar cita (vet, manual-confirm)

**Precondición**: `status='pendiente'` y `confirmation_mode='manual'`.

**Pasos**:
1. Vet abre inbox tab "Requieren tu acción".
2. Ve lista ordenada por fecha más próxima.
3. Click en cita → drawer con detalle + historia del paciente.
4. Click "Confirmar" → loading → toast.

**Postcondición**:
- `status='confirmado'`, `confirmed_at=now()`.
- `booking_events` (type='confirmed', actor_role='provider').
- Notificación al owner: "Tu cita con Dr. X fue confirmada".
- Trigger de schedule de recordatorios 24h/2h.

### 6.4 Reprogramar (owner)

**Precondición**: `status IN ('pendiente', 'confirmado')` y > 24h antes de `scheduled_date`.

**Pasos**:
1. Owner abre detalle cita → click "Reprogramar".
2. Selecciona nuevo slot del mismo vet (o advertir si no hay).
3. Opcional: motivo.
4. Confirma.

**Postcondición**:
- Row nueva en `vet_bookings` con `rescheduled_from=<old_id>`.
- Row anterior: `status='cancelado'`, `cancellation_reason='rescheduled'`.
- 2 rows en `booking_events`: `cancelled_by_owner` (original) + `rescheduled` (nueva).
- Notificación al vet: "X reprogramó de lunes 10:00 a martes 15:00".
- Google Calendar: delete old event + create new.

### 6.5 Cancelar (owner)

**Precondición**: `status IN ('pendiente', 'confirmado')`.

**Pasos**:
1. Owner abre detalle → "Cancelar".
2. Diálogo confirmatorio con política visible ("Si cancelas con < 2h, podría aplicarse cargo").
3. Opcional: motivo.
4. Confirma.

**Postcondición**:
- `status='cancelado'`, `canceled_by=owner_id`, `cancellation_reason=<motivo>`.
- `booking_events` (type='cancelled_by_owner').
- Notificación al vet.
- Google Calendar: delete event.

### 6.6 Check-in / en curso (vet)

**Precondición**: `status='confirmado'`, estamos en el día de la cita.

**Pasos**:
1. Vet en vista Hoy, ve cita.
2. Click "Check-in" (paciente llegó) → `status='en_curso'`.
3. Se abre panel con ficha del paciente + plantilla de nota clínica.
4. Vet toma notas durante la consulta.
5. Click "Completar" → sugiere seguimiento (ej: "agendar control en 30 días?").

**Postcondición**:
- `booking_events` (type='in_progress') + (type='completed').
- Si vet elige, se crea `follow-up` booking automático con offset `scheduled_date + N días`.
- Nota clínica guardada en `medical_records` con `booking_id` FK.

### 6.7 No-show (vet)

**Precondición**: `status='confirmado'`, scheduled_date pasó > 30 min.

**Pasos**:
1. Vet en inbox "Hoy", ve cita con badge "No llegó aún".
2. Click "Marcar no-show" → confirmación.

**Postcondición**:
- `status='no_show'`.
- `booking_events` (type='no_show').
- Notificación al owner: "¿Todo bien? Marcamos que no asististe a tu cita. Si hubo un problema, contáctanos".
- Política de no-show rate por owner (info para vet en próxima reserva).

### 6.8 Resolver incidencia (admin)

**Ej**: dueño reclama que lo cobraron por no-show pero sí llegó.

**Pasos**:
1. Admin busca booking por ID/email.
2. Ve timeline completo de `booking_events`.
3. Determina si hay evidencia (check-in hecho por vet, etc).
4. Si procede: edita status manualmente + agrega row `booking_events` (type='admin_override', metadata con razón).
5. Notifica a ambas partes.

---

## 7. Diseño funcional del sistema

### 7.1 Para el dueño (`/mis-reservas` + `/calendario`)

**Principios**:
- **Mobile-first** (mayoría accede desde móvil).
- **Una acción primaria por pantalla**: reservar, ver detalle, cancelar.
- **Estados visibles siempre**: badge + color + ícono + texto.

**Vista Lista (`/mis-reservas`)**:
- Tabs: Próximas · Pasadas · Canceladas.
- Card por booking: avatar pet + nombre + vet + fecha/hora + status badge.
- Swipe right (mobile) = ver detalle. Swipe left = cancelar (si aplica).
- Filtros: por mascota (chips).
- Empty state: "Aún no tienes reservas. [Buscar un vet]".

**Vista Calendario (`/calendario`)**:
- Toggle: Mes · Semana · Día.
- En Mes: puntos de color por tipo de evento.
- En Día: timeline 7am-10pm con eventos.
- Filtros: tipo (reservas, recordatorios, rutinas) + mascota.

**Detalle cita (drawer o página)**:
- Header: status badge grande + fecha/hora + vet name.
- Body: mascota + servicio + dirección o "En clínica" + síntomas.
- Timeline: eventos de `booking_events` renderizados cronológicamente.
- Acciones contextuales: Reprogramar · Cancelar · Contactar vet (WhatsApp deep link).
- Si completado: "Ver nota clínica" (link a ficha).

### 7.2 Para el vet (`/provider/dashboard`)

**Principios**:
- **Desktop-first**, pero usable en tablet.
- Densidad de información: el vet necesita ver mucho a la vez.
- **Sin gamificación** (regla CLAUDE.md sección 11.2).

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ HOY (vista principal por defecto)               │
├───────────────┬─────────────────────────────────┤
│ Timeline día  │ Detalle cita seleccionada       │
│ 07:00 ████    │ - Paciente: Kai (Pastor suizo)  │
│ 08:00         │ - Motivo: Control vacuna        │
│ 09:00 ████    │ - Timeline de eventos           │
│ ...           │ - Acciones: Check-in / Notas    │
└───────────────┴─────────────────────────────────┘
Tabs: HOY · SEMANA · INBOX · DISPONIBILIDAD · PACIENTES
```

**Tab HOY**:
- Timeline vertical del día con bloques por cita.
- Filtros rápidos: tipo servicio, confirmadas, completadas.
- Acciones inline: check-in, completar, no-show.

**Tab SEMANA**:
- Grid semanal (lun-dom, 7am-9pm).
- Click en slot vacío = crear cita manual (para pacientes que llaman).

**Tab INBOX**:
- Sub-tabs: Pendientes (requieren acción) · Próximas · Completadas · Canceladas.
- Bulk actions: seleccionar 5 pendientes → "Confirmar todas".

**Tab DISPONIBILIDAD**:
- Wizard 2 pasos: Reglas semanales → Excepciones.
- Preview: "Así se verá tu semana típica".
- Botón rápido "Bloquear esta semana" (vacaciones).

**Tab PACIENTES**:
- Lista búsqueda + filtros.
- Click paciente → historial de citas + ficha clínica.

### 7.3 Componentes UI reutilizables

| Componente | Estado | Acción |
|---|---|---|
| `BookingStatusBadge` | ✅ existe en [src/components/booking/BookingStatusBadge.tsx](../src/components/booking/BookingStatusBadge.tsx) | Agregar ícono + mejorar contraste WCAG AA |
| `BookingCard` | ✅ existe | Split en `BookingCardOwner` y `BookingCardProvider` (needs divergen) |
| `BookingDetailDrawer` | ✅ existe | Agregar timeline de `booking_events` visible |
| `BookingTimeline` | ❌ nuevo | Renderiza `booking_events` como timeline UI |
| `AvailabilityCalendar` | ✅ existe | Agregar error state + empty state |
| `BookingFlow` | ✅ existe | Agregar `isPending` lock + autosave draft |
| `SlotPicker` | ❌ nuevo | Componente dedicado con sugerencias alternativas |
| `BookingActionsMenu` | ❌ nuevo | Menu contextual con acciones permitidas por estado |
| `ProviderTodayView` | ❌ nuevo | Timeline vertical del día del vet |
| `RescheduleDialog` | ✅ existe | Integrar con `SlotPicker` |
| `CancelBookingDialog` | ✅ existe | Mostrar política de cancelación |
| `BulkActionsBar` | ❌ nuevo | Para inbox vet |

### 7.4 Feedback visual, errores, loading

- **Loading**: skeleton cards en lista, spinner inline en botones.
- **Error**: toast con acción de retry + link a soporte si falla N veces.
- **Empty**: ilustración + CTA claro.
- **Concurrencia**: si slot ocupado, modal "Ese horario se tomó. ¿Te sirve alguno de estos?" + 3 slots alternativos.

### 7.5 Mobile

- Botones ≥ 44×44px.
- Bottom sheets en vez de modals centrados.
- Swipe gestures para cancelar/reprogramar.
- `useMediaQuery` para breakpoints (ya usado en el repo).
- Probar con [cross-platform-validator](../.claude/agents/cross-platform-validator.md) antes de mergear.

---

## 8. Sincronización de datos

### 8.1 Cita ↔ mascota / paciente

- `vet_bookings.pet_id` → `pets.id`.
- Al crear booking, validar `pet.owner_id = auth.uid()` (RLS ya lo hace).
- En detalle booking, mostrar link a [/ficha/:petId](../src/pages/PetClinicalRecord/).

### 8.2 Cita ↔ dueño

- `vet_bookings.owner_id` → `auth.users.id`.
- Si pet es huérfano (pending_owner_email), mostrar warning en booking.

### 8.3 Cita ↔ vet / proveedor

- `vet_bookings.service_provider_id` → `service_providers.id`.
- Al borrar provider → actualmente `ON DELETE SET NULL` (revisar, preferir soft delete).

### 8.4 Cita ↔ especialidad / servicio

- `vet_bookings.service_type` TEXT (consulta_general, vacunacion, cirugia, emergencia, dental).
- Considerar tabla `service_types` normalizada con metadata (duración típica, precio base, etc).

### 8.5 Cita ↔ ficha clínica

**Estado actual**: sin FK directa.

**Propuesta**:
- Agregar `medical_records.booking_id UUID NULL REFERENCES vet_bookings(id) ON DELETE SET NULL`.
- Al marcar cita completada, UI pregunta "¿Crear nota clínica?" → pre-rellena con datos de la cita.
- En ficha clínica, mostrar badge "desde cita del DD/MM" con link al booking.

### 8.6 Cita ↔ notas relevantes

- Previas (`symptoms` existente).
- Post-consulta → van a `medical_records`.
- Notas internas del vet (no visibles al owner) → columna `private_notes TEXT` en `vet_bookings`.

### 8.7 Cita ↔ follow-up

- Agregar `vet_bookings.follow_up_booking_id UUID NULL REFERENCES vet_bookings(id)`.
- Al completar, si vet agenda follow-up, se linkean.

### 8.8 Cita ↔ historial

- `booking_events` es el audit trail. Exponerlo en UI como timeline.

### 8.9 Cita ↔ pagos

- `vet_bookings.payment_status` + `payment_reference` existen.
- Validar que `flow-webhook` actualiza `payment_status` cuando hay pago asociado.
- Si no hay integración, **auditar esto como P0**.

### 8.10 Cita ↔ documentos adjuntos

- Nuevo: tabla `booking_attachments (id, booking_id, file_url, uploaded_by, created_at)` con Supabase Storage bucket.
- UseCase: owner sube foto de síntoma antes de la cita; vet sube foto/radiografía después.

---

## 9. Sistema de recordatorios y alertas

### 9.1 Eventos disparadores y destinatarios

| # | Evento | Cuándo | Destinatario | Prioridad | Canal primario | Fallback |
|---|---|---|---|---|---|---|
| R1 | Reserva creada | inmediato | Owner | Alta | In-app + WhatsApp | Email |
| R2 | Reserva creada | inmediato | Provider | Alta | In-app + push | WhatsApp |
| R3 | Confirmación manual requerida | inmediato | Provider | Alta | In-app + push | WhatsApp |
| R4 | Confirmación manual pendiente (vet no actuó) | +12h | Provider | Alta | WhatsApp | Email |
| R5 | Reserva confirmada | inmediato (post-confirm) | Owner | Media | In-app + push | WhatsApp |
| R6 | Recordatorio 24h antes | cron 30min | Owner | Alta | WhatsApp | Push · Email |
| R7 | Recordatorio 2h antes | cron 30min | Owner | Alta | Push | WhatsApp |
| R8 | Reserva reprogramada | inmediato | Otra parte | Alta | In-app + push | WhatsApp |
| R9 | Reserva cancelada por owner | inmediato | Provider | Alta | In-app + push | WhatsApp |
| R10 | Reserva cancelada por provider | inmediato | Owner | Alta | WhatsApp + push | Email |
| R11 | No-show marcado | inmediato | Owner | Media | In-app | Email |
| R12 | Follow-up sugerido | inmediato post-complete | Owner | Baja | In-app | — |
| R13 | Cita completada (resumen + encuesta) | +2h post-complete | Owner | Baja | In-app + email | — |
| R14 | Vet con retraso | +10min desde scheduled | Owner | Alta | Push | WhatsApp |
| R15 | Alerta interna: no hay confirmación de la cita en 24h | cron | Admin | Media | In-app admin | — |
| R16 | Alerta interna: cron de reminders falló | cron error | Admin | Alta | Email | Sentry |

### 9.2 Priorización de canales (cascada)

**Regla**: si canal primario falla o user no optó in, usar fallback. Registrar en `notification_attempts` (nueva tabla) para trazabilidad.

**Canales disponibles** (verificado en repo):
- ✅ In-app (`notifications` table).
- ✅ WhatsApp Meta Cloud API (`send-whatsapp-reminder` edge function + `whatsapp_message_log`).
- ⚠️ Push nativo (Capacitor, cliente listo, sin backend).
- ❌ Email (no implementado).
- ⚠️ SMS (no implementado, descartar).

### 9.3 Observabilidad

- Tabla nueva `notification_attempts`:
  ```sql
  CREATE TABLE notification_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_type TEXT,
    booking_id UUID,
    reminder_type TEXT, -- '24h', '2h', 'cancelled', etc
    channel TEXT, -- 'whatsapp', 'push', 'email', 'in_app'
    recipient_id UUID,
    status TEXT, -- 'sent', 'delivered', 'failed', 'skipped'
    error_message TEXT,
    external_id TEXT, -- meta_message_id, etc
    attempted_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- Index en `(booking_type, booking_id, reminder_type)`.
- Admin dashboard widget: "Recordatorios últimas 24h: enviados / fallidos / tasa".

### 9.4 Idempotencia

Cada recordatorio idempotente por `(booking_id, reminder_type, channel)` — check en `notification_attempts` antes de enviar.

---

## 10. UX/UI recomendada

### 10.1 Claridad visual

- **Status badge**: color + ícono + texto. Paleta WCAG AA:
  - `pendiente`: amber-600 + Clock
  - `confirmado`: emerald-600 + CheckCircle
  - `en_camino`: sky-600 + Truck
  - `en_curso`: indigo-600 + Play
  - `completado`: green-700 + CheckCheck
  - `cancelado`: slate-500 + X
  - `no_show`: red-600 + AlertTriangle

### 10.2 Facilidad de escaneo

- **Jerarquía**: fecha/hora en tamaño XL, status badge prominente, mascota + vet en tamaño L, detalles M.
- **Cards** con espaciado generoso en mobile.

### 10.3 Mínimos pasos para reservar

**Meta**: 3 clicks (vet → fecha → hora) + 1 submit.

**Anti-patterns a evitar**:
- Forms largos con muchos campos opcionales.
- Dropdowns con 100+ opciones sin búsqueda.
- Confirmaciones dobles ("¿Estás seguro? ¿De verdad estás seguro?").

### 10.4 Facilidad para marcar estados

- **Vet**: acciones primarias siempre visibles (no escondidas en menus).
- **Swipe gestures** en mobile para marcar completado.

### 10.5 Accesibilidad

- Todo clickeable con `aria-label`.
- Contraste WCAG AA en todos los badges.
- Keyboard navigation completa.
- Screen reader friendly (`role="status"` en badges dinámicos).

### 10.6 Feedback

- Toast positivo en éxito (2s).
- Toast con acción en error ("Reintentar").
- Loading spinner en botones (lock durante mutate).
- Optimistic updates para cancelar (revert si falla).

### 10.7 Empty states

Cada lista vacía debe tener:
- Ilustración (o ícono grande).
- Mensaje empático ("Aún no tienes reservas, pero Kai puede beneficiarse de un chequeo anual").
- CTA primario.

### 10.8 Confirmaciones

- Destructivas (cancelar, no-show): diálogo obligatorio.
- Reversibles (reschedule): 1 click + undo toast 10s.

### 10.9 Anti-patterns a evitar

- Modales encima de modales.
- Páginas en blanco sin loading state.
- Botones sin feedback visual al click.
- Errores opacos ("Something went wrong").
- Flujos que requieren refresh manual.

---

## 11. Arquitectura funcional y técnica

### 11.1 Frontend

**Organización sugerida** (iterando sobre la actual):

```
src/
  pages/
    owner/
      MyBookings.tsx          # Lista owner
      UnifiedCalendar.tsx     # Calendario owner
    provider/
      ProviderDashboard.tsx   # Shell con tabs
      ProviderToday.tsx       # Nueva: vista Hoy
      ProviderInbox.tsx       # Nueva: inbox con sub-tabs
      ProviderAvailability.tsx # Nueva: wizard disponibilidad
  components/
    booking/
      BookingCard.tsx (split owner/provider)
      BookingDetailDrawer.tsx (+ BookingTimeline dentro)
      BookingFlow.tsx (con isPending lock + draft)
      BookingStatusBadge.tsx (WCAG + íconos)
      BookingTimeline.tsx (NUEVO)
      SlotPicker.tsx (NUEVO)
      BookingActionsMenu.tsx (NUEVO)
      CancelBookingDialog.tsx (con política visible)
      RescheduleDialog.tsx (con SlotPicker)
    provider/
      ProviderTodayView.tsx (NUEVO)
      AvailabilityRulesEditor.tsx (wizardizar)
      AvailabilityPreview.tsx (NUEVO)
      ProviderBookingsInbox.tsx (filtros avanzados)
      BulkActionsBar.tsx (NUEVO)
  hooks/
    useBookingsByRole.ts (unifica V1+V2, deprecará V1)
    useBookingMutations.ts (unifica por type, no 4 funciones separadas)
    useProviderAvailability.ts (wrapper sobre rules+exceptions)
    useAvailableSlots.ts (mover a RPC)
    useBookingEvents.ts (NUEVO, lee timeline)
  lib/
    bookingStateMachine.ts (agregar docs inline)
    availabilitySlots.ts (mantener)
    format.ts (agregar formatTime, formatBookingDate)
```

### 11.2 Backend (Supabase)

**Edge functions**:
- Mantener las existentes.
- **Agregar**:
  - `sync-payment-to-booking` — webhook de Flow actualiza `vet_bookings.payment_status`.
  - `google-calendar-webhook` — recibir push notifications de Google (bidireccional).
  - `booking-action-retry` — retry queue para Google sync fallidos.
- **Extender**:
  - `reminder-cron` → agregar email channel.
  - `booking-reminders-cron` → agregar WhatsApp channel.

**RPCs nuevas**:
- `get_available_slots(provider_id UUID, target_date DATE, service_type TEXT)` — retorna array de slots.
- `get_my_bookings(filters JSONB)` — unifica 4 tablas en 1 query.
- `create_booking(type TEXT, payload JSONB)` — abstrae la tabla según type.
- `transition_booking(booking_id UUID, booking_type TEXT, new_status TEXT, metadata JSONB)` — valida state machine + registra en `booking_events`.

**Triggers nuevos**:
- `after_booking_completed` → sugerir follow-up + notificación al owner encuesta.
- `before_booking_insert` → validar no duplicado + no colisión.

### 11.3 Responsabilidades por capa

| Capa | Responsabilidad |
|---|---|
| DB | Constraints, RLS, triggers básicos, audit trail |
| RPC | Lógica transaccional (create, transition, bulk) |
| Edge Functions | Integraciones externas (Google, WhatsApp), crons |
| Hooks | Data fetching con react-query + cache |
| Components | UI stateless + handlers |
| Pages | Composición de componentes + routing |

### 11.4 Eventos y automatizaciones

- State transitions → `booking_events`.
- `after_insert` booking → schedule recordatorios.
- `after_update` status → notificaciones al otro rol.
- `after_insert` `booking_events` type='completed' → sugerir follow-up.

### 11.5 Seguridad

- RLS en todas las tablas.
- RPC con `security definer` + check explícito de `auth.uid()`.
- Sin exposición de `owner_id`/`provider_id` directamente a clientes sin RLS.

### 11.6 Consistencia transaccional

- Crear booking + `booking_events` (created) en **una transacción** (RPC).
- Reprogramar = transacción: cancel old + create new + 2 events.

### 11.7 Escalabilidad

- Indexes ya presentes en V2 (verificar con `EXPLAIN` en prod si hay queries lentas).
- Calendario owner: paginar por semana (lazy).
- Inbox vet: paginar por cursor si > 100 pendientes.

### 11.8 Mantenibilidad

- Tests unitarios para state machine.
- Tests E2E Playwright para flujos críticos.
- Storybook para componentes de booking (opcional).
- Docs inline y este plan como referencia.

---

## 12. Modelo de datos recomendado

### 12.1 Tabla unificada `bookings_v3` (propuesta a evaluar)

**Hipótesis**: las 4 tablas actuales (vet/walk/dogsitter/training) comparten 80% de columnas. Unificar reduce complejidad de hooks y permite queries directas.

```sql
CREATE TABLE bookings_v3 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_type TEXT NOT NULL CHECK (booking_type IN ('vet', 'walk', 'dogsitter', 'training', 'grooming')),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  provider_id UUID NOT NULL REFERENCES service_providers(id),
  pet_ids UUID[] NOT NULL, -- array para walk/dogsitter, 1 elemento para vet
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes SMALLINT NOT NULL CHECK (slot_duration_minutes BETWEEN 5 AND 480),
  service_type TEXT NOT NULL,
  service_metadata JSONB DEFAULT '{}'::jsonb, -- is_emergency, training_type, etc
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN (...)),
  confirmation_mode TEXT NOT NULL DEFAULT 'auto' CHECK (...),
  confirmed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  canceled_by UUID,
  cancellation_reason TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  no_show_at TIMESTAMPTZ,
  symptoms TEXT,
  private_notes TEXT, -- solo provider ve
  total_price NUMERIC(12,2),
  payment_status TEXT DEFAULT 'pendiente',
  payment_reference TEXT,
  visit_address TEXT,
  rescheduled_from UUID REFERENCES bookings_v3(id),
  follow_up_booking_id UUID REFERENCES bookings_v3(id),
  medical_record_id UUID REFERENCES medical_records(id),
  google_event_id TEXT,
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_2h_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bookings_v3_owner ON bookings_v3 (owner_id, scheduled_date DESC);
CREATE INDEX idx_bookings_v3_provider ON bookings_v3 (provider_id, scheduled_date DESC);
CREATE INDEX idx_bookings_v3_type_status ON bookings_v3 (booking_type, status);
CREATE INDEX idx_bookings_v3_reminder ON bookings_v3 (scheduled_date, reminder_24h_sent, reminder_2h_sent)
  WHERE status IN ('pendiente', 'confirmado');
```

**Trade-off**: unificar simplifica hooks pero requiere migración de datos y deprecación lenta de V2 tables. **Decisión sugerida**: **NO unificar en esta fase**. Mantener 4 tablas V2 y crear un **view `all_bookings_view_v2`** (ya existe según migración). Unificar es riesgoso para un sistema con usuarios reales.

### 12.2 Tablas nuevas sugeridas

```sql
-- Timeline de eventos (ya existe: booking_events, mantener)

-- Intentos de notificación (nueva)
CREATE TABLE notification_attempts (...); -- ver §9.3

-- Tokens de push nativo (nueva)
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  token TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token)
);

-- Adjuntos de booking (nueva, opcional fase 3)
CREATE TABLE booking_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_type TEXT NOT NULL,
  booking_id UUID NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  file_url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 12.3 Columnas nuevas en existentes

```sql
-- vet_bookings
ALTER TABLE vet_bookings
  ADD COLUMN private_notes TEXT,
  ADD COLUMN started_at TIMESTAMPTZ,
  ADD COLUMN follow_up_booking_id UUID REFERENCES vet_bookings(id),
  ADD COLUMN medical_record_id UUID REFERENCES medical_records(id);

-- medical_records
ALTER TABLE medical_records
  ADD COLUMN booking_id UUID REFERENCES vet_bookings(id) ON DELETE SET NULL,
  ADD COLUMN booking_type TEXT DEFAULT 'vet';

-- profiles
ALTER TABLE profiles
  ADD COLUMN email_opted_in BOOLEAN DEFAULT FALSE,
  ADD COLUMN push_opted_in BOOLEAN DEFAULT TRUE;

-- google_calendar_tokens (revoked_at ya existe)
-- agregar trigger para notificar revocación al frontend
```

### 12.4 Normalización de FK

**Decisión**: renombrar todas las columnas de provider a `provider_id` con migración segura.

```sql
ALTER TABLE walk_bookings RENAME COLUMN walker_id TO provider_id;
ALTER TABLE dogsitter_bookings RENAME COLUMN dogsitter_id TO provider_id;
ALTER TABLE training_bookings RENAME COLUMN trainer_id TO provider_id;
ALTER TABLE vet_bookings RENAME COLUMN service_provider_id TO provider_id;
-- (mantener bookings V1 como está, será deprecada)
```

**Seguir la regla CLAUDE.md §9.8** (proteger usuarios existentes): migración en una transacción, tipos regenerados en el mismo PR, fallback leer ambas columnas durante 1 release.

---

## 13. Reglas de negocio

| # | Regla | Enforcement |
|---|---|---|
| B1 | No doble reserva del mismo slot | Unique index + check en RPC create_booking |
| B2 | No reserva en slot fuera de `provider_availability_rules` + sin excepción `override` | Check en RPC |
| B3 | No reserva durante `provider_availability_exceptions` tipo `block` | Check en RPC |
| B4 | Cancel por owner: sólo > 2h antes sin penalidad | Validación en hook + toast informativo |
| B5 | Cancel por provider: sólo > 24h antes sin penalidad | Validación + motivo obligatorio |
| B6 | Reschedule owner: sólo > 24h antes | Validación |
| B7 | Reschedule: mantiene mismo owner+pet+provider, solo cambia fecha/hora/servicio | RPC |
| B8 | No-show: sólo el provider puede marcarlo, >30min post scheduled | Validación en UI + backend |
| B9 | Completed: sólo provider, sólo desde `en_curso` o `confirmado` (si no hubo check-in) | State machine |
| B10 | Follow-up: crear sólo si cita actual está `completado` | UI |
| B11 | Integridad cita ↔ ficha: si booking completed, habilitar crear medical_record | Trigger UI |
| B12 | Estados imposibles: transición fuera del state machine → ERROR | CHECK constraint + state machine validation |
| B13 | Un owner no puede reservar > 3 citas simultáneas con mismo provider (anti-abuse) | Config backend (opcional) |
| B14 | Provider puede bloquear a un owner problematic (no-show repetido) | Feature futura |
| B15 | No reserva retroactiva (fecha < hoy) | UI + backend |
| B16 | No reserva > 6 meses en el futuro | UI (config) |
| B17 | Slot debe respetar `buffer_minutes` entre reservas consecutivas | RPC availability |
| B18 | Capacidad: si `capacity=1` en rule, 1 booking por slot; si >1, permitir hasta capacity | RPC |
| B19 | Si owner cancela y repaga, no crear nuevo booking desde el cancelado (solo reschedule) | RPC |
| B20 | Si provider marca completed sin crear nota clínica, UI pregunta una vez (no bloqueante) | UI |

---

## 14. Plan de implementación por fases

### Fase 1 — Quick wins (1-2 semanas)

**Objetivo**: estabilizar lo existente sin refactors riesgosos.

| Task | Archivos | Complejidad | Dependencias | Riesgo | Impacto |
|---|---|---|---|---|---|
| 1.1 Lock submit en [BookingFlow](../src/components/booking/BookingFlow.tsx) con `isPending` | BookingFlow.tsx | Baja | — | Nulo | Alto (evita dupes) |
| 1.2 Helper `formatTime()` y `formatBookingDate()` en [format.ts](../src/lib/format.ts) | format.ts, 8+ componentes | Baja | — | Nulo | Medio |
| 1.3 Badges con íconos + WCAG AA | BookingStatusBadge.tsx, bookingStateMachine.ts | Baja | — | Nulo | Medio |
| 1.4 Error state en [AvailabilityCalendar](../src/components/booking/AvailabilityCalendar.tsx) | AvailabilityCalendar.tsx | Baja | — | Nulo | Medio |
| 1.5 Confirmación obligatoria en cancelar | CancelBookingDialog.tsx | Baja | — | Nulo | Alto |
| 1.6 Timeline visible en `BookingDetailDrawer` (consume `booking_events`) | BookingDetailDrawer.tsx, nuevo hook `useBookingEvents` | Media | — | Bajo | Alto |
| 1.7 Empty states mejorados en [MyBookings](../src/pages/MyBookings.tsx) | MyBookings.tsx | Baja | — | Nulo | Medio |
| 1.8 Exponer tab "Pendientes de tu acción" claro en [ProviderBookingsInbox](../src/components/provider/ProviderBookingsInbox.tsx) | ProviderBookingsInbox.tsx | Baja | — | Bajo | Alto |
| 1.9 Frontend detecta `google_calendar_tokens.revoked_at` y muestra banner | hook nuevo + settings page | Media | migración ya aplicada | Bajo | Medio |
| 1.10 Playwright smoke tests para flujos críticos (crear, confirmar, cancelar) | tests/ | Media | — | Bajo | Alto |

**Criterio de salida Fase 1**: los 10 quick wins en prod, 0 regresiones.

### Fase 2 — Core booking overhaul (3-4 semanas)

**Objetivo**: rediseño de la experiencia vet + integración cita↔ficha.

| Task | Complejidad | Dependencias | Riesgo | Impacto |
|---|---|---|---|---|
| 2.1 Nueva página `/provider/today` (vista Hoy con timeline) | Alta | — | Medio | Alto |
| 2.2 Vista semana para provider | Alta | 2.1 | Medio | Alto |
| 2.3 Integración booking completed → crear nota clínica 1-click | Alta | migración `medical_records.booking_id` | Alto | Alto |
| 2.4 Follow-up automático desde cita completada | Media | 2.3 | Medio | Medio |
| 2.5 RPC `get_available_slots()` + `create_booking()` + `transition_booking()` | Alta | — | Medio | Alto |
| 2.6 `SlotPicker` con sugerencias alternativas en colisión | Media | 2.5 | Bajo | Medio |
| 2.7 Reprogramar con aviso al otro lado | Media | — | Bajo | Alto |
| 2.8 Filtros avanzados en `ProviderBookingsInbox` | Media | — | Bajo | Medio |
| 2.9 Bulk actions en inbox (confirmar múltiple, cancelar bloque por feriado) | Alta | 2.5 | Medio | Medio |
| 2.10 Normalizar FK a `provider_id` en todas las tablas booking | Media | migración + regenerar tipos + fallback read | Alto | Medio |
| 2.11 Wizard para `AvailabilityRulesEditor` + preview | Alta | — | Bajo | Medio |
| 2.12 Deprecar tabla `provider_availability` (legacy) | Media | migración + tests | Alto | Bajo |

**Criterio de salida Fase 2**: vet puede completar un día típico sin salir del panel. Cita↔ficha conectada.

### Fase 3 — Reminders, alerts y automatización (2-3 semanas)

**Objetivo**: sistema de notificaciones multi-canal fiable.

| Task | Complejidad | Dependencias | Riesgo | Impacto |
|---|---|---|---|---|
| 3.1 Tabla `notification_attempts` + tracking | Baja | migración | Bajo | Alto |
| 3.2 Extender `booking-reminders-cron` para WhatsApp | Media | — | Medio | Alto |
| 3.3 Edge fn `send-email-reminder` + integración Resend/similar | Alta | cuenta Resend | Medio | Medio |
| 3.4 Backend push notifications (FCM/APNs via Firebase) | Alta | Firebase setup | Alto | Alto |
| 3.5 Tabla `device_tokens` + registro desde Capacitor | Media | 3.4 | Medio | — |
| 3.6 Cascada de canales con fallback | Media | 3.1-3.5 | Medio | Alto |
| 3.7 Sync bidireccional Google Calendar (webhooks) | Alta | setup webhook endpoint | Alto | Medio |
| 3.8 Retry queue para Google sync fallidos | Media | — | Medio | Medio |
| 3.9 Alertas admin: cron falló, opt-in bajo, tasa de error alta | Media | Sentry | Bajo | Alto |
| 3.10 Widget admin "Pulso de reservas" (KPIs booking) | Media | dashboard existente | Bajo | Alto |

**Criterio de salida Fase 3**: recordatorios multicanal con tasa de delivery > 95%.

### Fase 4 — Polish, QA y hardening (2 semanas)

**Objetivo**: listo para producción sólida.

| Task | Complejidad |
|---|---|
| 4.1 Tests E2E Playwright: 10 flujos críticos | Media |
| 4.2 Tests unitarios para state machine (edge cases) | Baja |
| 4.3 Performance: lazy load calendario, virtualización si > 50 eventos | Media |
| 4.4 Accesibilidad WCAG AA audit + fixes | Media |
| 4.5 Mobile QA (iOS + Android WebView Capacitor) | Media |
| 4.6 Load testing: 1000 bookings/día simulados | Media |
| 4.7 Runbooks: diagnóstico de cita fallida, Google Calendar revoked, cron caído | Baja |
| 4.8 Docs de soporte: cómo usar el admin para resolver disputas | Baja |
| 4.9 Cleanup: borrar código V1 si tráfico = 0 | Media |
| 4.10 Rollout plan + feature flags | Media |

---

## 15. Priorización

### Must have (sin esto no lanzamos)

- F1, F2, F4 — confirmación manual con UI, reschedule con aviso, cita→ficha.
- U1, U15 — lock submit, vista Hoy del vet.
- D5, D6 — payment integration y Google revoked detection.
- R6, R7 — recordatorio 24h y 2h confiables.
- T5 — tests E2E para flujos críticos.
- 1.1-1.10 (todos los quick wins).
- 2.1, 2.3, 2.5 (vista Hoy, cita↔ficha, RPCs).
- 3.1, 3.2 (tracking + WhatsApp en bookings).
- 4.1, 4.7 (tests + runbooks).

### Should have (mejora significativa sin ser bloqueante)

- F3, F5, F9 — check-in dedicado, follow-up auto, plantillas.
- U6, U7, U8, U14 — filtros, vista semana, wizard availability, deep links.
- D1, D2 — deprecar `provider_availability`, normalizar FK.
- R8, R14 — aviso reprograma, retraso del vet.
- T1, T7, T8 — retry queue, RPCs.
- 2.2, 2.4, 2.7-2.11 (semana, follow-up, reschedule, filtros, bulk, FK, wizard).
- 3.3-3.6 (email, push backend, cascade canales).
- 4.2-4.5 (unit tests, perf, a11y, mobile QA).

### Nice to have

- F6, F8, F10 — sugerencia alternativa fancy, bulk actions avanzadas, waitlist.
- U9, U10, U13 — preview availability, ver ficha desde booking, animación completar.
- 2.12 (deprecar provider_availability definitiva).
- 3.7, 3.8 (Google bidireccional, retry queue — hay workarounds).
- 4.6, 4.9 (load test, cleanup V1).

---

## 16. Riesgos y trade-offs

### Técnicos

| # | Riesgo | Mitigación |
|---|---|---|
| TR1 | Migrar FK `provider_id` rompe queries existentes | Fallback read ambas columnas 1 release + regenerar tipos en el mismo PR |
| TR2 | Unificar tablas V2 → V3 es un mega-refactor | **NO unificar** en este plan. Mantener 4 tablas + view |
| TR3 | RPCs nuevos tienen bugs edge case | Tests unitarios + canary release |
| TR4 | Google Calendar webhooks requieren endpoint público HTTPS | Usar Supabase edge function + token compartido |
| TR5 | Push backend requiere Firebase Admin SDK en Deno | Validar disponibilidad, fallback REST API |

### De producto

| # | Riesgo | Mitigación |
|---|---|---|
| PR1 | Vets actuales se confunden con nueva vista Hoy | Onboarding in-app + mantener vista antigua como toggle 1 release |
| PR2 | Política de cancelación > 2h antes molesta a dueños | Feature flag + comunicar claramente |
| PR3 | Integración cita↔ficha fuerza nota clínica y friction | Hacer nota opcional, sólo sugerirla |

### De adopción

| # | Riesgo | Mitigación |
|---|---|---|
| AR1 | Dueños no optan in a WhatsApp | Copy claro del valor + opt-in al crear cuenta |
| AR2 | Vets dejan de configurar availability rules si wizard es denso | Wizard simple + defaults sensatos |

### De UX

| # | Riesgo | Mitigación |
|---|---|---|
| UR1 | Muchas acciones contextuales abruman al vet | Priorizar 1 acción primaria + resto en menu |
| UR2 | Mobile WebView Capacitor tiene quirks con time inputs | Validar con cross-platform-validator, fallback custom picker |

### De escalabilidad

| # | Riesgo | Mitigación |
|---|---|---|
| SR1 | `useUnifiedCalendar` trae mes completo en memoria | Paginar por semana + virtualize si > 50 eventos |
| SR2 | `booking-reminders-cron` cada 30min puede saturar | Batch + cursor pagination + índice en `(scheduled_date, reminder_*)` |

### De mantenimiento

| # | Riesgo | Mitigación |
|---|---|---|
| MR1 | 4 tablas booking = 4x código | Abstracción en `bookings_service.ts` + `get_provider_column(type)` helper centralizado |
| MR2 | State machine cambios futuros rompen tests | Separar state machine en módulo con tests |

---

## 17. Criterios de éxito

### Métricas funcionales

| KPI | Baseline | Meta 30d post-release | Meta 90d |
|---|---|---|---|
| Tasa de confirmación en 24h | s/medir | > 85% | > 95% |
| No-show rate | s/medir | < 15% | < 8% |
| Tasa de cancelación | s/medir | < 10% | < 7% |
| Tiempo promedio reserva (owner) | s/medir | < 90s | < 60s |
| Tasa de completed/confirmed | s/medir | > 85% | > 92% |
| Tasa de delivery recordatorios | s/medir | > 95% | > 98% |

### Métricas UX

- NPS de dueños: > 8 (post-cita).
- NPS de vets: > 7 (post-mes).
- Support tickets sobre reservas: < 5% del total.
- Errores JS en flujo booking: < 0.5%.

### Métricas operacionales

- Bookings huérfanos (sin provider): 0.
- Tokens Google revocados no propagados a UI: 0.
- Crones fallidos sin alerta admin: 0.
- Bookings en estado imposible (ej: `completado` sin `confirmed_at`): 0.

### Métricas técnicas

- Tests E2E passing: 100%.
- Code coverage state machine: > 95%.
- Time to first booking render (P95): < 1.5s.
- Time to availability fetch (P95): < 800ms.

---

## 18. Backlog accionable

### Frontend

- [ ] `isPending` lock en submit buttons de [BookingFlow.tsx](../src/components/booking/BookingFlow.tsx).
- [ ] Helper `formatTime(t: string)` y `formatBookingDate(d: string)` en [src/lib/format.ts](../src/lib/format.ts); reemplazar usos ad-hoc.
- [ ] Refactor `BookingStatusBadge` con íconos + clases WCAG AA.
- [ ] Crear `BookingTimeline.tsx` que consume `useBookingEvents(booking_id, booking_type)`.
- [ ] Crear `useBookingEvents.ts` hook.
- [ ] Mejorar empty state de [MyBookings.tsx](../src/pages/MyBookings.tsx).
- [ ] Agregar tab "Pendientes de tu acción" visible en [ProviderBookingsInbox.tsx](../src/components/provider/ProviderBookingsInbox.tsx).
- [ ] Banner "Google Calendar desconectado" en [src/pages/Profile.tsx](../src/pages/Profile.tsx) cuando `revoked_at IS NOT NULL`.
- [ ] Crear página `ProviderToday.tsx` (timeline 7am-8pm del día).
- [ ] Crear `SlotPicker.tsx` con sugerencias alternativas.
- [ ] Crear `BookingActionsMenu.tsx` con acciones contextuales.
- [ ] Filtros avanzados en inbox (date range, mascota, servicio).
- [ ] Bulk actions bar para inbox.
- [ ] Wizardizar [AvailabilityRulesEditor.tsx](../src/components/provider/AvailabilityRulesEditor.tsx).
- [ ] Agregar `AvailabilityPreview.tsx`.
- [ ] Deep links: `/provider/:id/book?pet=:petId&slot=:slotId`.

### Backend

- [ ] RPC `get_available_slots(provider_id, target_date, service_type)` con security definer.
- [ ] RPC `create_booking(type, payload)` que wrappea insert + booking_event.
- [ ] RPC `transition_booking(booking_id, booking_type, new_status, metadata)` con validación state machine.
- [ ] Edge fn `sync-payment-to-booking` invocada desde `flow-webhook`.
- [ ] Edge fn `send-email-reminder` con Resend.
- [ ] Edge fn `google-calendar-webhook` para recibir push notifications de Google.
- [ ] Edge fn `booking-action-retry` para reintento de Google sync fallidos.
- [ ] Extender `booking-reminders-cron` para WhatsApp.
- [ ] Extender `reminder-cron` para email.
- [ ] Backend push (FCM/APNs) desde Supabase.

### Base de datos

- [ ] Migración: `ALTER TABLE walk_bookings RENAME walker_id TO provider_id` (+ similares).
- [ ] Migración: `ALTER TABLE medical_records ADD COLUMN booking_id`.
- [ ] Migración: `CREATE TABLE notification_attempts`.
- [ ] Migración: `CREATE TABLE device_tokens`.
- [ ] Migración: `ALTER TABLE vet_bookings ADD COLUMN private_notes, started_at, follow_up_booking_id, medical_record_id`.
- [ ] Migración: deprecar `provider_availability` (backup + check uso + drop en release +1).
- [ ] Migración: cambiar `ON DELETE SET NULL` → soft delete en `service_providers`.
- [ ] Migración: `ALTER TABLE profiles ADD COLUMN email_opted_in, push_opted_in`.
- [ ] Trigger: `after_booking_completed` → sugerir follow-up + crear medical_record stub.
- [ ] Trigger: `before_booking_insert` → validar slot disponible + no colisión.

### Notificaciones

- [ ] Cascada de canales con fallback implementada.
- [ ] Idempotencia por (booking_id, reminder_type, channel) en `notification_attempts`.
- [ ] Templates WhatsApp aprobados en Meta Business (24h, 2h, cancelled, rescheduled).
- [ ] Templates email (24h, 2h, cancelled, rescheduled).
- [ ] Push payloads definidos en `src/lib/pushMessages.ts`.
- [ ] Admin alert si tasa de delivery < 90% en 24h.

### UX/UI

- [ ] Storybook (opcional) para componentes booking.
- [ ] Audit a11y con axe-core.
- [ ] Copy review con [ux-copy-chilean](../.claude/agents/ux-copy-chilean.md) (tuteo chileno).
- [ ] Iconografía coherente con lucide-react.
- [ ] Animaciones suaves (framer-motion opcional) en transiciones de estado.

### QA

- [ ] Playwright E2E: 10 flujos críticos (crear, confirmar, cancelar, reschedule, complete, no-show, follow-up, bulk, Google sync, reminder).
- [ ] Unit tests state machine (todos los edge cases).
- [ ] Cross-platform test con [cross-platform-validator](../.claude/agents/cross-platform-validator.md).
- [ ] Load test 1000 bookings/día simulados (k6 o Artillery).
- [ ] RLS audit con [rls-guardian](../.claude/agents/rls-guardian.md).

### Documentación

- [ ] Este documento como referencia viva.
- [ ] Runbook: "Cita no llegó al vet — cómo diagnosticar".
- [ ] Runbook: "Google Calendar revocado — cómo guiar al user".
- [ ] Runbook: "Cron de recordatorios falló — cómo reactivar".
- [ ] Docs de support: cómo usar admin para resolver disputas.
- [ ] Actualizar [MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md) con Booking V2 completo.
- [ ] Actualizar [diagrams/FLUJO_COMPLETO.mmd](../diagrams/FLUJO_COMPLETO.mmd) con flujos nuevos.
- [ ] Entrada en [INDEX.md](../INDEX.md) apuntando a este doc.

---

## 19. Dudas abiertas

1. **¿`payment_status` en `vet_bookings` se integra con `flow-webhook`?** Hay que auditar si el webhook actualiza la columna o sólo maneja el pago aislado.
2. **¿`appointments` table sigue activa o deprecada?** Revisar uso residual.
3. **¿`bookings` V1 aún tiene tráfico en prod?** Query `SELECT count(*) FROM bookings WHERE created_at > now() - interval '30 days'` para validar.
4. **¿Cuál es la política de cancelación del negocio?** ¿2h para owner? ¿24h para provider? Validar con stakeholders.
5. **¿Se cobra por no-show?** ¿Hay infraestructura de cobro retrasado? Impacta regla B4/B8.
6. **¿WhatsApp Meta Cloud API tiene todas las templates aprobadas?** (24h, 2h, cancelled, rescheduled). Ver memoria `project_spa_meta_verif_2026_04_17`.
7. **¿Se quiere soportar múltiples mascotas en un vet_booking?** (consultas de grupo). Actualmente `pet_id` singular.
8. **¿Firebase Admin SDK funciona en Deno edge functions?** Validar antes de 3.4.
9. **¿Se integra con el sistema de causas/donaciones?** (donar % de cada reserva). No está en scope de este plan, anotar como futuro.
10. **¿Se quiere versionar availability rules?** (ej: "del 1/5 cambié mi horario") — útil para auditoría pero complejo. **Recomendación**: NO en esta fase.
11. **¿Políticas de reseña obligatoria post-cita?** Actualmente [MyBookings.tsx](../src/pages/MyBookings.tsx) maneja reseñas pero sin enforcement.
12. **¿Se requiere integración con sistemas PMS externos?** (ej: si un vet ya usa otra herramienta) — feature futura.

---

## 20. Recomendación final

### Decisiones recomendadas (firmes)

1. **Mantener las 4 tablas V2** (`vet_bookings`, `walk_bookings`, `dogsitter_bookings`, `training_bookings`). **No unificar** en V3 — costo/beneficio no lo justifica con usuarios reales.
2. **Deprecar `provider_availability` (legacy)** en 2 releases: primero dejar de escribir, luego dropear.
3. **Normalizar `provider_id`** en todas las tablas — reduce complejidad de hooks significativamente.
4. **Audit trail `booking_events` es la fuente de verdad** del ciclo de vida. Toda UI de detalle debe consumirlo vía `BookingTimeline`.
5. **State machine centralizada** (`src/lib/bookingStateMachine.ts`) con tests unitarios obligatorios.
6. **Cascada de canales** con fallback: WhatsApp (preferido si opt-in) → Push → Email → In-app.
7. **Fase 1 (quick wins) primero** — 2 semanas, bajo riesgo, alto impacto percibido.
8. **Vista Hoy del vet** es **P0** — sin eso, Paw Friend Premium no compite con Timely/Petly.
9. **Cita ↔ ficha clínica integradas** es **P0** — conecta la joya de la corona con su fuente de datos.
10. **Tests E2E Playwright** son **obligatorios** antes de ship Fase 2.

### Decisiones que requieren validación

- Política de cancelación (2h owner / 24h provider) — requiere validar con stakeholders.
- Cobro por no-show — infraestructura y política legal pendiente.
- Bidireccional Google Calendar — valor vs complejidad (webhooks).
- Soporte múltiples mascotas en vet_booking — ¿hay demanda real?
- Firebase para push — validar con POC técnico antes de comprometer.

### Orden ideal de ejecución

**Semana 1-2**: Fase 1 (quick wins). Ship a producción con feature flag.

**Semana 3-6**: Fase 2 (core overhaul). Wizard, vista Hoy, cita↔ficha, RPCs, FK normalization. Canary release.

**Semana 7-9**: Fase 3 (notifications). Cascada de canales, email, push backend, retry queue.

**Semana 10-11**: Fase 4 (hardening). Tests E2E, load test, docs, rollout.

**Total estimado**: **11 semanas** para rediseño completo. Con prioridades altas solamente: **6 semanas**.

### Principio rector

> "El sistema actual **funciona** en happy path. No hay que tirarlo. Hay que **endurecerlo** en los bordes, **integrarlo** con la joya de la corona (ficha clínica), **simplificarlo** para el vet, y **confiabilizar** los recordatorios. Todo lo demás es secundario."

---

## Apéndice A — Archivos clave del sistema actual

| Rol | Archivo | Propósito |
|---|---|---|
| Owner list | [src/pages/MyBookings.tsx](../src/pages/MyBookings.tsx) | Lista reservas V1+V2 |
| Owner calendar | [src/pages/UnifiedCalendar.tsx](../src/pages/UnifiedCalendar.tsx) | Calendario mensual unificado |
| Provider dash | [src/pages/ProviderDashboard.tsx](../src/pages/ProviderDashboard.tsx) | Shell con 24h + pacientes |
| Provider inbox | [src/components/provider/ProviderBookingsInbox.tsx](../src/components/provider/ProviderBookingsInbox.tsx) | Tabs pending/today/upcoming/past |
| Availability editor | [src/components/provider/AvailabilityRulesEditor.tsx](../src/components/provider/AvailabilityRulesEditor.tsx) | CRUD reglas + excepciones |
| Booking flow | [src/components/booking/BookingFlow.tsx](../src/components/booking/BookingFlow.tsx) | Wizard crear reserva |
| State machine | [src/lib/bookingStateMachine.ts](../src/lib/bookingStateMachine.ts) | Transiciones válidas |
| Availability logic | [src/lib/availabilitySlots.ts](../src/lib/availabilitySlots.ts) | Computa slots |
| Hook unified | [src/hooks/useMyBookingsV2.ts](../src/hooks/useMyBookingsV2.ts) | Query 4 tablas V2 |
| Hook calendar | [src/hooks/useUnifiedCalendar.ts](../src/hooks/useUnifiedCalendar.ts) | Query rutinas+reminders+bookings |
| Hook mutations | [src/hooks/useBookingMutations.ts](../src/hooks/useBookingMutations.ts) | Create/cancel/reschedule/confirm/start/complete/no_show |
| Hook availability | [src/hooks/useProviderAvailabilityRules.ts](../src/hooks/useProviderAvailabilityRules.ts) | CRUD rules+exceptions |
| Hook slots | [src/hooks/useAvailableSlots.ts](../src/hooks/useAvailableSlots.ts) | Computa slots disponibles |
| Migración V2 | `supabase/migrations/20260520000000_booking_system_v2.sql` | Fuente de verdad V2 |
| Cron reminders | `supabase/functions/reminder-cron/index.ts` | Daily 8am pet_reminders |
| Cron bookings | `supabase/functions/booking-reminders-cron/index.ts` | 30min 24h/2h |

---

## Apéndice B — Referencias del repo

- [CLAUDE.md](../CLAUDE.md) — manual operativo
- [INDEX.md](../INDEX.md) — índice maestro de documentación
- [MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md) — mapa de módulos
- [diagrams/FLUJO_COMPLETO.mmd](../diagrams/FLUJO_COMPLETO.mmd) — flujo end-to-end
- [audits/FEATURES_INCOMPLETAS_2026_04_14.md](../audits/FEATURES_INCOMPLETAS_2026_04_14.md) — 28 features con gaps
- [docs-raiz/planes/SUGERENCIAS_COMPLETAS_2026_04_16.md](../docs-raiz/planes/SUGERENCIAS_COMPLETAS_2026_04_16.md) — 49 sugerencias

---

**Fin del documento.**

_Este documento es vivo y debe actualizarse cuando las fases avancen. Mantener en sincronía con [INDEX.md](../INDEX.md) y [MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md)._
