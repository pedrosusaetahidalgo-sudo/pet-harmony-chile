# Auditoría Integral PawFriend — 2026-04-27

> **Panel auditor**: Tech Lead Senior · Product Manager Senior vet-tech · UX/UI Senior · Growth/Monetización · AI/LLM Engineer · Security & Compliance · DevOps/SRE · Advisor pre-seed LATAM.
>
> **Reglas no negociables respetadas**: el dueño nunca paga · producto invisible · contraposicionamiento Petify · vets = canal · founder solo + Claude Code · costos < USD $100/mes · datos reales en prod · SpA Flow en migración · tuteo chileno · "menos features, mejor resueltas".
>
> **Outputs detallados por dominio** (auditorías ejecutadas por subagentes especializados, citadas por todo el informe):
> - [_archive/audits-2026-04-27/SECURITY_AUDIT_2026_04_27.md](_archive/audits-2026-04-27/SECURITY_AUDIT_2026_04_27.md) — Supabase + RLS + Auth + DevOps
> - [_archive/audits-2026-04-27/AI_AUDIT_2026_04_27.md](_archive/audits-2026-04-27/AI_AUDIT_2026_04_27.md) — Anthropic API (16 llamadas)
> - [_archive/audits-2026-04-27/LOCALIZATION_AUDIT_2026_04_27.md](_archive/audits-2026-04-27/LOCALIZATION_AUDIT_2026_04_27.md) — Voseo + microcopy chileno
> - [_archive/audits-2026-04-27/ARCH_UX_AUDIT_2026_04_27.md](_archive/audits-2026-04-27/ARCH_UX_AUDIT_2026_04_27.md) — Arquitectura + UX + Performance + Testing
> - [_archive/audits-2026-04-27/FEATURES_BIZ_AUDIT_2026_04_27.md](_archive/audits-2026-04-27/FEATURES_BIZ_AUDIT_2026_04_27.md) — Features + Monetización + Mobile + Docs + Compliance

---

## 0. Resumen Ejecutivo

### Veredicto general

PawFriend está **arquitectónicamente más maduro de lo que su `CLAUDE.md` sugiere** (313 migraciones, 64 edge fns, 431 componentes, ~99 páginas) y al mismo tiempo **menos preparado para lanzar el 1 de junio de lo que el README transmite**. Los pilares correctos están en el lugar correcto: Trinidad del Corazón identificada, Modelo v2 (Mapcity / dueño nunca paga) coherente, ficha clínica + PDF + sharing 30d + flow-webhook + idempotencia con HMAC excelentes, Sentry + PostHog activos. **Pero hay tres clases de deuda que matan el lanzamiento si no se atienden esta semana**:

1. **Privacidad por default rota**: `pets.is_public DEFAULT true` + policy `USING (is_public = true)` deja que cualquier visitante anónimo liste todas las mascotas con microchip, fotos y notas médicas. Es violación directa Ley 19.628 y, peor, el principio de marca "tu mascota no se perderá — ni en su historia". Una sola query de un periodista o un competidor desnuda al producto.
2. **Voseo argentino en emails y onboarding**: la regla `§9.5` se rompe en al menos **8 edge functions de email transaccional** que llegan al inbox del usuario (`Si tenés…`, `Podés…`, `Gracias a vos…`) y en **24 archivos `src/`** que el dueño ve en wizard de onboarding, banner de research consent, microcopy de notificaciones, tabs de la ficha. Cada hit es P0 según las reglas no negociables.
3. **Producto promesa sin producto real en 4 frentes B2B/operativos**: cobro de booking sin Flow conectado, T&C declara emisión SII pero 0 implementación, Track Clínica multi-vet sin onboarding seats, MyBookings sin botón cancelar (RPC ya existe). El deck de revenue depende de cada uno de esos puntos.

La buena noticia: **los hallazgos son corregibles en 1-2 sprints sin cambiar la tesis**. La mala: si se ignoran y se lanza el 1 junio en frío, el producto pierde credibilidad pública (privacidad), pierde a María Constanza (voseo, que en Chile suena "extranjero amigable" pero le quita autoridad médica), y al primer click serio de un VC LATAM se nota que la tesis B2B está pre-MVP en algunos motores.

### Top 5 hallazgos críticos (P0)

| # | ID | Resumen | Esfuerzo |
|---|---|---|---|
| 1 | **SEC-002** | `pets.is_public DEFAULT true` + RLS pública filtra TODAS las mascotas (microchip, fotos, notas). Ley 19.628 violada. | S (~30 min) |
| 2 | **LOC-* (40+ hits)** | Voseo argentino en emails productivos (`send-adoption-*`, `_shared/email-*`) + onboarding (`OnboardingQuickFlow.tsx`) + ficha (`AddReminderDialog`, `RegisterInterventionSheet`). Cada hit P0 por regla `§9.5`. | M (1 día con buscar/reemplazar) |
| 3 | **FEAT-001** | Dos onboardings de dueño coexisten (`OnboardingDuenoMinimal` y `OnboardingQuickFlow`); sólo uno marca `markOnboardingComplete`. Funnel roto. | S (4h) |
| 4 | **AI-001** | `wound-vision/index.ts:212-231` fallback a `urgency:'amarillo'` ("monitorear") cuando Claude alucina. Quemadura grave puede recibir falsa tranquilidad. | S (2h) |
| 5 | **MOB-005 + COMP-004** | iOS sólo tiene `AppIcon-512@2x.png` → App Store rechaza submission. T&C declara boletas SII pero 0 implementación → contingencia tributaria al lanzar. | M (1 día assets + decisión SII) |

### Top 5 quick wins (alto impacto, esfuerzo bajo)

| # | Win | Impacto |
|---|---|---|
| 1 | Cambiar `pets.is_public` default a `false` + crear `listed_for_adoption` separado | Cierra fuga privacidad P0 en <30 min |
| 2 | Helper `toastError(action, hint)` y reemplazar 77 `toast.error('Algo salió mal'…)` | Microcopy chileno cálido en 1 commit |
| 3 | Programar pg_cron para `compute_*_alerts` + `notify-health-alerts` | Activa cascadas Fase 2 ya construidas (gratis) |
| 4 | `nutrition-coach` mover contexto paciente del system estático al dinámico | Cache hit ~80% en llamadas repetidas (10 min trabajo) |
| 5 | Conectar botón "Cancelar" en `MyBookings.tsx:344-441` a RPC ya existente `cancel_reschedule_booking` | Cierra loop UX bookings con 1h de trabajo |

### Riesgos que pueden matar el producto en 30 días

1. **Demanda Ley 19.628** por la fuga `pets.is_public` antes de respuesta legal. Probabilidad baja, impacto existencial.
2. **Voseo en emails de onboarding** llega a un beta tester chileno y publica screenshot en Twitter ridiculizando "una app chilena que habla argentino". Probabilidad media, impacto en credibilidad.
3. **Lanzamiento sin App Store** porque iOS icons faltan. Probabilidad alta si nadie corre `npm run assets:generate`. Impacto: el lanzamiento queda 100% web.
4. **Cuenta Flow.cl a nombre personal** procesa pagos con SpA constituida pero no titular. SII puede mirar. Probabilidad media, impacto fiscal.
5. **Boletas SII declaradas en T&C pero no implementadas**: el primer pago real expone falta de cumplimiento. Probabilidad alta, impacto reputacional + fiscal.

---

## 1. Mapa del Repositorio (Fase 0)

### 1.1. Stack y configuración base

| Capa | Real | Notas |
|---|---|---|
| Framework | React 18 + TS 5.8 + Vite 5 | OK |
| TS strict | **`strictNullChecks:false`, `noImplicitAny:false`** ([tsconfig.json:9-14](tsconfig.json)) | **ARCH-002 P1** |
| Bundler | Vite con `manualChunks` object-based para vendors | Correcto post-rollback 2026-04-20 ([vite.config.ts:24](vite.config.ts)) |
| Backend | Supabase (Postgres+Auth+Edge Fns Deno+Storage). Project `gwailbjlvevkhwcrovfd` | OK |
| Pagos | Flow.cl (no Webpay como dice prompt) | `flow-webhook` con HMAC + idempotencia P0-2 (✓) |
| AI | Anthropic claude-haiku-4-5-20251001 (default), Sonnet 4.6 sólo en visión | Helper `_shared/ai-base.ts` con prompt caching |
| Mobile | Capacitor 7 (Android compilable, iOS testeado) | Falta `@capacitor/camera`; iOS icons incompletos |

### 1.2. Inventarios reales (vs CLAUDE.md)

| Métrica | CLAUDE.md §12 | **Real** | Delta |
|---|---|---|---|
| Migraciones SQL | 184+ | **313** | +70% |
| Edge functions | 35+ | **64** | +83% |
| Páginas (`src/pages/**/*.tsx`) | 65 | **99-106** | +60% |
| Componentes | 272 | **431** | +58% |
| Hooks | 68 | **105** | +54% |
| Libs | 38 | **70** (incl. 12 tests) | +84% |
| Tests unit | "393" | 28 archivos | inconsistencia (probablemente conteo de tests individuales) |
| Tests E2E | "336" | 19 specs (matriz 8 proyectos Playwright) | inconsistencia |
| Archivos `.md` (raíz + docs-raiz + _pending + _archive) | — | **179** | bloat severo |

→ **DOC-001 P2**: `CLAUDE.md` sección 12 está desactualizada; conteos honestos faltan en el manual operativo. Corregir en commit `chore(claude-md)`.

### 1.3. Top 10 archivos más grandes (god components)

| # | Archivo | Líneas |
|---|---|---|
| 1 | `src/components/admin/AdminSalaInversion.tsx` | 1638 |
| 2 | `src/pages/AddPet.tsx` | **1499** |
| 3 | `src/App.tsx` | 1187 |
| 4 | `src/components/admin/AdminAnalytics.tsx` | 1181 |
| 5 | `src/components/admin/AdminFeedback.tsx` | 1168 |
| 6 | `src/components/admin/AdminDashboard.tsx` | 1160 |
| 7 | `src/pages/ProviderPatients.tsx` | 1120 |
| 8 | `src/pages/ProDashboard.tsx` | 1051 |
| 9 | `src/pages/Maps.tsx` | 1012 |
| 10 | `src/components/admin/AdminLeadsCRM.tsx` | 989 |

