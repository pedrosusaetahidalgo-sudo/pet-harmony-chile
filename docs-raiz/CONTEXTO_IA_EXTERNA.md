# Contexto Paw Friend para IA externa (Perplexity / Claude.ai / ChatGPT / Gemini)

> Pegar este bloque como "memoria" o primer mensaje al iniciar conversación con
> una IA externa que NO tiene acceso al repo. Cubre producto, stack, modelo
> v2.1 (post Plan v5 Opción 3), roles, restricciones, estado técnico y tareas
> pendientes.
>
> **Última revisión: 2026-04-29** (cierre Plan v5 Opción 3 freemium 3 tiers +
> 8 mejoras adicionales + audit cleanup).
>
> **Fuente de verdad detallada** en el repo (alguien con acceso debería leer):
> `CLAUDE.md` · `MAPA_FUNCIONAL_COMPLETO.md` · `INDEX.md` ·
> `docs-raiz/MODELO_FINANCIERO_2026_04_29.md` (números canónicos) ·
> `docs-raiz/MANIFESTO_PAW_FRIEND_2026_04_29.md` (identidad verbal) ·
> `docs-raiz/PITCH_DECK_V2_2026_04_29.md` (12 slides definitivos).

---

## 1. Identidad

- **Producto**: Paw Friend — ficha clínica longitudinal del 100% del mercado pet
  chileno + directorio público de veterinarios + reservas + refugios/adopción
  + Pet ID Card con QR + Paw Passport PDF + memorial. Biometría Paw Shield
  (Petify) en repo pero dormida tras flag (Opción C 2026-04-30, fuera del
  modelo consumer).
- **One-liner**: *"La ficha clínica longitudinal del 100% del mercado pet chileno.
  El dueño no paga porque el activo no es la app — es la ficha. Pagan pharma,
  seguros y retail por acceso a esa cohorte."*
- **Tagline público**: *"Tu mascota, sin tareas"*.
- **Dominio**: pawfriend.cl (deploy desde `docs/` a GitHub Pages).
- **Repo**: `github.com/pedrosusaetahidalgo-sudo/pet-harmony-chile`, branch `main`.
- **Empresa**: SpA SUSAETA GARNHAM SOFTWARE ENGINEERING · RUT 78.328.659-9 ·
  Vitacura · constituida 2026-04-17.
- **Fundador**: alias público "Paw Founder". Solo + IA (Claude Code) =
  **15× output equipo equivalente** (USD 720k-1.4M valor desarrollo capitalizado,
  documentado).
- **Lanzamiento público**: **1 junio 2026**.
- **Mascotas reales en prod**: Kai (pastor suizo) + Ema (gata).

---

## 2. Modelo de negocio v2.1 — CRÍTICO entender la evolución

### Cómo llegamos al modelo actual

- **v1 (pre-2026-04-22)**: B2C Premium $3.990 con feature unlock + B2B vets
  como revenue center. **Descartado** por feedback estratégico.
- **v2 (2026-04-22, post-pivot estratégico con mentor advisor off-record)**:
  el dueño NUNCA paga. Modelo B2B de acceso a la ficha (pharma + seguros +
  retail). Vets canal, no revenue. "Donaciones" → "Paw Support" (reframe
  Ley 19.885).
- **v2.1 (2026-04-29, Plan v5 Opción 3)**: el dueño paga **sólo si quiere
  features avanzadas**. **Freemium B2C 3 tiers como puente** mientras llegan
  partners B2B (pharma + seguros + retail).
- **Reanálisis 2026-04-30 paso 1**: la narrativa "Mapcity" se desancla —
  fue analogía retórica heredada, no estrategia. El modelo se sostiene por
  sus propios méritos: el activo es la ficha clínica longitudinal, no la app.
- **Reanálisis 2026-04-30 paso 2 (Opción C)**: Paw Shield biométrico (Petify)
  sale del modelo consumer entero. COGS lineal externo en single-vendor
  foreign envenena valuación VC y bloquea launch sin firma de billing PROD.
  Paw Member queda con Passport + Insights Pro + Audio IA + Reportes (margen
  ~99%, sin COGS externo). Manada queda con todo lo de Paw Member + descuentos
  exclusivos + soporte prioritario + early access + $2.000/mes refugios.
  Código Petify dormido en repo (regla "esconder, no borrar") por si un
  partner B2B lo financia en el futuro.

