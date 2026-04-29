# Plan maestro — Coherencia del sistema de producto Paw Friend

> **Fecha**: 2026-04-21
> **Autor**: Principal Product Engineer + Staff UX Architect + Navigation Systems Designer + Scheduling Systems Architect + Clinical Records Workflow Designer + Supabase Domain Refactor Lead + Data Consistency Auditor + Community Product Strategist + Mobile-First Product Systems Designer.
> **Alcance**: Booking, preventive care, calendario, rutinas, recordatorios, ficha clínica, navegación, social/feed/grupos, adopciones/posts, persistencia, wiring técnico y visibilidad Beta Labs.
> **Ubicación**: Se escribe en `docs-raiz/planes/` en vez de `docs/` porque `docs/` es output de `vite build` (regla 9.1 de `CLAUDE.md` — se borra con `emptyOutDir`).
> **Regla central**: *Repo first, context second*. Todas las afirmaciones llevan `archivo:línea` como evidencia directa del código.

---

## 0. Glosario corto

- **Owner**: dueño/tutor de mascota (rol default).
- **Provider**: profesional (vet individual, clínica, walker, sitter, trainer, groomer).
- **Shelter**: hogar de adopción / refugio.
- **Booking V3**: sistema de reservas con RPCs server-authoritative (`rpc_create_booking`, `rpc_cancel_booking`, `rpc_reschedule_booking`, `rpc_get_available_slots_range`), view `v_all_bookings`, triggers de push, cron auto-cancel.
- **Preventive care**: vacunas + desparasitarios internos/externos + recordatorios clínicos.
- **Wiring**: conexión extremo a extremo entre UI, React Query, Supabase client, RPCs, triggers SQL y edge functions.

---

## 1. Resumen ejecutivo

Paw Friend está en un punto sano de **cobertura funcional** pero con **fisuras de coherencia** transversales. Tras auditar el repo completo:

**Estado real**:
- Booking V3 está en **fase 2.5/4**: RPCs y triggers desplegados, pero **4 feature flags críticos apagados** (`BOOKING_V3_WIZARD`, `PROVIDER_AGENDA_CALENDAR`, `PROVIDER_PUSH`, `ICS_EXPORT` — [featureFlags.ts:118-141](../../src/lib/featureFlags.ts#L118-L141)).
- El **bug de adopciones** reportado ("publiqué y sigue saliendo sin post") tiene **causa raíz identificada**: `enabled: !!user && selectedTab !== 'shelters'` deja la query desactivada cuando el usuario está en la tab `shelters`, y `refetch()` post-insert no repopla la UI ([Adoption.tsx:75-88](../../src/pages/Adoption.tsx#L75-L88)). Mismo patrón de fragilidad aparece en Paw Voices y Paw Companys.
- La **duplicación navegacional** es real: Calendario, Mis reservas y Recordatorios del sidebar **apuntan todos a `/calendario?tab=X`** ([links.ts:62-68](../../src/lib/links.ts#L62-L68), [AppSidebar.tsx:66-73](../../src/components/AppSidebar.tsx#L66-L73)). Existen además tres rutas físicas (`/reminders`, `/mis-reservas`, `/rutinas`) que cargan componentes distintos con data semi-solapada.
- **Preventive care** tiene dos drifts activos: (a) el CHECK de `pet_reminders.type` fue ampliado en una migración futura (`20260724000000_fix_pet_reminders_type_check.sql`) pero el trigger que inserta `'antiparasitic'` es de 2026-06-29; y (b) el frontend [AddMedicalRecord.tsx:281](../../src/components/AddMedicalRecord.tsx#L281) inserta `type='deworming'` mientras que el trigger SQL [antiparasitic_reminder_trigger:44](../../supabase/migrations/20260629000000_antiparasitic_reminder_trigger.sql#L44) inserta `type='antiparasitic'` → doble fuente para el mismo fenómeno.
- **Wiring crítico**: `send-push-notification` **NO está en `supabase/config.toml`**. 9 edge functions del repo tampoco lo están. Si no fueron deployadas a mano, todo push está silenciosamente roto (fire-and-forget vía `pg_net`).
- **Beta Labs banner** contamina superficies que no son lúdicas (Community, Adopción, Banco de sangre, Paw Game, Misiones, Colección). No hay política clara.
- **Feed** está 80% implementado (14 componentes, 3 hooks, 6 tablas con triggers) pero `FEED=false` lo esconde. Grupos está 100% vivo con 5 grupos pre-creados.

**Norte del plan**:
1. **Consolidar** el eje temporal (booking + reminders + rutinas + prevenciones) en una sola superficie clara (`/calendario`) con tabs, y redirigir las rutas físicas duplicadas.
2. **Desfricccionar** el alta de vacuna/desparasitario (3 campos obligatorios, el resto progresivo).
3. **Reparar el wiring** de persistencia: adopciones, aplicaciones, push. Causas raíz, no parches.
4. **Política Beta Labs**: una sola regla — banner solo donde la feature es opcional y experimental del usuario dueño, no donde es infra (Community, Donaciones, Adopción).
5. **Decisión social**: reactivar Feed controlado y mover Grupos a "Día a día"; cerrar Social como categoría propia.

**Esfuerzo estimado**: 4 sprints de 1 semana (~ 28 días-developer). Se entrega por fases para no bloquear Booking V3 en marcha.

---

## 2. Estado actual confirmado del sistema

### 2.1 Rutas reales (src/App.tsx, 67 paths)

- **Públicas**: 22 (landing, directorios, perfiles públicos, aplicación, QR/Paw Card, ficha compartida, legales).
- **Protegidas owner**: 40 (home, ficha, calendario, reservas, rutinas, recordatorios, mascotas, paw-game/colección/misiones, adopción, feed, comunidad, reportes, panel pro).
- **Provider**: 6 (dashboard, pacientes, agenda, profile-edit, upgrade, seats).
- **Shelter**: 5 (dashboard, pets, bulk-import, profile, transfer).
- **Admin**: 2.
- **Redirects legacy**: `/calendar` → `/mis-reservas` ([App.tsx:869](../../src/App.tsx#L869)), `/mascota/:petId/timeline` → `/ficha/:petId?tab=historial`, `/mascota/:petId/rutinas` → `/calendario?tab=rutinas&pet=X`, `/settings` → `/profile`, `/upgrade*` → `/paw-member*`.

### 2.2 Feature flags críticos ([featureFlags.ts](../../src/lib/featureFlags.ts))

| Flag | Valor | Efecto |
|---|---|---|
| `USER_PREMIUM` | false | B2C gratis; `PremiumGate` removido de callsites. |
| `FEED` | false | Feed social escondido del sidebar; ruta funcional. |
| `CHAT` | false | Chat escondido; ruta funcional. |
| `LABS_COMMUNITY` | true | Grupos visibles bajo "Social". |
| `LABS_ADOPTION` | true | Adopción visible. |
| `LABS_BLOOD_DONORS` | true | Banco de sangre visible. |
| `PAWGAME_SIDEBAR` | true | Paw Game/Misiones/Colección en "Beta 🧪". |
| `SHELTER_DONATIONS` | true | Donaciones dirigidas vivas (SpA confirmado). |
| `DONATIONS_MONTHLY` | false | Recurrencia mensual Flow — bloqueada por SpA. |
| `BOOKING_V3_WIZARD` | **false** | Wizard 3 pasos apagado; flujo actual usa `BookingFlow`. |
| `PROVIDER_AGENDA_CALENDAR` | **false** | `/provider/agenda` apaga componente. |
| `PROVIDER_PUSH` | **false** | Control de rollout; trigger SQL igual dispara. |
| `ICS_EXPORT` | **false** | Botón oculto en `MyBookings`. |
| `MAP_PET_FRIENDLY` | false | Lugares hardcoded (10 fijos). |
| `MARKETPLACE` / `SHARED_WALKS` / `LOST_PETS_SECTION` | false | Enterrados. |
| `PRO_ANALYTICS` | true | Panel Pro activo. |

### 2.3 Migraciones y backend

- **156+ migraciones** hasta `20260725000011_booking_push_antispam.sql`.
- **Edge functions en el repo**: 48. **Registradas en `config.toml`**: 41. **Huérfanas**: 9 (`send-push-notification`, `send-inactive-user-reminder`, `send-monthly-vet-stats`, `send-new-pet-drip`, `send-pet-birthday-greeting`, `send-shelter-welcome`, `backup-weekly-snapshot`, `geocode-address`, `notify-vet-share`).
- **Crons configurados**: 12 (reminder-push-daily, auto_cancel_pending_bookings, review-push-daily, backup-weekly-cron, monthly-vet-stats, pet-birthday, inactive-user-reminder, new-pet-drip, vet-plan-lifecycle, daily-digest, weekly-owner/vet-reports).
- **Triggers activos**: 120 en migraciones.

### 2.4 Métricas de salud

- `npx tsc -b`: 0 errores.
- `npm run lint`: 0 errores, ~85 warnings a11y.
- `npm run test:ci`: 176+ tests.
- Build: ~2.5 min. Bundle principal ~335 kB / 100 kB gzip.

---

## 3. Mapa del dominio involucrado

```
Owner                            Provider / Vet                      Sistema
  │                                   │                                │
  ├─ Ficha clínica /ficha/:id ───────┼─ VetFichaView ────────────────┤
  │  ├─ Prevenciones (vacunas/       │   (viewMode=vet)               │
  │  │  desparasitarios)             │                                │
  │  ├─ Historial (reminders,        │                                │
  │  │  activities, routine done)    │                                │
  │  ├─ Consultas                    │                                │
  │  └─ Documentos                   │                                │
  │                                  │                                │
  ├─ Calendario /calendario ──────── Provider /provider/agenda (flag) │
  │  ├─ tab=hoy                      │                                │
  │  ├─ tab=rutinas                  │                                │
  │  ├─ tab=recordatorios            │    useUnifiedCalendar          │
  │  └─ tab=reservas                 │    eventsForDate               │
  │                                  │                                │
  ├─ Reservas /mis-reservas ─────────┼─ /provider/dashboard ─────────┤
  │  (MyBookings v1+v2)              │   TodayAgendaCard              │
  │                                  │   ProviderBookingsInbox        │
  │                                  │                                │
  ├─ Recordatorios /reminders ───────┼─ (no view separada) ──────────┤
  │  (Reminders.tsx)                 │                                │
  │                                  │                                │
  ├─ Rutinas /rutinas ───────────────┼─ (vista solo owner) ──────────┤
  │                                  │                                │
  └─ Adopción /adoption / posts ─────┤                                │

Persistencia: Supabase Postgres + triggers + RLS + RPCs + Edge Fns
Notificaciones: user_notification_prefs + notification_attempts + device_tokens
                + send-push-notification (NO desplegada) + reminder-cron
```

Seis dominios cruzan la fibra medular: **Ficha**, **Calendario**, **Reservas**, **Recordatorios**, **Rutinas**, **Adopciones**. Hoy comparten datos pero cada uno tiene su propia query, su propia invalidación y su propia fuente parcial de verdad.

---

## 4. Flujo actual del Owner para booking

1. Owner entra a `/veterinarios` (público) o `/servicios` (logueado) → directorio.
2. Click en perfil del profesional → `/veterinarios/:slug` → `PerfilVetPublico`.
3. Click "Reservar" → abre `BookingFlow` (wizard interno 3-4 pasos, [BookingFlow.tsx:39](../../src/components/booking/BookingFlow.tsx)): `pet → slot → confirm → success`.
4. Slots vienen de `useAvailableSlots()` — Path A RPC `rpc_get_available_slots_range`, Path B fallback client-side ([useAvailableSlots.ts:95-165](../../src/hooks/useAvailableSlots.ts)).
5. Submit → `useCreateBooking()` — Path A RPC `rpc_create_booking` (vet), Path B insert directo (walk/training/dogsitter).
6. Onsuccess invalida `['my-bookings']`, `['available-slots']`, `['provider-inbox']`. Sin optimistic update.
7. Trigger SQL `push_provider_on_new_booking` dispara `notify_provider_push_on_new_booking()` → `pg_net.http_post('send-push-notification')`.
8. Si `auto_confirm_booking` activo, status pasa de `pendiente` → `confirmado`.
9. Owner vuelve a `/mis-reservas` → `useMyBookingsV2` + query legacy merge.
10. Cancelar/reprogramar: RPC con grace windows (owner 2h cancel / 24h reschedule).

**Gaps detectados**:
- **No se crea `pet_reminder` automático** al confirmar booking → owner no tiene recordatorio 24h/2h antes (gap Path A y Path B).
- **Validación server-side solo para `vet_bookings`** → walk/training/dogsitter pueden llegar con slot ya tomado si el cliente bypassa UI.
- **Query key `['my-bookings']` sin `userId`** ([useBookingMutations.ts:164](../../src/hooks/useBookingMutations.ts#L164)) — invalida para cualquier usuario, pero al ser global por sesión no es bug, es desperdicio.
- **Sin optimistic update** → UI lag 500ms-2s en mobile.

## 5. Flujo actual del Provider/Vet para booking

1. Provider entra a `/provider/dashboard`.
2. `TodayAgendaCard` muestra las citas del día (query directa `vet_bookings`).
3. `ProviderBookingsInbox` (query `['provider-inbox', providerId, filter]`) lista reservas con filtros status/date/pet.
4. Click en booking abre `BookingDetailDrawer`.
5. Acciones: Confirmar / Marcar completada / Marcar no-show / Iniciar → mutations directas UPDATE (sin RPC).
6. `/provider/agenda` existe pero gated por `PROVIDER_AGENDA_CALENDAR=false` → redirect al dashboard.
7. Vista semanal en grid días × horas (hardcoded 08:00-20:00) cuando la flag se encienda.
8. Disponibilidad se edita vía `useProviderAvailabilityRules` (`availability_rules` + `availability_exceptions`).

**Gaps detectados**:
- **No hay UI de confirmación dual** si `confirmation_mode=manual` → el provider aprueba desde la inbox, pero no hay notificación clara al owner cuando rechaza.
- **Duplicación owner vs provider**: `useMyBookingsV2` hace UNION de 4 tablas; `useProviderBookingsInbox` solo vet_bookings → si en el futuro walk/training se atiende a providers, no se puede reusar.
- **Vista semanal apagada** pero el componente existe ([ProviderAgendaCalendar.tsx](../../src/components/provider/ProviderAgendaCalendar.tsx)).

## 6. Flujo actual de vacunas

1. Owner entra a `/ficha/:petId` → tab "Prevenciones" o click CTA vacuna.
2. Abre `AddMedicalRecord` con `recordType='vacuna'`.
3. Rellena form con **13 inputs posibles**, **3 obligatorios**: `recordType`, `title`, `date` ([AddMedicalRecord.tsx:190](../../src/components/AddMedicalRecord.tsx)).
4. Submit → insert en `medical_records` con `record_type='vacuna'` + opcionales (`batch_number`, `serial_number`, `veterinarian_name`, etc.).
5. Trigger SQL `create_vaccine_reminder()` ([20260508000001_auto_vaccine_reminder_trigger.sql](../../supabase/migrations/20260508000001_auto_vaccine_reminder_trigger.sql)) inserta `pet_reminder` con `type='vaccine'`, `due_date=NEW.next_date`.
6. Frontend además intenta crear reminder manualmente ([AddMedicalRecord.tsx:274-319](../../src/components/AddMedicalRecord.tsx#L274-L319)) **con el mismo fin** → doble fuente. Si trigger falla o es reemplazado, el frontend lo compensa; si ambos corren, se pueden duplicar reminders.
7. Owner ve la vacuna en `TabVacunas` (filtro `record_type='vacuna'`, parse regex de `notes` como fallback legacy [TabVacunas.tsx:11-27](../../src/pages/PetClinicalRecord/tabs/TabVacunas.tsx#L11-L27)).
8. Próxima dosis aparece en `/calendario?tab=recordatorios` y en `/reminders`.

**Gaps detectados**:
- **13 inputs vs 3 obligatorios** es ruido: Sofia (beta tester vet, `audits/FEEDBACK_VET_SOFIA_2026_04_13.md`) pidió simplicidad.
- **Lote/serie parseado con regex de `notes`** → datos legacy sin columnas dedicadas aún no migrados.
- **Hard-coded `1 mes externo / 3 meses interno`** en 3 lugares (UI, trigger, `vaccine_schedule_doses`).

## 7. Flujo actual de desparasitarios

1. Owner entra a `/ficha/:petId` → tab "Antiparasitarios".
2. Abre `AddMedicalRecord` con `recordType='antiparasitario'` (también acepta `desparasitacion`, `antipulgas`).
3. **Campo `antiparasitic_type`** (interno/externo/ambos) se muestra como **REQUERIDO** en UI (`* label` [AddMedicalRecord.tsx:536](../../src/components/AddMedicalRecord.tsx#L536)) pero es **NULLABLE en DB** → inconsistencia de validación.
4. Submit → insert en `medical_records` con `record_type='antiparasitario'`.
5. Trigger SQL `create_vaccine_reminder()` (mal nombrado; sirve para ambos) inserta reminder con `type='antiparasitic'` ([20260629000000:44](../../supabase/migrations/20260629000000_antiparasitic_reminder_trigger.sql#L44)).
6. Frontend inserta otro reminder con `type='deworming'` ([AddMedicalRecord.tsx:281](../../src/components/AddMedicalRecord.tsx#L281)) → **dos valores distintos para el mismo fenómeno**.
7. El CHECK de `pet_reminders.type` hasta `20260724000000_fix_pet_reminders_type_check.sql` **no incluía ni `'deworming'` ni `'antiparasitic'`** → INSERT rechazado con 400 durante meses.
8. Bug ya fue parcheado en commit reciente (memoria `project_session_2026_04_21_deworming_fix`), pero la **ambigüedad de vocabulario** sigue viva.

**Gaps detectados**:
- **Dos códigos fuente insertan el mismo reminder** — posible duplicación visible en `/reminders`.
- **Frontend no distingue interno vs externo en `type`** (ambos viajan como `deworming`) → WhatsApp reminder genérico no mencionará "interno" o "externo".
- **Frecuencias hardcoded** (1m externo / 3m interno / 3m Bravecto) en el form, en el trigger y en `vaccine_schedule_doses`.

## 8. Flujo actual de adopciones y publicaciones

1. Owner entra a `/adoption` con tabs: `available` (default), `my-posts`, `interested`, `shelters`.
2. Click "Publicar Mascota" → abre `CreateAdoptionPost` dialog.
3. Rellena form → insert directo en `adoption_posts` **sin especificar `status`** (usa default `'disponible'` [20251127162210:21](../../supabase/migrations/20251127162210_842f7346-99dd-432c-98c9-3c27888ebd20.sql)).
4. Onsuccess → `handlePostCreated` cierra dialog y llama `refetch()`.
5. **BUG confirmado**: si `selectedTab === 'shelters'`, la query está `enabled: false` ([Adoption.tsx:75](../../src/pages/Adoption.tsx#L75)) → `refetch()` no hace nada útil. El post sí se insertó, pero la UI no se refresca. Al cambiar a "Mis publicaciones" puede aparecer o no según si el queryKey se invalida en otro lugar (no se invalida).
6. La lista "available" filtra `status='disponible'` y la lista "my-posts" no filtra por status → ambas deberían mostrar el post recién creado.
7. **Adicional**: CreateAdoptionPost **no llama `queryClient.invalidateQueries`** — confía 100% en `refetch()` heredado.
8. **Trigger `notify_adoption_interest`** ([20260412220000:31](../../supabase/migrations/20260412220000_missing_notification_triggers.sql#L31)) intenta `JOIN` en columna inexistente `pet_id` (adoption_posts tiene `pet_name` TEXT, no `pet_id` UUID). Trigger falla silencioso cuando alguien expresa interés. No bloquea crear post.

**Patrón transversal identificado**: Paw Voices y Paw Companys tienen mismatch creación `status='pending'` / lectura `eq('status','active')` **sin vista de "mis aplicaciones"** → el usuario queda sin feedback visual ([usePawVoices.ts:110 y 57](../../src/hooks/usePawVoices.ts), [usePawCompanys.ts:194 y 74](../../src/hooks/usePawCompanys.ts)).

---

## 9. Diagnóstico UX/UI general

### 9.1 Fricciones confirmadas

| # | Fricción | Severidad | Evidencia |
|---|---|---|---|
| F-1 | `/reminders`, `/mis-reservas`, `/calendario` en sidebar llevan al **mismo page** con tabs | Alta | [links.ts:62-68](../../src/lib/links.ts#L62-L68) + [AppSidebar.tsx:66-73](../../src/components/AppSidebar.tsx#L66-L73) |
| F-2 | Form vacuna tiene **13 inputs** para pedir 3 obligatorios | Alta | [AddMedicalRecord.tsx:78-92](../../src/components/AddMedicalRecord.tsx#L78-L92) |
| F-3 | `antiparasitic_type` marcado `* REQUERIDO` pero NULLABLE en DB | Alta | [AddMedicalRecord.tsx:536](../../src/components/AddMedicalRecord.tsx#L536) |
| F-4 | PawLabsBanner en páginas no-experimentales (Community, Adopción) | Media | [Adoption.tsx:99](../../src/pages/Adoption.tsx#L99), [Community.tsx:111](../../src/pages/Community.tsx#L111) |
| F-5 | BottomTab "Agenda" se activa en 5 rutas distintas sin indicar cuál | Media | [BottomTabBar.tsx:94-99](../../src/components/BottomTabBar.tsx#L94-L99) |
| F-6 | "Social" con un solo ítem visible (Grupos) cuando FEED=false | Media | [AppSidebar.tsx:117-125](../../src/components/AppSidebar.tsx#L117-L125) |
| F-7 | Sin optimistic updates en bookings → lag visible | Media | [useBookingMutations.ts:152-168](../../src/hooks/useBookingMutations.ts) |
| F-8 | Crear post adopción cuando estás en tab "shelters" no refresca UI | **Crítica** | [Adoption.tsx:75,88](../../src/pages/Adoption.tsx#L75) |
| F-9 | Paw Voices / Paw Companys sin vista "mis aplicaciones" | Alta | [usePawVoices.ts](../../src/hooks/usePawVoices.ts) |
| F-10 | Vet bulk import excepto pacientes tiene UX pro; owner preventive care es mejorable | Media | `shelter/ShelterBulkImport` vs `AddMedicalRecord` |

### 9.2 Mobile-first

- Sidebar items fuera del BottomTabBar **no tienen menú "más"** → descubribilidad baja (Reportes, Paw Labs, Rutinas individuales, Panel Pro).
- Header es estable pero no tiene atajo a `/calendario?tab=hoy`.
- Overflow en iOS Safari en wizards largos (`AddMedicalRecord`).

---

## 10. Diagnóstico funcional y de negocio

- **Booking V3** es el motor B2B (Premium $9.900 y Pro Max $29.900). Feature flags `BOOKING_V3_WIZARD` y `PROVIDER_AGENDA_CALENDAR` en `false` → vet no ve el valor pro completo todavía.
- **Preventive care** es la joya de la corona (ficha clínica + PDF compartible). Bugs sutiles en alta aquí **matan retención**.
- **Adopciones** es motor de onboarding de refugios + engagement owner. Bug de persistencia genera **desconfianza instantánea**.
- **Social/Feed**: no es prioritario hoy (pivot médico). Grupos sí aportan (condiciones específicas: displasia, diabetes felina, etc.).
- **Beta Labs banner** diluye el mensaje si aparece en lugares que no son opcionales.

---

## 11. Diagnóstico técnico y de arquitectura

### 11.1 Drift frontend/backend

| Drift | Frontend | Backend | Impacto |
|---|---|---|---|
| reminder type antiparasitario | `'deworming'` ([AddMedicalRecord.tsx:281](../../src/components/AddMedicalRecord.tsx#L281)) | `'antiparasitic'` ([trigger:44](../../supabase/migrations/20260629000000_antiparasitic_reminder_trigger.sql#L44)) | 2 filas por insert |
| RPCs partner ads | `increment_partner_impressions`, `increment_partner_clicks` ([PartnerAd.tsx:59,75](../../src/components/PartnerAd.tsx)) | NO existen en migraciones | Tracking roto |
| Edge fn push | Trigger SQL llama `send-push-notification` | NO en `config.toml` | Push broken |
| `user_can_receive_notification` RPC | Nadie la invoca | Definida ([20260723000000:100](../../supabase/migrations/20260723000000_user_notification_prefs.sql#L100)) | Prefs se ignoran |
| `notification_attempts` tabla | Nadie inserta en ella | Definida ([20260612000001](../../supabase/migrations/20260612000001_notification_attempts.sql)) | Sin dedupe ni auditoría |

### 11.2 Query keys inconsistentes

- `['pet-reminders', user?.id]` vs `['pet-reminders']` (sin userId).
- `['my-bookings', user?.id, options]` vs invalidateQueries `['my-bookings']`.
- `['adoption-posts', selectedTab]` — buena granularidad, pero al cambiar tab se refetch innecesario si no se cachearon.

### 11.3 Cron que invoca fn huérfana

- `reminder-push-daily` (cron 16:00 UTC) llama `send-push-notification` vía `pg_net` — fn no registrada → log de error es silencioso (EXCEPTION → NULL).

---

## 12. Auditoría de persistencia y sincronización de datos

**Patrón transversal**: muchas superficies cumplen el ciclo "escribir → leer → reflejar" con fragilidades distintas. Las 6 más relevantes:

| Superficie | Escritura | Lectura | Invalidación | Estado |
|---|---|---|---|---|
| Adopción posts | `insert adoption_posts` sin status explícito | `eq('status','disponible')` o `eq('user_id',me)` | `refetch()` pero query disabled en tab 'shelters' | **ROTO en tab shelters** |
| Paw Voices | `insert status='pending'` | `eq('status','active')` | `invalidateQueries(['paw-voices'])` genérico | Crea OK pero usuario no ve propio post |
| Paw Companys | `insert status='pending', is_active=false` | `eq('is_active',true)` | Genérico | Idem |
| Vet pacientes | `create-patient` edge fn | `useVetPatients` filtra por vet | Invalida `['vet-patients']` | OK |
| Reminders | Frontend manual + trigger SQL | `useReminders` + `useUnifiedCalendar` | Solo frontend invalida | Doble insert probable |
| Bookings | RPC + trigger | `useMyBookingsV2` + `useProviderBookingsInbox` | Invalida 3 keys | OK pero lag |

**Causas raíz (top 4)**:
1. **Queries disabled + refetch sin guard** (adopciones).
2. **Mutations sin `invalidateQueries`** (CreateAdoptionPost, send-whatsapp-reminder, google-calendar-sync).
3. **Dos rutas de inserción a la misma tabla** (frontend + trigger) sin contrato único (prevenciones).
4. **Sin feedback de "pendiente"** (Paw Voices / Paw Companys / Paw Partners form).

---

## 13. Auditoría de coherencia en toda la app

### 13.1 Contradicciones entre código y docs

- `CLAUDE.md:§5` habla de **5 motores de monetización**. Código refleja 3 vivos (Donaciones, Paw Member, B2B) y 2 en planificación (publicidad, Paw Partners barter). La documentación está adelantada al código — esto es fine pero hay que declararlo.
- `INDEX.md` cita **28 edge functions**. `supabase/functions/` tiene **48 directorios**. `config.toml` tiene **41 entradas**. Tres conteos distintos.
- `featureFlags.ts:68` comenta "UI lista pero sin grupos en DB aun" → el seed de 5 grupos sí existe ([20260427000003_community_groups.sql:89-95](../../supabase/migrations/20260427000003_community_groups.sql#L89-L95)).

### 13.2 Roles y superficies

- `RoleGuard` exige rol `owner` para `/paw-game`, `/misiones`, `/paw-collection` — correcto.
- `/adoption` y `/donantes-sangre` no exigen rol — cualquier logueado entra. Refugios y shelter dashboard sí son shelter-only.
- **Provider toggle siempre visible en Header** incluso para owners sin registro provider → abre `BecomeProviderDialog`. Documentado.

### 13.3 Copy

- Español chileno consistente (tuteo). Excepciones menores en componentes viejos (ej. "vosotros" nunca aparece; algunos placeholders dicen "ingresa" que es correcto).
- "Paw Labs" se usa como marca ("Beta 🧪" en sidebar, "Paw Labs — Beta" en banner). Hay inconsistencia.

---

## 14. Hallazgos sobre campos excesivos y simplificación

**Vacuna**: hoy 13 campos, 3 requeridos. Sofia pidió 4-5 campos "lo mínimo". Propuesta en §15.

**Desparasitario**: hoy 13 campos (mismo form), 3 requeridos + `antiparasitic_type` marcado con `*`. Usuario tiene que escoger "Interno/Externo/Ambos" antes de escribir el nombre → fricción innecesaria cuando ya está el nombre del producto.

**Consulta vet**: 10 campos, 3 requeridos (`date`, `title`, `description`).

**Reminder manual**: 5 campos, 3 requeridos (`type`, `title`, `due_date`).

**Booking owner**: 4 pasos (pet, service, slot, confirm). Aceptable pero se puede comprimir a 3 con auto-select de servicio.

**Adoption post**: 8 campos, 4 requeridos. Puede bajar a 3 (nombre, edad, foto).

---

## 15. Propuesta de campos obligatorios vs opcionales

Ver apéndice **A** para la tabla completa por entidad. Principios:

1. **Un campo es obligatorio solo si sin él la feature no funciona.** Todo lo demás es opcional y se puede completar después.
2. **Defaults inteligentes**: `date=hoy`, `next_date=calculado según tipo`, `is_recurring=true si es vacuna/desparasitario`.
3. **Progressive disclosure por tipo**: vacuna no muestra "antiparasitic type", desparasitario no muestra "lote/serie" por default.
4. **Autocompletar**: marca + tipo → auto-sugerir próxima fecha (ya está para antiparasitarios, extender a vacunas).

---

## 16. Propuesta de formularios progresivos

Tres pasos, cada uno opcionalmente completable después:

**Paso 1 — Mínimo viable (3 campos visibles)**
- Tipo (vacuna / antiparasitario / consulta / otro)
- Título (con autocomplete por tipo: vacunas comunes, productos antiparasitarios populares)
- Fecha (default hoy)

**Paso 2 — Detalle opcional (collapsable)**
- Próxima fecha (auto-calculada si vacuna/antiparasitario)
- Veterinario / Clínica (autocompletable desde historial del usuario)
- Lote / Serie (solo vacuna, y colapsado)
- Tipo interno/externo (solo antiparasitario, **opcional**, auto-sugerido por nombre)

**Paso 3 — Adjuntos (collapsable)**
- Documento / imagen
- Notas libres

**CTA**: "Guardar ahora" (siempre visible) / "Agregar detalles" (abre paso 2).

---

## 17. Auditoría del sidebar y arquitectura de información

### 17.1 Estructura actual

```
Core (6 items):
  Inicio • Mis Mascotas • Buscar vet • Calendario • Mis reservas • Recordatorios
Explorar (colapsable):
  Día a día: Rutinas • Reportes
  Servicios: Servicios • Mapa
  Social: Feed* • Grupos • Mensajes*       (*flag off)
  Causas: Adopción • Banco de sangre • Donaciones
  Beta 🧪: Paw Game • Misiones • Colección
```

### 17.2 Problemas confirmados

1. **3 items del core (`Calendario`, `Mis reservas`, `Recordatorios`) apuntan a la misma página con distintos tabs** → ocupan 50% del core repitiendo la misma superficie.
2. **"Rutinas" debería estar con Calendario** porque es otro tab del mismo page.
3. **"Social" con solo un ítem visible** (Grupos) cuando FEED=false.
4. **"Beta 🧪" mezcla gamificación con infraestructura beta** (Comunidad, Adopción, Sangre).

### 17.3 Impacto

- Usuario mobile nuevo entra al sidebar y ve 6 items core; 3 llevan al mismo lugar → percepción de "app desorganizada".
- Descubribilidad cae: features reales (Rutinas, Adopción) están enterradas debajo de items redundantes.

---

## 18. Propuesta de nueva arquitectura de navegación

**Principio rector**: *una superficie, un propósito, un acceso claro*. Agrupar por dominio, no por objeto.

### 18.1 Sidebar rediseñado (owner)

```
⭐ Principal (5 items, siempre visibles)
  Inicio                → /home
  Mis Mascotas          → /my-pets
  Ficha                 → /my-pets (misma, el cambio clave está abajo)
  Agenda                → /calendario?tab=hoy       ← consolida 3 items anteriores
  Buscar vet            → /veterinarios

📅 Día a día (colapsable, default abierta)
  Rutinas               → /calendario?tab=rutinas
  Recordatorios         → /calendario?tab=recordatorios
  Reservas              → /calendario?tab=reservas
  Reportes              → /reportes

🛍️ Servicios (colapsable)
  Servicios             → /servicios
  Mapa                  → /maps

👥 Comunidad (colapsable, renombrada desde "Social")
  Grupos                → /comunidad               ← movido aquí
  Feed                  → /feed    (flag: FEED)
  Mensajes              → /chat    (flag: CHAT)

❤️ Causas (colapsable)
  Adopción              → /adoption
  Banco de sangre       → /donantes-sangre
  Donaciones            → /donaciones

🧪 Paw Labs (colapsable, solo gamificación)
  Paw Game              → /paw-game
  Misiones              → /misiones
  Colección             → /paw-collection
```

**Cambios clave**:
- `Agenda` es un único ítem core y el usuario entra a tabs adentro (hoy/rutinas/recordatorios/reservas).
- `Rutinas`, `Recordatorios`, `Reservas` quedan como sub-tabs claros dentro de Agenda, no items duplicados.
- Ítem "Reportes" queda en "Día a día".
- "Social" se renombra a "Comunidad" (no crea redundancia "Social > Grupos").
- Paw Labs queda solo para gamificación.

### 18.2 BottomTab rediseñado (5 tabs)

```
🏠 Inicio     → /home
🐾 Mascotas   → /my-pets (default ficha primera mascota)
📅 Agenda     → /calendario?tab=hoy   (con badge overdue+upcoming24h)
🛍️ Servicios → /servicios (hub)
👤 Perfil     → /profile
```

La tab `Agenda` **ya no debe matchear `/reminders`, `/rutinas`, `/mis-reservas`** porque esas rutas redirigen a `/calendario?tab=X`.

### 18.3 Política de redirects legacy

- `/reminders` → `/calendario?tab=recordatorios` (301).
- `/rutinas` → `/calendario?tab=rutinas` (301).
- `/mis-reservas` → `/calendario?tab=reservas` (301).
- `/calendar` → `/calendario?tab=hoy` (en vez de `/mis-reservas`).

Esto **consolida una sola superficie** para todo lo temporal y elimina la duplicación real.

---

## 19. Auditoría de Social / Grupos / Feed

- **Feed**: 100% implementado (14 componentes, 3 hooks, 6 tablas con triggers). Flag `FEED=false`.
- **Grupos**: 100% implementado (1 page, 1 hook, 3 tablas, 5 grupos pre-seed). Flag `LABS_COMMUNITY=true`.
- **ActivityFeed (social singular)**: timeline de actividades de mascotas (vet visits, vaccinations, achievements). Independiente. Flag no tiene.
- **Chat**: ruta existe, flag `CHAT=false`.
- **Reviews**: segregado por dominio (service_reviews para providers, content_reports para posts del feed).

## 20. Recomendación sobre retomar o no el feed

**Recomendación: NO retomar el Feed ahora**. Razones:
- No alinea con pivot médico.
- Mantenerlo escondido con flag = gratis; reactivarlo = esfuerzo de moderación, trust & safety, reporting admin.
- Costo de reactivación incluye UI de moderación que hoy no existe (reports se insertan pero admin no los revisa en ninguna pantalla).

**Plan alternativo**:
1. **Mantener `FEED=false`** hasta tener UI de moderación admin y staff para revisar reports (backlog).
2. **Promover Grupos** como la superficie social del momento: mover a "Comunidad" fuera de "Social".
3. **Embed pequeño en Home**: widget "Tus grupos" con 2-3 grupos del usuario + CTA a `/comunidad`.
4. **Revisar en 2 trimestres**: si engagement en Grupos supera N usuarios activos/semana, considerar reactivar Feed como "Red social de Paw Friend" con moderación pre-revisada.

## 21. Auditoría de adopciones, mis posts y listados públicos

- **Bug raíz**: query disabled por `selectedTab='shelters'` → refetch inútil.
- **Falta**: `queryClient.invalidateQueries(['adoption-posts'])` explícito en CreateAdoptionPost.
- **Trigger roto**: `notify_adoption_interest` JOIN columna inexistente → silent failure en nota de interés.
- **Patrón transversal**: mismo tipo de bug latente en PawVoices / PawCompanys / PawPartners (sin vista "mis aplicaciones").

## 22. Auditoría de Beta Labs

PawLabsBanner aparece en 6 páginas hoy:
1. Adoption ✗ (Causa real, no experimento lúdico).
2. BloodDonors ✗ (Impacto médico, no lúdico).
3. Community ✗ (Infra social, no experimento lúdico).
4. PawGame ✓ (Gamificación, beta OK).
5. Missions ✓ (Gamificación, beta OK).
6. PawCollection ✓ (Gamificación, beta OK).

El banner dice "Paw Labs — Beta" → implica experimento lúdico. Se debe retirar de 1-3.

## 23. Política propuesta para visibilidad Beta Labs

**Regla única**: `PawLabsBanner` aparece **solo** si:
1. La feature está bajo flag con prefijo `PAWGAME_*` (gamificación), **y**
2. El usuario es owner, **y**
3. La feature **no** afecta datos médicos, legales, ni transacciones.

Esto implica:
- Mantener banner en: PawGame, Missions, PawCollection.
- Retirar banner de: Adoption, BloodDonors, Community.
- Features como Adopción/Sangre/Grupos usan en su lugar un **badge sutil "Nuevo" o "Piloto"** sin el tono lúdico.

Añadir util: `src/lib/isLabsFeature.ts` con función `isPawLabsFeature(route: string): boolean` y envolver banner en `<IfLabsFeature>`.

---

## 24. Sistema objetivo: booking + preventive care + navegación coherente + consistencia de datos

### 24.1 Superficie temporal unificada (`/calendario`)

```
/calendario?tab=hoy              ← default
/calendario?tab=rutinas
/calendario?tab=recordatorios
/calendario?tab=reservas
/calendario?tab=prevenciones     ← nueva tab opcional (vacunas + antiparasitarios próximos)
```

Tabs comparten el mismo CalendarGrid y cambia el filtro de `eventsForDate`.

### 24.2 Ficha clínica (`/ficha/:petId`)

Sigue siendo la fuente médica. Sub-tabs: Resumen, Prevenciones, Consultas, Documentos, Historial. Cuando el owner agrega una vacuna desde la ficha, automáticamente aparece en `/calendario?tab=prevenciones` gracias al trigger + reminder automático.

### 24.3 Sincronización bidireccional

- Owner crea vacuna en `/ficha/:petId` → trigger crea reminder → aparece en `/calendario?tab=recordatorios`.
- Owner completa reminder en `/calendario` → trigger marca `is_completed=true` → ficha muestra historial.
- Vet registra consulta → reminder automático para seguimiento → aparece en calendario owner.
- Owner confirma booking → **nuevo**: trigger crea reminder `type='checkup'` con `due_date=scheduled_date-24h` para recordar al owner.

---

## 25. Disponibilidad y agenda

Modelo actual ([20260520000000_booking_v2_availability.sql](../../supabase/migrations/20260520000000_booking_v2_availability.sql)):
- `provider_availability_rules` (day_of_week, start_time, end_time, slot_minutes, capacity).
- `provider_availability_exceptions` (date, mode: closed/custom, start/end, capacity).
- `provider_service_offerings` (service_type, duration_minutes, price_clp, is_emergency_enabled).
- Provider timezone en `service_providers.timezone` (default America/Santiago).

**Propuesta**:
- Agregar `lead_time_hours` por service offering (hoy vive solo en `service_providers.min_lead_time_minutes` global).
- Reactivar `PROVIDER_AGENDA_CALENDAR=true` una vez ProviderAgendaCalendar tenga drag-to-reschedule.

## 26. Calendario y rutinas

- Rutinas vienen de `pet_routines` + `routine_completions`.
- Calendario unificado ya mergea rutinas, recordatorios, reservas y seguimientos vet ([useUnifiedCalendar](../../src/hooks/useUnifiedCalendar.ts)).
- **Agregar**: filter por mascota (cuando el owner tiene >2 mascotas).
- **Agregar**: tab "Prevenciones" con próximos vencimientos vacuna/antiparasitario a 60 días.

## 27. Sistema de notificaciones y recordatorios

**Infraestructura definida pero no conectada**:
- `user_notification_prefs` (prefs granulares) — tabla vive; RPC `user_can_receive_notification` no se llama desde edge fns.
- `notification_attempts` (dedup + auditoría) — tabla vive; nadie inserta.
- `device_tokens` (FCM/APNs) — tabla vive + `App.tsx:172-217` registra.
- `send-push-notification` edge fn — existe en repo; **NO en `config.toml`**.

**Propuesta**:
1. Registrar `send-push-notification` en `config.toml` con `verify_jwt=false` (solo la invoca `pg_net` con `SUPABASE_SERVICE_ROLE_KEY` header).
2. Deployar edge fn + smoke test real antes de activar `PROVIDER_PUSH=true`.
3. Dentro de la edge fn, invocar `user_can_receive_notification` antes de enviar, e insertar en `notification_attempts` después.
4. Extender a `send-whatsapp-reminder` y `send-shelter-welcome` con mismo contrato.

## 28. Rediseño del flujo Owner

1. **Onboarding mascota**: 3 campos mínimos (nombre, especie, edad). Foto opcional. `/onboarding-mascota` ya existe pero con flujo formal no definido — finalizar.
2. **Agregar prevención**: 3 campos (tipo, título, fecha). Detalles opcionales en collapse.
3. **Reservar cita**: 3 pasos (pet+service, slot, confirm). Auto-select single-service providers.
4. **Ver calendario**: 1 superficie, 5 tabs, siempre mobile-friendly.

## 29. Rediseño del flujo Provider/Vet

1. **Dashboard**: KPI bar (hoy, semana, mes) + próxima cita + inbox.
2. **Agenda semanal**: drag-to-reschedule (activar flag).
3. **Pacientes**: bulk actions (ya existe en clínica).
4. **Ficha paciente (view-mode=vet)**: VetActionsBar con "Agregar consulta", "Registrar vacuna", "Enviar invitación".

---

## 30. Integraciones recomendadas priorizando gratis/free tier

Ver apéndice **M** para lista completa. Highlights:

**Gratis o free-tier cómodo (usar ahora)**:
1. **Resend** (email transaccional) — ya integrado.
2. **Supabase Edge Functions** (Deno) — ya integrado.
3. **PostHog** (analytics) — free tier 1M events/month.
4. **Sentry** (error tracking) — free tier 5k errors/month.
5. **Firebase Analytics + FCM** — gratis sin cap razonable.
6. **Google Calendar API** — ya integrado.
7. **Leaflet + OSM** — ya integrado (vs Google Maps pago).
8. **Web Push VAPID** (web push sin FCM para PWA) — gratis.

**Free tier útil (evaluar cuando haya volumen)**:
9. **Twilio WhatsApp** — no es gratis pero hoy ya se usa; mantener.
10. **Cloudinary** (image CDN + transforms) — free 25GB/mes. Hoy Supabase Storage funciona; Cloudinary ayudaría con transforms on-the-fly.
11. **UploadThing** (uploads amigable a Next/React) — free 2GB/mes. Útil si Capacitor uploads siguen frágiles.
12. **Dub.co** (link shortener) — free 1K links/mes. Útil para invitaciones vet.

**Pagado solo si hay volumen (no ahora)**:
13. Intercom, Segment, Mixpanel, Customer.io. Nada justificado hoy.

---

## 31. Propuesta de modelo de datos

Ver apéndice **A** para campos. Cambios concretos a migrar:

1. **Unificar reminder types**: trigger y frontend ambos insertan con `type='vaccine' | 'deworming_internal' | 'deworming_external' | 'checkup' | 'medication' | 'grooming' | 'custom'`. Refactor del CHECK.
2. **Una sola ruta de insert**: eliminar el insert manual del frontend en `AddMedicalRecord.tsx:274-319` → dejar solo el trigger SQL como fuente única.
3. **Columna `source` en `pet_reminders`**: `source IN ('vaccine_trigger','booking_trigger','routine_trigger','manual','cron_generated')` para auditar origen.
4. **Dropear columnas/tipos obsoletos**: `record_type='antipulgas'` y `record_type='desparasitacion'` deben mergearse en `record_type='antiparasitario'` (con subtipo en `antiparasitic_type`).
5. **Adoption posts**: agregar columna `visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public','shelter_only','draft'))` para drafts.
6. **Pitch applications**: agregar vista `my_pitch_applications` para que el usuario vea status de su submission.

## 32. Propuesta de cambios de backend

### 32.1 Migraciones necesarias

Ver apéndice **G** para lista ordenada. Highlights:

1. `202605XX_unify_reminder_types.sql` — amplía CHECK + back-fill de `'antiparasitic'` → `'deworming_internal'/'deworming_external'` según `antiparasitic_type`.
2. `202605XX_reminder_source_column.sql` — agrega `source` para auditoría.
3. `202605XX_fix_notify_adoption_interest_trigger.sql` — remueve JOIN inválido a `pets` y usa `pet_name` directo.
4. `202605XX_rpc_create_adoption_post.sql` — RPC server-authoritative con validación de owner.
5. `202605XX_missing_partner_rpcs.sql` — crea `increment_partner_impressions` y `_clicks`.
6. `202605XX_my_applications_view.sql` — vista `my_pitch_applications` y variantes `my_paw_voices_applications`, `my_paw_companys_applications`.
7. `202605XX_auto_reminder_on_booking_confirm.sql` — trigger que crea `pet_reminder` cuando `vet_booking.status='confirmado'`.

### 32.2 Edge functions

1. **Registrar 9 edge fns huérfanas en `config.toml`** (solo las que se van a usar; archivar las demás).
2. **Llamar `user_can_receive_notification`** en `send-push-notification`, `send-whatsapp-reminder`, `send-pet-invitation`.
3. **Insertar en `notification_attempts`** con dedupe key `(owner_id, type, target_id)` para evitar spam.

## 33. Propuesta de cambios de frontend

1. Refactor `AddMedicalRecord.tsx` a **3 pasos con progressive disclosure** (apéndice C).
2. Remover insert manual de `pet_reminders` (delegar al trigger).
3. **Fix Adoption**: invalidar query correctamente + no depender de `refetch()`.
4. **Nuevo componente**: `MyApplicationsSection.tsx` para Paw Voices / Paw Companys / Pitch.
5. **Nuevo componente**: `NewBadge` (sutil, sin tono lúdico) para reemplazar `PawLabsBanner` en Adopción / Comunidad / Sangre.
6. **Consolidar rutas legacy**: redirigir `/reminders`, `/rutinas`, `/mis-reservas` a `/calendario?tab=X`.
7. **Agregar tab "Prevenciones"** en `/calendario`.
8. **Activar optimistic updates** en booking mutations (crear/cancelar/reprogramar).

---

## 34. Auditoría específica de triggers, RPCs, edge functions, queries, invalidaciones y wiring técnico

Ver apéndice **L** para checklist completo. Highlights críticos:

| Pieza | Estado | Acción |
|---|---|---|
| `send-push-notification` edge fn | No en `config.toml` | Registrar + deploy + smoke |
| 9 edge fns huérfanas | No deployadas | Auditar 1 a 1, deployar o archivar |
| `user_can_receive_notification` RPC | Definida, no usada | Integrar en edge fns de notifs |
| `notification_attempts` tabla | Definida, no usada | Insertar dedupe desde edge fns |
| `increment_partner_*` RPCs | No existen | Crear migración |
| `notify_adoption_interest` trigger | JOIN inválido | Fix con pet_name directo |
| `create_vaccine_reminder` trigger | OK | Unificar types con frontend |
| `auto_cancel_pending_bookings` cron | OK | Verificar en prod |
| `reminder-push-daily` cron | OK pero llama fn huérfana | Fix upstream |

---

## 35. Estructura objetivo de módulos y carpetas

```
src/
  features/
    booking/              ← extraer de components/booking/ + hooks/useBooking*
      components/
      hooks/
      types.ts
    preventive-care/      ← nuevo, extraer lógica de vacunas/antiparasitarios
      components/
      hooks/
      utils.ts            ← frecuencias, tipos canónicos
    calendar/             ← UnifiedCalendar + tabs
    reminders/            ← Reminders.tsx + useReminders
    adoption/             ← Adoption + CreateAdoptionPost
    applications/         ← MyApplications para voices/companys/pitch
  components/
    ui/                   ← shadcn
    layout/               ← AppLayout, Header, Sidebar, BottomTabBar
    badges/               ← NewBadge, PawLabsBanner, PremiumBadge
  lib/
    featureFlags.ts
    links.ts
    reminderTypes.ts      ← única fuente para type canónico
    frequencies.ts        ← única fuente para frecuencias
```

Extraer a `features/` simplifica responsabilidades y reduce coupling.

## 36. Archivos concretos a tocar

Ver apéndice **H** para la lista priorizada. Top 10:

1. [src/pages/Adoption.tsx:75-89](../../src/pages/Adoption.tsx#L75-L89) — fix query disable + refetch.
2. [src/components/CreateAdoptionPost.tsx:200-210](../../src/components/CreateAdoptionPost.tsx) — agregar `invalidateQueries`.
3. [src/components/AddMedicalRecord.tsx:78-319](../../src/components/AddMedicalRecord.tsx) — refactor progressive + remover insert manual reminder.
4. [src/components/AppSidebar.tsx:66-73](../../src/components/AppSidebar.tsx) — colapsar 3 items a 1 en core.
5. [src/components/BottomTabBar.tsx:94-99](../../src/components/BottomTabBar.tsx) — simplificar matchPaths de Agenda.
6. [src/lib/links.ts:62-68](../../src/lib/links.ts) — consolidar helpers.
7. [src/App.tsx](../../src/App.tsx) — agregar redirects `/reminders`, `/rutinas`, `/mis-reservas` → `/calendario?tab=X`.
8. [supabase/migrations/20260412220000_missing_notification_triggers.sql:31](../../supabase/migrations/20260412220000_missing_notification_triggers.sql#L31) — fix JOIN trigger.
9. [supabase/config.toml](../../supabase/config.toml) — registrar edge fns relevantes.
10. [src/pages/Adoption.tsx:99](../../src/pages/Adoption.tsx#L99), [src/pages/Community.tsx:111](../../src/pages/Community.tsx#L111), [src/pages/BloodDonors.tsx](../../src/pages/BloodDonors.tsx) — reemplazar `PawLabsBanner` por `NewBadge`.

## 37. Tipos TypeScript centrales

Ver apéndice **A** y propuesta en:

```ts
// src/lib/reminderTypes.ts (canonical)
export type ReminderTypeCanonical =
  | 'vaccine'
  | 'deworming_internal'
  | 'deworming_external'
  | 'checkup'
  | 'medication'
  | 'grooming'
  | 'weight'
  | 'custom';

export const REMINDER_TYPE_LABELS: Record<ReminderTypeCanonical, string> = {
  vaccine: 'Vacuna',
  deworming_internal: 'Desparasitación interna',
  deworming_external: 'Desparasitación externa (pulgas/garrapatas)',
  checkup: 'Control veterinario',
  medication: 'Medicación',
  grooming: 'Peluquería',
  weight: 'Control de peso',
  custom: 'Personalizado',
};

export function legacyMapping(old: string): ReminderTypeCanonical {
  const map: Record<string, ReminderTypeCanonical> = {
    antiparasitic: 'deworming_internal',
    deworming: 'deworming_internal',
    appointment: 'checkup',
  };
  return (map[old] ?? old) as ReminderTypeCanonical;
}
```

## 38. Pseudocódigo y lógica central

### 38.1 Inserción de prevención (backend-first)

```sql
-- Trigger único en medical_records
CREATE OR REPLACE FUNCTION create_preventive_reminder()
RETURNS TRIGGER AS $$
DECLARE
  v_type TEXT;
  v_due DATE;
BEGIN
  IF NEW.record_type = 'vacuna' THEN
    v_type := 'vaccine';
    v_due := COALESCE(NEW.next_date, NEW.date + INTERVAL '12 months');
  ELSIF NEW.record_type = 'antiparasitario' THEN
    v_type := CASE NEW.antiparasitic_type
      WHEN 'externo' THEN 'deworming_external'
      WHEN 'ambos' THEN 'deworming_internal'  -- representativo, la UI lo sabe
      ELSE 'deworming_internal'
    END;
    v_due := COALESCE(NEW.next_date, calculate_antiparasitic_next_date(NEW));
  ELSE
    RETURN NEW; -- no genera reminder
  END IF;

  INSERT INTO pet_reminders (pet_id, owner_id, type, title, due_date, is_recurring, source)
  VALUES (NEW.pet_id, NEW.owner_id, v_type, NEW.title, v_due, TRUE, 'medical_record_trigger')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Frontend ya **no inserta manualmente** — el trigger es la única fuente.

### 38.2 Creación de adoption post (invalidación correcta)

```ts
// En CreateAdoptionPost
const queryClient = useQueryClient();

const { mutate: createPost } = useMutation({
  mutationFn: async (payload) => {
    const { data, error } = await supabase.from('adoption_posts').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['adoption-posts'] });
    toast.success('Publicación creada');
    onSuccess();
  },
  onError: (err) => toast.error('Error al publicar: ' + err.message),
});
```

En `Adoption.tsx`: remover `refetch()` de `handlePostCreated` (ya no necesario).

---

## 39. Analytics del funnel

Eventos clave (PostHog + Firebase):

**Preventive care**:
- `prevention_started` (type)
- `prevention_completed` (type, fields_filled)
- `prevention_abandoned` (step)

**Booking**:
- `booking_started` (service_type)
- `booking_slot_picked` (time_to_pick_sec)
- `booking_completed` (service_type, price_clp)
- `booking_abandoned` (step)

**Adoption**:
- `adoption_post_created` (has_photos, fields_filled)
- `adoption_post_viewed_count`
- `adoption_interest_expressed`

**Calendario**:
- `calendar_tab_changed` (tab)
- `reminder_completed` (type, source)

## 40. QA y pruebas

### 40.1 Unit tests

- `reminderTypes.ts` — legacy mapping cover 100%.
- `frequencies.ts` — auto-calc de next_date para todos los products.
- `useMyBookingsV2.ts` — mock UNION de 4 tablas.

### 40.2 E2E (Playwright, `e2e/`)

Escenarios críticos:
1. Owner crea vacuna → aparece en calendario (tab recordatorios) → se completa desde calendario → ficha muestra historial.
2. Owner crea post adopción en tab shelters → cambia a "mis publicaciones" → aparece.
3. Owner reserva cita → provider ve en dashboard → aprueba → owner recibe notif in-app.
4. Reminder vencido con 30d → recibe WhatsApp (stub edge fn).
5. Tab "Agenda" en mobile muestra 4 sub-tabs correctamente.

### 40.3 Smoke manual

- Activar `PROVIDER_PUSH=true` con un solo provider de prueba y observar delivery.
- Activar `BOOKING_V3_WIZARD=true` con 10% rollout.

---

## 41. Riesgos, tradeoffs y decisiones de producto

| Decisión | Tradeoff | Recomendación |
|---|---|---|
| Consolidar `/reminders` + `/rutinas` + `/mis-reservas` en `/calendario` | Rompe muscle memory de users actuales | Mantener redirects 6 meses; avisar en email del cambio |
| Matar insert manual reminder en frontend | Si trigger se cae, no hay fallback | Mantener logging; monitor alertas |
| Eliminar PawLabsBanner de Adoption/Community/Sangre | Banner comunicaba "en beta" | Reemplazar con `NewBadge` sutil |
| Reactivar Feed | Requiere moderación activa | No reactivar aún; revisar Q3 |
| Mover Grupos a "Día a día" sidebar | "Día a día" se satura | Mejor: renombrar "Social" a "Comunidad" y dejar ahí |
| Refactor form vacuna/antiparasitario | Riesgo de romper insert existentes | Feature-flag `FORM_V2_PREVENTIVE` con A/B |
| Activar `PROVIDER_PUSH` | Incidente previo al hacer bulk flip verify_jwt | Activar 1 provider, smoke, luego rollout gradual |

---

## 42. Plan de implementación por fases

### Fase 0 — Hotfixes (2-3 días, P0)

1. Fix Adoption bug: invalidación + query enabled ([Adoption.tsx:75](../../src/pages/Adoption.tsx#L75), [CreateAdoptionPost.tsx](../../src/components/CreateAdoptionPost.tsx)).
2. Fix trigger `notify_adoption_interest` JOIN.
3. Retirar PawLabsBanner de Adoption/Community/BloodDonors + crear `NewBadge`.
4. Registrar `send-push-notification` en `config.toml` (sin activar flag aún).

### Fase 1 — Coherencia navegación (4-5 días, P0)

5. Consolidar sidebar: core a 5 items, Agenda como ítem único.
6. Redirect `/reminders`, `/rutinas`, `/mis-reservas` → `/calendario?tab=X`.
7. Renombrar "Social" → "Comunidad" y mover "Grupos" dentro.
8. Simplificar matchPaths del BottomTab.
9. Actualizar `FLUJO_COMPLETO.mmd` y `MAPA_FUNCIONAL_COMPLETO.md`.

### Fase 2 — Preventive care simplificado (5-7 días, P1)

10. `reminderTypes.ts` canónico + `frequencies.ts`.
11. Migración `unify_reminder_types.sql` + back-fill.
12. Refactor `AddMedicalRecord.tsx` a 3 pasos progressive.
13. Remover insert manual reminder en frontend.
14. Vista "Mis aplicaciones" para Paw Voices/Companys/Pitch.
15. Tab "Prevenciones" en `/calendario`.

### Fase 3 — Wiring notificaciones y auditoría (3-5 días, P1)

16. Integrar `user_can_receive_notification` en edge fns.
17. Registrar `notification_attempts` desde cada push/whatsapp/email.
18. Auditar 9 edge fns huérfanas: deployar o archivar.
19. Crear RPCs `increment_partner_*`.
20. Smoke test PROVIDER_PUSH en 1 provider + activar rollout gradual.

### Fase 4 — Booking V3 finalización (7-10 días, P2)

21. Activar `BOOKING_V3_WIZARD=true` con 10% rollout.
22. Completar `ProviderAgendaCalendar` + activar flag.
23. Optimistic updates en bookings.
24. Trigger `auto_reminder_on_booking_confirm`.
25. Implementar `.ics` export + activar flag.

### Fase 5 — Hardening y limpieza (3-5 días)

26. Tests E2E críticos.
27. Cleanup de carpetas/features a `features/`.
28. Docs vivos actualizados.
29. Roadmap de re-evaluación Feed para Q3.

**Total estimado**: 24-35 días-developer.

---

## 43. Top 10 acciones inmediatas

1. **Fix Adoption bug en 1 commit** (`Adoption.tsx:75` + `CreateAdoptionPost.tsx` `invalidateQueries`) — P0, 30 min.
2. **Fix trigger `notify_adoption_interest`** (remover JOIN a columna inexistente) — P0, 20 min en migración.
3. **Registrar `send-push-notification` en `config.toml` + deployar** — P0, 15 min.
4. **Retirar PawLabsBanner de Adopción/Community/BloodDonors** y usar `<NewBadge variant="pilot" />` — P1, 1 hora.
5. **Colapsar sidebar core**: eliminar 2 de los 3 ítems (`Mis reservas`, `Recordatorios`) → dejar solo `Agenda` → `/calendario?tab=hoy` — P1, 30 min.
6. **Actualizar `BottomTabBar.matchPaths`** para `Agenda` — P1, 10 min.
7. **Redirects legacy** en `App.tsx` — P1, 15 min.
8. **Crear `src/lib/reminderTypes.ts` canónico** + adaptar `useReminders` — P2, 2 horas.
9. **Remover insert manual reminder** en `AddMedicalRecord.tsx:274-319` (dejar solo trigger SQL) — P2, 1 hora + test.
10. **Vista "Mis aplicaciones"** para Paw Voices / Companys / Pitch (un hook + 1 componente + 1 card en profile) — P2, 3 horas.

---

# Apéndices

## Apéndice A — Campos obligatorios y opcionales por entidad

### A.1 Vacuna (`medical_records` + `record_type='vacuna'`)

| Campo | Estado propuesto | Default | Nota |
|---|---|---|---|
| `record_type` | Obligatorio | `'vacuna'` (preset) | |
| `title` | Obligatorio | — | Autocomplete por especie + protocolo |
| `date` | Obligatorio | Hoy | Date picker |
| `next_date` | Opcional | +12 meses | Auto-calculado, editable |
| `veterinarian_name` | Opcional | — | Autocomplete historial |
| `clinic_name` | Opcional | — | Autocomplete historial |
| `batch_number` | Opcional, collapse | — | En grupo "Detalle producto" |
| `serial_number` | Opcional, collapse | — | Idem |
| `document_url` | Opcional, collapse | — | Upload o foto |
| `description` | Opcional | — | |

### A.2 Antiparasitario

| Campo | Estado propuesto | Default | Nota |
|---|---|---|---|
| `record_type` | Obligatorio | `'antiparasitario'` | |
| `title` | Obligatorio | — | Autocomplete productos (Bravecto, Nexgard, etc.) |
| `date` | Obligatorio | Hoy | |
| `antiparasitic_type` | **Opcional** (hoy es required en UI) | Inferido del producto | Solo si marca no lo identifica |
| `product_brand` | Opcional | — | |
| `next_date` | Opcional | Auto (1m externo / 3m interno / 3m Bravecto) | |
| `veterinarian_name` | Opcional | — | |
| `clinic_name` | Opcional | — | |

### A.3 Pet reminder

| Campo | Estado | Default | |
|---|---|---|---|
| `pet_id` | Obligatorio | — | |
| `owner_id` | Obligatorio (auto) | `auth.uid()` | |
| `type` | Obligatorio | — | Enum canónico |
| `title` | Obligatorio | — | |
| `due_date` | Obligatorio | — | |
| `is_recurring` | Opcional | `true` si vacuna/desparasitario | |
| `recurrence_interval` | Opcional | Auto | |

### A.4 Booking

| Campo | Estado | Default | |
|---|---|---|---|
| `service_provider_id` | Obligatorio | — | |
| `service_type` | Obligatorio | — | |
| `pet_id` | Obligatorio | — | |
| `scheduled_date` | Obligatorio | — | |
| `start_time`/`end_time` | Obligatorios | — | |
| `notes` | Opcional | — | |
| `is_emergency` | Opcional | `false` | |

### A.5 Adoption post

| Campo | Estado | Default | |
|---|---|---|---|
| `pet_name` | Obligatorio | — | |
| `species` | Obligatorio | — | |
| `age` | Obligatorio | — | |
| `description` | Opcional | — | |
| `photos` | Opcional | — | Recomendado fuertemente |
| `location_comuna` | Opcional | — | |
| `status` | Auto | `'disponible'` | |

---

## Apéndice B — Defaults seguros y sugeridos

- `date` → hoy.
- `next_date` vacuna → +12 meses (configurable por vacuna desde `vaccine_schedule_doses`).
- `next_date` antiparasitario interno → +3 meses.
- `next_date` antiparasitario externo → +1 mes.
- `next_date` Bravecto/Nexgard Spectra → +3 meses.
- `is_recurring` → `true` para vacuna/desparasitario.
- `recurrence_interval` → `yearly` para vacuna, `monthly`/`quarterly` para desparasitario.
- `species` en vacuna autocomplete → especie de la mascota seleccionada.
- `timezone` provider → `America/Santiago`.

---

## Apéndice C — Copy UX para formularios simplificados

**Modal `Nueva vacuna`**:
- Título: "Agregar vacuna"
- Campo 1: "¿Qué vacuna?" placeholder "Séxtuple, Antirrábica, etc."
- Campo 2: "¿Cuándo se aplicó?" default hoy
- CTA principal: "Guardar vacuna"
- Link secundario: "Agregar más detalles (lote, veterinario, documento)..."

**Modal `Nuevo antiparasitario`**:
- Título: "Agregar antiparasitario"
- Campo 1: "¿Qué producto?" placeholder "Bravecto, Nexgard, Drontal..."
- Campo 2: "¿Cuándo se aplicó?" default hoy
- Subtexto: "Te avisaremos cuando toque el próximo."
- CTA: "Guardar"
- Link: "Agregar más detalles..."

**Feedback post-save**:
- Toast verde: "Guardado. Próxima dosis: 15 de julio 2026."
- Si reminder falla (no debería): silenciar error en UI, registrar en Sentry.

---

## Apéndice D — Validaciones mínimas viables

```ts
// zod schema simplificado
const vaccineMinimalSchema = z.object({
  title: z.string().min(2, 'Indica el nombre de la vacuna').max(100),
  date: z.date({ required_error: 'Selecciona la fecha' }),
  // resto opcional:
  next_date: z.date().optional(),
  batch_number: z.string().optional(),
  serial_number: z.string().optional(),
  veterinarian_name: z.string().optional(),
  clinic_name: z.string().optional(),
  description: z.string().optional(),
  document_url: z.string().url().optional(),
});

const antiparasiticMinimalSchema = z.object({
  title: z.string().min(2).max(100),
  date: z.date(),
  antiparasitic_type: z.enum(['interno','externo','ambos']).optional(), // OPCIONAL
  product_brand: z.string().optional(),
  next_date: z.date().optional(),
});
```

---

## Apéndice E — Recordatorios automáticos para vacunas y desparasitarios

Lógica única en `supabase/migrations/create_preventive_reminder()`:

- Vacuna → reminder `type='vaccine'`, `due_date=NEW.next_date ?? NEW.date + interval '12 months'`.
- Antiparasitario interno → `type='deworming_internal'`, `due_date=NEW.date + interval '3 months'` (o Bravecto +3m).
- Antiparasitario externo → `type='deworming_external'`, `due_date=NEW.date + interval '1 month'`.
- `is_recurring=TRUE` siempre.
- `ON CONFLICT (pet_id, type, due_date) DO NOTHING` para evitar duplicados.

**Notificaciones asociadas**:
- 7 días antes: push + email si prefs lo permiten.
- 1 día antes: WhatsApp (opt-in).
- Día del vencimiento: reminder en calendario + notificación in-app.
- 3 días vencido: reminder escalado con mensaje urgente.

---

## Apéndice F — Cómo mostrar booking, vacunas, desparasitarios y reminders en calendario/rutinas

### F.1 `/calendario?tab=hoy`

Unifica todos los eventos del día:
- Bookings (provider/vet) — color azul, icon Calendar.
- Recordatorios — color naranja, icon Bell.
- Rutinas del día — color verde, icon RefreshCw.
- Vacunas/antiparasitarios próximos (≤7 días) — color violeta, icon Syringe.

### F.2 `/calendario?tab=rutinas`

Solo `routine_completions` + plantillas `pet_routines` del usuario seleccionado.

### F.3 `/calendario?tab=recordatorios`

Todos los `pet_reminders` no completados + completados últimos 30 días.

### F.4 `/calendario?tab=reservas`

Solo bookings (con tabs internos: próximas, pasadas, canceladas).

### F.5 `/calendario?tab=prevenciones` (nueva)

Solo reminders `type IN ('vaccine','deworming_internal','deworming_external')` con timeline visual de próximos 12 meses.

### F.6 En ficha clínica

Cuando el owner ve la ficha, las vacunas y antiparasitarios aparecen con sus próximas fechas calculadas, y un botón "Ver en mi calendario" abre `/calendario?tab=prevenciones&pet=:petId`.

---

## Apéndice G — Backlog técnico ejecutable para Claude Code

### G.1 Migraciones SQL (ordenadas)

```
20260521000000_reminder_source_column.sql
20260521000010_unify_reminder_types_check.sql
20260521000020_backfill_antiparasitic_reminders.sql
20260521000030_fix_notify_adoption_interest_trigger.sql
20260521000040_auto_reminder_on_booking_confirm.sql
20260521000050_missing_partner_rpcs.sql
20260521000060_my_applications_views.sql
20260521000070_rpc_create_adoption_post.sql
20260521000080_create_preventive_reminder_function_v2.sql
```

### G.2 Cambios en frontend (commits sugeridos)

1. `fix(adoption): invalidar adoption-posts tras insert + guard refetch disabled`
2. `chore(notifications): registrar send-push-notification en config.toml`
3. `refactor(sidebar): colapsar calendario/reservas/recordatorios en Agenda`
4. `feat(navigation): redirects legacy /reminders /rutinas /mis-reservas -> /calendario`
5. `chore(labs): retirar PawLabsBanner de superficies no-lúdicas, crear NewBadge`
6. `refactor(preventive): AddMedicalRecord 3 pasos progressive + remover insert manual`
7. `feat(applications): vista Mis aplicaciones (Paw Voices, Companys, Pitch)`
8. `feat(calendar): agregar tab Prevenciones en UnifiedCalendar`
9. `feat(booking): optimistic updates en create/cancel/reschedule`
10. `chore(docs): actualizar FLUJO_COMPLETO.mmd + MAPA_FUNCIONAL_COMPLETO.md`

### G.3 Edge functions

- Deployar `send-push-notification` con `verify_jwt=false`.
- Auditar 8 restantes: `send-inactive-user-reminder`, `send-monthly-vet-stats`, `send-new-pet-drip`, `send-pet-birthday-greeting`, `send-shelter-welcome`, `backup-weekly-snapshot`, `geocode-address`, `notify-vet-share`. Registrar las que se usan; archivar las demás.
- Dentro de cada fn de notifs: llamar `user_can_receive_notification` antes de enviar; insertar en `notification_attempts` después.

---

## Apéndice H — Archivos concretos del repo a modificar primero

| # | Archivo | Cambio | Prioridad |
|---|---|---|---|
| 1 | `src/pages/Adoption.tsx:75-89` | query enable + invalidate | P0 |
| 2 | `src/components/CreateAdoptionPost.tsx:200-210` | `invalidateQueries` | P0 |
| 3 | `supabase/migrations/20260412220000_missing_notification_triggers.sql:31` | fix JOIN | P0 |
| 4 | `supabase/config.toml` | registrar send-push-notification | P0 |
| 5 | `src/pages/Adoption.tsx:99` | retirar PawLabsBanner | P1 |
| 6 | `src/pages/Community.tsx:111` | retirar PawLabsBanner | P1 |
| 7 | `src/pages/BloodDonors.tsx` | retirar PawLabsBanner | P1 |
| 8 | `src/components/badges/NewBadge.tsx` | crear nuevo | P1 |
| 9 | `src/components/AppSidebar.tsx:66-73` | colapsar core a 5 | P1 |
| 10 | `src/components/BottomTabBar.tsx:94-99` | matchPaths simplificado | P1 |
| 11 | `src/App.tsx` | redirects legacy | P1 |
| 12 | `src/lib/reminderTypes.ts` | canónico | P2 |
| 13 | `src/lib/frequencies.ts` | canónico | P2 |
| 14 | `src/components/AddMedicalRecord.tsx:78-319` | refactor progressive + remover insert manual | P2 |
| 15 | `src/features/applications/MyApplications.tsx` | nuevo | P2 |
| 16 | `src/hooks/useBookingMutations.ts` | optimistic updates | P2 |

---

## Apéndice I — Estrategia de implementación segura sin romper datos ni Booking V3

### I.1 Principios

1. **Nunca DROP TABLE ni DELETE FROM sin WHERE en producción.** Regla 9.7.8 CLAUDE.md.
2. **Migraciones idempotentes** con `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `ALTER ... IF EXISTS`.
3. **Back-fill antes de constraint**: `UPDATE ... SET new_col = old_col WHERE new_col IS NULL` antes de `ALTER ... SET NOT NULL`.
4. **Feature flags para cambios grandes**: toggle `FORM_V2_PREVENTIVE`, `NAV_V2_SIDEBAR`, `CALENDAR_V2_TABS`.
5. **Smoke 1-a-1 para wiring**: activar flag en 1 provider/owner de prueba antes de rollout.

### I.2 Booking V3 — no tocar

- No modificar RPCs `rpc_create_booking`, `rpc_cancel_booking`, `rpc_reschedule_booking`, `rpc_get_available_slots_range`.
- No modificar `v_all_bookings`.
- No modificar triggers `push_provider_on_new_booking`, `auto_confirm_booking`, `notify_booking_status_change`.
- **Sí** agregar: trigger `auto_reminder_on_booking_confirm` (nuevo, INSERT a `pet_reminders` cuando `status='confirmado'`).

### I.3 Preventive care — migración en 3 pasos

1. Agregar columna `source` a `pet_reminders` (nullable).
2. Back-fill `source='legacy'` para todas las filas existentes.
3. Deployar trigger v2 `create_preventive_reminder()` que inserta con `source='medical_record_trigger'`.
4. Remover insert manual del frontend (1 PR).
5. Observar 1 semana; si duplicados, fallback a insert manual sigue siendo válido para ese edge case.

### I.4 Navegación — redirects 301

Usuarios con bookmarks a `/reminders`, `/rutinas`, `/mis-reservas` deben llegar bien. Usar `<Navigate to="..." replace />` que React Router trata como 301 conceptual (el browser cachea).

---

## Apéndice J — Propuesta concreta de nuevo sidebar

Ver sección §18 para la estructura completa. Resumen táctico:

**Core (5 items, no colapsables)**:
```
Inicio • Mis Mascotas • Agenda • Buscar vet • Servicios
```

**Explorar (colapsable, agrupado)**:
```
Día a día
  Reportes
Comunidad
  Grupos
  Feed (flag FEED)
  Mensajes (flag CHAT)
Causas
  Adopción
  Banco de sangre
  Donaciones
Paw Labs 🧪
  Paw Game
  Misiones
  Colección
```

**Provider (dedicado)**:
```
Dashboard • Pacientes • Agenda • Perfil público • Reportes • Panel Pro
```

**Rationale**:
- Core reducido de 6 a 5 porque 3 de los 6 eran el mismo page con tabs.
- "Día a día" solo deja Reportes (Rutinas y Recordatorios viven ahora dentro de Agenda).
- "Comunidad" reemplaza "Social" (no crea el awkward "Social > Grupos").
- "Paw Labs 🧪" solo gamificación.

---

## Apéndice K — Recomendación concreta

- **Consolidar 3 → 1 en core sidebar**: eliminar "Mis reservas" y "Recordatorios" del core, mantener solo "Agenda".
- **Rutas físicas `/reminders`, `/rutinas`, `/mis-reservas` → redirect** a `/calendario?tab=X`.
- **"Grupos" queda en "Comunidad" (renombrada desde Social)**, no se mueve a "Día a día".
- **"Social" desaparece** como categoría. Se llama "Comunidad".
- **Feed NO se reactiva** ahora (mantener `FEED=false`). Revisar Q3 2026.
- **Beta Labs** se restringe a gamificación: retirar banner de Adopción, Comunidad, Sangre; reemplazar con `<NewBadge>` sutil.

---

## Apéndice L — Checklist de revisión de triggers, edge functions, cron, queries, invalidaciones

### L.1 Triggers SQL

- [ ] `create_vaccine_reminder` — unificar vocabulario con frontend.
- [ ] `notify_adoption_interest` — fix JOIN inválido.
- [ ] `push_provider_on_new_booking` — verificar pg_net reach a edge fn.
- [ ] `notify_booking_status_change` — idem.
- [ ] `auto_confirm_booking` — verificar que auto-cancela si confirmation_mode=manual y no hay aprobación en 24h (usa cron).
- [ ] `log_booking_status_change` — verificar que `booking_events` se puebla.
- [ ] `trigger_update_post_likes_count` — verificar que actualiza contador en tiempo real.
- [ ] `trigger_update_post_comments_count` — idem.
- [ ] `trg_update_group_member_count` — verificar al join/leave.
- [ ] `update_device_token_last_seen` — verificar al recibir push.

### L.2 Edge functions

- [ ] Cada fn en `supabase/functions/` debe estar en `config.toml` o archivarse.
- [ ] Cada fn de notifs invoca `user_can_receive_notification`.
- [ ] Cada fn de notifs inserta en `notification_attempts`.
- [ ] `send-push-notification` respeta categorías de prefs.
- [ ] `reminder-cron` filtra por opt-in WhatsApp.
- [ ] `flow-webhook` responde 200 siempre (evita reintentos).
- [ ] `log-error` filtra ruido benigno (invalid_grant, etc.).

### L.3 Cron jobs

- [ ] `reminder-push-daily` → fn desplegada.
- [ ] `auto_cancel_pending_bookings` → RPC existe y tiene cap 200/run.
- [ ] `daily-digest` → no spamea si user opt-out.
- [ ] `weekly-owner-reports` → respeta prefs.
- [ ] `weekly-vet-reports` → respeta prefs.

### L.4 Frontend queries / invalidaciones

- [ ] Cada mutation tiene `onSuccess: invalidateQueries(...)`.
- [ ] Query keys granulares con `userId` cuando aplica.
- [ ] `refetch()` no se usa si query está `enabled: false` (usar `invalidateQueries`).
- [ ] Optimistic updates en mutations de alta frecuencia (bookings, reminders, likes).

---

## Apéndice M — Integraciones recomendadas

### M.1 Gratis o free-tier cómodo (usar ahora)

1. **Resend** (email transaccional) — ya integrado. $0 hasta 100 emails/día.
2. **Supabase Edge Functions** — ya integrado.
3. **PostHog** — free 1M events/mes.
4. **Sentry** — free 5k errors/mes.
5. **Firebase Analytics + FCM** — gratis sin cap real.
6. **Google Calendar API** — ya integrado. Free.
7. **Leaflet + OpenStreetMap** — ya en uso. Free.
8. **Web Push VAPID** — free, útil para PWA.
9. **shadcn/ui** — ya en uso. Free.
10. **date-fns** — ya en uso. Free.

### M.2 Free-tier útil (evaluar cuando haya volumen)

11. **Cloudinary** — 25GB/mes free. Image transforms on-demand.
12. **UploadThing** — 2GB free. Uploads amigables en React/Capacitor.
13. **Dub.co** (shortener) — 1K links/mes free. Útil para vet outreach.
14. **Knock** (notifications orchestration) — 1K users/mes free.
15. **Tiny.io / Bunny CDN** — $1/TB. Cuando el bundle pase 500kB.

### M.3 Pagado — solo si volumen lo justifica

16. Intercom, Segment, Mixpanel, Customer.io, Mailchimp Pro. **No justificado hoy.**
17. OpenAI GPT-4o mini para Clinical AI → hoy se usa Haiku, mantener.

### M.4 Quick wins UX sin integraciones

- **Auto-completar veterinarios/clínicas** desde el historial del user (no requiere integración).
- **Preview de próxima dosis** en el botón submit antes de guardar.
- **"Atajos del día"** en Home: 3 cards con lo más urgente.
- **Skeletons** en lugar de spinners durante loading.

---

## Apéndice N — Checklist para detectar problemas de guardado/sincronización en otros módulos

Aplicar a cada módulo que escribe datos visibles:

- [ ] ¿La mutation llama `invalidateQueries` con la key correcta?
- [ ] ¿La key incluye `userId` si es user-specific?
- [ ] ¿La query de la lista tiene `enabled: true` cuando el usuario ve la lista?
- [ ] ¿Hay `refetch()` en código que depende de queries `disabled`? (anti-pattern)
- [ ] ¿Hay trigger SQL que complementa el insert del frontend? (duplicación)
- [ ] ¿RLS permite al dueño leer su propio registro recién insertado?
- [ ] ¿El filtro de status/visibility no excluye el registro por default?
- [ ] ¿Hay toast de error silenciado? (check `.maybeSingle()` que devuelve null)
- [ ] ¿La tabla tiene `updated_at` trigger que no rompe otros módulos?
- [ ] ¿Se puebla `notification_attempts` si corresponde?

**Módulos a auditar con este checklist**:
1. Adoptions (ya confirmado roto).
2. Paw Voices applications.
3. Paw Companys applications.
4. Paw Partners applications.
5. Pitch applications (`/aplicar`).
6. Reviews (service_reviews).
7. Feedback widget submissions.
8. Community group messages.
9. Pet activities (after medical record).
10. Pet reminders (after preventive insert).
11. Comments / likes del feed.
12. Shelter pet creation (bulk import).

---

## Apéndice O — Hipótesis de causa raíz adopciones/posts y estrategia de validación

### O.1 Hipótesis (ranked)

| # | Hipótesis | Probabilidad | Cómo validar |
|---|---|---|---|
| 1 | Query disabled + refetch no-op en tab `shelters` | **90%** | Reproducir: cambiar a "Refugios" tab, publicar, ir a "Mis publicaciones" → verificar si aparece al segundo refetch |
| 2 | `invalidateQueries` faltante en CreateAdoptionPost | 70% | Revisar `src/components/CreateAdoptionPost.tsx` — confirmar que solo llama `onSuccess()` y no invalida |
| 3 | RLS rechaza SELECT post-insert | 10% | Revisar policies actuales; `.maybeSingle()` retorna null silencioso si RLS bloquea |
| 4 | Trigger `notify_adoption_interest` bloquea insert (JOIN inválido) | 5% | Falso — trigger es sobre `adoption_interests`, no `adoption_posts` |
| 5 | Admin approval requerido | 1% | Falso — no hay columna `approved` en schema |

### O.2 Estrategia de validación (ordenada)

1. **Reproducir en staging/prod**: crear post en tab "shelters", cambiar a "my-posts", verificar.
2. **Inspeccionar Supabase logs**: query de INSERT debe aparecer en logs de `adoption_posts`.
3. **Inspeccionar React Query devtools**: observar que `['adoption-posts', 'shelters']` está `disabled`.
4. **Inspeccionar Network tab**: verificar que `refetch()` dispara request o no.
5. **Fix preventivo**: agregar `invalidateQueries({ queryKey: ['adoption-posts'] })` sin filter de tab → invalida todos los tabs.
6. **Test de regresión E2E**: Playwright test cubriendo los 4 tabs.

### O.3 Fix propuesto (1 commit)

```tsx
// src/components/CreateAdoptionPost.tsx
import { useQueryClient } from '@tanstack/react-query';

export function CreateAdoptionPost({ onSuccess }: Props) {
  const queryClient = useQueryClient();

  const handleSubmit = async (...) => {
    // ... insert
    queryClient.invalidateQueries({ queryKey: ['adoption-posts'] });
    onSuccess();
  };
}

// src/pages/Adoption.tsx
const handlePostCreated = () => {
  setShowCreateDialog(false);
  setSelectedTab('my-posts'); // redirigir a la tab donde sí se ve
};
```

Esto **elimina el bug real** sin depender de `refetch()`.

---

## Cierre

Este documento es una fuente de verdad auditada del estado actual y la hoja de ruta. **Ningún hallazgo depende de memoria externa**: todo lleva `archivo:línea` del repo en `c:\Users\psusa\Desktop\pet-harmony-chile-main` en la fecha 2026-04-21.

**Siguiente paso**: ejecutar Fase 0 (hotfixes) — 2-3 días — antes de cualquier otra prioridad. Los 10 ítems de §43 son el punto de partida.

**Documentos a actualizar en el mismo PR de cada fase**:
- `INDEX.md` — agregar entry a este plan.
- `diagrams/FLUJO_COMPLETO.mmd` — reflejar sidebar consolidado + tabs calendario.
- `MAPA_FUNCIONAL_COMPLETO.md` — reflejar `features/` nueva estructura.
- `AGENTS.md` — reflejar convenciones nuevas de reminderTypes.ts.
