# 03 — Recomendaciones de herramientas

> Generado: 2026-04-10 | Versión: 1.0
> Para cada gap de `02_GAPS_Y_RIESGOS.md`, se recomienda la herramienta que lo resuelve.
> Formato: nombre, tier free, costo pro, esfuerzo de integración, alternativas, y por qué esta y no otra.

---

## Convención de esfuerzo

| Símbolo | Tiempo estimado | Significa |
|---|---|---|
| **XS** | < 30 min | Config file o npm install |
| **S** | 1-3 horas | Integración simple |
| **M** | 4-8 horas | Integración con cambios en código |
| **L** | 1-3 días | Feature completa |
| **XL** | 1+ semana | Proyecto dedicado |

---

## A. Observabilidad

### A1. Sentry para edge functions (backend)

| Campo | Valor |
|---|---|
| **Gap que resuelve** | A1 (observabilidad backend), A6 (monitoring pagos) |
| **Herramienta** | Sentry (ya instalado en frontend) |
| **Tier free** | 5K errors/mes, 1 usuario, 30 días retención |
| **Costo pro** | USD 26/mes (Team, 50K errors) |
| **Esfuerzo** | **S** — Agregar `@sentry/deno` en `_shared/`, importar en cada function |
| **Alternativas** | Axiom (free tier generoso), Logflare (integrado con Supabase), Baselime |
| **Por qué esta** | Ya tienen `@sentry/react` en frontend. Usar el mismo proyecto unifica errores frontend+backend en un solo dashboard. Sentry Deno es oficialmente soportado. |
| **Acción concreta** | En `supabase/functions/_shared/`, crear `sentry.ts` con `Sentry.init()`. En cada function, wrappear el handler con `Sentry.withScope()`. Para `flow-webhook`, agregar alert si el status no es 200. |

---

### A2. Structured logging con Axiom o Supabase Logs

| Campo | Valor |
|---|---|
| **Gap que resuelve** | A2 (logs estructurados) |
| **Herramienta** | **Axiom** |
| **Tier free** | 500 MB/mes ingest, 30 días retención, dashboards ilimitados |
| **Costo pro** | USD 25/mes (1 GB/mes) |
| **Esfuerzo** | **S** — Refactorizar `logger.ts` para enviar JSON a Axiom en producción via HTTP |
| **Alternativas** | Betterstack Logs, Supabase native logs (limitado, ya existe), Loki+Grafana (complejo) |
| **Por qué esta** | Free tier generoso, ingesta via simple HTTP POST (no requiere agent), query language potente, dashboards incluidos. Para un proyecto de este tamaño es ideal. |
| **Acción concreta** | Modificar `src/lib/logger.ts`: en producción, `logger.error()` también envía JSON a Axiom via `fetch`. Incluir `userId`, `url`, `timestamp`, `stack`. |

---

### A3. PostHog para analytics de producto

| Campo | Valor |
|---|---|
| **Gap que resuelve** | A3 (analytics), A4 (session replay), A7 parcial (feature flags remotos), B (A/B testing) |
| **Herramienta** | **PostHog** |
| **Tier free** | 1M eventos/mes, 5K session recordings/mes, feature flags ilimitados, 1M feature flag requests/mes |
| **Costo pro** | Pay-as-you-go, primeros 1M eventos gratis |
| **Esfuerzo** | **M** — Instalar SDK, reemplazar body de `track()` y `identify()` en `analytics.ts` |
| **Alternativas** | Mixpanel (free 20M events pero sin replay), Amplitude (free 50K MTU), Plausible (solo pageviews) |
| **Por qué esta** | PostHog es la única herramienta que cubre analytics + session replay + feature flags + A/B testing en un solo SDK con un free tier enorme. Paw Friend ya tiene los 40+ eventos definidos — solo falta conectarlos. Feature flags remotos reemplazan el `featureFlags.ts` estático sin rebuild. |
| **Acción concreta** | `npm install posthog-js`. En `analytics.ts`, reemplazar el body de `track()` con `posthog.capture()` y `identify()` con `posthog.identify()`. Inicializar en `main.tsx` con project API key. Migrar `featureFlags.ts` a PostHog feature flags. |

---

### A5. LLM observabilidad con Helicone o Langfuse