### Pricing canónico actual (v2.1 + Opción C)

| Plan | Precio | Mascotas | Conversion target | Margen contribution |
|---|---|---|---|---|
| **Free** | $0 | 2 | 85% MAU | -$41 (subsidiado por upgrades) |
| **Paw Member** 💛 | $3.990/mes · $39.900/año (17% off) | 4 | **13%** | **~99%** sin COGS externo |
| **Manada** 👑 | $9.990/mes · $99.900/año (17% off) | 5 | 1-2% | ~80% + $2.000 a refugios |

### Componente paywall

`src/components/PremiumGate.tsx` wireado en features premium (post Opción C):
- `paw_passport` — PDF 8 páginas compartible
- `audio_notes_ai` — transcripción IA consultas owner
- `insights_pro` — analytics avanzado per-pet
- `reports_history_days` — histórico >30 días
- `max_pets` — 3+ mascotas (free tope = 2)

### Manada Fondo Refugios (diferenciador único)

Plan Manada cobra $9.990/mes. **$2.000 directo a Fondo Paw Friend Refugios**.

**Diseño legal**: la donación efectiva la hace **Paw Friend SpA** (no el user
directamente). Esto evita activar Ley 19.885 de donatarios (que exigiría
recibos al donante, calificación SII, etc). SpA usa Art. 31 N°7 LIR (deducible
para personas jurídicas) — más simple operacionalmente. UI muestra "tu plan
apoya el Fondo Paw Friend Refugios" sin emitir recibo legal al user.

Tablas: `manada_refugio_preferences`, `manada_fondo_pool`, `manada_aportes_log`
(mig `20260929000000_manada_fondo_refugios.sql`). Cron mensual cierre pool día
1 03:00 UTC (mig `20260929000001_manada_pool_close_cron.sql`).

### B2B 7 motores de acceso a la ficha (donde está el grueso a escala)

Código end-to-end ready, esperando primer deal firmado.

| # | Motor | Quién paga | Ticket anual | Activación |
|---|---|---|---|---|
| 1 | **Pharma animal** | Centrovet (Agrosuper), Virbac, Zoetis, MSD | USD 50-200k/brand | Mes 4-6 post-launch |
| 2 | **Seguros pet** | Sura, BCI, Mapfre, Consorcio | USD 200-500k | Mes 6-9 |
| 3 | **Retail pet** | Master Dog, Falabella Pet, Puppis | USD 250-500k | Mes 8-12 |
| 4 | **Paw Companys** | Empresas pet-friendly | USD 600-1.800/mes/corporate | **Vivo** |
| 5 | **Gobierno municipal** | Las Condes, Providencia, Vitacura, Subdere (Ley 21.020) | USD 10-50k | Mes 12+ |
| 6 | **Banca + Edificios** | BancoEstado, BCI, inmobiliarias | Long-tail | Mes 18+ |
| 7 | **Long-tail** | Academia veterinaria, data deals, ads programáticos | USD 5-50k | Continuo |

### B2B Vets — canal de adquisición, NO revenue center

| Plan | Precio | `publicVisible` |
|---|---|---|
| Básica (`provider_free`) | $0 / 5 pacientes | ✅ |
| Premium (`provider_premium`) ⭐ | $9.900/mes | ✅ |
| Clínica (`provider_clinic_starter`) 🏥 | $19.900/mes | ❌ "Empresarial — contáctanos" |
| Pro Max (`provider_pro_max`) 👑 | $29.900/mes | ❌ |

> *"El vet no paga porque su valor está en construir la ficha. El activo es la
> ficha. Quien paga es quien quiere acceder a la mascota a través de ella."*
> — Tesis core post-pivot 2026-04-22.

### ARR proyectado (FX USD/CLP = 905 declarado único)

