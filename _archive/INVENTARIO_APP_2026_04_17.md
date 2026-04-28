# Inventario Paw Friend — 2026-04-17

Estado real de rutas, navegación, páginas y features. Basado 100% en código (`src/App.tsx`, componentes de navegación, `src/pages/`, `src/lib/links.ts`, `src/lib/routing.ts`). No es recomendación de rediseño — es foto cruda para que puedas decidir qué reordenar.

---

## 1. Resumen numérico

| Métrica | Cantidad | Notas |
|---|---|---|
| Rutas totales en App.tsx | 67 | 18 públicas, 40 protegidas, 3 provider, 2 admin, 4 redirects |
| Archivos en src/pages/ | 70 | incluye subcarpeta `PetClinicalRecord/` con 10 archivos |
| Componentes de navegación activos | 2 | BottomTabBar (móvil), Header (desktop + notificaciones) |
| Tabs BottomTabBar (Owner) | 5 | Inicio, My Paws, Vets, Recordar, Perfil |
| Tabs BottomTabBar (Provider) | 5-6 | Dashboard, Pacientes, Reservas, Mensajes (si flag CHAT), Perfil |
| Rutas owner-only (RoleGuard) | 3 | `/paw-game`, `/paw-collection`, `/misiones` |
| Rutas provider-only (RoleGuard) | 4 | `/provider/dashboard`, `/provider/pacientes`, `/provider/profile-edit`, `/panel-pro` |
| Páginas huérfanas detectadas | 9 | Ver sección 4 |
| Duplicados / solapamientos claros | 3 | Ver sección 3 |

---

## 2. Mapa completo por rol

### 2.1. OWNER (dueño de mascota) — rol default

**Entry**: `/home` | **BottomTabBar**: Inicio · My Paws · Vets · Recordar · Perfil

- **HOME** (`/home`): pet switcher (holo), status card salud, próximos recordatorios, seasonal tips (IA), rutinas hoy, reporte semanal (Premium), annual care checklist. CTAs a My Paws, Recordar, Vets, Servicios, Upgrade.
- **MY PETS** (`/my-pets`): carrusel Paw Cards, ClaimPetDialog (código vet), sección memorial siempre visible.
- **AGREGAR / EDITAR MASCOTA** (`/add-pet`, `/edit-pet/:petId`): form nombre/especie/raza/foto, OCR vaccination card, validación zod.
- **FICHA CLÍNICA** (`/ficha/:petId`) — **CORE**: 8 tabs (Resumen, Historial, Vacunas, Antiparasitarios, Alimentación, Documentos, Compartir, IA). Query params: `?mode=vet`, `?action=share`, `?action=book`. PDF descargable (Premium), ZIP documentos, memorial si fallecida, Feline Grimace Scale (gatos), IA: PetAssistant, SymptomTriage, NutritionCoach, WoundVision, ConsultationPrep.
  - Legacy redirects: `/mascota/:petId/ficha-clinica` y `/pet/:petId/clinical` → `/ficha/:petId`.
