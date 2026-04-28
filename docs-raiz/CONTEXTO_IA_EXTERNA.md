# Contexto Paw Friend para IA externa (Perplexity / Claude.ai / ChatGPT / Gemini)

> Pegar este bloque como "memoria" o primer mensaje al iniciar una conversacion
> con una IA externa que NO tiene acceso al repo. Cubre producto, stack,
> modelo v2, roles, restricciones y estado tecnico al **2026-04-27**.
>
> **Uso principal**: auditorias de next-level, roadmap strategico,
> revision de decks, sparring de decisiones de producto/negocio.
>
> Ultima revision: **2026-04-27** (cierre pivot modelo v2 post-Roberto Camhi
> + Petify contraposicionamiento). Para detalle tecnico exhaustivo, fuente
> de verdad sigue siendo `CLAUDE.md` + `INDEX.md` + `MAPA_FUNCIONAL_COMPLETO.md`
> + `diagrams/FLUJO_COMPLETO.mmd` (no los tienes pero existen en el repo).

---

## 1. Identidad del proyecto

- **Producto**: Paw Friend, app para dueños de mascotas en Chile + LATAM.
  Ficha clinica digital + directorio publico de veterinarios + reservas +
  refugios/adopcion + comunidad + memorial + nose print biometrico.
- **Dominio**: pawfriend.cl (deploy desde `docs/` a GitHub Pages).
- **Fundador**: alias publico "Paw Founder". Dev solo + IA (Claude Code) como co-engineer.
- **Empresa**: SpA "SUSAETA GARNHAM SOFTWARE ENGINEERING" (RUT 78.328.659-9).
  Domicilio SII: Luis Pasteur 6111 Dp 201, Vitacura. Constituida 2026-04-17.
- **Lanzamiento publico**: 1 junio 2026 (modo autonomo, Flow $100 real).
- **Mascotas reales en prod**: Kai (pastor suizo) + Ema (gata).

## 2. Stack tecnico (verificable en `package.json`)

| Capa | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript 5.8 + Vite 5 (plugin react-swc) |
| UI | Tailwind 3 + shadcn/ui (Radix + CVA) + lucide-react + Recharts 2 |
| Estado servidor | @tanstack/react-query 5 |
| Forms | react-hook-form 7 + zod 3 |
| Rutas | react-router-dom 6 |
| Backend | Supabase (Postgres + Auth + Edge Functions Deno + Storage) — proyecto `gwailbjlvevkhwcrovfd` |
| Pagos | **Flow.cl** (NO Webpay). Edge fns `flow-create-subscription`, `flow-webhook`, `flow-create-donation` |
| Mobile | Capacitor 7 (Android compilable, iOS Sign-In end-to-end) |
| Observabilidad | Sentry + PostHog + Firebase Analytics + `withTelemetry` wrapper en todas las edge fns |
| Testing | Vitest 393/393 + Playwright (E2E) |
| Vector DB | pgvector (DINOv2-large 1024 dims para nose print) |
| Auth social | Apple Sign-In end-to-end · Google OAuth · Meta pendiente decision Consumer/Empresa |
| Mapas | Leaflet + react-leaflet 4.2.1 |
| IA | Anthropic Claude (asistente, OCR, breed-tips, transcripcion, bereavement) |

**No hay**: Zustand, Redux, Next.js, zod standalone (zod via `@hookform/resolvers`).

## 3. Modelo de negocio v2 (post-Roberto Camhi 2026-04-22)

> **Norte**: el dueno **NUNCA paga**. Producto invisible. Modelo **estilo Mapcity**:
> Mapcity no le cobraba a la tienda — le cobraba a Equifax/bancos por acceso a la
> data. Paw Friend no le cobra al dueno ni al vet — le cobra a pharma/seguros/
> retail por acceso a la ficha clinica longitudinal.

### Validacion competitiva — Petify