| Campo | Valor |
|---|---|
| **Gap que resuelve** | A5 (AI ops) |
| **Herramienta** | **Helicone** |
| **Tier free** | 100K requests/mes, logs, costos, latencia |
| **Costo pro** | USD 20/mes (1M requests) |
| **Esfuerzo** | **XS** — Cambiar base URL de API calls de Anthropic a proxy Helicone. Una línea por function. |
| **Alternativas** | Langfuse (open source, self-hosteable), Braintrust, LangSmith |
| **Por qué esta** | Zero-code integration: solo cambiar la base URL del API call. No requiere cambiar lógica de las edge functions. Dashboard inmediato con costos, latencia, tokens por request. |
| **Acción concreta** | En cada edge function que llama Anthropic, cambiar `https://api.anthropic.com` por `https://anthropic.helicone.ai` y agregar header `Helicone-Auth: Bearer <key>`. |

---

### A7. Uptime monitoring con Betterstack (ex UptimeRobot)

| Campo | Valor |
|---|---|
| **Gap que resuelve** | A7 (uptime monitoring), F3 (status page) |
| **Herramienta** | **Betterstack Uptime** |
| **Tier free** | 10 monitores, 3 min intervalo, 1 status page, alertas email+Slack |
| **Costo pro** | USD 25/mes (30s intervalo, SMS alerts) |
| **Esfuerzo** | **XS** — Crear cuenta, agregar URLs. Sin código. |
| **Alternativas** | UptimeRobot (free 50 monitors), Checkly (más potente pero más complejo), Cronitor |
| **Por qué esta** | Free tier cubre las necesidades. Incluye status page pública (resuelve F3 también). Alertas por email gratis. |
| **Acción concreta** | Monitorear: (1) `https://pawfriend.cl` (2) `https://gwailbjlvevkhwcrovfd.supabase.co/rest/v1/` (3) Una edge function healthcheck. Crear status page en `status.pawfriend.cl`. |

---

## B. Testing

### B1. Vitest + Testing Library para tests unitarios

| Campo | Valor |
|---|---|
| **Gap que resuelve** | B1 (tests unitarios), B1 (tests de integración parcial) |
| **Herramienta** | **Vitest** + **@testing-library/react** |
| **Tier free** | Open source |
| **Costo** | $0 |
| **Esfuerzo** | **M** para setup + **XL** para cobertura razonable (~40% de code paths críticos) |
| **Alternativas** | Jest (más lento, config más compleja con Vite), Bun test (experimental) |
| **Por qué esta** | Vitest es el test runner nativo de Vite. Reutiliza la config de `vite.config.ts`. Hot module reload en tests. Compatible con Testing Library. Cero config extra. |
| **Acción concreta** | (1) `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`. (2) Agregar `"test": "vitest"` y `"test:ci": "vitest run"` a scripts. (3) Crear `vitest.config.ts`. (4) Empezar por tests de: `src/lib/format.ts`, `src/lib/plans.ts`, `src/lib/featureFlags.ts`, `src/lib/openingHours.ts` (lógica pura). (5) Luego hooks críticos: `useAuth`, `usePlan`, `useReminders`. |

---

### B2. Playwright para tests E2E

| Campo | Valor |
|---|---|
| **Gap que resuelve** | B1 (E2E), visual regression parcial |
| **Herramienta** | **Playwright** |
| **Tier free** | Open source |
| **Costo** | $0 |
| **Esfuerzo** | **L** para setup + primeros 5 flujos críticos |
| **Alternativas** | Cypress (más popular pero más lento, sin multi-tab), Puppeteer (más bajo nivel) |
| **Por qué esta** | Multi-browser, más rápido que Cypress, visual comparisons built-in, trace viewer excelente para debugging. |
| **Acción concreta** | (1) `npm install -D @playwright/test`. (2) Crear `playwright.config.ts`. (3) Escribir tests para los 5 flujos críticos: login, crear mascota, ver ficha clínica, descargar PDF, pagar Premium. |

---

### B3. pgTAP para RLS testing

| Campo | Valor |
|---|---|
| **Gap que resuelve** | B3 (RLS testing) |
| **Herramienta** | **pgTAP** (via Supabase local) o scripts SQL manuales |
| **Tier free** | Open source |
| **Costo** | $0 |
| **Esfuerzo** | **L** — Escribir tests SQL para las ~15 tablas críticas |
| **Alternativas** | Supabase CLI `supabase test db`, scripts SQL manuales con `set role authenticated` |
| **Por qué esta** | pgTAP es el estándar para testing de Postgres. Supabase lo soporta nativamente con `supabase test db`. |
| **Acción concreta** | (1) Crear `supabase/tests/` con archivos `.sql`. (2) Para cada tabla crítica (`pets`, `medical_records`, `profiles`, `vet_bookings`, `paw_point_transactions`), escribir test que: setea role a `authenticated`, setea `request.jwt.claim.sub` a user A, intenta SELECT/INSERT/UPDATE/DELETE de datos de user B, verifica que falla. |

