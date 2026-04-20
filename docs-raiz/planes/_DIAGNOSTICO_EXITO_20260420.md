# Diagnóstico — Plan de Éxito 90 días Paw Friend

> Generado: 2026-04-20
> Autor: Claude Code (bajo dirección de Pedro Susaeta)
> Alcance: estado real del producto, negocio, capital, operación al cierre del sprint 2026-04-20.
> Fuente: lectura directa del repo (CLAUDE.md, INDEX.md, MAPA_FUNCIONAL_COMPLETO.md, auditorías 04-12 a 04-16, `src/lib/plans.ts`, `src/lib/featureFlags.ts`, `package.json`, últimas 30 migraciones, 41 edge functions).
> Objetivo: alimentar el `PLAN_EXITO_90D_20260420.md` con la realidad del proyecto, sin inventar.

---

## 1. Estado actual por dimensión

### 1.1. Producto & UX

| Qué está vivo | Qué está a medias | Qué falta | Fuente |
|---|---|---|---|
| Ficha clínica PDF (joya de la corona) + ZIP con README + timeline cronológico | Agenda del día para vets (vista calendario) | Gráficos de peso/salud en ficha | `src/pages/PetClinicalRecord/pdf.ts`, `MAPA_FUNCIONAL_COMPLETO.md §3`, memoria `project_session_2026_04_19_pdf_redesign.md` |
| Directorio público SEO de vets (`/veterinarios`, filtros comuna/especialidad) | Mapa de adopción con coords reales (C3 de auditoría UX) | Disponibilidad real-time en directorio | `src/pages/DirectorioVets.tsx`, `audits/AUDITORIA_UX_COMPLETA_2026_04_14.md` |
| Onboarding owner 3 pasos + OCR carnet vacunas | Onboarding vet: clínica del onboarding no se edita después (H8) | Wizard "primera mascota" paso a paso con preview de recordatorios | `src/pages/OnboardingDuenoMinimal.tsx`, auditoría UX H8 |
| Ficha compartida `/medical-share/:token` 30 días | Sección dedicada "Vacunas" y "Antiparasitarios" en ficha (pedido de Sofia) | Gráficos peso/salud, historial IA persistente | `audits/FEEDBACK_VET_SOFIA_2026_04_13.md` §1-3 |
| Paw Cards con 6 rarezas + QR + holográficos | Home sigue con PawGame primero; carga visual alta para dueños (feedback Palo) | Nav simplificada para iPhone (feedback Palo) | `audits/FEEDBACK_PALO_2026_04_16.md` |
| Refugios como onboarding inicial (rol `shelter`, bulk import CSV/XLSX) | Transfer con link manual (no email automático por SpA pendiente) | Match automático adoptante-mascota, checkins 1/3/6 meses (mig `20260626` ya existe, falta UI) | `MAPA_FUNCIONAL_COMPLETO.md §12`, mig `20260620000000_adoption_centers.sql` |
| Booking V2 (availability rules, exceptions, audit trail) | Pago integrado dentro del booking (A3: `visit_address='A coordinar'`, `total_price=0`) | Cancelación con política, rating post-servicio | `audits/FEATURES_INCOMPLETAS_2026_04_14.md` A3, `src/pages/PerfilVetPublico.tsx:127` |
| Google Calendar vivo end-to-end | Sync bidireccional (actualmente solo Paw Friend → GCal) | Sync incremental (hoy re-envía todo siempre) | `audits/OPTIMIZACION_COSTOS_2026_04_12.md §5.2` |

**Gap UX crítico detectado**: el flujo `Joya de la corona → compartir con vet → vet responde` aún depende de email, no hay push ni notificación real-time al vet cuando el dueño comparte. La auditoría marca esto como "diferenciador único".

### 1.2. Growth & marketing

