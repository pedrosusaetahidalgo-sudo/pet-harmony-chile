# 01 — Inventario actual del tooling de Paw Friend

> Generado: 2026-04-10 | Versión: 1.0
> Fuentes: `package.json`, configs reales del repo, `_archive/CONTEXTO_2026_04_11.md`, código fuente.
> Metodología: solo se listan herramientas cuya dependencia o archivo de config existe en el repo.

---

## 1. Stack base (versiones exactas de package.json)

### Frontend

| Dependencia | Versión | Rol |
|---|---|---|
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | React renderer |
| `react-router-dom` | ^6.30.1 | Routing SPA |
| `typescript` | ^5.8.3 (devDep) | Type system |
| `vite` | ^5.4.19 (devDep) | Bundler |
| `@vitejs/plugin-react-swc` | ^3.11.0 (devDep) | Vite plugin con SWC |

### Estilos y UI

| Dependencia | Versión | Rol |
|---|---|---|
| `tailwindcss` | ^3.4.17 (devDep) | Utility CSS |
| `tailwindcss-animate` | ^1.0.7 | Animaciones Tailwind |
| `@tailwindcss/typography` | ^0.5.16 (devDep) | Plugin prose |
| `autoprefixer` | ^10.4.21 (devDep) | PostCSS autoprefixer |
| `postcss` | ^8.5.6 (devDep) | PostCSS |
| `class-variance-authority` | ^0.7.1 | CVA (shadcn) |
| `clsx` | ^2.1.1 | Classnames |
| `tailwind-merge` | ^2.6.0 | Merge Tailwind classes |
| `next-themes` | ^0.3.0 | Dark mode provider |
| `cmdk` | ^1.1.1 | Command palette |
| `vaul` | ^0.9.9 | Drawer component |
| `input-otp` | ^1.4.2 | OTP input |
| `embla-carousel-react` | ^8.6.0 | Carousel |
| `react-resizable-panels` | ^2.1.9 | Resizable panels |
| `react-day-picker` | ^8.10.1 | Date picker |
| 17 paquetes `@radix-ui/react-*` | varios | shadcn/ui primitivos |

### Estado, forms y data

| Dependencia | Versión | Rol |
|---|---|---|
| `@tanstack/react-query` | ^5.83.0 | Server state |
| `react-hook-form` | ^7.61.1 | Forms |
| `@hookform/resolvers` | ^3.10.0 | Zod resolver |
| `zod` | ^3.25.76 | Schema validation |

### Backend

| Dependencia | Versión | Rol |
|---|---|---|
| `@supabase/supabase-js` | ^2.86.0 | Cliente Supabase |

### Mobile (Capacitor 7)

| Dependencia | Versión | Rol |
|---|---|---|
| `@capacitor/core` | ^7.4.4 | Core runtime |
| `@capacitor/cli` | ^7.4.4 | CLI (en deps, debería ser devDep) |
| `@capacitor/android` | ^7.4.4 | Android platform |
| `@capacitor/ios` | ^7.4.4 | iOS platform |
| `@capacitor/app` | ^7.1.2 | App lifecycle |
| `@capacitor/browser` | ^7.0.5 | In-app browser |
| `@capacitor/clipboard` | ^7.0.4 | Clipboard |
| `@capacitor/device` | ^7.0.5 | Device info |
| `@capacitor/filesystem` | ^7.1.8 | File system |
| `@capacitor/haptics` | ^7.0.5 | Haptic feedback |
| `@capacitor/keyboard` | ^7.0.6 | Keyboard events |
| `@capacitor/push-notifications` | ^7.0.6 | Push (instalado, sin FCM setup) |
| `@capacitor/share` | ^7.0.4 | Native share |
| `@capacitor/splash-screen` | ^7.0.5 | Splash screen |
| `@capacitor/status-bar` | ^7.0.6 | Status bar |
| `@codetrix-studio/capacitor-google-auth` | ^3.4.0-rc.4 | Google OAuth nativo |

### Observabilidad

| Dependencia | Versión | Rol |
|---|---|---|
| `@sentry/react` | ^10.47.0 | Error tracking frontend |

### Otros