→ Detalle en [_archive/audits-2026-04-27/ARCH_UX_AUDIT_2026_04_27.md sec ARCH-001](_archive/audits-2026-04-27/ARCH_UX_AUDIT_2026_04_27.md).

### 1.4. Edge functions y verify_jwt

64 edge functions. Sólo **3 con `verify_jwt = true`**: `generate-paw-passport`, `nose-print-embed`, `insurance-prefill-quote`. Las **61 restantes** validan auth manualmente (33 con `auth.getUser`, las demás son crons que reciben `service_role`). Rollback 2026-04-20 está documentado en [supabase/config.toml:5-9](supabase/config.toml). Cobertura `withTelemetry`: **56/64 (87.5%)**.

### 1.5. Llamadas Anthropic API detectadas

| Función edge | Modelo | Propósito | cache_control? |
|---|---|---|---|
| `pet-assistant` | haiku-4-5 | Asistente médico dueño | ✓ ([:211](supabase/functions/pet-assistant/index.ts)) |
| `breed-tips` | haiku-4-5 | Tips raza | ✓ pero <1024 tok = no-op |
| `bereavement-assistant` | haiku-4-5 | Memorial empático | ✓ |
| `medical-suggestions` | haiku-4-5 | Sugerencias médicas | ✓ |
| `consultation-prep` | haiku-4-5 | Prep cita vet | ✓ |
| `feedback-admin` | haiku-4-5 | 2 calls clasificación + tags | ✓ |
| `generate-shelters` | haiku-4-5 | Generar refugios mock | ✓ |
| `generate-vet-patient-summary` | haiku-4-5 | Resumen consolidado vet | ✓ |
| `generate-weekly-owner-reports` | haiku-4-5 | Reporte semanal dueño | ✓ |
| `generate-weekly-vet-reports` | haiku-4-5 | Reporte semanal vet | ✓ |
| `medical-suggestions` | haiku-4-5 | Sugerencias médicas | ✓ |
| `moderate-service-promotion` | haiku-4-5 | Moderación promociones | ✓ pero <1024 tok = no-op |
| `nutrition-coach` | haiku-4-5 | Coach nutrición | ✗ contexto en static = cache miss |
| `ocr-vaccination-card` | **sonnet-4-6** | OCR carnet (vision) | ✓ |
| `process-consultation-transcript` | haiku-4-5 | Transcripción consulta | ✓ |
| `symptom-triage` | haiku-4-5 | Triage síntomas | ✓ |
| `verify-service-provider` (rama vet) | **default sonnet implícito (BUG)** | Verificación vet | ✓ |
| `verify-service-provider` (otros) | haiku-4-5 | Verificación servicio | ✓ |
| `verify-vet-document` | haiku-4-5 | Verificar título vet | ✓ |
| `wound-vision` | **sonnet-4-6** | Visión heridas (vision) | ✓ |

Detalle exhaustivo + costos estimados + ranking 5 prompts peor escritos en [_archive/audits-2026-04-27/AI_AUDIT_2026_04_27.md](_archive/audits-2026-04-27/AI_AUDIT_2026_04_27.md).

### 1.6. Tablas críticas Supabase

`pets`, `profiles`, `service_providers`, `medical_records`, `consultation_notes`, `vet_clinical_notes`, `donations`, `b2b_api_keys`, `b2b_api_usage`, `pet_co_owners`, `adoption_centers`, `pitch_applications`, `pet_timeline_events`, `medical_share_tokens`, `pet_id_cards`, `paw_passports`, `nose_print_embeddings`, `error_logs`, `payment_events`, `subscriptions`. RLS habilitado en >95% (170+ ocurrencias `ENABLE ROW LEVEL SECURITY`), pero **70+ policies con `USING (true)`** algunas son cross-tenant leak (detalle SEC-003 abajo).

### 1.7. Documentación canónica leída

- ✅ `CLAUDE.md` — desactualizado en §12 (conteos), correcto en filosofía
- ✅ `MAPA_FUNCIONAL_COMPLETO.md` — bien estructurado, refleja v3 reordering
- ✅ `docs-raiz/pitch/MODELO_V2_2026_04_22.md` — fuente de verdad post-Roberto Camhi
- ✅ `docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md` — tesis Trinidad sólida
- ✅ `_pending/AUDITORIA_FEATURES_2026_04_27.md` — autoauditoría reciente con matriz 4 tests
- ✅ `_pending/HIDDEN_FEATURES_REVIEW_2026_10_27.md` — política "esconder, no eliminar" coherente
- ✅ `src/lib/featureFlags.ts` — 50+ flags, varios contradicen plan §2.10.2 (PRO_ANALYTICS=true)
- ✅ `src/lib/plans.ts` — Free=Premium en features (USER_PREMIUM=false respetado)
- ✅ `src/App.tsx` — 73+ rutas, lazy-loading completo

### 1.8. Dependencias relevantes

`package.json`: 50+ deps. Auditoría rápida:
- `@sentry/react@10.47.0` — pesado pero útil. Ya en chunk separado.
- `xlsx@0.18.5` — **PERF-001 P1**: no aislado en vendor chunk; sólo se usa en bulk import shelter. Mover a lazy import.
- `firebase@12.12.0` — pesado pero sólo se usa via Capacitor analytics. Verificar si entra al bundle web innecesariamente.
- Sin `lodash` duplicado, sin `moment` (usa `date-fns 4`). ✓
- Sin librerías obsoletas evidentes.
- Sin `npm audit` corrido en esta auditoría — recomendado P3.

---

## 2. Hallazgos por Prioridad

> Cada hallazgo: ID, título, categoría, archivo:línea, problema, evidencia, fix, esfuerzo (S=≤4h, M=1d, L=3d, XL=1sem), impacto, conflicto regla negociable.

### 🔴 P0 — Crítico (bloqueantes, seguridad, legal, voseo)

#### SEC-002 — Privacidad: `pets.is_public DEFAULT true`

- **Categoría**: seguridad / compliance
- **Archivos**: [supabase/migrations/20251127152253_1a29e3ec...sql:41,53-55](supabase/migrations/20251127152253_1a29e3ec-0e7b-4c2e-bbe3-c9cecea9ac26.sql), [supabase/migrations/20251128233606_7e570d60...sql:15](supabase/migrations/20251128233606_7e570d60-8ff6-4a5e-999d-e480156585a6.sql)
- **Problema**: Toda mascota nueva nace con `is_public=true` y existe `CREATE POLICY ... USING (is_public=true)`. Cualquier `select * from pets` desde anon expone nombre, especie, raza, foto, microchip y notas médicas (Ley 19.628 datos sensibles).
- **Evidencia**:
  ```sql
  CREATE TABLE pets (..., is_public BOOLEAN DEFAULT true, ...);
  CREATE POLICY "Mascotas publicas son visibles por todos"
    ON public.pets FOR SELECT USING (is_public = true);
  ```
- **Fix**:
  ```sql
  ALTER TABLE pets ALTER COLUMN is_public SET DEFAULT false;
  UPDATE pets SET is_public = false WHERE is_public = true;
  ALTER TABLE pets ADD COLUMN listed_for_adoption BOOLEAN DEFAULT false;
  DROP POLICY "Mascotas publicas son visibles por todos" ON pets;
  CREATE POLICY "Adoption pets visible publicly" ON pets
    FOR SELECT USING (listed_for_adoption = true);
  ```
- **Esfuerzo**: S (~30 min) · **Impacto**: cierra fuga existencial · **No choca con regla negociable**.

#### LOC-EMAIL-1..8 — Voseo argentino en emails productivos

- **Categoría**: localización / marca
- **Archivos**: [supabase/functions/_shared/email-theme.ts:249](supabase/functions/_shared/email-theme.ts), [supabase/functions/_shared/email-blocks.ts:106](supabase/functions/_shared/email-blocks.ts), [supabase/functions/_shared/invitation-email.ts:108,141,145,184,195,198,206](supabase/functions/_shared/invitation-email.ts), [supabase/functions/send-new-pet-drip/index.ts:90,97](supabase/functions/send-new-pet-drip/index.ts), [supabase/functions/send-inactive-user-reminder/index.ts:77,86](supabase/functions/send-inactive-user-reminder/index.ts), [supabase/functions/send-adoption-status-email/index.ts:63,86,111,167](supabase/functions/send-adoption-status-email/index.ts), [supabase/functions/send-adoption-followups/index.ts:99,100,106](supabase/functions/send-adoption-followups/index.ts), [supabase/functions/send-shelter-welcome/index.ts:102](supabase/functions/send-shelter-welcome/index.ts), [supabase/functions/nose-print-match/index.ts:312](supabase/functions/nose-print-match/index.ts), [supabase/functions/generate-shelter-report-pdf/index.ts:484](supabase/functions/generate-shelter-report-pdf/index.ts), [public/paw-friend-assets-v2/email/password_reset.html:67,71](public/paw-friend-assets-v2/email/password_reset.html), [public/paw-friend-assets-v2/email/member_welcome.html:86](public/paw-friend-assets-v2/email/member_welcome.html).
- **Problema**: cada uno es voseo (`tenés`, `podés`, `querés`, `vos`, `escribinos`, `compartile`, `Contale`, `acá`, `Registrate`, `Contactanos`) en correos que **se envían a usuarios reales chilenos** (welcome, drip, follow-up adopción, status email refugio, password reset). Regla `CLAUDE.md §9.5` y la 9 del prompt: **cada hallazgo es P0**.
- **Fix**: buscar/reemplazar exhaustivo (lista entera está en [_archive/audits-2026-04-27/LOCALIZATION_AUDIT_2026_04_27.md](_archive/audits-2026-04-27/LOCALIZATION_AUDIT_2026_04_27.md)). Validar con `grep -E "(tenés|podés|querés|vos\\b|sos\\b|acá|escribinos|usá|elegí|agregá|hablá|registrate|contactanos|peludit)" supabase/ src/ public/`.
- **Esfuerzo**: M (medio día con regex + revisión manual). **No choca con regla negociable**.

#### LOC-UI-1..40 — Voseo en código UI runtime (24 archivos)