| Qué está vivo | Qué está a medias | Qué falta | Fuente |
|---|---|---|---|
| Landing v3 (Hero con video real, MedicalPDFShowcase, FAQ separada, RichFooter, secciones inmersivas) | `/registro-partner` es ruta huérfana (sin CTA in-app, sólo landing) | Tráfico orgánico medible (no hay analytics acumulados de 30d) | memoria `project_session_2026_04_18_landing_v3_decks.md`, auditoría UX "rutas huérfanas" |
| 6 landings pitch dedicadas: CORFO, Start-Up Chile, Paw Companys, Angels, Hogares de Adopción, Paw Partners | Outreach a 3 empresas reales (ManpowerGroup, Gildemeister) pendiente de envío | Sin tráfico atribuible aún; pipeline B2B vacío | `docs-raiz/marketing/outreach/`, `pitch-inversionistas/` |
| Estimador precios por comuna (`/precios-veterinarios`) — diferenciador único vs competencia | SEO del directorio vets sólo parcial (meta tags sí, sitemap sí, backlinks casi cero) | Content marketing / blog (cero posts) | `audits/COMPETENCIA_2026_04_08.md`, `supabase/functions/generate-sitemap/` |
| Paw Voices y Paw Companys con landings + formulario `/aplicar?tipo=...` (mig `20260625000000`) | Sistema de aplicaciones aprobación manual; cero aplicaciones procesadas aún | Paw Voices con creadores reales onboardeados (0 hoy) | mig `20260625000000_pitch_applications.sql`, `src/pages/Aplicar.tsx` |
| PostHog identify() + scrub tokens (project `_session_2026_04_19_consolidado`) | PostHog todavía no está validado en producción con cohortes | Embudos reales (signup → crear mascota → compartir ficha) | memoria `project_posthog_findings_2026_04_17.md` |
| Vet-led growth: edge fn `send-pet-invitation` + `send-lead-outreach` | Sólo 1 vet beta real (Sofia); sin pipeline de reclutamiento de vets | CRM leads vets (AdminLeadsCRM existe pero sin data) | memoria `project_sofia_vet_beta_tester.md`, `supabase/functions/send-lead-outreach/` |

**Gap growth crítico**: no hay adquisición orgánica medible. El directorio SEO es el canal más barato disponible pero no hay backlinks ni posts. Si esto no arranca en Q1, el CAC implícito es "tiempo de Pedro" sin tope.

### 1.3. Modelo de negocio & monetización

| Qué está vivo | Qué está a medias | Qué falta | Fuente |
|---|---|---|---|
| Modelo híbrido canonizado (5 motores + 3 alianzas) | Paw Member $3.990/mes sin evidencia empírica de disposición a pagar | Validar DAP con survey a 30 dueños reales | `CLAUDE.md §5`, `src/lib/plans.ts:55-84` |
| B2B Vets 4 tiers ($0 / $9.9k / $19.9k / $29.9k) con bulk import para clínicas | Cero vets pagando Premium o superior hoy | Primer vet pagando Premium ($9.9k) como hito S1-S2 | `src/lib/plans.ts:227-359` |
| Flow.cl integrado end-to-end (idempotencia + rate limit + webhook) | Cuenta Flow a nombre personal (NO SpA) — riesgo fiscal CRÍTICO | Migrar cuenta a SpA (SUSAETA GARNHAM SOFTWARE ENGINEERING 78.328.659-9, ya constituida) | `CLAUDE.md §5 Aviso fiscal`, memoria `project_spa_meta_verif_2026_04_17.md` |
| Donaciones voluntarias con muralla pública (commit `991c2acc`) | `DONATIONS_MONTHLY=false` y `SHELTER_DONATIONS=false` (bloqueados por falta de SpA) | Activar recurrentes cuando cuenta migre | `src/lib/featureFlags.ts:97-108` |
| Paw Companys + Paw Partners tabla `paw_companys` (mig `20260611000000`) | Cero partners firmados | 3 Paw Companys sponsor firmadas a día 90 (hipótesis) | mig `20260604010000_paw_companys.sql` |
| Publicidad (5º motor) | Sólo definida conceptualmente, sin infra (`src/components/PartnerAd.tsx` es placeholder) | No activar hasta tener MAU >N que justifique slots | `CLAUDE.md §5 Motor 5` |