| Dependencia | Versión | Rol |
|---|---|---|
| `date-fns` | ^4.1.0 | Utilidades de fechas |
| `recharts` | ^2.15.4 | Charts |
| `lucide-react` | ^0.462.0 | Iconos principales |
| `react-icons` | ^5.5.0 | Iconos secundarios |
| `leaflet` | ^1.9.4 | Mapas |
| `react-leaflet` | ^4.2.1 | React wrapper Leaflet |
| `@types/leaflet` | ^1.9.21 | Tipos Leaflet |
| `qrcode.react` | ^4.2.0 | QR codes |
| `sonner` | ^1.7.4 | Toast notifications |
| `react-helmet-async` | ^2.0.5 | SEO meta tags |

### Linting (devDeps)

| Dependencia | Versión | Rol |
|---|---|---|
| `eslint` | ^9.32.0 | Linter |
| `@eslint/js` | ^9.32.0 | ESLint base config |
| `typescript-eslint` | ^8.38.0 | TS ESLint plugin |
| `eslint-plugin-react-hooks` | ^5.2.0 | React hooks rules |
| `eslint-plugin-react-refresh` | ^0.4.20 | Fast refresh rules |
| `globals` | ^15.15.0 | Global vars |

### Otros devDeps

| Dependencia | Versión | Rol |
|---|---|---|
| `lovable-tagger` | ^1.1.11 | Tag de Lovable (legacy) |
| `@types/node` | ^22.16.5 | Node types |
| `@types/react` | ^18.3.23 | React types |
| `@types/react-dom` | ^18.3.7 | ReactDOM types |

### Scripts en package.json

```json
"dev": "vite"
"build": "vite build"
"build:dev": "vite build --mode development"
"lint": "eslint ."
"preview": "vite preview"
"cap:sync": "npm run build && npx cap sync"
"android:run": "npx cap run android"
"android:open": "npx cap open android"
"android:build": "npm run build && npx cap sync android && cd android && ./gradlew assembleRelease"
"android:logs": "adb logcat | grep ..."
"android:logs:all": "adb logcat"
"android:logs:clear": "adb logcat -c"
"ios:run": "npx cap run ios"
"ios:open": "npx cap open ios"
"assets:generate": "npx capacitor-assets generate ..."
```

**No existen**: `test`, `typecheck`, `format`, `lint:fix`, `prepare` (husky), `storybook`.

---

## 2. Configuraciones clave

### TypeScript (`tsconfig.app.json`)

```
strict: false
noImplicitAny: false
strictNullChecks: false
noUnusedLocals: false
noUnusedParameters: false
noFallthroughCasesInSwitch: false
```

**Veredicto**: configuración ultra-permisiva. No detecta nulls, anys, ni variables sin uso.

### ESLint (`eslint.config.js`)

- Flat config ESLint 9
- `@typescript-eslint/no-unused-vars`: OFF
- Solo react-hooks y react-refresh
- Sin reglas de seguridad, accesibilidad, ni imports

### Vite (`vite.config.ts`)

- SWC plugin (rápido)
- Build output a `docs/`
- `chunkSizeWarningLimit: 600`
- 6 vendor chunks manuales (react, query, ui, icons, date, supabase)
- Sin sourcemaps configurados para producción
- Sin análisis de bundle

### Tailwind (`tailwind.config.ts`)

- Dark mode: class-based
- Design system completo: brand colors, semantic colors, health state tokens
- Gradientes, shadows, border-radius custom
- Font: Plus Jakarta Sans
- Plugin: `tailwindcss-animate`

### Capacitor (`capacitor.config.ts`)

- appId: `cl.pawfriend.app`
- webDir: `docs`
- Push notifications: presentationOptions configuradas, sin FCM server key
- GoogleAuth: configurado con serverClientId
- Config de producción separada (`capacitor.config.production.ts`) con webDir: `dist` (inconsistencia con `docs`)

### Supabase (`supabase/config.toml`)

- project_id: `oexonzohpigriynmrbdr` (diferente al citado en CLAUDE.md: `gwailbjlvevkhwcrovfd`)
- **TODAS las edge functions tienen `verify_jwt = false`**
- Nota: "manejan auth manualmente con `supabase.auth.getUser(token)`"

---

## 3. Dimensiones cubiertas — auditoría de 50 puntos

