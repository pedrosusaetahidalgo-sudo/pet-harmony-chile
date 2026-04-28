# Audit Paw Friend — Arquitectura, UX, Componentes, Performance, Testing

> Fecha: 2026-04-27
> Alcance: Dominios 1, 2, 3, 10, 11 + Inventario Fase 0 completo
> Repo: pet-harmony-chile-main · branch main

---

## Sección A — INVENTARIO FASE 0

### A.1 Conteos crudos

| Categoría | Glob/Path | Total |
|---|---|---|
| Páginas (`.tsx`) | `src/pages/**/*.tsx` | **106** |
| Componentes (`.tsx`) | `src/components/**/*.tsx` | **431** |
| Hooks | `src/hooks/**/*.{ts,tsx}` | **105** |
| Libs | `src/lib/**/*.ts` | **70** (incluye 12 tests) |
| Edge Functions | `supabase/functions/*/index.ts` (ex `_shared/`) | **64** |
| Migraciones SQL | `supabase/migrations/*.sql` | **313** |
| Tests unit | `src/**/*.test.{ts,tsx}` | **28** |
| Tests E2E | `e2e/**/*.spec.ts` | **19** |
| `.md` raíz | `./*.md` | **10** |
| `.md` en `docs-raiz/` | `docs-raiz/**/*.md` | **66** |
| `.md` en `_pending/` | `_pending/**/*.md` | **45** |

> Discrepancia con CLAUDE.md (que habla de 65 páginas, 272 componentes, 68 hooks, 38 libs, 26 edge fns, 184 migraciones). El repo creció **~60-70%** desde la última actualización del manifiesto. **CLAUDE.md está desactualizado.**

### A.2 Top 20 páginas por bytes

| # | Ruta | Bytes | Líneas |
|---|---|---|---|
| 1 | `src/pages/AddPet.tsx` | 63,453 | 1499 |
| 2 | `src/pages/ProviderPatients.tsx` | 43,606 | 1120 |
| 3 | `src/pages/ProDashboard.tsx` | 42,043 | 1051 |
| 4 | `src/pages/Maps.tsx` | 38,134 | 1012 |
| 5 | `src/pages/Home.tsx` | 38,132 | 920 |
| 6 | `src/pages/PetClinicalRecord/index.tsx` | 36,765 | 901 |
| 7 | `src/pages/PawGame.tsx` | 36,548 | 914 |
| 8 | `src/pages/Auth.tsx` | 35,109 | 837 |
| 9 | `src/pages/Donaciones.tsx` | 34,219 | — |
| 10 | `src/pages/ParaVeterinarios.tsx` | 33,635 | — |
| 11 | `src/pages/Admin.tsx` | 32,636 | — |
| 12 | `src/pages/standalone/AnalyticsDashboard.tsx` | 32,596 | 897 |
| 13 | `src/pages/ServiceDirectory.tsx` | 31,980 | 872 |
| 14 | `src/pages/RegistroPartner.tsx` | 28,717 | 882 |
| 15 | `src/pages/ProviderProfileEdit.tsx` | 25,978 | — |
| 16 | `src/pages/RegistroVeterinario.tsx` | 25,601 | — |
| 17 | `src/pages/OnboardingQuickFlow.tsx` | 25,483 | — |
| 18 | `src/pages/NosePrintTest.tsx` | 24,643 | — |
| 19 | `src/pages/PetClinicalRecord/tabs/TabResumen.tsx` | 24,528 | — |
| 20 | `src/pages/PerfilVetPublico.tsx` | 24,303 | — |

### A.3 Top 20 componentes por bytes