**Gap de negocio crítico**: la única fuente de ingresos testeable en 90 días es Paw Member + B2B Vets Premium. Donaciones y Paw Companys quedan bloqueadas hasta SpA. Todo el fundraising pasa por demostrar MRR defendible aunque sea mínimo.

### 1.4. Técnico & arquitectura

| Qué está vivo | Qué está a medias | Qué falta | Fuente |
|---|---|---|---|
| TS 5.8 + React 18 + Vite 5 + Supabase + Flow | Bundle: chunk Sentry 458kB/151kB gzip (más grande que todo) | Reemplazar `@sentry/react` por `@sentry/browser` o lazy más agresivo | `CLAUDE.md §12`, `docs-raiz/planes/SUGERENCIAS_COMPLETAS_2026_04_16.md §P3` |
| 41 edge fns (vs 28 que dice CLAUDE §6) con telemetry wrapper (`withTelemetry`) | `verify_jwt=true` activado (Fase 1 costos). OK | Rate limiting en `flow-webhook` (S4 sugerencias) | `audits/OPTIMIZACION_COSTOS_2026_04_12.md §3.3`, lista `supabase/functions/` |
| 188 migraciones SQL aplicadas (última: `20260626000000`) | Timestamps duplicados en 3 pares (idempotentes, documentados) | RLS audit pendiente en algunas tablas nuevas (pitch_applications, adoption_centers) | `CLAUDE.md §9.2`, `SUGERENCIAS_COMPLETAS_2026_04_16.md §S5` |
| Tests: tsc 0 err, lint 0 err (85 a11y warn), Vitest 377 passing, E2E 336/336 | Coverage ~2.4% (sólo `src/lib/`) | Tests de integración RLS (usuario A no puede ver data de B) + E2E para booking/payment | `project_session_2026_04_19_e2e_fix.md`, `SUGERENCIAS_COMPLETAS_2026_04_16.md §Q1-Q2` |
| Sentry instalado + PostHog identify() + Firebase Analytics | Sin dashboard de observabilidad unificado | `generate-weekly-owner-reports` + `generate-weekly-vet-reports` deployadas pero sin cron | `audits/FEATURES_INCOMPLETAS_2026_04_14.md §C5` |
| WhatsApp Meta Cloud API código listo (cron 1x/día, opt-in pre-filtrado) | Verificación Meta Business reenviada con SII doc; 2-5 días espera (memoria `project_spa_meta_verif_2026_04_17.md`) | Activar envío real cuando Meta apruebe | memoria `project_spa_meta_verif_2026_04_17.md` |
| Cross-platform: Android Play Store 70%, iOS 15% | iOS requiere Apple Developer Program ($99/año) | Comprar Apple Dev account + generar certificados + subir TestFlight | `audits/CROSS_PLATFORM_COMPATIBILITY.md`, memoria `project_session_2026_04_15_crossplatform.md` |
| Health score de edge fns en admin panel | Score ya mide 0-100 por fn; copiar-todas JSON | Nada crítico | memoria `project_session_2026_04_18_health_score.md` |

**Gap técnico crítico**: sin co-founder técnico, Pedro es único punto de falla. `npm run check:all` corre (tsc + lint + test:ci + build) pero la carga de release la absorbe sólo él.

### 1.5. Capital & fundraising