Petify (competidor) cobra **USD $0,50/mascota/mes hasta que se elimine** (modelo extractivo).
Captura el ~10% que paga, deja el 90% del mercado afuera por friction. Paw Friend modelo v2
captura el 100% del mercado y monetiza B2B. Cálculos CLP: 1 mascota ~$460/mes, 2 mascotas
~$11.000/año, refugios con 30 mascotas = inviable. Refuerza moat de "gratis para siempre".

### Pilares ancla (80% del revenue, mes 4-12 post-seed)

1. **Pharma animal** — Centrovet (Agrosuper), Virbac, Zoetis, MSD, Elanco, Boehringer.
   Sponsored reminders + data deals + contenido. **USD $20-500K / brand**.
2. **Seguros pet** — Sura, BCI, Mapfre, Consorcio. Afiliado 10-20% sobre prima
   + white-label ficha. **USD $500K-1M a escala**.
3. **Retail pet** — Master Dog, Falabella Pet, Puppis. Afiliado 3-10% +
   suscripcion alimento. **USD $50-200 / usuario activo-año**.

### Pilares soporte

4. **Paw Companys** — empresas pet-friendly + corporates. Sponsorship badge +
   SaaS bienestar animal ($1-3 USD/empleado/mes). USD $600-1.800/mes/corporate.
5. **Paw Support** (ex-donaciones, reframe Ley 19.885) — apoyo voluntario del
   dueno. Residual, alto NPS.

### Long-tail (mes 12+)

6. Data agregada anonima (consent opt-in) → SAG, Minsal, academia.
7. Gobierno / municipios (Ley 21.020) — white-label registro digital.
8. Publicidad programatica residual.

### B2C dueño — gratis sin caps para siempre

- `USER_PREMIUM=false` (feature flag canonico). NO hay paywall activo.
- **Paw Member** ($3.990/mes opcional): badge cosmetico + descuentos Paw Partners. **NO desbloquea features**. Proxy NPS, no revenue core.

### B2B vet — canal de adquisicion, no revenue center

> *El vet no paga porque su valor esta en construir la ficha. El activo es la ficha.
> Quien paga es quien quiere acceder a la mascota a traves de ella.* — Roberto Camhi

| Plan | Precio | Visible en `/para-veterinarios` |
|---|---|---|
| Básica | $0 / 5 pacientes | Sí |
| Premium | $9.900/mes | Sí |
| Clínica Starter | $19.900/mes | **No** (publicVisible=false en `plans.ts`) |
| Pro Max | $29.900/mes | **No** (on demand "Empresarial — contáctanos") |

### Unit economics v2 a escala (50k MAU, mes 18 post-seed)

| Motor | Conversion / deals | ARR estimado |
|---|---|---|
| Pharma (3 brands) | 3 deals activos | USD $300-600K |
| Seguros (2 aseguradoras) | 5% conv = 2.500 polizas | USD $200-500K |
| Retail (2 retailers) | 10% conv activos | USD $250-500K |
| Paw Companys | 20 empresas | USD $120-240K |
| Paw Support | Voluntario | USD $20-50K |
| Long-tail (data/gobierno) | 1-2 deals | USD $50-200K |
| **Total ARR proyectado** | | **USD $940K - $2.1M** |

vs modelo v1 vet-centrico (techo USD $400-600K ARR) → delta **2-4×**.

## 4. 4 roles / 4 tipos de clientes

1. **Owner** (dueño) — default. Experiencia entretenida. Todo gratis sin caps.
2. **Provider** (vet/profesional individual) — dashboard clinico, agenda, pacientes. Sin gamificacion.
3. **Shelter** (refugio/hogar de adopcion) — dashboard operativo, bulk import, transferencia al adoptante. Cuenta gratis siempre.
4. **Admin** — panel interno (`admin_access.is_active=true`).

Un usuario puede tener doble rol. Toggle en Header. Persiste en `localStorage` `pf_active_role`. Hook `useActiveRole()`.

## 5. Producto invisible (modelo v2)

> **Hipotesis**: el dueno promedio chileno abre la app **4 veces al año**. Si
> diseñamos para power users perdemos al 90% del mercado. Si diseñamos para
> "el dueno flojo", los power users igual lo usan.