- **Categoría**: localización / marca
- **Archivos**: detalle exhaustivo en [_archive/audits-2026-04-27/LOCALIZATION_AUDIT_2026_04_27.md sec "Hallazgos P0 voseo"](_archive/audits-2026-04-27/LOCALIZATION_AUDIT_2026_04_27.md). Highlights:
  - [src/pages/AddPet.tsx:657,661,1198](src/pages/AddPet.tsx) — `Podes invitar… No podes invitarte a vos mismo… Podés invitar a tu pareja…`
  - [src/pages/OnboardingQuickFlow.tsx:206,302,391,434,481,487-488,527,576,582](src/pages/OnboardingQuickFlow.tsx) — 9 instancias en el wizard de onboarding del refactor maestro
  - [src/pages/MisAdopciones.tsx:81,84](src/pages/MisAdopciones.tsx) — `Aún no tenés procesos… acá.`
  - [src/pages/InsightsLanding.tsx:355,357,361](src/pages/InsightsLanding.tsx) — `¿Tenés un ${data.breed}? … Agregá a tu mascota… ayudás…`
  - [src/components/medical/RegisterInterventionSheet.tsx:286,315,343](src/components/medical/RegisterInterventionSheet.tsx) — `Elegí una/uno`
  - [src/components/profile/ResearchConsentDialog.tsx:55,85-86,91](src/components/profile/ResearchConsentDialog.tsx) — `Paw Friend es y va a seguir siendo gratis para vos. Podés cambiarlo… Podes cambiarla…`
  - [src/components/reminders/AddReminderDialog.tsx:197,243](src/components/reminders/AddReminderDialog.tsx) — `¿Qué querés recordar?`
  - [src/components/medical/OwnerAudioNoteRecorder.tsx:238,263,273](src/components/medical/OwnerAudioNoteRecorder.tsx) — `Hablá lo que viste… libremente lo que querés dejar registrado… Usá Chrome o Edge…`
- **Esfuerzo**: M (1 día buscar/reemplazar + QA visual). **No choca con regla negociable**.

#### LOC-PELUDITO-1 — Término rioplatense "peludito" en `Donaciones.tsx`

- **Categoría**: localización
- **Archivo**: [src/pages/Donaciones.tsx:313](src/pages/Donaciones.tsx)
- **Problema**: `…con las mismas ganas de que a ningún peludito le falte nada.` Página pública crítica (donaciones / Paw Support).
- **Fix**: cambiar `peludito` → `peludo` (CLAUDE.md acepta `peludo` chileno).
- **Esfuerzo**: S (5 min). **No choca con regla negociable**.

#### FEAT-001 — Dos onboardings de dueño coexisten

- **Categoría**: producto / funnel
- **Archivos**: [src/pages/OnboardingDuenoMinimal.tsx:43-454](src/pages/OnboardingDuenoMinimal.tsx) y [src/pages/OnboardingQuickFlow.tsx:63-622](src/pages/OnboardingQuickFlow.tsx)
- **Problema**: Ambos cargados como rutas reales con flujos distintos. `OnboardingDuenoMinimal` llama a `markOnboardingComplete`; `OnboardingQuickFlow` (oficial Refactor Maestro §5.3) **no**. El funnel y `useOnboardingStatus` se rompen según puerta de entrada.
- **Fix**: consolidar en `OnboardingQuickFlow`. Borrar `OnboardingDuenoMinimal.tsx` o convertir en redirect 301 a `/add-pet?wizard=v2`. Asegurar que el wizard llame a `markOnboardingComplete` en `handleFinish` ([OnboardingQuickFlow.tsx:127-230](src/pages/OnboardingQuickFlow.tsx)).
- **Esfuerzo**: S (4h) · **Impacto**: funnel correcto + tracking PostHog estable.

#### FEAT-005 — Track Clínica B2B sin flujo multi-vet completo

- **Categoría**: monetización / B2B
- **Archivos**: [src/lib/plans.ts:317,350](src/lib/plans.ts), [src/pages/ProviderSeats.tsx](src/pages/ProviderSeats.tsx)
- **Problema**: Track Clínica ($19.900) y Pro Max ($29.900) declaran 3 seats / ilimitados pero el flujo de invitar vets adicionales no es 100% testeado. El plan está "escondido del pricing público" (modelo v2), pero se asigna manualmente desde admin → tiene que funcionar antes del lanzamiento si esperamos vender 1 deal Cafati o similar.
- **Fix**: confirmar que `/provider/seats` está accesible solo para `provider_clinic_starter` y `provider_pro_max`, testear flujo de invitación con 2 vets reales en staging, conectar AdminUsers a re-asignación de plan.
- **Esfuerzo**: M (1 día test + fixes residuales).

#### FEAT-008 — `/paw-game` auto-crea `user_guardian_progress` y contamina DB

- **Categoría**: producto / DB hygiene
- **Archivo**: [src/pages/PawGame.tsx:247-253](src/pages/PawGame.tsx)
- **Problema**: cualquier visita a `/paw-game` (incluyendo accidental por sidebar) crea fila en `user_guardian_progress`. Choca con principio "producto invisible". A 10K MAU son 10K filas vacías.
- **Fix**: gate creación detrás de chequeo "user clickeó CTA explícito", no auto-crear en mount. Considerar `RoleGuard requiredRole="owner"` y gating PostHog opt-in.
- **Esfuerzo**: S (2h). **Choca con regla 2 (producto invisible)**: rule wins, fix obligatorio.

#### FEAT-013 — `MyBookings` no permite cancelar reserva (RPC ya existe)

- **Categoría**: producto / UX crítico
- **Archivo**: [src/pages/MyBookings.tsx:344-441](src/pages/MyBookings.tsx)
- **Problema**: la RPC `cancel_reschedule_booking` existe (mig `20260725000006`), pero la UI no la conecta. El dueño no tiene cómo cancelar desde la app — sólo "Reseña" cuando ya pasó.
- **Fix**: agregar `<Button>Cancelar</Button>` con `confirm` y respeto a grace period 12h.
- **Esfuerzo**: S (1h).

#### FEAT-017 — Decisión: abandonar Nose Print v1, mantener Memorial + Paw Passport

- **Categoría**: estrategia producto
- **Justificación**: detalle en [_archive/audits-2026-04-27/FEATURES_BIZ_AUDIT_2026_04_27.md sec FEAT-017](_archive/audits-2026-04-27/FEATURES_BIZ_AUDIT_2026_04_27.md) y [memoria nose_print_master_plan](C:/Users/psusa/.claude/projects/c--Users-psusa-Desktop-pet-harmony-chile-main/memory/project_nose_print_master_plan.md).
  1. SigLIP2-base 0.445 gap insuficiente, fine-tune no mejoró
  2. Riesgo legal de revelar dueño equivocado (`featureFlags.ts:341-343` ya advierte)
  3. Opex HF Inference + pgvector ~+$40-80/mes sin revenue de respaldo
  4. Microchip Ley 21.020 + QR ID Card cubren 90% del use-case lost&found
  5. Paw Passport PDF y Memorial generan emoción y compartir social SIN costo de infra ML
- **Fix**: pausar `NOSE_PRINT_*` flags en false, dejar el código (regla "esconder no eliminar"), reactivar en Fase 3 con partner pharma que financie fine-tune o cuando exista volumen para entrenar propio.
- **Esfuerzo**: S (decisión + commit que apaga flags). **No choca con regla negociable** (mantenemos código).

#### AI-001 — `wound-vision` fallback a `urgency:'amarillo'` minimiza emergencias

- **Categoría**: AI / safety
- **Archivo**: [supabase/functions/wound-vision/index.ts:212-231](supabase/functions/wound-vision/index.ts)
- **Problema**: cuando Claude alucina o `parseJSON` falla, retorna `urgency:'amarillo'` ("Monitorear"). Una herida abierta o quemadura puede recibir falsa tranquilidad en caso edge.
- **Fix**: fallback conservador a `urgency:'naranja'` con mensaje "No pudimos analizar la foto. Lleva a tu mascota a un veterinario en las próximas horas o sube otra foto con mejor luz." O bloquear respuesta y pedir foto nueva.
- **Esfuerzo**: S (2h).

#### AI-002 — `verify-service-provider` (rama vet) usa default model implícito

- **Categoría**: AI / drift silencioso
- **Archivo**: [supabase/functions/verify-service-provider/index.ts:267-273](supabase/functions/verify-service-provider/index.ts)
- **Problema**: rama vet llama a `callClaude()` sin pasar `model:`. Depende del default `claude-sonnet-4-6` en [supabase/functions/_shared/ai-base.ts:164](supabase/functions/_shared/ai-base.ts). Si alguien cambia ese default a Haiku para ahorrar costos, la verificación de títulos veterinarios se degrada en silencio. La rama no-vet ([:422](supabase/functions/verify-service-provider/index.ts)) sí pasa modelo explícito.
- **Fix**: pasar `model: 'claude-sonnet-4-6'` explícito en la rama vet (o, si haiku es suficiente, `claude-haiku-4-5-20251001` explícito). Decisión consistente.
- **Esfuerzo**: S (15 min).

#### MOB-001 — Falta `@capacitor/camera`

- **Categoría**: mobile
- **Archivo**: [package.json](package.json)
- **Problema**: cámara nativa funciona "a medias" en iOS WebView porque la app depende de `<input type="file" accept="image/*" capture>`. En iOS PWA y WebView, capture no abre cámara directa de forma fiable.
- **Fix**: `npm i @capacitor/camera` + wrapper que use plugin nativo en `isNative()` y fallback a input HTML en web.
- **Esfuerzo**: M (4-6h).

#### MOB-005 — iOS sólo tiene `AppIcon-512@2x.png` → App Store rechaza

- **Categoría**: mobile / store
- **Archivo**: [ios/App/App/Assets.xcassets/AppIcon.appiconset/](ios/App/App/Assets.xcassets/AppIcon.appiconset/)
- **Fix**: `npm run assets:generate` (script ya existe en `package.json:21`) y commitear el set completo (29@2x, 29@3x, 40@2x, 40@3x, 60@2x, 60@3x, 76, 76@2x, 83.5@2x, 1024).
- **Esfuerzo**: S (10 min).

#### MOB-006 — Falta `NSLocationWhenInUseUsageDescription` en `Info.plist`

- **Categoría**: mobile / store
- **Archivo**: [ios/App/App/Info.plist](ios/App/App/Info.plist)
- **Problema**: si se activa `WALK_GPS_TRACKING` o se usa Maps con geolocation, iOS pide permiso pero rechaza la app si no hay descripción. App Store Review lo verifica.
- **Fix**: agregar `<key>NSLocationWhenInUseUsageDescription</key><string>Necesitamos tu ubicación para mostrar veterinarios cercanos en el mapa y sugerirte rutas de paseo. Solo se usa mientras la app está abierta.</string>`.
- **Esfuerzo**: S (5 min).