| Qué está vivo | Qué está a medias | Qué falta | Fuente |
|---|---|---|---|
| Pitch deck narrativo 13 slides (PITCH_DECK.md) | Deck CORFO SSAF-I redactado (`pitch-inversionistas/01_CORFO_SSAF-I.md`) | Enviar postulación real a CORFO | `docs-raiz/pitch/PITCH_DECK.md`, `pitch-inversionistas/01_CORFO_SSAF-I.md` |
| Deck Start-Up Chile Ignite (`pitch-inversionistas/02_START_UP_CHILE.md`) | Última convocatoria Ignite cerró 2025-11-28; próxima ventana probable Q3 2026 | Confirmar fechas oficiales en startupchile.org/corfo.cl | `WebSearch 2026-04-20`, enlaces CORFO abajo |
| SpA constituida (SUSAETA GARNHAM SOFTWARE ENGINEERING 78.328.659-9, Luis Pasteur 6111 Dp 201 Vitacura) | Cuenta Flow NO migrada a SpA (cuenta personal) | Migración bancaria Flow vía Tenpo/Mach/Prex | memoria `project_spa_meta_verif_2026_04_17.md`, `CLAUDE.md §5 Aviso fiscal` |
| Pitch deck angels LATAM (`04_ANGELES_VC_LATAM.md`) con lista Tier 1-3 | Score VC 5.5/10 (memoria `project_vc_plan_2026_04_18.md`) | Dejar Paw Labs escondido en pitch + MRR defendible + co-founder | memoria `project_vc_plan_2026_04_18.md` |
| Landing `pawfriend.cl/pitch/` con 4 enlaces públicos (inversionistas, companys, partners, voices) | Sample dashboard `/pitch/sample-dashboard.html` publicado | Enviar a 10 angels Tier 1 | `INDEX.md §Inversionistas y partners` |
| Doc APALANCAMIENTO_FUNDADOR_IA.md: 320 hrs vs ~4.800 hrs = 15x tiempo, 32-65x costo | Sólo referenciado en deck Slide 10 | Validar evidencia con métricas reales de commits | `docs-raiz/pitch/APALANCAMIENTO_FUNDADOR_IA.md` |

**Gap de capital crítico**: sin revenue verificable (Paw Member + B2B Vets), el pitch angels es débil. La ruta más limpia a 90 días es CORFO SSAF-I (USD $28k equity-free) + Start-Up Chile Ignite ($30M CLP equity-free cuando abra la ventana).

### 1.6. Operación & KPIs

| Qué está vivo | Qué está a medias | Qué falta | Fuente |
|---|---|---|---|
| Admin panel 13 tabs + Dashboard + Finance + PostHog realtime + polling adaptativo | Ritual semanal documentado pero no registrado (no hay log de ejecución) | Log de rituales (Pedro firma que se ejecutó cada lunes) | `CLAUDE.md §8` menciona `docs/RITUAL_WEEKLY_OPS.md` pero ese archivo NO existe en repo hoy (gap de instrumentación) |
| Pulso Diario widget en Admin + audit-cron-daily + audit_snapshots | 3 auto-fixers seguros | Runbook formal de respuesta a incidentes | memoria `project_monitor_auto_pilot_2026_04_17.md` |
| AdminDashboard KPIs: usuarios, mascotas, edge fn health, donaciones, Paw Member count | No hay North Star visible ni embudos completos | 1 North Star + 5 KPIs enmarcados en el Home del admin | `src/components/admin/AdminDashboard.tsx`, memoria `project_session_2026_04_17_admin_live.md` |
| Feedback widget `/home` + admin backend | Feedback de Sofia + Paloma absorbido | Iteración continua con 3-5 vets beta | memorias `project_sofia_vet_beta_tester.md`, `project_feedback_palo_2026_04_16.md` |
| Slack/Discord para notificaciones (opcional) | Todavía no conectado a alertas automáticas | Alerta automática si health score <70 | backlog cierre `47c449c6` |

**Gap operacional crítico**: no hay North Star única. Hoy el admin muestra 10+ KPIs sin priorización. Un inversor pide 1 métrica primero.

---

## 2. Baseline de métricas

