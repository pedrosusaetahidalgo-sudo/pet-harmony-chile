# Auditoría Top-Tier — Paw Friend

**Fecha:** 2026-04-20
**Alcance:** web + Android + iOS (Capacitor 7)
**Estado del repo:** `main` con 40+ archivos cambiados sin commit (auditoría E2E + rediseños pitch + refugios + invitaciones clínicas)
**Propósito:** diagnóstico accionable para llevar la app a nivel internacional (Rover / MyPet / 11pets) sin romper los usuarios reales ya en producción.

> **Convención del documento**
> - **[CONFIRMADO]** = verificado leyendo código/configuración en esta sesión
> - **[SUPUESTO]** = hipótesis razonable que requiere validación
> - **[PROPUESTA]** = feature/cambio que NO existe hoy, se separa del diagnóstico

---

## 1. Diagnóstico ejecutivo

Paw Friend es un producto excepcionalmente ambicioso para estar construido por una persona + IA: 70+ rutas, 29 edge functions, 156+ migraciones, 3 roles (owner / provider / shelter), 6 motores de monetización documentados y 4 plataformas target (web + Android + iOS + WebView). Funciona, tiene usuarios reales ([CONFIRMADO] Kai, Palo, Sofía, etc.) y tests pasando.

**Lo que ya es top-tier**:
- Diseño visual y tokens de color (`tailwind.config.ts`) — [CONFIRMADO] design system v1.0 bien definido, brand purple + audience palettes.
- Transparencia del modelo (`/paw-core`, `/transparencia`) — no tiene equivalente local.
- Separación profesional / dueño / refugio con guards reales (`RoleGuard`).
- Ficha clínica + PDF + ZIP + compartir 30 días — genuinamente diferenciador.
- Edge functions con telemetría wrapper y rate limiting.

**Lo que bloquea escalar a "top-tier internacional"**:
1. **God components en admin** — 6 archivos >1.100 líneas ([CONFIRMADO] `AdminSalaInversion.tsx` 2.233 L, `AdminSystemHealth.tsx` 1.394 L, `AdminLeadsCRM.tsx` 1.231 L, `AdminAnalytics.tsx` 1.181 L, `AdminFeedback.tsx` 1.168 L, `AdminDashboard.tsx` 1.152 L). Bloquea tests, crea blast radius enorme.
2. **Páginas crítas también gordas** — `AddPet.tsx` 1.265 L, `ProviderPatients.tsx` 1.120 L, `ProDashboard.tsx` 1.043 L, `Home.tsx` 923 L, `Maps.tsx` 1.012 L.
3. **Dark mode instalado pero NO activado** — [CONFIRMADO] `next-themes` solo se consume en `src/components/ui/sonner.tsx`. `main.tsx` no envuelve con `ThemeProvider`, `:root` fija `color-scheme: light`. Gap inmediato para iOS/Android.
4. **`verify_jwt=false` en ~29 edge functions** — [CONFIRMADO por agente de seguridad] surface de ataque amplia en funciones que no son webhooks.
5. **Idempotencia de pagos débil** — no hay tabla `payment_events` con UNIQUE(flow_token, status); Flow reenvía webhooks y puede causar doble cobro.
6. **Mobile nativo a medias** — Capacitor configurado, push registrado, splash OK. Pero **0 uso de `@capacitor/haptics`**, safe-area solo parcial, no hay `inputMode` semántico en forms, sin keyboard handling avanzado.
7. **Engagement day-2/day-30 no está diseñado** — weekly reports + cron existen como edge fns, pero `PawMember` y gamificación son "badges vacíos" ([CONFIRMADO] `PawMember.tsx:162-230` — "descuentos próximamente"). Paw Points visible en home sin explicar utilidad.
8. **Activación onboarding** — flows existen (`OnboardingDuenoMinimal`, `OnboardingVetMinimal`, `OnboardingShelter`) pero **no están enganchados al signup**. Son rutas huérfanas deep-link.
9. **Deuda de rutas y features huérfanas** — `/chat` con `FeatureGuard flag="CHAT"` en false, `USER_PREMIUM=false` sin quitar los gates en el código, `/analytics-demo` admin-only mezclado con producto.