| # | Dimensión | Estado | Evidencia |
|---|---|---|---|
| 1 | Type checking | 🟡 Parcial | `npx tsc -b` pasa con 0 errores, PERO `strict: false`, `noImplicitAny: false`, `strictNullChecks: false`. Es como tener cinturón de seguridad desabrochado. |
| 2 | Linting | 🟡 Parcial | ESLint 9 flat config existe con `@typescript-eslint/recommended`, pero `no-unused-vars: off`, sin reglas de seguridad, accesibilidad, ni imports. |
| 3 | Formatting (Prettier) | ❌ Ausente | No hay Prettier, `.prettierrc`, ni `prettier` en devDeps. Formato inconsistente depende del editor de cada contribuyente. |
| 4 | Tests unitarios | ❌ Ausente | No hay Vitest, Jest, ni `@testing-library/*` en deps. No existe `npm run test`. Cero archivos `*.test.*` o `*.spec.*`. |
| 5 | Tests de integración | ❌ Ausente | Mismo motivo que #4. |
| 6 | Tests E2E | ❌ Ausente | No hay Playwright, Cypress, ni equivalente. |
| 7 | Tests de accesibilidad | ❌ Ausente | No hay `eslint-plugin-jsx-a11y`, `@axe-core/*`, ni auditoría Lighthouse automatizada. |
| 8 | Tests de performance | ❌ Ausente | No hay Lighthouse CI, Web Vitals tracking, ni benchmarks. |
| 9 | Tests de mobile nativo | ❌ Ausente | No hay Appium, Detox, ni test runner nativo. Solo prueba manual. |
| 10 | Visual regression | ❌ Ausente | No hay Chromatic, Percy, ni Playwright visual comparisons. |
| 11 | Observabilidad errores frontend | ✅ Presente | `@sentry/react` ^10.47.0 con lazy-load en `src/lib/sentry.ts`. Integrado en `ErrorBoundary.tsx`. `tracesSampleRate: 0.1`. DSN via env var `VITE_SENTRY_DSN`. |
| 12 | Observabilidad errores backend | 🟡 Parcial | Edge functions logean a stdout (visible en Supabase Dashboard logs). No hay Sentry ni alertas en edge functions. |
| 13 | Logs estructurados | 🟡 Parcial | `src/lib/logger.ts` existe (console wrapper, errors always log, rest dev-only). No es structured logging (JSON) ni se envía a ningún servicio. |
| 14 | Métricas de uso (analytics) | 🟡 Parcial | `src/lib/analytics.ts` define 40+ eventos con `track()` y `identify()`, PERO solo logea en dev. Comentario literal: `"integración con provider externo pendiente"`. Sin Mixpanel/PostHog/Amplitude conectado. |
| 15 | Session replay | 🟡 Parcial | Sentry config tiene `replaysOnErrorSampleRate: 0.5` pero `replaysSessionSampleRate: 0`. Solo graba replays cuando hay error, nunca proactivamente. |
| 16 | Feature flags | 🟡 Parcial | `src/lib/featureFlags.ts` con 6 flags estáticos (`USER_PREMIUM`, `PAWGAME_SIDEBAR`, etc.). Son constantes en código — cambiar un flag requiere rebuild y deploy. No hay flags remotos. |
| 17 | A/B testing | ❌ Ausente | No hay framework ni infraestructura. |
| 18 | Performance budget / Lighthouse CI | ❌ Ausente | No hay Lighthouse CI. Bundle de 288 kB gzip es razonable, pero no hay enforcement automático. |
| 19 | Bundle analysis | ❌ Ausente | No hay `rollup-plugin-visualizer`, `vite-bundle-analyzer`, ni equivalente. Chunks manuales pero sin visibilidad de qué crece. |
| 20 | Dependency vulnerability scanning | ❌ Ausente | No hay `npm audit` automatizado, Snyk, ni Dependabot. |
| 21 | Secret scanning | ❌ Ausente | GitHub Push Protection bloqueó una key (memory: `project_rotate_keys_2026_04_11.md`), pero no hay scanning proactivo en CI. `.gitignore` excluye `.env*` y `MIS_API_KEYS.md`. |
| 22 | SAST (static security analysis) | ❌ Ausente | No hay CodeQL, Semgrep, ni SonarQube. |
| 23 | RLS testing automatizado | ❌ Ausente | Mencionado como pendiente en `_archive/CONTEXTO_2026_04_11.md` §5.1.2. No hay pgTAP ni tests de políticas. |
| 24 | Schema diff / migration testing | ❌ Ausente | 85 migraciones en `supabase/migrations/`, aplicadas manualmente vía SQL Editor. No hay `supabase db diff`, `supabase db reset` en CI, ni validation pre-apply. |
| 25 | Database backups visibles | ❌ Ausente | Mencionado como pendiente: "Verificar plan de backups Supabase (free tier no los tiene)". |
| 26 | CI/CD pipeline | ❌ Ausente | No existe `.github/workflows/`. Cero automation. Deploy es manual: `npm run build && git add docs/ && git push`. |
| 27 | Pre-commit hooks | ❌ Ausente | No hay Husky, lint-staged, ni `.husky/` directory. |
| 28 | Branch protection | ❌ Ausente | No verificado en GitHub settings, pero sin CI no hay checks que proteger. |
| 29 | Renovate / Dependabot | ❌ Ausente | No hay `renovate.json` ni `.github/dependabot.yml`. |
| 30 | Push notifications nativas | 🟡 Parcial | `@capacitor/push-notifications` ^7.0.6 instalado. `capacitor.config.ts` tiene `presentationOptions`. Pero no hay FCM server key, no hay service worker, no hay backend que envíe pushes. |
| 31 | Email transaccional | ❌ Ausente | No hay Resend, SendGrid, ni Supabase Auth emails personalizados más allá de los defaults. |
| 32 | SMS / WhatsApp transaccional | 🟡 Parcial | Edge functions `send-whatsapp-reminder` y `reminder-cron` existen. Código listo, pendiente verificación Meta Business. |
| 33 | Status page público | ❌ Ausente | No hay Betterstack, Instatus, ni equivalente. |
| 34 | Uptime monitoring | ❌ Ausente | No hay pings, healthchecks, ni alerts si pawfriend.cl se cae. |
| 35 | SSL / HTTPS forzado | ✅ Presente | GitHub Pages fuerza HTTPS automáticamente. Supabase endpoints son HTTPS. |
| 36 | Headers de seguridad (CSP, HSTS) | 🟡 Parcial | GitHub Pages agrega HSTS automático. No hay CSP custom, X-Frame-Options, ni headers configurables (limitación de GH Pages). |
| 37 | Cookie consent / GDPR / Ley 19.628 | ❌ Ausente | No hay banner de cookies ni gestión de consentimiento. Páginas `/terms` y `/privacy` existen pero no hay enforcement técnico. |
| 38 | SEO | 🟡 Parcial | `react-helmet-async` en uso. Edge function `generate-sitemap` existe. Pero no hay `robots.txt` verificado, structured data (JSON-LD), ni OG image dinámico. |
| 39 | Internacionalización | ❌ N/A | App es solo español chileno por diseño. No aplica. |
| 40 | Documentación de API / componentes | ❌ Ausente | No hay Swagger/OpenAPI para edge functions, ni JSDoc sistemático, ni TypeDoc. |
| 41 | Design system documentado | 🟡 Parcial | `tailwind.config.ts` define tokens completos (brand, semantic, health, premium). `src/lib/design-tokens.ts` existe. Pero no hay documentación visual ni catálogo. |
| 42 | Storybook o equivalente | ❌ Ausente | No hay Storybook, Ladle, ni Histoire. |
| 43 | AI ops / observabilidad de prompts y costos LLM | ❌ Ausente | 5 edge functions usan Anthropic/Gemini API. No hay logging de tokens consumidos, costo por request, ni tracking de calidad de respuestas. Rate limits hardcoded en código. |
| 44 | Rate limiting de edge functions | 🟡 Parcial | Algunas functions tienen rate limit manual (ej: `flow-create-subscription` con idempotencia). Pero no hay rate limiting global ni por IP. `verify_jwt = false` en TODAS las functions. |
| 45 | CDN | 🟡 Parcial | GitHub Pages tiene CDN global de Fastly. Pero assets de Supabase Storage no tienen CDN dedicado. |
| 46 | Image optimization | ❌ Ausente | No hay `vite-imagetools`, Cloudinary, ni `<img>` con `srcset`/`sizes`. Supabase Storage sirve imágenes sin transformación. |
| 47 | Error boundary granular | 🟡 Parcial | Un `ErrorBoundary` global en `App.tsx` que captura y reporta a Sentry. Pero es uno solo para toda la app — un error en un componente tumba toda la vista. |
| 48 | Moderación contenido UGC | 🟡 Parcial | Edge function `moderate-service-promotion` existe para promociones de servicios. Pero posts del feed, comentarios, y chat no tienen moderación. |
| 49 | Plan de disaster recovery | ❌ Ausente | No hay documentación de DR, ni backups verificados, ni runbook de incidentes. |
| 50 | Monitoring pagos (Flow webhooks) | 🟡 Parcial | `flow-webhook` tiene idempotencia. Pero no hay alertas si un webhook falla, ni dashboard de pagos fallidos, ni reconciliación automática. |