### 2.1. Métricas que se pueden medir HOY (fuente en repo)

| Métrica | Fuente | Frecuencia |
|---|---|---|
| Usuarios totales (auth) | `auth.users` (Supabase) | Tiempo real |
| Mascotas registradas | `pets` count | Tiempo real |
| Fichas PDF generadas | edge fn `generate-medical-summary` invocations (admin health score) | Diario |
| Fichas compartidas (links activos) | `pet_medical_shares` | Tiempo real |
| Vets registrados | `service_providers` count | Tiempo real |
| Vets con plan != free | `service_providers.plan_id` filter | Tiempo real |
| MRR B2B | SUM(monthlyPrice) de vets con plan activo | Manual por ahora |
| Donaciones totales | `donations` sum + muralla pública | Tiempo real |
| Paw Members (badge) | `profiles` con `is_paw_member=true` | Tiempo real |
| Reservas confirmadas | `bookings` con status='confirmed' | Tiempo real |
| Retención D1/D7/D30 | PostHog (pending validación real) | Diario |
| Edge fn health score | `audit_snapshots` (mig `20260528`) | Diario (cron 8 AM) |

### 2.2. Gaps de instrumentación (cosas que necesito medir pero no puedo hoy)

| Métrica faltante | Por qué importa | Dónde agregarla |
|---|---|---|
| **MAU owner** (dueño activo =1 acción/mes) | Es el denominador de casi todo lo B2C | PostHog event `owner_active` + vista materializada `mau_owners` |
| **Fichas PDF descargadas/mes** (candidato North Star) | Mide uso real de la joya de la corona | Tracking event `pdf_generated` en `MedicalSummaryButton` + admin KPI |
| **Ficha compartida → vet respondió** | Cierra el loop B2C→B2B, nadie en competencia lo tiene | Evento nuevo `vet_opened_shared_ficha` + columna `opened_at` en `pet_medical_shares` |
| **Retención D7 por cohorte de onboarding** | Señala si el onboarding funciona | PostHog retention board con cohort=signup_week |
| **Tiempo p50 onboarding dueño** | Debe ser <3 min según objetivo | PostHog step timing |
| **Net Promoter Score de vets beta** | Convierte feedback cualitativo en número | Edge fn `feedback-admin` (ya existe) + survey NPS |
| **CAC por canal** | Proxy: horas Pedro / nuevos users/mes | Trackear manualmente hasta que haya >100 MAU |

---

## 3. Riesgos críticos identificados (top 5)

1. **Cuenta Flow a nombre personal (riesgo fiscal CRÍTICO)** — Mientras no se migre a SpA, todos los ingresos (Paw Member, B2B vets, donaciones) quedan tributariamente a nombre de Pedro persona natural. Impide activar donaciones recurrentes + dirigidas a refugio (flags `DONATIONS_MONTHLY` y `SHELTER_DONATIONS` en `false`). Además deja sin operar el flujo de Paw Companys sponsor mensual. Fuente: `CLAUDE.md §5 Aviso fiscal operacional`, `src/lib/featureFlags.ts:97-108`, memoria `project_spa_meta_verif_2026_04_17.md`. **Mitigación**: SpA ya constituida (RUT 78.328.659-9). Sólo falta abrir cuenta bancaria empresa y migrar titularidad Flow.

2. **Founder único sin co-founder técnico** — Pedro absorbe producto + ingeniería + comercial + fundraising. Una enfermedad o desmotivación de 2 semanas detiene todo. El score VC (memoria `project_vc_plan_2026_04_18.md`) lo marca como 5.5/10, con "falta de co-founder" como principal deductor. **Mitigación**: buscar co-founder técnico part-time o advisor con equity (hipótesis a validar con Pedro, ver §9 del plan).