| Escala MAU | ARR USD/año | EBITDA USD/año | % margen |
|---|---|---|---|
| 1.000 | $9k | $2k | 22% ✅ |
| 10.000 | $175k | $120k | 69% ✅ |
| 50.000 | $1.37M | $1.25M | 91% ✅ |
| 100.000 | $3.07M | $2.84M | 92% ✅ |

Sensibilidad: aguanta FX hasta CLP 1.100 sin romper margen. Aguanta Petify x2
sin romper. Si conversión real cae a 5% Paw Member + 0.5% Manada (peor caso),
B2B sigue cubriendo: a 100k MAU genera USD 2.17M aún con B2C colapsado.

### Capital ask pre-seed

USD 150.000 = **CORFO SSAF-I $28k (subsidio) + Start-Up Chile Ignite $15k
(equity-free) + Angel SAFE $107k** (cap USD 1.2M post-money + discount 20%).
Pre-money sugerida USD 600k-1.2M base. Dilución founder 8-15%.

Hitos para Series A (Q3 2027): MRR ≥ USD 30k · MAU ≥ 15k · 2 partners B2B
firmados · conv Paw Member ≥ 13% · NPS ≥ 40.

---

## 3. Stack técnico (verificable en `package.json`)

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript 5.8 + Vite 5 (plugin react-swc) |
| UI | Tailwind 3 + shadcn/ui (Radix + CVA) + lucide-react + Recharts 2 |
| Estado servidor | @tanstack/react-query 5 |
| Forms | react-hook-form 7 + zod 3 (via @hookform/resolvers) |
| Rutas | react-router-dom 6 |
| Backend | Supabase (Postgres + Auth + Edge Functions Deno + Storage) — proyecto `gwailbjlvevkhwcrovfd` |
| Pagos | **Flow.cl** (NO Webpay). Edge fns: `flow-create-subscription`, `flow-webhook`, `flow-create-donation` |
| Mobile | Capacitor 7 (Android compilable, iOS Sign-In end-to-end) |
| Observabilidad | Sentry + PostHog + Firebase Analytics + `withTelemetry` wrapper en todas las edge fns |
| Testing | Vitest 587 verde + Playwright (E2E) |
| Vector DB | pgvector (DINOv2-large 1024 dims para nose print propio · pausado 2026-04-28) |
| Biometría comercial | **Petify (PetNow)** API — proveedor B2B opt-in. Hoy TEST key, falta PROD |
| IA | Anthropic Claude (asistente, OCR, breed-tips, transcripción, bereavement) |
| Mapas | Leaflet + react-leaflet 4.2.1 |

NO hay: Zustand, Redux, Next.js, zod standalone (zod via @hookform/resolvers).

---

## 4. 4 roles de usuario

1. **Owner** (dueño) — default. Free $0 / Paw Member $3.990 / Manada $9.990.
   Experiencia entretenida con gamificación opt-in.
2. **Provider** (vet/profesional individual) — Básica gratis · Premium $9.900 ·
   Clínica/Pro Max escondidos. Dashboard clínico, sin gamificación.
3. **Shelter** (refugio/hogar adopción) — cuenta gratis siempre. Dashboard
   operativo + bulk import + transferencia adoptante.
4. **Admin** — panel interno (`admin_access.is_active=true`).

Doble rol soportado. Toggle Header. Persiste `localStorage` `pf_active_role`.
Hook `useActiveRole()`.

---

## 5. Producto invisible (principio guía v2)

> El dueño promedio chileno abre la app **4 veces al año**. Si diseñamos para
> power users perdemos al 90% del mercado. Si diseñamos para "el dueño flojo",
> los power users igual lo usan.

**Regla operativa**: si no suma al dueño flojo, no entra al core.

- **Home pet-focus**: ficha + recordatorios + urgencia + directorio vets cercanos.
- **Onboarding 4 campos**: nombre + especie + edad + foto. Paso 2 OCR carnet
  vacunas → ficha completa sin tipear.
- **`/explorar`** hub opt-in para Paw Labs (Comunidad / Adopción / Donantes /
  Memorial / Mapa / Misiones / Paw Cards / Paw Game). Cada tile gateado por
  feature flag.