| # | Ruta | Bytes | Líneas |
|---|---|---|---|
| 1 | `src/components/admin/AdminSalaInversion.tsx` | 68,144 | 1638 |
| 2 | `src/components/admin/AdminFeedback.tsx` | 49,038 | 1168 |
| 3 | `src/components/admin/AdminAnalytics.tsx` | 47,621 | 1181 |
| 4 | `src/components/admin/AdminDashboard.tsx` | 42,367 | 1160 |
| 5 | `src/components/admin/AdminSystemHealth.tsx` | 40,276 | 938 |
| 6 | `src/components/admin/AdminLeadsCRM.tsx` | 38,258 | 989 |
| 7 | `src/components/admin/AdminFinance.tsx` | 36,611 | 880 |
| 8 | `src/components/admin/AdminServiceProviders.tsx` | 35,552 | 835 |
| 9 | `src/components/AppSidebar.tsx` | 29,485 | — |
| 10 | `src/components/EnhancedBookingDialog.tsx` | 27,475 | — |
| 11 | `src/components/AddMedicalRecord.tsx` | 26,412 | — |
| 12 | `src/components/pricing/PlanComparisonTable.tsx` | 26,295 | — |
| 13 | `src/components/admin/AdminPartnerSubmissions.tsx` | 25,892 | — |
| 14 | `src/components/admin/AdminErrorLog.tsx` | 24,614 | — |
| 15 | `src/components/ui/sidebar.tsx` | 24,421 | — |
| 16 | `src/components/FeedbackWidget.tsx` | 23,139 | — |
| 17 | `src/components/admin/AdminUsers.tsx` | 22,135 | — |
| 18 | `src/components/AdoptionPostCard.tsx` | 21,683 | — |
| 19 | `src/components/BecomeProviderDialog.tsx` | 21,215 | — |
| 20 | `src/components/admin/AdManagement.tsx` | 21,204 | — |

### A.4 Top 5 hooks más usados

| Hook | Imports | Notas |
|---|---|---|
| `useAuth` | **160 archivos** | Hook ancla. Usado en casi todas las pages y muchos hooks. |
| `useActiveRole` | 19 | Toggle owner/provider/shelter. |
| `useReminders` | 13 | |
| `useAchievements` | 8 (uses), `useGamification` 6 | |
| `usePlan` | 8 | Premium / B2C plans. |

---

## Sección B — Arquitectura

### ARCH-001 · P1 · God components > 800 líneas

10 archivos rompen el threshold:

| Archivo | Líneas |
|---|---|
| `src/components/admin/AdminSalaInversion.tsx` | 1638 |
| `src/pages/AddPet.tsx` | 1499 |
| `src/App.tsx` | 1187 |
| `src/components/admin/AdminAnalytics.tsx` | 1181 |
| `src/components/admin/AdminFeedback.tsx` | 1168 |
| `src/components/admin/AdminDashboard.tsx` | 1160 |
| `src/pages/ProviderPatients.tsx` | 1120 |
| `src/pages/ProDashboard.tsx` | 1051 |
| `src/pages/Maps.tsx` | 1012 |
| `src/components/admin/AdminLeadsCRM.tsx` | 989 |

**Fix**: Romper en sub-componentes por sección semántica (admin) o steps (`AddPet` ya tiene `OnboardingQuickFlow`, pero `AddPetLegacy` sigue como bloque único de ~1400 líneas con 14 `useState` y 1 `useEffect` con fetch manual).

### ARCH-002 · P1 · TS strict deshabilitado + 301 violaciones

`tsconfig.json` tiene `noImplicitAny:false` + `strictNullChecks:false`. Cuento **301 ocurrencias de `as any | as unknown | @ts-ignore | @ts-expect-error` en 150 archivos**.

Top 20 archivos con más violaciones:

| Archivo | Count |
|---|---|
| `src/components/admin/AdminAnalytics.tsx` | 13 |
| `src/components/admin/AdminSalaInversion.tsx` | 9 |
| `src/components/settings/IntegrationsCard.tsx` | 8 |
| `src/lib/auditExport.ts` | 8 |
| `src/hooks/usePawCompanys.ts` | 8 |
| `src/hooks/usePawVoices.ts` | 8 |
| `src/pages/ProviderPatients.tsx` | 7 |
| `src/hooks/usePawCard.ts` | 7 |
| `src/components/admin/AdminFinance.tsx` | 5 |
| `src/components/admin/AdminTeam.tsx` | 5 |
| `src/hooks/useUnifiedCalendar.ts` | 5 |
| `src/hooks/useFeedback.ts` | 5 |
| `src/hooks/usePawCollection.ts` | 5 |
| `src/hooks/useAdvertisements.ts` | 5 |
| `src/components/admin/AdminErrorLog.tsx` | 4 |
| `src/hooks/useFeedPosts.ts` | 4 |
| `src/components/admin/AdminModeration.tsx` | 3 |
| `src/components/social/ActivityFeed.tsx` | 6 |
| `src/components/provider/VetPatientsList.tsx` | 6 |
| `src/hooks/useAchievements.ts` | 6 |

