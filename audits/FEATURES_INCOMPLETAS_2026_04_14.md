# Auditoria de Features Incompletas — Paw Friend

> Fecha: 2026-04-14
> Metodo: 5 agentes paralelos auditando placeholders, Supabase, rutas, social/gamificacion, y flujos de negocio.
> Estado: pendiente de ejecucion.

---

## NIVEL CRITICO — Feature existe pero no funciona

| # | Feature | Problema | Archivos clave | Estado |
|---|---------|----------|----------------|--------|
| **C1** | En Memoria / Memorial | Schema DB completo (`memorial_events`, `bereavement_safety_logs`, campos en `pets`) pero CERO componentes UI. No hay interfaz para registrar fallecimiento ni ver memorial. | `supabase/migrations/20260420000000_memorial_module.sql` — sin pages/components | Pendiente |
| **C2** | Misiones (PawGame) | 4 tipos de mision devuelven progreso hardcodeado `= 0`: `collect_rarity`, `collect_all_rarities`, `be_collected`, `collect_owners`. El usuario nunca ve avance. | `src/hooks/useMissions.ts:111-130` | Pendiente |
| **C3** | Paw Card Rarity | Todas las cards muestran la misma rareza porque usan `getRarity(0)` en vez de paw_points reales. En zoom tambien hardcodeado `score={0}`. | `src/pages/PawCollection.tsx:38, 267` | Pendiente |
| **C4** | Analytics PDF Export | El boton "Exportar PDF" del ProDashboard genera HTML y abre `window.print()`. No produce un PDF real. CSV si funciona. | `src/pages/ProDashboard.tsx:168-244` | Pendiente |
| **C5** | Weekly Reports (Cron) | Edge functions `generate-weekly-owner-reports` y `generate-weekly-vet-reports` estan deployadas pero sin cron schedule configurado. Nunca se ejecutan. | `supabase/functions/generate-weekly-owner-reports/`, `generate-weekly-vet-reports/` | Pendiente |
| **C6** | medical-suggestions | Edge function existe pero nunca se invoca desde el frontend. Feature huerfana. | `supabase/functions/medical-suggestions/index.ts` | Pendiente |
| **C7** | Medical ZIP Export | Edge function `generate-medical-zip` existe pero no hay boton ni UI que la invoque. | `supabase/functions/generate-medical-zip/index.ts` | Pendiente |

---

## NIVEL ALTO — Feature parcialmente rota

| # | Feature | Problema | Archivos clave | Estado |
|---|---------|----------|----------------|--------|
| **A1** | Gamificacion / Puntos | Sistema inconsistente: algunos flujos usan RPC `award_points`, otros insertan directo a `paw_point_transactions`, otros no hacen nada. No hay trigger automatico para la mayoria de acciones. `awardPoints()` en gamification.ts es placeholder. | `src/lib/gamification.ts:72-81` | Pendiente |
| **A2** | Google Calendar Sync (Providers) | Para duenos funciona OK. Para proveedores, `ProviderAvailabilityManager` muestra toast "Esta funcion estara disponible proximamente". | `src/components/ProviderAvailabilityManager.tsx:112` | Pendiente |
| **A3** | Vet Booking — direccion y precio | Al reservar con un vet, `visit_address` = "A coordinar con el veterinario" y `total_price` = 0 hardcodeados. No hay campos de formulario. | `src/pages/PerfilVetPublico.tsx:127-142` | Pendiente |
| **A4** | post_saves | Feed intenta guardar posts en tabla `post_saves` que podria no existir. El codigo maneja el error silenciosamente (catch 42P01). | `src/hooks/useFeedActions.ts:80` | Pendiente |
| **A5** | user_blocks — sin unblock | Se puede bloquear usuario (INSERT) pero no existe mutacion para desbloquear (DELETE). | hook `useBlockedUsers` — falta `unblock` mutation | Pendiente |
| **A6** | Tabla content_reports | Feed usa `content_reports` con cast `.any`, existencia de la tabla no verificada. | `src/hooks/useFeedActions.ts:127` | Pendiente |

---

## NIVEL MEDIO — Gaps funcionales y deuda tecnica