#### COMP-002 — Derechos ARCO declarados sin mecanismo automatizado

- **Categoría**: compliance Chile
- **Archivo**: [src/pages/PrivacyPolicy.tsx:118-127](src/pages/PrivacyPolicy.tsx)
- **Problema**: Política Privacidad dice que el usuario tiene derecho a acceso/rectificación/cancelación/oposición/portabilidad. No hay endpoint automatizado: requiere email manual. A 100K users no escala. Ley 19.628 lo permite pero la actualización 21.719 (vigente 2026) lo presiona.
- **Fix**: crear `/profile/exportar-mis-datos` que genere ZIP con `pets`, `medical_records`, `pet_reminders`, `bookings`, `donations` del user (RPC `export_user_data` con `auth.uid()`). Activar en Fase 1 post-launch.
- **Esfuerzo**: M (1 día).

#### COMP-004 — T&C declara boletas SII pero **0 implementación**

- **Categoría**: compliance / fiscal
- **Archivo**: [src/pages/TermsOfService.tsx](src/pages/TermsOfService.tsx) + búsqueda `boleta|invoice|SII` en `supabase/functions/` = 0 matches
- **Problema**: T&C promete emisión de boleta SII por cada pago. Hoy no hay integración con OpenFactura/SII Folios/Bsale. Cuenta Flow.cl además sigue **a nombre personal** (BIZ-003): cada transacción es declarada como ingreso personal de Pedro, no de SpA. Riesgo fiscal real al lanzar 1 junio.
- **Fix**:
  1. Migrar Flow.cl a SpA SUSAETA (en curso según CLAUDE §5).
  2. Decisión inmediata: emitir boletas via `OpenFactura` o `Bsale` (Chile compatibles). MVP: boleta sólo en pagos > $1.000. Edge fn `emit-sii-receipt` triggered desde `flow-webhook` post `payment_events.outcome='ok'`.
  3. Mientras tanto, **modificar T&C** para reflejar realidad: "Las boletas/facturas se emiten manualmente por SUSAETA GARNHAM SOFTWARE ENGINEERING SpA (RUT 78.328.659-9) dentro de las 48h desde el pago. Para solicitar reenvío, escribe a hola@pawfriend.cl."
- **Esfuerzo**: L (2-3 días incluida integración + decisión negocio).

#### BIZ-003 / BIZ-004 — Flow.cl a nombre personal vs SpA constituida

- **Categoría**: fiscal / negocio
- **Contexto**: SpA SUSAETA SOFTWARE ENGINEERING (RUT 78.328.659-9) constituida 2026-04-17. Cuenta Flow aún a nombre personal de Pedro Susaeta. Cada pago expone responsabilidad personal vs corporativa.
- **Fix**: **prioridad #1 antes del lanzamiento**. Migrar Flow ya en proceso (memoria del proyecto lo confirma). Hasta que cierre, no activar `DONATIONS_MONTHLY` (ya está en false correctamente, [featureFlags.ts:99](src/lib/featureFlags.ts)).
- **Esfuerzo**: depende de Flow.cl tiempos (~1-2 semanas). **Choca con regla 8** (SpA constituida pero cuenta no migrada): la regla manda no empujar features que asuman compliance fiscal completo. Cumplido al mantener `DONATIONS_MONTHLY=false`.

#### TEST-002 / TEST-003 — Tests bloqueantes para 1 junio

- **Categoría**: testing / launch readiness
- **Archivos**: [e2e/](e2e/) (19 specs), `src/**/*.test.{ts,tsx}` (28 archivos)
- **Problemas**:
  - **TEST-002 P0**: smoke E2E sólo cubre rutas, no flujos autenticados happy-path (signup → add pet → ficha → paywall → pago).
  - **TEST-003 P0**: 0 tests de aislamiento RLS cross-user (otro usuario no puede leer mis datos). Bloqueante para confianza pre-launch.
- **Fix**:
  1. 1 spec E2E happy-path autenticado (Playwright `chromium` desktop) que viva como `e2e/integration/happy-path-owner.spec.ts`.
  2. 1 test de RLS por tabla sensible: pets, medical_records, bookings, pet_co_owners, b2b_api_keys (5 tests).
- **Esfuerzo**: M (1 día por bloque) · **No choca con regla negociable**.

---

### 🟠 P1 — Alto (afectan conversión, retención, escalabilidad, compliance no inmediato)

| ID | Título | Archivo:línea | Esfuerzo |
|---|---|---|---|
| ARCH-001 | 10 god components > 800 líneas (5 admin = ~12k líneas) | top en sec 1.3 | L (refactor por módulo) |
| ARCH-002 | tsconfig sin strict + 301 violaciones `as any/@ts-ignore` en 150 archivos | [tsconfig.json:9-14](tsconfig.json) | XL (refactor incremental) |
| ARCH-003 | DRY: dialogs `Become*`, EmptyState, headers duplicados | múltiples | M |
| PERF-003 | 85 archivos con `.select('*')` (incluye públicas) | múltiples | M (auditar y narrow) |
| PERF-001 | `xlsx` no aislado en vendor chunk | [vite.config.ts:31](vite.config.ts) | S |
| PERF-005 | Landing sin `<picture>` y webp explícitos | [src/pages/Index.tsx](src/pages/Index.tsx) | S |
| DS-002 | 31 `<button>` nativos en 20 archivos rompen consistencia (focus, touch) | múltiples | M |
| TEST-001 | Coverage Vitest no configurado; 28 tests para 70 libs + 105 hooks + 431 components | [vitest.config.ts](vitest.config.ts) | S (config) + L (tests) |
| AI-003 | Prompt caching activo pero 8 de 16 prompts <1024 tokens = no-op | múltiples | M (consolidar prompts) |
| AI-004 | Cero validación zod del JSON output en 9 de 16 llamadas | múltiples | M |
| AI-005 | `nutrition-coach` mete contexto paciente en system static (cache miss) | [supabase/functions/nutrition-coach/index.ts:95-97](supabase/functions/nutrition-coach/index.ts) | S (10 min) |
| SEC-003 | `booking_events` policy `USING(true)` cross-tenant leak (audit trail expuesto) | [supabase/migrations/20260520000000_booking_system_v2.sql:154-157](supabase/migrations/20260520000000_booking_system_v2.sql) | S |
| SEC-007 | 15+ edge fns cron sin shared secret → DoS / spam abuse | [supabase/functions/audit-cron-daily/index.ts](supabase/functions/audit-cron-daily/index.ts) y otros | M |
| SEC-008 | `notify-pitch-application` sin auth, dispara email Resend + Slack/Discord | [supabase/functions/notify-pitch-application/index.ts](supabase/functions/notify-pitch-application/index.ts) | S |
| SEC-013 | Sentry sin `beforeSend` scrub PII (email, RUT) | [src/lib/sentry.ts:30-48](src/lib/sentry.ts) | S |
| SEC-014 | PostHog `identify()` con email plano sin gating consentimiento | [src/hooks/useAuth.tsx:14](src/hooks/useAuth.tsx) | S |
| SEC-012 | Privacy Policy incompleta (subprocesadores, retención explícita, 21.719) | [src/pages/PrivacyPolicy.tsx](src/pages/PrivacyPolicy.tsx) | M |
| FEAT-002 | OCR carnet sólo en `OnboardingDuenoMinimal` (legacy); el wizard nuevo no lo ofrece → pierde valor "ficha completa sin tipear" | [src/pages/OnboardingDuenoMinimal.tsx:317](src/pages/OnboardingDuenoMinimal.tsx) | S |
| FEAT-004 | `/onboarding-vet` es pitch decorativo sin DB write — "fake onboarding" | [src/pages/OnboardingVetMinimal.tsx:23-311](src/pages/OnboardingVetMinimal.tsx) | S (borrar/redirect) |
| FEAT-006 | Ficha clínica con 9 tabs legacy + 4 V2 (FICHA_TABS_V2=true) cargados | [src/pages/PetClinicalRecord/index.tsx:92-118](src/pages/PetClinicalRecord/index.tsx) | M (cleanup post 6m) |
| FEAT-010 | QR sync sin `track()` analytics → no medimos conversión | [src/hooks/useClaimPetInvitation.ts:15-74](src/hooks/useClaimPetInvitation.ts) | S |
| FEAT-014 | Comisión declarada en `plans.ts` pero sin `flow-create-booking` ni `flow-booking-webhook` (cobro online no conectado) | [src/lib/plans.ts:250,283,317,350](src/lib/plans.ts) | L |
| FEAT-016 | Fallback /nose-scan cuando flag false; revisar enlaces residuales en /home | [src/pages/NoseScan.tsx:58](src/pages/NoseScan.tsx) | S |
| FEAT-019 | Cascadas Fase 2 listas pero `pg_cron` pendiente programar → escalan a 0× users | [supabase/functions/run-all-cascades/](supabase/functions/run-all-cascades/) | S (Pedro pega SQL) |
| BIZ-006 | Sin cron de renovación recurrente Flow.cl → suscripciones expiran sin auto-renovar | n/a | M |
| BIZ-008 | Sin upsell visible Premium → Clínica para vets en growth | [src/pages/ParaVeterinarios.tsx](src/pages/ParaVeterinarios.tsx) | S |
| BIZ-010 | Precios sin claridad IVA explícita | [src/pages/ParaVeterinarios.tsx](src/pages/ParaVeterinarios.tsx) | S |
| MOB-003 | `PROVIDER_PUSH=false` → vets no reciben notif de bookings | [src/lib/featureFlags.ts:134](src/lib/featureFlags.ts) | M (smoke 1 vet) |
| MOB-007 | Universal Links iOS no configurados (apple-app-site-association ausente o incompleto) | n/a | S |
| MOB-010 | Sin manejo de `ChunkLoadError` (típico cuando hay nuevo deploy con user en sesión) | [src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx) | S |
| COMP-005 | Sin checkbox separado de marketing consent en Auth/registro | [src/pages/Auth.tsx](src/pages/Auth.tsx) | S |

### 🟡 P2 — Medio (deuda técnica, UX subóptima)