**Regla operativa**: *si no suma al dueno flojo, no entra al core.*

- **Home dueno**: foco en ficha + recordatorios + urgencia + directorio de vets cercanos. Un solo CTA "Explorar más" → `/explorar` (hub opt-in).
- **Onboarding**: 4 campos (nombre + especie + edad + foto). Paso 2 push OCR carnet de vacunas → ficha arranca completa sin tipear.
- **`/explorar`** — hub opt-in para Paw Labs (Comunidad / Adopciones / Donantes de sangre / Memorial / Mapa pet-friendly / Feed / Misiones / Paw Cards / Paw Game). Cada tile respeta su feature flag.
- **BottomTabBar V2** (mobile): 4 tabs (Mascota / Calendario / Vets / Yo). Sin gamificacion en navegacion principal.

## 6. Rutas clave (~73 rutas activas)

- **Públicas (26)**: `/`, `/auth`, `/veterinarios`, `/veterinarios/:slug`, `/precios-veterinarios`, `/para-veterinarios`, `/refugios-hogares`, `/refugios/:slug`, `/paw-partners`, `/aplicar`, `/paw-support` (canonica) + `/donaciones` (alias 3 meses), `/paw-voices`, `/paw-companys`, `/paw-core`, `/qr/:token`, `/paw-card/:pawCardId`, `/medical-share/:token`, `/memoria/:petId`, `/nose-scan` (gateado), `/insights`, `/insights/:slug`, `/resena/:token`, `/faq`, legales.
- **Protegidas (40+)**: `/home`, `/feed`, `/my-pets`, `/ficha/:petId`, `/calendario`, `/rutinas`, `/explorar` (hub Paw Labs), `/chat`, `/profile`, `/paw-member`, `/reportes`, `/panel-pro`, `/mis-reservas`, `/mis-postulaciones`, `/mis-adopciones`, `/onboarding-mascota`, `/onboarding-vet`, `/onboarding-shelter`, `/insights-pro`, etc.
- **Provider (3)**: `/provider/dashboard`, `/provider/pacientes`, `/provider/profile-edit`.
- **Shelter (varios)**: `/shelter/dashboard`, `/shelter/bulk-import`, `/shelter/transfer/:petId`, etc.
- **Admin (2)**: `/admin`, `/demo`.

## 7. Edge Functions activas (35+ + _shared)

- **Pagos**: `flow-create-subscription`, `flow-webhook`, `flow-create-donation`.
- **IA**: `pet-assistant`, `breed-tips`, `bereavement-assistant`, `ocr-vaccination-card`, `medical-suggestions`, `generate-medical-summary`, `generate-medical-zip`, `process-consultation-transcript`.
- **Operacion vet**: `create-patient`, `send-pet-invitation`, `send-lead-outreach`, `generate-vet-patient-summary`, `generate-weekly-vet-reports`, `verify-vet-document`, `verify-service-provider`, `moderate-service-promotion`.
- **Owner**: `generate-weekly-owner-reports`, `reminder-cron`, `send-whatsapp-reminder`.
- **Push/notifs**: `send-push-notification` (disparada desde triggers SQL de booking).
- **Google Calendar**: 4 fns (`oauth-init`, `callback`, `disconnect`, `sync`).
- **Plataforma**: `log-error`, `generate-sitemap`, `generate-shelters`, `notify-pitch-application`.
- **Refactor Maestro Fase 1-3**: `nose-print-embed`, `nose-print-match`, `generate-pet-id-card`, `generate-paw-passport`, `send-adoption-followups`, `b2b-api`, `notify-health-alerts`, `run-all-cascades`, `partner-discount-validate`, `insurance-prefill-quote`.

Todas envueltas con `withTelemetry` (2026-04-17).

## 8. Refactor Maestro 2026-04-23 (Fase 0/1/2/3 ejecutadas)