- **RECORDATORIOS** (`/reminders`) — **CORE**: listado filtrable, AddReminderDialog, badges vencidos/próx 24h, badge en BottomTabBar.
- **CALENDARIO** (`/calendario`) — **CORE pero invisible**: CalendarGrid + UnifiedDayView. Integra rutinas + recordatorios + reservas + follow-ups. **NO está en BottomTabBar ni hay link prominente desde Home**.
- **RUTINAS** (`/rutinas`, `/mascota/:petId/rutinas`): listado semanal, DaySelector, check/skip. **Enterrada**: no hay link visible desde Home.
- **TIMELINE MASCOTA** (`/mascota/:petId/timeline`): timeline visual de eventos. **Enterrada**: no linkeada desde ficha ni my-pets.
- **MIS RESERVAS** (`/mis-reservas`) — **CORE**: Booking V2 con availability rules, exceptions, audit trail, 3-step flow. Legacy `/calendar` → redirect aquí.
- **SERVICIOS** (`/servicios`): grid entry point (Paseadores, Cuidadores, Entrenadores, Peluquería). Envía a `/services/:type` (walkers, sitters, trainers, groomers).
- **PELUQUERO** (`/peluquero/perfil`): editar perfil groomer.
- **DIRECTORIO VETS** (`/veterinarios`) — **PÚBLICO + CORE**: listado vets verificados, filtros (comuna/especialidad/rating), mapa Leaflet. Rutas: `/veterinarios`, `/veterinarios/comuna/:comuna`, `/veterinarios/especialidad/:especialidad`, `/veterinarios/:slug`.
- **MAPS** (`/maps`): mapa Leaflet servicios cercanos. Menos usado que directorio.
- **FEED SOCIAL** (`/feed`) — **PAW LABS**: posts comunidad, comments, likes.
- **COMUNIDAD** (`/comunidad`, `/comunidad/:slug`) — **PAW LABS**: grupos por raza/condición, posts dentro del grupo.
- **PAW GAME** (`/paw-game`) — **OWNER-ONLY + LABS**: mini-juego, puntos, niveles, badges, streaks. RoleGuard. No en BottomTabBar.
- **PAW COLLECTION** (`/paw-collection`) — **OWNER-ONLY + LABS**: colección Paw Cards coleccionables, flip+reveal.
- **MISIONES** (`/misiones`) — **OWNER-ONLY + LABS**: listado misiones con reward/deadline.
- **ADOPCIÓN** (`/adoption`) — **LABS**: mascotas en adopción, filtros especie/ubicación.
- **EN MEMORIA** (`/en-memoria`) — **CORE + LABS**: memorial fallecidas, Bereavement AI.
- **DONANTES SANGRE** (`/donantes-sangre`) — **LABS**: red donantes por ubicación/tipo sangre.
- **UPGRADE** (`/upgrade`, `/upgrade/success`, `/upgrade/cancel`) — **CORE**: pricing Free vs Premium $3.990/mes, Flow.cl. Unified: `/payment-result?status=...`.
- **PANEL PRO** (`/panel-pro`) — **CORE + PREMIUM**: analytics dashboard, PremiumNudge, LockedOverlay si Free. **Enterrada**: link solo si Premium.
- **REPORTES** (`/reportes`) — **CORE + PREMIUM**: reporte semanal salud. Edge fn `generate-weekly-owner-reports`. **Enterrada**: link solo si hay reportes.
- **PERFIL** (`/profile`): display name, avatar, bio, notificaciones, plan, change password, logout, delete account. Legacy `/settings` → redirect.
- **OTRO USUARIO** (`/user/:userId`): perfil público, follow.
- **CHAT** (`/chat`, `/chat/:conversationId`) — **LABS, feature-flag CHAT**: conversaciones con vets.
- **PRECIOS VETS** (`/precios-veterinarios`) — **PÚBLICO**: estimador por comuna.
- **MEDICAL RECORDS (legacy)** (`/medical-records`): redirect a `/ficha/:firstPetId`.

### 2.2. PROVIDER (vet, groomer, walker, etc.)

**Entry**: `/provider/dashboard` | **BottomTabBar**: Dashboard · Pacientes · Reservas · Mensajes (si CHAT) · Perfil

- **DASHBOARD** (`/provider/dashboard`): QuickActionsBar, AlertsBanner (pending links), tabs Clínico / Negocios / Pacientes. InteractiveMetricCard, Next24hCard, ActivityFeed, ProviderBookingsInbox, NewPatientForm.
- **PACIENTES** (`/provider/pacientes`): listado mascotas, click → `/ficha/:petId?mode=vet`, invite dueño si huérfana.
- **FICHA CLÍNICA VET** (`/ficha/:petId?mode=vet`): 2 columnas, VetFichaView, VetVitalsCard, VetClinicalTimeline, VetQuickNotes, ConsultationTemplateSelector, PatientKPIBar.
- **RESERVAS** (`/mis-reservas`): inbox vet con estados, approve/reject, reschedule, audit trail.
- **EDITAR PERFIL** (`/provider/profile-edit`): tipo, bio, especialidades, comuna, áreas, foto, horarios, precios. **Botón único de Paw Friend**: "Ver como me ven los dueños" → preview `/veterinarios/:slug`.
- **PERFIL** (`/profile`): compartido con owner.
- **NO VE**: Paw Game, Paw Collection, Misiones, Feed, Adopción (RoleGuard).

### 2.3. ADMIN (Pedro + staff)

**Entry**: `/admin` (AdminRoute + `is_admin` en DB)

- **ADMIN PANEL** (`/admin`): sidebar con ~23 secciones (Dashboard, Analytics, Reservas, Proveedores, Vet Verifications, Usuarios, Finanzas, Contenido, Gamificación, Comercial, Leads Vets, Exports, Sistema, Team, Audit Log, Error Log, Safety Logs, Pending Pets, Ghost Users, Feedback, etc.). Realtime + polling 30s/60s/5min. CommandDialog (search).
- **DEMO** (`/demo`): demo interna.
- **ANALYTICS DEMO** (`/analytics-demo`): standalone dashboard, separado de `/panel-pro`.

### 2.4. PÚBLICAS (sin login)