3. **WhatsApp Meta Business verification pendiente** — Meta reenvió la verificación con el documento SII de la SpA; espera 2-5 días desde 2026-04-17 (memoria `project_spa_meta_verif_2026_04_17.md`). Si Meta rechaza, el diferenciador "recordatorios WhatsApp" queda off. **Mitigación**: email como fallback (ya implementado) y comunicar en pitch que es feature complementario, no core.

4. **B2C 100% gratis sin evidencia empírica de disposición a pagar Paw Member** — `USER_PREMIUM=false` (`src/lib/featureFlags.ts:19`). El plan Paw Member $3.990/mes sólo entrega badge. Cero conversiones a la fecha. Si en 90 días no hay ≥20 Paw Members pagando, la tesis de "donaciones + Paw Member sostienen la operación" queda sin respaldo. **Mitigación**: en vez de activar paywall, validar con survey + onboarding opcional de donación one-time (ya existe).

5. **Competencia B2C (Petsy) tiene app publicada en App Store y overlap 1:1** — Paw Friend todavía no está en App Store (iOS 15% listo, falta Apple Dev account). Si Petsy escala antes, pierde el first-mover en AppStore chileno. Fuente: `audits/COMPETENCIA_2026_04_08.md §5`. **Mitigación**: acelerar iOS TestFlight en Sprint 3-4 + defender moat con directorio público SEO (único) y migración WhatsApp.

---

## 4. Ventajas competitivas ya construidas (alimentan pitch)

Cruzando `audits/COMPETENCIA_2026_04_08.md` con features vivas del repo:

| Ventaja | Nadie en Chile la tiene | Evidencia repo |
|---|---|---|
| Directorio público SEO de vets con filtros comuna/especialidad | Veterinariachile.com es listado pasivo; Petsy no tiene directorio; QVET es B2B | `/veterinarios`, `/veterinarios/comuna/:comuna`, `/veterinarios/:slug` + `generate-sitemap` |
| Estimador de costos por comuna | Zero competidores chilenos lo tienen | `src/hooks/useVetPriceEstimator.ts`, `src/pages/PreciosVeterinarios.tsx` |
| Ficha clínica PDF cronológica + ZIP + carta de rechazos médicos | Petsy tiene ficha pero no PDF profesional | `src/pages/PetClinicalRecord/pdf.ts`, memoria `project_session_2026_04_19_pdf_redesign.md` |
| Doble cara B2C + B2B integrada verticalmente con pricing público CLP | QVET/VetPraxis no publican precio; Petsy/CuidaPet son B2C puros | `src/lib/plans.ts:227-359` (4 tiers con precio visible) |
| Brand v2 completo + 3 landings inmersivas + 4 decks dedicados | Competencia usa templates Shopify/Wix genéricos | `public/paw-friend-assets-v2/`, `pitch-inversionistas/PRESENTACION_*.html` |
| Refugios como onboarding inicial (rol shelter) + transfer al adoptante con ficha completa | Modelo único: adoptante recibe ficha médica desde día 1 | mig `20260620000000_adoption_centers.sql`, `src/pages/shelter/*` |
| Apalancamiento founder+IA: 320 hrs = ~4.800 hrs equipo = USD 720K-1,44M | Narrativa defendible en pitch | `docs-raiz/pitch/APALANCAMIENTO_FUNDADOR_IA.md` |
| Auditoría automática diaria (Pulso Diario + health score edge fns + auto-fixers) | Cero competidores exhiben transparencia operacional | memoria `project_monitor_auto_pilot_2026_04_17.md`, edge fn `audit-cron-daily` |
| Accepted 4 roles (owner/provider/shelter/admin) con toggle inline + guards estrictos | Nadie en Chile modela doble rol dueño ↔ vet en una app | `src/hooks/useActiveRole.tsx`, `src/components/RoleGuard.tsx` |
| Modelo híbrido con 5 motores + 3 alianzas canonizado y documentado | La mayoría de competidores vive de 1-2 motores | `CLAUDE.md §5` |