| ID | Título | Esfuerzo |
|---|---|---|
| SEC-004 | `provider_availability_exceptions.reason` expuesto a anon (PII potencial) | S |
| SEC-005 | 20+ policies redundantes scoped a `service_role` (RLS no aplica a service_role) | S (cleanup) |
| SEC-011 | Bucket `walk-photos` público con URL enumerable | S |
| FEAT-007 | Tabs legacy `TabVacunas`/`TabAntiparasitarios` no se renderizan; verificar campos lote/fabricante (feedback Sofia) | S |
| FEAT-009 | Streak diaria de PawGame choca con "producto invisible" (oculta pero no desactivada) | S |
| FEAT-011 | `QRLanding` sin rate limit en lookup token | S |
| FEAT-012 | `audit-cron-daily` con 10 `count: 'exact'` paralelos → timeout a 100K filas | S |
| FEAT-015 | Idempotencia flow-webhook OK; falta documentar para futuros agentes | S |
| AI-006..016 | Hallazgos puntuales prompts: max_tokens excesivos, sin streaming donde mejora UX, etc. (detalle en AI_AUDIT) | M (lote) |
| DOC-005 | **179 archivos `.md`** total — bloat severo. Reducir a <50 vivos. | M |
| LOC-MICROCOPY | 77 instancias `toast.error('Algo salió mal'…)` + 13 `'Error desconocido'` — helper centralizado pendiente | S (helper) + M (reemplazo) |

### 🟢 P3 — Bajo (nice to have, polish)

| ID | Título |
|---|---|
| SEC-001 | Actualizar `CLAUDE.md §9.2` con 9 pares timestamps duplicados (no 3) |
| SEC-006 | Auditar 30+ funciones `SECURITY DEFINER` con query del informe |
| FEAT-018 | PMH (PawFriend Marketing Hub) no existe — si está en roadmap, scaffolding pendiente |
| FEAT-003 | `OnboardingQuickFlow` redirige a `?tab=identidad` pero no auto-dispara captura nose print |
| ARCH-* | `useEffect` con `[]` que usa props/state — 10 candidatos en archivos top |

---

## 3. Auditoría por Dominio (Fase 1 expandida)

> Para no duplicar contenido, cada dominio referencia el doc detallado. Aquí el resumen ejecutivo por dominio.

### Dominio 1 — Arquitectura & Calidad de Código

Detalle: [_archive/audits-2026-04-27/ARCH_UX_AUDIT_2026_04_27.md sec B](_archive/audits-2026-04-27/ARCH_UX_AUDIT_2026_04_27.md).

- ❌ **TS strict deshabilitado** (`tsconfig.json:9-14`).
- ❌ **301 violaciones** `as any/@ts-ignore` en 150 archivos. Top: `AdminAnalytics.tsx` (13), `AdminFeedback.tsx`, `AdminLeadsCRM.tsx`.
- ⚠️ **10 god components** > 800 líneas (5 admin + AddPet + App + ProviderPatients + ProDashboard + Maps).
- ⚠️ **DRY**: `BecomeProviderDialog.tsx` (21KB) + `BecomeShelterDialog.tsx` patrones casi gemelos. EmptyState con 2 implementaciones.
- ✅ **Lazy-loading**: 100% rutas en `App.tsx` están `lazy()`. ✓
- ✅ **State management**: `react-query` + `QueryClient` con defaults sanos (5min staleTime). Sin Redux/Zustand.
- ⚠️ **`useEffect` con `[]` que usa props/state**: candidatos en `Auth.tsx`, `AppLayout.tsx`, varios admin.

### Dominio 2 — UX por página crítica

Detalle: [_archive/audits-2026-04-27/ARCH_UX_AUDIT_2026_04_27.md sec C](_archive/audits-2026-04-27/ARCH_UX_AUDIT_2026_04_27.md).

- ✅ **Index.tsx** (Landing v3 immersive): copy alineado modelo v2, hero con video real, JSON-LD Organization + es_CL locale, CTA primario claro. ✓
- ⚠️ **Home.tsx** (920 líneas): demasiados widgets compitiendo por foco. Plan §5.2.2 ya pivota a "mascota en foco" (`HOME_PET_FOCUS=true`). Verificar que el componente HomePetFocusV2 sea efectivamente el render path.
- ❌ **AddPet.tsx** (1499 líneas): bloqueante UX y arquitectura. 14 `useState`, fetch manual ignorando react-query. 3 hits voseo.
- ❌ **OnboardingQuickFlow.tsx**: 9 hits voseo, paso research consent con voseo en 3 strings.
- ✅ **PetClinicalRecord/index.tsx**: 4 tabs V2, lazy correct. Tab Identidad incluye Pet ID Card + Nose Print + Documentos.
- ⚠️ **PawGame.tsx**: streak diaria + auto-create progress contradice "producto invisible".
- ✅ **NoseScan.tsx**: gateado correctamente con flag false; copy con voseo (2 hits).
- ⚠️ **Auth.tsx**: 837 líneas. Magic link + Google + Apple + FB. Fix open redirect ya aplicado ([Auth.tsx:43-44](src/pages/Auth.tsx)). Apple ENABLED via `VITE_APPLE_SERVICE_ID` (FB también). Microcopy de errores con `describeSupabaseError()` ✓.
- ⚠️ **MyBookings.tsx**: ver FEAT-013 P0.

### Dominio 3 — Componentes & Design System

- ⚠️ **shadcn/ui usado consistentemente** en mayoría, pero **31 `<button>` nativos** en 20 archivos rompen focus ring + touch target.
- ✅ **Tokens Tailwind**: paleta brand v2 vivos en `paw-friend-assets-v2/`. `CategoryIcon` central con fallback Lucide.
- ⚠️ **DS-001**: variantes shadcn duplicadas (3 botones distintos en algunos admin componentes).
- ✅ **Iconografía**: lucide-react via `@/lib/icons` — patrón consistente.

### Dominio 4 — Supabase Schema, RLS, Functions

Detalle: [_archive/audits-2026-04-27/SECURITY_AUDIT_2026_04_27.md secs A-C](_archive/audits-2026-04-27/SECURITY_AUDIT_2026_04_27.md).

- ❌ **SEC-002 P0**: `pets.is_public DEFAULT true` (ver hallazgo P0 arriba).
- ❌ **SEC-003 P1**: `booking_events` cross-tenant leak.
- ⚠️ **SEC-004 P2**: `provider_availability_exceptions.reason` expuesto.
- ⚠️ **SEC-005 P2**: 20+ policies redundantes service_role.
- ✅ **`SECURITY DEFINER` revisados (sample 4)**: `is_pet_owner`, `verify_b2b_api_key`, `create_b2b_api_key`, `_get_service_role_key` — todos OK.
- ⚠️ **9 pares timestamps duplicados** (CLAUDE.md decía 3) + uno triple (`pet_id_cards.sql` con `deprecate_benign_errors_autofixer.sql` + `fix_pet_co_owners_rls_recursion.sql`).
- ✅ **313 migraciones**, todas con TZ correctos (`timestamptz`), índices en `owner_id`, FKs OK en sample.
- ⚠️ **Triggers plpgsql lazy-validation**: 4 incidentes documentados (sync_vaccination_status, notify_adoption_interest, create_default_reminders_for_new_pet, deworming reminder type CHECK). Regla `§9.2.1` exige smoke inline DO block. Auditar último mes de migraciones para verificar cumplimiento.

### Dominio 5 — Autenticación & Seguridad

Detalle: [_archive/audits-2026-04-27/SECURITY_AUDIT_2026_04_27.md sec F](_archive/audits-2026-04-27/SECURITY_AUDIT_2026_04_27.md).

- ✅ Magic link + Google OAuth + Apple Sign-In + Facebook configurados. Open redirect cerrado.
- ✅ Sólo `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` expuestas en cliente. `service_role` NO en `src/` (sólo aparece en `types.ts` autogenerado por Supabase como definición RPC).
- ⚠️ **SEC-013 P1**: Sentry sin `beforeSend` PII scrub.
- ⚠️ **SEC-014 P1**: PostHog `identify()` con email plano (sin gating consent).
- ✅ Política Privacidad menciona Ley 19.628 + ARCO ✓.
- ⚠️ Compliance Reglamento 21.719 (vigente 2026): Política no la menciona explícitamente.

### Dominio 6 — Integración Anthropic API ⚠️

Detalle exhaustivo: [_archive/audits-2026-04-27/AI_AUDIT_2026_04_27.md](_archive/audits-2026-04-27/AI_AUDIT_2026_04_27.md).

Resumen tabla maestra (16 llamadas, modelos por rol):

- **17 llamadas detectadas** (incluyendo 2 internas en `feedback-admin` y 2 en `wound-vision`).
- **Modelos**: 14 en haiku-4-5, 2 en sonnet-4-6 (visión: ocr + wound), 1 en default implícito (BUG AI-002).
- **Cero llamadas a Opus**. Decisión consistente con costo.
- **Prompt caching**: helper `_shared/ai-base.ts:157` aplica `cache_control` por default. 8 de 16 prompts son <1024 tokens → no-op (limite Anthropic). Recomendación: consolidar prompts cortos en system block uniforme.
- **Tuteo es-CL**: ✅ todos los system prompts críticos lo fuerzan explícito. ✓
- **Validación output**: 9 de 16 sin zod schema. AI-004 P1.
- **Inyección prompt**: ✅ helper `sanitizeForPrompt()` en `ai-base.ts:118-129` y patrón replicado en `pet-assistant`.
- **Costos estimados @ 1k MAU**: ~USD $5-8/mes (haiku barato). @ 10k MAU: ~USD $50-80/mes. Bien dentro del budget.

### Dominio 7 — Features Core

Detalle: [_archive/audits-2026-04-27/FEATURES_BIZ_AUDIT_2026_04_27.md sec A](_archive/audits-2026-04-27/FEATURES_BIZ_AUDIT_2026_04_27.md).

- ❌ Onboarding dueño doble (FEAT-001 P0).
- ⚠️ Onboarding vet decorativo (FEAT-004 P1).
- ❌ Track Clínica multi-vet sin onboard de seats (FEAT-005 P0).
- ✅ Ficha clínica V2 4-tabs activa, PDF + ZIP excelente (joya de la corona).
- ❌ PawGame auto-create DB pollution (FEAT-008 P0).
- ⚠️ QR sync sin analytics (FEAT-010 P1).
- ❌ MyBookings sin cancelar (FEAT-013 P0).
- ✅ flow-webhook con HMAC + idempotencia (FEAT-015 P2 doc).
- ✅ **Decisión: abandonar Nose Print v1, mantener Memorial + Paw Passport** (FEAT-017 P0).

