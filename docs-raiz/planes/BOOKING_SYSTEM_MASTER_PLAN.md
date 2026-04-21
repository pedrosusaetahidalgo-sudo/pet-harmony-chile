# BOOKING SYSTEM — Master Plan

> Plan maestro para rediseñar, refactorizar y perfeccionar todo el dominio de reservas / agenda / calendario / recordatorios / rutinas / notificaciones de Paw Friend.
>
> **Autor:** Principal Product Engineer + Staff UX + Staff Data (auditoría automatizada).
> **Fecha:** 2026-04-21.
> **Branch base:** `main`.
> **Alcance:** tutor + oferente de servicio + veterinario + clínica + admin, en mobile/desktop/WebView.
>
> Convención de marcas a lo largo del documento:
> - **[✓ Confirmado]** = verificado en código/migraciones con path.
> - **[? Inferencia]** = probable dado contexto pero no 100% verificado.
> - **[⊕ Propuesta]** = nuevo, no existe hoy.

---

## 1. Resumen ejecutivo

### 1.1 Diagnóstico general

Paw Friend tiene ya **la mitad de un sistema serio de booking** construido ("Booking System V2", migración `supabase/migrations/20260520000000_booking_system_v2.sql`), con partes bien diseñadas: máquina de estados tipada, audit trail, reglas de disponibilidad por día de semana, excepciones, commission calc y recordatorios automáticos 24h/2h.

Pero en la práctica **el dominio está fragmentado en tres generaciones de código que coexisten**:

1. **V1 legacy** — tabla `bookings` + `service_slots`, modal simple (`src/components/calendar/BookingModal.tsx`), aún activo desde `/mis-reservas` tab "Buscar disponibilidad".
2. **V2 directorio** — tablas tipo-específicas (`vet_bookings`, `walk_bookings`, `training_bookings`, `dogsitter_bookings`), wizard de 3 pasos (`src/components/booking/BookingFlow.tsx`), punto de entrada canónico desde perfil público del vet.
3. **V? aspiracional** — `EnhancedBookingDialog.tsx` (ruta muerta probable, aún en `ServiceDirectory.tsx`), más varios hooks con lógica duplicada (`useMyBookingsV2` vs `useProviderBookingsInbox`).

El tutor vive esta fragmentación como **dos tabs confusos en `/mis-reservas`** (histórico vs búsqueda), un calendario unificado aparte (`/calendario`) que no permite reservar, y un wizard que no muestra precios ni política de cancelación antes de confirmar. El provider vive esta fragmentación como **una agenda de solo 24 h** (`TodayAgendaCard`) que además **tiene un bug de fuente** — consulta por `vet_id` legacy y pierde todas las reservas llegadas vía directorio — y la **imposibilidad de reprogramar** desde su propio inbox.

### 1.2 Principales brechas

| # | Brecha | Severidad | Dónde |
|---|---|---|---|
| B1 | 3 rutas de creación de booking coexistiendo (`BookingFlow`, `BookingModal`, `EnhancedBookingDialog`) | **P0** | `src/components/booking/*` + `src/components/calendar/BookingModal.tsx` + `src/components/EnhancedBookingDialog.tsx` |
| B2 | `TodayAgendaCard` consulta `vet_id` legacy → pierde bookings V2 del directorio | **P0** | `src/components/provider/TodayAgendaCard.tsx:38` |
| B3 | Provider **no puede reprogramar** — solo owner tiene `RescheduleDialog` | **P0** | `src/components/booking/RescheduleDialog.tsx` |
| B4 | Push notifications bookings off (feature flag) → provider no se entera de reservas nuevas | **P0** | `src/lib/featureFlags.ts` |
| B5 | `useMyBookingsV2` hace 4 queries secuenciales sin paginación (waterfall) | **P1** | `src/hooks/useMyBookingsV2.ts:55-234` |
| B6 | `slot_duration_minutes` es global por regla → no soporta "consulta 30min + cirugía 90min" en un solo vet | **P1** | tabla `provider_availability_rules` |
| B7 | Clínica multi-vet: `vet_bookings` **no tiene `assigned_vet_id`** → owner no elige "al Dr. García específicamente", ni round-robin implementado | **P1** | migración `20260712020000_clinic_vet_seats.sql` |
| B8 | `BottomTabBar` tutor dice "My Paws" (inglés) — el resto de la app es tuteo chileno | **P2** | `src/components/BottomTabBar.tsx:69` |
| B9 | Sin sección "política de cancelación" visible antes de confirmar reserva | **P1** | `src/components/booking/BookingFlow.tsx` step "confirm" |
| B10 | Google Calendar conecta pero provider **no tiene vista de calendario** (solo dueño tiene `/calendario`) | **P1** | `ProviderDashboard` tabs |
| B11 | Timezone inconsistente: `scheduled_date TIMESTAMPTZ` + `start_time TIME` (sin tz) conviven — riesgo de desfase 1h con horario de verano chileno | **P1** | tablas `*_bookings` |
| B12 | Eventos analytics del funnel incompletos: falta `select_slot`, `confirm_booking`, `cancel_booking`, `reschedule_booking`, `no_show_marked` | **P1** | `src/lib/analytics.ts` |
| B13 | Validación débil en `BookingFlow` step "pet": no filtra `deceased_at`, no valida en form | **P2** | `src/components/booking/BookingFlow.tsx:67-81` |
| B14 | Ficha clínica sin link-in desde inbox provider (quick link "abrir ficha" falta) | **P2** | `src/components/provider/ProviderBookingsInbox.tsx` |
| B15 | `/calendario` no permite crear reserva desde un día vacío → flujo partido en dos páginas | **P1** | `src/pages/UnifiedCalendar.tsx` |
| B16 | `useAvailableSlots` recalcula todo el rango cada cambio de mes, sin caché de rules | **P2** | `src/hooks/useAvailableSlots.ts` |
| B17 | Sentry no captura errores de `useBookingMutations` (catch sin `captureException`) | **P2** | `src/hooks/useBookingMutations.ts:111-116` |
| B18 | Copy ambiguo: toast dice "Solicitud enviada" pero status de UI puede ser "Confirmada" (depende de `confirmation_mode`) | **P2** | `src/hooks/useBookingMutations.ts:108-109` |

### 1.3 Riesgos más importantes

1. **Doble reserva silenciosa**: la UNIQUE en `(provider_id, scheduled_date, start_time)` existe en V2 pero **V1 no la tiene** y el BookingModal sigue insertando en `bookings`. En la ventana de migración se pueden colar colisiones.
2. **Pérdida de confianza del vet**: no recibe notificaciones push, el inbox no se refresca en tiempo real, y la agenda de hoy no muestra bookings V2 del directorio → puede perder citas sin darse cuenta.
3. **Horario de verano chileno (abril / septiembre)**: `TIMESTAMPTZ` + `TIME` puros pueden dar diferencias de 60 min en slots calculados cerca del switch. Alto riesgo operacional en abril 2026 y septiembre 2026.
4. **Datos heredados**: al consolidar V1 → V2, hay filas en `bookings` (legacy) que probablemente no existen en `vet_bookings`. Si se borra `bookings` sin migración previa, se pierde historial.
5. **Rate limit Flow.cl en commission calc**: el trigger de `provider_commission_calc` corre al completar booking. Si hay un batch grande de completados al cierre del mes, puede saturar.

### 1.4 Visión del sistema objetivo

Un dominio unificado llamado **`booking`** con:

- **Un solo tipo de entidad** (`booking`) con `booking_kind` como discriminador, reemplazando las 4 tablas tipo-específicas actuales (migración de consolidación opcional, o bien vista materializada `v_all_bookings`).
- **Un solo punto de creación** (`BookingFlow` wizard) usado desde perfiles públicos, directorio, `/calendario`, y quick-actions.
- **Disponibilidad como servicio computado** (RPC `get_available_slots(provider_id, service_type, date_from, date_to)`) que internaliza rules + exceptions + existing bookings + buffers + capacity + duration overrides por servicio.
- **Una máquina de estados auditable** (ya existe, pulirla), con side-effects tipados: cada transición dispara eventos concretos (reminder, calendar sync, post-action prompt, analytics).
- **Dos experiencias de calendario** (owner + provider), ambas alimentadas por las mismas fuentes: bookings, rutinas, recordatorios, google events (read-only).
- **Un stack de notificaciones unificado**: `notify(category, channel, recipient, payload)` que consulta `user_notification_prefs`, registra `notification_attempts` y elige canal(es).
- **Timezones en serio**: todos los slots se almacenan en UTC como `TIMESTAMPTZ`; en el cliente se convierten a `America/Santiago` (o la tz del provider).

### 1.5 Top prioridades (ejecutar en este orden)

1. **P0-1** Fix `TodayAgendaCard` — usar `service_provider_id` y no `vet_id` legacy.
2. **P0-2** Unificar creación de booking — deprecar `BookingModal` V1 y `EnhancedBookingDialog`, dejar solo `BookingFlow`.
3. **P0-3** Dar a provider un `RescheduleFromInboxDialog` que proponga alternativas al owner.
4. **P0-4** Activar push a provider on new booking (edge fn existe, falta trigger + flag).
5. **P0-5** Introducir `slot_duration_overrides_by_service` en `provider_availability_rules` (JSONB) para duraciones por tipo.
6. **P1-6** Extraer `useAvailableSlots` a un RPC Postgres (performance + consistencia con RLS).
7. **P1-7** Agregar `assigned_vet_id` + wizard de asignación (round-robin o manual) para clínicas.
8. **P1-8** Migrar a timezone-aware storage (columna `scheduled_at TIMESTAMPTZ`, retirar `start_time TIME`).
9. **P1-9** Analytics: agregar 8 eventos faltantes del funnel.
10. **P1-10** Calendario del provider con vista semana/día + arrastrar para reprogramar.

---

## 2. Alcance del dominio booking en Paw Friend

### 2.1 ¿Qué áreas de la app toca?

**Rutas directamente en dominio booking** (26 rutas relevantes de las 67 totales en `src/App.tsx`):

| Ruta | Rol | Archivo | Toca |
|---|---|---|---|
| `/veterinarios` y sub-rutas por comuna/especialidad | público | `DirectorioVets.tsx` | descubrimiento |
| `/veterinarios/:slug` | público | `PerfilVetPublico.tsx` | CTA "Reservar consulta" |
| `/servicios`, `/services/:type` | auth | `Servicios.tsx`, `ServiceDirectory.tsx` | descubrimiento + reserva (V1) |
| `/maps` | auth | `Maps.tsx` | descubrimiento geo |
| `/refugios-hogares`, `/refugios/:slug` | público | `RefugiosHogares.tsx`, `RefugioPublico.tsx` | operación (adopción, no reserva) |
| `/paw-partners` | público | `PawPartners.tsx` | catalog sin booking |
| `/mis-reservas` | auth | `MyBookings.tsx` | listado + reserva (tab "Buscar") |
| `/calendario` | auth | `UnifiedCalendar.tsx` | visualización unificada |
| `/reminders` | auth | `Reminders.tsx` | recordatorios clínicos |
| `/rutinas`, `/mascota/:petId/rutinas` | auth | `Routines.tsx` | rutinas semanales |
| `/ficha/:petId` | auth | `PetClinicalRecord/*` | historial + post-booking (notas) |
| `/provider/dashboard` | provider | `ProviderDashboard.tsx` | gestión |
| `/provider/pacientes` | provider | `ProviderPatients.tsx` | gestión de pacientes |
| `/provider/profile-edit` | provider | `ProviderProfileEdit.tsx` | reglas de disponibilidad |
| `/provider/seats` | provider clínica | `ProviderSeats.tsx` | multi-vet |
| `/resena/:token` | público | ReviewPage | post-servicio |
| `/payment-result` | auth | `PaymentResult.tsx` | resultado Flow |
| `/home` | auth | `Home.tsx` | widget "próximas citas" |
| `/profile` | auth | `Profile.tsx` | Google Calendar status banner |

**Rutas indirectamente relacionadas** (comparten datos):
- `/admin` — `AdminBookings` widget (si existe) + KPIs dashboard.
- `/chat` — conversaciones tutor↔vet se originan tras booking.
- `/reportes` — weekly owner/vet reports incluyen métricas de agenda.
- `/panel-pro` — analytics premium con revenue por booking.

### 2.2 ¿Qué roles toca?

| Rol | Contacto con booking |
|---|---|
| **Owner / tutor** | Creación, visualización, reprogramación, cancelación, review, historial por mascota |
| **Provider (vet individual)** | Gestión de agenda, reglas de disponibilidad, inbox, confirmación manual, cancelación, marcaje completado/no-show, nota clínica post-cita |
| **Provider (clínica)** | Lo anterior + bulk import de pacientes + asignación entre seats + multi-sucursal [⊕ Propuesta] |
| **Shelter (refugio)** | NO crea reservas de servicio; su "booking" análogo es la **transferencia al adoptante** (fuera de scope de este plan) |
| **Admin** | Visibilidad global, resolución de disputas, métricas, moderación |
| **Service roles no-vet** (walker, sitter, trainer, groomer) | Confirmados como `primary_service_type` distinto pero comparten mismo modelo (`walk_bookings`, `training_bookings`, etc.) |

### 2.3 ¿Por qué booking es transversal?

Booking no es una pantalla. Es el **núcleo de 5 flujos de negocio**:

1. **Monetización B2C** — toda comisión para Paw Friend (10% / 5% / 3% / 0% por plan) se dispara al completar un booking. Sin booking, no hay revenue.
2. **Retención del dueño** — el 70% de acciones post-primer-uso ocurren a través de una reserva (follow-up clínico, siguiente paseo, control vacunas).
3. **Valor para el vet** — el inbox + agenda son su principal razón operativa para estar en la app; si pierden una cita, pierden la confianza.
4. **Ficha clínica** — cada booking completado puede derivar en una nota clínica con trazabilidad (`booking_id` FK en `vet_clinical_notes`).
5. **Gamificación (Paw Points)** — reservas completadas otorgan puntos (`trg_award_points_on_completion`), impactando el engagement de la capa "Labs".

Por eso cualquier inconsistencia local (un toast ambiguo, un slot mal calculado) se amplifica a los 5 flujos.

---

## 3. Mapa del sistema actual

### 3.1 Módulos involucrados

```
apps / rutas             src/pages/
  ├─ MyBookings.tsx                          # tutor: histórico + búsqueda
  ├─ UnifiedCalendar.tsx                     # tutor: vista unificada
  ├─ Reminders.tsx                           # tutor: recordatorios
  ├─ Routines.tsx                            # tutor: rutinas
  ├─ PetClinicalRecord/VetFichaView.tsx      # tutor/vet: ficha + historial
  ├─ DirectorioVets.tsx                      # público: descubrimiento
  ├─ PerfilVetPublico.tsx                    # público: perfil + CTA reservar
  ├─ ServiceDirectory.tsx                    # auth: directorio no-vet (usa V1)
  ├─ Servicios.tsx                           # auth: hub servicios
  ├─ ProviderDashboard.tsx                   # provider: hub
  ├─ ProviderBookingsInbox (embed)           # provider: inbox reservas
  ├─ ProviderPatients.tsx                    # provider: pacientes
  ├─ ProviderProfileEdit.tsx                 # provider: perfil + horarios
  ├─ ProviderSeats.tsx                       # provider clínica: seats
  └─ PaymentResult.tsx                       # resultado Flow

components               src/components/
  ├─ booking/
  │   ├─ BookingFlow.tsx                     # V2 wizard 3 pasos (canónico)
  │   ├─ AvailabilityCalendar.tsx            # selector fecha+slot
  │   ├─ BookingCard.tsx                     # card reutilizable (owner+provider)
  │   ├─ BookingDetailDrawer.tsx             # drawer de detalle
  │   ├─ CancelBookingDialog.tsx             # cancelar con motivo
  │   ├─ RescheduleDialog.tsx                # reprogramar (solo owner!)
  │   ├─ FollowUpDialog.tsx                  # crear follow-up tras completar
  │   ├─ SlotConflictDialog.tsx              # conflicto + alternativas
  │   ├─ BookingTimeline.tsx                 # audit trail visible
  │   ├─ BookingPrivateNotes.tsx             # notas provider-only
  │   └─ BookingToMedicalRecordCTA.tsx       # link a crear nota clínica
  ├─ calendar/
  │   ├─ BookingModal.tsx                    # V1 legacy (a deprecar)
  │   ├─ CalendarGrid.tsx                    # grilla mes
  │   ├─ DaySlotsList.tsx                    # slots del día
  │   ├─ SlotCard.tsx                        # card de slot
  │   ├─ CalendarFilters.tsx                 # filtros vista
  │   ├─ CalendarEventCard.tsx               # card de evento unificado
  │   └─ UnifiedDayView.tsx                  # detalle día unificado
  ├─ provider/
  │   ├─ ProviderDashboard.tsx               # hub + tabs
  │   ├─ ProviderBookingsInbox.tsx           # inbox (4 tabs: pending/today/upcoming/past)
  │   ├─ TodayAgendaCard.tsx                 # 24h agenda [BUG: vet_id]
  │   ├─ Next24hCard.tsx                     # sidebar mini
  │   ├─ AvailabilityRulesEditor.tsx         # editar reglas
  │   ├─ AvailabilityPreview.tsx             # preview visual
  │   ├─ NewPatientForm.tsx                  # crear mascota + booking opcional
  │   ├─ VetNoteEditor.tsx                   # nota clínica post-cita
  │   ├─ VetFollowupsCard.tsx                # seguimientos próximos
  │   ├─ ImportPatientsModal.tsx             # bulk CSV (plan clínica+)
  │   ├─ ConsultationRecorderModal.tsx       # audio transcript (parcial)
  │   ├─ ConsultationTemplateSelector.tsx    # plantillas
  │   └─ dashboard/ (BusinessTab, ClinicalTab, …)
  ├─ routines/
  │   ├─ RoutineForm.tsx
  │   ├─ RoutineCard.tsx
  │   └─ RoutineWeekView.tsx
  ├─ reminders/
  │   └─ AddReminderDialog.tsx
  ├─ BecomeProviderDialog.tsx                # wizard registro inline
  ├─ RoleGuard.tsx                           # protege rutas por rol
  ├─ GoogleCalendarStatusBanner.tsx          # banner status sync
  └─ EnhancedBookingDialog.tsx               # [¿MUERTO? legacy]

hooks                    src/hooks/
  ├─ useMyBookingsV2.ts                      # merge V1+V2 (waterfall)
  ├─ useBookingMutations.ts                  # 7 mutaciones
  ├─ useBookingDetail.ts                     # 1 booking detallado
  ├─ useBookingEvents.ts                     # audit trail
  ├─ useBookingPulseKpis.ts                  # KPIs vivos (dashboard)
  ├─ useAvailableSlots.ts                    # slots computados cliente
  ├─ useProviderAvailabilityRules.ts         # CRUD rules+exceptions
  ├─ useProviderBookingsInbox.ts             # inbox query
  ├─ useProviderDashboardStats.ts            # KPIs dashboard
  ├─ useVetAnalytics.ts                      # revenue timeline
  ├─ useUnifiedCalendar.ts                   # merge 4 fuentes (rutinas, reminders, bookings, vet_followups)
  ├─ useRoutines.ts                          # rutinas CRUD + completions
  ├─ useReminders.ts                         # recordatorios CRUD
  ├─ useNotifications.ts                     # notifs in-app
  ├─ useGoogleCalendarStatus.ts              # status sync
  ├─ useActiveRole.tsx                       # switch owner↔provider↔shelter
  ├─ useVetClinicalNotes.ts                  # notas clínicas CRUD
  └─ useProviderPlan.ts                      # gate features por plan

lib                      src/lib/
  ├─ bookingStateMachine.ts                  # estados + transiciones + helpers (sólido)
  ├─ availability.ts [? inferencia]          # computeSlotsForRange
  ├─ reminderTypes.ts                        # enum tipos de reminder (fix deworming)
  ├─ analytics.ts                            # PostHog + Firebase + Meta
  ├─ plans.ts                                # planes B2B + features
  ├─ sentry.ts                               # error monitoring (lazy)
  ├─ featureFlags.ts                         # flags
  └─ schemas.ts                              # zod (sin booking schema aún)

integrations             src/integrations/supabase/
  ├─ types.ts                                # auto-generado (~271 KB)
  └─ client.ts                               # supabase client

supabase/functions/      # edge functions relevantes
  ├─ reminder-cron/                          # pet_reminders 24h antes
  ├─ booking-reminders-cron/                 # vet_bookings 24h + 2h
  ├─ send-whatsapp-reminder/                 # WhatsApp Cloud API
  ├─ send-push-notification/                 # FCM (infra lista, no disparada por cron)
  ├─ google-calendar-oauth-init/
  ├─ google-calendar-callback/
  ├─ google-calendar-sync/                   # one-way app→Google
  ├─ google-calendar-disconnect/
  ├─ create-patient/                         # vet crea mascota + invita dueño
  ├─ send-pet-invitation/                    # email token reclamar mascota
  └─ flow-create-subscription, flow-webhook  # pagos B2B/Paw Member
```

### 3.2 Tablas principales (verificado en migraciones)

| Tabla | Propósito | Status |
|---|---|---|
| `vet_bookings` | reservas vet V2 | **principal** |
| `walk_bookings` | paseos | V2 |
| `training_bookings` | entrenamiento | V2 |
| `dogsitter_bookings` | cuidadores | V2 |
| `bookings` | legacy V1 | **a deprecar** |
| `service_slots` | slots predefinidos V1 | **a deprecar** |
| `booking_events` | audit trail transiciones | principal |
| `provider_availability_rules` | horarios base por día-semana | principal |
| `provider_availability_exceptions` | bloqueos/aperturas puntuales | principal |
| `service_providers` | providers (unificada) | principal |
| `services` / `provider_services` | catálogo + precios | [? inferencia] |
| `pet_reminders` | recordatorios clínicos | principal |
| `pet_routines` | rutinas semanales | principal |
| `routine_completions` | marca rutinas completadas | principal |
| `vet_clinical_notes` | notas post-consulta | principal |
| `pet_vet_links` | vínculos dueño↔vet (pending/accepted) | principal |
| `consultation_templates` | plantillas notas | principal |
| `clinic_vet_seats` | multi-vet en clínica | principal |
| `google_calendar_tokens` | OAuth tokens | principal |
| `external_calendar_events` | mapping app↔Google | principal |
| `notification_attempts` | audit envíos multi-canal | principal |
| `user_notification_prefs` | toggles por categoría/canal | principal |
| `whatsapp_message_log` | log envíos WhatsApp | principal |
| `fcm_tokens` | device tokens push | principal |
| `device_tokens` | idem (alias?) | [? duplicación] |

### 3.3 Dependencias cruzadas (grafo textual)

```
pets
  ↑ (pet_id FK)
  ├── vet_bookings ──→ service_providers (provider_id FK)
  │                 ├── booking_events (booking_id+booking_type)
  │                 ├── vet_clinical_notes (booking_id FK)
  │                 └── notification_attempts (booking_id)
  ├── pet_reminders (owner_id + pet_id)
  ├── pet_routines (owner_id + pet_id)
  │     └── routine_completions
  └── pet_vet_links (status: pending/accepted)

service_providers
  ├── provider_availability_rules
  ├── provider_availability_exceptions
  ├── services / provider_services (precios)
  ├── clinic_vet_seats (multi-vet)
  └── consultation_templates

profiles (auth.users)
  ├── google_calendar_tokens
  ├── external_calendar_events (source_type, source_id)
  ├── fcm_tokens / device_tokens
  ├── user_notification_prefs
  └── whatsapp_opted_in + whatsapp_number
```