- **LANDING** (`/`): Hero V2, pitch médico, testimonios, LogosBand. Redirige a `/home` si logueado.
- **AUTH** (`/auth`): login + signup (email + OAuth Google/FB, Capacitor Google Auth nativo). Post-login: `returnTo` o default por rol.
- **PARA VETERINARIOS** (`/para-veterinarios`): pitch B2B con pricing 4 planes.
- **REGISTRO VET** (`/registro-veterinario`, alias `/registro-proveedor`): form registro + creación service_provider status=pending.
- **ONBOARDING VET** (`/onboarding-vet`): 2 steps (bio+especialidades / horarios+precios).
- **ONBOARDING DUEÑO** (`/onboarding-mascota`): 2 steps (datos mascota / foto). Crea pet + Paw Card.
- **DEJAR RESEÑA** (`/resena/:token`): rating 1-5 con token temporal.
- **QR LANDING** (`/qr/:token`): landing pública de mascota escaneada.
- **PAW CARD LANDING** (`/paw-card/:pawCardId`): landing pública de card coleccionable.
- **MEDICAL SHARE** (`/medical-share/:token`): ficha compartida sin login, 30d, con ZIP.
- **REGISTRO PARTNER** (`/registro-partner`): refugios, tiendas.
- **TÉRMINOS** (`/terms`), **PRIVACIDAD** (`/privacy`).
- **ELIMINAR CUENTA** (`/delete-account`): GDPR / Meta / App Store.
- **NOT FOUND** (`*`).

---

## 3. Duplicados y solapamientos detectados

### 3.1. Directorio servicios vs vets
- `/servicios` (grid entry point)
- `/services/:type` con `type ∈ {walkers, sitters, trainers, groomers, vets}`
- `/veterinarios` (directorio vets dedicado, más datos)
- **Problema**: `/services/vets` y `/veterinarios` muestran lo mismo. Usuario no sabe cuál usar. Dos rutas, potencialmente dos experiencias divergentes.

### 3.2. Tareas dispersas: Reminders / Rutinas / Calendario
- `/reminders` (listado recordatorios)
- `/rutinas`, `/mascota/:petId/rutinas` (rutinas semanales)
- `/calendario` (vista unificada: reminders + rutinas + bookings + follow-ups)
- Home (cards "próximas tareas")
- **Problema**: 3+ rutas para lo mismo. Jerarquía unclear. El **Calendario es la vista más completa pero invisible** (no está en BottomTabBar, no tiene link prominente en Home).

### 3.3. Ficha clínica — legacy bien consolidado
- `/ficha/:petId` (actual)
- `/mascota/:petId/ficha-clinica` → redirect
- `/pet/:petId/clinical` → redirect
- `/medical-records` → redirect a `/ficha/:firstPetId`
- **Estado**: OK. Todos los legacy redirigen. No hay duplicación real.

---

## 4. Páginas huérfanas (no alcanzables desde navegación visible)

| Ruta | Archivo | Tipo | Cómo se accede hoy |
|---|---|---|---|
| `/panel-pro` | ProDashboard.tsx | Premium-only | Link en Home solo si Premium, invisible si Free |
| `/mascota/:petId/timeline` | PetTimeline.tsx | Owner | URL directa; no hay link desde Ficha ni My Pets |
| `/mascota/:petId/rutinas` | PetRoutines.tsx | Owner | URL directa; no linkeada desde `/rutinas` |
| `/reportes` | Reportes.tsx | Premium-only | Link solo si hay reportes generados |
| `/calendario` | UnifiedCalendar.tsx | Owner core | **SEMI-HUÉRFANA**: no en BottomTabBar, no link prominente |
| `/calendar` | (redirect) | Legacy | URL directa; redirige a `/mis-reservas` |
| `/settings` | (redirect) | Legacy | URL directa; redirige a `/profile` |
| `/medical-records` | MedicalRecords.tsx | Legacy | URL directa; redirige a `/ficha/:firstPetId` |
| `/analytics-demo` | AnalyticsDashboard.tsx | Internal | Admin, URL directa |

---

## 5. Features críticas: cuántos clicks para llegar