### Dominio 8 — Monetización & Negocio

Detalle: [_archive/audits-2026-04-27/FEATURES_BIZ_AUDIT_2026_04_27.md sec B](_archive/audits-2026-04-27/FEATURES_BIZ_AUDIT_2026_04_27.md).

- ✅ Modelo v2 coherente en código + UI (USER_PREMIUM=false respetado).
- ⚠️ **BIZ-003/004 P0**: Flow.cl a nombre personal (no SpA).
- ❌ **COMP-004 P0**: T&C declara boletas SII pero 0 implementación.
- ⚠️ **BIZ-006 P1**: sin cron de renovación recurrente Flow → suscripciones expiran sin auto-renovar.
- ⚠️ **BIZ-008 P1**: sin upsell Premium → Clínica.
- ⚠️ **BIZ-010 P1**: precios sin claridad IVA explícita.
- ✅ **B2B API** scaffolded (`b2b-api` edge fn con X-Pawfriend-Api-Key + rate limit per-key + 4 endpoints + AdminB2BApiKeys panel) — esperando primer deal.
- ⚠️ Tracking conversión: PostHog `identify()` activo pero `track()` faltante en QR claim, paywall view, paw_member upgrade attempt.

### Dominio 9 — Mobile (Capacitor)

Detalle: [_archive/audits-2026-04-27/FEATURES_BIZ_AUDIT_2026_04_27.md sec C](_archive/audits-2026-04-27/FEATURES_BIZ_AUDIT_2026_04_27.md).

- ❌ **MOB-001 P0**: falta `@capacitor/camera`.
- ❌ **MOB-005 P0**: iOS icons incompletos → App Store rechaza.
- ❌ **MOB-006 P0**: falta `NSLocationWhenInUseUsageDescription`.
- ⚠️ **MOB-003 P1**: `PROVIDER_PUSH=false` → vets no reciben notif de bookings.
- ⚠️ **MOB-007 P1**: Universal Links iOS no configurados.
- ⚠️ **MOB-010 P1**: sin manejo `ChunkLoadError` post-deploy.
- ✅ Push notifications con FCM + deep links handler en `App.tsx:168-181` ✓.
- ✅ Apple Sign-In configurado end-to-end (memoria: Team 7Q8L7A2WM7, Service cl.pawfriend.web).

### Dominio 10 — Performance

- ⚠️ **PERF-001 P1**: `xlsx` no aislado en vendor chunk.
- ⚠️ **PERF-003 P1**: 85 archivos con `.select('*')`.
- ⚠️ **PERF-005 P1**: landing sin `<picture>` y webp explícitos para hero (mucho mobile chileno con conexión no-RM).
- ✅ Recharts y Leaflet ya en chunks separados.
- ✅ Sentry en chunk separado.
- ✅ React Query staleTime 5min sano.
- ⚠️ Cascadas (`run-all-cascades`): solo escalable si el cron real está activo (FEAT-019).
- 📌 **Web Vitals no medidos** — recomendado P3 instrumentar `web-vitals` package y reportar a PostHog.

### Dominio 11 — Testing

- ❌ **TEST-002 P0**: smoke E2E no cubre flujos autenticados.
- ❌ **TEST-003 P0**: 0 tests RLS cross-user.
- ⚠️ **TEST-001 P1**: Vitest sin coverage configurado; 28 tests para 70 libs + 105 hooks + 431 components.
- ✅ Playwright matriz 8 proyectos (chromium/firefox/webkit + 5 viewports). ✓
- ⚠️ Sin snapshot visual ni mutation testing ni contract testing con Supabase types.

### Dominio 12 — DevOps & Observabilidad

Detalle: [_archive/audits-2026-04-27/SECURITY_AUDIT_2026_04_27.md sec H](_archive/audits-2026-04-27/SECURITY_AUDIT_2026_04_27.md).

- ✅ CI/CD: GitHub Actions + husky pre-commit + lint-staged. ✓
- ✅ Sentry integrado (`@sentry/react@10.47.0`). ⚠️ falta `beforeSend` PII scrub (SEC-013).
- ✅ PostHog activo. ⚠️ identify con email plano (SEC-014).
- ✅ Logs estructurados: `withTelemetry` en 56/64 edge fns (87.5%) + `analytics_events` + `system_health_log`.
- ⚠️ `.env.example` no auditado en este pase — confirmar que esté actualizado.
- ✅ Backup strategy: snapshots Supabase Pro + edge fn `backup-weekly-snapshot`. Falta runbook de restore.

### Dominio 13 — Documentación

- ⚠️ **DOC-005 P2**: 179 archivos `.md` (10 raíz + 66 docs-raiz + 45 _pending + 58 _archive). Bloat severo.
- ⚠️ **DOC-001 P3**: CLAUDE.md §12 inventarios desactualizados (~60% delta).
- ✅ ADRs implícitos en `docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md` y similares — formato no canonical pero útil.
- ⚠️ Schema docs / diagrama ER: ausente. `MAPA_FUNCIONAL_COMPLETO.md` lo cubre parcialmente.
- ✅ `CONTRIBUTING.md` + `.github/PULL_REQUEST_TEMPLATE.md` con regla copy chileno (ironía: la regla está pero el código la rompe).
- ✅ README + setup en docs/ documentados.

### Dominio 14 — Localización chilena

Detalle exhaustivo: [_archive/audits-2026-04-27/LOCALIZATION_AUDIT_2026_04_27.md](_archive/audits-2026-04-27/LOCALIZATION_AUDIT_2026_04_27.md).

- ❌ **40+ hits voseo en 24 archivos `src/`** (P0 cada uno).
- ❌ **24 hits voseo en 8 edge fns email** (P0 cada uno).
- ❌ **3 hits voseo en HTML emails `public/`** (espejo en `docs/`).
- ❌ **1 hit "peludito" en `Donaciones.tsx:313`** (P0).
- ✅ **0 hits "che", "boludo", "pibe", "laburar", "quilombo", "chévere", "coger"** en runtime.
- ✅ **System prompts AI** todos fuerzan tuteo es-CL explícito.
- ⚠️ **77 instancias `toast.error('Algo salió mal')`** + 13 `'Error desconocido'` — microcopy frío y poco accionable. Helper centralizado pendiente.
- ✅ **Formatos**: 0 hits `MM/DD/YYYY` en runtime; montos correctos `$1.000` punto miles.

### Dominio 15 — Compliance & Riesgo Legal Chile

Detalle: [_archive/audits-2026-04-27/FEATURES_BIZ_AUDIT_2026_04_27.md sec E](_archive/audits-2026-04-27/FEATURES_BIZ_AUDIT_2026_04_27.md) y [_archive/audits-2026-04-27/SECURITY_AUDIT_2026_04_27.md sec G](_archive/audits-2026-04-27/SECURITY_AUDIT_2026_04_27.md).

- ✅ T&C + Política Privacidad presentes con Ley 19.628 + ARCO.
- ❌ **COMP-002 P0**: ARCO sin mecanismo automatizado.
- ❌ **COMP-004 P0**: T&C declara boletas SII / 0 implementación.
- ⚠️ **COMP-005 P1**: sin checkbox separado de marketing consent.
- ⚠️ Reglamento 21.719 (vigente 2026): Política no la menciona explícitamente.
- ⚠️ SpA constituida 2026-04-17, Flow a nombre personal (BIZ-003/004).
- ✅ CookieConsentBanner activo en `App.tsx:292`.
- ✅ Tratamiento datos salud animal: encriptación at-rest Supabase Pro + RLS. PendingPolítica explícita en sec dedicada.

---

## 4. Auditoría AI — Tabla Maestra Anthropic

Tabla completa, system prompts pegados completos, ranking 5 prompts peor escritos con reescritura, costos estimados:
**[_archive/audits-2026-04-27/AI_AUDIT_2026_04_27.md](_archive/audits-2026-04-27/AI_AUDIT_2026_04_27.md)**.

Highlights críticos:

| Hallazgo | Severidad | Ubicación |
|---|---|---|
| `wound-vision` fallback `urgency:'amarillo'` minimiza | **P0** | [supabase/functions/wound-vision/index.ts:212-231](supabase/functions/wound-vision/index.ts) |
| `verify-service-provider` rama vet usa default model implícito | **P0** | [supabase/functions/verify-service-provider/index.ts:267-273](supabase/functions/verify-service-provider/index.ts) |
| 8/16 prompts <1024 tok = `cache_control` no-op | P1 | múltiples |
| 9/16 sin validación zod del JSON output | P1 | múltiples |
| `nutrition-coach` contexto en system static = cache miss | P1 | [supabase/functions/nutrition-coach/index.ts:95-97](supabase/functions/nutrition-coach/index.ts) |

**Voseo en system prompts**: 0 ✓. La fuga de voseo está en email templates, no en prompts AI.

---

## 5. Análisis Estratégico (Fase 2)

### 16. Product-Market Fit Signals

- **¿Las features priorizadas resuelven dolor real de María Constanza y Dr. Matías?**
  - María Constanza: ✅ ficha + PDF + sharing + recordatorios resuelven 80% del use-case. ⚠️ onboarding aún tiene 9 voseo + dual-flow → fricción real para una persona que abre la app 4x/año.
  - Dr. Matías: ✅ booking V2 + bulk import + audio notes + audit trail. ❌ falta multi-vet seats funcional para clínica grande. ⚠️ track Clínica oculto del pricing es coherente con modelo v2 pero el flujo real para asignar plan via admin no está testeado.

- **¿Qué feature parece "gold plating" y debería eliminarse (no esconderse)?**
  - **Streak diaria del Paw Game** (FEAT-009): contradice "producto invisible". El plan §10 ya la baja a sidebar pero el código sigue motivando check-in diario. **Eliminar la lógica streak**, no sólo esconderla.
  - **Comunidad por raza** (LABS_COMMUNITY=true): sin grupos creados en DB, sin tracción. Si en 6 meses sigue así, eliminar UI (`HIDDEN_FEATURES_REVIEW_2026_10_27.md` ya lo plantea).
  - **Map pet-friendly hardcoded** (MAP_PET_FRIENDLY=false ya): ya escondido — ratificar eliminación si no aparece DB real en 6 meses.