Además `src/pages/MyBookings.tsx:1` empieza con `/* eslint-disable @typescript-eslint/no-explicit-any */`.

**Fix**: Activar `strictNullChecks` por archivo (`// @ts-strict-mode`) y deshacer escapes uno a uno; meta a 90 días: tsconfig estricto.

### ARCH-003 · P1 · Diálogos / Cards / Botones duplicados (DRY)

5 violaciones DRY identificadas:

1. **`Card` de empty-state**: existe `src/components/ui/EmptyState.tsx` y también `EmptyStateIllustration` + cards inline en `EnMemoria.tsx`, `MyBookings.tsx`, `Adoption.tsx`. El componente unificado se usa, pero hay variantes inline en pages grandes.
2. **Diálogos `Become*`**: `BecomeProviderDialog.tsx` (21KB) + `BecomeShelterDialog.tsx` + `BecomeProviderCTA.tsx` con la misma estructura wizard step-by-step. No comparten un hook ni un layout base.
3. **`PageHeader`**: existe componente, pero `Auth.tsx`, `Index.tsx` y otras 5 páginas públicas hacen su propio header.
4. **`ProviderPatients` vs `VetPatientsList`** (`src/components/provider/VetPatientsList.tsx`) cubren overlap del 60% de columnas.
5. **`ActivityFeed`** existe en `social/ActivityFeed.tsx` y `provider/dashboard/ActivityFeed.tsx` con scope diferente pero schema parecido (post/avatar/timestamp). Sin tipo común.

### ARCH-004 · P2 · State: react-query + Context coexisten

`createContext` se usa en 5 archivos (`useAuth.tsx`, `useActiveRole.tsx`, `ui/sidebar.tsx`, `ui/form.tsx`, `ui/chart.tsx`, `ui/carousel.tsx`, `ui/toggle-group.tsx`). Los Context **app-level** son legítimos. El issue es la mezcla:

- 168+ `staleTime` overrides en 100 archivos (cada hook decide su propio).
- Default global = 5 min en `App.tsx:235-241`. Razonable.
- 10 páginas con `useState(loading)` + `setLoading()` manual sin `useQuery` (`AddPet`, `Auth`, `Chat`, `ChatConversation`, `Donaciones`, `Home`, `MedicalShare`, `MyPets`, `OnboardingDuenoMinimal`, `PawGame`). En `AddPet.tsx:80` declara `setLoading`/`setLoadingPet`/`setUploading` y un `useEffect` con fetch manual ignorando react-query.

**Fix**: política "todo fetch GET pasa por hook con `useQuery`". Mutaciones via `useMutation`. setLoading manual solo para UI no-fetch.

### ARCH-005 · P2 · Lazy loading completo en App.tsx

Verificado: todas las rutas en `src/App.tsx` están `lazy()`. ✅
Imports síncronos pesados:
- `recharts`: 15 archivos importan directo. Está en `recharts-vendor` chunk vía `vite.config.ts:57`. ✅
- `leaflet`/`react-leaflet`: solo 1 archivo (`Maps.tsx`). Lazy. ✅
- `html5-qrcode`: 1 archivo. ✅
- `xlsx`: usado en `ShelterBulkImport.tsx` y `lib/auditExport.ts`. NO está en manualChunks → se mete en page chunk. **PERF-005** abajo.

### ARCH-006 · P2 · `useEffect` con `[]` que usa props/state

13 archivos detectados; 7 son legítimos (mount-only side effects). Los problemáticos:

| Archivo | Por qué |
|---|---|
| `src/components/CookieConsentBanner.tsx` | Lee `localStorage` en `[]`, OK |
| `src/components/landing/HeroVideo.tsx` | Setup video, OK |
| `src/components/TopRatedProviders.tsx` | Fetch sin deps explícitas → debería ser `useQuery` |
| `src/components/paw-cards/HoloRevealAnimation.tsx` | Animación, OK |
| `src/components/pawgame/PawShopRewards.tsx` | Fetch in mount, debería migrar a `useQuery` |
| `src/components/ThemeToggle.tsx` | OK |
| `src/pages/PawCore.tsx`, `PawCompanysPage.tsx`, `PawMember.tsx`, `PawVoices.tsx`, `TermsOfService.tsx`, `PrivacyPolicy.tsx`, `DeleteAccount.tsx` | Solo `document.title` setter → OK |

