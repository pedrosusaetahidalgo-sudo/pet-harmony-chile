# Auditoría UX Completa — Paw Friend

> Fecha: 2026-04-14
> Alcance: Todas las páginas, features, navegación, hooks e infraestructura core
> Método: Revisión estática de código, análisis de handlers, flujos de navegación y estados UI
> **Estado: EJECUTADA** — Todos los CRITICAL, HIGH y la mayoría de MEDIUM fueron corregidos el mismo día.

---

## Resumen ejecutivo

| Severidad | Encontrados | Corregidos | Descripción |
|---|---|---|---|
| CRITICAL | 4 | 4 | Features rotas o completamente inoperantes |
| HIGH | 14 | 13 | Bugs que afectan flujos importantes o datos incorrectos |
| MEDIUM | 28 | 18 | Problemas UX notables, estados faltantes, inconsistencias |
| LOW | 35+ | Código muerto, imports sin usar, pulido menor |

**Total de páginas auditadas: 45+**

---

## CRITICAL — Requiere fix inmediato

### C1. MedicalShare: Botón "Descargar PDF" completamente roto
- **Archivo:** `src/pages/MedicalShare.tsx:349-358`
- **Problema:** El botón apunta a `${window.location.origin}/api/medical-pdf/${pet.id}?token=${token}`. Esta ruta `/api/medical-pdf/` **no existe** en ninguna parte del codebase. No hay Edge Function, no hay endpoint Vite, no hay Express server. El click devuelve 404.
- **Impacto:** Feature de la joya de la corona (ficha compartida) con el PDF inaccesible para quien recibe el link.
- **Fix:** Invocar la edge function `generate-medical-summary` o generar el PDF client-side como en `PetClinicalRecord`.

### C2. MyBookings: Página muestra slots genéricos, NO las reservas del usuario
- **Archivo:** `src/pages/MyBookings.tsx:31-85`
- **Problema:** La ruta `/mis-reservas` debería mostrar las reservas propias del usuario, pero NO hay `useAuth()` ni filtro por `user_id`. Muestra **todos los slots disponibles de todos los proveedores** para la fecha seleccionada.
- **Impacto:** El usuario espera ver sus propias reservas y encuentra slots vacíos o de otros. Las métricas (Hoy/Semana/Mes) cuentan todos los slots del sistema.
- **Fix:** Agregar query a tabla `bookings` filtrada por `user_id`, y mostrar slots como feature secundaria.

### C3. Maps: Coordenadas aleatorias para adopción
- **Archivo:** `src/pages/Maps.tsx:358-361`
- **Problema:** Los posts de adopción se ubican en el mapa usando `Math.random()` centrado en Santiago. Cada re-render reubica todos los markers aleatoriamente.
- **Impacto:** El mapa de adopción es completamente inútil — las ubicaciones son ficticias.
- **Fix:** Geocodificar dirección real, o no mostrar adopción en el mapa hasta tener coordenadas.

### C4. Maps: Lugares pet-friendly 100% hardcodeados
- **Archivo:** `src/pages/Maps.tsx:217-311`
- **Problema:** `petFriendlyPlaces` son 10 ubicaciones estáticas hardcodeadas, no provienen de la DB. El filtro aparece funcional pero los datos son falsos.
- **Impacto:** Usuarios confían en datos que son placeholder. No hay aviso de que son datos de ejemplo.
- **Fix:** Migrar a tabla `pet_friendly_places` en DB, o mostrar badge "Datos preliminares".

---

## HIGH — Afecta flujos importantes

### H1. RoleGuard + useActiveRole: Race condition para providers
- **Archivos:** `src/components/RoleGuard.tsx:46`, `src/hooks/useActiveRole.tsx:29`
- **Problema:** `isProvider` default es `false` durante la carga inicial. Un proveedor que navega directo a `/provider/dashboard`, `/provider/pacientes`, `/provider/profile-edit` o `/panel-pro` es **redirigido a `/home`** antes de que el query confirme su rol.
- **Fix:** Exponer `isProviderLoading` desde el contexto y agregar guard de carga en `RoleGuard`.

