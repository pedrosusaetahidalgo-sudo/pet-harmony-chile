# Mapa de flujos Paw Friend — 2026-04-19

> **Propósito**: documento ejecutivo para Pedro (fundador) que mapea páginas,
> features, navegación y flujos end-to-end. Identifica gaps y propone ajustes
> concretos priorizados hacia el lanzamiento del **1 de mayo 2026**.
>
> Actualizado: 2026-04-19 tras pivot a modelo híbrido (donaciones + Paw Member
> opcional + B2B vets/clínicas + Paw Companys + Paw Voices + Paw Partners +
> publicidad).

---

## 1. Snapshot ejecutivo

| Métrica | Valor |
|---|---|
| Rutas totales en App.tsx | 75 |
| Páginas activas (en sidebar/bottom) | ~30 |
| Páginas legacy / deshabilitadas via flag | 10+ |
| Rutas huérfanas (sin link) | 4 (`/onboarding-mascota`, `/onboarding-vet`, `/medical-records` legacy, `/analytics-demo`) |
| Secciones admin | 13 (en 5 grupos) |
| Monetización activa | 5 motores (donaciones + Paw Member + B2B vets + Paw Companys + Paw Voices) + publicidad prep |
| Alianzas activas | 3 (Voices + Companys + Partners) |

**Estado TSC/tests/build**: 0 errores · 347 tests verdes · Admin chunk 680 kB.

---

## 2. Mapa de páginas por categoría

### 🟢 Públicas sin login (12)

| Ruta | Archivo | Qué hace |
|---|---|---|
| `/` | `Index.tsx` | Landing principal |
| `/auth` | `Auth.tsx` | Login/Register |
| `/veterinarios` (+ filtros) | `DirectorioVets.tsx` | Directorio público vets con search |
| `/veterinarios/:slug` | `PerfilVetPublico.tsx` | Perfil público vet |
| `/para-veterinarios` | `ParaVeterinarios.tsx` | Sales B2B |
| `/precios-veterinarios` | `PreciosVeterinarios.tsx` | Estimador público |
| `/registro-veterinario` · `/registro-partner` | `RegistroVeterinario.tsx`, `RegistroPartner.tsx` | Signup B2B |
| `/paw-voices` 🆕 | `PawVoices.tsx` | Landing creadores + form |
| `/paw-companys` 🆕 | `PawCompanysPage.tsx` | Landing empresas + form |
| `/terms` · `/privacy` · `/delete-account` | Legales | Compliance CL |
| `/qr/:token` · `/paw-card/:id` · `/medical-share/:token` · `/resena/:token` | Deeplinks con token | Landings post-escaneo |

### 🔵 Protegidas dueño (27)
Home, Feed, My Pets, Add/Edit Pet, Ficha Clínica, Medical Records (legacy), Calendario, Reminders, Rutinas, Services/:type, Maps, Chat, Adoption, Donantes Sangre, **Donaciones**, **Paw Member** 🆕, **Paw Core** 🆕, Paw Game, Paw Collection, Missions, Mis Reservas, Profile, User Profile, Servicios, Groomer Profile Edit, Reportes, En Memoria.

### 🩺 Protegidas provider (5)
Provider Dashboard, Provider Pacientes, Provider Profile Edit, Panel Pro (analytics), Analytics Demo (standalone).

### 🔒 Admin (2)
Admin (13 secciones), Demo.

### 🔁 Redirects legacy (8)
`/mascota/:petId/ficha-clinica` → `/ficha/:petId`, `/settings` → `/profile`, `/upgrade` → `/paw-member`, `/calendar` → `/mis-reservas`, etc.

---

## 3. Navegación

### Sidebar dueño (orden actual)
**Core siempre visible** (6): Inicio, Mis Mascotas, Buscar vet, Calendario, Mis reservas, Recordatorios.
**Explorar colapsable** (sub-grupos): Día a día, Servicios, Social (deshabilitado por flags), Causas, Paw Labs.
**Footer**: "Apoyar Paw Friend" CTA · Paw Member · Paw Core · Configuración · Cerrar sesión.

### Bottom tabs mobile (5 tabs)
Owner: Inicio · My Paws · Servicios · Agenda · Perfil.
Provider: Dashboard · Pacientes · Reservas · Mensajes · Perfil.

### Admin sidebar (13 secciones en 5 grupos)
**Core** (Dashboard, Sala Inversión, Analytics), **Ops** (Reservas, Proveedores, Usuarios, Finanzas), **Content** (Contenido, Gamificación), **Growth** (Comercial, Leads Vets), **System** (Exports, Sistema).