**Semáforo por área**:

| Área | Estado | Bloquea Store? |
|---|---|---|
| Arquitectura código | 🟡 Funcional, con 10 god components | No |
| Performance bundle | 🟢 Vendor splitting OK | No |
| Performance runtime | 🟡 Admin refetch agresivo 60-120s | No |
| UX Web | 🟢 Sólido | No |
| UX Mobile | 🟡 Safe-area parcial, 0 haptics | Penaliza review Apple |
| Accesibilidad | 🟡 85 warnings a11y + dark mode off | Penaliza review |
| Onboarding | 🔴 Flows existen, no están conectados | Penaliza D1 retention |
| Engagement | 🔴 Loop D2-D30 no diseñado | Bloquea LTV |
| Confianza | 🟢 Transparencia ejemplar | No |
| Escalabilidad | 🟡 OK 10k MAU, duda 100k | No |
| Monetización | 🟡 5 motores listos, 3 dormidos | No |
| Seguridad | 🔴 verify_jwt off + idempotencia Flow | Crítico pre-lanzamiento |
| Consistencia visual | 🟢 Tokens excelentes | No |

---

## 2. Mapa de módulos actuales

Contado vía `wc -l` y `find` en esta sesión.

### 2.1 Aplicación web/mobile (src/)

| Capa | Archivos | Total líneas | Observación |
|---|---|---|---|
| `src/App.tsx` | 1 | 1.039 | Router monolítico, 70+ rutas lazy, 3 componentes de redirect inline |
| `src/pages/` | 65 | ~25.000 | Top pesadas: `AddPet` 1265, `ProviderPatients` 1120, `ProDashboard` 1043, `Maps` 1012, `Home` 923, `PawGame` 914 |
| `src/components/` | 272 | ~70.000 | `ui/` shadcn (54), `admin/` (21), `provider/` (28), `feed/` (14) |
| `src/components/admin/` | 21 | ~14.000 | 6 archivos >1.100 L concentran el 50% de `admin/` |
| `src/hooks/` | 68 | ~6.500 | `useBookingMutations` 320, `useUnifiedCalendar` 319, `useCoOwners` 311 |
| `src/lib/` | 38 + 12 tests | ~5.000 | `analytics.ts`, `featureFlags.ts`, `plans.ts`, `format.ts`, `routing.ts` |
| **Total src/** | **~500** | **~124.000** | — |

### 2.2 Backend (supabase/)

| Capa | Cantidad | Observación |
|---|---|---|
| Edge functions | 29 activas + `_shared/` | Todas con `verify_jwt=false` según audit ([CONFIRMADO]) |
| Migraciones | 156+ hasta `20260712040000` | Idempotentes, aplicación manual |
| Storage buckets | `pet-photos` + otros | Policies revisadas, 5MB/whitelist MIME OK |

### 2.3 Documentación

Muy abundante: `audits/`, `_pending/`, `docs-raiz/`, `docs-specs/`, `diagrams/`, `pitch-inversionistas/`. Ver `INDEX.md`. La documentación ya no es el cuello de botella; **ejecutar** lo es.

---

## 3. Top 20 problemas priorizados

Leyenda: **P0** = bloquea lanzamiento / daña usuarios. **P1** = daña crecimiento o Store. **P2** = mejora calidad.

| # | Problema | Evidencia | Categoría | Prioridad | Impacto | Complejidad | Urgencia |
|---|---|---|---|---|---|---|---|
| 1 | `verify_jwt=false` en edge fns no-webhook | `supabase/config.toml` [CONFIRMADO] | Seguridad | **P0** | Alto | Baja | Inmediata |
| 2 | Idempotencia Flow webhook (no `payment_events`) | `flow-webhook/index.ts:105-245` [CONFIRMADO] | Seguridad / Pagos | **P0** | Alto | Media | Inmediata |
| 3 | Dark mode instalado no activado | `main.tsx` sin `ThemeProvider` [CONFIRMADO] | UX / Mobile | **P1** | Medio | Baja | Alta |
| 4 | 10 god components (>1.000 L) | Listado §2 [CONFIRMADO] | Arquitectura | **P1** | Alto | Alta | Media |
| 5 | Onboarding flows huérfanos (no se gatillan post-signup) | `App.tsx:950-965` [CONFIRMADO] | Activación | **P1** | Alto | Media | Alta |
| 6 | Engagement loop D2-D30 ausente (weekly emails sin trigger o callando) | `reminder-cron`, `generate-weekly-owner-reports` [SUPUESTO] | Retención | **P1** | Alto | Media | Alta |
| 7 | `log-error` sin auth + rate limit en memoria | `log-error/index.ts:46-61` [CONFIRMADO] | Seguridad | **P1** | Medio | Baja | Alta |
| 8 | `admin_access` sin 2FA + sin audit de promociones | `useIsAdmin.tsx:36-47` [CONFIRMADO] | Seguridad | **P1** | Medio | Media | Media |
| 9 | Paw Points / Paw Game visible sin utilidad clara | `Home.tsx:449-458` [CONFIRMADO agente] | UX / Engagement | **P1** | Medio | Baja | Alta |
| 10 | Safe-area iOS parcial (Header + Sidebar sin top inset) | `AppLayout.tsx` + `Header.tsx` [CONFIRMADO agente] | Mobile | **P1** | Medio | Baja | Alta (Apple review) |
| 11 | 0 uso de `@capacitor/haptics` | Dependencia instalada, 0 `Haptics.*` en src [CONFIRMADO] | Mobile | **P2** | Medio | Baja | Media |
| 12 | Imágenes sin `alt` (AdoptionPostCard, feed) | [CONFIRMADO agente UX] | A11y | **P1** | Medio | Baja | Alta |
| 13 | React Query `staleTime` inconsistente (184 menciones) | 68 hooks distintos [CONFIRMADO] | Performance | **P2** | Medio | Baja | Media |
| 14 | Admin refetch agresivo 60-120s sin back-off | `AdminAnalytics`, `AdminActivationFunnelWidget` [CONFIRMADO agente] | Performance | **P2** | Medio | Baja | Media |
| 15 | `ErrorBoundary` solo en 1 lugar | `App.tsx:264` único wrap [CONFIRMADO] | Resiliencia | **P2** | Medio | Baja | Media |
| 16 | Paw Member sin beneficios reales ("próximamente") | `PawMember.tsx:162-230` [CONFIRMADO agente] | Monetización | **P1** | Alto | Media | Alta |
| 17 | B2B vet upsell solo visible en dashboard | `ProviderDashboard.tsx` [CONFIRMADO agente] | Monetización | **P2** | Medio | Baja | Media |
| 18 | Cookie banner + PWA prompt con timing discutible | `CookieConsentBanner.tsx`, `PWAInstallPrompt.tsx` [CONFIRMADO agente] | UX | **P2** | Bajo | Baja | Baja |
| 19 | `docs/` en repo + SPA fallback script vs alternativa CDN | `vite.config.ts` outDir=`docs/` [CONFIRMADO] | Deploy / Escalabilidad | **P2** | Medio | Alta | Baja |
| 20 | Rutas legacy vivas sin plan de EOL (`/upgrade`, `/chat` gated off, `/analytics-demo`) | `App.tsx:558-583, 742-750, 986-997` [CONFIRMADO] | Housekeeping | **P2** | Bajo | Baja | Baja |

### 3.1 Detalle P0 (accionar antes del 1 de junio 2026)

#### P0-1 — `verify_jwt=false` global

Activar `verify_jwt=true` en todas las edge fns que no son webhooks ni OAuth callbacks. Lista negra (**deben quedar `false`**): `flow-webhook`, `google-calendar-callback`, `google-calendar-oauth-init`, `notify-pitch-application` (si usa webhook Resend). Todo lo demás (`pet-assistant`, `breed-tips`, `medical-suggestions`, `generate-medical-summary`, `generate-medical-zip`, `generate-vet-patient-summary`, `generate-weekly-*`, `bereavement-assistant`, `ocr-vaccination-card`, `moderate-service-promotion`, `process-consultation-transcript`, `send-pet-invitation`, `send-lead-outreach`, `verify-service-provider`, `verify-vet-document`) debe ir a `true`.

Tamaño: ~10 min editar `supabase/config.toml` + redeploy.
Riesgo: requiere verificar que los llamadores pasan bearer token. **Hacerlo staging primero**.

#### P0-2 — Idempotencia pagos Flow

Crear tabla `payment_events(flow_token TEXT, status TEXT, processed_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY(flow_token, status))` y envolver el handler en `INSERT ... ON CONFLICT DO NOTHING`, solo procesar si devolvió una fila. Esto previene el doble-cobro si Flow reenvía webhook.

Tamaño: migración SQL + ~30 líneas en `flow-webhook/index.ts`. Un día.

---

## 4. Quick wins (alto impacto / bajo riesgo, <1 día c/u)

| # | Acción | Archivos | Efecto | Horas |
|---|---|---|---|---|
| QW-1 | Activar dark mode: `ThemeProvider` en `main.tsx`, toggle en Header | `main.tsx`, `Header.tsx`, `index.css:27` | Percepción premium + Apple-friendly | 3 |
| QW-2 | Añadir `alt` a imágenes mascotas (batch regex) | `AdoptionPostCard.tsx` + feed | A11y + SEO | 1 |
| QW-3 | Skip-link al inicio del `AppLayout` (WCAG 2.1) | `AppLayout.tsx` | A11y base | 0.5 |
| QW-4 | Safe-area-top en `Header` + `AppSidebar` | `Header.tsx`, `AppSidebar.tsx` | iPhone notch OK | 1 |
| QW-5 | Haptics en acciones clave (booking confirm, reminder done, donate success) | 4-6 puntos | Sensación nativa | 2 |
| QW-6 | `inputMode` semántico + `autoComplete` en forms auth/register/pet | 8 componentes | Mobile UX | 2 |
| QW-7 | Uniformar `staleTime` con diccionario por entidad | `src/lib/queryConfig.ts` (nuevo) | -20/30% API calls | 2 |
| QW-8 | `ErrorBoundary` por ruta en `App.tsx` (wrap cada `<Route element>`) | `App.tsx` | Aislar crashes | 2 |
| QW-9 | `verify_jwt=true` en fns no-webhook | `supabase/config.toml` | Seguridad +++ | 0.5 |
| QW-10 | Tabla `payment_events` + ON CONFLICT en webhook | migración + edge fn | Evita doble-cobro | 4 |
| QW-11 | Banner upsell vet en perfil público si `profile_views > 10/sem` | `PerfilVetPublico.tsx` | B2B conversión | 2 |
| QW-12 | Badge Paw Member en avatar si logged + mini contador donaciones en Home | `Home.tsx:448-459` | Signal de confianza | 2 |
| QW-13 | `log-error` con rate limit persistente (RPC como flow-create-subscription ya hace) | `log-error/index.ts` | Anti-DoS | 2 |
| QW-14 | Lazy-load por tab en `PetClinicalRecord` | `pages/PetClinicalRecord/` | TTI ficha -40% | 3 |
| QW-15 | Quitar `USER_PREMIUM` del código (flag está en `false` permanente desde pivot) | grep por `USER_PREMIUM` + callers | Limpieza deuda | 2 |

---

## 5. Mejoras estratégicas de mediano plazo (30-90 días)

### 5.1 Arquitectura

- **Router por rol**. Splitear `App.tsx` en `<OwnerRoutes/>`, `<ProviderRoutes/>`, `<ShelterRoutes/>`, `<AdminRoutes/>`, `<PublicRoutes/>`, cada uno en su archivo con su propio lazy + suspense + error boundary. Permite mejor code-splitting por rol y tests independientes.
- **Factoring de god components**. Prioridad descendente:
  1. `AdminSalaInversion.tsx` → 5 sub-componentes (KPIs, Gráficos, Inversores, North Star, Exports).
  2. `AddPet.tsx` (1.265 L) → wizard declarativo + hooks de mutation aislados.
  3. `ProviderPatients.tsx` (1.120 L) → tabla + filtros + acciones masivas separados.
  4. `Home.tsx` (923 L) → `useHomeDashboard()` hook + widgets como componentes pequeños.
- **`queryConfig.ts`** con `QUERY_STALE_TIMES` por entidad (reminders: 60s, bookings: 5m, analytics: 10m, directorios: 30m, config: Infinity).
- **Convención `features/` interno**. Hoy todo vive en `components/` y `pages/` — mover dominios grandes (clínico, provider, shelter) a `src/features/<feature>/{pages,components,hooks}` habilita co-ubicación real.

### 5.2 Seguridad

- **2FA para admin** (OTP por email/TOTP) — tabla `admin_access` existe, añadir `mfa_required=true` + check.
- **Auditoría admin**: trigger que loguee cambios en `admin_access` a `admin_audit_log`.
- **Rotación periódica de secrets Supabase** documentada (ya hay memoria sobre rotación `2026-04-11`).
- **CORS estricto** en edge fns: hoy `_shared/cors.ts` probablemente tiene `*`, restringir a `pawfriend.cl` + `localhost` + capacitor scheme.
- **HMAC header check en flow-webhook** (además del getStatus callback).

### 5.3 Mobile (Android + iOS nativo)

- **Haptics taxonómicos** (`Light` para toggles, `Medium` para confirm, `Heavy` para error, `Success` tras pago) centralizado en `src/lib/haptics.ts`.
- **Keyboard accessory views** en iOS para forms largos (ficha clínica, add pet).
- **Deep links universales** (App Links Android + Universal Links iOS) para `/qr/:token`, `/paw-card/:id`, `/medical-share/:token`. Hoy solo hay custom scheme `cl.pawfriend.app://` ([CONFIRMADO] `App.tsx:153`).
- **Push notifications segmentados por rol** (owner vs vet vs shelter) + preferencias en Settings.
- **Offline-first para ficha clínica** (react-query persist + service worker) — al menos vista, no mutaciones.
- **App tracking transparency** (`capacitor-plugin-app-tracking-transparency` ya instalado) — pedir consentimiento antes de Analytics en iOS.

### 5.4 UX / Onboarding / Engagement

- **Onboarding real post-signup**. Gatillar `OnboardingDuenoMinimal` la primera vez que el user logra `user.id + 0 pets`. Idem vet/shelter. Hoy son deep-links huérfanos.
- **Loop D1/D7/D30** diseñado:
  - D1: push / email "Completa el perfil de tu mascota y gana 50 Paw Points".
  - D7: weekly report con salud + recordatorios próximos + 1 blog post por raza.
  - D30: "Tu Paw Friend impact" con donaciones (si es Paw Member), amigos, Paw Cards nuevas.
- **Paw Points con utilidad real**: canjear por descuentos en Paw Partners (barter), o ocultar hasta Q3 (decision binaria — mejor ocultar que dejar confundidos).
- **Dark mode toggle** en Settings + respeta OS.
- **Skeletons uniformes** con `EmptyState` variants (loading / empty / error) — `EmptyState.tsx` ya existe.

### 5.5 Monetización

- **Vet upsell en perfil público** cuando `profile_views > threshold`.
- **Comparativa de tiers visual** con calculadora de ahorro ("con Premium ahorras X horas/mes").
- **Paw Companys onboarding selfservice**: form + pago anual `$49.9k / $99.9k / $199.9k` con auto-activación del badge tras pago Flow.
- **Donaciones recurrentes** (requiere SpA — feature flag `DONATIONS_MONTHLY` está listo).
- **Ads slots nativos** con `AdSlot placement=` (hoy componente fantasma). Activar solo si MAU > N.

### 5.6 Escalabilidad / Performance

- **Cache Redis para directorios** (vets, refugios, paw companys) en edge fns — hoy cada request pega Supabase.
- **CDN real** (Cloudflare Pages / Vercel) para assets, dejar `docs/` solo como fallback GitHub Pages.
- **Preconnect / preload** de Supabase y fuentes en `index.html`.
- **Image optimization**: migrar imágenes usuarios a Supabase Storage con transformación (`?width=400`).
- **Sentry performance budget** con alertas (p95 navegación > 3s).

### 5.7 Observabilidad

- Ya hay `withTelemetry`, audit snapshots diarios, PostHog con identify. Falta:
- **Health dashboard público** (status.pawfriend.cl tipo `status.stripe.com`).
- **Alertas de pagos fallidos** a admin en tiempo real (hay framework, falta la regla).
- **Funnel dashboards** compartibles (activation, booking, paw member) — hoy solo admin.

---

## 6. Backlog por épicas

### Épica A — Seguridad pre-lanzamiento (P0)
- A.1 `verify_jwt=true` en edge fns no-webhook [0.5 d]
- A.2 Tabla `payment_events` + idempotencia Flow [1 d]
- A.3 `log-error` rate limit persistente [0.5 d]
- A.4 HMAC check en flow-webhook [0.5 d]
- A.5 CORS estricto en `_shared/cors.ts` [0.5 d]
- A.6 Rotación secrets Supabase documentada [0.25 d]

### Épica B — Onboarding & activación
- B.1 Post-signup detecta rol y manda a onboarding correcto [1 d]
- B.2 OnboardingDuenoMinimal con 3-5 pasos reales (perfil + mascota + push permiso) [2 d]
- B.3 OnboardingVetMinimal con verificación docs + primera cita demo [3 d]
- B.4 OnboardingShelter con import CSV y primera mascota publicada [2 d]
- B.5 Event `onboarding_completed` → contenido personalizado en home [1 d]

### Épica C — Engagement loop
- C.1 Edge fn `generate-daily-digest` con near-due reminders [2 d]
- C.2 Push segmentado por rol + preferencias en Settings [2 d]
- C.3 Weekly report email con hero metric por rol [3 d]
- C.4 Paw Points v2: qué gano, cómo canjeo (o decisión de ocultar) [2 d]
- C.5 D30 "Paw Friend Impact" email con donaciones y Paw Cards [2 d]

### Épica D — Mobile nativo de verdad
- D.1 Safe-area completo (header + sidebar + bottom tab + modals) [1 d]
- D.2 Haptics taxonómicos [1 d]
- D.3 Deep links universales Android/iOS [2 d]
- D.4 Push notifs segmentación + badge count [2 d]
- D.5 Offline-first ficha (read-only) [3 d]
- D.6 App tracking transparency iOS + consent [0.5 d]

### Épica E — Refactor god components
- E.1 AdminSalaInversion → 5 módulos [2 d]
- E.2 AdminSystemHealth → 3 módulos [1.5 d]
- E.3 AdminLeadsCRM → 4 módulos [2 d]
- E.4 AddPet wizard declarativo [3 d]
- E.5 ProviderPatients con tabla/filtros/acciones separados [2 d]

### Épica F — UX polish competitivo
- F.1 Dark mode real con toggle y respeto OS [1 d]
- F.2 Skip-link + alts + labels aria [0.5 d]
- F.3 `inputMode` + `autoComplete` en todos los forms [1 d]
- F.4 EmptyState variants uniformes [1 d]
- F.5 ErrorBoundary por ruta [1 d]
- F.6 `queryConfig.ts` + aplicar a hooks [2 d]

### Épica G — Monetización activable
- G.1 Paw Member con beneficios reales (cupones Paw Partners, primer partner vivo) [5 d]
- G.2 Vet upsell en perfil público con threshold [1.5 d]
- G.3 Paw Companys selfservice + badge automático [3 d]
- G.4 Donaciones recurrentes (requiere SpA Flow) [2 d + bloqueador operativo]
- G.5 Activar `AdSlot` con inventory de prueba [2 d]

### Épica H — Escalabilidad
- H.1 Cache Redis directorios [2 d]
- H.2 CDN real (Cloudflare) + imágenes optimizadas [3 d]
- H.3 Preconnect/preload crítico [0.25 d]
- H.4 Admin role-based code splitting [2 d]
- H.5 Lazy por tab en ficha clínica [1 d]

### Épica I — Observabilidad y calidad
- I.1 Health page público [1 d]
- I.2 Alertas pagos fallidos [0.5 d]
- I.3 Funnels compartibles [2 d]
- I.4 Performance budget Sentry [0.5 d]
- I.5 E2E por rol (reutilizar `_pending/auditoria-e2e/06-SMOKE_TEST_LAUNCH.md`) [3 d]

---

## 7. Dependencias técnicas

| Dependencia | Requerida por | Bloqueante |
|---|---|---|
| SpA Flow activa | G.4 donaciones recurrentes, B2B pagos limpios | **Sí** (operacional, no técnico) |
| Apple Developer account | Publicar iOS | **Sí** para store |
| Google Play Console | Publicar Android | **Sí** para store |
| Meta WhatsApp verified | `send-whatsapp-reminder` en prod | Sí para flujo WA |
| Cloudflare / Vercel | CDN real (H.2) | No (opcional) |
| Redis gestionado (Upstash?) | Cache directorios (H.1) | No (opcional) |
| Resend production | Email (ya usado) — revisar quota | Sí a partir de cierto volumen |
| GSC + Bing WMT | SEO de directorio / blog | No bloqueante |

Dependencias internas:
- Épica A precede a todo release público.
- Épica B es pre-requisito de C (sin onboarding no hay loop).
- Épica E no bloquea features, pero toda mejora en admin es 2x más lenta sin ella.
- Épica G depende de: al menos 1 Paw Partner firmado + SpA + 1 Paw Company pagando.

---

## 8. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Doble-cobro Flow en webhook replay | Media | Alto (plata real + confianza) | Épica A.2 **antes** de habilitar cualquier Flow link nuevo |
| Apple rechaza por a11y / dark mode / safe-area | Media | Alto (semanas de delay) | Épicas D y F antes de submit iOS |
| Admin compromiso sin 2FA | Baja | Catastrófico | 2FA + audit log |
| 100k MAU con admin refetch 60s | Media | Cost explosion Supabase | Épica E + Épica H.1 |
| God components crashean app entera | Media | Usuarios sin recovery | Error boundaries por ruta (QW-8) |
| Onboarding ausente → churn D1 > 60% | Alta | Crítico para metrics de ronda | Épica B |
| Paw Points confunde sin utilidad | Alta | Mala UX, frustra | C.4 — decisión binaria |
| Legal Chile SpA / facturación | Media | Mayor (opcional GAP) | Migrar cuenta Flow a SpA |
| SEO no indexa SPA en `docs/` | Media | Crecimiento orgánico lento | Ya hay `post-build-spa-routes.mjs` + sitemap. Verificar con Search Console. |
| Backlog de migraciones SQL no aplicadas | Media | Inconsistencias DB | Ritual weekly (ya existe `docs-raiz/operacion/`) |

---

## 9. Roadmap 30 / 60 / 90 días

Anclado al lanzamiento **1 de junio 2026** ([CONFIRMADO] memoria `project_launch_decisions_2026_04_20.md`).

### Primeros 30 días (2026-04-21 → 2026-05-21) — "Pre-launch hardening"

**Objetivo**: cerrar todos los P0 y dejar la app lista para ser instalable sin vergüenza.

- Épica A completa (seguridad P0)
- QW-1 a QW-10 (dark mode, safe area, alt, skip-link, haptics básicos, `verify_jwt`, `payment_events`, error boundaries, `staleTime`)
- Épica B.1 y B.2 (onboarding dueño post-signup)
- Épica F.1 a F.3 (dark mode real, a11y base, inputMode)
- Épica D.1 y D.2 (safe-area completo + haptics taxonómicos)
- Épica A.5 (CORS estricto)
- Primer test E2E smoke full (`_pending/auditoria-e2e/06-SMOKE_TEST_LAUNCH.md`)

**Entregables**: app con seguridad aceptable, dark mode, onboarding conectado, bloqueadores legales (SpA) resueltos o con plan firme.

### 30-60 días (2026-05-22 → 2026-06-21) — "Launch + engagement loop"

**Objetivo**: lanzar el 1 de junio y cerrar el ciclo de retención.

- **Lanzamiento 1 de junio** (landing final, stores iOS+Android, campaña)
- Épica B.3, B.4, B.5 (onboarding vet + shelter + eventos)
- Épica C.1 a C.3 (daily digest + push segmentado + weekly report)
- Épica E.1 y E.2 (refactor AdminSalaInversion + AdminSystemHealth)
- Épica G.2 (vet upsell perfil público)
- Épica I.1 y I.4 (health page + performance budget)
- QW-11, QW-12, QW-13, QW-14 (upsell, badge, log-error, lazy tabs ficha)

**Entregables**: app con loop D1/D7/D30 vivo, primera ola de reviews, métricas de activación limpias.

### 60-90 días (2026-06-22 → 2026-07-21) — "Monetización y escala"

**Objetivo**: activar motores de monetización pendientes y prepararse para 10k → 100k MAU.

- Épica G.1 (Paw Member con 3+ Paw Partners vivos)
- Épica G.3 (Paw Companys selfservice)
- Épica G.4 (donaciones recurrentes, una vez SpA lista)
- Épica D.3, D.4, D.5 (deep links, push segmentación, offline-first ficha)
- Épica E.3, E.4, E.5 (refactor AddPet, ProviderPatients, AdminLeadsCRM)
- Épica H.1 y H.4 (cache + role-based splitting)
- Épica C.4, C.5 (Paw Points decisión final + D30 Impact)
- Épica I.2, I.3, I.5 (alertas pago, funnels, E2E por rol)

**Entregables**: 3 motores de monetización activos (Paw Member + B2B Vet + Paw Companys), ronda-ready.

---

## 10. Top 10 acciones a ejecutar primero

En orden estricto. Todo P0 antes que P1.

1. **Activar `verify_jwt=true`** en edge fns no-webhook (`supabase/config.toml`). 10 min. **P0 seguridad**.
2. **Crear tabla `payment_events` + idempotencia en `flow-webhook`**. 1 día. **P0 pagos**.
3. **Mover `log-error` a rate limit persistente** (RPC como `flow-create-subscription` ya hace). 2 h. **P0 DoS**.
4. **Activar dark mode real** (`ThemeProvider` en `main.tsx`, toggle en Header, quitar `color-scheme: light` fijo). 3 h. **P1 UX + Apple**.
5. **Conectar onboarding post-signup**: el usuario nuevo con 0 mascotas entra a `OnboardingDuenoMinimal`; vet recién registrado entra a `OnboardingVetMinimal`. 1 día. **P1 activación**.
6. **Safe-area completo + haptics taxonómicos** en los 6 puntos clave. 2 días. **P1 mobile**.
7. **`ErrorBoundary` por ruta en `App.tsx`** (sin refactor, sólo wrapping). 2 h. **P1 resiliencia**.
8. **Refactor `AdminSalaInversion.tsx`** en 5 sub-componentes. 2 días. **P1 arquitectura** (habilita todo el resto del refactor admin).
9. **Edge fn `generate-daily-digest`** con near-due reminders + push para owners activos. 2 días. **P1 engagement**.
10. **Decisión Paw Points** (Épica C.4): o renombrar + ocultar hasta Q3, o conectar al menos 1 Paw Partner con canje real. 1 día. **P1 producto**.

---

## 11. Checklist de validación del documento

- [x] Diferencia [CONFIRMADO] / [SUPUESTO] / [PROPUESTA]
- [x] Cada recomendación tiene archivo o dependencia técnica
- [x] Tablas de prioridad / impacto / complejidad / urgencia
- [x] Roadmap 30/60/90 alineado al lanzamiento 1-jun-2026
- [x] Web / Android / iOS evaluados por separado en §5.3
- [x] Quick wins y épicas separadas
- [x] Riesgos incluyen mitigación, no sólo descripción
- [x] Cerrado con top-10 accionable en orden