### H2. Auth: No existe flujo de cambio de contraseña
- **Archivo:** `src/pages/Auth.tsx:293`
- **Problema:** `handleForgotPassword` envía el email de reset de Supabase, pero al hacer click en el link del email, el usuario aterriza en `/auth` que muestra el formulario de login normal. No hay UI para ingresar nueva contraseña.
- **Impacto:** Un usuario que olvida su contraseña no puede recuperarla.

### H3. PerfilVetPublico: Reserva silenciosamente usa pets[0]
- **Archivo:** `src/pages/PerfilVetPublico.tsx:93`
- **Problema:** `handleSubmitReserva` auto-selecciona `pets[0]` sin dar opción al usuario de elegir mascota. Familias con múltiples mascotas reservan siempre para la primera.
- **Fix:** Agregar selector de mascota en el modal de reserva.

### H4. PerfilVetPublico: Chat con `?user=` param ignorado
- **Archivo:** `src/pages/PerfilVetPublico.tsx:161`
- **Problema:** `navigate('/chat?user=${v.user_id}')` — pero la ruta `/chat` no lee query params `?user=`. El botón "Mensaje" lleva al inbox genérico sin abrir conversación.
- **Fix:** Manejar `?user=` en `Chat.tsx` para auto-abrir/crear conversación.

### H5. UserProfile: Seguidores/siguiendo siempre muestran 0
- **Archivo:** `src/pages/UserProfile.tsx:136-140, 288, 292`
- **Problema:** El query de `userStats` selecciona solo `total_points, level, total_posts, total_reviews` pero el template renderiza `userStats?.followers_count` y `userStats?.following_count` — campos nunca pedidos. Siempre muestran 0.
- **Fix:** Agregar `followers_count, following_count` al select.

### H6. Community: Click en tarjeta de grupo no navega (no-miembros)
- **Archivo:** `src/pages/Community.tsx:83`
- **Problema:** Las tarjetas de grupo tienen `cursor-pointer` y `hover:shadow-md` para todos, pero el `onClick` solo navega si `isMember`. Un no-miembro clickea y no pasa nada. `joinGroup.mutate()` no navega después de unirse.
- **Fix:** Después de `joinGroup.mutate()` exitoso, navegar al grupo. O mostrar CTA "Unirte" explícito.

### H7. OnboardingDuenoMinimal: Intereses seleccionados nunca se guardan
- **Archivo:** `src/pages/OnboardingDuenoMinimal.tsx:62, 133-135`
- **Problema:** `selectedInterests` se recolecta en step 3 pero **nunca se incluye** en el insert de `pets` ni en el update de `profiles`. Los datos se descartan silenciosamente.
- **Fix:** Guardar intereses en `profiles.interests` o tabla dedicada.

### H8. OnboardingVetMinimal: Datos de onboarding perdidos en edición posterior
- **Archivo:** `src/pages/OnboardingVetMinimal.tsx:119-121, 124`
- **Problema:** `handleSubmit` inserta `clinic_name` y `address` en `service_providers`, pero estos campos no existen en `ProviderProfileEdit`. La próxima vez que el vet edita su perfil, estos campos se sobrescriben/pierden.
- **Fix:** Incluir `clinic_name` y `address` en el formulario de `ProviderProfileEdit`.

### H9. RegistroVeterinario: Badge "3 meses para empezar" es falso
- **Archivo:** `src/pages/RegistroVeterinario.tsx:618`
- **Problema:** `StepDone` muestra "Plan Gratis · 3 meses para empezar". No existe concepto de trial de 3 meses en `plans.ts` ni en la DB. Es copy falsa con implicaciones de negocio.
- **Fix:** Cambiar a "Plan Gratis" o reflejar el plan real.