**Fix**: dos archivos (`TopRatedProviders`, `PawShopRewards`) deben migrar a react-query. El resto está bien.

---

## Sección C — UX por página crítica

### UX-001 · P0 · `Index.tsx` (Landing) — propósito claro

- Propósito en 3s: **SÍ**. Hero con video + título "La salud de tu peludo, en un solo lugar. Y siempre gratis." Limpio.
- Estados: Helmet OG completos. ✅
- Mobile-first: HeroVideo con video real `hero-pet.mp4`. Verificado.
- CTA primario: ✅
- Friction: 0 taps para lectura, 1 tap a `/auth`.
- **Mejora P2**: si hay deeplink `?invitation=XXX`, no redirige al claim sino a `/auth` directo.

### UX-002 · P1 · `Home.tsx` — dashboard sobrecargado

- Propósito 3s: **medio**. Hay 11 cards (StatusCard, PriceEstimator, WeeklyReport, Seasonal, Routines, AnnualCare, FirstPdfNudge, PawFriendPicks, NextBooking, WeekActivities, CareStreak, PetsHealth) + onboarding hints + Google calendar banner + Trial overlay + tutorial dialog. **Demasiado denso.**
- Estados: `Skeleton` presente vía componentes, pero algunos cards tienen su propio loading inconsistente.
- Mobile-first: sí. CTAs táctiles.
- CTA primario: confuso — "agregar mascota" si no hay pets, dashboard si los hay.
- Friction: 1 tap para "ver pet", pero hay overload de info encima.
- **Fix**: priorizar 4-5 cards core con feature flag para los demás.

### UX-003 · P0 · `AddPet.tsx` — God component + loading manual

- Propósito 3s: **SÍ** si flag `ONBOARDING_V2_MINIMAL` está ON (wizard `OnboardingQuickFlow`).
- Si flag OFF: **NO**. `AddPetLegacy` es un formulario monolítico de 1400+ líneas con 14 useState, 1 fetch manual, 16 campos en `formData`, 4 dialogs anidados. **Friction altísima**: 12+ taps.
- Estados: loading/error/success **mezclados con useState manual** (`loading`, `loadingPet`, `uploading`, `checkingLimit`).
- **Fix P0**: validar que `ONBOARDING_V2_MINIMAL` esté ON en prod; si no, eliminar legacy. Si sí, marcar legacy con `// TODO(cleanup)` y borrar en próximo release.

### UX-004 · P1 · `PetClinicalRecord/index.tsx` (ficha)

- Propósito 3s: SÍ. 4 tabs (Historia/Cuidados/Identidad/Más) por Refactor Maestro Fase 0.
- Estados: `ClinicalRecordSkeleton` ✅
- Mobile-first: sí.
- CTA primario: claro (Pet ID Card en Identidad).
- Friction: 2-3 taps para llegar a info.
- **Mejora P2**: 901 líneas en un solo archivo. Tabs ya están separados, pero el shell debería bajar a ~300.

### UX-005 · P2 · `PawGame.tsx`

- Propósito 3s: SÍ (gamificación owner-only).
- Estados: ✅. PawLabsBanner anuncia beta.
- Mobile-first: ✅.
- CTA: claro (misiones, paw shop).
- Friction: 2-3 taps.
- 914 líneas. Aceptable porque hay lógica de gamificación rica.

### UX-006 · P1 · `Explorar.tsx`

- Propósito 3s: SÍ. Hub de Paw Labs con tiles.
- Estados: render-only, no fetch directo. ✅
- Mobile-first: sí.
- CTA: cada tile es un CTA.
- Friction: 1 tap.
- **Mejora P2**: cada tile depende de feature flag — si flags off, usuario ve grid vacía sin mensaje.

### UX-007 · P1 · `EnMemoria.tsx` + `MemoriaPublica.tsx`