---

### B4. eslint-plugin-jsx-a11y para accesibilidad

| Campo | Valor |
|---|---|
| **Gap que resuelve** | B2 (accesibilidad) |
| **Herramienta** | **eslint-plugin-jsx-a11y** |
| **Tier free** | Open source |
| **Costo** | $0 |
| **Esfuerzo** | **XS** — `npm install -D eslint-plugin-jsx-a11y`, agregar a `eslint.config.js` |
| **Alternativas** | axe-core (runtime), pa11y (CLI) |
| **Por qué esta** | Catch en tiempo de desarrollo, no en runtime. Se integra con el ESLint que ya existe. |

---

## C. Seguridad

### C1. Auditoría manual de JWT en edge functions

| Campo | Valor |
|---|---|
| **Gap que resuelve** | C1 (edge functions sin JWT) |
| **Herramienta** | Auditoría manual + refactor |
| **Costo** | $0 |
| **Esfuerzo** | **M** — Revisar cada function, asegurar que valida `supabase.auth.getUser(token)` correctamente |
| **Acción concreta** | Para cada function: (1) verificar que extrae el `Authorization` header, (2) que llama `supabase.auth.getUser()`, (3) que retorna 401 si no hay user, (4) que valida ownership de los recursos pedidos. Para `flow-webhook`: validar firma HMAC de Flow.cl. Para `generate-sitemap`: es público por diseño, OK sin auth. |

---

### C2. npm audit + Snyk en CI

| Campo | Valor |
|---|---|
| **Gap que resuelve** | C2 (SAST/dependency scanning), E4 (Dependabot) |
| **Herramienta** | **GitHub Dependabot** + `npm audit` en CI |
| **Tier free** | Incluido en GitHub |
| **Costo** | $0 |
| **Esfuerzo** | **XS** — Crear `.github/dependabot.yml` |
| **Alternativas** | Renovate (más configurable), Snyk (más features), Socket.dev |
| **Por qué esta** | Viene gratis con GitHub. Cero config extra. PRs automáticos para security patches. |
| **Acción concreta** | Crear `.github/dependabot.yml` con `package-ecosystem: npm`, `schedule: weekly`. Agregar `npm audit --audit-level=high` como step del CI pipeline. |

---

### C3. GitHub secret scanning + push protection

| Campo | Valor |
|---|---|
| **Gap que resuelve** | C3 (secret scanning) |
| **Herramienta** | **GitHub Secret Scanning** (ya activo parcialmente) |
| **Tier free** | Incluido para repos públicos. Para privados: GitHub Advanced Security. |
| **Costo** | $0 si repo público |
| **Esfuerzo** | **XS** — Verificar que Push Protection está habilitado en Settings |
| **Acción concreta** | GitHub → Settings → Code security → Enable "Push protection". Ya bloqueó una key una vez — solo asegurar que sigue habilitado. |

---

### C4. Cloudflare Pages para headers de seguridad

| Campo | Valor |
|---|---|
| **Gap que resuelve** | C4 (headers de seguridad), D1 parcial (CDN mejorado) |
| **Herramienta** | **Cloudflare Pages** (reemplazo de GitHub Pages) |
| **Tier free** | 500 builds/mes, ancho de banda ilimitado, custom headers via `_headers` file |
| **Costo** | $0 |
| **Esfuerzo** | **S** — Migrar deploy de GH Pages a Cloudflare Pages. Crear `public/_headers` |
| **Alternativas** | Vercel (free tier similar), Netlify (free tier más limitado) |
| **Por qué esta** | Free, permite `_headers` file para CSP/HSTS/X-Frame-Options, CDN global de Cloudflare (mejor que GH Pages), analytics incluidos, preview deploys. Si la migración es mucho cambio ahora, se puede postergar — pero es el upgrade de hosting más valioso. |
| **Acción concreta** | (1) Crear proyecto en Cloudflare Pages conectado a GitHub. (2) Build command: `npm run build`. (3) Output dir: `docs`. (4) Crear `public/_headers` con CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. (5) Redirigir DNS de pawfriend.cl a Cloudflare. |

---