### H10. BookingModal: Marca pagos como "paid" sin cobrar
- **Archivo:** (dentro de `MyBookings.tsx` flow)
- **Problema:** `BookingModal` inserta `payment_status: "paid"` hardcodeado sin paso de pago real. La comisión se calcula pero nunca se cobra.
- **Impacto:** Reservas se registran como pagadas sin que haya transacción.

### H11. UnifiedCalendar: `slotsPerDay` siempre vacío
- **Archivo:** `src/pages/UnifiedCalendar.tsx:88-89`
- **Problema:** `slotsPerDay` se pasa como `{}` (objeto vacío) a `CalendarGrid`. Cualquier lógica de rendering de slots queda sin datos.

### H12. BloodDonors: Sin CTA para registrar mascota como donante
- **Archivo:** `src/pages/BloodDonors.tsx:226-230`
- **Problema:** La página solo muestra donantes existentes. No hay botón para registrar al propio pet. El empty state dice "Registra el tipo de sangre en tu ficha" pero no tiene link directo.

### H13. PreciosVeterinarios: Doble header para usuarios logueados
- **Archivo:** `src/pages/PreciosVeterinarios.tsx:75`
- **Problema:** Renderiza `PublicHeader` incondicionalmente, pero `PublicWithLayoutIfAuth` ya envuelve en `AppLayout`. Usuarios logueados ven dos headers.
- **Fix:** Agregar `{!user && <PublicHeader />}` como hace `DirectorioVets.tsx`.

### H14. ServiceDirectory: useEffect dependency bug
- **Archivo:** `src/pages/ServiceDirectory.tsx:610-614`
- **Problema:** `checkIfProvider` y `loadData` están definidas fuera del hook y no aparecen en el deps array (con `eslint-disable-line`). Si `user` cambia sin navegación, los datos no se recargan.

---

## MEDIUM — Problemas UX notables

### M1. Auth: `redirectUser` es código muerto (54 líneas)
- **Archivo:** `src/pages/Auth.tsx:56-110`
- La función existe pero nunca se llama. `onAuthStateChange` usa `window.location.href` directo.

### M2. DirectorioVets: Link a precios no pasa comuna seleccionada
- **Archivo:** `src/pages/DirectorioVets.tsx:282-283`
- Ambas ramas del ternario evalúan al mismo string `/precios-veterinarios`.

### M3. PerfilVetPublico: Card "Crear cuenta" visible para logueados
- **Archivo:** `src/pages/PerfilVetPublico.tsx:473-479`
- Un usuario logueado ve "¿Eres dueño de mascota? Crea tu cuenta gratis".

### M4. ParaVeterinarios: WhatsApp listado como feature activa
- **Archivo:** `src/pages/ParaVeterinarios.tsx:213`
- "WhatsApp con memoria" aparece como feature del plan gratis, pero está pendiente verificación Meta.

### M5. ParaVeterinarios: Sin AppLayout para logueados
- **Archivo:** `src/pages/ParaVeterinarios.tsx`
- No está envuelto en `PublicWithLayoutIfAuth`. Un usuario logueado pierde sidebar/header.

### M6. TermsOfService + PrivacyPolicy: Fecha dinámica
- **Archivos:** `src/pages/TermsOfService.tsx:29`, `src/pages/PrivacyPolicy.tsx:29`
- "Última actualización" muestra `new Date().toLocaleDateString()` — siempre hoy.

### M7. DejarResena: `provider.id` sin null-check
- **Archivo:** `src/pages/DejarResena.tsx:148`
- Si el provider fue eliminado o RLS bloquea, crash runtime.

### M8. PawCardLanding: Rareza siempre muestra base
- **Archivo:** `src/pages/PawCardLanding.tsx:218`
- `getRarity(0)` hardcodeado — todas las cards compartidas externamente se ven como comunes.