| # | Feature | Problema | Archivos clave | Estado |
|---|---------|----------|----------------|--------|
| **M1** | USER_PREMIUM = false | Feature flag desactivado = premium gratis para todos. Gate funcional pero nunca bloquea. Decision intencional del "pivot medico" pero deja el flujo de upgrade sin sentido practico. | `src/lib/featureFlags.ts:16` | Pendiente |
| **M2** | Adoption — sin status update | Se puede crear post y marcar interes, pero no hay flujo para marcar "adoptado" ni actualizar estado. | `src/pages/Adoption.tsx` | Pendiente |
| **M3** | Reviews — sin entry point in-app | Solo se puede dejar resena via token de invitacion. No hay boton "Dejar resena" despues de una cita completada. | `src/pages/DejarResena.tsx` | Pendiente |
| **M4** | community_group_members — sin leave | Se puede unir a grupo comunitario pero no hay DELETE/salir del grupo. | tabla `community_group_members` | Pendiente |
| **M5** | Tablas DB sin frontend | ~15 tablas creadas en migraciones sin ningun uso en frontend: `walk_bookings`, `walk_routes`, `walk_reports`, `walk_reviews`, `trainer_profiles`, `training_bookings`, `training_reviews`, `training_reports`, `daily_challenges`, `user_challenges`, `virtual_routes`, `user_routes`, `vet_visits`, `vet_documents`, `pet_documents`, `appointments`. | Multiples migraciones SQL | Pendiente |
| **M6** | Archivos huerfanos | `Settings.tsx` y `Actividad.tsx` existen como archivos pero no estan en rutas ni se importan. | `src/pages/Settings.tsx`, `src/pages/Actividad.tsx` | Pendiente |
| **M7** | Standalone AnalyticsDashboard | Pagina con 100% datos mock, no integrada en rutas. Demo interno sin conexion a Supabase. | `src/pages/standalone/AnalyticsDashboard.tsx` | Pendiente |

---

## Lo que SI funciona bien (verificado)

- Feed social (posts, likes, comments, search, real-time)
- Chat (mensajes real-time, mutual follow check, block check)
- Adopcion (crear post, fotos, interes)
- Booking/Reservas (browse, book, calendar, metricas)
- Resenas (via token de invitacion)
- Donantes de sangre (busqueda, filtros, contacto)
- Ficha medica PDF (generacion, descarga, premium gate)
- Medical share links (crear, expirar, revocar)
- QR codes (generar, escanear, access control por rol)
- WhatsApp reminders (cron diario, opt-in, logging)
- Provider dashboard (datos reales, no mock)
- Pagos Flow.cl (idempotente, webhook seguro)
- Navegacion (0 dead ends, 0 redirect loops)

---

## Orden de ejecucion sugerido

### Ronda 1 — Quick wins (impacto alto, esfuerzo bajo)
- C2: Completar logica de misiones en `useMissions.ts`
- C3: Conectar paw_points reales a rarity en `PawCollection.tsx`

### Ronda 2 — Features core incompletas
- C1: Crear UI completa para Memorial (En Memoria)
- A1: Unificar sistema de gamificacion/puntos
- A5: Agregar mutacion unblock a `useBlockedUsers`

### Ronda 3 — Backend/infra
- C5: Configurar cron para weekly reports en Supabase Dashboard
- C6: Conectar `medical-suggestions` al frontend o eliminar
- C7: Agregar boton para ZIP export en ficha clinica

### Ronda 4 — UX polish
- C4: PDF export real con pdf-lib (reemplazar window.print)
- A2: Google Calendar sync para proveedores
- A3: Campos visit_address y total_price en booking form
- M2: Flujo de status update en adopcion
- M3: Boton "Dejar resena" post-cita
- M4: Boton "Salir del grupo" en comunidades

### Ronda 5 — Limpieza
- A4: Crear migracion para tabla `post_saves` si no existe
- A6: Crear migracion para tabla `content_reports` si no existe
- M6: Eliminar archivos huerfanos (`Settings.tsx`, `Actividad.tsx`)
- M7: Decidir si integrar o eliminar `AnalyticsDashboard` standalone
- M5: Documentar o eliminar tablas DB sin frontend