- **¿Qué falta crítico bloquea adopción Cafati y otras clínicas?**
  - Multi-vet seats funcional (FEAT-005 P0).
  - Bulk import probado a escala con 200+ pacientes (existe el flow pero sin smoke test real).
  - Comisión booking 3% real cobrable: hoy `commissionRate` es número en TS sin enforcement DB (FEAT-014).
  - Boletas SII (COMP-004 P0).

### 17. Competencia & Diferenciación

- **Posicionamiento vs Petify (USD $0.50/mascota/mes)**: ✅ contraste muy claro en deck. La regla "el dueño nunca paga" + Mapcity story es defendible y honesta. Memoria del proyecto lo confirma.
- **Posicionamiento vs WhatsApp + papelería + sistemas legacy**: ✅ ficha digital + PDF + sharing 30d hacen el caso por sí solos.
- **¿AI es diferenciador real o gimmick?**: 50/50. Asistente médico + bereavement + breed tips + symptom triage + OCR carnet + nutrition coach + wound vision son sólidos pero la mayoría son commodities (cualquier wrapper de Anthropic puede replicar). El **moat real está en data agregada longitudinal** (correlation_definitions / correlation_observations), no en los wrappers AI.
- **Moat construido**: 24-36 meses según refactor maestro. Hoy: 0 deals B2B firmados, scaffolding de B2B API listo. **Honestidad brutal**: el moat es plan, no realidad. Cualquier inversor serio lo notará.
- **Comparables LATAM Sura/BCI/Mapfre integrando con founder solo + 5k MAU**: **ningún caso público** que valide eso. Hay deals seguros pet en LATAM (Sura Argentina, Sancor) pero todos con equipos de 10+ y series A. Ser honesto con esto en pitch.

### 18. Growth Loops & GTM 90 días

- **Loop viral vet → dueño → vet**: ✅ existe via QR + sharing 30d, pero **falta `track()` analytics** (FEAT-010) → no podemos optimizar.
- **QR sync optimizado como growth lever**: ✅ implementado en `useClaimPetInvitation` y `AutoClaimByEmail`.
- **Paw Game retención**: dudoso. Sin metrics post-launch no sabemos si mueve aguja. Plan §10 ya lo baja de prominencia.
- **Roadmap 1.000 dueños sin Meta Ads**:
  1. SEO insights públicos (`/insights/:slug` ya activo, 3 tipos) — long tail "peso promedio bulldog francés Chile".
  2. Outreach 13 refugios chilenos (memoria del proyecto: enviado 2026-04-27).
  3. Comunidad real con Centrovet (Agrosuper) post mes 4-6.
  4. Sofia + 2 vets adicionales testimonial multi-rol (memoria: confirmado expansion INIT-18).
  5. Compartir ficha viral con vet → vet ve PDF profesional + invita 5 dueños más.
- **50 vets activos creando fichas mes 1-3**: depende 100% de `RegistroVeterinario.tsx` funnel. Hay que QA de extremo a extremo.
- **Centrovet pitch mínimo viable ANTES de email**: armar PDF de 1 página con (a) volumen MAU proyectado, (b) consent rate research, (c) data agregada raza top 5, (d) propuesta sponsored reminder Mes 4-6. Hoy no existe.
- **3 KPIs leading semanales post-launch**:
  1. Pets creadas / Pets activas (carga de ficha en últimos 7d).
  2. % users con consent research opt-in (objetivo 30%+).
  3. Bookings completados / mes (con comisión cobrada cuando se conecte cobro online).

### 19. Stress-test del modelo de negocio

- **¿USD $20-500K/brand pharma año 1 sin tracción es realista?** **No.** Pharma LATAM no firma deals sin >50K MAU activos + consent rate >30% + correlation insights publicables. Realista: **piloto $5-20k al mes 6** si Centrovet acepta MVP sponsored reminder. Mes 12: **$50-150k** si se firmaron 1-2 deals con métricas publicables.
- **¿Pharma deals tardan 12-18 meses? Plan B**: sí, asumir 9-12 meses como mínimo. Plan B = Paw Companys + Paw Voices (ya activos) + retail afiliado (más rápido cerrar 1 deal Master Dog que 1 deal Centrovet) + donaciones voluntarias post migración Flow SpA.
- **¿Validación competitiva con Petify es honesta?** Sí, contrastes son verdaderos (Petify cobra USD $0.50/mascota/mes, captura 10% del mercado). PawFriend es honesto al decir "queremos el 100% via B2B".
- **¿Modelo aguanta o debe evolucionar?**: aguanta como tesis, **necesita evolucionar en métricas**. Lo que está mal explicitado en el deck:
  - Tiempo realista a primer deal pharma (12 meses, no 4-6).
  - Riesgo de canibalización: si seguros pet (Sura, BCI) deciden hacer su propia app, PawFriend es proveedor de canal vs propietario de la relación.
  - Dependencia de modelo Mapcity en mercado donde Equifax tiene >40 años de data — PawFriend tiene 6 meses. La data moat se construye, no se compra.

---

## 6. Priorización RICE — Top 12 antes del 1 junio 2026

> Reach × Impact × Confidence / Effort. Reach normalizado 0-10. Impact 0-3. Confidence 0-1. Effort en días-founder.

| # | Item | R | I | C | E | RICE | Justificación |
|---|---|---|---|---|---|---|---|
| 1 | **SEC-002 fix `pets.is_public default false`** | 10 | 3 | 1 | 0.1 | **300** | Cierra fuga Ley 19.628. 30 min. Existencial. |
| 2 | **LOC-EMAIL/UI fix voseo (40+ hits)** | 10 | 3 | 0.95 | 1 | 28.5 | Marca + reglas no negociables. 1 día regex+QA. |
| 3 | **FEAT-001 consolidar onboardings dueño** | 8 | 3 | 0.9 | 0.5 | 43 | Funnel + tracking. 4h. |
| 4 | **AI-001 wound-vision fallback conservador** | 5 | 3 | 0.95 | 0.25 | 57 | Safety crítica. 2h. |
| 5 | **MOB-005 + MOB-006 iOS assets + Info.plist** | 10 | 3 | 1 | 0.2 | **150** | Bloquea App Store. 1h. |
| 6 | **COMP-004 boletas SII (decisión + parche T&C)** | 7 | 3 | 0.7 | 1 | 14.7 | Riesgo fiscal + reputacional. 1d decisión + 1d parche T&C. Implementación full L. |
| 7 | **FEAT-013 botón cancelar booking en MyBookings** | 7 | 2 | 1 | 0.1 | **140** | RPC ya existe. 1h. |
| 8 | **TEST-002 + TEST-003 happy-path E2E + RLS cross-user** | 9 | 3 | 0.9 | 2 | 12.15 | Confianza pre-launch. 2 días. |
| 9 | **AI-005 nutrition-coach mover contexto a dynamic block** | 6 | 1 | 1 | 0.02 | **300** | Cache hit ~80%. 10 min. |
| 10 | **FEAT-019 programar pg_cron cascadas** | 8 | 2 | 1 | 0.1 | **160** | Cascadas Fase 2 listas; sin cron escala 0×. |
| 11 | **SEC-007 + SEC-008 cron edge fns con shared secret** | 6 | 2 | 0.9 | 1 | 10.8 | DoS + spam abuse. 1d. |
| 12 | **FEAT-005 multi-vet seats Track Clínica E2E test** | 4 | 3 | 0.8 | 1 | 9.6 | Sin esto, no se cierra deal Cafati. 1d test+fixes. |

**Justificación de los que dejé fuera del top 12 (top 3 que parecen obvios)**:

- **ARCH-002 strict TS + 301 violaciones**: RICE bajo (Effort XL, Impact difuso). No mueve ningún KPI antes del 1 junio. Hacerlo en sprint 3-6 cuando el lanzamiento esté estable.
- **DOC-005 reducir 179 .md a <50**: doc bloat es real pero no afecta usuarios, sólo agentes IA. Hacer en una sesión "limpieza" post-launch.
- **PERF-003 .select('*') en 85 archivos**: optimización valiosa pero RICE bajo si bundle/Web Vitals no son problema medido. Instrumentar Web Vitals primero.

---

## 7. Roadmap Propuesto

### Sprint 0 (esta semana, 2026-04-27 → 2026-05-04)
**Objetivo**: cerrar P0 y los 5 quick wins.

- Día 1-2: SEC-002 + AI-001 + AI-002 + FEAT-013 + AI-005 + MOB-005 + MOB-006.
- Día 3-4: LOC-EMAIL + LOC-UI buscar/reemplazar exhaustivo + QA visual (priorizar onboarding + emails productivos).
- Día 5: FEAT-001 consolidar onboardings + FEAT-008 fix paw-game auto-create + FEAT-019 programar pg_cron cascadas.
- Día 6: COMP-004 parche T&C honesto sobre boletas + decisión integración OpenFactura/Bsale.
- Día 7: FEAT-017 ratificar abandono Nose Print v1 con commit que apaga flags y deja código.

### Sprint 1 (2026-05-05 → 2026-05-18)
**Objetivo**: P1 monetización + testing + multi-vet.

- TEST-002 + TEST-003 (happy-path E2E + RLS cross-user).
- FEAT-005 multi-vet seats E2E test.
- FEAT-002 OCR carnet en `OnboardingQuickFlow`.
- BIZ-006 cron renovación recurrente Flow.
- BIZ-008 + BIZ-010 upsell + IVA explícito.
- SEC-007 + SEC-008 cron edge fns shared secret.
- SEC-013 + SEC-014 Sentry beforeSend + PostHog identify gated.
- COMP-002 export `/profile/exportar-mis-datos`.
- COMP-005 marketing consent checkbox.
- MOB-001 `@capacitor/camera`.
- MOB-007 Universal Links iOS.

### Sprint 2 (2026-05-19 → 2026-05-31, último sprint pre-launch)
**Objetivo**: hardening final + smoke tests.

- BIZ-003/004 cierre migración Flow.cl a SpA (depende Flow.cl tiempos).
- FEAT-014 conectar cobro online booking (decisión: se conecta o se declara explícito que es post-launch).
- COMP-004 implementación full SII si se decide ir.
- Smoke test E2E con 5 usuarios beta reales (Sofia + 4 más, multi-rol).
- Web Vitals instrumentado.
- 1 sesión de cleanup `as any` en top 5 archivos admin.
- Lint global de voseo (regex en CI).