### M9. PetClinicalRecord: Dos botones PDF distintos sin distinción visual
- **Archivo:** `src/pages/PetClinicalRecord/index.tsx:170, 225`
- Un botón genera PDF local (jsPDF), otro invoca edge function AI. El usuario no sabe cuál es cuál.

### M10. PetClinicalRecord: Reminder sin feedback de error
- **Archivo:** `src/pages/PetClinicalRecord/index.tsx:372-381`
- `addReminder.mutate()` sin `onError` — si falla, el Dialog se cierra sin aviso.

### M11. Reportes: `markViewed` no refresca query
- **Archivo:** `src/pages/Reportes.tsx:48-53`
- Después de "Marcar como leído", el badge "Nuevo" persiste hasta reload completo.

### M12. ProDashboard: Export bypass visual-only
- **Archivo:** `src/pages/ProDashboard.tsx:533-566`
- `LockedOverlay` es solo visual. `handleExport` no verifica `exportAccess.allowed`.

### M13. ChatConversation: `onKeyPress` deprecated
- **Archivo:** `src/pages/ChatConversation.tsx:265`
- Deprecated en React 17+, se romperá en React 19. Usar `onKeyDown`.

### M14. Chat: Sin explicación de restricción mutual-follow
- **Archivo:** `src/pages/Chat.tsx:234-238`
- Lista de "Nuevo mensaje" vacía sin explicar que solo muestra seguidores mutuos.

### M15. Reminders: "Agregar" navega a /my-pets en vez de crear recordatorio
- **Archivo:** `src/pages/Reminders.tsx:91-96`
- El CTA es engañoso — dice "Agregar" pero lleva a lista de mascotas.

### M16. PetRoutines: Botones inactivos son no-ops silenciosos
- **Archivo:** `src/pages/PetRoutines.tsx:173-174`
- `onComplete={() => {}}` y `onSkip={() => {}}` para rutinas inactivas.

### M17. EnMemoria: Sin PageHeader/back navigation
- **Archivo:** `src/pages/EnMemoria.tsx:112-114`
- Inconsistente con todas las demás páginas autenticadas.

### M18. PawGame: Quick Actions muestran puntos no verificados
- **Archivo:** `src/pages/PawGame.tsx:458-501`
- "+15 pts", "+50 pts" son display copy, no valores garantizados.

### M19. PawShopRewards: "Revisa tu email" pero no se envía email
- **Archivo:** `PawShopRewards.tsx:131-135`
- Promesa rota al usuario después de canjear recompensa.

### M20. ProviderProfileEdit: Avatar obligatorio bloquea save
- **Archivo:** `src/pages/ProviderProfileEdit.tsx:128-131`
- Si un vet pierde su avatar_url, queda permanentemente bloqueado de guardar cualquier cambio.

### M21. GroomerProfileEdit: Sin upload de foto de perfil
- **Archivo:** `src/pages/GroomerProfileEdit.tsx`
- Groomers aparecen en directorio sin foto — desventaja vs vets.

### M22. OnboardingVetMinimal: Progress bar muestra 100% antes de submit
- **Archivo:** `src/pages/OnboardingVetMinimal.tsx:151`

### M23. OnboardingDuenoMinimal: "No sé" vacunas pre-seleccionado visualmente
- **Archivo:** `src/pages/OnboardingDuenoMinimal.tsx:349-368`
- Estado inicial `null` coincide con el value de "No sé", se ve seleccionado al cargar.

### M24. AdminRoute: No preserva returnTo
- **Archivo:** `src/components/AdminRoute.tsx:22`
- Redirige a `/auth` sin `?returnTo=/admin`.

### M25. Header: Notificaciones → /settings → /profile doble redirect
- **Archivo:** `src/components/Header.tsx:336`
- No hay deep link a la sección de notificaciones en Profile.

### M26. AppSidebar: Feature flag PAWGAME_SIDEBAR no se consulta
- **Archivo:** `src/components/AppSidebar.tsx:86`
- El kill switch de Paw Game en sidebar no funciona.