---

## 4. Flujo actual del tutor (reconstruido del código)

### 4.1 Paso a paso real

1. **Entrada** (varias rutas): `/veterinarios` directorio, `/veterinarios/:slug` perfil, `/servicios/vets`, `/maps`, o `/mis-reservas` tab "Buscar disponibilidad".
2. **Evaluación del vet**: en `PerfilVetPublico.tsx` ve foto, especialidades, horario de hoy, rating, emergencias y precio "desde". **No ve** slots reales inline.
3. **CTA "Reservar consulta"** (línea 500) → si no autenticado, `/auth?return=/veterinarios/:slug`. Si autenticado, abre modal con `BookingFlow`.
4. **Step 1 del wizard — Pet**: grid 2 columnas con mascotas del tutor (`useQuery pets`, filtra `deceased_at IS NULL` en query pero no lo muestra). Estado vacío dice "No tienes mascotas" sin link directo a `/add-pet`.
5. **Step 2 — Slot**: `AvailabilityCalendar` muestra mes con dots en días con slots. Al hacer click en día, carga `useAvailableSlots` (hook que hace 3 queries paralelas: rules, exceptions, bookings). Selecciona hora.
6. **Step 3 — Confirm**: resumen (mascota, fecha, hora, vet, notas opcionales). **No muestra**: precio final, política de cancelación, método de pago. Botón "Confirmar".
7. **Creación**: `useCreateBooking` INSERT en tabla correspondiente según `bookingType`. Si código `23505` (UNIQUE violation), lanza `BookingConflictError` → `SlotConflictDialog` con 3 alternativas cercanas.
8. **Post-confirm**: toast "Solicitud enviada" o "Hora confirmada" (depende de `confirmation_mode='auto'` vs `'manual'`; el copy del toast no distingue entre los dos). Drawer se cierra.
9. **Visibilidad**: tutor debe navegar manualmente a `/mis-reservas` para ver su reserva. No hay redirect automático.
10. **Gestión**: en `/mis-reservas` tab "Mis reservas" ve card con status (Pendiente/Confirmada). Acciones: "Ver detalle", "Reprogramar", "Cancelar", "Reseña" (si pasada).
11. **Recordatorios**: el tutor recibe WhatsApp 24h antes **si** opted-in (`whatsapp_opted_in=true`). No recibe push ni email. El día-de, 2h antes, solo in-app (no WhatsApp).
12. **Reprogramación**: `RescheduleDialog` con grace 24h (tutor). Dentro de grace: gratis. Fuera: requiere motivo. Vuelve a `AvailabilityCalendar`.
13. **Cancelación**: `CancelBookingDialog` con grace 2h (tutor). Fuera de grace: requiere motivo obligatorio.
14. **Post-servicio (vet marca completado)**: tutor ve en drawer CTA "Crea la nota clínica" (link a `/ficha/:petId?booking=:id`) + `FollowUpDialog` con offsets preestablecidos (7/14/30/60/90 días).
15. **Review**: card en `/mis-reservas` muestra botón "Reseña" para bookings pasados sin review. Notificación automática 1 día después via trigger `auto_review_invitation`.
16. **Vínculo con ficha**: todas las notas clínicas del vet quedan disponibles al tutor si `pet_vet_links.status='accepted'`.

### 4.2 Fricciones detectadas (con locación exacta)

| # | Fricción | Ubicación | Efecto |
|---|---|---|---|
| F-T1 | Tabs "Mis reservas" vs "Buscar disponibilidad" confusos | `MyBookings.tsx:518-567` | Tutor duda si volver al directorio o buscar aquí |
| F-T2 | No muestra precio antes de confirmar | `BookingFlow.tsx` step confirm | Sorpresa post-pago, abandono |
| F-T3 | No muestra política de cancelación antes de confirmar | idem | Falta de confianza |
| F-T4 | Toast ambiguo "Solicitud enviada" vs "Confirmada" | `useBookingMutations.ts:108` | Tutor no sabe si debe hacer algo más |
| F-T5 | Estado vacío step "Pet" sin link a `/add-pet` | `BookingFlow.tsx:167` | Deadend para usuario nuevo |
| F-T6 | Calendar dots sin count de slots | `AvailabilityCalendar.tsx:57-66` | No sabe si 1 o 10 horarios libres |
| F-T7 | `/calendario` no permite crear reserva | `UnifiedCalendar.tsx` | Flujo partido en 2 páginas |
| F-T8 | Drawer mobile full-width, no bottom-sheet | `BookingDetailDrawer.tsx:57` | Ergonomía pobre thumb |
| F-T9 | Notas post-servicio solo llegan si se entra a drawer | idem | Features invisibles |
| F-T10 | WhatsApp reminder 2h antes no existe (solo in-app) | `booking-reminders-cron` | Tutor se olvida el día |
| F-T11 | No hay "pre-check-in" (¿llegarás? confirma 1h antes) | ⊕ propuesta | No-shows preventibles |
| F-T12 | Sin "agendar para otra mascota" quick-action | `BookingFlow.tsx` step pet | Tutor con 3+ mascotas debe reiniciar wizard |
| F-T13 | `/services/:type` paths no validados — `foo` carga vacío | `App.tsx + ServiceDirectory.tsx` | UX rota |
| F-T14 | "My Paws" (inglés) en BottomTabBar tutor | `BottomTabBar.tsx:69` | Inconsistente con tuteo chileno |
| F-T15 | Sin indicación de timezone ("14:00 hora Chile") | `SlotCard.tsx`, `BookingCard.tsx` | Tutor en el extranjero agenda mal |
| F-T16 | Revisión de historial por mascota requiere 3 clicks (Home → mascota → ficha → tab historial) | `PetClinicalRecord/*` | Fricción en uso recurrente |

### 4.3 Puntos donde el flujo se corta

1. **De `/calendario` al acto de reservar**: hay que salir al directorio. No hay botón "Reservar una cita" desde un día vacío.
2. **De confirmar reserva a ver calendario**: tutor queda en drawer o tab, sin guía.
3. **De cita completada a nota clínica**: solo visible en drawer, no se empuja proactivamente.
4. **De follow-up sugerido a agendado**: `FollowUpDialog` crea booking inmediato pero no muestra el resultado en el calendario sin recargar.
5. **De review a próxima cita**: tras dejar review, no hay CTA "Agendar próximo control".

---

## 5. Flujo actual del oferente de servicio

### 5.1 Creación / gestión de servicios

- **Registro**: `/registro-veterinario` o inline via `BecomeProviderDialog` (wizard 2 pasos). Crea `service_providers.status='pending'` y no aparece en directorio hasta `is_directory_visible=true`.
- **Edición de perfil**: `/provider/profile-edit` con 4 tabs (info, horarios, precios, onboarding).
- **Catálogo de servicios**: tab "precios" con `MisPreciosEditor.tsx` — CRUD de `services` con `price_clp`, `duration_minutes`, `description`.

### 5.2 Gestión de disponibilidad

- **Reglas (`AvailabilityRulesEditor.tsx`)**: formulario por día de semana con `start_time`, `end_time`, `slot_duration_minutes`, `buffer_minutes`, `capacity`, `service_type` (null = todos).
- **Excepciones**: bloqueos (vacaciones, días libres) + overrides (abrir sábado excepcional).
- **Preview**: `AvailabilityPreview.tsx` muestra próxima semana visualmente.

**Lo que falta aquí**:
- No hay wizard de primera vez ("copiar horarios típicos: 9-13 + 15-19 lun-vie").
- No hay templates (ej. "vacacional", "reducido", "normal").
- No hay forma de setear `slot_duration_minutes` por servicio (sólo una duración única por regla).

### 5.3 Gestión de reservas (inbox)

- **`ProviderBookingsInbox.tsx`**: 4 tabs (pending, today, upcoming, past), filtros (tipo, rango fechas, búsqueda pet/owner), card por booking con acciones según estado.
- **Acciones por estado**:
  - `pendiente` → Confirmar | Rechazar
  - `confirmado` → Iniciar (`en_curso`) | Marcar no-show | Cancelar
  - `en_curso` → Completar
  - `completado` → Seguimiento (abre `FollowUpDialog`) | Abrir ficha [⊕ falta]
- **Notificación de nueva reserva**: trigger `notify_on_directory_booking` existe pero inserta solo en `notifications` (in-app). **Push y email no disparados**.

### 5.4 Calendario operativo

- **`TodayAgendaCard`**: próximas 24h. **BUG**: query filtra por `vet_id=auth.uid()` (legacy) en vez de `service_provider_id IN (...)`. Pierde bookings V2 del directorio.
- **`Next24hCard`**: sidebar mini con 3-5 próximas.
- **Vista semana/mes**: **NO EXISTE** para provider. Dueños tienen `/calendario` unificado; provider no.

### 5.5 Reprogramaciones y cancelaciones

- **Cancelar**: `CancelBookingDialog` accesible desde `BookingCard` o `BookingDetailDrawer`. Grace 24h (provider). Fuera: motivo obligatorio.
- **Reprogramar desde provider**: **NO EXISTE UI** accesible. El `RescheduleDialog` solo se dispara desde botones owner-only.
- **Marcaje no-show**: simple botón, sin formulario. No hay política de consecuencias (ej. "2 no-shows y se bloquea al tutor").

### 5.6 Fricciones operativas

| # | Fricción | Ubicación | Efecto |
|---|---|---|---|
| F-P1 | `TodayAgendaCard` pierde bookings V2 | `TodayAgendaCard.tsx:38` | Provider llega a consulta sin saber |
| F-P2 | No puede reprogramar | `RescheduleDialog` solo owner | Debe cancelar+proponer otra por chat |
| F-P3 | Sin calendario mes/semana | `ProviderDashboard.tsx` | Difícil planear semana |
| F-P4 | Sin push de nueva reserva | feature flag off | Entra manual a dashboard |
| F-P5 | `AvailabilityRulesEditor` sin templates | `AvailabilityRulesEditor.tsx` | Setup inicial lento |
| F-P6 | Duración por servicio global | rules schema | No puede "consulta 30 + cirugía 90" |
| F-P7 | Clínica no asigna cita a vet específico | schema `vet_bookings` sin `assigned_vet_id` | Seats inútiles para booking |
| F-P8 | Sin export CSV de pacientes o bookings | - | No puede hacer backup |
| F-P9 | Sin drag-to-reschedule en calendario | - | Flujo ineficiente |
| F-P10 | Google Calendar conecta pero no visualiza | `ProviderDashboard` | Feature incompleto |
| F-P11 | Plantillas de consulta UI básica | `ConsultationTemplateSelector` | Vet escribe notas desde cero |
| F-P12 | No hay quick-link desde booking a ficha | `ProviderBookingsInbox` | Click extra |
| F-P13 | Sin reporte "pacientes sin seguimiento" | - | Pierde oportunidades |
| F-P14 | Sin horario de "urgencias" diferenciado | schema | Mezcla con agenda normal |

---

## 6. Flujo actual veterinario (subconjunto del provider)

### 6.1 Agenda clínica

- Hereda todo lo anterior de "provider".
- Diferencia: el vet usa el **tab "Clínico"** del dashboard (`ClinicalTab.tsx`) con 4 sub-tarjetas: TodayAgenda, SharedFichas, LinkedPatients, VetFollowups.

### 6.2 Reservas por mascota / paciente

- **`ProviderPatients.tsx`** (`/provider/pacientes`, 633 líneas) lista todas las mascotas vinculadas al vet via `pet_vet_links.status='accepted'` o `created_by_vet_id`.
- **Filtros**: status (active, today, overdue followup, pending_claim, pending_links), búsqueda, ordenamiento.
- **Click en paciente** → `PetClinicalRecord/VetFichaView.tsx` — vista profesional con header clínico, timeline de notas, sidebar con alertas.

### 6.3 Preparación de consulta

- Antes de la cita: no hay ninguna vista "briefing del paciente". El vet debe abrir manualmente la ficha desde Patients.
- Durante la cita: `ConsultationRecorderModal` (audio transcription, parcial) + `ConsultationTemplateSelector` (plantillas) + `VetNoteEditor` (editor principal).
- Tras la cita: `VetNoteEditor` permite marcar `followup_required=true` con `followup_date` y `followup_reason` → trigger `clinical_note_followup_trigger` crea `pet_reminders` para el dueño automáticamente.

### 6.4 Vínculo ficha ↔ booking

- Columna `booking_id` en `vet_clinical_notes` (migración `20260612000004_vet_clinical_notes_booking_link.sql`).
- UI: si booking está `completado`, drawer muestra CTA `BookingToMedicalRecordCTA` → abre `/ficha/:petId?booking=:id` con editor precargado.
- Falta: **link inverso** — desde la nota clínica, poder ver el booking que la originó (hay FK pero no UI).

### 6.5 Operaciones del día

- Vet tiene `TodayAgendaCard` (con el bug P0-1) + sidebar `Next24hCard` + alert banner con métricas (`X seguimientos vencidos`).
- Click en cita de hoy → drawer de detalle. Dentro: acciones + timeline + notas privadas + CTA notas clínica.

### 6.6 Fricciones específicas del vet

| # | Fricción | Ubicación | Efecto |
|---|---|---|---|
| F-V1 | Sin "patient briefing" pre-consulta | - | Revisa ficha manual, pierde 2 min |
| F-V2 | Nota clínica exige ir a otra pantalla | `/ficha/:petId` | Corta el flujo |
| F-V3 | `NewPatientForm` 17 campos sin tabs | `NewPatientForm.tsx` | Form largo abandona |
| F-V4 | Audio transcription con feature flag off | `ConsultationRecorderModal` | Feature prometida no visible |
| F-V5 | Plantillas post-consulta sin variables dinámicas | `ConsultationTemplateSelector` | Vet debe editar igual |
| F-V6 | Sin prescripción digital | - | Vet escribe a mano |
| F-V7 | Sin exportar ficha por periodo | - | Backup manual |
| F-V8 | Dual-role: vet que también es tutor, debe cambiar rol para ver sus propias mascotas | `useActiveRole` | Fricción recurrente |

---

## 7. Diagnóstico UX/UI del booking

### 7.1 Arquitectura de interacción

**Principal problema**: el mental model del tutor está **partido en 3 páginas** (`/veterinarios` descubrir, `/mis-reservas` administrar, `/calendario` ver), sin un jumping-off point claro. Cada página tiene su propia lógica de fetch, sus propios filtros y su propia representación visual de un booking.

Para el provider es peor: la agenda vive dentro de un tab de un dashboard, sin ruta propia (`/provider/agenda` no existe), lo que obliga a usar el tab selector como navegación principal.

### 7.2 Errores de jerarquía

1. **`/mis-reservas`** mezcla "mi historial" con "buscar nueva cita" como tabs pares. Históricamente deberían ser **niveles distintos**: el historial es una vista, la búsqueda es una acción.
2. **`ProviderDashboard`** tiene 4 tabs (Reservas / Clínico / Negocio / Pacientes) con solapamientos: "Reservas" y "Clínico" ambos muestran citas de hoy pero con énfasis distinto.
3. **`BookingFlow` wizard** pone la **selección de mascota primero** pero en el escenario típico el tutor ya sabe qué mascota (solo tiene una) y viene del perfil del vet con provider ya seleccionado. Mejor sería: service → slot → pet con selección automática si hay una sola.
4. **`AvailabilityCalendar`**: el calendar mes y la lista de slots están lado a lado en desktop pero en mobile se apilan y la lista queda bajo el fold. No hay indicación visual "swipe para ver slots".

### 7.3 Sobrecarga cognitiva

- **`PerfilVetPublico.tsx`** muestra: nombre, badge verificado, excellence badge, tipo, registro colmevet, rating, reviews, áreas servicio, precio, horario hoy, estado abierto/cerrado, emergencias, teléfono, bio, especialidades, reviews individuales. Todo en la misma vertical, sin jerarquía clara de "qué necesita saber para decidir reservar".
- **`ProviderBookingsInbox.tsx`** card: status badge + emergency badge + ID corto + fecha + hora + servicio + mascota + dueño + precio + acciones contextuales (3-4 botones). Difícil de escanear en listado largo.

### 7.4 Problemas de formularios

- **`NewPatientForm`**: 17 campos sin agrupación, todos required-ish, sin tabs ni accordion (F-V3).
- **`AvailabilityRulesEditor`**: dos secciones distintas (rules + exceptions) en la misma pantalla sin separación visual clara.
- **`BookingFlow` step confirm**: textarea de notas sin sugerencias, sin placeholder útil ("ej. síntomas, última visita, alergias recientes").
- **Validación silenciosa**: `PerfilVetPublico.tsx:101-103` valida min 10 chars en notas pero sin counter en vivo.

### 7.5 Pasos innecesarios

1. Tutor con 1 mascota aún debe "seleccionar" en step 1. Debería auto-seleccionar.
2. `FollowUpDialog` muestra offsets en días, pero vet suele pensar en "control en 2 semanas" — falta preset "2 semanas".
3. `CancelBookingDialog` pide motivo aunque esté dentro de grace — debería ser opcional o incluso ausente dentro del grace.

### 7.6 Estados vacíos / loading / error

| Pantalla | Empty | Loading | Error |
|---|---|---|---|
| `/mis-reservas` sin bookings | OK (CTA + 3 pasos) | Spinner round | Toast pero sin retry |
| Buscar disponibilidad sin slots | OK ("Prueba otro día") | Skeleton rows | Solo botón refresh, sin mensaje |
| `BookingFlow` sin mascotas | Texto crudo sin CTA | Spinner | Sin UI |
| `BookingDetailDrawer` loading | 3 skeleton cards ✓ | — | Sin error state |
| `AvailabilityCalendar` error | — | — | Solo botón refresh, no mensaje |
| `ProviderBookingsInbox` vacío (no bookings) | Texto "Sin reservas" | Spinner | OK |
| `TodayAgendaCard` vacío | "No hay citas hoy" | Spinner | Sin error |
| `/calendario` día sin eventos | OK | Spinner | Sin error |

### 7.7 Responsive / mobile

- **Wizard `BookingFlow`** ocupa full-height en mobile pero el back button es pequeño y el indicador de progreso (3 bolitas) no indica "paso X de 3".
- **Drawer `BookingDetailDrawer`** es `side="right"` con `max-w-full` — debería ser bottom-sheet en mobile (< 640px).
- **`UnifiedCalendar`**: en mobile el día seleccionado queda bajo el calendario, scrolleable, pero al rotar o al cambiar día no hace smooth scroll.
- **`ProviderBookingsInbox`** cards en mobile tienen 4 botones que se envuelven — mejor dropdown de acciones.
- **Bottom-tab "Agenda"** del tutor redirige a `/calendario` pero en mobile sería útil tab con sub-tabs (hoy/reservas/recordatorios).

### 7.8 Percepción de calidad

**Lo bueno**:
- State machine tipada y auditable.
- SlotConflictDialog con alternativas (muy bien pensado).
- FollowUpDialog con offsets y creación automática de booking.
- Trigger de invitación a review automatizado.
- Grace windows diferenciadas (owner vs provider).

**Lo que arruina la percepción**:
- Toast ambiguo de confirmación.
- Provider sin poder reprogramar (parece "abandonado").
- Calendar sin count de slots.
- Agenda del provider mostrando solo 24h sin vista semana.
- Copy "My Paws" en un app 100% chilena.

### 7.9 Coherencia entre roles

| Aspecto | Owner | Provider | Coherente? |
|---|---|---|---|
| Card de booking | `BookingCard` con acciones owner | Mismo `BookingCard` con acciones provider | ✓ |
| Drawer de detalle | Mismo `BookingDetailDrawer` | Idem, cambia acciones | ✓ |
| Cancelación | `CancelBookingDialog` grace 2h | Idem grace 24h | ✓ conceptual |
| Reprogramación | `RescheduleDialog` grace 24h | **NO EXISTE** | ✗ |
| Calendario | `/calendario` mes/semana/tabs | `TodayAgendaCard` 24h | ✗ |
| Notificaciones | WhatsApp 24h (si opted-in) | In-app only | ✗ |
| Historial | Lista paginable + filtros | Lista paginable + filtros | ✓ |
| Post-servicio | CTA review + follow-up | CTA nota clínica + follow-up | ✓ |

---

## 8. Diagnóstico funcional y de negocio

### 8.1 Reglas faltantes

1. **Duración variable por servicio** — ya mencionada. Hoy `slot_duration_minutes` es global por regla, no por servicio. Workaround: crear múltiples reglas con `service_type` específico, pero el editor actual no lo facilita.
2. **Política de no-shows** — ausente. No hay regla "2 no-shows consecutivos y el tutor queda bloqueado" ni "vet cobra 50% si no-show notificado <24h".
3. **Límite de bookings concurrentes por tutor** — un tutor puede agendar 10 consultas el mismo día en distintos vets sin ninguna validación.
4. **Límite de bookings por mascota** — una mascota puede tener 3 bookings superpuestos en el mismo día.
5. **Ventana mínima de anticipación** — no hay "solo se puede reservar con 2h de antelación". Un tutor podría reservar para hace 5 minutos.
6. **Ventana máxima** — no hay "no se puede reservar a más de 90 días vista".
7. **Horario de urgencias** — no hay segregación entre slot normal y urgencia. Vet con `atiende_urgencias=true` debería tener un canal alternativo (¿`vet_bookings.is_emergency=true` sin pasar por slots?).
8. **Vet vs clínica: asignación**. Clínica con 3 seats no tiene lógica de asignación (round-robin, especialidad, preferencia del dueño).
9. **Cancelación en cascada** — si vet cancela cita → ¿se cancelan recordatorios ya enviados? (hoy no; el cron sigue intentando).
10. **Google Calendar on cancel** — si booking se cancela, el evento en Google Calendar sigue existiendo (no hay DELETE).

### 8.2 Validaciones faltantes

| # | Validación | Hoy | Debería |
|---|---|---|---|
| V1 | Pet vivo al reservar | Query filtra deceased_at | Validar en frontend con mensaje |
| V2 | Pet pertenece al owner | Solo por RLS | Validación explícita antes de mutation |
| V3 | Provider activo + visible | No chequeado | `is_directory_visible=true AND status='active'` |
| V4 | Booking fecha > now + min_lead_time | No chequeado | Configurable por provider |
| V5 | Booking fecha < now + max_advance | No chequeado | Configurable |
| V6 | No booking solapado con existente | UNIQUE (provider_id, date, start_time) | Agregar buffer |
| V7 | No doble reserva owner concurrente | No chequeado | Agregar regla soft |
| V8 | Email/WhatsApp válido en profile | No chequeado al reservar | Requerir para habilitar reminders |
| V9 | Si clínica: vet asignado tiene seat activo | — | Nuevo |
| V10 | Duración del servicio encaja en slot | Implícito via slot_duration | Validar si custom duration |

### 8.3 Edge cases no cubiertos