- `EnMemoria.tsx`: lista privada. ✅. Loading state via `isLoading`.
- `MemoriaPublica.tsx`: pública compartible con OG meta. ✅
- Mobile-first: ✅.
- Friction: 1 tap para abrir, 1 para compartir.
- **Mejora P2**: el `useEffect`-driven undo flow puede confundir si timer expira mientras user está en chat de bereavement. Considerar warning UI.

### UX-008 · P1 · `PawMember.tsx`

- Propósito 3s: SÍ. "Tu aporte" + benefits.
- Estados: skeleton presente.
- CTA primario: registro/aporte. Confusión: este es el reemplazo del legacy `/upgrade` (modelo v2 = todo gratis). Copy alineado, OK.
- Friction: 0 (página informativa).
- **Mejora P2**: `useEffect` para `document.title` redundante con `<Helmet>`.

### UX-009 · P1 · `NoseScan.tsx`

- Propósito 3s: SÍ. "Saca foto de la nariz para identificar mascota perdida."
- Estados: `Phase` enum (`intro|capturing|review|searching|results|error`) ✅. Excelente diseño.
- Mobile-first: usa `getUserMedia`.
- CTA: claro.
- Friction: 3 taps (permitir cámara, capturar, buscar). Aceptable.
- **Estado actual**: gateado por flag `NOSE_PRINT_PUBLIC_SCAN` (paused esperando proveedor según memoria 2026-04-27). ✅

### UX-010 · P2 · `Auth.tsx`

- Propósito 3s: SÍ. Tabs login/register.
- Estados: completos (email confirmation, magic link, password reset).
- Mobile-first: ✅.
- CTA: claro.
- Friction: 1 social tap o 3-4 con email/password.
- **Mejora P2**: 837 líneas. Romper en sub-tabs (Login/Register/MagicLink/Reset) componentes.

### UX-011 · P1 · `MyBookings.tsx`

- Propósito 3s: SÍ.
- Estados: `useMyBookingsV2` hook, OK.
- Mobile-first: ✅.
- CTA: "Reservar" via `BookServiceSheet`.
- Friction: 1-2 taps.
- **Mejora P1**: archivo empieza con `/* eslint-disable @typescript-eslint/no-explicit-any */`. Tipar `reviewBooking` y todos los `any`.

---

## Sección D — Componentes & Design System

### DS-001 · P2 · Tokens en `tailwind.config.ts` ✅

Sí hay un design system real. Tokens HSL via CSS vars (`--primary`, `--medical`, `--premium`, `--health-good`...) + paletas extendidas (`brand`, `gold`, `audience`, `health`). Buena base.

### DS-002 · P1 · shadcn/ui usado mayormente, pero 31 botones nativos

`<button>` nativo en 20 archivos. Total 31 ocurrencias detectadas con regex `<button[^A-Z]`. Algunos son legítimos (controles internos de carousel, story viewer) pero otros son ad-hoc:

- `src/components/feed/FeedComments.tsx` (2)
- `src/components/feed/FeedStories.tsx` (3)
- `src/components/feed/FeedStoryViewer.tsx` (3)
- `src/components/feed/FeedImageUploader.tsx` (3)
- `src/components/CreateReviewForm.tsx` (2)
- `src/components/calendar/CalendarGrid.tsx`, `CalendarEventCard.tsx` (2)

**Fix**: usar `<Button variant="ghost">` o `<Button asChild>` para mantener consistencia (focus ring, touch target 44px).

### DS-003 · P3 · Iconografía consistente ✅

`lucide-react` re-exportado vía `src/lib/icons.ts`. SVG inline solo en `src/pages/PetClinicalRecord/pdf.ts` (legítimo, generación de PDF).

### DS-004 · P2 · Variantes CVA correctas en `Button`

`buttonVariants` en `ui/button.tsx` con `cva()` y prop `variant` + `size`. Bien diseñado. `interface ButtonProps extends VariantProps<typeof buttonVariants>`. ✅

---

## Sección E — Performance

### PERF-001 · P1 · `vite.config.ts` manualChunks razonable

Object-based, NO function-based (para evitar circular deps documentadas en commit). Cubre: react-vendor, query-vendor, ui-vendor, icons-vendor (lucide), date-vendor, supabase-vendor, leaflet-vendor, recharts-vendor, sentry-vendor. ✅