**Resumen del moat**: Paw Friend es el único producto chileno que combina **directorio SEO + ficha clínica profesional + dual-role + doble track B2C/B2B + refugios como onboarding** en una sola app, con pricing transparente en CLP. Ese cruce es defendible 18-24 meses mientras QVET no decida priorizar Chile y Petsy no agregue directorio público.

---

## 5. Síntesis: punto de partida para el plan

### Fortalezas para apalancar
- Joya de la corona (PDF) sólida + ZIP + watermark + footer SGSE.
- Directorio SEO listo para indexar más comunas.
- 41 edge functions con health score + telemetry.
- Pipeline de contenidos pitch (6 MDs + 4 HTMLs + sample dashboard).

### Debilidades que bloquean en 90 días
- Ingresos: cero MRR demostrable.
- Capital humano: Pedro solo, sin co-founder.
- Operacional: cuenta Flow personal bloquea Paw Companys recurrente + donaciones mensuales + refugio.
- Instrumentación: falta North Star + embudo completo + retention cohortes.
- Mobile iOS: no comprado Apple Dev, no submit TestFlight.

### Cosas que Pedro NO debe tocar (respetar CLAUDE.md §9.6)
- Refactors grandes en la ficha clínica interna.
- Refactor del directorio público.
- Cambiar de Flow.cl a otra pasarela.
- Borrar features B2C para monetizar (modelo es "B2C gratis").

---

## 6. Fuentes citadas

- `CLAUDE.md` — manual operativo completo (stack, rutas, modelo, reglas §9.1-9.8).
- `INDEX.md` — índice maestro de documentación viva.
- `MAPA_FUNCIONAL_COMPLETO.md` — 25 módulos + oportunidades por módulo.
- `audits/AUDITORIA_UX_COMPLETA_2026_04_14.md` — 4 CRITICAL, 14 HIGH, 28 MEDIUM (corregidos).
- `audits/FEATURES_INCOMPLETAS_2026_04_14.md` — 28 features con gaps detectados.
- `audits/OPTIMIZACION_COSTOS_2026_04_12.md` — Análisis de costos + plan de eficiencia (Fase 1 ejecutada).
- `audits/COMPETENCIA_2026_04_08.md` — QVET, VetPraxis, Petsy, CuidaPet, Duko, etc.
- `audits/FEEDBACK_VET_SOFIA_2026_04_13.md` — Primera vet beta real.
- `audits/FEEDBACK_PALO_2026_04_16.md` — Dueña beta en iPhone.
- `docs-raiz/planes/SUGERENCIAS_COMPLETAS_2026_04_16.md` — 49 sugerencias.
- `src/lib/plans.ts`, `src/lib/featureFlags.ts`, `src/App.tsx`, `package.json`.
- `supabase/migrations/` — últimas 30 (hasta `20260626000000_post_adoption_checkins.sql`).
- `supabase/functions/` — 41 edge fns + `_shared/`.
- `pitch-inversionistas/` (6 MDs + 4 HTMLs) + `docs-raiz/pitch/`.
- Memorias auto-memoria: `project_spa_meta_verif_2026_04_17.md`, `project_vc_plan_2026_04_18.md`, `project_session_2026_04_19_pivot_monetizacion.md`, `project_session_2026_04_19_pdf_redesign.md`, `project_session_2026_04_20_adoption_complete.md`, `project_session_2026_04_20_brand_applications.md`, `project_sofia_vet_beta_tester.md`, `project_feedback_palo_2026_04_16.md`, `project_monitor_auto_pilot_2026_04_17.md`.
- `WebSearch` 2026-04-20: [Start-Up Chile Apply](https://startupchile.org/en/apply/), [Ignite](https://startupchile.org/en/apply/ignite/), [Calendario Convocatorias CORFO 2026](https://ghost.alfondo.cl/calendario-de-convocatorias-corfo-2026-planifica-tu-crecimiento-desde-ahora/).