1. **Tutor reserva y elimina la mascota antes de la cita** → booking queda huérfano (hay cascade `ON DELETE` en la mayoría de FKs, pero hay que verificar). **Esperado**: auto-cancelar booking y notificar.
2. **Provider desactiva disponibilidad tras tener bookings confirmados** → bookings existentes quedan válidos pero nadie puede reservar de nuevo. ¿Qué pasa con el tutor que quiso reprogramar y no puede?
3. **Tutor cambia de zona horaria** (ej. viaja) → "14:00" es ambiguo si no se fija tz provider.
4. **Horario de verano chileno** — cambia el primer domingo de abril (adelanta 1h) y primer domingo de septiembre. `TIMESTAMPTZ + TIME` puede dar desfase.
5. **Provider cambia la duración de slot_duration_minutes tras tener bookings futuros** → los bookings existentes mantienen la duración vieja, los nuevos usan la nueva. Mezcla inconsistente.
6. **Plan B2B cambia (ej. vet paga Premium y baja a Free)** — su comisión cambia hoy mismo (recalcula). ¿Qué pasa con bookings ya completados? → deberían quedar fijados con la comisión del día que se completaron.
7. **Clínica elimina seat de vet con bookings asignados futuros** → ¿reasignar? ¿cancelar? hoy no definido.
8. **Booking con `is_emergency=true` fuera de horario del vet** — ¿se acepta? ¿qué UI ve el provider?
9. **Tutor cancela booking con adelanto ya pagado** (cuando exista Premium B2B con pago) → refund automático vs manual.

### 8.4 Estados ambiguos

- `pendiente` vs `confirmado`: el tutor no ve claramente si debe hacer algo más. La UX debería decir "Esperando confirmación del veterinario" explícitamente.
- `en_camino` existe en schema pero no se usa en UI tutor. ¿Es para walker/sitter? Sí, pero el label genérico "En camino" es ambiguo si aparece en vet.
- `en_curso` vs `completado`: para el owner no hay diferencia operativa. Podría simplificarse en UI.

### 8.5 Procesos manuales

- Provider debe entrar al dashboard para ver pendings (no hay push).
- Provider debe copiar URL de perfil público para compartir (hay botón "Ver como me ven los dueños" pero no "copiar URL pública").
- Tutor debe recordar WhatsApp reminder si no opt-in.
- Vet crea `follow_up` manual (no hay "auto-create por protocolo").

### 8.6 Riesgo de doble reserva

- En V2 hay UNIQUE constraint en `vet_bookings(service_provider_id, scheduled_date, start_time)`.
- PERO: si dos tutores hacen click simultáneamente en el mismo slot, ambos ven el wizard de confirmación. El segundo recibe error `23505` → `SlotConflictDialog` con alternativas. **Esto funciona** ✓.
- **PERO 2**: V1 `bookings` NO tiene equivalente. Un booking V1 en el mismo slot que V2 **no se detecta**. Si ambos sistemas conviven, riesgo real.
- **PERO 3**: `buffer_minutes` se aplica al computar slots disponibles pero **no al validar inserts**. Si un admin o trigger inserta un booking saltándose la lógica de slots, puede crear overlap dentro de buffer.

### 8.7 Riesgo de pérdida de confianza

- **Tutor**: si recibe WhatsApp 24h antes pero el vet canceló, el WhatsApp se envía igual (cron no chequea status actual al momento de enviar, solo en ventana inicial).
- **Provider**: si `TodayAgendaCard` no muestra un booking V2 del directorio (bug P0-1), el vet lo ve aparecer sorpresivamente.
- **Ambos**: sin UI de "historial de eventos" visible (hay `BookingTimeline` pero no destacado).

---

## 9. Diagnóstico técnico y de arquitectura

### 9.1 Modelo de datos actual

**Fortalezas**:
- Tablas bien normalizadas, FKs correctas.
- RLS presente en todas las tablas (asumido, verificar exhaustivamente).
- Audit trail (`booking_events`) bien modelado.
- Reglas + excepciones bien separadas.
- Commission calc al completar booking (trigger).

**Debilidades**:
- **4 tablas de bookings** paralelas (`vet_bookings`, `walk_bookings`, etc.) con 80% de columnas idénticas. Cualquier cambio de schema se debe replicar × 4. Violación de DRY en la DB.
- **Legacy `bookings`** sigue activa en paralelo.
- **`service_type` es TEXT libre** — debería ser FK a un catálogo de servicios o al menos ENUM.
- **Timezone mezclado**: `scheduled_date TIMESTAMPTZ` + `start_time TIME` sin tz → recomputar en frontend requiere saber la tz del provider.
- **`pet_ids` UUID[]** en `dogsitter_bookings` (multi-mascota) vs `pet_id` escalar en otras → interfaz unificada se complica.
- **`confirmation_mode`** parece ser columna en `service_providers` pero no está documentado claramente.
- **Falta `assigned_vet_id`** en clínicas multi-vet.
- **Falta `branch_id`** para multi-sucursal.
- **`booking_events`** tiene `booking_type` como string discriminador + `booking_id` UUID → no hay FK directa a la tabla tipo-específica, lo que obliga a joins dinámicos y complica queries analíticas.

### 9.2 Problemas de naming

- `vet_bookings.vet_id` (legacy, sin FK a service_providers) vs `vet_bookings.service_provider_id` (nuevo).
- `device_tokens` vs `fcm_tokens` — ambas parecen existir (posible duplicación).
- `pet_reminders.due_date` (DATE) vs `vet_bookings.scheduled_date` (TIMESTAMPTZ) — distinta granularidad.
- `routine_completions.completed_date` (DATE) + `completed_at` (TIMESTAMPTZ) — dos columnas para el mismo concepto.

### 9.3 Duplicación de lógica

| Lógica | Ubicación 1 | Ubicación 2 | Impacto |
|---|---|---|---|
| Fetch booking listado | `useMyBookingsV2` | `useProviderBookingsInbox` | Cambios de schema rompen ambos |
| Filter por status | `MyBookings.tsx` + `ProviderBookingsInbox.tsx` | — | Mismas constantes hardcoded 2 veces |
| Computar slots | `useAvailableSlots.ts` cliente | — | No hay versión backend, RLS no puede validar |
| Cancel logic | `useCancelBooking` + `CancelBookingDialog` + trigger DB | — | Triple chequeo de grace window |
| Status → color/label | `bookingStateMachine.ts` ✓ | Casos en `BookingCard.tsx` | OK: reutilizado pero con fallback inline |
| Calendar event mapping | `useUnifiedCalendar` para owner | — | Provider debería reutilizarlo |

### 9.4 Acoplamientos

- `BookingFlow` depende de 4 hooks diferentes + 3 componentes internos. Alta cohesión pero difícil de testear.
- `ProviderDashboard` importa 15+ componentes hijos, varios con queries propias → waterfall de fetches al montar el dashboard.
- `useMyBookingsV2` acopla directamente con 4 tablas específicas → refactor a tabla única rompería la firma.

### 9.5 Deuda técnica priorizada

| # | Deuda | Esfuerzo | Impacto | Prioridad |
|---|---|---|---|---|
| D1 | Consolidar V1 → V2 (migrar `bookings` y deprecar) | Alto | Alto | P0 |
| D2 | Unificar 4 tablas tipo-específicas en `bookings` única con `kind` | Muy alto | Alto | P1 |
| D3 | Extraer `useAvailableSlots` a RPC Postgres | Medio | Alto | P0 |
| D4 | Paginación en `useMyBookingsV2` | Bajo | Medio | P1 |
| D5 | Zod schema para formularios de booking | Bajo | Medio | P1 |
| D6 | Timezone storage (retirar `start_time TIME`) | Medio | Alto | P1 |
| D7 | Export CSV pacientes/bookings | Bajo | Medio | P2 |
| D8 | Sentry.captureException en booking errors | Bajo | Medio | P1 |
| D9 | Deduplicar `fcm_tokens` vs `device_tokens` | Bajo | Bajo | P2 |
| D10 | Tests E2E completos del funnel | Medio | Alto | P0 |

### 9.6 Oportunidades de refactor

1. **Booking Service Layer** (`src/lib/booking/`) — abstracción única con métodos `createBooking`, `cancelBooking`, `rescheduleBooking`, `confirmBooking`, etc. Los hooks solo orquestan (React Query mutations); la lógica vive aquí.
2. **Availability Service** (`src/lib/availability/`) — computa slots, valida conflictos, aplica buffers. Mismo servicio en cliente y (vía RPC) en backend.
3. **Notification Service** (`src/lib/notifications/`) — centraliza `notify(category, channel, recipient)` con lookup a `user_notification_prefs` y log en `notification_attempts`.
4. **Calendar Event Adapter** (`src/lib/calendar/`) — transforma booking / reminder / routine / google_event en un `CalendarEvent` único.

### 9.7 Seguridad / permisos / RLS

- RLS está en su lugar para bookings (tutor lee propias, provider lee las suyas). Verificar:
  - ¿Shelter puede leer bookings por error? (improbable, pero auditar).
  - ¿Admin bypass correcto via `admin_access`?
  - ¿Edge functions usan `service_role` sólo donde necesario?
- **Riesgo**: RPC `approve_pitch_application` existe pero **no hay RPC análogo para booking actions** → todas las actions pasan por `supabase.from().update()` directo, sin layer de validación server-side. Un cliente malicioso podría forzar transiciones inválidas de estado si RLS no cubre todo.
- **Recomendación**: todas las transiciones de booking vía RPC (`rpc_confirm_booking`, `rpc_cancel_booking`, etc.) con `SECURITY DEFINER` + validación de estado.

### 9.8 Brechas de sincronización frontend ↔ backend

1. **Frontend computa slots**, backend no valida al insertar → posible insert de booking fuera de slots válidos (ej. un admin panel que no pase por el wizard).
2. **Commission calc** solo al completar, pero si el plan cambia entre creación y completado, no queda claro qué tarifa aplica → snapshot del plan al crear.
3. **Google Calendar sync** es best-effort post-creación → si falla, no hay retry. Debería encolar en `sync_queue`.
4. **WhatsApp reminder** se dispara en `reminder-cron` leyendo `pet_reminders` y `vet_bookings`, pero no lee el status actual al momento de enviar → si cancelamos 23h antes, el reminder igual se puede disparar.

---

## 10. Auditoría de coherencia en toda la app

### 10.1 Matriz por pantalla / rol / estado

| Pantalla | Rol | Ver bookings? | Crear? | Editar? | Coherencia |
|---|---|---|---|---|---|
| `/home` | tutor | ✓ (widget próximas) | ✗ | ✗ | OK parcial (widget no muestra todos) |
| `/mis-reservas` | tutor | ✓ | ✓ (tab "Buscar") | ✓ cancel/resch | **CONFUSO** (tabs) |
| `/calendario` | tutor | ✓ | ✗ | ✗ | INCOMPLETO (no crea) |
| `/reminders` | tutor | ✗ (solo pet_reminders) | ✗ | ✓ | OK (dominio distinto) |
| `/rutinas` | tutor | ✗ (solo pet_routines) | ✗ | ✓ | OK |
| `/veterinarios` | público | ✗ | ✓ (CTA→wizard) | ✗ | OK |
| `/veterinarios/:slug` | público | ✗ | ✓ (CTA) | ✗ | OK |
| `/ficha/:petId` | tutor+vet | ✓ (historial) | ✗ | ✗ | OK |
| `/services/:type` | tutor | ✗ | ✓ (V1 modal!) | ✗ | **LEGACY** |
| `/provider/dashboard` | provider | ✓ (tab Reservas) | ✗ | ✓ confirm/cancel/complete/noshow | **SIN RESCHEDULE** |
| `/provider/pacientes` | provider | ✓ (por mascota) | ✗ | ✗ | OK |
| `/provider/profile-edit` | provider | ✗ | ✗ | ✓ rules/exceptions | OK |
| `/provider/seats` | clínica | ✗ | ✗ | ✓ seats | OK pero sin asign |
| `/admin` | admin | ? [inferencia] | ? | ? | a verificar |

### 10.2 Dónde booking sí funciona

- **Creación via wizard** (desde perfil vet público) — funcional, con manejo de conflicto.
- **Cancelación tutor** — dialog + grace + motivo + invalidación queries.
- **Listado tutor con filtros** — funciona aunque sin paginación.
- **Audit trail** — `booking_events` bien poblado.
- **Commission calc** — automático en completado.
- **Follow-up** — dialog bien integrado.
- **Review prompt** — automatizado via trigger.
- **Ficha → booking** — FK + CTA en drawer.

### 10.3 Dónde está incompleto

- **Provider reschedule**: UI inexistente.
- **Calendario provider**: solo 24h.
- **Google Calendar visual**: conecta pero no se ve.
- **Push notifications** (ambos roles): flag off.
- **Duración por servicio**: modelo no lo soporta.
- **Asignación multi-vet**: modelo falta.
- **Sucursales**: modelo falta.

### 10.4 Dónde está duplicado

- Creación: `BookingFlow` + `BookingModal` + `EnhancedBookingDialog`.
- Hooks list: `useMyBookingsV2` + `useProviderBookingsInbox` con ~60% lógica común.
- Calendar views: `UnifiedCalendar` (owner) + `TodayAgendaCard` (provider) que deberían compartir.

### 10.5 Dónde la UI promete algo que backend no soporta

- **Botón "Audio transcripción"** en `ConsultationRecorderModal` — backend aspiracional, feature flag off.
- **Asignar cita a vet de clínica** — UI en `ProviderSeats` insinúa seats por cita pero no hay `assigned_vet_id`.
- **Sincronización bidireccional Google Calendar** — hoy es one-way (app→Google), no hay watch channels.
- **Política de cancelación** con "cargos" — UI menciona "cargo puede aplicarse" pero backend no cobra nada.

### 10.6 Dónde backend existe pero UX no lo aprovecha

- **`booking_events`** — completo audit trail, pero solo visible en `BookingTimeline` poco destacado.
- **`BookingPrivateNotes`** — columna existe, UI solo accesible en drawer detail.
- **`follow_up_booking_id`** — FK entre bookings para continuidad clínica, no visible en UI.
- **Commission calculations** — se guardan pero provider solo las ve en tab Negocio agregadas, no por booking individual.
- **`pet_vet_links.status='accepted'`** habilita ver ficha — pero no hay UI "Pedir confirmación" del tutor desde el perfil del vet.

---

## 11. Sistema objetivo propuesto

### 11.1 Arquitectura conceptual

```
┌──────────────────────────────────────────────────────────────┐
│                      BOOKING DOMAIN                          │
│                                                              │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐     │
│   │  Discovery   │──▶│   Booking    │──▶│  Post-Action │     │
│   │  (directory) │   │  (create →   │   │  (review,    │     │
│   │              │   │  lifecycle)  │   │  follow-up)  │     │
│   └──────────────┘   └──────────────┘   └──────────────┘     │
│                           │                                  │
│                           ▼                                  │
│                    ┌──────────────┐                          │
│                    │ Availability │                          │
│                    │   Service    │                          │
│                    └──────────────┘                          │
│                           │                                  │
│   ┌───────────┬───────────┼───────────┬──────────────┐       │
│   ▼           ▼           ▼           ▼              ▼       │
│  Calendar  Routines   Reminders  Notifications   External    │
│  (unified   (weekly)  (clinical) (push/email/    Calendar    │
│   view)                          whatsapp)       (Google)    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 11.2 Principios operativos

1. **Single source of truth**: una sola tabla `bookings` con `kind` discriminador (o vista `v_all_bookings` si no se consolida por ahora). Una sola lógica de creación, una sola máquina de estados, un solo audit trail.
2. **Server-authoritative availability**: slots se computan en Postgres via RPC. El cliente cachea pero la verdad es el backend. Inserts pasan por RPC `rpc_create_booking` que revalida.
3. **Event-driven side effects**: cada transición de estado dispara un evento (`booking.confirmed`, `booking.cancelled`, etc.) que ejecuta side effects desacoplados (notify, sync google, calc commission, gamification).
4. **Notification as a service**: todo envío pasa por `notify(category, channel, recipient_id, payload)` que respeta prefs y deduplica.
5. **Timezone-aware**: storage en UTC, display en tz del provider (Chile por default). `start_time TIME` retirado.
6. **Mobile-first con adaptación desktop**: bottom-sheets en mobile, sidebar/drawer en desktop; calendarios responsive de verdad.
7. **Rol-agnóstico donde posible**: `BookingCard`, `BookingDetailDrawer`, `BookingTimeline` no conocen el rol; reciben acciones disponibles como prop calculada por un helper `getAvailableActions(booking, activeRole)`.
8. **Feature-flaggable por segmento**: un rollout a 10% de providers antes de GA.
9. **Observable por default**: todos los eventos del funnel emiten analytics + Sentry breadcrumbs.

### 11.3 Entidades principales

```
Booking {
  id, kind, owner_id, provider_id, assigned_seat_user_id?, branch_id?,
  pet_ids[], service_id, scheduled_at (TIMESTAMPTZ, UTC),
  duration_minutes, status, is_emergency,
  price_clp, commission_rate_snapshot,
  confirmation_mode, reminder_24h_sent, reminder_2h_sent,
  notes_owner, notes_private_provider, follow_up_of?, follow_up_booking_id?,
  created_at, updated_at
}

AvailabilityRule {
  id, provider_id, branch_id?, day_of_week, start_time, end_time,
  service_id?, slot_duration_minutes, buffer_minutes, capacity, is_active
}

AvailabilityException {
  id, provider_id, branch_id?, exception_date, start_time?, end_time?,
  kind (block | override), reason
}

Service {
  id, provider_id, slug, name, description, duration_minutes,
  price_clp, is_active, requires_pre_check_in
}

BookingEvent {
  id, booking_id, actor_id, actor_role, event_type,
  from_status, to_status, metadata, created_at
}

NotificationAttempt {
  id, booking_id?, reminder_id?, category, channel,
  recipient_id, status, external_id, error, created_at
}
```

### 11.4 Lifecycle completo de una reserva

```
[Discovery]
   └─▶ [Select service + slot] (RPC get_available_slots)
          └─▶ [Confirm] (RPC rpc_create_booking)
                 ├─ emits booking.created event
                 ├─ if auto_confirm → status='confirmed' + emits booking.confirmed
                 ├─ if manual → status='pending' + notify(provider, 'booking.new')
                 └─ sync_google_calendar (async)

[Pending]
   ├─▶ provider confirma (RPC rpc_confirm_booking)
   │     └─ status='confirmed' + emits booking.confirmed
   │             ├─ notify(owner, 'booking.confirmed')
   │             └─ schedule reminders (24h + 2h)
   └─▶ owner/provider cancela (RPC rpc_cancel_booking)
         └─ status='cancelled' + notify + google_calendar_delete

[Confirmed]
   ├─▶ T-24h: reminder_24h_sent, notify all channels per prefs
   ├─▶ T-2h: reminder_2h_sent, notify all channels per prefs
   ├─▶ T-1h: optional pre_check_in prompt (⊕)
   ├─▶ reschedule (RPC rpc_reschedule_booking)
   │     └─ emits booking.rescheduled, re-schedule reminders
   ├─▶ cancel (same as above)
   ├─▶ provider: en_curso (RPC rpc_start_booking)
   │     └─ status='in_progress' + emits booking.started
   └─▶ provider: no-show (RPC rpc_mark_no_show)
         └─ status='no_show' + consequences (tutor flag, bloqueo soft)

[In Progress]
   └─▶ provider: completar (RPC rpc_complete_booking)
         └─ status='completed'
                ├─ calc commission (snapshot plan)
                ├─ notify(owner, 'booking.completed')
                ├─ prompt nota clínica (if vet)
                ├─ prompt follow-up (provider UI)
                ├─ schedule review_invitation (T+24h)
                └─ award paw_points (owner)

[Completed] (terminal)
[Cancelled] (terminal)
[No-show]   (terminal)
```

### 11.5 Relación entre bookings, pets, users, providers, services, calendars, routines, notifications, records

```
User (auth.users) ────┬─── Profile
                      │
Owner Profile ────────┤
  owns ▶ Pets         │
  owns ▶ Bookings     │
  owns ▶ Reminders    │
  owns ▶ Routines     │
  has  ▶ Prefs        │
  has  ▶ GoogleToken  │
                      │
Provider Profile ─────┤
  has  ▶ service_providers row
           ├─ availability_rules
           ├─ availability_exceptions
           ├─ services
           ├─ clinic_vet_seats
           └─ consultation_templates

Booking ─────────────────┬─── pets (pet_ids[])
                         ├─── service_providers (provider_id)
                         ├─── services (service_id) ⊕
                         ├─── booking_events[] (audit)
                         ├─── vet_clinical_notes[] (FK inversa)
                         ├─── notification_attempts[]
                         └─── external_calendar_events[] (google mapping)

CalendarEvent (virtual, UI-level adapter) ─── source_type + source_id
   can be:
     - booking → Booking
     - reminder → pet_reminder
     - routine → pet_routine expansion
     - vet_followup → vet_clinical_notes.followup_date
     - google_external → external_calendar_events
```

---

## 12. Propuesta de modelo de datos

### 12.1 Tabla `bookings` unificada (propuesta principal)

> **Estrategia de migración recomendada**: NO borrar las 4 tablas tipo-específicas. Crear tabla nueva `bookings_v3` + backfill + migrar UI gradualmente + deprecar. Alternativa menos invasiva: crear vista `v_all_bookings` sin cambiar schema físico.

**Opción A — tabla unificada (preferida largo plazo)**:

```sql
CREATE TABLE public.bookings_v3 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Discriminador
  kind TEXT NOT NULL CHECK (kind IN ('vet', 'walk', 'dogsitter', 'training', 'grooming')),

  -- Relaciones
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_provider_id UUID NOT NULL REFERENCES service_providers(id),
  assigned_seat_user_id UUID REFERENCES auth.users(id),  -- clínica: vet asignado
  branch_id UUID,                                         -- multi-sucursal (futuro)
  service_id UUID REFERENCES provider_services(id),       -- FK a catálogo
  pet_ids UUID[] NOT NULL CHECK (cardinality(pet_ids) BETWEEN 1 AND 10),

  -- Temporal (todo UTC)
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes SMALLINT NOT NULL CHECK (duration_minutes BETWEEN 5 AND 480),

  -- Estado
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'in_progress', 'on_the_way', 'completed', 'cancelled', 'no_show'
  )),
  is_emergency BOOLEAN NOT NULL DEFAULT FALSE,

  -- Monetización
  price_clp INTEGER,
  commission_rate_snapshot NUMERIC(5,4),
  payment_status TEXT DEFAULT 'pending',

  -- Mode
  confirmation_mode TEXT NOT NULL DEFAULT 'auto' CHECK (confirmation_mode IN ('auto', 'manual')),

  -- Reminders
  reminder_24h_sent BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_2h_sent BOOLEAN NOT NULL DEFAULT FALSE,
  pre_check_in_sent BOOLEAN NOT NULL DEFAULT FALSE,

  -- Notas
  notes_owner TEXT,
  notes_private_provider TEXT,

  -- Relaciones entre bookings
  follow_up_of UUID REFERENCES bookings_v3(id),
  rescheduled_from UUID REFERENCES bookings_v3(id),

  -- Integración
  google_event_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE UNIQUE INDEX uq_booking_slot
  ON bookings_v3 (service_provider_id, scheduled_at, COALESCE(assigned_seat_user_id, service_provider_id))
  WHERE status NOT IN ('cancelled', 'no_show');

CREATE INDEX idx_bookings_owner ON bookings_v3 (owner_id, scheduled_at DESC);
CREATE INDEX idx_bookings_provider ON bookings_v3 (service_provider_id, scheduled_at DESC);
CREATE INDEX idx_bookings_status_time ON bookings_v3 (status, scheduled_at) WHERE status IN ('pending','confirmed');
CREATE INDEX idx_bookings_reminders
  ON bookings_v3 (scheduled_at)
  WHERE status IN ('pending', 'confirmed')
    AND (NOT reminder_24h_sent OR NOT reminder_2h_sent);