- **BottomTabBar V2 mobile**: 4 tabs (Mascota / Calendario / Vets / Yo). Sin
  gamificación en navegación principal.

---

## 6. Rutas principales (~78 activas)

**Públicas (~27)**: `/`, `/auth`, `/veterinarios/*`, `/precios-veterinarios/*`,
`/para-veterinarios`, `/refugios-hogares`, `/refugios/:slug`, `/paw-partners`,
`/aplicar`, `/paw-support` (canónica) + alias `/aportes` + `/donaciones`,
`/paw-voices`, `/paw-companys`, `/paw-core`, `/qr/:token`, `/paw-card/:id`,
`/medical-share/:token`, `/memoria/:petId`, `/nose-scan` (gateado por flag),
`/insights`, `/insights/:slug`, `/b2b`, `/cotizar-seguro/:petId`,
`/tienda/:petId/:partnerSlug`, `/resena/:token`, `/faq`, `/blog`, legales.

**Protegidas (~40)**: `/home`, `/feed`, `/my-pets`, `/ficha/:petId`,
`/calendario`, `/rutinas`, `/explorar`, `/chat`, `/profile`,
`/paw-member` (dual mode: pricing 3 tiers para free / dashboard Manada Impact
para member), `/reportes`, `/panel-pro`, `/mis-reservas`, `/mis-postulaciones`,
`/mis-adopciones`, `/onboarding-*`, `/profile/exportar-mis-datos`,
`/profile/mis-datos-compartidos`.

**Provider (3)**: `/provider/dashboard`, `/provider/pacientes`,
`/provider/profile-edit`.

**Shelter**: `/shelter/dashboard`, `/shelter/bulk-import`,
`/shelter/transfer/:petId`, etc.

**Admin (2)**: `/admin`, `/demo`.

---

## 7. Edge Functions activas (~42)

**Pagos** (Plan v5 actualizadas):
- `flow-create-subscription` — acepta `monthly`/`yearly`/`paw_manada_monthly`/
  `paw_manada_yearly`/`provider_*`. Mapea Manada a `plan_type='paw_manada'`.
- `flow-webhook` — detecta Manada → INSERT en `manada_aportes_log` con $2.000
  (mensual) o $24.000 (anual prorrateado) + idempotencia via UNIQUE
  `flow_charge_id`.
- `flow-create-donation` — aportes voluntarios.

**IA**: `pet-assistant`, `breed-tips`, `bereavement-assistant`,
`ocr-vaccination-card`, `medical-suggestions`, `process-consultation-transcript`,
`consultation-prep`.

**Documentos**: `generate-medical-summary`, `generate-medical-zip`,
`generate-paw-passport`, `generate-pet-id-card`.

**Vet ops**: `create-patient`, `send-pet-invitation`, `send-lead-outreach`,
`verify-vet-document`, `verify-service-provider`, `moderate-service-promotion`.

**Owner ops**: `generate-weekly-owner-reports`, `reminder-cron`,
`send-whatsapp-reminder`.

**Cascadas (ambient computing)**: `run-all-cascades` (orquestador de 6 tipos),
`notify-health-alerts`.

**Refugios**: `send-adoption-followups` (30/90d).

**Biometría Paw Shield**: `paw-shield-register`, `paw-shield-identify`,
`paw-shield-archive-cleanup`.

**B2B**: `b2b-api`, `request-insurance-quote`, `notify-pitch-application`,
`partner-discount-validate`, `insurance-prefill-quote`, `vet-checkin-identify`,
`send-b2b-welcome`.

**Plataforma**: `log-error`, `generate-sitemap`, `audit-cron-daily`,
`risk-signals-alert-cron`, `backup-weekly-snapshot`.

**Google Calendar**: 4 fns OAuth flow.

Todas envueltas con `withTelemetry`.

---

## 8. Migraciones SQL clave (~199 totales)