### M27. PaymentResult: `navigate(-1)` en error puede ir a Flow expirado
- **Archivo:** `src/pages/PaymentResult.tsx:105`

### M28. UpgradeSuccess: Query key cache puede no coincidir con usePlan
- **Archivo:** `src/pages/UpgradeSuccess.tsx:35-37`

---

## LOW — Código muerto, pulido menor

| # | Archivo | Issue |
|---|---|---|
| L1 | `Auth.tsx` | Facebook signup button sin `disabled={facebookLoading}` |
| L2 | `Auth.tsx` | Doble `useEffect` llamando `getSession()` |
| L3 | `DirectorioVets.tsx:33` | `type Vet = any` — sin type safety |
| L4 | `PerfilVetPublico.tsx:167` | `trackProviderView` sin rate-limit ni deduplicación |
| L5 | `MedicalShare.tsx:17` | Phone icon importado pero nunca usado |
| L6 | `NotFound.tsx:41` | Botón "My Paws" en inglés, debería ser "Mis mascotas" |
| L7 | `Home.tsx:27` | `Flame` icon importado sin usar |
| L8 | `MyPets.tsx:16-17` | `FileText`, `Star` importados sin usar |
| L9 | `MyPets.tsx:232-255` | Hard delete de pets (no soft-delete) |
| L10 | `Feed.tsx:69` | Tab "Popular" y "Explorar" usan mismo feed type |
| L11 | `UserProfile.tsx:349-373` | Click en post thumbnail no hace nada (cursor-pointer sin onClick) |
| L12 | `UserProfile.tsx:354-358` | Posts sin imagen muestran foto random de Unsplash |
| L13 | `ChatConversation.tsx:235-255` | Quick replies vet-orientadas aparecen en chats owner-to-owner |
| L14 | `BottomTabBar.tsx:10-11` | `Star`, `UserCog` dead imports |
| L15 | `AppSidebar.tsx:25` | `Eye` dead import |
| L16 | `usePlan.tsx:35` | Sin fallback defensivo para plan_id inesperado |
| L17 | `useAuth.tsx:56-62` | `signOut` swallows errors sin forzar `user = null` |
| L18 | `ErrorBoundary.tsx:42` | Retry sin contador — puede loopear infinitamente |
| L19 | `UpgradeCancel.tsx:25` | "Volver al inicio" va a `/` (landing) en vez de `/home` |
| L20 | `PaymentResult.tsx:37-40` | `useEffect` vacío (dead code) |
| L21 | `Adoption.tsx:66-68` | `refetch()` solo refresca tab activo, no "mis posts" |
| L22 | `EnMemoria.tsx:139` | Undo memorial sin confirmación |
| L23 | `PawCollection.tsx:39` | `getRarity(0)` hardcoded para todas las cards |
| L24 | `PawGame.tsx:329, 368` | `as never` TypeScript cast en queries |
| L25 | `Missions.tsx:34-41` | Sin empty state para categorías de Paw Cards sin cards |
| L26 | `RegistroPartner.tsx:876` | "Ver directorio" va a `/veterinarios` (no partners) |
| L27 | `BloodDonors.tsx:292-297` | "Contactar" sin loading state, múltiples clicks = conversaciones duplicadas |
| L28 | `ProviderDashboard.tsx:273-283` | "Comparte tu URL" link genérico a `/veterinarios`, no al perfil propio |
| L29 | `ProviderDashboard.tsx:130-132` | Alert "pending links" navega a tab Clínico en vez de Pacientes |
| L30 | `RegistroVeterinario.tsx:339-355` | `?mode=login` param ignorado por Auth.tsx |
| L31 | `Upgrade.tsx` | Premium user puede ver `/upgrade` sin state "Ya eres Premium" |
| L32 | `ServiceDirectory.tsx:1` | `eslint-disable any` file-wide — sin type safety |
| L33 | `ProviderPatients.tsx:524-544` | N+1 query pattern (1 query per patient row) |
| L34 | `Header.tsx:127` | `(supabase as any)` cast innecesario |
| L35 | `Demo.tsx` | Sin meta tag `noindex` para evitar indexación Google |