## D. Performance

### D3. Supabase Image Transformations

| Campo | Valor |
|---|---|
| **Gap que resuelve** | D3 (image optimization) |
| **Herramienta** | **Supabase Image Transformations** (built-in) |
| **Tier free** | 100 transformaciones/mes en free tier |
| **Costo pro** | Incluido en Pro plan (USD 25/mes) |
| **Esfuerzo** | **S** — Cambiar URLs de Storage para agregar parámetros de resize |
| **Alternativas** | Cloudinary (free 25K transforms), imgproxy (self-hosted), Cloudflare Images |
| **Por qué esta** | Ya usan Supabase Storage. No requiere migrar imágenes ni nuevo servicio. Solo agregar `?width=400&height=400` a las URLs de Storage. |
| **Acción concreta** | Crear helper `getOptimizedImageUrl(path, width, height)` en `src/lib/`. Usarlo en componentes de feed, perfiles, y fichas médicas. |

---

### D4. rollup-plugin-visualizer para bundle analysis

| Campo | Valor |
|---|---|
| **Gap que resuelve** | D2 (bundle analysis) |
| **Herramienta** | **rollup-plugin-visualizer** |
| **Tier free** | Open source |
| **Costo** | $0 |
| **Esfuerzo** | **XS** — `npm install -D rollup-plugin-visualizer`, agregar a `vite.config.ts` |
| **Acción concreta** | Agregar al build: genera `stats.html` con treemap del bundle. Agregar `stats.html` a `.gitignore`. |

---

## E. Dev Tooling

### E1. GitHub Actions para CI/CD

| Campo | Valor |
|---|---|
| **Gap que resuelve** | E1 (CI/CD), parcial de muchos otros (lint, type-check, audit en CI) |
| **Herramienta** | **GitHub Actions** |
| **Tier free** | 2,000 min/mes para repos privados, ilimitado para públicos |
| **Costo** | $0 |
| **Esfuerzo** | **M** — Crear workflow de CI + CD |
| **Acción concreta** | Ver `05_CI_CD_PIPELINE.md` para el diseño completo. |

---

### E2. Husky + lint-staged para pre-commit

| Campo | Valor |
|---|---|
| **Gap que resuelve** | E2 (pre-commit hooks) |
| **Herramienta** | **Husky** + **lint-staged** |
| **Tier free** | Open source |
| **Costo** | $0 |
| **Esfuerzo** | **XS** |
| **Acción concreta** | `npm install -D husky lint-staged`. `npx husky init`. Crear `.husky/pre-commit` que corra `npx lint-staged`. Config en `package.json`: lint-staged corre `eslint --fix` y `prettier --write` en archivos staged. |

---

### E3. Prettier para formatting

| Campo | Valor |
|---|---|
| **Gap que resuelve** | E3 (formatting) |
| **Herramienta** | **Prettier** |
| **Tier free** | Open source |
| **Costo** | $0 |
| **Esfuerzo** | **XS** para install, **S** para formatear codebase existente (un commit grande) |
| **Acción concreta** | `npm install -D prettier`. Crear `.prettierrc` con `semi: true, singleQuote: true, tabWidth: 2, trailingComma: "es5"`. Agregar `"format": "prettier --write src/"` a scripts. Correr una vez para formatear todo. Integrar con lint-staged. |

---

## F. Comunicaciones

### F1. Resend para email transaccional

| Campo | Valor |
|---|---|
| **Gap que resuelve** | F1 (email transaccional) |
| **Herramienta** | **Resend** |
| **Tier free** | 100 emails/día, 3,000/mes |
| **Costo pro** | USD 20/mes (50K emails) |
| **Esfuerzo** | **M** — Crear edge function para envío, diseñar templates |
| **Alternativas** | SendGrid (free 100/day), Postmark (free 100/month), Supabase Auth hooks |
| **Por qué esta** | API moderna (REST + SDKs), DX excelente, dominio custom fácil, React Email para templates. Free tier suficiente para el volumen actual. |
| **Acción concreta** | (1) Crear cuenta Resend, verificar dominio `pawfriend.cl`. (2) Crear edge function `send-email` con templates: confirmación de pago, recordatorio de cita, resumen semanal. (3) Llamar desde `flow-webhook` cuando un pago es exitoso. |

---

### F2. Firebase Cloud Messaging (FCM) para push notifications