---

## 4. Flujos end-to-end críticos

| # | Flujo | Estado |
|---|---|---|
| 1 | Onboarding dueño nuevo: `/` → `/auth` → `/home` → `/add-pet` → `/ficha/:id` | ✅ Funcional |
| 2 | Ficha clínica + PDF: `/my-pets` → `/ficha/:id` → "Descargar PDF" → file | ✅ Funcional |
| 3 | Donación: `/donaciones` → Flow → `?status=success` + badge + Paw Points | ✅ Funcional (migrations aplicadas) |
| 4 | Aplicar Paw Voice: `/paw-voices` form → admin aprueba → activa | ✅ Funcional |
| 5 | Aplicar Paw Company: `/paw-companys` form → admin aprueba → grid | ✅ Funcional |
| 6 | Vet crea paciente huérfano → email invite → claim → sync | ✅ Funcional |
| 7 | Booking vet: `/veterinarios/:slug` → Flow → `/payment-result` | ⚠️ Booking flow funciona pero revisar copy pricing |

---

## 5. 🔴 Problemas detectados — priorizados

### P0 — bloqueantes antes del lanzamiento 1 mayo

| # | Problema | Dónde | Acción propuesta |
|---|---|---|---|
| 1 | **PremiumGate/PremiumNudge con copy "Desbloquear con Premium"** en 11 archivos, inconsistente con el modelo "todo gratis + Paw Member voluntario" | `PremiumGate.tsx`, `PremiumNudge.tsx`, `Home.tsx`, `WeeklyReportCard.tsx`, `MedicalSummaryButton.tsx`, `BreedTips.tsx`, `VaccinationCardOCR.tsx`, `PetAssistant.tsx`, `TabHistorial.tsx`, `TabCompartir.tsx`, `Reminders.tsx` | **Opción A** (recomendada): como `USER_PREMIUM=false` ya hace que todo pase sin bloqueo, cambiar copy a "post-uso nudge": "¿te sirvió? considera apoyar" con link a `/donaciones` o `/paw-member`. No bloquear nunca |
| 2 | **Copy legacy "Premium"** en contextos B2C | `BookingModal.tsx` ("Con Premium pagas $0 tarifa"), `ProfileSettingsList.tsx` ("Mejorar a Premium"), `AdminSalaInversion.tsx` (serie "Premium B2C pagos") | Reemplazar por "Paw Member" o eliminar si ya no aplica |
| 3 | **Admin no muestra badge pendientes de Paw Voices/Companys** en Dashboard topbar | `Admin.tsx` pendingCount solo cuenta `providers+verifications+moderation` | Extender `useAdminPendingCounts()` con `paw_voices{status=pending}` + `paw_companys{status=pending}` |

### P1 — importante para UX coherente

| # | Problema | Dónde | Acción propuesta |
|---|---|---|---|
| 4 | **Sidebar mobile no incluye Paw Member** (solo desktop) | `BottomTabBar.tsx` | Opción: cambiar "Perfil" por "Paw Member" o agregar entrada en perfil |
| 5 | **Landing `/` (Index) no menciona Paw Voices/Companys/Partners** como CTAs para stakeholders | `Index.tsx` | Agregar sección "¿Cómo sumarte?" con 5-6 roles y sus CTAs (similar al que agregamos en `/paw-core`) |
| 6 | **Paw Labs (misiones/game/collection)** roba protagonismo en sidebar, pero son beta/experimentales | `AppSidebar.tsx` sub-grupo Paw Labs | Mover a grupo "Beta 🧪" colapsado por default, no expandido |
| 7 | **`/panel-pro`** protegido con feature flag pero sin entry point claro | Solo linkado desde `/provider/dashboard` business tab | Considerar integrar en sidebar provider como "Analytics Pro" o eliminar si es stub |
| 8 | **Copy "Individual" legacy en FAQ ParaVeterinarios** | `ParaVeterinarios.tsx:89` | Reemplazar por "Premium" (ya hecho hoy) |

### P2 — nice-to-have post-lanzamiento

| # | Problema | Dónde | Acción |
|---|---|---|---|
| 9 | **Rutas huérfanas** (`/onboarding-mascota`, `/onboarding-vet`, `/analytics-demo`) sin link en nav | App.tsx | Mantener para deeplinks o eliminar según decisión |
| 10 | `/medical-records` legacy redundante con `/ficha/:petId` | `App.tsx` | Verificar si redirige o consolidar |
| 11 | **Map features deshabilitadas** (`MAP_PET_FRIENDLY=false`, `LOST_PETS_SECTION=false`) | `featureFlags.ts` | Decidir si reactivar post-lanzamiento o eliminar código |
| 12 | **Social disabled** (Feed + Chat + Community flags=false) | `featureFlags.ts` | Decidir: ¿se reactiva o se elimina? Código pesado en bundle si no se usa |