CREATE INDEX idx_bookings_pets ON bookings_v3 USING GIN (pet_ids);
```

**Opción B — vista sobre estado actual (migración mínima)**:

```sql
CREATE OR REPLACE VIEW public.v_all_bookings AS
SELECT
  id, 'vet'::TEXT AS kind, owner_id, service_provider_id,
  ARRAY[pet_id] AS pet_ids, scheduled_date AS scheduled_at,
  EXTRACT(EPOCH FROM (end_time - start_time))/60 AS duration_minutes,
  status, is_emergency, total_price AS price_clp,
  confirmation_mode, reminder_24h_sent, reminder_2h_sent,
  notes, google_event_id, created_at, updated_at
FROM vet_bookings
UNION ALL
SELECT id, 'walk', owner_id, service_provider_id, pet_ids, scheduled_date,
       duration_minutes, status, FALSE, total_price, 'auto',
       reminder_24h_sent, reminder_2h_sent, notes, google_event_id, created_at, updated_at
FROM walk_bookings
UNION ALL ...;
```

**Recomendación**: **Opción B** en primera fase (semana 1-2) para unificar lectura sin tocar escrituras. **Opción A** como objetivo a 6-12 meses.

### 12.2 Ampliaciones a `provider_availability_rules`

```sql
ALTER TABLE provider_availability_rules
  ADD COLUMN branch_id UUID,                          -- multi-sucursal
  ADD COLUMN service_ids UUID[] DEFAULT '{}',         -- a qué servicios aplica (vacío = todos)
  ADD COLUMN min_lead_time_minutes INTEGER DEFAULT 60,    -- ventana mínima anticipación
  ADD COLUMN max_advance_days INTEGER DEFAULT 90,         -- ventana máxima
  ADD COLUMN is_emergency_slot BOOLEAN DEFAULT FALSE;

-- Duraciones por servicio (override a slot_duration_minutes)
CREATE TABLE service_duration_overrides (
  rule_id UUID REFERENCES provider_availability_rules(id) ON DELETE CASCADE,
  service_id UUID REFERENCES provider_services(id),
  duration_minutes SMALLINT NOT NULL,
  PRIMARY KEY (rule_id, service_id)
);
```

### 12.3 Catálogo de servicios (nueva / consolidada)

```sql
CREATE TABLE provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,            -- 'consulta-general', 'vacunacion', 'cirugia', etc.
  name TEXT NOT NULL,            -- display
  description TEXT,
  duration_minutes SMALLINT NOT NULL,
  price_clp INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  requires_pre_check_in BOOLEAN NOT NULL DEFAULT FALSE,
  is_emergency_only BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, slug)
);
```

### 12.4 Multi-sucursal (futuro)

```sql
CREATE TABLE provider_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  comuna TEXT,
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
```

### 12.5 Constraints de consistencia (checks y triggers)

1. **Buffer respetado**: trigger BEFORE INSERT/UPDATE que valida `no overlap dentro de (scheduled_at - buffer_before, scheduled_at + duration + buffer_after)` contra otros bookings del mismo provider/seat.
2. **Slot válido**: trigger que llama `rpc_is_valid_slot(provider_id, scheduled_at, service_id)` y rechaza si no coincide con rules/exceptions.
3. **Lead time mínimo**: CHECK `scheduled_at >= NOW() + INTERVAL '1 minute' * min_lead_time_minutes`.
4. **No más de N bookings concurrentes por owner**: constraint soft via trigger (warning, no error).
5. **Cancelación registra motivo si fuera de grace**: trigger valida en UPDATE.
6. **`assigned_seat_user_id` válido**: debe pertenecer a `clinic_vet_seats` activo del provider.

### 12.6 Auditoría / timestamps

Todas las tablas con `created_at`, `updated_at` + trigger `touch_updated_at()` genérico. Todas las operaciones que cambian status registran en `booking_events` vía trigger.

### 12.7 Enums sugeridos (consolidación)

```sql
-- Status unificado
CREATE TYPE booking_status AS ENUM (
  'pending', 'confirmed', 'in_progress', 'on_the_way',
  'completed', 'cancelled', 'no_show'
);

CREATE TYPE booking_kind AS ENUM (
  'vet', 'walk', 'dogsitter', 'training', 'grooming'
);

CREATE TYPE booking_event_type AS ENUM (
  'created', 'confirmed', 'rescheduled', 'started', 'completed',
  'cancelled_by_owner', 'cancelled_by_provider', 'cancelled_by_system',
  'no_show', 'reminder_sent_24h', 'reminder_sent_2h',
  'pre_check_in_sent', 'review_invitation_sent', 'commission_calculated'
);
```

> **Nota**: el repo actualmente usa `TEXT + CHECK` en vez de ENUMs por razón histórica. Mantener TEXT por compatibilidad, solo documentar conceptualmente.

---

## 13. Máquina de estados de reserva

### 13.1 Estados recomendados

| Estado | Descripción | Terminal? |
|---|---|---|
| `pending` | Booking creado, esperando confirmación del provider | no |
| `confirmed` | Confirmado (auto o manual) | no |
| `on_the_way` | Walker/sitter en camino al domicilio | no (solo kinds no-vet) |
| `in_progress` | Atención en curso | no |
| `completed` | Atención finalizada con éxito | **sí** |
| `cancelled` | Cancelado antes de completar | **sí** |
| `no_show` | Tutor no se presentó | **sí** |

### 13.2 Transiciones válidas

| From → To | Actor permitido | Side effects |
|---|---|---|
| `pending` → `confirmed` | provider, system (auto_confirm) | notify owner, schedule reminders, google_sync |
| `pending` → `cancelled` | owner, provider, admin, system | notify, google_delete |
| `confirmed` → `on_the_way` | provider (walker/sitter) | notify owner |
| `confirmed` → `in_progress` | provider | notify owner, start timer |
| `confirmed` → `cancelled` | owner, provider, admin | notify, google_delete, grace check |
| `confirmed` → `no_show` | provider, admin | notify, consequences |
| `on_the_way` → `in_progress` | provider | notify owner |
| `on_the_way` → `cancelled` | owner, provider, admin | notify |
| `in_progress` → `completed` | provider | calc commission, notify owner, prompt review, paw_points |

**Prohibidas explícitamente** (validadas por `canTransition`):
- Cualquier estado terminal → cualquier estado.
- `pending` → `in_progress` (debe pasar por confirmed).
- `no_show` → `completed` (si se resuelve, usar `rescheduled_from`).

### 13.3 Disparadores

- **Auto**: `pending → confirmed` si `provider.confirmation_mode='auto'`.
- **Cron** `booking-reminders-cron`: NO cambia estado, solo envía reminders.
- **Cron** auto-cancel: [⊕ propuesta] `pending → cancelled` tras 24h sin confirmar.
- **Cron** no_show detection: [⊕ propuesta] `confirmed → no_show` si pasa 30 min del `scheduled_at` sin `in_progress` (warning manual, no auto).

### 13.4 Side effects por transición

```
on created:
  - insert booking_events('created')
  - analytics.track('booking_created', {kind, provider_id, ...})
  - if confirmation_mode='auto' → emit 'confirmed'
  - else notify(provider, 'booking.new')
  - google_sync (async)

on confirmed:
  - insert booking_events('confirmed')
  - notify(owner, 'booking.confirmed', channels: transactional)
  - schedule reminders (24h, 2h, optional pre_check_in)
  - google_sync update
  - analytics.track('booking_confirmed')

on rescheduled:
  - insert booking_events('rescheduled', metadata: from_scheduled_at)
  - notify(owner AND provider)
  - cancel old reminders, schedule new
  - google_sync update
  - analytics.track('booking_rescheduled')

on cancelled:
  - insert booking_events('cancelled_by_X')
  - notify(otro lado)
  - cancel reminders
  - google_sync delete
  - if payment_status='captured' → trigger refund (future)
  - analytics.track('booking_cancelled')

on started (in_progress):
  - insert booking_events('started')
  - notify(owner) optional

on completed:
  - insert booking_events('completed')
  - calc commission (snapshot plan vigente)
  - notify(owner, 'booking.completed')
  - if kind='vet' → prompt nota clínica (UI)
  - schedule review_invitation (T+24h)
  - award paw_points (owner)
  - analytics.track('booking_completed', {revenue_clp})

on no_show:
  - insert booking_events('no_show')
  - notify(owner) (suave, no punitivo)
  - increment profile.no_show_count
  - if count >= 3 → flag for review
  - analytics.track('booking_no_show')
```

### 13.5 Permisos por rol

| Acción | owner | provider | admin | system |
|---|---|---|---|---|
| create | ✓ | ✓ (para su cliente) | ✓ | ✓ |
| cancel (pending) | ✓ | ✓ | ✓ | ✓ |
| cancel (confirmed, within grace) | ✓ (2h) | ✓ (24h) | ✓ | — |
| cancel (confirmed, outside grace) | ✓ (motivo obligatorio) | ✓ (motivo obligatorio) | ✓ | — |
| confirm | — | ✓ | ✓ | ✓ (auto) |
| reschedule | ✓ | ✓ [⊕ falta UI] | ✓ | — |
| start (in_progress) | — | ✓ | ✓ | — |
| complete | — | ✓ | ✓ | — |
| mark_no_show | — | ✓ | ✓ | — |

### 13.6 Validaciones

Implementadas en `canTransition(from, to, actor)` + RPC equivalente:

```typescript
function canTransition(from: BookingStatus, to: BookingStatus, actor: ActorRole): boolean {
  const matrix: Record<BookingStatus, Record<BookingStatus, ActorRole[]>> = {
    pending: {
      confirmed: ['provider', 'admin', 'system'],
      cancelled: ['owner', 'provider', 'admin', 'system'],
    },
    confirmed: {
      on_the_way: ['provider'],
      in_progress: ['provider', 'admin'],
      cancelled: ['owner', 'provider', 'admin'],
      no_show: ['provider', 'admin'],
    },
    on_the_way: {
      in_progress: ['provider'],
      cancelled: ['owner', 'provider', 'admin'],
    },
    in_progress: {
      completed: ['provider', 'admin'],
    },
    completed: {},  // terminal
    cancelled: {},  // terminal
    no_show: {},    // terminal
  };
  return matrix[from]?.[to]?.includes(actor) ?? false;
}
```

---

## 14. Disponibilidad y agenda

### 14.1 Diseño recomendado

**Modelo de slots computados**:

Un slot = ventana de tiempo concreta donde un provider puede ser reservado. Se computa dinámicamente, NO se guarda en DB (salvo overrides manuales).

```
slot = {
  provider_id,
  branch_id?,
  service_id,
  starts_at (TIMESTAMPTZ UTC),
  duration_minutes,
  capacity (1-N),
  currently_booked (0-capacity),
  available_now: boolean  // capacity - currently_booked > 0 AND starts_at > now + min_lead
}
```

### 14.2 Generación

```sql
-- RPC get_available_slots(provider_id, service_id, date_from, date_to)
-- Pseudocódigo:

FOR each day IN range(date_from, date_to):
  dow = EXTRACT(DOW FROM day)
  rules = SELECT * FROM provider_availability_rules
           WHERE provider_id = X
             AND day_of_week = dow
             AND is_active
             AND (service_ids = '{}' OR service_id = ANY(service_ids))

  exceptions = SELECT * FROM provider_availability_exceptions
                WHERE provider_id = X
                  AND exception_date = day

  -- Si hay block que cubre todo el día, skip
  IF exists(exceptions WHERE kind='block' AND start_time IS NULL) THEN CONTINUE;

  FOR each rule IN rules:
    -- Determinar duración efectiva del slot
    effective_duration = COALESCE(
      (SELECT duration_minutes FROM service_duration_overrides WHERE rule_id=rule.id AND service_id=service_id),
      (SELECT duration_minutes FROM provider_services WHERE id=service_id),
      rule.slot_duration_minutes
    )

    -- Generar slots
    cursor = rule.start_time
    WHILE cursor + effective_duration <= rule.end_time:
      slot_start = day + cursor (convert to TIMESTAMPTZ in provider tz)

      -- Skip si dentro de block parcial
      IF exists(exceptions WHERE kind='block' AND slot_start BETWEEN start_time AND end_time) THEN
        cursor += effective_duration + rule.buffer_minutes; CONTINUE;

      -- Skip si dentro de lead time
      IF slot_start < NOW() + rule.min_lead_time_minutes THEN
        cursor += effective_duration + rule.buffer_minutes; CONTINUE;

      -- Contar bookings existentes (respetando capacity)
      booked = COUNT bookings WHERE
        provider_id = X
        AND scheduled_at BETWEEN (slot_start - effective_duration) AND (slot_start + effective_duration)
        AND status NOT IN ('cancelled', 'no_show');

      IF booked < rule.capacity:
        EMIT slot(slot_start, effective_duration, rule.capacity, booked);

      cursor += effective_duration + rule.buffer_minutes;

  -- Agregar slots de overrides manuales
  FOR each override IN exceptions WHERE kind='override':
    EMIT manual_slot(override.start_time, override.end_time);

RETURN flattened slots;
```

### 14.3 Buffers y capacidad

- **buffer_minutes** se aplica DESPUÉS del slot. Si slot es 14:00-14:30 con buffer 10, siguiente slot es 14:40.
- **capacity** permite overbooking controlado. `capacity=3` significa 3 citas simultáneas (útil para grooming con 2 peluqueros + 1 espera).
- **Nuevo [⊕]**: `buffer_before_minutes` para pre-consulta (setup, limpieza).

### 14.4 Excepciones y bloqueos

- **`kind='block'`** con `start_time/end_time = NULL` → bloquea el día entero.
- **`kind='block'`** con rango → bloquea solo ese rango (ej. almuerzo extendido).
- **`kind='override'`** → abre slots extra fuera del horario regular (ej. sábado excepcional).

### 14.5 Conflictos

- Validados a nivel de DB por UNIQUE index + trigger de buffer.
- En UX: `SlotConflictDialog` sugiere 3 alternativas cercanas (ya implementado).

### 14.6 Timezone

**Regla absoluta**: storage en UTC. Provider tiene `timezone TEXT DEFAULT 'America/Santiago'` en `service_providers`. Todas las conversiones en cliente usan esta tz.

```sql
ALTER TABLE service_providers
  ADD COLUMN timezone TEXT NOT NULL DEFAULT 'America/Santiago';
```

### 14.7 Capacidad

Ya cubierto. Nota: `capacity > 1` requiere UX especial (no mostrar "lleno" hasta agotar, mostrar count "2 de 3 cupos").

### 14.8 Vista operativa de agenda

**Para provider** [⊕ propuesta clave]:
- Ruta dedicada `/provider/agenda`.
- Componente `ProviderAgendaCalendar` con vistas: Día / Semana / Mes / Lista.
- Drag-to-reschedule con confirmación.
- Click en slot vacío → "Bloquear slot" rápido.
- Click en booking → drawer de detalle.
- Filtros: por servicio, por seat (si clínica), por estado.

**Para owner**: mantener `/calendario` unificado. Ya funciona.

---

## 15. Calendarios y rutinas

### 15.1 Sincronización con calendarios

**Hoy**: one-way app→Google (solo insert/update de reminders + bookings confirmados).

**Objetivo**:

1. **Sync bidireccional opcional (futuro)**: watch channels + webhook público. Alto esfuerzo, baja prioridad.
2. **Export ICS** (.ics file download) — bajo esfuerzo, útil para Outlook/Apple Calendar.
3. **Google Calendar DELETE on cancel** — fix hoy mismo.
4. **Retry queue** para sync fallidos (tabla `sync_queue`).

### 15.2 Eventos externos

Hoy: no se leen. Futuro: si sync bidireccional, leer eventos del Google del provider y mostrarlos como "bloqueado (evento externo)" en `/provider/agenda`.

### 15.3 Import/export

- **Export ICS**: botón en `/mis-reservas` "Descargar calendario (.ics)".
- **Export CSV**: botón en provider "Exportar bookings del mes (.csv)".
- **Import**: no necesario por ahora (Google sync cubre Android/iOS/web).

### 15.4 Conexión con rutinas internas

**Regla**: rutinas no son bookings. Pero una rutina de "llevar al vet cada 6 meses" puede sugerir una acción de booking.

**Propuesta [⊕]**:
- En `pet_routines` agregar `category='vet_visit'` (o similar).
- Cuando fecha de rutina se acerca, mostrar CTA "Agendar ahora" en UnifiedCalendar.
- Cuando booking se completa, si la rutina asociada tiene `next_due`, actualizarla.

### 15.5 Qué pasa al crear / reprogramar / cancelar / completar

| Acción | Calendario | Rutina | Reminder | Google |
|---|---|---|---|---|
| create | nuevo evento | — | schedule 24h+2h | sync create |
| reschedule | reemplazar evento | — | cancel old + schedule new | sync update |
| cancel | evento desaparece (o mostrar como cancelado) | — | cancel pending | sync delete |
| complete | evento marca "completado" | actualizar rutina asociada si existe | — | sync update (status='confirmed' en Google, no soporta completed) |

### 15.6 Separación entre eventos y tareas

- **Evento** (booking, rutina recurrente expandida, recordatorio con hora) → tiene `starts_at` y `ends_at`. Se muestra en calendario como bloque.
- **Tarea** (recordatorio sin hora, rutina completable) → tiene `due_date`. Se muestra como checkbox en lista del día.

Hoy `UnifiedCalendar` los mezcla. Mantener visualmente unificado pero internamente distinguir. El usuario los distingue por el icono/color.

---

## 16. Sistema de notificaciones y recordatorios

### 16.1 Confirmación inicial

- **Canal**: in-app (siempre) + transactional email (default on) + push (default on si opted in).
- **Timing**: inmediato post `confirmed`.
- **Copy**: "Tu cita con [vet] el [fecha] a las [hora] quedó confirmada. Tocaremos de nuevo 24h antes."

### 16.2 Recordatorios múltiples

| Momento | Canal default | Opt-out |
|---|---|---|
| T-24h | WhatsApp (si opted) + push | ✓ `pet_reminders_push=false` |
| T-2h | push + in-app | ✓ |
| T-1h | [⊕] Pre-check-in prompt ("¿llegarás?") | ✓ |
| T-15min | [⊕ opcional] aviso final (pensar) | ✓ |

### 16.3 Mismo día

Además de T-2h: widget "Hoy tienes cita" en `/home` y push a las 8 AM listando citas del día.

### 16.4 Reprogramación

- **Ambos lados**: notify("tu cita se reprogramó al [nuevo slot]").
- **Canales**: in-app obligatorio + transactional email.
- **Cancelar reminders programados del slot viejo** + **schedule nuevos** para slot nuevo.

### 16.5 Cancelación

- **Lado contrario** recibe notify.
- **Canal**: in-app + email + push.
- **Copy adaptado**: distinto si tutor canceló vs vet canceló.

### 16.6 No-show

- **Tutor** recibe notify **suave**: "No te vimos en tu cita de [fecha]. ¿Necesitas reprogramar?" con CTA.
- **Provider**: no necesita notify (él la marcó).
- **Si 3 no-shows**: admin recibe flag.

### 16.7 Seguimiento posterior

- **T+24h tras completado**: review_invitation (in-app + email).
- **T+7/14/30 días**: follow-up si vet marcó `followup_required`.

### 16.8 Quick actions en notificaciones

- Push notification tap → deep link a `/mis-reservas/:id` (drawer abierto).
- WhatsApp reply con "CANCEL" [⊕ futuro] → auto-cancel booking.
- Email "Confirmar lectura" → mark reminder as delivered.

### 16.9 Canal recomendado por evento

| Evento | In-app | Push | Email | WhatsApp | SMS |
|---|---|---|---|---|---|
| booking.created (provider) | ✓ | ✓ | opt | ✗ | ✗ |
| booking.confirmed (owner) | ✓ | ✓ | ✓ | ✗ | ✗ |
| reminder.24h (owner) | ✓ | ✓ | ✗ | ✓ (si opted) | ✗ |
| reminder.2h (owner) | ✓ | ✓ | ✗ | opt | ✗ |
| booking.cancelled (lado contrario) | ✓ | ✓ | ✓ | opt | ✗ |
| booking.no_show (owner) | ✓ | ✗ | ✓ | ✗ | ✗ |
| booking.completed (owner) | ✓ | opt | ✓ (summary) | ✗ | ✗ |
| review.invitation (owner) | ✓ | ✗ | ✓ | ✗ | ✗ |
| followup.due (owner) | ✓ | ✓ | ✓ | opt | ✗ |

### 16.10 Consistencia entre roles

- Mismo servicio `notify()` para ambos roles.
- Distintas categorías de prefs (`transactional`, `pet_reminders`, `social`, etc. — ya existe en `user_notification_prefs`).
- `notification_attempts` registra cada envío para trazabilidad.

### 16.11 Idempotencia

Ya existe UNIQUE index en `notification_attempts(booking_type, booking_id, reminder_type, channel) WHERE status IN ('sent','delivered','read')`. Mantener y usarlo siempre antes de disparar.

### 16.12 Arquitectura del servicio

```typescript
// src/lib/notifications/notify.ts
export async function notify({
  category,       // 'transactional' | 'pet_reminders' | ...
  recipientId,
  event,          // 'booking.confirmed', 'reminder.24h', etc.
  payload,
  bookingId?,
  reminderId?,
}) {
  const prefs = await getUserPrefs(recipientId);
  const channels = resolveChannels(category, event, prefs);  // ['push', 'email', ...]

  for (const channel of channels) {
    const key = { booking_id, reminder_id, category, channel, event };
    if (await wasSent(key)) continue;  // idempotency

    try {
      await sendVia(channel, recipientId, event, payload);
      await logAttempt({ ...key, status: 'sent' });
    } catch (err) {
      await logAttempt({ ...key, status: 'failed', error: err.message });
      Sentry.captureException(err, { tags: { channel, event } });
    }
  }
}
```

---

## 17. Rediseño del flujo del tutor

### 17.1 Flujo ideal end-to-end

**Entrada**: el tutor llega por uno de 4 caminos:
1. Directorio (`/veterinarios`) → filtro → perfil → CTA
2. Perfil directo (QR, link compartido)
3. `/home` widget "Próximas citas" con CTA "Agendar otra"
4. `/calendario` día vacío → CTA "¿Agendar algo?"

**Wizard rediseñado (3 pasos, no 4)**:

```
Paso 1 — SERVICIO + MOMENTO
  ├─ auto-seleccionar mascota si tutor solo tiene una
  ├─ dropdown "Servicio" con precio y duración inline ("Consulta general · 30 min · $25.000")
  ├─ calendario con dots de count real ("3 horarios" en tooltip)
  └─ selector de hora con indicación "hora Chile"

Paso 2 — DETALLES
  ├─ selector de mascota (multi-select si servicio lo permite, ej. grooming)
  ├─ selector "¿Es una urgencia?" (solo si vet lo soporta)
  ├─ textarea notas con placeholder: "¿Algún síntoma o cosa que deba saber el vet?"
  └─ (si aplica) "Confirmación inmediata" vs "El vet confirmará en minutos"

Paso 3 — CONFIRMACIÓN
  ├─ summary card con toda la info
  ├─ precio final claro
  ├─ política de cancelación visible (no en popup)
  ├─ checkbox "He leído las políticas"
  └─ botón "Agendar cita" (no "Confirmar reserva")