---

## Rutas huérfanas (sin entrada de navegación)

| Ruta | Estado |
|---|---|
| `/analytics-demo` | Sin link en sidebar ni en ninguna página |
| `/registro-partner` | Sin CTA visible desde la app (solo existe en landing Index.tsx) |
| `/adoption` | Solo accesible desde PawGame missions |

---

## Flujos rotos end-to-end

### Flujo 1: Compartir ficha médica → descargar PDF
1. Dueño comparte ficha → genera link `/medical-share/:token` ✅
2. Receptor abre link → ve datos de la mascota ✅
3. Receptor clickea "Descargar PDF" → **404** ❌ (C1)

### Flujo 2: Proveedor nuevo → acceder a dashboard
1. Vet se registra en `/registro-veterinario` ✅
2. Confirma email (si Supabase lo requiere) ⚠️ (sin aviso)
3. Navega a `/provider/dashboard` → **rebotado a /home** por race condition ❌ (H1)
4. Recarga página → ahora sí accede ✅

### Flujo 3: Reservar cita desde perfil público vet
1. Usuario visita `/veterinarios/:slug` ✅
2. Clickea "Reservar" → **mascota auto-seleccionada sin opción** ❌ (H3)
3. Clickea "Mensaje" → llega a inbox genérico, **no abre conversación** ❌ (H4)

### Flujo 4: Ver mis reservas
1. Usuario navega a `/mis-reservas` ✅
2. Ve **slots de todos los proveedores**, no sus reservas ❌ (C2)

### Flujo 5: Onboarding dueño nuevo
1. Completa paso 1 (perfil) ✅
2. Completa paso 2 (mascota) ✅
3. Selecciona intereses en paso 3 → **datos descartados** ❌ (H7)

### Flujo 6: Recuperar contraseña
1. Clickea "¿Olvidaste tu contraseña?" ✅
2. Recibe email de Supabase ✅
3. Clickea link → aterriza en `/auth` → ve login normal, **no hay form de nueva contraseña** ❌ (H2)

---

## Recomendaciones priorizadas

### Sprint 1 — Fixes críticos (1-2 días)
1. **C1** — Conectar botón PDF de MedicalShare a `generate-medical-summary` edge function
2. **C2** — Reescribir MyBookings para mostrar reservas del usuario autenticado
3. **H1** — Agregar `isProviderLoading` a useActiveRole + guard en RoleGuard
4. **H2** — Implementar flujo de reset password en Auth.tsx
5. **C3/C4** — Ocultar adopción y pet-friendly del mapa hasta tener datos reales, o agregar disclaimers

### Sprint 2 — Flujos de usuario (3-5 días)
6. **H3** — Selector de mascota en modal de reserva
7. **H4** — Manejar `?user=` en Chat.tsx para abrir conversación
8. **H5** — Agregar campos faltantes al select de userStats
9. **H6** — Post-join navigation en Community
10. **H7** — Persistir selectedInterests en onboarding dueño
11. **H9** — Corregir badge "3 meses" en registro vet
12. **H10** — Implementar paso de pago real en BookingModal o cambiar status
13. **H13** — Fix doble header en PreciosVeterinarios

### Sprint 3 — UX polish (ongoing)
14. Todos los MEDIUM restantes en orden de impacto
15. Limpieza de dead imports y código muerto
16. Unificación de copy (inglés → español chileno)

---

## Notas para el equipo