**Plan v5 (2026-04-29) — las 2 nuevas críticas**:
- `20260929000000_manada_fondo_refugios.sql` — 3 tablas
  (`manada_refugio_preferences`, `manada_fondo_pool`, `manada_aportes_log`)
  + 3 RPCs (`set_manada_refugio_preference`, `get_manada_aporte_summary`,
  `get_manada_fondo_transparency`) + smoke catalog test.
- `20260929000001_manada_pool_close_cron.sql` — RPC
  `close_manada_pool_for_previous_month` + cron mensual día 1 03:00 UTC.

---

## 9. Reglas críticas (overrides — nunca violar)

1. **`docs/` es output de build** (`npm run build`). Nunca editar a mano.
2. **Migraciones SQL**: timestamp prefix. Pedro las aplica manualmente via
   Supabase Dashboard. **Nunca DROP TABLE / DELETE FROM sin WHERE** en tablas
   con datos de usuarios.
3. **Triggers plpgsql con smoke inline** (regla 9.2.1): toda mig que
   crea/modifica trigger plpgsql DEBE incluir `DO $$ ... $$` con ROLLBACK que
   lo ejercite. Plpgsql es lazy-validation; sin smoke el trigger se crea "OK"
   y explota meses después.
4. **Proteger datos usuarios existentes** (regla 9.7): migrar al cambiar
   esquema, defaults en columnas NOT NULL nuevas, fallback al renombrar keys
   localStorage.
5. **Copy en español chileno** (tuteo: tú/tienes/puedes). NO voseo argentino.
   NO vosotros español. Términos: "comuna", "ficha clínica", "recordatorio",
   "Paw Friend", "Aportes" (NO "donaciones" en UI pública).
6. **Nunca pegar API keys/JWTs en chat ni commits**.
7. **Nunca flipear `verify_jwt` en bloque** (incidente 2026-04-20: romper 28
   fns simultáneo). Hacer 1 a 1 con smoke.
8. **Nunca hardcodear JWTs en `cron.schedule`**; usar
   `current_setting('app.settings.service_role_key')`.
9. **`diagrams/FLUJO_COMPLETO.mmd`**: fuente de verdad única flujo end-to-end.
   Un solo bloque Mermaid pegable en mermaid.live.
10. **Política "esconder, no eliminar"** features: behind feature flag false.
    Revisión a +6 meses (`_pending/HIDDEN_FEATURES_REVIEW_*.md`).
11. **PowerShell no soporta heredoc bash** (Pedro corre Windows). Usar
    `git commit -F archivo.txt` para mensajes multilínea.
12. **Comandos Supabase CLI siempre con `npx`** (`npx supabase ...`).
13. **DB tabla `donations` NO renombrar** aunque UI diga "Aportes" (regla 9.7).
14. **DB columna `subscriptions.plan_type`** acepta `'free' | 'premium' |
    'paw_manada'`. UI muestra "Paw Member" para `'premium'` via
    `normalizePlanId()`. Manada (mensual/anual) se guarda con
    `plan_type='paw_manada'` (sin sufijo); ciclo se distingue por
    `payment_amount_clp` ($9.990 vs $99.900).
15. **Petify TEST → PROD**: NO flipear `PAW_SHIELD_PETIFY=true` con TEST key
    (los enrollments en producción quedan en sandbox y se pierden al rotar).

---

## 10. Acciones manuales pendientes Pedro (al 2026-04-29)

### 🔥 Crítico pre-launch (1 junio 2026)

1. **Aplicar 2 migs SQL** desde Supabase Dashboard:
   - `supabase/migrations/20260929000000_manada_fondo_refugios.sql`
   - `supabase/migrations/20260929000001_manada_pool_close_cron.sql`
2. **Re-deploy 5 edge fns**:
   ```
   npx supabase functions deploy flow-create-subscription
   npx supabase functions deploy flow-webhook
   npx supabase functions deploy consultation-prep
   npx supabase functions deploy generate-paw-passport
   npx supabase functions deploy generate-pet-id-card
   ```
3. **Activar pg_cron extension** + verificar `subscriptions_plan_type_check`
   acepta `'paw_manada'`.
4. **Migración Flow.cl → SpA SUSAETA GARNHAM** (URGENTE — riesgo fiscal de
   suscripciones recurrentes a cuenta personal). Plan: Tenpo / Mach / Prex.