```

### 17.2 UX recomendada

- **Mobile-first**: cada paso ocupa full-screen. Back button grande (44×44 min).
- **Persistencia del wizard**: si tutor sale a mitad, al volver recuperar estado (localStorage con TTL 1h).
- **Feedback inmediato**: al confirmar, mostrar inline "✓ Reservado" con animación sutil + auto-scroll a próxima cita en `/mis-reservas`. Sin redirect abrupto.
- **Cross-link**: post-confirmación, mini-card "¿Tu mascota tiene vacunas al día?" con CTA a `/reminders` (upsell suave).

### 17.3 Copy funcional

- "Agendar cita" (primary) en vez de "Confirmar reserva".
- "El vet confirmará en minutos" (si manual) vs "Confirmada automáticamente" (si auto).
- "Puedes cancelar sin costo hasta 2 horas antes" (explícito).
- "Tu próxima cita" en vez de "Reserva".
- "Hola 👋 No tienes citas aún" en estado vacío.

### 17.4 Componentes sugeridos

- **`BookingWizardV3`** (reemplaza `BookingFlow`).
- **`ServicePicker`** — dropdown con precio + duración.
- **`SmartSlotCalendar`** — calendar + slot list unificados en mobile.
- **`PolicyBanner`** — muestra grace + costos antes de confirmar.
- **`TimezoneHint`** — tooltip "14:00 hora Chile".
- **`BookingSuccessScreen`** — success screen con CTA a calendario.

### 17.5 Señales de confianza

- Badges de verificación del vet visibles en wizard.
- Rating + count de reviews.
- "Este vet ha atendido X mascotas en Paw Friend".
- Avatar del vet en todo el flujo.

### 17.6 Reducción de fricción

- **1 mascota** → auto-selecciona.
- **1 servicio disponible** → auto-selecciona.
- **Next available slot hoy** → botón "Reservar la próxima hora disponible" (skip calendar).
- **Pre-rellenar notas** con última consulta ("Continuación del control del [fecha]").

### 17.7 Enfoque mobile-first

- Bottom sheet para dialogs (CancelBookingDialog, RescheduleDialog).
- Pull-to-refresh en `/mis-reservas`.
- Swipe actions en cards (swipe izq → cancelar, der → reprogramar).
- Haptic feedback en confirmación (Capacitor).

---

## 18. Rediseño del flujo del oferente de servicios

### 18.1 Panel operativo ideal

**Nueva estructura** (reemplaza actual `ProviderDashboard` 4-tab):

```
/provider
  ├─ / (home)          Dashboard KPIs + agenda hoy + alertas
  ├─ /agenda           Calendario visual día/semana/mes ⊕ NUEVO
  ├─ /inbox            ProviderBookingsInbox (ya existe)
  ├─ /pacientes        (ya existe)
  ├─ /disponibilidad   Extraído de /profile-edit ⊕
  ├─ /negocio          BusinessTab (ya existe)
  └─ /perfil           ProviderProfileEdit
```

### 18.2 Vista de agenda [⊕ clave]

- **`/provider/agenda`** ruta nueva.
- **Componente `ProviderAgendaCalendar`** con vista día/semana/mes (toggle).
- **Tech**: react-big-calendar o custom con CSS Grid.
- **Features**:
  - Drag & drop para reprogramar (con confirmación + notify owner).
  - Click en slot vacío → popover "Bloquear" / "Reservar para cliente".
  - Click en booking → drawer de detalle.
  - Color por servicio.
  - Sidebar con filtros (servicio, seat, estado).
  - Toggle "Mostrar bloqueados" / "Mostrar Google events".

### 18.3 Acciones rápidas

- **Quick bar en todas las vistas**:
  - "Bloquear hora" (crear exception rápido).
  - "Agregar cita manual" (para cliente que llamó por teléfono).
  - "Exportar hoy" (print / PDF).
- **En card de booking**:
  - Dropdown con todas las acciones (confirmar, reprogramar, cancelar, no-show, completar).
  - "Abrir ficha" quick link (falta hoy, F-P12).
  - "Enviar mensaje" si CHAT flag on.

### 18.4 Administración de disponibilidad

**Wizard de onboarding** [⊕]:
- "¿Cuál es tu horario típico?" con presets (mañana/tarde/jornada continua).
- "¿Cuánto dura una consulta típica?" (15/30/45/60).
- "¿Trabajas fines de semana?"
- "¿Aceptas urgencias?"
- Genera rules automáticas.

**Templates** [⊕]:
- "Normal" / "Reducido" / "Vacacional" / "Urgencias"
- Switch global con un click.

**Preview en tiempo real** ✓ ya existe (`AvailabilityPreview`).

### 18.5 Manejo de conflictos

- Al crear exception que solapa con bookings confirmados → dialog "Tienes 3 citas en ese rango, ¿qué hacer?"
  - Reprogramar todas (sugiere alternativas automáticas)
  - Cancelar todas (con motivo)
  - Contactar manualmente (solo mostrar conflictos).

### 18.6 Confirmación / reprogramación / cancelación

**Reprogramación por provider** [⊕ P0]:
- Componente `RescheduleFromInboxDialog`.
- Similar a `RescheduleDialog` pero propone al owner 2-3 alternativas.
- Owner recibe notify con botones "Aceptar alt 1", "Aceptar alt 2", "Pedir otra", "Cancelar".
- Hasta aceptación, booking queda en `confirmed` pero con bandera `reschedule_proposed`.

### 18.7 Historial

- Tab "Pasadas" en inbox (ya existe) + filtros por cliente, tipo, rango.
- Export CSV por rango.

### 18.8 Necesidades de visibilidad y control

- **Dashboard home** muestra:
  - KPIs últimos 7 / 30 días.
  - Alertas: followups vencidos, bookings sin confirmar >4h, clientes sin review.
  - Agenda de hoy con link a `/provider/agenda?date=today`.
  - Gráfico mini de bookings/día.

---

## 19. Rediseño del flujo veterinario

### 19.1 Agenda clínica

Hereda todo de §18 + específicos vet:

### 19.2 Patient briefing (pre-consulta) [⊕]

- En drawer de detalle del booking, sección "Resumen del paciente":
  - Última consulta + nota
  - Alergias + condiciones crónicas
  - Vacunas pendientes / vencidas
  - Medicamentos activos
  - Peso último
- **CTA destacado**: "Abrir ficha completa" (grande, top).

### 19.3 Preparación de consulta

- **Check-list pre-cita** (opcional por servicio):
  - "¿Mascota en ayunas?" → notify 2h antes recordando.
  - "¿Trae carnet de vacunas?" → recordar día antes.
- **Plantilla de nota pre-cargada** basada en `service_type`.

### 19.4 Vista de citas

- Mismo calendar de §18 pero con:
  - Color por tipo de consulta.
  - Indicadores visuales: 🔴 urgencia, 🟡 primera visita, 🟢 control.

### 19.5 Conexión con ficha

- **Cita → Ficha**: quick link desde card y drawer (F-P12 fix).
- **Ficha → Cita**: desde cada nota clínica, botón "Ver cita asociada" si `booking_id` no null.
- **Drag to ficha**: desde card de booking drag a área de ficha abre editor con booking precargado.

### 19.6 Post-atención

- **Al marcar `completed`**: dialog que guía:
  - Paso 1: "Escribe la nota clínica" (con plantilla).
  - Paso 2: "¿Prescribes algo?" (link a módulo prescripción futuro).
  - Paso 3: "¿Próximo control?" (`FollowUpDialog`).
  - Paso 4: "¿Recordar algo al dueño?" → crea `pet_reminder` automático.

### 19.7 Seguimiento y próximos controles

- **`VetFollowupsCard`** ✓ ya existe, mejorar con:
  - Count de seguimientos vencidos VS próximos.
  - Filtro por mascota, por tipo.
  - Acción "Enviar recordatorio ahora" al dueño.

### 19.8 Continuidad clínica

- **Al crear nota clínica con followup**: ya se dispara trigger que crea `pet_reminder`.
- **Nuevo [⊕]**: permitir al vet "Agendar directamente el follow-up" desde la nota → crea booking pendiente con slot sugerido en la fecha.

---

## 20. Integraciones recomendadas

### 20.1 Evaluación razonada

| Integración | Objetivo | ¿Conviene? | Complejidad | Prioridad | Riesgo |
|---|---|---|---|---|---|
| **Google Calendar bidireccional** | Leer eventos externos del provider y bloquear slots | Parcialmente — solo provider | Alta (watch channels + webhook público) | P3 | Rotación de tokens compleja |
| **Google Calendar one-way (actual)** | Sync bookings a Google | ✓ ya implementado | — | — | Mantener + **DELETE on cancel** (pendiente fix) |
| **Apple Calendar / ICS export** | Botón descargar .ics | ✓ muy conveniente | Baja | P1 | Ninguno |
| **Cal.com self-hosted** | Reemplazar scheduler propio | **NO por ahora** | Muy alta | — | Nuestro scheduler ya está avanzado; integración haría menos sentido que seguir iterando |
| **Cronofy** | API scheduler comercial | **NO** | Alta | — | Costo + lock-in |
| **Edge Functions cron** | Reminders, cleanup, audit | ✓ ya implementado | — | — | Mantener |
| **Queue/workers** (Supabase pg_queues o similar) | Retries de notifs + sync fallidos | ✓ recomendado | Media | P2 | Upgrade Supabase requerido posiblemente |
| **Email (Resend)** | Confirmations + reminders | ✓ ya disponible, ampliar uso | Baja | P0 | Mantener |
| **Push FCM** | Reminders multi-device | ✓ infra existe, activar | Baja | P0 | Configuración de certificados iOS |
| **WhatsApp Cloud API** | Reminders alta tasa de lectura | ✓ parcial, ampliar templates | Media | P1 | Verificación Meta Business en curso |
| **SMS (Twilio)** | Fallback si no WhatsApp | **NO aún** | Media | P3 | Costo alto vs marginal utility |
| **Formularios pre-cita** | Síntomas, consent, ayuno | ✓ muy valioso | Media | P2 | Construir con form builder propio |
| **Consentimientos digitales** | Firma al completar | [⊕] futuro | Alta | P3 | Requisitos legales Chile |
| **Video / teleconsulta** (Daily.co, Zoom SDK) | Consultas remotas | **NO** hoy | Alta | P4 | Casos de uso limitados; vets prefieren presencial |
| **Tax/invoicing** (Facturación SII) | Boleta electrónica | **NO** hasta SpA con flujo real | Muy alta | P4 | Dependencia legal |
| **Slack / Discord** (notify interno) | Admin ops | **NO** | Baja | P5 | No aporta a users |
| **Zapier / Make** | Integraciones de usuarios | **NO** por ahora | Baja | P3 | Mantener foco |

### 20.2 Priorización ejecutiva

**P0 (ya / semana 1-2)**:
- Activar push FCM para bookings.
- Ampliar uso de email Resend (confirmaciones).
- Fix DELETE en Google Calendar on cancel.

**P1 (1-2 meses)**:
- WhatsApp templates ampliadas (post verificación Meta).
- Export ICS.
- Formularios pre-cita.

**P2 (2-6 meses)**:
- Queue/workers para retries.
- Sync queue para calendar fallidos.

**P3+ (6-12 meses)**:
- Google bidireccional.
- Consentimientos digitales.
- Potencial: teleconsulta si demanda.

### 20.3 Arquitectura de implementación

**Para cada integración nueva**:
1. Crear `src/lib/integrations/<nombre>/` con adapter tipado.
2. Edge function dedicada si requiere server-side.
3. Feature flag para rollout gradual.
4. Métricas de uso desde día 1 (analytics).
5. Fallback claro (ej. si Google falla, avisar al user).

---

## 21. Refactor técnico recomendado

### 21.1 Qué conservar

- `bookingStateMachine.ts` — sólido, 100% test coverage. Mantener y extender.
- `booking_events` audit trail — bien modelado.
- `SlotConflictDialog` con alternativas — UX bien pensado.
- `FollowUpDialog` — integración de continuidad clínica.
- Trigger `auto_review_invitation`.
- Trigger `clinical_note_followup_trigger`.
- `provider_availability_rules` + `provider_availability_exceptions` como modelo base.

### 21.2 Qué rehacer

- **Capa de creación de booking**: unificar 3 paths (BookingFlow + BookingModal + EnhancedBookingDialog) en uno solo (`BookingWizardV3`).
- **`useMyBookingsV2`**: migrar a query paralela + paginación + usar vista `v_all_bookings` (Opción B del §12).
- **`useAvailableSlots`**: extraer a RPC Postgres `get_available_slots`.
- **`TodayAgendaCard`**: fix query (usar `service_provider_id`).
- **Provider UI de reschedule**: nuevo desde cero.

### 21.3 Qué desacoplar

- **Booking CRUD** → `src/lib/booking/service.ts` (capa pura, sin React).
- **Availability** → `src/lib/availability/` con `computeSlots()`, `isSlotAvailable()`, `findAlternatives()`.
- **Notifications** → `src/lib/notifications/notify.ts` (único punto de envío).
- **Calendar adapters** → `src/lib/calendar/adapters.ts` (booking→event, reminder→event, routine→event, google→event).

### 21.4 Cómo centralizar lógica del dominio

```
src/
  lib/
    booking/
      service.ts        // create, cancel, reschedule, confirm, complete
      state-machine.ts  // (movido) + helpers
      validators.ts     // zod schemas + business rules
      types.ts          // interfaces de dominio
    availability/
      service.ts        // computeSlots, findAlternatives
      rules.ts          // CRUD rules+exceptions
      types.ts
    notifications/
      notify.ts         // notify(category, channel, ...)
      channels/
        push.ts
        email.ts
        whatsapp.ts
        in-app.ts
      types.ts
    calendar/
      adapters.ts       // toCalendarEvent(anyDomainEntity)
      types.ts
  hooks/
    booking/
      useBooking.ts     // wraps service.ts con React Query
      useBookings.ts    // list/filter
      useAvailableSlots.ts  // wraps RPC
    provider/
      useProviderAgenda.ts
      useProviderInbox.ts
```

### 21.5 Cómo evitar regresiones

1. **Tests primero**: escribir E2E del flujo tutor actual antes de tocar nada.
2. **Feature flag** `BOOKING_V3_WIZARD` — coexistencia temporal con V1/V2.
3. **Migración por rolloff**: 10% usuarios → 50% → 100%.
4. **Monitor de errores**: Sentry + dashboard de booking success rate.
5. **Rollback plan**: cada release con SQL migration `DOWN` documentada.

### 21.6 Responsabilidades entre frontend, Supabase y automations

| Capa | Responsabilidad | Ejemplo |
|---|---|---|
| **Frontend (React)** | UI, formularios, validación optimista, estado local | Wizard, drawers, cards |
| **React Query** | Cache de queries, invalidación | Keys: `['bookings', filters]` |
| **Service layer (src/lib)** | Orquestación de llamadas a Supabase, lógica de negocio pura, composición de side effects | `bookingService.create()` llama RPC + invalida queries + emite analytics |
| **Supabase RPC** | Lógica server-authoritative, validaciones críticas, transacciones | `rpc_create_booking`, `rpc_cancel_booking`, `rpc_get_available_slots` |
| **DB triggers** | Invariantes, audit, commission calc, reminders auto-create | `trg_booking_commission_on_complete`, `trg_create_booking_event` |
| **Edge functions (cron)** | Procesos recurrentes async | `booking-reminders-cron`, `audit-cron-daily` |
| **Edge functions (sync)** | Integraciones externas | `google-calendar-sync`, `send-whatsapp-reminder` |

---

## 22. Estructura objetivo de carpetas y módulos

```
src/
├─ pages/
│  ├─ bookings/                       [⊕ refactor]
│  │  ├─ MyBookings.tsx               (rediseño sin tabs "Buscar")
│  │  └─ BookingDetail.tsx            (nueva, puede ser drawer)
│  ├─ calendar/
│  │  └─ UnifiedCalendar.tsx          (agregar CTA "Agendar" en día vacío)
│  ├─ provider/
│  │  ├─ ProviderDashboard.tsx        (home simplificado)
│  │  ├─ ProviderAgenda.tsx           ⊕ NUEVO
│  │  ├─ ProviderInbox.tsx            ⊕ extraído
│  │  ├─ ProviderAvailability.tsx     ⊕ extraído
│  │  ├─ ProviderPatients.tsx
│  │  ├─ ProviderSeats.tsx
│  │  └─ ProviderProfileEdit.tsx
│  └─ ... (resto igual)
│
├─ components/
│  ├─ booking/
│  │  ├─ BookingWizardV3.tsx          ⊕ reemplaza BookingFlow+Modal+Enhanced
│  │  ├─ BookingCard.tsx              (existing)
│  │  ├─ BookingDetailDrawer.tsx      (existing, mobile=bottom sheet)
│  │  ├─ BookingTimeline.tsx          (existing)
│  │  ├─ BookingPrivateNotes.tsx
│  │  ├─ BookingToMedicalRecordCTA.tsx
│  │  ├─ CancelBookingDialog.tsx
│  │  ├─ RescheduleDialog.tsx         (para owner)
│  │  ├─ RescheduleFromInboxDialog.tsx ⊕ NUEVO (para provider)
│  │  ├─ FollowUpDialog.tsx
│  │  ├─ SlotConflictDialog.tsx
│  │  ├─ PolicyBanner.tsx             ⊕ NUEVO
│  │  └─ BookingSuccessScreen.tsx     ⊕ NUEVO
│  ├─ calendar/
│  │  ├─ ProviderAgendaCalendar.tsx   ⊕ NUEVO (día/semana/mes)
│  │  ├─ SmartSlotCalendar.tsx        ⊕ NUEVO (unificado mobile)
│  │  ├─ UnifiedDayView.tsx
│  │  └─ CalendarEventCard.tsx
│  ├─ provider/
│  │  ├─ ProviderBookingsInbox.tsx    (existing, mejoras)
│  │  ├─ AvailabilityRulesEditor.tsx  (rediseño + templates)
│  │  ├─ AvailabilityOnboardingWizard.tsx ⊕ NUEVO
│  │  ├─ PatientBriefing.tsx          ⊕ NUEVO
│  │  └─ ... (existing)
│  └─ ... (resto igual)
│
├─ hooks/
│  ├─ booking/
│  │  ├─ useBooking.ts                (single)
│  │  ├─ useBookings.ts               ⊕ reemplaza useMyBookingsV2
│  │  ├─ useBookingMutations.ts       (existing, adaptar)
│  │  ├─ useAvailableSlots.ts         (adaptar a RPC)
│  │  └─ useBookingEvents.ts
│  ├─ provider/
│  │  ├─ useProviderAgenda.ts         ⊕ NUEVO
│  │  ├─ useProviderInbox.ts          (existing)
│  │  └─ useProviderAvailabilityRules.ts
│  └─ ...
│
├─ lib/
│  ├─ booking/
│  │  ├─ service.ts                   ⊕ NUEVO (orchestration)
│  │  ├─ state-machine.ts             (mover desde lib/bookingStateMachine.ts)
│  │  ├─ validators.ts                ⊕ NUEVO (zod + rules)
│  │  ├─ types.ts                     ⊕ NUEVO (Booking domain types)
│  │  └─ helpers.ts                   (grace calc, price calc, etc.)
│  ├─ availability/
│  │  ├─ service.ts                   ⊕ NUEVO (wrapper RPC)
│  │  ├─ compute-slots.ts             ⊕ NUEVO (cliente: preview solamente)
│  │  └─ types.ts
│  ├─ notifications/
│  │  ├─ notify.ts                    ⊕ NUEVO (dispatcher)
│  │  ├─ prefs.ts                     ⊕ NUEVO (cached prefs)
│  │  ├─ channels/
│  │  └─ types.ts
│  └─ calendar/
│     ├─ adapters.ts                  ⊕ NUEVO
│     └─ types.ts
│
├─ integrations/
│  └─ supabase/
│     └─ types.ts (auto-gen)
│
└─ types/
   └─ booking.d.ts                    (re-export para retro-compat)