### Sprints 3-6 (post-launch, 2026-06-01 → 2026-08-31)
**Objetivo**: P1 estructurales + P2 deuda.

- ARCH-001 god components: refactor `AddPet.tsx`, `AdminSalaInversion.tsx` y top 3 admin.
- ARCH-002 strict TS gradual (archivo por archivo, top 20 con más violaciones).
- DOC-005 reducir 179 .md a <50 vivos.
- LOC-MICROCOPY helper centralizado + reemplazo 77 toast.error.
- AI-003/004 zod schemas + consolidar prompts <1024 tok.
- PERF-003 narrow .select('*') en públicas.
- FEAT-006 cleanup ficha tabs legacy una vez V2 estable 6m.
- BIZ revisión post-launch: desactivar `LABS_COMMUNITY`/`LABS_BLOOD_DONORS` si tracción <5% MAU.

### Backlog (P3)
- SEC-001 update CLAUDE.md con 9 pares duplicados.
- SEC-006 audit `SECURITY DEFINER` masivo.
- FEAT-018 PMH si entra al roadmap.
- FEAT-003 auto-disparar captura nose print desde tab Identidad.

---

## 8. Riesgos Globales — 5 Red Flags Existenciales

| # | Riesgo | Probabilidad | Mitigación concreta |
|---|---|---|---|
| 1 | **Demanda Ley 19.628** por SEC-002 antes del fix | Baja | Fix HOY (30 min). Cierra el riesgo. |
| 2 | **Voseo público + screenshot redes sociales** ridiculizando "app chilena que habla argentino" | Media | Sprint 0 día 3-4 buscar/reemplazar exhaustivo + lint en CI. |
| 3 | **Flow.cl a nombre personal procesa 1er pago real** | Alta | No activar `DONATIONS_MONTHLY` hasta migración. Ya está en false ✓. Notar al SII si se procesan pagos durante migración. |
| 4 | **App Store Review rechaza el 1 junio** por iOS icons / Info.plist | Alta si nadie ejecuta | `npm run assets:generate` + commit Info.plist permisos. Sprint 0. |
| 5 | **Pharma deal tarda 18 meses, queman runway** | Alta | Plan B activado: priorizar Paw Companys + Paw Voices + retail afiliado mes 4-9 con tickets más chicos pero más rápidos de cerrar. Paw Support (donaciones voluntarias) cuando Flow migre. |

### Pregunta incómoda que un VC LATAM serio haría

> *"En Chile no hay precedente de un founder solo con <5k MAU cerrando un deal Pharma > USD $20k anual en menos de 12 meses. Sura/Mapfre no firman canales con apps pre-PMF. Petify ya está. ¿Qué te hace pensar que Centrovet o Virbac firmarán contigo en mes 4-6 cuando ningún competidor latam lo ha hecho con tu tracción? ¿Y si la respuesta es 'va a tardar 12 meses', cuánto runway necesitas para que ese deal te encuentre con caja?"*

**No tenemos respuesta sólida hoy**. La estrategia honesta:
- Ajustar pitch: pharma realista mes 9-12, no 4-6.
- Backup mes 4-6: 2 deals retail afiliado (Master Dog, Falabella Pet) + 5 deals Paw Companys.
- Levantar runway mínimo 18 meses asumiendo pharma tarda 12.

---

## 9. Métricas a Instrumentar YA

Lista de eventos críticos faltantes (ordenados por valor PMF):

| Evento | Donde se dispara | Por qué importa | Implementación |
|---|---|---|---|
| `pet_claimed_via_qr` | [src/hooks/useClaimPetInvitation.ts:70](src/hooks/useClaimPetInvitation.ts) success | Loop viral vet→dueño | `track('pet_claimed_via_qr', { vet_linked, source })` |
| `pet_claim_failed` | misma ubicación error switch | Detectar friction | `track('pet_claim_failed', { error_code })` |
| `onboarding_completed` | `OnboardingQuickFlow.handleFinish()` | Funnel real (FEAT-001 fix) | `track('onboarding_completed', { steps_completed, used_ocr, used_nose_print, research_consent })` |
| `paw_member_paywall_view` | `PawMember.tsx` mount | Conversión | `track('paw_member_paywall_view', { source, current_pets })` |
| `flow_subscription_created` | callback `paw-member/success` | Pago efectivo (no fake metric) | `track('flow_subscription_created', { plan, amount_clp })` |
| `medical_pdf_downloaded` | `pdf.ts` after blob.save() | Joya corona uso real | `track('medical_pdf_downloaded', { pet_id, sections })` |
| `medical_share_token_generated` | `useMedicalSharing` | Viralidad médica | `track('medical_share_token_generated', { ttl_days })` |
| `paw_passport_generated` | `generate-paw-passport` edge fn response | Refactor maestro Trinidad pilar | `track('paw_passport_generated', { pet_id })` |
| `memorial_share_card_downloaded` | `MemorialShareCard` Canvas blob | Viralidad emocional | `track('memorial_share_card_downloaded', { pet_id })` |
| `vet_invited` (vet desde modal copropiedad) | hooks copropiedad | Loop owner→vet | `track('vet_invited', { method: 'email|qr|link' })` |
| `research_consent_changed` | `Profile.tsx` toggle | KPI Pharma deal viable | `track('research_consent_changed', { value })` |
| `b2b_api_key_created` | edge fn `b2b-api` admin | Primer deal real | server-side log + alert Slack |

**Implementación**: la mayoría son 1 línea en el callsite + un evento PostHog. `useAnalyticsTracker.ts` ya existe — usar el patrón.

**Dashboards mínimos PostHog**:
1. **Funnel onboarding**: `auth_signin` → `onboarding_started` → `pet_created` → `onboarding_completed` → 1d retention.
2. **Viral loop**: `medical_share_token_generated` → `pet_claimed_via_qr` → `vet_invited`.
3. **Monetización**: `paw_member_paywall_view` → `flow_subscription_created`.
4. **PMF leading KPI**: % users con `research_consent_changed:true` (target 30%+).

---

## 10. Apéndice

### 10.1. Glosario rápido

- **Trinidad del Corazón**: Pet ID Card + Nose Print + Ficha Médica (Refactor Maestro §0).
- **Producto invisible**: principio post-Roberto Camhi 2026-04-22.
- **Mapcity model**: el dueño/vet no paga; pagan pharma/seguros/retail por acceso a la ficha.
- **Paw Member**: membresía voluntaria $3.990/mes, sólo badge (no desbloquea features).
- **USING(true)**: policy RLS sin restricción — peligrosa si tabla no es intencionalmente pública.
- **withTelemetry**: wrapper Deno que loguea cada call a `analytics_events` + `system_health_log`.
- **`cache_control: { type: 'ephemeral' }`**: prompt caching Anthropic, TTL 5 min.

### 10.2. Referencias a docs externas y memoria del proyecto

- [docs-raiz/pitch/MODELO_V2_2026_04_22.md](docs-raiz/pitch/MODELO_V2_2026_04_22.md)
- [docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md](docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md)
- [_pending/AUDITORIA_FEATURES_2026_04_27.md](_pending/AUDITORIA_FEATURES_2026_04_27.md)
- [_pending/HIDDEN_FEATURES_REVIEW_2026_10_27.md](_pending/HIDDEN_FEATURES_REVIEW_2026_10_27.md)
- [CLAUDE.md](CLAUDE.md)

### 10.3. Queries SQL ejecutadas (recomendadas para validar manualmente)

```sql
-- Tablas sin RLS en public
SELECT schemaname, tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename NOT IN (
  SELECT tablename FROM pg_policies WHERE schemaname = 'public'
);

-- Policies con USING(true)
SELECT tablename, policyname, qual::text
FROM pg_policies
WHERE schemaname = 'public' AND qual::text ILIKE '%true%'
ORDER BY tablename;

-- SECURITY DEFINER funcs
SELECT proname, pronamespace::regnamespace, prosecdef, prorettype::regtype
FROM pg_proc WHERE prosecdef AND pronamespace = 'public'::regnamespace;

-- Tablas gamificación con tracción real (decisión revisión 2026-10-27)
SELECT schemaname, relname, n_live_tup, last_autovacuum, last_analyze
FROM pg_stat_user_tables
WHERE schemaname='public'
  AND relname IN ('user_guardian_progress','paw_card_collections','user_missions',
    'user_achievements','paw_game_monthly_rankings','daily_challenges')
ORDER BY n_live_tup DESC;

-- Pets con is_public=true (post-fix debería ser ~0 a menos que listed_for_adoption)
SELECT count(*) FROM pets WHERE is_public = true;
```

### 10.4. Datos faltantes (no estaban en el repo, pidiendo a Pedro)

1. **Web Vitals de producción** (LCP, INP, CLS últimos 30d). Sin esto, PERF-* es heurística.
2. **PostHog dashboards reales**: ¿qué eventos están instrumentados hoy en producción y cuáles son los volúmenes?
3. **Cuentas reales con cuentas Flow.cl SpA migración status** (handoff doc del trámite).
4. **Centrovet/Virbac/Sura cualquier conversación previa** que valide tiempos realistas a deal.
5. **Tracción actual MAU** (no aparece en docs) — sin esto, RICE Reach es heurística.
6. **iOS App Store + Play Console submission status** (memoria del proyecto: en proceso, sin fechas).
7. **Sofia + otros vets beta tester feedback más reciente** post-2026-04-25.

---

## Cierre

El producto tiene **alma y dirección correctas** (Roberto Camhi + Refactor Maestro lo prueban). Los hallazgos P0 de esta auditoría no son fallos de tesis — son fallos de ejecución que se arreglan en 1 sprint. La prioridad real:

1. **Cerrar la fuga `pets.is_public`** hoy.
2. **Limpiar voseo** esta semana (regex + QA visual).
3. **Consolidar onboardings** y conectar cancelar booking esta semana.
4. **Programar pg_cron cascadas** y hacer fix nutrition-coach (10 min cada uno).
5. **iOS assets + Info.plist** antes de App Store submission.

Cumplido lo anterior, el lanzamiento 1 junio 2026 es razonable. **Sin lo anterior**, el lanzamiento es prematuro y arriesga credibilidad chilena (voseo), exposición legal (privacy), App Store rechazo y/o riesgo fiscal (boletas SII + Flow personal).

— Panel auditor, 2026-04-27.