`stats.html` se genera vía `rollup-plugin-visualizer` ✅. No está en `.gitignore` específicamente, recomendable agregar.

**Mejora**: agregar `'xlsx-vendor': ['xlsx']` para sacarlo del page chunk de `ShelterBulkImport`.

### PERF-002 · P2 · `import * as` — top 5

| # | Archivo | Lib |
|---|---|---|
| 1 | `src/pages/shelter/ShelterBulkImport.tsx:19` | `* as XLSX from 'xlsx'` |
| 2 | `src/lib/auditExport.ts:29` | `* as XLSX from 'xlsx'` |
| 3 | `src/hooks/use-mobile.tsx:1` | `* as React from 'react'` |
| 4 | `src/components/ui/tooltip.tsx:1-2` | `* as React`, `* as TooltipPrimitive` |
| 5 | `src/components/ui/context-menu.tsx:1-2` | idem |

XLSX es el más caro. Lazy import dinámico recomendado.

### PERF-003 · P1 · `select('*')` en queries

**85 archivos** con `.select('*')` (CLAUDE.md afirmaba que se había limpiado, sigue presente). Top 5:

| Archivo | Uso |
|---|---|
| `src/components/admin/AdminMasterKPIs.tsx` | KPIs view (admin, OK) |
| `src/pages/RefugioPublico.tsx` | Perfil público — debería listar columnas |
| `src/pages/PetClinicalRecord/index.tsx` | Ficha — sobre-fetcheo |
| `src/pages/Chat.tsx` | mensajes — explosión de payload en hilos largos |
| `src/hooks/useAdoptionFeed.ts` | feed — N rows × full pet schema |

**Fix P1**: enumerar columnas en queries de listas largas / feed.

### PERF-004 · P2 · N+1 / Promise.all en loops

15 archivos detectados con patrón `Promise.all` o `.map(async`. La mayoría son legítimos (paralelizar fetches independientes). Sospechosos:

- `src/pages/AddPet.tsx`: secuencia de uploads + insert.
- `src/pages/Home.tsx`: posibles fetches paralelos por pet → revisar.
- `src/lib/auditExport.ts`: export grande, OK.

### PERF-005 · P2 · Imágenes / formatos modernos

- 30 ocurrencias de `webp|avif` en 8 archivos, mayormente en `src/lib/imageUtils.ts` (compresión correcta). ✅
- 51 archivos con `loading="lazy"` en `<img>`. Buena cobertura.
- **Mejora**: `<picture>` + `<source type="image/webp">` no se usa en landing — `Hero` y `MedicalRecordShowcase` deberían servir webp/avif explícitos.

### PERF-006 · P2 · React Query staleTime/gcTime

Default 5 min en `App.tsx:237`. **168 overrides en 100 archivos**, lo que indica que los hooks deciden cada uno. Algunos overrides son razonables (KPI = 30min), otros son arbitrarios (5s, 1min). 
**Fix**: extraer 4 presets en `src/lib/queryConfig.ts` (`SHORT`, `MEDIUM`, `LONG`, `ADMIN`) y usarlos en lugar de literales mágicos.

---

## Sección F — Testing

### TEST-001 · P1 · Cobertura unit baja: 28 tests para 70+ libs

`src/lib/__tests__/`: 12 tests (gamification, openingHours, vaccines, distance, levels, health-score, schemas, commissions, routing, bookingStateMachine, format, plans, completion, featureFlags). 
`src/integration/__tests__/`: 13 tests (shared-logic 4, supabase-client 3, user-flows 4, edge-functions 3).

**Coverage**: NO configurado. `vitest.config.ts` solo tiene `globals|environment|setupFiles|include|exclude`. Sin `coverage: { provider: 'v8', reporter: ['text','html'] }`.

**Fix P1**: agregar coverage + threshold mínimo (60% lib, 30% global) y correr en CI.

### TEST-002 · P0 · Tests E2E críticos

`e2e/` tiene 19 specs. Suite playwright con 8 proyectos (Desktop Chrome 3 viewports, Firefox, Safari, Pixel 5, iPhone 13, iPhone SE).