---

## 6. 🎯 Propuestas de ajuste priorizadas

### Antes del 1 mayo (crítico — 3-5 horas de dev)

1. **Convertir PremiumGate a DonateNudge post-uso** (no bloquear nunca):
   - Cuando `USER_PREMIUM=false` (hoy), mostrar pill "¿Te sirvió? Apoya Paw Friend ❤️" con link `/donaciones` o `/paw-member` en el footer de cada feature valiosa (ficha PDF, analytics, breed tips, OCR, weekly report).
   - **No bloquear el feature**. Es un recordatorio suave post-uso, no un paywall.

2. **Limpiar copy "Premium" B2C** en los 3 lugares identificados (BookingModal, ProfileSettingsList, AdminSalaInversion).

3. **Agregar pendingCount de Paw Voices/Companys** al topbar admin. Query:
   ```sql
   SELECT COUNT(*) FROM paw_voices WHERE status='pending'
   SELECT COUNT(*) FROM paw_companys WHERE status='pending'
   ```

4. **Sección "¿Cómo sumarte?" en `/` (Index)** con 6 roles (Dueño, Vet, Profesional no-vet, Paw Voice, Paw Company, Paw Partner). Mismo componente `RoleTile` que ya existe en `/paw-core`.

5. **Verificar copy en PreciosVeterinarios.tsx** — el estimador público sigue usando naming legacy.

### Post-lanzamiento (cuando haya tracción)

6. Colapsar **Paw Labs** por default en sidebar (no destacar hasta que sean core).
7. Decidir destino de **social disabled** (Feed/Chat/Community): reactivar con onboarding mejor o eliminar para reducir bundle.
8. Evaluar **Panel Pro** (`/panel-pro`): ¿es analytics real o stub? Si es stub, esconder o eliminar.
9. Implementar **notificación email al admin** cuando entra nueva aplicación Paw Voice/Company (reduce fricción operacional).
10. **Bulk import CSV de pacientes** para track Clínica (mencionado en plan, implementación pendiente).

### Estratégico (3-6 meses)

11. **Internacionalización LatAm** (Argentina/Perú/Colombia/México) → multiplica comunidad donante.
12. **Paw Points canjeables** por productos de Paw Partners (use-to-earn vida real).
13. **App nativa** Play Store + App Store con sign-in nativo.
14. **Web de transparencia pública** con uso real de donaciones (reforzar narrativa "home-made").

---

## 7. Health del modelo híbrido (evaluación franca)

**Lo que funciona bien**:
- ✅ Arquitectura sólida tras pivot médico. Ficha clínica + directorio vets = core defensible.
- ✅ 5 motores de revenue desacoplados. Si uno no funciona, los otros siguen.
- ✅ Admin bien segmentado (13 secciones) con flujos de aprobación claros.
- ✅ Legal chileno cubierto (Ley 19.496, disclaimer SII Ley 19.885).

**Lo que preocupa**:
- ⚠️ **Gates B2C inconsistentes**: la app dice "gratis para todos" pero 11 archivos todavía tienen PremiumGate. Confuso para el usuario si el flag cambia.
- ⚠️ **Flow en cuenta personal de Pedro** — riesgo fiscal urgente. Migrar a SpA antes de escalar donaciones.
- ⚠️ **Volumen actual bajo** (~33 usuarios, <50 MAU). Lanzamiento + outreach + Paw Voices es crítico para cruzar 500 MAU en 3 meses.
- ⚠️ **Social disabled** pero código pesa en bundle. Decidir destino.

**Mi recomendación honesta**:
1. Cerrar los P0 antes de 1 mayo (3-5 horas).
2. Migrar cuenta Flow a SpA (Tenpo/Mach, 1-3 días).
3. Lanzar con lo que está — no más features nuevas pre-launch.
4. Outreach a 10 Paw Voices + 3 Paw Companys en los primeros 15 días post-launch.
5. Medir conversión donaciones vs MAU y decidir estrategia de crecimiento en mes 2.

---

**Generado por Claude Opus 4.7 (1M context) el 2026-04-19.**
Fuente: inventario completo de `src/App.tsx`, `AppSidebar.tsx`, `BottomTabBar.tsx`, `Admin.tsx`, feature flags y estructura de páginas.