| Feature | Ruta efectiva | Clicks | Observación |
|---|---|---|---|
| Ver mascotas | Home → My Paws | 1 | BottomTabBar |
| Ficha clínica (1ra mascota) | Home (pet switcher) → Ficha | 1-2 | OK |
| Descargar PDF ficha (Premium) | Ficha → Compartir → Download | 4 | **Joya de la corona, relativamente enterrada** |
| Recordar tarea | Home → Recordar | 1 | BottomTabBar |
| Buscar vet | Home → Vets | 1 | BottomTabBar |
| Reservar vet | Ficha → CTA "Reservar" → mis-reservas | 3+ | Variantes: Servicios → vets → perfil → Reservar (4+) |
| Planificar semana (vista unificada) | `/calendario` | 1 | **Invisible** — requiere escribir URL |
| Ver rutinas | `/rutinas` | 1 | **Invisible** — no hay link |
| Compartir ficha (token 30d) | Ficha → Compartir → generate | 3 | OK |
| Descargar ZIP docs | Ficha → Compartir → ZIP | 4 | OK |
| Ver reporte semanal (Premium) | Home → link reporte | 1 | Oculto si Free |
| Upgrade a Premium | Home o Profile → Upgrade | 2 | Bien ubicado |
| Ver analytics (Premium) | Home → Panel Pro | 1 | Oculto si Free |

---

## 6. Principales páginas: estructura interna

- **HOME**: pet switcher holo, status card salud, TodayRoutinesCard, PriceEstimator, WeeklyReport (Premium), SeasonalTips, AnnualCareChecklist, links servicios, onboarding hints, trial banner, tutorial drawer.
- **MY PETS**: carrusel Paw Cards, PetCardMemorial, ClaimPetDialog, ShareWithVetModal, acciones Edit/Delete/Invite, AddPetGhostCard.
- **PET CLINICAL RECORD**: 8 tabs con query params (mode=vet, action=share|book), owner vs vet view, memorial flow, PDF lock (Premium).
- **UNIFIED CALENDAR**: CalendarGrid (mes), CalendarFilters (mascota, tipo), UnifiedDayView. Eventos: routine, reminder, booking, vet_booking, followup.
- **PROVIDER DASHBOARD**: QuickActionsBar, AlertsBanner, tabs Clínico/Negocios/Pacientes, stats, Next24hCard, ActivityFeed, ProviderBookingsInbox, NewPatientForm.
- **SERVICIOS**: grid estático (walkers, sitters, trainers, groomers, vets, precios, adopción).
- **DIRECTORIO VETS**: AdvancedServiceFilters, grid + mapa Leaflet, perfil vet detalle, rating, reseñas, CTA reservar.
- **ADMIN**: sidebar ~23 secciones, realtime, action tracking, CommandDialog search.

---

## 7. Entry points y flujos por rol

- **Owner**: `/` → `/auth` → post-login: `/onboarding-mascota` (si nuevo) o `/home` → explorar.
- **Provider**: `/para-veterinarios` → `/registro-veterinario` → `/onboarding-vet` → `/provider/dashboard`.
- **Admin**: `is_admin=true` en DB → `/admin`.

---

## 8. Hallazgos finales (crudos)

### Fortalezas
1. Entry points claros: Home como hub, BottomTabBar 5 funciones.
2. Roles bien separados por RoleGuard.
3. Deep linking robusto: `/ficha/:petId?mode=vet&action=share` funciona.
4. Redirects legacy bien resueltos.
5. Casi todo alcanzable en 2-3 clicks desde Home.

### Problemas (honesto)
1. **Directorio vets duplicado**: `/veterinarios` y `/services/vets` muestran lo mismo. Usuario no sabe cuál usar.
2. **Tareas dispersas sin jerarquía**: Reminders + Rutinas + Calendario = 3 rutas para lo mismo. **Calendario es invisible** (sin link en BottomTabBar ni Home).
3. **Ficha clínica (feature #1) sin shortcut**: owner va My Paws → Ficha (2-3 clicks). No hay tab directa en BottomTabBar, ni link "abrir ficha" prominente en Home.
4. **Features Premium que parecen rotas**: `/panel-pro` y `/reportes` no se muestran si Free → se sienten como rutas huérfanas. No hay CTA "desbloquea esto con Premium" en Home.
5. **Hub "Servicios" confuso**: `/servicios` (grid) vs `/services/:type` (directorio) vs `/veterinarios` (vets). ¿Dónde busco primero?
6. **Calendario no anunciado**: es powerful (unifica todo), pero nadie lo encuentra.
7. **Timeline y rutinas por mascota enterradas**: `/mascota/:petId/timeline` y `/mascota/:petId/rutinas` no linkeadas desde la ficha.
8. **Admin abrumador**: ~23 secciones en una sola UI. CommandDialog ayuda pero es mucho.
9. **Chat tras feature flag**: `/chat` solo si CHAT habilitado; no hay entry point en nav default.
10. **Owner-only rutas redirigen provider en silencio**: si un provider escribe `/paw-game`, lo tira a `/provider/dashboard` sin mensaje.

---

**Generado**: 2026-04-17 | **Basado en**: `src/App.tsx` (67 rutas), 70 pages, `Header.tsx`, `BottomTabBar.tsx`, `src/lib/links.ts`, `src/lib/routing.ts`.