### Resumen de cobertura

| Estado | Cantidad | % |
|---|---|---|
| ✅ Presente | 2 | 4% |
| 🟡 Parcial | 18 | 36% |
| ❌ Ausente | 29 | 58% |
| N/A | 1 | 2% |

---

## 4. Métricas técnicas reales del repo

| Métrica | Valor | Fuente |
|---|---|---|
| Páginas (`src/pages/`) | 45 archivos + 1 subdirectorio (`PetClinicalRecord/`) + 1 subdirectorio (`standalone/`) | `ls src/pages/` |
| Componentes (`src/components/`) | ~70+ (12 subdirectorios + `ui/`) | CLAUDE.md |
| Hooks (`src/hooks/`) | 36 archivos | `ls src/hooks/` |
| Libs (`src/lib/`) | 31 archivos | `ls src/lib/` |
| Edge functions | 21 directorios (incluyendo `_shared`) | `ls supabase/functions/` |
| Migraciones SQL | 85 archivos | `ls supabase/migrations/ | wc -l` |
| Tablas Supabase | ~80 (estimado, referenciado en contexto) | `_archive/CONTEXTO_2026_04_11.md` |
| Rutas en App.tsx | ~43 | CLAUDE.md §7 |
| `as any` en código | 0 | `_archive/CONTEXTO_2026_04_11.md` |
| Errores TypeScript | 0 | `npx tsc -b` |
| Bundle index principal | 288 kB / 88 kB gzip | `_archive/CONTEXTO_2026_04_11.md` |
| Build time | ~25s | Verificado |