| Campo | Valor |
|---|---|
| **Gap que resuelve** | F2 (push notifications) |
| **Herramienta** | **Firebase Cloud Messaging** (via Capacitor plugin ya instalado) |
| **Tier free** | Ilimitado |
| **Costo** | $0 |
| **Esfuerzo** | **M** — Configurar FCM project, agregar google-services.json, crear edge function para enviar |
| **Acción concreta** | (1) Crear proyecto Firebase (o usar el existente de Google Auth). (2) Descargar `google-services.json` para Android. (3) Guardar FCM server key como secret de Supabase. (4) En la app, registrar token de push con `PushNotifications.register()` y guardar en tabla `push_tokens`. (5) Desde `reminder-cron`, además de WhatsApp, enviar push via FCM. |

---

## G. Compliance

### G1. Supabase Pro para backups

| Campo | Valor |
|---|---|
| **Gap que resuelve** | G1 (backups), G2 parcial (disaster recovery) |
| **Herramienta** | **Supabase Pro plan** |
| **Tier free** | N/A — requiere upgrade |
| **Costo** | **USD 25/mes** |
| **Esfuerzo** | **XS** — Click en Dashboard |
| **Alternativas** | pg_dump manual vía cron (gratis pero frágil), Supabase branching (beta) |
| **Por qué esta** | Backups diarios automáticos, 7 días retención, Point-in-Time Recovery (PITR) en Pro. Es la forma más simple de tener backups. Con ~80 tablas y datos médicos, NO tener backups es el riesgo más grande del proyecto. |
| **Acción concreta** | Dashboard → Billing → Upgrade to Pro. Verificar que PITR está habilitado. Testear restore una vez. |

---

### G2. Cookie consent banner

| Campo | Valor |
|---|---|
| **Gap que resuelve** | C5 (cookie consent) |
| **Herramienta** | **cookie-consent** (react component simple) o **CookieYes** |
| **Tier free** | Open source / CookieYes free 100 pages |
| **Costo** | $0 |
| **Esfuerzo** | **S** |
| **Acción concreta** | Componente `<CookieConsent>` que aparece la primera vez, guarda consentimiento en localStorage, controla inicialización de PostHog y Sentry. |

---

## Resumen de recomendaciones ordenadas por impacto/esfuerzo

| # | Recomendación | Esfuerzo | Costo/mes | Gaps que resuelve | Prioridad |
|---|---|---|---|---|---|
| 1 | Supabase Pro (backups) | XS | USD 25 | G1, G2 | **Inmediato** |
| 2 | GitHub Actions CI/CD | M | $0 | E1 + enabler de muchos otros | **Inmediato** |
| 3 | PostHog | M | $0 | A3, A4, A7 parcial, feature flags, A/B | **Semana 1** |
| 4 | Betterstack Uptime | XS | $0 | A7, F3 | **Semana 1** |
| 5 | Vitest + Testing Library | M+XL | $0 | B1 | **Semana 1-2** |
| 6 | Husky + lint-staged + Prettier | XS | $0 | E2, E3 | **Semana 1** |
| 7 | Dependabot | XS | $0 | C2, E4 | **Semana 1** |
| 8 | Sentry en edge functions | S | $0 | A1, A6 | **Semana 2** |
| 9 | Auditoría JWT edge functions | M | $0 | C1 | **Semana 2** |
| 10 | Helicone (AI ops) | XS | $0 | A5 | **Semana 2** |
| 11 | Axiom (structured logs) | S | $0 | A2 | **Semana 3** |
| 12 | pgTAP RLS tests | L | $0 | B3 | **Semana 3** |
| 13 | Playwright E2E | L | $0 | E2E, visual regression | **Semana 4** |
| 14 | Resend (email) | M | $0 | F1 | **Semana 4** |
| 15 | FCM push notifications | M | $0 | F2 | **Semana 4** |
| 16 | rollup-plugin-visualizer | XS | $0 | D2 | **Cuando quieras** |
| 17 | eslint-plugin-jsx-a11y | XS | $0 | B2 | **Cuando quieras** |
| 18 | Supabase Image Transforms | S | incl. Pro | D3 | **Cuando quieras** |
| 19 | Cloudflare Pages (migración hosting) | S | $0 | C4, CDN mejorado | **Mes 2** |
| 20 | Cookie consent | S | $0 | C5 | **Mes 2** |

**Costo total mensual**: USD 25 (Supabase Pro). Todo lo demás es gratis o tiene free tier suficiente.

---

*Ver `04_MASTER_PLAN.md` para el plan de implementación fase por fase.*