### Cuando esté listo

5. **API Petify PROD** → reemplazar TEST key en Supabase Secrets → flipear
   `PAW_SHIELD_PETIFY=true` en `src/lib/featureFlags.ts`.
6. **QA paywall validado** → flipear `USER_PREMIUM=true`.

### Comercial / Legal / Beta

7. **Abogado chileno** (CLP 500k-1.5M) — review T&C + Privacy + 3 docs legales
   borradores en `docs-raiz/legal/`.
8. **Reclutar cohorte beta**: 30+ tutores reales + 5+ vets + 2 refugios + 1
   clínica. Hito 1 PATH_MRR.
9. **Pitch a inversionistas chilenos** con
   `pawfriend.cl/pitch/inversionistas.html` v2.1 (15 slides).
10. **Outreach B2B** con `OUTREACH_TEMPLATES_B2B_2026_04_29.md` (Centrovet +
    Sura primero).
11. **2FA admin** en cuenta Pedro.
12. **Marca INAPI**: consultar disponibilidad "Paw Friend" + "Paw Shield"
    (clases 9, 35, 42, 44).

---

## 11. Lecciones aprendidas (no volver a tropezar)

- **Premium B2C reactivación**: 2 intentos previos sin tracción (2026-04-08 +
  2026-04-19). v2.1 lo reactivó con feature unlock REAL (no solo badge) —
  pendiente validar conversión 13% target.
- **Vets no son motor de revenue**: tesis post-pivot 2026-04-22. Tienen
  demanda excedida, son pocos para mucha demanda, chatos de vendors.
- **"Donaciones" activa Ley 19.885 de donatarios**: reframe a "Aportes" / "Paw
  Support". Manada Fondo Refugios via SpA evita el problema (donación legal la
  hace persona jurídica, no user).
- **Triggers plpgsql lazy-validation**: 4 incidentes históricos por refs a
  columnas inexistentes. Regla 9.2.1 obligatoria.
- **JWT en `cron.schedule` literal**: incidente 2026-04-20. Vault obligatorio.
- **`verify_jwt` flip en bloque**: incidente 2026-04-20.
- **Vite manualChunks por path src**: causa circular deps. Solo vendors.
- **Petify modelo extractivo** (USD 0.50-0.75/pet/mes al dueño): captura 10%,
  deja 90% afuera. Refuerza moat Paw Friend (capturamos 100% via B2B).
- **Petify TEST→PROD**: flipear flag con TEST key rompe enrollments al rotar.
- **`subscriptions.plan_type`** es la columna real (NO `plan_id`). Error
  histórico fixed en mig 20260929000000.
- **Manada anual prorratea aporte refugio**: $24.000 en cobro anual = $2.000/mes
  equivalente al fondo.

---

## 12. Documentos canónicos del repo

### Docs vivos (sincronizados con código real)

- `CLAUDE.md` — manual operativo principal, sec 5 modelo v2.1.
- `MAPA_FUNCIONAL_COMPLETO.md` — mapa modular + changelog 2026-04-29 (~80 líneas).
- `AGENTS.md` — config para IA agents externos (Cursor, Copilot, etc.).
- `INDEX.md` — índice maestro docs.
- `README.md` — presentación pública.
- `diagrams/FLUJO_COMPLETO.mmd` — flujo end-to-end Mermaid.

### Docs estratégicos Plan v5 (canónicos para conversaciones)

- `docs-raiz/MODELO_FINANCIERO_2026_04_29.md` — FX 905 + sensibilidad + EBITDA
  por escala (1k → 100k MAU).
- `docs-raiz/CAP_TABLE_VALUACION_2026_04_29.md` — pre-seed USD 150k +
  termsheet SAFE + 8 angels Tier 2-3 LatAm.
- `docs-raiz/PATH_MRR_2026_04_29.md` — 8 hitos accionables M$ MRR mes 6.
- `docs-raiz/BETA_CRITERIA_2026_04_29.md` — cohorte 4-6 sem pre-launch +
  métricas no-vanity + criterios beta→público.