- **Trinidad del Corazon**: Pet ID Card v2 + Owner Audio Notes + Quick Actions Hub.
- **Ficha clinica**: 4 tabs (Historia / Cuidados / Identidad / Más) en lugar de 9 legacy.
- **Memorial viral**: `/memoria/:petId` con OG meta + share card 1080x1080 Canvas API.
- **Paw Points canonizado**: trigger `award_points` defensivo + ledger en `paw_point_transactions`.
- **Sidebar colapsado** + 13 feature flags activos.
- **Nose Print biometrico**: DINOv2-large 1024 dims via HF Inference API. Threshold 0.55 cosine. pgvector HNSW. `/nose-scan` publico (gateado por flag `NOSE_PRINT_PUBLIC_SCAN`). **Pausado 2026-04-27** esperando proveedor.
- **Paw Passport PDF** 8 paginas (tapa + datos + biometria + vacunas + antipara + medicos + contactos + validaciones).
- **Refugios completos**: rescue_story + adoption_followups 30/90d trigger + cron edge fn.
- **Insights SEO v2**: 3 tipos de slugs (breed/species/breed_rank). Threshold privacy >=50 pets.
- **Birthday share card**: banner condicional Home ±14d + Canvas API descargable.
- **Cascadas (ambient computing) §2.8.3**: 6 tipos (`weight_loss_30d`, `vaccine_overdue`, `antiparasitic_overdue`, `no_activity_7d`, `birthday_window`, `memorial_anniversary`). Pipeline unificado `run-all-cascades` (1 cron en lugar de 7).
- **Research consent §7.3** (pre-req Pharma deals): `profiles.anonymous_data_research_consent` + nudge `/home`.
- **Risk score §7.5 + §8.4.5**: RPC `calculate_pet_risk_score(pet_id)` + `PetRiskScoreCard` en tab Identidad.
- **B2B API v1**: edge fn `b2b-api` con `X-Pawfriend-Api-Key` + 4 endpoints (breed_stats, species_stats, correlation_catalog, correlation_insights). `AdminB2BApiKeys` panel.
- **Correlation insights moat §2.9**: tablas `correlation_definitions` + `correlation_observations` + 6 seeds + 2 RPCs compute.
- **Master KPIs §13**: vista materializada `master_kpis_daily` con 30+ métricas.
- **Risk monitor §11**: RPC `compute_risk_signals` + banner Admin con 5 señales.
- **§14.bis Bootstrap pet enriquecido**: trigger crea hasta 4 eventos al insertar pet (Bienvenida + Nacimiento + Microchip + Esterilizada).
- **§14.bis BreedComparisonCard**: comparacion social temprana en tab Identidad.
- **§14.bis PetCompletionProgress**: North Star owner-side (>=10 eventos / >=3 cats / Pet ID Card).
- **§2.4.3 Auto-sync timeline**: 4 triggers que sincronizan medical_records / pet_reminders / vet_bookings / routine_completions → pet_timeline_events.

## 9. Notificaciones (prefs granulares + dedup)

- Tabla `user_notification_prefs`: 3 categorias (`transactional`, `reminders`, `marketing`) × 3 canales (`push`, `email`, `whatsapp`). Default permisivo para transactional.
- `user_can_receive_notification(user_id, category, channel)` — toda logica de envio (triggers SQL, edge fns, crons) la chequea antes.
- `notification_attempts` con UNIQUE `(booking_type, booking_id, reminder_type, channel)` → dedup automatico.

## 10. Reglas criticas (overrides)