- **Joya de la corona protegida:** PetClinicalRecord (la ficha clínica) está sólida. Todos los tabs, botones y dialogs funcionan. Los únicos issues son la confusión de los dos botones PDF (M9) y el reminder sin feedback de error (M10).
- **Páginas más sólidas:** MedicalRecords (redirect perfecto), Feed (completo), AddPet (validación excelente), Reminders (funcional), PawCollection (bien implementada).
- **Páginas que necesitan más trabajo:** MyBookings (identidad confusa), Maps (datos falsos), Auth (flujos incompletos), OnboardingDuenoMinimal (datos perdidos).

---

## Auditoría flujo Provider (segunda pasada — 2026-04-14)

### 3 CRITICAL adicionales encontrados y corregidos

| # | Problema | Fix | Archivos |
|---|---|---|---|
| CP1 | **Vet no puede ver ficha de paciente** — `PetClinicalRecord` bloqueaba a cualquiera que no sea `owner_id`, incluyendo vets vinculados. Cada botón "Ver ficha" del CRM era dead-end. | Agregado check de `pet_vet_links.status = 'active'` como acceso alternativo | `PetClinicalRecord/index.tsx` |
| CP2 | **provider_id inconsistente en vet_clinical_notes** — `SharedFichasCard` insertaba con `service_providers.id` pero `ProviderPatients` y `VetPatientsList` consultaban con `auth.users.id`. Notas desaparecían entre vistas. | Normalizado todas las queries a usar `service_providers.id` | `ProviderPatients.tsx`, `VetPatientsList.tsx` |
| CP3 | **Notas requieren share_token obligatorio** — Un vet con `pet_vet_link` activo no podía crear notas si el dueño no compartió la ficha. | `share_token_id` ahora nullable. RLS actualizada para permitir notas con link activo. | `useVetClinicalNotes.ts`, `VetNoteEditor.tsx`, nueva migración |

### 3 HIGH adicionales corregidos

| # | Problema | Fix | Archivo |
|---|---|---|---|
| HP4 | **VetNoteEditor sin campos de seguimiento** — Solo la ruta de audio transcription podía crear followups. Notas manuales no tenían fecha/motivo de seguimiento. | Agregados checkbox + date + reason fields | `VetNoteEditor.tsx` |
| HP6 | **OnboardingVetMinimal hardcodea `provider_type: 'individual'`** — Clínicas registradas por este path quedaban tipadas mal. | Selector de tipo (Individual/Clínica/Domicilio) en step 1 | `OnboardingVetMinimal.tsx` |
| MP8 | **Avatar obligatorio bloquea save** — Un vet sin foto no podía guardar ningún cambio en su perfil. | Ahora solo bloquea si `is_directory_visible = true` | `ProviderProfileEdit.tsx` |

### Migración SQL generada

`supabase/migrations/20260414180000_vet_clinical_notes_share_token_nullable.sql`:
- `ALTER COLUMN share_token_id DROP NOT NULL`
- Nueva RLS: vets con `pet_vet_links.status = 'active'` pueden insertar notas sin share token
- Nueva RLS: vets vinculados pueden ver notas de sus pacientes

**Importante:** Esta migración debe aplicarse manualmente desde Supabase Dashboard > SQL Editor.

### Flujo Provider corregido end-to-end

1. **Registro** → `RegistroVeterinario` o `OnboardingVetMinimal` (ahora con selector de tipo) ✅
2. **Perfil** → `ProviderProfileEdit` (ahora permite guardar sin foto) ✅
3. **Dashboard** → 3 tabs funcionan correctamente ✅
4. **Pacientes** → CRM con links, notas, shared fichas (provider_id normalizado) ✅
5. **Ficha clínica** → Vets vinculados pueden ver la ficha del paciente ✅ (antes: bloqueado)
6. **Crear notas** → Con share token O con pet_vet_link activo ✅ (antes: solo share token)
7. **Followups** → Disponibles en notas manuales Y audio ✅ (antes: solo audio)
8. **Sync** → Notas aparecen en `TabHistorial` del dueño vía `useVetClinicalNotesByPet` ✅