- `docs-raiz/POLISH_QA_E2E_2026_04_29.md` — matriz QA 6 flujos críticos.
- `docs-raiz/LEGAL_REVIEW_2026_04_29.md` — Ley 21.719/19.628 + tributario SpA
  + checklist abogado externo.
- `docs-raiz/PITCH_DECK_V2_2026_04_29.md` — **12 slides definitivos canónicos**.
- `docs-raiz/MANIFESTO_PAW_FRIEND_2026_04_29.md` — identidad verbal + tono +
  pitches 30s/1min.
- `docs-raiz/OUTREACH_TEMPLATES_B2B_2026_04_29.md` — templates email/LinkedIn
  para 7 motores B2B.
- `docs-raiz/PETIFY_COGS_CONTINGENCY_2026_04_29.md` — Plan A/B/C/D según
  volumen Shield activado.

### Docs legales borradores (esperan abogado externo)

- `docs-raiz/legal/POLITICA_USO_ACEPTABLE_2026_04_29.md`
- `docs-raiz/legal/DPA_TEMPLATE_2026_04_29.md` (subprocesadores)
- `docs-raiz/legal/CONTRATO_B2B_PRO_MAX_TEMPLATE_2026_04_29.md` (clínicas)

### Pitch decks públicos HTML (deployed `pawfriend.cl/pitch/`)

- `inversionistas.html` — **15 slides v2.1** (slide 9 nuevo "Moat B2B" con
  dashboards bronze/silver/gold + tabla EBITDA + ARR escalas + ask USD 150k).
- `companys.html` — empresas sponsor.
- `voices.html` — creadores Paw Voices.
- `partners.html` — tiendas aliadas.
- (deck único inversionistas en `inversionistas.html` 15 slides v2.1)
  proyección 5 años (USD 90k Y1 → USD 11M Y5
  LATAM-5 optimista).

### Modelo v2 origen

- `docs-raiz/pitch/MODELO_V2_2026_04_22.md` — pivot estratégico 2026-04-22 + addendum
  2026-04-29 con freemium 3 tiers.

### Operacionales

- `_pending/CRONS_SETUP_PENDIENTE.md` — 16 cron jobs (incl. nuevo
  `manada-pool-monthly-close`).
- `docs/audit/cleanup-fase1.md` — operacional consolidado sesión Plan v5.
- `_pending/UX_POLISH_BACKLOG.md` — items UX-01 al UX-12 post-launch.
- `_pending/SINTESIS_2026_04_30.md` — síntesis post 7 motores Revenue Master Plan.

---

## 13. Métricas del repo (al 2026-04-29 post-Plan v5)

| Métrica | Valor |
|---|---|
| Commits en `main` | ~720 |
| Migraciones SQL | ~199 |
| Edge functions | ~42 |
| Páginas | ~107 |
| Componentes React | ~440 |
| Hooks custom | ~107 |
| Rutas activas | ~78 |
| Tests Vitest | 587 verde |
| Tests Playwright | 336 verde |
| `npx tsc -b` | 0 errores |
| `_archive/superseded-by-plan-v5/` | 6 docs archivados 2026-04-29 |

---

## 14. North Star + KPIs operativos

- **North Star Owner**: pets con ≥10 eventos timeline / ≥3 categorías / Pet ID
  Card claimed.
- **Leading indicator del moat Pharma**:
  `profiles.anonymous_data_research_consent` opt-in rate. Sin consent, no hay
  deals.
- **KPIs canónicos** (`AdminMasterKPIs` widget):
  - MAU / WAU / DAU
  - Vets activos creando fichas
  - Conversión Free → Paw Member (target **13%**)
  - Conversión Free → Manada (target **1-2%**)
  - ARR runrate USD
  - Retention D30 / D90
  - Churn mensual Paw Member / Manada
  - Manada Fondo Refugios acumulado (CLP)
  - Pharma deals piloto firmados
  - Rating app stores
- **Risk monitor §11**: 5 señales (AI cost spike, consent rate bajo, dropout,
  edge fn errors, pgvector slow).