- `docs/` es **output de build** (`npm run build`). Nunca editar a mano.
- Migraciones SQL en `supabase/migrations/` con timestamp; las aplica Pedro manualmente via Supabase Dashboard. **Nunca** `DROP TABLE` ni `DELETE FROM` sin `WHERE` en tablas con datos de usuarios.
- **Proteger datos de usuarios existentes** (regla 9.7 CLAUDE.md): migrar al cambiar esquema, defaults en columnas NOT NULL, fallback al renombrar keys de localStorage.
- **Triggers plpgsql con smoke inline** (regla 9.2.1): toda mig que crea/modifica trigger plpgsql DEBE incluir un `DO $$ ... $$` con ROLLBACK que lo ejercite. plpgsql es lazy-validation; sin smoke el trigger se crea "ok" y explota meses despues. Incidentes documentados: `sync_vaccination_status`, `notify_adoption_interest`, `create_default_reminders_for_new_pet`, `award_points`.
- Copy en **espanol chileno** (tuteo: tú/tienes/puedes). NO voseo argentino. NO vosotros español. Términos: "comuna", "ficha clinica", "recordatorio".
- Nunca pegar API keys/JWTs en chat ni en commits.
- Nunca flipear `verify_jwt` en bloque en >1 edge fn a la vez (incidente 2026-04-20).
- Nunca hardcodear JWTs en `cron.schedule`; usar vault `current_setting('app.settings.service_role_key')`.
- `diagrams/FLUJO_COMPLETO.mmd` es fuente de verdad unica del flujo end-to-end (un solo bloque Mermaid pegable en mermaid.live).
- Política "esconder, no eliminar": features detrás de feature flag `false`. Revisión a +6 meses (`_pending/HIDDEN_FEATURES_REVIEW_2026_10_27.md`).
- PowerShell no soporta heredoc bash (Pedro corre Windows).
- Comandos Supabase CLI siempre con `npx` (`npx supabase ...`).

## 11. Métricas del repo (al 2026-04-27)

| Métrica | Valor |
|---|---|
| Commits en `main` | 718 |
| Migraciones SQL | 312 |
| Edge functions | 65 (incluye `_shared`) |
| Páginas | 106 |
| Componentes React | 431 |
| Hooks custom | 105 |
| Rutas activas | ~73 |
| Tests Vitest | 393/393 verde |
| Tests Playwright | 336/336 verde |
| `npx tsc -b` | 0 errores |
| `npm run lint` | 0 errores (2 warnings react-refresh preexistentes) |
| Build | ~50-70s + pre-render 19 rutas SPA |

## 12. North Star + KPIs operativos

- **North Star Owner-side**: pets con >=10 eventos timeline / >=3 categorias / Pet ID Card claimed.
- **Leading indicator del moat Pharma**: `research_consent_opt_in_rate` (sin consent, no hay deals).
- **KPIs operacionales** (`AdminMasterKPIs` widget):
  - MAU / WAU / DAU
  - Vets activos creando fichas (gratis)
  - Fichas con OCR completado %
  - Pacientes con ficha completa (proxy "ficha longitudinal valiosa")
  - Paw Companys activos
  - Pharma deals piloto (objetivo mes 4-6)
  - ARR runrate (USD)
  - Retention D30 / D90
  - Rating app
- **Risk monitor §11**: 5 señales (AI cost spike, consent rate bajo, dropout, edge fn errors, pgvector slow).

## 13. Pendientes operacionales (al 2026-04-27)

- **Acciones manuales Pedro** (solo Pedro, no IA):
  - **Rotar service_role JWT** (expuesto por error en chat 04-25, urgente).
  - **Vault**: actualizar secret con JWT nuevo.
  - **Cron pg_cron**: schedule `run-all-cascades-daily` (reemplaza 6 crones individuales) + `send-adoption-followups-daily`.
  - **Test 4 mascotas DINOv2** desde la app + activar `NOSE_PRINT_PUBLIC_SCAN=true` si discrimina hermanos.
- **Stores**:
  - Apple Sign-In end-to-end (✅). Apple Developer + assets stores en setup.
  - Meta WhatsApp: bloqueado decidiendo Consumer vs Empresa.
  - Google Play Console: espera reverificacion carnet.
- **Operacion**:
  - Migrar cuenta Flow a SpA (riesgo fiscal de cuenta personal del fundador). Plan: Tenpo/Mach/Prex.
  - Decidir lanzamiento 1 junio 2026 (modo autonomo, Flow $100 real).

## 14. Lecciones aprendidas (no volver a tropezar)