---

## 5. Bugs conocidos y pendientes técnicos

Fuente: `_archive/CONTEXTO_2026_04_11.md` §4 y `_pending/feedback/FEEDBACK_USUARIO_REAL_2026_04_10.md`.

| Bug/Pendiente | Severidad | Estado |
|---|---|---|
| Race condition foto perfil pro (toast "subida" pero avatar vacío) | P1 | Pendiente |
| Drawer scroll mobile < 600px | P2 | Pendiente verificación device real |
| Hero video sin comprimir (4.4 MB) | P3 | Pendiente HandBrake manual |
| PetAssistant loading sin cache | P3 | Pendiente |
| WhatsApp Cloud API pendiente verificación Meta | Bloqueante | Esperando Meta |
| Google Calendar Consent Screen sin verificar (límite 100 test users) | Bloqueante | Esperando Google (4-6 semanas) |
| `VITE_GOOGLE_MAPS_API_KEY` sin eliminar de Google Cloud Console | Bajo | Pendiente cleanup |
| Spend cap Anthropic sin confirmar | Medio | Pendiente verificar USD 10/mes |
| Backups Supabase free tier | Alto | Sin backups |
| `webpay-confirm` edge function obsoleta | Bajo | Decidir borrar |
| `capacitor.config.production.ts` usa `webDir: 'dist'` pero build va a `docs/` | Medio | Inconsistencia |
| `supabase/config.toml` project_id (`oexonzohpigriynmrbdr`) difiere de CLAUDE.md (`gwailbjlvevkhwcrovfd`) | Medio | Posible config local vs remoto |

---

*Fin del inventario. Ver `02_GAPS_Y_RIESGOS.md` para el análisis de impacto.*