---

## 15. Áreas con deuda técnica conocida

- **Bundle inicial**: <500 KB gzip target. Admin -71% post Sprint 0+1.
- **Premium-related code legacy**: `subscriptions.plan_type='premium'` aunque
  UI muestra "Paw Member". Refactor cosmético no urgente — `normalizePlanId()`
  resuelve.
- **OnboardingQuickFlow vs OnboardingDuenoMinimal**: 2 componentes existen.
  Ruta `/onboarding-mascota` apunta a Minimal. QuickFlow legacy.
- **Tablas `_deprecated_20260427`**: 4 tablas renombradas en mig
  `20260903900000_rename_orphan_tables.sql`. Drop definitivo 8 junio 2026 si
  nada las usa.
- **Mobile launch**: pendiente Apple Developer + Google Play Console + Meta
  verif.
- **Sample-dashboard.html**: linkeado desde companys.html. Verificar alineado
  con v2.1 (TODO Pedro).
- **Petify TEST key**: bloqueante para activar `PAW_SHIELD_PETIFY=true`.
- **9 hooks "huérfanos" del agente backend audit**: 9 falsos positivos
  detectados (en realidad tienen imports activos). Solo 3 hooks marcados como
  `@deprecated 2026-04-29`: `useLeadsClinicas`, `useProviderActivityFeed`,
  `usePaymentReminder`.

---

## 16. Conversaciones típicas con IA externa

### Auditoría / sparring estratégico

> *"Acabo de pivotar a freemium 3 tiers (Plan v5 Opción 3). Conversión target
> 13% Paw Member + 2% Manada. ¿Es realista para mercado pet Chile? ¿Qué
> benchmarks tengo? ¿Cómo testearía pricing?"*

### Revisión de pitch

> *"Voy a presentar a un angel chileno con red en CORFO/Founder Institute. Acá
> está mi deck: pawfriend.cl/pitch/inversionistas.html. ¿Qué slides necesito
> reforzar? ¿Qué objeciones esperar?"*

### Análisis competitivo

> *"Petify cobra USD 0.75/pet/mes a dueños directo, capta el 10% que paga.
> Yo uso modelo B2B de acceso a la ficha (pharma+seguros+retail pagan, dueño
> Free o freemium opcional). ¿Cómo se compara con apps similares en LATAM/US?
> ¿Hay riesgo que Petify cambie modelo?"*

### Decisiones de producto

> *"PremiumGate wireado en 6 features (Paw Shield, Passport, Insights Pro,
> Audio IA, Reportes >30d, max_pets). ¿Cuál sacaría del paywall si conversión
> falla? ¿Cuál pondría más arriba en el funnel?"*

### Modelo financiero

> *"FX 905. Petify USD 0.75/pet/mes. Conv Paw Member 13% + Manada 2%. EBITDA
> a 100k MAU = USD 2.84M (92% margen). ¿Sensibilidad realista? ¿Qué break-even
> debería preguntarme un angel?"*

---

## 17. Cómo usar este contexto

1. **Pegá este bloque completo** como primer mensaje a la IA externa
   (Perplexity, Claude.ai, ChatGPT, Gemini).
2. **Agregá tu prompt específico**: auditoría, sparring de decisión, revisión
   de pitch, modelo financiero, etc.
3. **No esperes que la IA vea el repo**. Cuando necesites detalles técnicos
   específicos, **citá el doc canónico** por path completo (ej:
   `docs-raiz/MODELO_FINANCIERO_2026_04_29.md`).
4. **Si te pide info que falta**: la IA debe pedirte explícitamente "necesito
   ver X archivo" antes de inventar.
5. **Mantenelo actualizado**: este doc se reescribe en cada pivot mayor (v1 →
   v2 → v2.1). Próximo update probable: post primer deal B2B firmado o
   post-launch con métricas reales.

---

**Versión**: 3.0 (v2.1 freemium 3 tiers consolidado) ·
**Fecha**: 2026-04-29 ·
**Próxima revisión sugerida**: post primer deal B2B firmado o post-launch
métricas reales (julio-agosto 2026).