- **Premium B2C reactivacion**: 2 intentos previos (2026-04-08 + 2026-04-19) sin tracción. Pivot v2 lo descartó como motor — ahora es Paw Member voluntario badge-only.
- **Vets no son motor de revenue**: feedback Roberto Camhi 2026-04-22 (founder Mapcity). Tienen demanda excedida, pocos para mucha demanda, chatos de vendors.
- **"Donaciones" activa Ley 19.885**: reframe a "Paw Support" (pago voluntario por servicio).
- **Triggers plpgsql lazy-validation**: 4 incidentes en producción por refs a columnas inexistentes. Regla 9.2.1 obligatoria.
- **JWT en `cron.schedule` literal**: incidente 2026-04-20. Vault obligatorio.
- **`verify_jwt` flip en bloque**: incidente 2026-04-20, romper 28 fns simultaneo. Hacer 1 a 1 con smoke.
- **Vite manualChunks por path src**: causa circular deps. Solo vendors.
- **Petify modelo extractivo**: USD $0,50/mascota/mes hasta eliminar. Captura el 10% que paga, deja el 90% afuera. Incentivo perverso (eliminar fichas para dejar de pagar choca con memorial).

## 15. Areas conocidas con deuda tecnica (sospechas)

- **Bundle size**: ~335kB / 100kB gzip. PlanComparisonTable tiene 2 react-refresh warnings preexistentes.
- **Premium-related code legacy**: `subscriptions` table sigue diciendo `plan_type='premium'` aunque la UI lo muestra como Paw Member. Refactor cosmético no urgente.
- **AdminSalaInversion `northStar.premiumCount`**: misma situación — internal name premium pero externa label "Paw Member voluntario".
- **`premium_b2c` key en CSV exports**: mantenido por compat histórica.
- **TARGETS_90D**: re-baseline post-pivot v2 hecho 2026-04-27. KPIs nuevos (vets_active, fichas_ocr_pct, research_consent_pct, pharma_pilots) sin tracking de progreso histórico todavía.
- **HTMLs decks legacy**: 5 mejorados en pivot v2, pero hay HTMLs de marketing en `docs-raiz/marketing/` que son históricos y no se actualizaron.
- **Tablas `_deprecated_20260427`**: 4 tablas renombradas en mig `20260903900000_rename_orphan_tables.sql`. Drop definitivo en 2026-10-04 si nada las usa.
- **Mobile launch**: pendiente de Pedro completar Apple Developer + Google Play Console + Meta verif.
- **OnboardingQuickFlow vs OnboardingDuenoMinimal**: dos componentes onboarding existen. La ruta `/onboarding-mascota` apunta a Minimal. QuickFlow legacy (revisar).

## 16. Documentos clave del repo (para citar a la IA externa)

- **Producto / arquitectura**: `CLAUDE.md`, `MAPA_FUNCIONAL_COMPLETO.md`, `INDEX.md`.
- **Modelo v2**: `docs-raiz/pitch/MODELO_V2_2026_04_22.md` (fuente de verdad).
- **Refactor Maestro**: `docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md`.
- **Diagrama flujo**: `diagrams/FLUJO_COMPLETO.mmd`.
- **Decks inversionistas**: `pitch-inversionistas/CONSOLIDADO_INVERSIONISTAS.md` + 6 docs por audiencia.
- **Petify contraposicionamiento**: en memoria persistente del agente.
- **Roadmap 90d**: `docs-raiz/planes/PLAN_EXITO_90D_*.md` (28 iniciativas RICE).
- **Auditoria features**: `_pending/AUDITORIA_FEATURES_2026_04_27.md`.
- **Hidden features review**: `_pending/HIDDEN_FEATURES_REVIEW_2026_10_27.md` (6 candidatas a eliminar).
- **Acciones manuales Pedro**: `_pending/MANUAL_ACTIONS_PENDING_FASE_0.md`.

---

**Uso típico**: pega este contexto + agrega el prompt específico de auditoría
(ver `docs-raiz/PROMPT_AUDITORIA_NEXT_LEVEL.md` o tu propio prompt).