Tests críticos verificados:
- `smoke-public.spec.ts`: 18 rutas públicas con verificación de errores JS y `<400`.
- `smoke-protected.spec.ts`: 30+ rutas protegidas con redirect a `/auth`.
- `smoke-onboarding-gate.spec.ts`: ✅
- `owner-clinical-lifecycle.spec.ts`, `vet-daily-workflow.spec.ts`: flujos completos.
- `coherence-plan-regression.spec.ts`: regresión de Coherence Plan.

✅ Cobertura razonable de smoke. Falta: tests de happy path real con login (no solo redirect).

### TEST-003 · P0 · Tests RLS — solo 1 archivo y NO de seguridad

Búsqueda de "RLS / row level / cross-user / isolation":

- `e2e/integration/pet-lifecycle-triggers.spec.ts:55` usa client admin para cleanup. NO valida que un user_b no puede leer datos de user_a.
- `supabase/config.toml` tiene comentarios sobre RLS en edge fns.
- **NO existe** `supabase/tests/` ni un `e2e/rls-isolation.spec.ts`.

**Fix P0**: crear test que loguee `user_a`, cree `pet_a`, loguee `user_b`, intente fetchear `pet_a` y verifique row vacía. Repetir para `medical_records`, `pet_reminders`, `donations`, `co_owners`, `consultation_notes`, `bookings`. Dado que CLAUDE.md §9.7 enfatiza protección de datos de usuarios reales, esto debería ser P0 antes del lanzamiento 1 junio.

### TEST-004 · P2 · `e2e/integration/pet-lifecycle-triggers.spec.ts`

Excelente test que crea pet con admin client y valida triggers (CHECK, RLS al menos en lecturas) — único lugar donde se ejercitan triggers DB end-to-end. Cubre la regla §9.2.1 de CLAUDE.md (smoke triggers plpgsql).

---

## Resumen ejecutivo: 10 hallazgos P0/P1 más críticos

1. **TEST-003 (P0)** — No hay tests de aislamiento RLS. Pre-launch 1 junio es bloqueante.
2. **UX-003 (P0)** — `AddPet.tsx` legacy de 1499 líneas con 14 `useState` y fetch manual. Si flag minimal está OFF, friction es brutal.
3. **TEST-002 (P0)** — Smoke E2E cubre rutas, no flujos auth. Falta happy-path con sesión real.
4. **ARCH-001 (P1)** — 10 archivos > 800 líneas, 5 son admin (~12,000 líneas combinadas).
5. **ARCH-002 (P1)** — `tsconfig` con strict OFF + 301 escapes (`as any` etc). Deuda técnica acumulándose.
6. **ARCH-003 (P1)** — DRY: `BecomeProviderDialog`/`BecomeShelterDialog` y `EmptyState` con duplicados inline.
7. **PERF-001 / PERF-005 (P1)** — `xlsx` no aislado en chunk; landing no usa `<picture>` con webp/avif explícito.
8. **PERF-003 (P1)** — 85 archivos con `.select('*')` (incluyendo feeds y pages públicas). Sobre-fetch transversal.
9. **DS-002 (P1)** — 31 `<button>` nativos en 20 archivos rompen consistencia (focus, touch).
10. **TEST-001 (P1)** — Coverage no configurado. 28 unit tests vs ~70 libs + 105 hooks + 431 components.

### Inventario numérico final

- **106** páginas · **431** componentes · **105** hooks · **70** libs
- **64** edge functions · **313** migraciones SQL
- **28** tests unit · **19** specs E2E (con 8 proyectos cada uno)
- **10** .md raíz · **66** en `docs-raiz/` · **45** en `_pending/` (total ~121 docs activos)
- Bundle: **9 vendor chunks** + per-page lazy chunks
- TS strict: **OFF** (`strictNullChecks:false`, `noImplicitAny:false`)
- React Query: **staleTime 5min** default + 168 overrides
- Manualchunks: object-based ✅ (rollback de function-based 2026-04-20)

CLAUDE.md está desactualizado: declara 65 páginas / 272 componentes / 184 migraciones; el repo creció a 106 / 431 / 313. **Recomendación**: regenerar `MAPA_FUNCIONAL_COMPLETO.md` y CLAUDE.md §3 en el próximo commit.