```

### 22.1 Boundaries por dominio

- **`lib/booking/*`** no importa de `components/` ni `pages/`.
- **`lib/availability/*`** no importa de `lib/booking/*`.
- **`hooks/*`** importan de `lib/*` y wraps con React Query.
- **`components/*`** importan de `hooks/*`, no directamente de `lib/*` (salvo tipos).
- **Tests** viven en `__tests__/` junto a cada módulo.

### 22.2 Naming

- Archivos: kebab-case en `lib/` (`state-machine.ts`), PascalCase en componentes React.
- Tipos: `Booking`, `BookingStatus`, `BookingKind`, `AvailabilityRule` — claros y sin prefijos "I".
- Hooks: `useBooking`, `useBookings`, `useAvailableSlots`.
- Servicios: `bookingService.create()`, `availabilityService.getSlots()`, `notifications.send()`.

### 22.3 Puntos de entrada

- **Tutor**: `/veterinarios/:slug` → `BookingWizardV3` (modal).
- **Tutor alt**: `/calendario` día vacío → CTA → wizard.
- **Tutor alt 2**: `/home` widget.
- **Provider**: `/provider/agenda` (nuevo) ↔ `/provider/inbox`.

### 22.4 Responsabilidades por capa

| Capa | Hace | NO hace |
|---|---|---|
| page | compone layout, lee params URL | no hace fetch directo |
| hook | fetch + cache + invalidación | no maneja DOM |
| component | UI + eventos | no hace fetch |
| lib service | llama RPC + lógica | no tiene JSX |
| RPC | valida + transacciona | no envía emails |
| trigger | invariantes + audit | no envía emails |
| edge fn | async + externos | no valida dominio |

---

## 23. Archivos concretos a tocar

### 23.1 Backend (migraciones + edge functions)

| # | Archivo | Acción | Prioridad | Riesgo |
|---|---|---|---|---|
| A1 | `supabase/migrations/202607XX_booking_v3_view.sql` | Crear vista `v_all_bookings` | P0 | Bajo |
| A2 | `supabase/migrations/202607XX_service_provider_tz.sql` | `service_providers.timezone` | P0 | Bajo |
| A3 | `supabase/migrations/202607XX_provider_services_catalog.sql` | Tabla `provider_services` | P1 | Medio |
| A4 | `supabase/migrations/202607XX_service_duration_overrides.sql` | Tabla overrides duración | P1 | Medio |
| A5 | `supabase/migrations/202607XX_assigned_seat.sql` | `bookings.assigned_seat_user_id` | P1 | Medio |
| A6 | `supabase/migrations/202607XX_availability_lead_times.sql` | `rules.min_lead_time_minutes`, `max_advance_days` | P1 | Bajo |
| A7 | `supabase/migrations/202607XX_rpc_get_available_slots.sql` | RPC | P0 | Alto |
| A8 | `supabase/migrations/202607XX_rpc_create_booking.sql` | RPC con validación | P0 | Alto |
| A9 | `supabase/migrations/202607XX_rpc_cancel_reschedule.sql` | RPCs transacción | P0 | Alto |
| A10 | `supabase/migrations/202607XX_booking_buffer_trigger.sql` | Trigger valida buffer | P1 | Medio |
| A11 | `supabase/functions/booking-reminders-cron/index.ts` | Leer status actual antes de enviar | P1 | Medio |
| A12 | `supabase/functions/google-calendar-sync/index.ts` | Agregar DELETE on cancel | P0 | Bajo |
| A13 | `supabase/functions/send-push-notification/index.ts` | Trigger on booking.created para provider | P0 | Medio |
| A14 | `supabase/functions/booking-auto-cancel-cron/index.ts` | Auto-cancel `pending` tras 24h | P2 | Bajo |

### 23.2 Frontend — libs nuevas

| # | Archivo | Acción |
|---|---|---|
| B1 | `src/lib/booking/service.ts` | Crear |
| B2 | `src/lib/booking/types.ts` | Crear |
| B3 | `src/lib/booking/validators.ts` | Crear (zod + rules) |
| B4 | `src/lib/availability/service.ts` | Crear (wraps RPC) |
| B5 | `src/lib/notifications/notify.ts` | Crear (dispatcher) |
| B6 | `src/lib/calendar/adapters.ts` | Crear |
| B7 | `src/lib/bookingStateMachine.ts` | **Mover** a `src/lib/booking/state-machine.ts` (mantener re-export temporal) |

### 23.3 Frontend — hooks

| # | Archivo | Acción |
|---|---|---|
| C1 | `src/hooks/useMyBookingsV2.ts` | Refactorizar → `src/hooks/booking/useBookings.ts` con paginación |
| C2 | `src/hooks/useAvailableSlots.ts` | Refactorizar → wrap RPC |
| C3 | `src/hooks/useBookingMutations.ts` | Agregar `useRescheduleByProvider` |
| C4 | `src/hooks/useProviderAgenda.ts` | Crear nuevo |
| C5 | `src/hooks/useProviderBookingsInbox.ts` | Mantener, ajustar para `assigned_seat_user_id` |

### 23.4 Frontend — componentes

| # | Archivo | Acción |
|---|---|---|
| D1 | `src/components/booking/BookingFlow.tsx` | **Rehacer** como `BookingWizardV3.tsx` |
| D2 | `src/components/calendar/BookingModal.tsx` | **Deprecar** (eliminar tras migración) |
| D3 | `src/components/EnhancedBookingDialog.tsx` | **Eliminar** (dead code) |
| D4 | `src/components/booking/RescheduleFromInboxDialog.tsx` | **Crear** |
| D5 | `src/components/booking/PolicyBanner.tsx` | **Crear** |
| D6 | `src/components/booking/BookingSuccessScreen.tsx` | **Crear** |
| D7 | `src/components/provider/TodayAgendaCard.tsx` | Fix query (`service_provider_id`) |
| D8 | `src/components/provider/ProviderAgendaCalendar.tsx` | **Crear** |
| D9 | `src/components/provider/PatientBriefing.tsx` | **Crear** |
| D10 | `src/components/provider/AvailabilityOnboardingWizard.tsx` | **Crear** |
| D11 | `src/components/provider/AvailabilityRulesEditor.tsx` | Agregar templates |
| D12 | `src/components/BottomTabBar.tsx` | Fix "My Paws" → "Mis Mascotas" |
| D13 | `src/components/booking/BookingDetailDrawer.tsx` | Mobile = bottom sheet |
| D14 | `src/components/booking/BookingCard.tsx` | Hint grace window inline |

### 23.5 Frontend — páginas

| # | Archivo | Acción |
|---|---|---|
| E1 | `src/pages/MyBookings.tsx` | Rediseñar: quitar tab "Buscar", agregar CTA desde día vacío |
| E2 | `src/pages/UnifiedCalendar.tsx` | Agregar botón "Agendar algo" en día vacío |
| E3 | `src/pages/provider/ProviderAgenda.tsx` | **Crear** ruta nueva |
| E4 | `src/pages/provider/ProviderAvailability.tsx` | **Crear** (extraer de profile-edit) |
| E5 | `src/pages/PerfilVetPublico.tsx` | CTA "Reservar" abre `BookingWizardV3` |
| E6 | `src/App.tsx` | Agregar rutas `/provider/agenda`, `/provider/disponibilidad` |

### 23.6 Tests

| # | Archivo | Acción |
|---|---|---|
| F1 | `e2e/booking-full-flow.spec.ts` | Crear E2E login + reservar + confirm + cancel + reschedule |
| F2 | `e2e/provider-inbox.spec.ts` | Crear E2E provider confirms + reschedules |
| F3 | `src/lib/booking/__tests__/service.test.ts` | Unit tests del service layer |
| F4 | `src/lib/availability/__tests__/*.test.ts` | Unit tests de compute slots |
| F5 | `src/integration/__tests__/booking-lifecycle.test.ts` | Mantener + ampliar |

### 23.7 Config / settings

| # | Archivo | Acción |
|---|---|---|
| G1 | `src/lib/featureFlags.ts` | Agregar `BOOKING_V3_WIZARD`, `PROVIDER_AGENDA_CALENDAR`, `PROVIDER_PUSH` |
| G2 | `src/lib/analytics.ts` | Agregar 8 eventos nuevos |
| G3 | `CLAUDE.md` | Actualizar §9.6 con nuevas reglas de booking |
| G4 | `diagrams/FLUJO_COMPLETO.mmd` | Actualizar con nuevas rutas y transiciones |

---

## 24. Tipos TypeScript centrales del dominio

```typescript
// src/lib/booking/types.ts

export type BookingKind = 'vet' | 'walk' | 'dogsitter' | 'training' | 'grooming';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'on_the_way'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type ActorRole = 'owner' | 'provider' | 'admin' | 'system';

export type ConfirmationMode = 'auto' | 'manual';

export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'refunded' | 'failed';

export interface Booking {
  id: string;
  kind: BookingKind;
  ownerId: string;
  serviceProviderId: string;
  assignedSeatUserId?: string | null;
  branchId?: string | null;
  serviceId?: string | null;
  petIds: string[];
  scheduledAt: string;          // ISO 8601 UTC
  durationMinutes: number;
  status: BookingStatus;
  isEmergency: boolean;
  priceClp: number | null;
  commissionRateSnapshot: number | null;
  paymentStatus: PaymentStatus;
  confirmationMode: ConfirmationMode;
  reminder24hSent: boolean;
  reminder2hSent: boolean;
  preCheckInSent: boolean;
  notesOwner: string | null;
  notesPrivateProvider: string | null;
  followUpOf: string | null;
  rescheduledFrom: string | null;
  googleEventId: string | null;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  cancelledBy: string | null;
}

export interface BookingWithRelations extends Booking {
  pets: Pet[];
  provider: ServiceProvider;
  service?: ProviderService;
  events?: BookingEvent[];
}

export interface AvailabilityRule {
  id: string;
  providerId: string;
  branchId: string | null;
  dayOfWeek: number;           // 0-6
  startTime: string;           // HH:mm
  endTime: string;             // HH:mm
  serviceIds: string[];
  slotDurationMinutes: number;
  bufferMinutes: number;
  capacity: number;
  minLeadTimeMinutes: number;
  maxAdvanceDays: number;
  isEmergencySlot: boolean;
  isActive: boolean;
}

export interface AvailabilityException {
  id: string;
  providerId: string;
  branchId: string | null;
  exceptionDate: string;       // YYYY-MM-DD
  kind: 'block' | 'override';
  startTime: string | null;    // HH:mm
  endTime: string | null;      // HH:mm
  reason: string | null;
}

export interface ComputedSlot {
  providerId: string;
  branchId: string | null;
  serviceId: string | null;
  startsAt: string;            // ISO UTC
  durationMinutes: number;
  capacity: number;
  currentlyBooked: number;
  isAvailable: boolean;
  isEmergencySlot: boolean;
}

export interface ProviderService {
  id: string;
  providerId: string;
  slug: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceClp: number;
  isActive: boolean;
  requiresPreCheckIn: boolean;
  isEmergencyOnly: boolean;
}

export interface BookingEvent {
  id: string;
  bookingId: string;
  actorId: string | null;
  actorRole: ActorRole;
  eventType: string;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// DTOs / input

export interface CreateBookingInput {
  kind: BookingKind;
  serviceProviderId: string;
  assignedSeatUserId?: string;
  serviceId: string;
  petIds: string[];
  scheduledAt: string;         // ISO UTC
  durationMinutes?: number;    // optional override
  isEmergency?: boolean;
  notesOwner?: string;
}

export interface CancelBookingInput {
  bookingId: string;
  reason?: string;
  actor: ActorRole;
}

export interface RescheduleBookingInput {
  bookingId: string;
  newScheduledAt: string;
  newServiceId?: string;
  proposedByProvider?: boolean;    // si provider propone, owner debe aceptar
  proposalNotes?: string;
}

export interface GetAvailableSlotsInput {
  providerId: string;
  serviceId: string;
  dateFrom: string;            // YYYY-MM-DD
  dateTo: string;              // YYYY-MM-DD
  branchId?: string;
  seatUserId?: string;
}

// View models

export interface BookingCardViewModel {
  booking: BookingWithRelations;
  availableActions: BookingAction[];
  graceWindow: { canCancelFree: boolean; canRescheduleFree: boolean; hoursUntilCharge: number };
  statusColor: string;
  statusLabel: string;
  displayDate: string;         // formatted for Chile tz
  displayTime: string;
}

export type BookingAction =
  | 'view'
  | 'cancel'
  | 'reschedule'
  | 'reschedule_propose'     // provider
  | 'confirm'
  | 'reject'
  | 'start'
  | 'complete'
  | 'mark_no_show'
  | 'review'
  | 'follow_up'
  | 'open_medical_record';
```

---

## 25. Pseudocódigo y lógica central

### 25.1 Disponibilidad — `get_available_slots` (Postgres)

```sql
CREATE OR REPLACE FUNCTION rpc_get_available_slots(
  p_provider_id UUID,
  p_service_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_branch_id UUID DEFAULT NULL,
  p_seat_user_id UUID DEFAULT NULL
) RETURNS TABLE (
  starts_at TIMESTAMPTZ,
  duration_minutes SMALLINT,
  capacity SMALLINT,
  currently_booked BIGINT,
  is_available BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz TEXT;
  v_service_duration SMALLINT;
BEGIN
  SELECT timezone INTO v_tz FROM service_providers WHERE id = p_provider_id;
  IF v_tz IS NULL THEN v_tz := 'America/Santiago'; END IF;

  SELECT duration_minutes INTO v_service_duration
    FROM provider_services WHERE id = p_service_id;

  RETURN QUERY
  WITH rules AS (
    SELECT r.* FROM provider_availability_rules r
    WHERE r.provider_id = p_provider_id
      AND r.is_active
      AND (cardinality(r.service_ids) = 0 OR p_service_id = ANY(r.service_ids))
      AND (p_branch_id IS NULL OR r.branch_id = p_branch_id)
  ),
  days AS (
    SELECT generate_series(p_date_from, p_date_to, '1 day')::DATE AS d
  ),
  exceptions AS (
    SELECT * FROM provider_availability_exceptions
    WHERE provider_id = p_provider_id
      AND exception_date BETWEEN p_date_from AND p_date_to
  ),
  slots_gen AS (
    SELECT
      (d + r.start_time) AT TIME ZONE v_tz AS slot_start_tz,
      COALESCE(sdo.duration_minutes, v_service_duration, r.slot_duration_minutes) AS dur,
      r.buffer_minutes,
      r.capacity,
      r.min_lead_time_minutes,
      r.id AS rule_id,
      d AS day,
      EXTRACT(DOW FROM d)::INT AS dow
    FROM days d
    CROSS JOIN rules r
    LEFT JOIN service_duration_overrides sdo
      ON sdo.rule_id = r.id AND sdo.service_id = p_service_id
    WHERE EXTRACT(DOW FROM d) = r.day_of_week
  ),
  expanded AS (
    SELECT
      slot_start_tz + (gs.n * (dur + buffer_minutes) * INTERVAL '1 minute') AS slot_at,
      dur, capacity, min_lead_time_minutes, rule_id, day
    FROM slots_gen
    CROSS JOIN LATERAL generate_series(
      0,
      FLOOR(
        EXTRACT(EPOCH FROM (
          (day + (SELECT end_time FROM rules WHERE id = slots_gen.rule_id))::TIMESTAMPTZ
          - slot_start_tz
        )) / 60 / (dur + buffer_minutes)
      )::INT
    ) AS gs(n)
  ),
  filtered AS (
    SELECT e.*
    FROM expanded e
    WHERE e.slot_at >= NOW() + e.min_lead_time_minutes * INTERVAL '1 minute'
      AND NOT EXISTS (
        -- excluir blocks que cubren este slot
        SELECT 1 FROM exceptions ex
        WHERE ex.kind = 'block'
          AND ex.exception_date = e.day
          AND (
            ex.start_time IS NULL
            OR (e.slot_at::TIME BETWEEN ex.start_time AND COALESCE(ex.end_time, ex.start_time + INTERVAL '1 minute' * e.dur))
          )
      )
  )
  SELECT
    f.slot_at,
    f.dur::SMALLINT,
    f.capacity::SMALLINT,
    COALESCE((
      SELECT COUNT(*) FROM v_all_bookings b
      WHERE b.service_provider_id = p_provider_id
        AND b.status NOT IN ('cancelled', 'no_show')
        AND b.scheduled_at < f.slot_at + INTERVAL '1 minute' * f.dur
        AND b.scheduled_at + INTERVAL '1 minute' * b.duration_minutes > f.slot_at
        AND (p_seat_user_id IS NULL OR b.assigned_seat_user_id = p_seat_user_id)
    ), 0),
    (COALESCE((
      SELECT COUNT(*) FROM v_all_bookings b
      WHERE b.service_provider_id = p_provider_id
        AND b.status NOT IN ('cancelled', 'no_show')
        AND b.scheduled_at < f.slot_at + INTERVAL '1 minute' * f.dur
        AND b.scheduled_at + INTERVAL '1 minute' * b.duration_minutes > f.slot_at
    ), 0) < f.capacity)
  FROM filtered f
  ORDER BY f.slot_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION rpc_get_available_slots FROM public;
GRANT EXECUTE ON FUNCTION rpc_get_available_slots TO authenticated, anon;
```

### 25.2 Creación de reserva — `rpc_create_booking`

```sql
CREATE OR REPLACE FUNCTION rpc_create_booking(
  p_kind TEXT,
  p_provider_id UUID,
  p_service_id UUID,
  p_pet_ids UUID[],
  p_scheduled_at TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL,
  p_is_emergency BOOLEAN DEFAULT FALSE,
  p_assigned_seat_user_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
  v_owner_id UUID := auth.uid();
  v_duration SMALLINT;
  v_confirmation_mode TEXT;
  v_price INTEGER;
  v_commission_rate NUMERIC;
BEGIN
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- Validar pets pertenecen al owner
  IF EXISTS (
    SELECT 1 FROM unnest(p_pet_ids) pid
    WHERE NOT EXISTS (SELECT 1 FROM pets WHERE id = pid AND owner_id = v_owner_id)
  ) THEN
    RAISE EXCEPTION 'pet_not_owned_by_caller';
  END IF;

  -- Obtener duration + confirmation_mode + price
  SELECT s.duration_minutes, s.price_clp INTO v_duration, v_price
  FROM provider_services s WHERE s.id = p_service_id;

  SELECT sp.confirmation_mode INTO v_confirmation_mode
  FROM service_providers sp WHERE sp.id = p_provider_id;

  -- Commission rate snapshot desde plan vigente
  SELECT commission_rate INTO v_commission_rate
  FROM provider_plans
  WHERE provider_id = p_provider_id AND is_active;

  -- Validar slot disponible (revalidación server-side)
  IF NOT EXISTS (
    SELECT 1 FROM rpc_get_available_slots(p_provider_id, p_service_id, p_scheduled_at::DATE, p_scheduled_at::DATE)
    WHERE starts_at = p_scheduled_at AND is_available
  ) THEN
    RAISE EXCEPTION 'slot_not_available' USING ERRCODE = '23505';
  END IF;

  -- INSERT
  INSERT INTO bookings_v3 (
    kind, owner_id, service_provider_id, service_id, pet_ids,
    scheduled_at, duration_minutes, status, is_emergency,
    price_clp, commission_rate_snapshot, confirmation_mode,
    assigned_seat_user_id, notes_owner
  ) VALUES (
    p_kind, v_owner_id, p_provider_id, p_service_id, p_pet_ids,
    p_scheduled_at, v_duration,
    CASE WHEN v_confirmation_mode = 'auto' THEN 'confirmed' ELSE 'pending' END,
    p_is_emergency, v_price, v_commission_rate, v_confirmation_mode,
    p_assigned_seat_user_id, p_notes
  )
  RETURNING id INTO v_booking_id;

  -- audit trail via trigger trg_booking_event_on_insert

  RETURN v_booking_id;
END;
$$;
```

### 25.3 Reminders cron (TypeScript, edge function)

```typescript
// supabase/functions/booking-reminders-cron/index.ts (resumen)

const WINDOWS = [
  { label: '24h', from: 23, to: 25 },
  { label: '2h',  from: 1.5, to: 2.5 },
];

for (const window of WINDOWS) {
  const bookings = await supabase.rpc('get_bookings_in_reminder_window', {
    hours_from: window.from,
    hours_to: window.to,
    reminder_type: window.label,
  });

  for (const b of bookings) {
    // CRITICAL: re-check status at send time
    const { data: current } = await supabase
      .from('v_all_bookings')
      .select('id, status')
      .eq('id', b.id)
      .single();

    if (['cancelled', 'no_show', 'completed'].includes(current.status)) continue;

    // Idempotency check
    const alreadySent = await wasReminderSent(b.id, window.label);
    if (alreadySent) continue;

    // Dispatch via notify service
    await notify({
      category: 'pet_reminders',
      recipientId: b.owner_id,
      event: `booking.reminder.${window.label}`,
      bookingId: b.id,
      payload: { petName: b.pet_name, providerName: b.provider_name, scheduledAt: b.scheduled_at },
    });

    // Mark as sent
    await supabase.from('bookings_v3')
      .update({ [`reminder_${window.label}_sent`]: true })
      .eq('id', b.id);

    await supabase.from('booking_events').insert({
      booking_id: b.id,
      event_type: `reminder_sent_${window.label}`,
      actor_role: 'system',
    });
  }
}
```

### 25.4 Reschedule / cancel con side effects

```typescript
// src/lib/booking/service.ts

export async function cancelBooking(input: CancelBookingInput) {
  const { bookingId, reason, actor } = input;

  // 1. Validación estado
  const booking = await getBooking(bookingId);
  if (!canTransition(booking.status, 'cancelled', actor)) {
    throw new Error('invalid_transition');
  }

  // 2. Grace window check
  const grace = computeGraceWindow(booking, actor);
  if (!grace.canCancelFree && !reason) {
    throw new Error('reason_required_outside_grace');
  }

  // 3. RPC transaccional
  const { data, error } = await supabase.rpc('rpc_cancel_booking', {
    p_booking_id: bookingId,
    p_reason: reason,
  });
  if (error) throw error;

  // 4. Side effects (best-effort, async)
  Promise.all([
    notify({
      category: 'transactional',
      recipientId: booking.serviceProviderId,   // o ownerId según actor
      event: 'booking.cancelled',
      bookingId,
    }),
    cancelScheduledReminders(bookingId),
    deleteGoogleCalendarEvent(bookingId),
    analytics.track('booking_cancelled', { actor, grace: grace.canCancelFree }),
  ]).catch(err => {
    Sentry.captureException(err, { tags: { op: 'cancel_side_effects' } });
  });

  return data;
}

export async function rescheduleBooking(input: RescheduleBookingInput) {
  // Similar estructura:
  // 1. validar transición
  // 2. validar slot nuevo disponible
  // 3. RPC que actualiza en transacción
  // 4. side effects: cancel old reminders, schedule new, notify both, google update
}
```

### 25.5 Sincronización calendario / rutina

```typescript
// src/lib/calendar/adapters.ts

export function bookingToCalendarEvent(b: Booking, tz: string): CalendarEvent {
  return {
    id: `booking-${b.id}`,
    sourceType: 'booking',
    sourceId: b.id,
    startsAt: b.scheduledAt,
    endsAt: addMinutes(b.scheduledAt, b.durationMinutes),
    title: formatBookingTitle(b),
    color: statusToColor(b.status),
    meta: { kind: b.kind, status: b.status, providerId: b.serviceProviderId },
  };
}

export function reminderToCalendarEvent(r: PetReminder): CalendarEvent {
  return {
    id: `reminder-${r.id}`,
    sourceType: 'reminder',
    sourceId: r.id,
    startsAt: r.dueDate + 'T09:00:00',  // default hora mañana
    endsAt: r.dueDate + 'T09:30:00',
    title: r.title,
    color: '#f59e0b',
    meta: { type: r.type, isCompleted: r.isCompleted },
  };
}

// en UnifiedCalendar:
const events = [
  ...bookings.map(b => bookingToCalendarEvent(b, tz)),
  ...reminders.map(reminderToCalendarEvent),
  ...expandRoutines(routines, dateRange),   // expande rutinas a eventos diarios
];
```

### 25.6 Side effects críticos — resumen

| Transición | Side effects (en orden) |
|---|---|
| `→ confirmed` | insert event, notify owner, schedule reminders (24h + 2h), google sync, analytics |
| `→ cancelled` | insert event, notify otro, **cancel reminders**, google delete, analytics, refund si captured |
| `→ in_progress` | insert event, notify owner (opcional), start timer UI |
| `→ completed` | insert event, **calc commission (snapshot plan)**, notify owner, schedule review invitation, award paw_points, analytics |
| `→ no_show` | insert event, notify owner (suave), increment counter, analytics |

---

## 26. Analytics del funnel de reservas

### 26.1 Eventos a medir

| Evento | Cuándo | Propiedades clave |
|---|---|---|
| `directory_viewed` | tutor entra a `/veterinarios` | filters |
| `provider_viewed` | ✓ ya existe | provider_id, source (directory/perfil/qr/map) |
| `booking_started` | ✓ ya existe | provider_id, kind, source |
| `select_service` | ⊕ | provider_id, service_id, price_clp |
| `select_slot` | ⊕ | provider_id, slot_at, service_id |
| `booking_completed` | ✓ ya existe (rename → `booking_created`) | provider_id, kind, price_clp, lead_time_hours |
| `booking_conflict_shown` | ⊕ | alternatives_count |
| `booking_conflict_resolved` | ⊕ | chose_alternative: bool |
| `booking_confirmed_by_provider` | ⊕ | time_to_confirm_minutes |
| `booking_cancelled` | ⊕ | actor, within_grace: bool, hours_until_appointment |
| `booking_rescheduled` | ⊕ | actor, proposed_by_provider: bool |
| `booking_no_show` | ⊕ | provider_id |
| `booking_completed_vet` | ⊕ | duration_actual_vs_scheduled_minutes |
| `reminder_sent` | ⊕ | type (24h/2h), channel |
| `reminder_tapped` | ⊕ | type, channel |
| `review_created` | ✓ ya existe | rating |
| `follow_up_created` | ⊕ | offset_days |

### 26.2 Taxonomía mínima

Prefijos namespaced:
- `booking.*` para eventos de dominio booking
- `availability.*` para vistas de disponibilidad
- `provider.*` para acciones provider-side
- `reminder.*` para recordatorios

### 26.3 Indicadores / KPIs

| KPI | Fórmula |
|---|---|
| Booking funnel conversion | `booking_created / directory_viewed` |
| Slot conflict rate | `booking_conflict_shown / booking_started` |
| Auto-confirm rate | `booking_confirmed (auto) / booking_created` |
| Avg time to manual confirm | mean `time_to_confirm_minutes` |
| Cancellation rate | `booking_cancelled / booking_created` |
| Cancel within grace | `cancel_within_grace / booking_cancelled` |
| No-show rate | `booking_no_show / booking_confirmed` |
| Reschedule rate | `booking_rescheduled / booking_created` |
| Reminder CTR | `reminder_tapped / reminder_sent` |
| Review rate | `review_created / booking_completed` |
| Follow-up adoption | `follow_up_created / booking_completed (vet)` |

### 26.4 Métricas operativas y de conversión

**Dashboard admin recomendado** (`/admin?section=bookings`):
- Gráfico funnel: views → starts → completed.
- Heatmap: slots solicitados por día de semana × hora.
- Top 10 vets por bookings.
- Bottom 10 vets por tasa de confirmación.
- Alertas: vets con >20% no-show rate.

**Dashboard provider** (ya existe en `BusinessTab`, ampliar):
- Funnel personal.
- Slot utilization rate.
- Time to confirm personal vs media.
- Ingresos por día / servicio.

---

## 27. Plan de implementación por fases

### 27.1 Fase 0 — Investigación y saneamiento (semana 1)

**Objetivo**: congelar base, eliminar bugs críticos de producción, preparar terreno.

**Tareas**:
- Fix P0-1: `TodayAgendaCard` usa `service_provider_id`.
- Fix P0-11: Google Calendar DELETE on cancel.
- Fix P0-17: Sentry captureException en `useBookingMutations`.
- Setup feature flags `BOOKING_V3_WIZARD`, `PROVIDER_AGENDA_CALENDAR`, `PROVIDER_PUSH`.
- Escribir E2E del flujo actual para evitar regresiones.
- Auditar RLS de todas las tablas booking (con `schema-auditor` + `rls-guardian`).

**Dependencias**: ninguna.

**Riesgos**: bajo.

**Criterio de aceptación**:
- Tests E2E pasan.
- 0 errores P0 abiertos en Sentry por booking.
- CLAUDE.md §9.6 actualizado.

---

### 27.2 Fase 1 — Quick wins UX (semanas 2-3)

**Objetivo**: mejoras visibles para tutor y provider sin cambios de schema.

**Tareas**:
- Fix "My Paws" → "Mis Mascotas" en `BottomTabBar`.
- `BookingFlow` step confirm: agregar `PolicyBanner` + precio.
- Copy fix toast "Solicitud / Confirmada".
- Dots de count en `AvailabilityCalendar`.
- `BookingDetailDrawer` mobile = bottom sheet.
- `BookingCard` muestra grace hint inline.
- Agregar `/calendario` CTA "Agendar algo" en día vacío.
- `BookingWizardV3` skeleton con auto-select mascota única.

**Dependencias**: Fase 0.

**Riesgos**: bajo-medio.

**Criterio de aceptación**:
- 0 regresiones en E2E.
- Analytics muestra funnel con nuevos eventos.

---

### 27.3 Fase 2 — Modelo de datos / backend (semanas 3-5)

**Objetivo**: base server-authoritative para booking.

**Tareas**:
- Migración `v_all_bookings` vista (Opción B).
- Migración `service_providers.timezone`.
- Migración `provider_services` catálogo.
- Migración `service_duration_overrides`.
- Migración `bookings.assigned_seat_user_id`.
- Migración `availability_rules.min_lead_time_minutes`, `max_advance_days`.
- RPC `rpc_get_available_slots`.
- RPC `rpc_create_booking`, `rpc_cancel_booking`, `rpc_reschedule_booking`.
- Trigger buffer validation.
- Refactor `useAvailableSlots` a wrap RPC.
- Tests unit de RPCs.

**Dependencias**: Fase 0+1.

**Riesgos**: alto (cambio de schema + RLS).

**Criterio de aceptación**:
- Migraciones aplicadas en staging y prod.
- Tests de integración pasan.
- Smoke test post-deploy: crear booking funciona.

---

### 27.4 Fase 3 — UX/UI tutor (semanas 5-7)

**Objetivo**: experiencia tutor pulida y unificada.

**Tareas**:
- `BookingWizardV3` completo reemplazando `BookingFlow`.
- Deprecar `BookingModal` V1.
- Eliminar `EnhancedBookingDialog` (dead code).
- Rediseño `/mis-reservas`: sin tab "Buscar", con CTAs distintos.
- `BookingSuccessScreen` post-confirmación.
- Botón ICS export.
- Deep links push → drawer de booking.
- Mobile swipe actions en cards.
- Tests E2E completos (login + reservar + cancel + reschedule).

**Dependencias**: Fase 2.

**Riesgos**: medio (tocar wizard).

**Criterio de aceptación**:
- Feature flag `BOOKING_V3_WIZARD` activado 10% → 50% → 100%.
- Métricas funnel estables o mejores.

---

### 27.5 Fase 4 — UX/UI oferente y veterinaria (semanas 7-9)

**Objetivo**: provider tiene herramientas operativas de verdad.

**Tareas**:
- `/provider/agenda` ruta nueva + `ProviderAgendaCalendar` (día/semana/mes).
- Drag-to-reschedule.
- `RescheduleFromInboxDialog` (provider propone alternativas).
- `AvailabilityOnboardingWizard`.
- Templates de disponibilidad.
- Quick link "Abrir ficha" en inbox.
- `PatientBriefing` en drawer.
- Asignación de cita a seat (wizard si clínica).

**Dependencias**: Fase 3.

**Riesgos**: medio.

**Criterio de aceptación**:
- Feature flag `PROVIDER_AGENDA_CALENDAR` activado gradualmente.
- Feedback de 5 vets reales tras 1 semana.

---

### 27.6 Fase 5 — Integraciones y notificaciones (semanas 9-11)

**Objetivo**: multi-canal consistente.

**Tareas**:
- Push FCM booking.created al provider (activar flag).
- Email Resend confirmaciones + reminders.
- WhatsApp templates ampliadas (reschedule, cancel, 2h pre-cita).
- `notify()` service centralizado.
- `notification_attempts` dashboard admin.
- Cron auto-cancel pending >24h.
- Pre-check-in T-1h (opt).

**Dependencias**: Fase 4 + verificación Meta Business.

**Riesgos**: medio.

**Criterio de aceptación**:
- 0 duplicados de notifs.
- CTR push > 15%.
- `notification_attempts` sin fallas >5%.

---

### 27.7 Fase 6 — QA, hardening y release readiness (semana 11-12)

**Objetivo**: confianza operativa para producción con usuarios reales.

**Tareas**:
- Tests E2E de todos los flujos críticos.
- Load test: 100 bookings simultáneos en slot near-miss.
- Timezone test: crear booking en horario de verano switch.
- Cross-platform test (Chrome/Safari iOS/Android WebView).
- Accessibility audit (ARIA, contrast, keyboard).
- Performance budget: Lighthouse >85 mobile.
- Rollback plan documentado.
- Documentación operacional (runbook para bugs).
- Bug bash interno.

**Dependencias**: Fase 5.

**Riesgos**: bajo-medio.

**Criterio de aceptación**:
- Todos los flags en 100%.
- 0 P0 abiertos.
- Dashboard admin sin alertas críticas.

---

## 28. Tickets técnicos sugeridos

### 28.1 Formato de ticket

```
Título: [P?] Breve descripción accionable
Objetivo: qué cambio concreto se quiere
Alcance: qué está dentro y qué fuera
Archivos probables: lista específica
Dependencia: otro ticket o fase
Prioridad: P0/P1/P2/P3
Riesgo: bajo/medio/alto
Criterio de done: qué valida el cierre
```

### 28.2 Backlog (priorizado)

**TICKET-01** `[P0] Fix TodayAgendaCard query`
- Obj: Usar `service_provider_id` en vez de `vet_id` legacy.
- Alcance: query en `TodayAgendaCard.tsx`.
- Archivos: `src/components/provider/TodayAgendaCard.tsx`.
- Dep: ninguna.
- Riesgo: bajo.
- Done: bookings V2 aparecen en hoy del dashboard provider.

**TICKET-02** `[P0] Google Calendar DELETE on cancel`
- Obj: Borrar evento Google cuando booking se cancela.
- Archivos: `supabase/functions/google-calendar-sync/index.ts` + trigger o llamada desde `rpc_cancel_booking`.
- Dep: ninguna.
- Riesgo: bajo.
- Done: cancelando booking desaparece del Google del tutor.

**TICKET-03** `[P0] Sentry captureException en booking mutations`
- Obj: Capturar errores no-conflict.
- Archivos: `src/hooks/useBookingMutations.ts`.
- Dep: ninguna.
- Riesgo: bajo.
- Done: errores de booking visibles en Sentry.

**TICKET-04** `[P0] Feature flags booking v3`
- Obj: agregar `BOOKING_V3_WIZARD`, `PROVIDER_AGENDA_CALENDAR`, `PROVIDER_PUSH`.
- Archivos: `src/lib/featureFlags.ts`.
- Dep: ninguna.
- Riesgo: bajo.

**TICKET-05** `[P0] E2E baseline del flujo actual`
- Obj: capturar tutor booking flow + provider confirm flow en Playwright.
- Archivos: `e2e/booking-full-flow.spec.ts`, `e2e/provider-inbox.spec.ts`.
- Dep: ninguna.
- Riesgo: bajo.
- Done: tests pasan en CI.

**TICKET-06** `[P0] Migración vista v_all_bookings`
- Obj: consolidar lectura de 4 tablas + legacy en una vista.
- Archivos: `supabase/migrations/2026XXX_v_all_bookings.sql`.
- Dep: TICKET-05.
- Riesgo: medio.

**TICKET-07** `[P0] RPC rpc_get_available_slots`
- Obj: backend authoritative slots.
- Archivos: migración SQL.
- Dep: TICKET-06.
- Riesgo: alto (lógica compleja).
- Done: RPC devuelve slots idénticos a client-side actual en tests.

**TICKET-08** `[P0] RPC rpc_create_booking + cancel + reschedule`
- Obj: transacciones + validación server-side.
- Archivos: migración SQL.
- Dep: TICKET-07.
- Riesgo: alto.

**TICKET-09** `[P0] useAvailableSlots wraps RPC`
- Obj: refactor hook a llamar RPC.
- Archivos: `src/hooks/useAvailableSlots.ts`.
- Dep: TICKET-07.
- Riesgo: medio.

**TICKET-10** `[P0] BookingWizardV3 scaffolding`
- Obj: nueva estructura de 3 pasos con auto-select.
- Archivos: `src/components/booking/BookingWizardV3.tsx`, `src/components/booking/PolicyBanner.tsx`.
- Dep: TICKET-04.
- Riesgo: medio.

**TICKET-11** `[P0] RescheduleFromInboxDialog (provider)`
- Obj: UI para provider proponer alternativa.
- Archivos: `src/components/booking/RescheduleFromInboxDialog.tsx`, `src/hooks/useBookingMutations.ts`.
- Dep: TICKET-08.
- Riesgo: medio.

**TICKET-12** `[P0] Push FCM on booking.created to provider`
- Obj: activar notificación push.
- Archivos: `supabase/functions/send-push-notification/index.ts` + trigger.
- Dep: TICKET-04.
- Riesgo: medio.

**TICKET-13** `[P1] service_providers.timezone + UI setter`
- Obj: tz awareness.
- Archivos: migración + profile edit.
- Dep: TICKET-06.
- Riesgo: medio.

**TICKET-14** `[P1] provider_services catálogo`
- Obj: tabla + CRUD + integración con booking.
- Archivos: migración + `src/pages/provider/ProviderProfileEdit.tsx`.
- Dep: TICKET-08.
- Riesgo: medio.

**TICKET-15** `[P1] service_duration_overrides`
- Obj: duración por servicio.
- Archivos: migración.
- Dep: TICKET-14.
- Riesgo: bajo.

**TICKET-16** `[P1] assigned_seat_user_id + UI asignación`
- Obj: multi-vet clínica asigna cita.
- Archivos: migración + wizard UI.
- Dep: TICKET-08 + clínica seats (ya existe).
- Riesgo: medio.

**TICKET-17** `[P1] availability_rules.min_lead_time + max_advance`
- Obj: ventanas de reserva.
- Archivos: migración + validación en RPC.
- Dep: TICKET-07.
- Riesgo: bajo.

**TICKET-18** `[P1] /provider/agenda + ProviderAgendaCalendar`
- Obj: vista día/semana/mes con drag-to-reschedule.
- Archivos: nueva página + componente calendar.
- Dep: TICKET-11.
- Riesgo: alto (UI compleja).

**TICKET-19** `[P1] AvailabilityOnboardingWizard`
- Obj: setup fácil de horarios.
- Archivos: nuevo componente.
- Dep: TICKET-17.
- Riesgo: bajo.

**TICKET-20** `[P1] Copy cleanup: "My Paws" → "Mis Mascotas"`
- Obj: consistencia chilena.
- Archivos: `src/components/BottomTabBar.tsx`.
- Dep: ninguna.
- Riesgo: bajo.

**TICKET-21** `[P1] /calendario CTA "Agendar"`
- Obj: cerrar gap entre ver y crear.
- Archivos: `src/pages/UnifiedCalendar.tsx`.
- Dep: TICKET-10.
- Riesgo: bajo.

**TICKET-22** `[P1] BookingDetailDrawer mobile = bottom sheet`
- Obj: ergonomía mobile.
- Archivos: `src/components/booking/BookingDetailDrawer.tsx`.
- Dep: ninguna.
- Riesgo: bajo.

**TICKET-23** `[P1] PolicyBanner en wizard confirm`
- Obj: transparencia.
- Archivos: `BookingWizardV3.tsx`.
- Dep: TICKET-10.
- Riesgo: bajo.

**TICKET-24** `[P1] notify() service layer`
- Obj: unificar envíos.
- Archivos: `src/lib/notifications/*`.
- Dep: TICKET-12.
- Riesgo: medio.

**TICKET-25** `[P1] Analytics eventos faltantes`
- Obj: completar funnel.
- Archivos: `src/lib/analytics.ts` + llamadas.
- Dep: TICKET-10.
- Riesgo: bajo.

**TICKET-26** `[P1] WhatsApp templates ampliadas`
- Obj: reschedule, cancel, pre-cita.
- Archivos: templates Meta + edge fn.
- Dep: TICKET-24 + Meta verif.
- Riesgo: medio.

**TICKET-27** `[P2] Auto-cancel cron pending >24h`
- Obj: limpieza automática.
- Archivos: nueva edge fn.
- Dep: TICKET-08.
- Riesgo: bajo.

**TICKET-28** `[P2] Pre-check-in T-1h`
- Obj: reducir no-shows.
- Archivos: agregar a cron.
- Dep: TICKET-24.
- Riesgo: bajo.

**TICKET-29** `[P2] Export ICS`
- Obj: compatibilidad Apple/Outlook.
- Archivos: util + botón.
- Dep: ninguna.
- Riesgo: bajo.

**TICKET-30** `[P2] Export CSV provider`
- Obj: backup pacientes + bookings.
- Archivos: util + botón.
- Dep: ninguna.
- Riesgo: bajo.

**TICKET-31** `[P2] Admin dashboard booking funnel`
- Obj: visibilidad global.
- Archivos: `src/components/admin/AdminBookings.tsx`.
- Dep: TICKET-25.
- Riesgo: bajo.

**TICKET-32** `[P2] buffer_before_minutes pre-consulta`
- Obj: tiempo setup.
- Archivos: migración + compute slots.
- Dep: TICKET-07.
- Riesgo: bajo.

**TICKET-33** `[P3] Consolidación tabla bookings_v3 (Opción A)`
- Obj: schema único.
- Archivos: migración masiva + backfill.
- Dep: todos los anteriores.
- Riesgo: muy alto.
- **NOTA**: ejecutar solo si la app ya está sólida y hay razones fuertes; alternativa de vista `v_all_bookings` es suficiente por 12 meses.

---

## 29. QA y pruebas

### 29.1 Unit tests

| Área | Cobertura objetivo | Ejemplos |
|---|---|---|
| `bookingStateMachine` | 100% (ya) | canTransition, getAvailableTransitions |
| `booking/service` | 90%+ | create, cancel, reschedule con mocks |
| `availability/service` | 90%+ | computeSlots edge cases |
| `notifications/notify` | 80%+ | dispatch por canal, idempotency |
| `calendar/adapters` | 80%+ | mappings |
| Zod validators | 100% | schemas |

### 29.2 Integration tests

- `booking-lifecycle.test.ts` — pending → confirmed → in_progress → completed con side effects mockeados.
- `availability-with-bookings.test.ts` — slots correctos cuando hay bookings existentes.
- `notifications-idempotency.test.ts` — no se duplica si ya `sent`.

### 29.3 E2E (Playwright)

| Flujo | Test |
|---|---|
| Tutor reserva | Login → directorio → perfil → wizard → confirm → ve en /mis-reservas |
| Tutor cancela in-grace | Crear booking → cancelar dentro de 2h grace → no pide motivo |
| Tutor cancela out-of-grace | idem, cancelar 30 min antes → pide motivo obligatorio |
| Tutor reprograma | Crear → reprogramar → slot nuevo → confirm |
| Tutor ve recordatorio | Mock cron → verifica notification in-app |
| Provider confirma | Login provider → inbox pending → confirmar → booking aparece "confirmada" |
| Provider reprograma | confirmado → propone alternativa → owner recibe notify |
| Provider cancela | cancela con motivo → tutor notificado |
| Provider completa | in_progress → completar → invita review → paw_points awarded |
| Provider no-show | confirmar → no-show → tutor notificado suave |
| Conflict | Dos tutores simultáneos → segundo ve alternativas |
| Timezone | Reservar cerca de switch DST → hora correcta |
| Feature flag off | `BOOKING_V3_WIZARD=false` → usa flujo legacy (durante migración) |

### 29.4 Casos críticos

- **Doble reserva**: simular 100 tutores click simultáneo. Solo 1 gana.
- **Cancel en cascada**: vet cancela cita con reminder ya programado. Reminder NO se envía.
- **Reschedule cruzado**: tutor y vet cambian el mismo booking casi a la vez. Optimistic concurrency (retry).
- **Soft delete mascota con booking futuro**: mascota `deceased_at` setea → booking auto-cancela.

### 29.5 Edge cases

- Tutor sin mascotas intenta reservar.
- Provider desactiva disponibilidad con bookings futuros.
- Mascota eliminada mid-flow del wizard.
- Booking fecha=hoy+5min (dentro de lead time).
- Vet cambia plan mid-booking completado.
- Clínica elimina seat con bookings asignados.

### 29.6 Mobile QA

- iOS Safari real device (física, no simulador).
- Android Chrome + Samsung Internet.
- WebView Capacitor Android + iOS.
- Landscape rotation.
- Touch targets ≥44px.
- Keyboard no cubre input.
- Back button Android.

### 29.7 Pruebas por rol

- Owner único.
- Provider único.
- Owner+Provider (dual-role).
- Provider individual vs clínica (seats).
- Shelter (no debería crear bookings).
- Admin (visibilidad global).

---

## 30. Riesgos, tradeoffs y decisiones de producto

### 30.1 Qué NO conviene hacer aún

1. **Consolidar las 4 tablas a `bookings_v3` físicamente** — hacerlo ahora es alto riesgo y marginal beneficio vs vista. Posponer 6-12 meses.
2. **Video/teleconsulta** — demanda no validada, complejidad alta. Escuchar feedback antes de construir.
3. **SMS** — costo alto, WhatsApp ya cubre 90% del caso.
4. **Multi-sucursal completo** — solo 1-2 clínicas Pro Max lo necesitarían en Y1. Stubs en schema, UI en Y2.
5. **Sync bidireccional Google** — requiere infra de webhooks públicos, postponer.
6. **Billing/invoicing SII** — depende de SpA + flujo real, no antes de H2 2026.

### 30.2 Riesgos de sobreingeniería

- **Service layer abstracto sin casos de uso reales**: evitar crear interfaces genéricas por si acaso. Construir lo necesario.
- **Feature flags proliferan**: max 3-5 activos. Retirar después de rollout.
- **RPCs cubren todo**: no convertir cada CRUD en RPC — solo transiciones de estado críticas.

### 30.3 Riesgos operativos

- **Migración v_all_bookings rompe RLS**: testing obligatorio en staging antes de prod.
- **Push notifications spam**: rate limit + prefs estrictas.
- **Cron booking-reminders-cron se atrasa**: monitor de latencia + alert si >15 min delay.
- **Google Calendar API quota**: 1 million req/day free; con crecimiento podría saturarse.

### 30.4 Riesgos UX

- **Wizard nuevo confunde users viejos**: feature flag gradual + tutorial opcional.
- **Provider agenda calendar complejo**: onboarding y tutorial.
- **Demasiadas notificaciones**: default prefs conservadoras.

### 30.5 Decisiones difíciles y tradeoffs

| Decisión | Opción A | Opción B | Recomendación |
|---|---|---|---|
| Consolidación tablas | Tabla única `bookings_v3` | Vista `v_all_bookings` | **B** (menos riesgo) |
| Timezone | UTC-only, cliente convierte | Provider-tz en columna | **UTC + tz en provider** |
| Confirmation mode | Auto default | Manual default | **Auto** (menos fricción owner) |
| No-show penalty | Bloqueo soft después 3 | Sin penalty | **Soft flag, admin decide** |
| Grace window | Fixed 2h/24h | Configurable por provider | **Fixed Y1**, configurable Y2 |
| Multi-vet asignación | Owner elige | Round-robin | **Round-robin con override owner** |
| Duración por servicio | Override por regla | Solo en service catalog | **Override** (más flexible) |
| Cancellation fees | Cobrar mismo día | Nunca cobrar | **Nunca cobrar Y1** (confianza) |

---

## 31. Top 10 acciones inmediatas

| # | Acción | Impacto | Dificultad | Razón |
|---|---|---|---|---|
| 1 | Fix `TodayAgendaCard` para usar `service_provider_id` | **Altísimo** | Baja | Bug P0 — provider pierde bookings |
| 2 | Push FCM booking.new al provider | Alto | Baja-media | Sin esto, provider no se entera |
| 3 | RPC `rpc_get_available_slots` | Alto | Alta | Base para todo lo demás |
| 4 | `RescheduleFromInboxDialog` para provider | Alto | Media | Feature prometida sin UI |
| 5 | `BookingWizardV3` con precio + política | Alto | Media | Confianza del tutor |
| 6 | `/provider/agenda` con calendario visual | Alto | Alta | Feature core faltante |
| 7 | Fix Google Calendar DELETE on cancel | Medio | Baja | Bug silencioso |
| 8 | Analytics eventos faltantes | Medio | Baja | Visibilidad del funnel |
| 9 | "My Paws" → "Mis Mascotas" | Bajo | Baja | Consistencia brand |
| 10 | E2E baseline tests | Alto | Media | Habilita todo el resto con confianza |

---

## APÉNDICE A — Estructura de carpetas y módulos de booking

Ver §22 arriba. Recapitulación ejecutiva:

```
src/lib/booking/
src/lib/availability/
src/lib/notifications/
src/lib/calendar/
src/hooks/booking/
src/hooks/provider/
src/components/booking/
src/components/calendar/
src/components/provider/
src/pages/bookings/
src/pages/provider/
```

Principios:
- `lib/` es puro (sin React).
- `hooks/` wraps lib con React Query.
- `components/` consumen hooks.
- `pages/` compone layouts.

---

## APÉNDICE B — Archivos concretos a modificar

Ver §23 arriba. Recapitulación priorizada:

**P0 — Fase 0+1 (semana 1-3)**:
- `src/components/provider/TodayAgendaCard.tsx` (fix query)
- `supabase/functions/google-calendar-sync/index.ts` (DELETE on cancel)
- `src/hooks/useBookingMutations.ts` (Sentry capture)
- `src/lib/featureFlags.ts` (flags nuevos)
- `e2e/booking-full-flow.spec.ts` (E2E baseline)
- `src/components/BottomTabBar.tsx` (copy fix)
- `src/components/booking/BookingFlow.tsx` → `BookingWizardV3.tsx`
- `src/pages/UnifiedCalendar.tsx` (CTA agendar)

**P0 — Fase 2 (semana 3-5)**:
- Migraciones (7): vista, timezone, services catalog, duration overrides, assigned_seat, lead times, RPCs.
- `src/hooks/useAvailableSlots.ts` (wrap RPC).

**P0 — Fase 3 (semana 5-7)**:
- `src/pages/MyBookings.tsx` (rediseño).
- Eliminar `src/components/EnhancedBookingDialog.tsx`.
- Deprecar `src/components/calendar/BookingModal.tsx`.
- `src/components/booking/BookingSuccessScreen.tsx` (nuevo).
- `src/components/booking/PolicyBanner.tsx` (nuevo).

**P0 — Fase 4 (semana 7-9)**:
- `src/pages/provider/ProviderAgenda.tsx` (nuevo).
- `src/components/provider/ProviderAgendaCalendar.tsx` (nuevo).
- `src/components/booking/RescheduleFromInboxDialog.tsx` (nuevo).
- `src/components/provider/PatientBriefing.tsx` (nuevo).
- `src/components/provider/AvailabilityOnboardingWizard.tsx` (nuevo).
- `src/App.tsx` (rutas nuevas).

**P1 — Fase 5 (semana 9-11)**:
- `src/lib/notifications/*` (nuevos).
- `supabase/functions/send-push-notification/index.ts` (trigger booking.new).
- WhatsApp templates (config Meta + edge fn).

---

## APÉNDICE C — Tipos TypeScript centrales

Ver §24 arriba. Recap de tipos core:

```typescript
type BookingKind, BookingStatus, ActorRole, ConfirmationMode, PaymentStatus

interface Booking, BookingWithRelations, BookingEvent
interface AvailabilityRule, AvailabilityException, ComputedSlot
interface ProviderService
interface CreateBookingInput, CancelBookingInput, RescheduleBookingInput, GetAvailableSlotsInput
interface BookingCardViewModel
type BookingAction
```

Todo vive en `src/lib/booking/types.ts` como single source of truth.

---

## APÉNDICE D — Enums y estados principales

### D.1 Enum `booking_status`

```
pending         → recién creado, esperando confirm
confirmed       → confirmado (auto o manual)
on_the_way      → walker/sitter en ruta (no aplica a vet)
in_progress     → atención en curso
completed       → finalizado OK (terminal)
cancelled       → cancelado antes (terminal)
no_show         → tutor no apareció (terminal)
```

### D.2 Enum `booking_kind`

```
vet        → consulta, vacuna, cirugía
walk       → paseo
dogsitter  → hospedaje
training   → entrenamiento
grooming   → peluquería
```

### D.3 Enum `booking_event_type`

```
created
confirmed
rescheduled
started
completed
cancelled_by_owner
cancelled_by_provider
cancelled_by_system
no_show
reminder_sent_24h
reminder_sent_2h
pre_check_in_sent
review_invitation_sent
commission_calculated
```

### D.4 Estados de `notification_attempt.status`

```
queued     → encolado, aún no enviado
sent       → enviado al canal externo
delivered  → confirmado entrega (si canal soporta)
read       → abierto por usuario
failed     → falló definitivamente
skipped    → saltado (idempotency / opt-out)
```

### D.5 Enum `actor_role`

```
owner
provider
admin
system
```

### D.6 Enum `confirmation_mode` (en service_providers)

```
auto    → se confirma automáticamente al crear
manual  → queda pending hasta que provider confirma
```

### D.7 Enum `payment_status` (hacia futuro cuando haya pago real B2C)

```
pending     → sin cargar
authorized  → autorizado (pre-auth card hold)
captured    → cobrado
refunded    → devuelto
failed      → falló el cargo
```

---

## APÉNDICE E — Pseudocódigo clave

### E.1 Disponibilidad

Ver §25.1 — `rpc_get_available_slots` completo en SQL.

### E.2 Reminders

Ver §25.3 — edge function con check de status actual antes de enviar + idempotency + notify wrapper.

### E.3 Reschedule / cancel

```typescript
// Cancel
async function cancelBooking({ bookingId, reason, actor }) {
  const booking = await getBooking(bookingId);
  assertTransition(booking.status, 'cancelled', actor);
  const grace = computeGraceWindow(booking, actor);
  if (!grace.canCancelFree && !reason) throw new Error('reason_required');
  const { data } = await supabase.rpc('rpc_cancel_booking', { p_booking_id: bookingId, p_reason: reason });
  await Promise.all([
    notify({ category: 'transactional', recipientId: counterpart(booking, actor), event: 'booking.cancelled', bookingId }),
    cancelScheduledReminders(bookingId),
    deleteGoogleCalendarEvent(bookingId),
    analytics.track('booking.cancelled', { actor, within_grace: grace.canCancelFree }),
  ]);
  return data;
}

// Reschedule
async function rescheduleBooking({ bookingId, newScheduledAt, proposedByProvider, proposalNotes }) {
  const booking = await getBooking(bookingId);
  assertTransition(booking.status, 'confirmed', booking.status === 'pending' ? 'owner' : 'owner');
  await assertSlotAvailable(booking.serviceProviderId, booking.serviceId, newScheduledAt);
  const { data } = await supabase.rpc('rpc_reschedule_booking', {
    p_booking_id: bookingId,
    p_new_scheduled_at: newScheduledAt,
    p_proposed_by_provider: proposedByProvider,
  });
  await Promise.all([
    notify({ recipientId: counterpart(booking), event: 'booking.rescheduled', bookingId, payload: { newScheduledAt } }),
    rescheduleReminders(bookingId, newScheduledAt),
    updateGoogleCalendarEvent(bookingId),
    analytics.track('booking.rescheduled', { actor, proposedByProvider }),
  ]);
  return data;
}
```

### E.4 Sincronización calendario / rutina

```typescript
// Adapter factory
function buildCalendarEvents(bookings, reminders, routines, dateRange, tz): CalendarEvent[] {
  return [
    ...bookings.map(b => bookingToCalendarEvent(b, tz)),
    ...reminders.map(reminderToCalendarEvent),
    ...expandRoutinesInRange(routines, dateRange).map(r => routineToCalendarEvent(r)),
  ].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function expandRoutinesInRange(routines, { from, to }): RoutineOccurrence[] {
  const out: RoutineOccurrence[] = [];
  for (const r of routines) {
    if (!r.isActive) continue;
    for (const d of eachDayOfInterval(from, to)) {
      if (!r.daysOfWeek.includes(d.getDay())) continue;
      if (r.startsOn && d < r.startsOn) continue;
      if (r.endsOn && d > r.endsOn) continue;
      out.push({ ...r, occurrenceDate: d });
    }
  }
  return out;
}
```

---

## APÉNDICE F — Eventos analytics del funnel de reserva

### F.1 Eventos (chronological)

```
1.  directory_viewed          {filters, source}
2.  provider_viewed            {provider_id, source}
3.  booking_started            {provider_id, kind, source}
4.  select_service             {provider_id, service_id, price_clp}
5.  select_slot                {provider_id, slot_at, service_id, lead_time_hours}
6.  booking_created            {booking_id, provider_id, kind, price_clp, confirmation_mode}
7.  booking_conflict_shown     {provider_id, alternatives_count}
8.  booking_conflict_resolved  {booking_id, chose_alternative: bool}
9.  booking_confirmed          {booking_id, time_to_confirm_minutes, mode}
10. reminder_sent              {booking_id, type (24h|2h), channel}
11. reminder_tapped            {booking_id, type, channel}
12. booking_cancelled          {booking_id, actor, within_grace: bool, hours_until_appt}
13. booking_rescheduled        {booking_id, actor, proposed_by_provider: bool}
14. booking_no_show            {booking_id, provider_id}
15. booking_started_attention  {booking_id} (in_progress)
16. booking_completed          {booking_id, duration_actual_vs_scheduled_min, revenue_clp}
17. review_invitation_sent     {booking_id}
18. review_created             {booking_id, rating}
19. follow_up_created          {parent_booking_id, offset_days}
20. commission_calculated      {booking_id, amount_clp, rate}
```

### F.2 Properties estándar

Cada evento lleva:
- `user_id` (auto si logueado)
- `session_id`
- `path` (URL normalizada)
- `device` (mobile/desktop/webview)
- `role_active` (owner/provider/shelter/admin)

### F.3 Dashboards mínimos

**Admin**:
- Funnel: views → starts → completed (% conversion por paso).
- Heatmap de slot requests.
- Top vets by bookings.
- Provider performance: confirm rate, cancel rate, no-show rate, avg rating.

**Provider**:
- Personal funnel.
- Utilization rate (% slots booked).
- Revenue por día/servicio.

**Owner** (en `/home`):
- Recurrencia de bookings.
- Prossimas citas.

---

## APÉNDICE G — Backlog ejecutable para Claude Code

> Este apéndice es la lista priorizada de prompts listos para copiar-pegar a Claude Code para ejecutar el plan. Cada bloque está diseñado para ser autosuficiente: contiene objetivo, archivos, criterio de done y dependencias.

### G.1 Sprint 1 (semana 1) — Fase 0

**CC-01** `[P0] Fix TodayAgendaCard query para V2`

```
Contexto: TodayAgendaCard.tsx usa `vet_id = auth.uid()` (legacy) y pierde bookings V2 que llegan vía directorio con service_provider_id.
Objetivo: cambiar la query para usar `service_provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())`.
Archivo: src/components/provider/TodayAgendaCard.tsx:38
Done: provider ve bookings del directorio en "Hoy". Agregar test unitario si hay hook.
```

**CC-02** `[P0] Google Calendar DELETE on cancel`

```
Contexto: al cancelar booking, el evento queda en Google.
Objetivo: llamar google-calendar-sync con action='delete' en el trigger de cancel (o desde rpc_cancel_booking). Manejar 404 si ya no existe en Google (idempotente).
Archivos: supabase/functions/google-calendar-sync/index.ts + supabase/migrations/XXX_google_delete_on_cancel.sql (trigger opcional).
Done: cancelar booking desaparece del Google del tutor.
```

**CC-03** `[P0] Sentry captureException en booking mutations`

```
Contexto: errores no-conflict se pierden en un toast sin reportarse.
Objetivo: en useBookingMutations.ts:111-116, agregar Sentry.captureException(err) salvo que sea BookingConflictError.
Archivo: src/hooks/useBookingMutations.ts
Done: errores aparecen en Sentry con tags {op: 'booking_mutation', action: 'create|cancel|...'}.
```

**CC-04** `[P0] Feature flags nuevos`

```
Archivo: src/lib/featureFlags.ts
Agregar:
  BOOKING_V3_WIZARD: false,
  PROVIDER_AGENDA_CALENDAR: false,
  PROVIDER_PUSH: false,
  ICS_EXPORT: false,
Done: flags disponibles en código.
```

**CC-05** `[P0] E2E baseline tutor + provider`

```
Crear:
  e2e/booking-tutor-full.spec.ts  # login tutor → directorio → wizard → confirm → ver en /mis-reservas → cancel
  e2e/booking-provider-full.spec.ts  # login provider → inbox pending → confirm → start → complete
Usar fixtures estables (seed SQL).
Done: tests pasan localmente y en CI.
```

**CC-06** `[P0] Copy "My Paws" → "Mis Mascotas"`

```
Archivo: src/components/BottomTabBar.tsx:69
Cambiar label y buscar referencias en toda la app (grep "My Paws").
Done: 0 ocurrencias de "My Paws" en src/.
```

### G.2 Sprint 2-3 (semana 2-3) — Fase 1 UX quick wins

**CC-07** `[P1] PolicyBanner component + integración wizard`

```
Crear: src/components/booking/PolicyBanner.tsx
Props: graceHoursOwner, graceHoursProvider, cancellationCost.
Integrar en BookingFlow step confirm mostrando "Puedes cancelar sin costo hasta [X horas antes]".
Done: wizard muestra política visible antes de confirmar.
```

**CC-08** `[P1] BookingDetailDrawer bottom-sheet en mobile`

```
Archivo: src/components/booking/BookingDetailDrawer.tsx
Usar Sheet side="bottom" si window.innerWidth < 640.
Done: mobile muestra drawer desde abajo, desktop se mantiene right.
```

**CC-09** `[P1] Copy fix toast "Solicitud/Confirmada"`

```
Archivo: src/hooks/useBookingMutations.ts:108-109
Si booking.status === 'confirmed' → toast "Cita confirmada para [fecha]".
Si booking.status === 'pending' → toast "Enviada al veterinario. Te avisaremos cuando confirme.".
Done: copy distingue auto vs manual.
```

**CC-10** `[P1] AvailabilityCalendar dots con count`

```
Archivo: src/components/booking/AvailabilityCalendar.tsx:57-66
Mostrar tooltip "N horarios" al hover del día.
Done: tutor ve cantidad de slots por día.
```

**CC-11** `[P1] UnifiedCalendar CTA agendar`

```
Archivo: src/pages/UnifiedCalendar.tsx
En días sin eventos (UnifiedDayView), agregar CTA "Agendar algo" que abre modal con selector (consulta/paseo/etc) → redirige al directorio filtrado.
Done: tutor puede iniciar reserva desde calendario.
```

**CC-12** `[P1] Analytics eventos nuevos`

```
Archivo: src/lib/analytics.ts
Agregar al EVENTS const:
  SELECT_SERVICE = 'select_service'
  SELECT_SLOT = 'select_slot'
  BOOKING_CONFLICT_SHOWN = 'booking_conflict_shown'
  BOOKING_CONFLICT_RESOLVED = 'booking_conflict_resolved'
  BOOKING_CANCELLED = 'booking_cancelled'
  BOOKING_RESCHEDULED = 'booking_rescheduled'
  BOOKING_NO_SHOW = 'booking_no_show'
  REMINDER_TAPPED = 'reminder_tapped'
Disparar en los puntos correspondientes de BookingFlow, useBookingMutations, etc.
Done: eventos visibles en PostHog.
```

### G.3 Sprint 4-5 (semana 3-5) — Fase 2 Backend

**CC-13** `[P0] Migration v_all_bookings vista`

```
Crear: supabase/migrations/XXX_v_all_bookings.sql
UNION ALL de vet/walk/training/dogsitter + legacy bookings con columnas normalizadas.
Añadir columnas calculadas: kind, scheduled_at (TIMESTAMPTZ), duration_minutes.
RLS: misma lógica que tablas subyacentes.
Done: SELECT * FROM v_all_bookings devuelve todos los bookings del usuario.
```

**CC-14** `[P0] Migration service_providers.timezone`

```
Crear: supabase/migrations/XXX_service_providers_tz.sql
ALTER TABLE service_providers ADD COLUMN timezone TEXT NOT NULL DEFAULT 'America/Santiago';
Done: columna existe con default.
```

**CC-15** `[P0] Migration provider_services catálogo`

```
Crear tabla provider_services (ver §12.3).
Backfill: por cada service_provider existente, insertar service default "consulta_general".
Done: catálogo habitable, backfill ejecutado.
```

**CC-16** `[P0] Migration rules.min_lead_time + max_advance`

```
ALTER TABLE provider_availability_rules
  ADD COLUMN min_lead_time_minutes INTEGER DEFAULT 60,
  ADD COLUMN max_advance_days INTEGER DEFAULT 90;
Done.
```

**CC-17** `[P0] RPC rpc_get_available_slots`

```
Crear: supabase/migrations/XXX_rpc_get_available_slots.sql
Implementar función según §25.1.
Testear: dado un provider con rules conocidos, los slots devueltos son los esperados.
Done: RPC accesible desde frontend, resultado coincide con cálculo client actual.
```

**CC-18** `[P0] RPC rpc_create_booking`

```
Crear: supabase/migrations/XXX_rpc_create_booking.sql
Según §25.2. Valida pets ownership, slot disponible, crea booking con status según confirmation_mode, trigger audit.
Done: crear booking vía RPC funciona; caso slot ocupado lanza error con CODE 23505.
```

**CC-19** `[P0] RPCs rpc_cancel_booking + rpc_reschedule_booking`

```
Similares a create, con validación de transición de estado + side-effects enteros en BD.
Done: transiciones server-authoritative.
```

**CC-20** `[P0] Refactor useAvailableSlots wraps RPC`

```
Archivo: src/hooks/useAvailableSlots.ts
Reemplazar queries cliente por llamada RPC.
Mantener shape de ComputedSlot[].
Done: UI idéntica, backend autoritativo.
```

### G.4 Sprint 6-7 (semana 5-7) — Fase 3 UX tutor

**CC-21** `[P0] BookingWizardV3 scaffolding`

```
Crear: src/components/booking/BookingWizardV3.tsx
3 pasos: service+slot → details → confirm.
Auto-select pet si solo 1.
Auto-select service si solo 1.
Integrar PolicyBanner, precio visible, tz hint.
Feature flag BOOKING_V3_WIZARD.
Done: wizard funcional en perfil público con flag on.
```

**CC-22** `[P0] Rediseño /mis-reservas sin tab "Buscar"`

```
Archivo: src/pages/MyBookings.tsx
Quitar tab "Buscar disponibilidad".
Vista única: lista con filtros (estado, tipo, fecha, mascota).
Empty state: CTA grande "Agenda tu primera cita" → abre selector de servicio → directorio filtrado.
Done: una sola vista, empty state lleva a crear.
```

**CC-23** `[P0] Deprecar BookingModal V1 + eliminar EnhancedBookingDialog`

```
Verificar que BookingModal ya no se usa (grep imports).
Eliminar EnhancedBookingDialog y sus referencias.
En ServiceDirectory.tsx, reemplazar por BookingWizardV3.
Done: git diff muestra solo 1 path de booking creation.
```

**CC-24** `[P0] BookingSuccessScreen`

```
Crear: src/components/booking/BookingSuccessScreen.tsx
Muestra resumen post-confirmación + CTAs "Ver calendario" / "Volver al perfil" / "Cerrar".
Integrado en BookingWizardV3 como step final.
Done: post-confirm no hay redirect abrupto.
```

### G.5 Sprint 8-9 (semana 7-9) — Fase 4 UX provider

**CC-25** `[P0] Ruta /provider/agenda + ProviderAgendaCalendar skeleton`

```
Crear: src/pages/provider/ProviderAgenda.tsx + src/components/provider/ProviderAgendaCalendar.tsx
Vistas: día, semana, mes (toggle).
Grilla horaria con bookings renderizados.
Drag-and-drop (react-big-calendar o similar).
Feature flag PROVIDER_AGENDA_CALENDAR.
Done: provider ve semana visual con flag on.
```

**CC-26** `[P0] RescheduleFromInboxDialog`

```
Crear: src/components/booking/RescheduleFromInboxDialog.tsx
Provider selecciona 2-3 slots alternativos.
Calls rpc_reschedule_booking_propose.
Owner recibe notify + botones accept/reject en drawer.
Done: provider puede proponer, owner decide.
```

**CC-27** `[P1] Push FCM booking.new to provider`

```
Feature flag PROVIDER_PUSH=true.
Edge fn: trigger en booking INSERT que llama send-push-notification al provider.
Idempotent (ya hay notification_attempts).
Done: provider recibe push al crear booking.
```

**CC-28** `[P1] AvailabilityOnboardingWizard`

```
Crear: src/components/provider/AvailabilityOnboardingWizard.tsx
Preguntas: horario típico, duración consulta, fines de semana, urgencias.
Genera rules automáticas.
Muestra solo si provider no tiene rules.
Done: nuevo vet setea agenda en <2 min.
```

**CC-29** `[P1] PatientBriefing en BookingDetailDrawer`

```
Crear: src/components/provider/PatientBriefing.tsx
Muestra: última consulta + alergias + vacunas pendientes + peso.
Integrar como sección del drawer si activeRole=provider.
Done: vet ve resumen sin salir del drawer.
```

### G.6 Sprint 10-11 (semana 9-11) — Fase 5 Integraciones

**CC-30** `[P1] notify() service layer`

```
Crear: src/lib/notifications/notify.ts + channels/{push,email,whatsapp,in-app}.ts
Consulta user_notification_prefs, chequea idempotency, despacha, registra attempt.
Reemplazar llamadas directas en side effects de booking.
Done: todos los envíos pasan por notify().
```

**CC-31** `[P2] Auto-cancel cron pending >24h`

```
Crear edge fn: supabase/functions/booking-auto-cancel-cron/index.ts
Schedule: cada 1h.
Cancela bookings con status='pending' AND created_at < now - 24h.
Done: pending no confirmado se limpia.
```

**CC-32** `[P2] ICS export`

```
Crear util: src/lib/calendar/ics.ts que genera .ics de bookings.
Botón "Descargar calendario (.ics)" en /mis-reservas.
Done: archivo válido para Apple/Outlook.
```

**CC-33** `[P2] Export CSV provider bookings`

```
Crear util + botón en /provider/agenda y /provider/pacientes.
Done: CSV válido con encoding UTF-8 BOM.
```

**CC-34** `[P2] Admin dashboard booking funnel`

```
Crear: src/components/admin/AdminBookings.tsx
Sección "Bookings" en /admin.
Widgets: funnel, heatmap, top vets, alertas.
Done: admin ve salud del dominio.
```

### G.7 Reglas operativas para ejecutar con Claude Code

1. **Un ticket = un commit** (o PR) con mensaje tipo `feat(booking): CC-XX descripción`.
2. **Antes de cada ticket**: correr E2E baseline. Si falla, arreglar antes.
3. **Después de cada migración**: `npx tsc -b && npm run test:ci && npm run build` y validar que pasa.
4. **Feature flags**: activar en staging primero, 1 día de observación, luego prod gradual.
5. **Rollback**: cada migración con documentación DOWN en comentario.
6. **Actualizar docs vivos** (§9.6 CLAUDE.md): diagramas + MAPA_FUNCIONAL si toca rutas/flujos.
7. **No saltarse hooks** (--no-verify) salvo autorización explícita de Pedro.
8. **Sentry tag** cada deploy para aislar regresiones por sprint.

---

## Notas finales de coherencia

Este plan conecta:
- **Tutor + Oferente + Veterinario**: mismo dominio unificado, mismas entidades, distintas UIs contextuales.
- **Booking + Calendario + Rutinas + Notificaciones + Fichas**: `CalendarEvent` como adapter común; `notify()` único servicio; FK inverso `booking_id` en `vet_clinical_notes` con UI de ida y vuelta.
- **Backend + Frontend**: RPCs server-authoritative + hooks que wraps + feature flags para rollout.
- **Mobile + Desktop + WebView**: bottom sheets + safe areas + deep links + push.
- **Hoy + Futuro**: vista `v_all_bookings` minimiza cambios ahora, tabla única `bookings_v3` como aspiración 6-12 meses.

**Ejecutar el plan en orden de fases minimiza el riesgo y maximiza el aprendizaje por sprint.**

Si algo aquí parece inconsistente con el estado real del repo tras cambios recientes, re-auditar con los 5 agentes (backend / tutor / provider / calendar-reminders / transversal) antes de implementar el ticket correspondiente.
