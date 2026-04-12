# Paw Friend — Blueprint maestro: Agente virtual de testing end-to-end

> **Propósito.** Plano director para construir, dentro de este repo, un sistema de testing automatizado que **se comporta como un usuario real** recorriendo Paw Friend de punta a punta: presiona botones, llena formularios, abre modales/drawers/tabs, sube y descarga archivos, valida outcomes, detecta regresiones funcionales **y** señales de mala UX.
>
> **Nota sobre la ubicación.** El prompt original sugería `docs/virtual-user-agent-testing-blueprint.md`, pero [CLAUDE.md §9.1](../CLAUDE.md) prohíbe modificar manualmente la carpeta `docs/` porque es el output de `npm run build` (`vite build --outDir docs`). Este documento vive en `_pending/` siguiendo la convención del repo: es un plan **por ejecutar** que todavía no está implementado. Cuando se complete, se mueve a `junk/` según las reglas de [_pending/README.md](./README.md).
>
> **Estado inicial del repo.** Playwright 1.59 ya está instalado, con 4 specs E2E, un fixture de auth falsa y matriz cross-browser de 5 engines. Este blueprint parte **reutilizando esa base** en vez de empezar de cero.
>
> **Última actualización:** 2026-04-11.
> **Audiencia:** cualquier agente IA (Claude Code, Cursor, Copilot) o persona que implemente la capa de testing.

---

## 1. Contexto detectado del proyecto

### 1.1. Stack confirmado (via [package.json](../package.json))

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | React 18.3 + TypeScript 5.8 | SPA con code-splitting (`lazy()`) |
| Bundler / dev server | Vite 5 (plugin `react-swc`) | Puerto local fijo: **8080** |
| Estilos | Tailwind 3 + `tailwindcss-animate` | |
| UI primitivos | **shadcn/ui** (Radix) + CVA | Todos los diálogos/menús usan Radix → tienen `role`/`aria-*` reales |
| Estado servidor | `@tanstack/react-query` 5 | Cachea 5min, retry 1, `refetchOnWindowFocus: false` |
| Formularios | `react-hook-form` 7 + `@hookform/resolvers` + `zod` 3 | |
| Backend | **Supabase** (auth, Postgres, Edge Functions, Storage) | Project ref `gwailbjlvevkhwcrovfd` |
| Notificaciones | **`sonner`** (toasts) + Radix Toast | Selector DOM: `[data-sonner-toast]` / `li[role='status']` |
| Rutas | `react-router-dom` 6 | Ver [src/App.tsx](../src/App.tsx) |
| Mapas | Leaflet + react-leaflet 4.2 | |
| Mobile | Capacitor 7 (Android + iOS) | WebView usa Chromium en Android y WebKit en iOS |
| Monitoring | `@sentry/react` 10 | Ya reporta errores de producción |

### 1.2. Herramientas de testing ya presentes

**No partimos de cero.**

| Herramienta | Versión | Uso actual |
|---|---|---|
| `@playwright/test` | **1.59.1** | E2E runner principal. Instalado, configurado, con 4 specs pasando. |
| `@playwright/mcp` | 0.0.70 | Permite manejar Playwright vía MCP (agentes IA). **Pieza clave** para el agente virtual. |
| `vitest` | 4.1 | Unit tests (`src/**/*.test.ts`). Excluye `e2e/` y `docs/`. |
| `@testing-library/react` | 16.3 | Tests de componentes con `jsdom`. |
| `@testing-library/user-event` | 14.6 | Simulación humana a nivel unit. |
| `jsdom` | 29 | Entorno simulado para Vitest. |
| `husky` + `lint-staged` | 9 / 16 | Pre-commit hook con ESLint + Prettier. |

**Scripts existentes en [package.json](../package.json):**

```jsonc
"test":         "vitest",
"test:ci":      "vitest run",
"test:e2e":     "playwright test --project=\"Desktop Chrome\" --project=\"Mobile Safari (iPhone 13)\"",
"test:e2e:full": "playwright test",
"test:e2e:safari": "playwright test --project=\"Desktop Safari\" --project=\"Mobile Safari (iPhone 13)\"",
"test:e2e:ui":  "playwright test --ui",
"test:e2e:headed": "playwright test --headed"
```

### 1.3. Configuración Playwright existente ([playwright.config.ts](../playwright.config.ts))

- `testDir: './e2e'`
- `baseURL: http://localhost:8080`
- `locale: es-CL`, `timezoneId: America/Santiago`
- `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'on-first-retry'`
- Reporters: `html` (no auto-open) + `list`
- Retries: **2 en CI, 1 en local**
- `fullyParallel: true`, `webServer: npm run dev`
- Matriz cross-platform (5 engines): Desktop Chrome · Desktop Firefox · Desktop Safari · Mobile Chrome (Pixel 5) · Mobile Safari (iPhone 13)

### 1.4. Suite E2E actual (`e2e/`)

| Archivo | Qué cubre hoy |
|---|---|
| [e2e/smoke-public.spec.ts](../e2e/smoke-public.spec.ts) | 9 rutas públicas. HTTP < 400, sin errores JS, body no vacío. |
| [e2e/smoke-protected.spec.ts](../e2e/smoke-protected.spec.ts) | 23 rutas protegidas → deben redirigir a `/auth`. |
| [e2e/smoke-navigation.spec.ts](../e2e/smoke-navigation.spec.ts) | Landing CTAs, Auth form, directorio vets, 404. |
| [e2e/add-pet.spec.ts](../e2e/add-pet.spec.ts) | Form crear mascota: validaciones + UI. |
| [e2e/fixtures/auth.ts](../e2e/fixtures/auth.ts) | `injectFakeAuth(page)` — sesión Supabase falsa en `localStorage`. |

### 1.5. Rutas detectadas ([src/App.tsx](../src/App.tsx))

**Públicas (16):** `/`, `/auth`, `/veterinarios[/comuna/:c][/especialidad/:e][/:slug]`, `/precios-veterinarios[/comuna/:c]`, `/para-veterinarios`, `/registro-veterinario`, `/registro-proveedor`, `/demo`, `/resena/:token`, `/qr/:token`, `/medical-share/:token`, `/terms`, `/privacy`.

**Protegidas (~35):** `/home`, `/feed`, `/comunidad[/:slug]`, `/my-pets`, `/add-pet`, `/edit-pet/:petId`, `/medical-records`, `/reminders`, `/adoption`, `/paw-game`, `/servicios`, `/peluquero/perfil`, `/services/:type` (walkers, vets, sitters, trainers, groomers), `/maps`, `/chat[/:conversationId]`, `/profile`, `/user/:userId`, `/payment-result`, `/admin`, `/settings`, `/en-memoria`, `/provider/dashboard`, `/provider/profile-edit`, `/pet/:petId/clinical`, `/mis-reservas`, `/upgrade[/success|/cancel]`, `/onboarding-mascota`, `/onboarding-vet`, `/reportes`, `/panel-pro`, `/analytics-demo`.

**BottomTabBar mobile** (5 tabs): Inicio · Mascotas · Vets · Recordatorios · Perfil.

### 1.6. Seed / datos de prueba

- [scripts/seed-demo.mjs](../scripts/seed-demo.mjs) — genera ~100 users/mascotas/vets/reseñas/feed. Requiere `.env.demo.local` con `SUPABASE_SERVICE_ROLE_KEY`. Users `@demo.pawfriend.cl`, password `Demo1234!`, flag `profiles.is_demo = true`. Soporta `--reset`.
- Migración flag `99999999000000_demo_seed_flag.sql` requerida antes.

### 1.7. Variables de entorno ([.env.example](../.env.example))

Ya existen: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_CLIENT_ID_WEB`, `VITE_SENTRY_DSN`.

A añadir en `.env.test.local` (gitignored):

```env
E2E_BASE_URL=http://localhost:8080
E2E_SUPABASE_PROJECT_REF=gwailbjlvevkhwcrovfd
E2E_USER_EMAIL=playwright+owner@demo.pawfriend.cl
E2E_USER_PASSWORD=Demo1234!
E2E_VET_EMAIL=playwright+vet@demo.pawfriend.cl
E2E_VET_PASSWORD=Demo1234!
SUPABASE_SERVICE_ROLE_KEY=...
```

### 1.8. Supuestos explícitos

1. **Seed no aplicado** todavía en el Supabase dev. Antes de correr flujos autenticados hay que ejecutar `scripts/seed-demo.mjs` una vez.
2. **Google OAuth y WhatsApp Cloud API** están a medio camino de verificación → no deben correr como críticos hasta que estén vivos. Se marcan como `test.fixme` + `@external`.
3. **Flow.cl** es integración externa con sandbox propio. El agente virtual NO completa pagos reales. Se stubea a nivel de ruta (`/upgrade/success`, `/upgrade/cancel`).
4. **Google Maps / Leaflet**: tiles externos. Tests de `/maps` deben tolerar que no carguen.
5. **PDF de ficha médica**: se valida **descarga**, no el render byte a byte.
6. **Mobile Capacitor**: matriz Playwright emula iPhone 13 / Pixel 5 en web view, no device real. Push notifications, haptics y OAuth nativo **no** se prueban aquí.
7. `/feed`, `/comunidad`, `/adoption` pueden tener estados vacíos hasta que haya seed → los asserts deben tolerar empty state.

---

## 2. Objetivo del agente virtual

### 2.1. Qué **sí** es

- Un proceso automatizado que recorre la app **como una persona**: tap/click, escribe en inputs, abre modales, espera toasts, lee texto en pantalla y reacciona a él.
- Un detector de **flujos rotos end-to-end**: no "el input existe", sino "el usuario pudo crear su mascota, la ve en `/my-pets`, puede editarla, si la elimina desaparece".
- Un sistema con **memoria de evidencia**: cada corrida deja screenshots, videos, traces, logs y reportes legibles por humanos **y por otros agentes IA**.
- Una red de seguridad para **regresiones** en flujos críticos.
- Un **radar de UX**: señala cuando un botón no da feedback, un formulario no tiene error visible, o un flujo requiere demasiados pasos.

### 2.2. Qué **no** es

- ❌ No reemplaza los unit tests de [src/lib/__tests__/](../src/lib/__tests__/) ni los tests de componentes con Testing Library.
- ❌ No es un monkey-tester ciego.
- ❌ No valida PDF byte a byte, ni renderiza mapas reales, ni cobra con Flow.
- ❌ No es test de performance ni de carga.
- ❌ No ejecuta flujos nativos de Capacitor (push, biometric, haptic).

### 2.3. Definición operativa (criterio de PASS)

Un test del agente virtual **pasa** si y solo si:

1. El paso del usuario tuvo **outcome observable** (URL cambió, toast apareció, elemento nuevo en DOM, row en Supabase, archivo descargado).
2. No hubo errores JS en consola (`page.on('pageerror')`).
3. No hubo toasts de error imprevistos (`[data-sonner-toast]` con `data-type='error'`).
4. El siguiente paso del flujo es alcanzable (no quedó atascado en modal sin cierre, pantalla blanca, ni loading infinito).

---

## 3. Recomendación técnica principal

### 3.1. Opciones evaluadas

| Opción | Fit | Veredicto |
|---|---|---|
| **Playwright** | ✅ Ya instalado, matriz cross-engine real, trace viewer, MCP | **GANADOR** |
| Cypress | Sin WebKit real, requeriría reescribir `e2e/` | Descartado |
| Puppeteer "solo" | Sin primitivos semánticos, sin cross-browser real | Descartado |
| Selenium | Sin beneficio adicional | Descartado |
| Visual regression (Percy/Chromatic, PW snapshots) | Útil como **complemento** | Fase 4+ |
| Agente IA browser-use / Stagehand | Frágil para regresiones determinísticas, costoso | Fase 5 opcional |
| **Playwright + MCP** | `@playwright/mcp` ya instalado → Claude Code puede manejar PW | Fase 5 ✅ |

### 3.2. Decisión

**Stack principal: Playwright + TypeScript + page-objects parciales + MCP asistido en Fase 5.**

Razones duras:
1. **Ya está instalado.** 0 deps nuevas para arrancar.
2. **Cross-engine real** (Chromium + WebKit + Firefox). Crítico porque Paw Friend se distribuye en WebView Android **y** iOS.
3. **Trace viewer** es la mejor herramienta para debugging de flujos rotos.
4. **Locators semánticos** (`getByRole`, `getByLabel`) alineados con Radix/shadcn.
5. **`@playwright/mcp`** abre la puerta a que Claude Code genere specs desde exploración manual.
6. **`webServer`** mantiene `npm run dev` vivo automáticamente.

### 3.3. Modelos de uso

| Modo | Comando | Cuándo |
|---|---|---|
| Smoke rápido | `npm run test:e2e` | Pre-commit, pre-merge |
| Matriz completa | `npm run test:e2e:full` | Nightly / release |
| Solo Safari | `npm run test:e2e:safari` | Antes de subir a TestFlight |
| UI interactiva | `npm run test:e2e:ui` | Debugging local |
| Headed | `npm run test:e2e:headed` | Reproducir bug en vivo |
| Single spec | `npx playwright test e2e/flows/pets/create-pet.spec.ts --headed` | Focus |
| Con MCP | `claude` con tool `@playwright/mcp` | Exploración/generación |

---

## 4. Arquitectura propuesta del sistema

### 4.1. Árbol de archivos objetivo

```
e2e/
├── flows/                         # Tests organizados por flujo
│   ├── auth/                      (11 specs — F-AUTH)
│   ├── onboarding/                (4  specs — F-ONB)
│   ├── navigation/                (10 specs — F-NAV)
│   ├── pets/                      (14 specs — F-PET)
│   ├── medical/                   (9  specs — F-MED)
│   ├── reminders/                 (7  specs — F-REM)
│   ├── vets-directory/            (11 specs — F-VET)
│   ├── services/                  (10 specs — F-SVC)
│   ├── maps/                      (4  specs — F-MAP)
│   ├── community/                 (12 specs — F-SOC)
│   ├── chat/                      (6  specs — F-CHT)
│   ├── profile-settings/          (11 specs — F-SET)
│   ├── provider/                  (10 specs — F-PRO)
│   ├── reviews/                   (4  specs — F-REV)
│   ├── adoption/                  (4  specs — F-ADO)
│   ├── gamification/              (5  specs — F-GAM)
│   ├── public-share/              (4  specs — F-SHR)
│   ├── admin/                     (3  specs — F-ADM)
│   ├── reports/                   (3  specs — F-REP)
│   ├── payments/                  (5  specs — F-PAY)
│   ├── legal/                     (4  specs — F-LEG)
│   └── error-states/              (8  specs — F-ERR)
├── smoke/                         # Lo actual, migrado
│   ├── public-routes.spec.ts      # ex smoke-public.spec.ts
│   ├── protected-routes.spec.ts   # ex smoke-protected.spec.ts
│   └── navigation.spec.ts         # ex smoke-navigation.spec.ts
├── fixtures/
│   ├── auth.ts                    # injectFakeAuth (ya existe) + realSignIn
│   ├── test-data.ts               # payloads de pets, vets, posts, etc.
│   ├── files/                     # archivos reales para upload
│   │   ├── pet-photo-small.jpg
│   │   ├── pet-photo-large.jpg
│   │   ├── pet-photo-tiny.jpg
│   │   ├── vaccination-card.jpg
│   │   ├── invalid.txt
│   │   └── oversized.pdf
│   └── supabase-admin.ts          # cliente con SERVICE_ROLE para setup/teardown
├── pages/                         # Page Objects (solo donde aporta)
│   ├── base-page.ts
│   ├── auth-page.ts
│   ├── add-pet-page.ts
│   ├── clinical-record-page.ts
│   └── vets-directory-page.ts
├── utils/
│   ├── virtual-user.ts            # Clase VirtualUser — persona humana
│   ├── outcome-assertions.ts      # assertToast, assertUrl, assertNoJsErrors
│   ├── selectors.ts               # Selectores normalizados (sonner, radix)
│   ├── wait-for-idle.ts           # Esperas resilientes
│   ├── supabase-cleanup.ts        # Borrar rows creadas
│   ├── console-watcher.ts         # Captura pageerror + console.error
│   └── ux-heuristics.ts           # Detector de click silencioso, botón mudo...
├── .auth/                         # storageState cacheado (gitignored)
├── reports/                       # Output (gitignored)
│   ├── html/
│   ├── traces/
│   ├── videos/
│   └── screenshots/
└── README.md                      # Guía rápida
```

### 4.2. Convenciones

- **Un flujo = un spec**. No mezclar "crear" y "editar" en el mismo archivo.
- **Nombre de spec:** `<verbo>-<objeto>.spec.ts` (`create-pet`, `download-pdf`).
- **`test.describe`** agrupa escenarios del mismo flujo (happy path, validaciones, edge cases).
- **Locators por rol primero**, luego por label, luego por text. Único caso excepcional: toasts (`[data-sonner-toast]`) y `data-testid` añadidos explícitamente. Cada `data-testid` se documenta en `docs/testids-registry.md` (a crear).
- **Naming de test**: `[<ID flujo>] <acción>` → `test('[F-PET-01] happy path mínimo crea la mascota')`.
- **Tags**: `@smoke`, `@auth`, `@slow`, `@flaky`, `@external`, `@ux`.
- **Orden**: smoke primero, flows después. No acoplar tests entre sí.

### 4.3. Configuración Playwright extendida

Evolución del [playwright.config.ts](../playwright.config.ts) actual:

```ts
outputDir: './e2e/reports/test-results',
reporter: [
  ['html', { outputFolder: './e2e/reports/html', open: 'never' }],
  ['list'],
  ['json', { outputFile: './e2e/reports/results.json' }], // para agentes IA
  ['junit', { outputFile: './e2e/reports/junit.xml' }],
],
use: {
  // ... existente ...
  trace: 'retain-on-failure',
  screenshot: { mode: 'only-on-failure', fullPage: true },
  video: 'retain-on-failure',
  actionTimeout: 10_000,
  navigationTimeout: 20_000,
},
```

Añadir **`globalSetup`** (verificar que `http://localhost:8080` responde; crear users si faltan) y **`globalTeardown`** (cleanup por `E2E_RUN_ID`).

### 4.4. Manejo de errores y reintentos

- **Reintentos automáticos**: 2 en CI, 1 local.
- **Reintentos manuales** (`test.retry(3)`) solo para integraciones externas.
- **Flaky detection**: test que reintente >1 vez en CI se etiqueta `@flaky` y entra a `docs/flaky-watchlist.md`.
- **Error capture**: `test.beforeEach` instala `page.on('pageerror')` + `page.on('console')` y adjunta al reporte.

---

## 5. Modelo de "usuario virtual"

### 5.1. Clase `VirtualUser` (propuesta `e2e/utils/virtual-user.ts`)

Abstracción sobre `page: Page` que se comporta como persona:

```ts
export class VirtualUser {
  constructor(public page: Page, public profile: VirtualUserProfile) {}

  // Navegación
  async goTo(path: string): Promise<void>;
  async clickCTA(name: RegExp | string): Promise<void>;    // valida outcome
  async openTab(label: string): Promise<void>;
  async openDrawer(name: string): Promise<void>;
  async openModal(trigger: Locator): Promise<Locator>;
  async closeModal(): Promise<void>;

  // Formularios
  async fillField(label: RegExp, value: string): Promise<void>;
  async selectOption(label: RegExp, option: RegExp): Promise<void>;
  async uploadFile(inputLabel: RegExp, filePath: string): Promise<void>;
  async submit(buttonName: RegExp): Promise<void>;

  // Observación
  async readToast(type?: 'success' | 'error' | 'info'): Promise<string>;
  async waitForUrlChange(from: string): Promise<void>;
  async waitForElement(locator: Locator, opts?: { timeout?: number }): Promise<void>;
  async expectNoErrors(): Promise<void>;

  // UX signals
  async measureClicksToComplete(flow: () => Promise<void>): Promise<number>;
  async detectSilentFailure(action: () => Promise<void>): Promise<UxSignal | null>;
}
```

**Clave:** cada método **valida outcome**. `clickCTA` no es `page.click()` crudo — es "click + espera que algo cambió (URL, modal, toast, elemento nuevo) o falla".

### 5.2. Perfiles de usuario virtual

| Perfil | Estado de entrada | Qué prueba |
|---|---|---|
| `newOwner` | Sin cuenta, sin mascota | Landing → registro → onboarding → primera mascota |
| `returningOwner` | Cuenta con 1 mascota, ficha básica | Login → home → editar → ficha médica |
| `ownerNoPet` | Cuenta sin mascotas | Empty states, CTA "crear mascota" |
| `powerOwner` | Cuenta con 3+ mascotas, reminders activos | Badge BottomTabBar, switch mascotas, reminders vencidos |
| `editorOwner` | Mascota vieja con datos incompletos | Editar → agregar microchip → subir foto → guardar |
| `socialOwner` | Posts en feed | Feed scroll, like, comentar, ver perfil otro |
| `uploader` | Cuenta lista para subir | Foto mascota, cartilla, validar formatos |
| `failOwner` | Ingresa datos inválidos | Validaciones: nombre vacío, peso negativo, microchip <15 dígitos |
| `downloader` | Ficha médica completa | Descargar PDF, compartir con token |
| `newVet` | Sin cuenta, quiere registrarse como vet | `/para-veterinarios` → `/registro-veterinario` → onboarding |
| `existingVet` | Vet registrado | Login → `/provider/dashboard` → editar perfil → precios |
| `publicVisitor` | Sin login | Directorio, filtros, perfil público, estimador, ficha compartida |

Cada perfil tiene email determinístico (`playwright+<perfil>+<runId>@demo.pawfriend.cl`), setup propio que garantiza estado esperado, y puede compartir `storageState` con otros tests del mismo perfil.

### 5.3. Principios de comportamiento

| Debe hacer | No debe hacer |
|---|---|
| Esperar outcome tras cada acción | Asumir que un click = éxito |
| Leer el texto que ve en pantalla | Confiar solo en `expect(locator).toBeVisible()` |
| Reintentar con timeouts razonables | Usar `waitForTimeout(n)` fijo (prohibido) |
| Limpiar sus datos al terminar | Dejar rows huérfanas |
| Capturar consola y network | Ignorar warnings silenciosos |
| Verificar persistencia (recargar y ver de nuevo) | Testear solo memoria in-flight |

### 5.4. Sesión y autenticación — 3 niveles

1. **Nivel 0 — no auth.** Flujos públicos. Sin setup.
2. **Nivel 1 — auth stub client-side** (`injectFakeAuth`). UI/validaciones que NO tocan Supabase. Ya implementado. Límite claro: queries reales fallan con 401.
3. **Nivel 2 — auth real vía API.** Flujos end-to-end que crean/leen rows reales. Requiere users seed + `storageState` persistido.

**`auth.setup.ts`** como proyecto dependencia (patrón `dependencies: ['setup']`):

```ts
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

setup('authenticate as owner', async ({ page }) => {
  await page.goto('/auth');
  await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL!);
  await page.getByLabel(/contraseña|password/i).fill(process.env.E2E_USER_PASSWORD!);
  await page.getByRole('button', { name: /ingresar|iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/home/);
  await page.context().storageState({ path: 'e2e/.auth/owner.json' });
});
```

---

## 6. Mapa completo de flujos — **TODOS los flujos de la app**

Esta sección es el corazón operativo del agente virtual. Cubre **TODOS** los flujos detectables en la app (137 flujos, 22 módulos), agrupados por módulo funcional. Cada flujo trae los 6 campos obligatorios: **Objetivo, Precondiciones, Pasos, Validaciones, Puntos de falla, Severidad**.

### 6.1. Leyenda

- **Prioridad**: `P0` nunca debe romperse · `P1` importante · `P2` secundario · `P3` externo/futuro
- **Severidad**: 🔴 crítico (rompe valor core) · 🟠 alto (rompe flujo) · 🟡 medio (degrada UX) · 🟢 bajo (cosmético)
- **Tags**: `@smoke`, `@auth` (sesión real), `@slow`, `@external` (terceros), `@flaky`, `@ux`
- **Perfil**: ver [§5.2](#52-perfiles-de-usuario-virtual)
- **Fase**: fase del plan de implementación ([§14](#14-plan-de-implementación-por-fases))
- **ID**: `F-<MÓDULO>-<NN>` — usado en `summary.json` y en nombres de test

### 6.2. Índice de módulos (137 flujos)

| Módulo | Código | # | Ruta Playwright |
|---|---|---|---|
| A · Auth & Sesión | F-AUTH | 11 | `flows/auth/` |
| B · Onboarding | F-ONB | 4 | `flows/onboarding/` |
| C · Navegación & Layout | F-NAV | 10 | `flows/navigation/` |
| D · Mascotas | F-PET | 14 | `flows/pets/` |
| E · Ficha Clínica (joya) | F-MED | 9 | `flows/medical/` |
| F · Recordatorios | F-REM | 7 | `flows/reminders/` |
| G · Directorio Vets (joya) | F-VET | 11 | `flows/vets-directory/` |
| H · Servicios & Reservas | F-SVC | 10 | `flows/services/` |
| I · Maps | F-MAP | 4 | `flows/maps/` |
| J · Comunidad & Social | F-SOC | 12 | `flows/community/` |
| K · Chat | F-CHT | 6 | `flows/chat/` |
| L · Perfil & Settings | F-SET | 11 | `flows/profile-settings/` |
| M · Provider B2B | F-PRO | 10 | `flows/provider/` |
| N · Reseñas | F-REV | 4 | `flows/reviews/` |
| O · Adopción & En Memoria | F-ADO | 4 | `flows/adoption/` |
| P · Gamificación | F-GAM | 5 | `flows/gamification/` |
| Q · QR y Compartir Público | F-SHR | 4 | `flows/public-share/` |
| R · Admin | F-ADM | 3 | `flows/admin/` |
| S · Reportes & Analytics | F-REP | 3 | `flows/reports/` |
| T · Upgrade & Pagos (Flow.cl) | F-PAY | 5 | `flows/payments/` |
| U · Legal & Público | F-LEG | 4 | `flows/legal/` |
| V · Empty states & Error | F-ERR | 8 | `flows/error-states/` |

### 6.3. Plantilla oficial de ficha

Cada spec debe empezar con este header:

```ts
/**
 * F-PET-01 — Crear mascota (happy path mínimo) · P0 · 🔴
 *
 * Objetivo:       Un dueño autenticado crea su primera mascota con nombre+especie
 *                 y la ve en /my-pets.
 * Precondiciones: Sesión owner (storageState), no excede plan Gratis (2 mascotas).
 * Pasos:          /add-pet → llenar nombre → seleccionar especie → submit
 * Validaciones:   redirect /my-pets, toast success, card visible, row en Supabase.
 * Puntos de falla: RLS insert · plan limit · lazy-load lento · upload storage.
 * Severidad:      🔴 Crítico — bloquea onboarding completo.
 */
```

---

### 6.4. Catálogo completo de flujos

---

## Módulo A · Auth & Sesión (`F-AUTH`)

#### F-AUTH-01 — Sign-in email/password · P0 · 🔴 · Fase 2
- **Ruta**: `/auth` → `/home` | `/provider/dashboard` | `/add-pet`
- **Perfil**: `returningOwner` · **Spec**: `flows/auth/sign-in.spec.ts` · **Tags**: `@auth @smoke`
- **Obj**: usuario con cuenta entra y llega a su Home.
- **Pre**: seed user, sin sesión activa, `returnTo` ausente.
- **Pasos**: 1) visitar `/auth` 2) toggle email-password 3) llenar email+password 4) click "Ingresar" 5) esperar redirect.
- **Val**: URL matchea `/home|/provider/dashboard|/add-pet`, sesión Supabase en `localStorage`, saludo visible, sin `pageerror`.
- **Fallos**: credenciales inválidas; RLS en `service_providers` dentro de `redirectUser`; timeout de `withTimeout(2500ms)` deja en loop; lazy load de Home lento.
- **Sev**: 🔴 bloquea todo acceso.

#### F-AUTH-02 — Sign-up email/password · P0 · 🔴 · Fase 2
- **Ruta**: `/auth` → `/add-pet`
- **Perfil**: `newOwner` (`playwright+new-<runId>@demo.pawfriend.cl`) · **Spec**: `flows/auth/sign-up.spec.ts`
- **Obj**: persona sin cuenta se registra y cae en onboarding.
- **Pre**: email no existe en `auth.users`.
- **Pasos**: `/auth` → tab "Registro" → nombre + email + password ≥8 chars → "Crear cuenta" → esperar.
- **Val**: mensaje "Confirma tu email" O redirect a `/add-pet`; row en `auth.users` + `profiles`.
- **Fallos**: password débil; email ya existe; confirmación por correo en prod rompe flujo E2E.
- **Sev**: 🔴 sin signup no hay funnel.

#### F-AUTH-03 — Sign-in Google OAuth · P1 · 🟠 · Fase 5 · `@external`
- **Ruta**: `/auth` → redirect Google → callback
- **Spec**: `flows/auth/google-oauth.spec.ts` → `test.fixme`
- **Obj**: login con Google funciona (`GoogleSignInButton`).
- **Pre**: `VITE_GOOGLE_CLIENT_ID_WEB` válido.
- **Pasos**: click botón Google → acepta consent → vuelve logueado.
- **Val**: URL post = `/home`, sesión con `provider: google`.
- **Fallos**: Google bloquea automation; dominios no autorizados; credenciales no manejables por Playwright.
- **Sev**: 🟠 — fixme hasta verificación manual.

#### F-AUTH-04 — Sign-in Facebook · P2 · 🟡 · Fase 5 · `@external`
- **Ruta**: `/auth` → redirect FB
- **Spec**: `flows/auth/facebook-oauth.spec.ts` → `test.fixme`
- **Obj**: login con Facebook (`useFacebookAuth`).
- **Pre**: app FB configurada.
- **Pasos**: click FB → auth → vuelve.
- **Val**: sesión con `provider: facebook`.
- **Fallos**: FB requiere device mobile; app review.
- **Sev**: 🟡 canal secundario.

#### F-AUTH-05 — Magic link · P2 · 🟡 · Fase 3
- **Ruta**: `/auth` (solo envío)
- **Spec**: `flows/auth/magic-link.spec.ts`
- **Obj**: user pide magic link y ve confirmación.
- **Pre**: email cualquiera.
- **Pasos**: `/auth` → "Enviar magic link" → email → submit.
- **Val**: estado `magicLinkSent=true`, toast "Revisa tu correo".
- **Fallos**: rate limit Supabase; email deliverability.
- **Sev**: 🟡 backup.

#### F-AUTH-06 — `returnTo` redirect post-login · P1 · 🟠 · Fase 2
- **Ruta**: `/auth?returnTo=/medical-records` → `/medical-records`
- **Spec**: `flows/auth/return-to.spec.ts`
- **Obj**: deep link protegido post-login lleva a esa ruta.
- **Pre**: sin sesión.
- **Pasos**: visitar ruta protegida → redirigido a `/auth?returnTo=...` → login → esperar.
- **Val**: URL final = deep link original.
- **Fallos**: `returnTo` no parseado; redirect a `/home` por default.
- **Sev**: 🟠 rompe onboarding desde email/push.

#### F-AUTH-07 — Session auto-redirect si ya logueado · P1 · 🟠 · Fase 2
- **Ruta**: `/auth` con sesión activa → `/home`
- **Spec**: `flows/auth/auto-redirect.spec.ts`
- **Obj**: con sesión, `/auth` no muestra form — va directo.
- **Pre**: `storageState` owner.
- **Pasos**: visitar `/auth`.
- **Val**: redirect instantáneo, form NO visible, `hasRedirected.current = true`.
- **Fallos**: flash del form antes del redirect; loop si `redirectUser` falla.
- **Sev**: 🟠 UX rota.

#### F-AUTH-08 — Logout · P0 · 🔴 · Fase 2
- **Ruta**: `/settings` botón "Cerrar sesión" → `/` o `/auth`
- **Perfil**: `returningOwner` · **Spec**: `flows/auth/sign-out.spec.ts`
- **Obj**: user sale y no vuelve a rutas protegidas sin re-login.
- **Pre**: sesión activa.
- **Pasos**: `/settings` → "Cerrar sesión" → confirmar si hay dialog.
- **Val**: redirect a landing/auth, `localStorage sb-*` borrado, `/home` redirige a `/auth`.
- **Fallos**: sesión residual en cookies; storageState persiste.
- **Sev**: 🔴 seguridad.

#### F-AUTH-09 — Redirect protected → /auth sin sesión · P0 · 🔴 · Fase 1 (ya cubierto)
- **Ruta**: las 23 rutas protegidas
- **Spec**: `smoke/protected-routes.spec.ts` (existente)
- **Obj**: ProtectedRoute bloquea acceso anónimo.
- **Pre**: sin sesión.
- **Pasos**: para cada ruta, visitar y medir URL final.
- **Val**: termina en `/auth` con `returnTo` apropiado.
- **Fallos**: nueva ruta protegida sin `<ProtectedRoute>`.
- **Sev**: 🔴 bug de seguridad.

#### F-AUTH-10 — AdminRoute bloquea no-admin · P0 · 🔴 · Fase 2
- **Ruta**: `/admin`
- **Perfil**: `returningOwner` (no-admin) · **Spec**: `flows/auth/admin-route.spec.ts`
- **Obj**: user normal no puede entrar a `/admin`.
- **Pre**: sesión owner sin rol admin.
- **Pasos**: visitar `/admin`.
- **Val**: redirect a `/home` o `/auth`; no ve contenido admin.
- **Fallos**: `AdminRoute` solo checkea client-side.
- **Sev**: 🔴 autorización.

#### F-AUTH-11 — Password reset · P2 · 🟡 · Fase 3
- **Ruta**: `/auth` link "¿Olvidaste tu contraseña?"
- **Spec**: `flows/auth/password-reset.spec.ts`
- **Obj**: user recibe email de reset.
- **Pre**: user existe.
- **Pasos**: `/auth` → reset link → email → submit.
- **Val**: toast "Email enviado".
- **Fallos**: link puede no estar implementado → `test.skip`.
- **Sev**: 🟡.

---

## Módulo B · Onboarding (`F-ONB`)

#### F-ONB-01 — Onboarding dueño minimal · P0 · 🔴 · Fase 2
- **Ruta**: `/onboarding-mascota`
- **Perfil**: `newOwner` · **Spec**: `flows/onboarding/onboarding-dueno.spec.ts`
- **Obj**: post-signup, guiar a crear su primera mascota.
- **Pre**: user recién creado sin mascotas.
- **Pasos**: llegada automática → pasos wizard → llenar datos → "Continuar" → aterrizar en `/home` o `/my-pets`.
- **Val**: row `pets` creada, redirect correcto, user queda autenticado.
- **Fallos**: wizard atascado; botón "saltar" no existe; persistencia entre pasos.
- **Sev**: 🔴 primera impresión.

#### F-ONB-02 — Onboarding vet minimal · P1 · 🟠 · Fase 3
- **Ruta**: `/onboarding-vet`
- **Perfil**: `newVet` · **Spec**: `flows/onboarding/onboarding-vet.spec.ts`
- **Obj**: vet recién registrado configura perfil básico.
- **Pre**: sign-up como vet.
- **Pasos**: wizard vet → llenar clinic, comuna, especialidades, horarios.
- **Val**: `service_providers` + `vet_profiles` rows creadas, redirect a `/provider/dashboard`.
- **Fallos**: RLS; validación RUT/registro profesional.
- **Sev**: 🟠 funnel B2B.

#### F-ONB-03 — Tutorial en Home (OnboardingTutorial) · P2 · 🟡 · Fase 3 · `@ux`
- **Ruta**: `/home` para primer visit
- **Spec**: `flows/onboarding/home-tutorial.spec.ts`
- **Obj**: first-time user ve tutorial y puede descartarlo.
- **Pre**: flag `seenOnboarding=false`.
- **Pasos**: `/home` → ver tutorial → "Siguiente" N veces → "Terminar".
- **Val**: tutorial desaparece, flag persiste en `localStorage`, no vuelve a aparecer tras reload.
- **Fallos**: bloquea interacción con la app; recursión.
- **Sev**: 🟡 fricción UX.

#### F-ONB-04 — Hints contextuales en Home · P2 · 🟢 · Fase 3
- **Ruta**: `/home` primeros minutos
- **Spec**: `flows/onboarding/home-hints.spec.ts`
- **Obj**: `HomeOnboardingHints` muestra sugerencias contextuales.
- **Pre**: user sin mascota O sin reminder.
- **Pasos**: `/home` → verificar hints presentes → click → llega a `/add-pet`.
- **Val**: hints visibles, click lleva a ruta esperada.
- **Fallos**: hints no se actualizan tras completar acción.
- **Sev**: 🟢 nudge UX.

---

## Módulo C · Navegación & Layout (`F-NAV`)

#### F-NAV-01 — BottomTabBar 5 tabs (mobile) · P0 · 🔴 · Fase 2
- **Ruta**: todas las rutas protegidas en mobile
- **Perfil**: `returningOwner` en iPhone 13 · **Spec**: `flows/navigation/bottom-tab-bar.spec.ts`
- **Obj**: las 5 tabs (Inicio, Mascotas, Vets, Recordatorios, Perfil) navegan y marcan la activa.
- **Pre**: viewport mobile (< md).
- **Pasos**: para cada tab, click → verificar URL → verificar `aria-current="page"`.
- **Val**: 5 URL transitions correctas; tab activa resaltada; badge Recordatorios = 0 (sin reminders).
- **Fallos**: tab inactivo sigue activo; navigate no dispara; safe-area offset roto.
- **Sev**: 🔴 navegación mobile.

#### F-NAV-02 — Sidebar desktop · P0 · 🔴 · Fase 2
- **Ruta**: `AppLayout.tsx` desktop
- **Perfil**: `returningOwner` en Desktop Chrome · **Spec**: `flows/navigation/sidebar.spec.ts`
- **Obj**: sidebar permite navegar entre todas las rutas principales.
- **Pre**: viewport desktop (≥ md).
- **Pasos**: click en cada ítem del sidebar → verificar URL + highlight.
- **Val**: todas las rutas accesibles; ítem activo resaltado.
- **Fallos**: ruta nueva no agregada al sidebar; collapse roto.
- **Sev**: 🔴.

#### F-NAV-03 — Header (notificaciones, chat, avatar) · P1 · 🟠 · Fase 3
- **Spec**: `flows/navigation/header.spec.ts`
- **Obj**: header muestra acceso a chat, notificaciones, avatar clickeable a perfil.
- **Pre**: sesión.
- **Pasos**: click ícono chat → `/chat`; click avatar → `/profile`; click campana → panel notifs.
- **Val**: cada click produce outcome.
- **Fallos**: panel notifs no se abre; avatar sin link.
- **Sev**: 🟠.

#### F-NAV-04 — Breadcrumbs en páginas profundas · P2 · 🟡 · Fase 3
- **Ruta**: `/pet/:id/clinical`, `/add-pet`, `/services/:type`
- **Spec**: `flows/navigation/breadcrumbs.spec.ts`
- **Obj**: breadcrumbs reflejan jerarquía y son clickeables.
- **Pre**: navegar a ruta profunda.
- **Pasos**: verificar breadcrumbs visibles → click intermedio → URL correcta.
- **Val**: breadcrumbs visibles; navegación funciona.
- **Fallos**: breadcrumb hardcodeado.
- **Sev**: 🟡.

#### F-NAV-05 — 404 NotFound · P1 · 🟠 · Fase 1 (ya cubierto)
- **Ruta**: `/ruta-inexistente`
- **Spec**: `smoke/navigation.spec.ts` (existente)
- **Obj**: ruta inválida muestra 404 estético, no crash.
- **Pre**: —
- **Pasos**: visitar ruta random.
- **Val**: body no vacío, muestra "404" o similar, link a `/`.
- **Fallos**: pantalla blanca; JS error.
- **Sev**: 🟠.

#### F-NAV-06 — Redirect legacy `/calendar` → `/mis-reservas` · P2 · 🟡 · Fase 3
- **Ruta**: `/calendar`
- **Spec**: `flows/navigation/legacy-redirect.spec.ts`
- **Obj**: legacy route redirige sin romper.
- **Pre**: sesión (ruta protegida).
- **Pasos**: visitar `/calendar`.
- **Val**: URL final `/mis-reservas`.
- **Fallos**: redirect loop.
- **Sev**: 🟡.

#### F-NAV-07 — Deep link nativo `cl.pawfriend.app://` · P3 · 🟡 · Fase 5 · `@external`
- **Spec**: `test.fixme` — requiere device
- **Obj**: deep link abre la app en ruta correcta.
- **Pre**: Capacitor app instalada.
- **Pasos**: simular `CapApp.appUrlOpen`.
- **Val**: URL interna = `/<slug>`.
- **Fallos**: no testeable desde browser.
- **Sev**: 🟡.

#### F-NAV-08 — Back button nativo (Android) · P3 · 🟡 · Fase 5 · `@external`
- **Spec**: `test.fixme` — device.
- **Obj**: botón físico retrocede O exit app si no hay historial.
- **Pre**: build Android.
- **Pasos**: presión física del botón back.
- **Val**: history back o exit app.
- **Fallos**: no testeable desde browser.
- **Sev**: 🟡.

#### F-NAV-09 — `/demo` carga (uso ventas) · P2 · 🟡 · Fase 1
- **Ruta**: `/demo`
- **Spec**: `flows/navigation/demo-page.spec.ts`
- **Obj**: página demo para pitch carga sin crash.
- **Pre**: —
- **Pasos**: visitar `/demo`.
- **Val**: body con contenido, no JS error, secciones de la demo visibles.
- **Fallos**: datos demo hardcoded ausentes.
- **Sev**: 🟡.

#### F-NAV-10 — `useScrollOnFocus` resetea scroll entre rutas · P2 · 🟢 · Fase 3 · `@ux`
- **Spec**: `flows/navigation/scroll-on-focus.spec.ts`
- **Obj**: al cambiar de ruta, el scroll vuelve a top.
- **Pre**: `/my-pets` scrolleado.
- **Pasos**: scroll down → navigate → nueva ruta.
- **Val**: `window.scrollY === 0` en la nueva página.
- **Fallos**: scroll retenido molesto.
- **Sev**: 🟢.

---

## Módulo D · Mascotas (`F-PET`)

#### F-PET-01 — Crear mascota mínima · P0 · 🔴 · Fase 2
- **Ruta**: `/add-pet` → `/my-pets`
- **Perfil**: `returningOwner` · **Spec**: `flows/pets/create-pet.spec.ts::minimal`
- **Obj**: nombre + especie = mascota creada y visible.
- **Pre**: no excede plan limit.
- **Pasos**: llenar nombre ("Mimi") → seleccionar "Gato" → "Agregar Mascota".
- **Val**: toast "Mascota creada", redirect `/my-pets`, card con nombre visible, row en `pets` con `owner_id` correcto.
- **Fallos**: RLS insert; plan limit; slow lazy; upload.
- **Sev**: 🔴.

#### F-PET-02 — Crear mascota completa (foto + médica) · P0 · 🔴 · Fase 2
- **Spec**: `flows/pets/create-pet.spec.ts::full`
- **Obj**: crear con todos los campos opcionales y médicos.
- **Pre**: plan permite + bucket storage disponible.
- **Pasos**: llenar raza, fecha nac, género, tamaño, color, peso, bio, personalidad ×3, subir foto `pet-photo-small.jpg`, expandir sección médica, microchip válido 15 dígitos, `neutered=true`, preferred_clinic, emergency_vet, diet, activity, insurance → submit.
- **Val**: row completa en `pets`; foto URL no placeholder; badges persistidos; clinical fields en ficha.
- **Fallos**: upload storage; field coercion (strings vs numbers); personality array serialization.
- **Sev**: 🔴.

#### F-PET-03 — Las 8 especies seleccionables · P1 · 🟠 · Fase 3
- **Spec**: `flows/pets/create-pet.spec.ts::species-matrix`
- **Obj**: combobox ofrece 8 opciones y cada una puede crear mascota.
- **Pre**: owner con 0 mascotas.
- **Pasos**: crear una mascota por especie (loop).
- **Val**: 8 rows creadas; cada una con species correcta; razas filtradas por especie.
- **Fallos**: CHECK constraint rechaza especie (bug corregido en commit `490b29b`); `BREEDS_BY_SPECIES` incompleto.
- **Sev**: 🟠 — ya hubo bug aquí.

#### F-PET-04 — Validación nombre vacío · P0 · 🔴 · Fase 1 (ya cubierto)
- **Spec**: `add-pet.spec.ts` → migrar a `flows/pets/create-pet.spec.ts::validation-name`
- **Obj**: form no envía sin nombre.
- **Pre**: `injectFakeAuth`.
- **Pasos**: llenar todo menos nombre → submit.
- **Val**: HTML5 required bloquea; no redirect.
- **Fallos**: campo `required` removido.
- **Sev**: 🔴.

#### F-PET-05 — Validación peso ≤ 0 · P0 · 🔴 · Fase 1 (ya cubierto)
- **Obj**: peso inválido muestra toast.
- **Pre**: `injectFakeAuth` + form con novalidate.
- **Pasos**: llenar nombre + especie + peso=-1 → submit.
- **Val**: toast "peso debe ser mayor a 0".
- **Fallos**: validación JS bypasseada.
- **Sev**: 🔴.

#### F-PET-06 — Validación fecha futura · P0 · 🔴 · Fase 1 (ya cubierto)
- **Obj**: birth_date en el futuro muestra toast.
- **Pre**: `injectFakeAuth` + bypass `max=hoy`.
- **Pasos**: llenar nombre + especie + birth_date=mañana → submit.
- **Val**: toast "no puede ser en el futuro".
- **Fallos**: timezone mismatch.
- **Sev**: 🔴.

#### F-PET-07 — Validación microchip 15 dígitos · P0 · 🔴 · Fase 1 (ya cubierto)
- **Obj**: microchip distinto a 15 dígitos muestra toast.
- **Pre**: `injectFakeAuth` + bypass pattern/maxLength.
- **Pasos**: expandir médica → microchip 10 dígitos → submit.
- **Val**: toast "microchip debe tener 15 dígitos".
- **Fallos**: regex bypass.
- **Sev**: 🔴.

#### F-PET-08 — Badges de personalidad select/deselect · P1 · 🟡 · Fase 3
- **Spec**: `flows/pets/create-pet.spec.ts::personality`
- **Obj**: badges toggle correctamente y se persisten.
- **Pre**: sesión.
- **Pasos**: click "Juguetón", "Cariñoso", click "Juguetón" de nuevo → submit.
- **Val**: row final tiene `["Cariñoso"]`.
- **Fallos**: estado visual desincronizado con state real; array no serializado.
- **Sev**: 🟡.

#### F-PET-09 — Plan limit (useCanAddPet) Gratis · P1 · 🟠 · Fase 3
- **Spec**: `flows/pets/create-pet.spec.ts::plan-limit`
- **Obj**: al llegar a 2 mascotas en plan Gratis, `/add-pet` se bloquea con CTA upgrade.
- **Pre**: owner con 2 mascotas en plan Gratis.
- **Pasos**: visitar `/add-pet` → intentar submit.
- **Val**: mensaje "Has alcanzado tu límite" + botón "Upgrade a Premium".
- **Fallos**: bypass client-side (debe haber también server-side).
- **Sev**: 🟠 modelo de negocio.

#### F-PET-10 — Editar mascota · P1 · 🟠 · Fase 3
- **Ruta**: `/edit-pet/:petId`
- **Spec**: `flows/pets/edit-pet.spec.ts`
- **Obj**: user edita mascota y cambios persisten.
- **Pre**: mascota creada.
- **Pasos**: `/my-pets` → click card → botón editar → cambiar peso → guardar.
- **Val**: toast "Guardado"; row actualizada; recargar muestra nuevo valor.
- **Fallos**: formulario no precarga valores; upload foto existente se pierde.
- **Sev**: 🟠.

#### F-PET-11 — Eliminar mascota · P1 · 🟠 · Fase 3
- **Spec**: `flows/pets/delete-pet.spec.ts`
- **Obj**: mascota eliminada sale de `/my-pets`; cascading limpio.
- **Pre**: mascota existente.
- **Pasos**: abrir mascota → botón eliminar → confirmar dialog.
- **Val**: desaparece de `/my-pets`; row borrada; reminders asociados también.
- **Fallos**: FK constraint bloquea; dialog no cierra; soft-delete mal implementado.
- **Sev**: 🟠.

#### F-PET-12 — Subir foto mascota · P1 · 🟠 · Fase 3
- **Spec**: `flows/pets/upload-photo.spec.ts`
- **Obj**: foto se sube a Supabase Storage y se ve en card.
- **Pre**: bucket `pet-photos` disponible.
- **Pasos**: `/add-pet` → `setInputFiles('pet-photo-small.jpg')` → preview → submit.
- **Val**: preview visible; `photo_url` no placeholder; persiste tras reload.
- **Fallos**: bucket RLS; MIME no soportado; tamaño excesivo.
- **Sev**: 🟠.

#### F-PET-13 — OCR cartilla vacunación (VaccinationCardOCR) · P1 · 🟡 · Fase 3 · `@slow`
- **Spec**: `flows/pets/vaccination-card-ocr.spec.ts`
- **Obj**: subir foto de cartilla y ver campos autocompletados.
- **Pre**: sesión; imagen `vaccination-card.jpg`.
- **Pasos**: `/add-pet` → abrir OCR → subir cartilla → esperar análisis.
- **Val**: ≥1 campo de vacuna pre-rellenado; loading state visible.
- **Fallos**: OCR service lento/caído; fallback no disponible; timeout sin feedback.
- **Sev**: 🟡.

#### F-PET-14 — Marcar mascota "En Memoria" · P2 · 🟡 · Fase 3 · `@ux`
- **Ruta**: `/en-memoria`
- **Spec**: `flows/pets/en-memoria.spec.ts`
- **Obj**: user marca mascota fallecida y no aparece en flujos activos.
- **Pre**: mascota existe.
- **Pasos**: abrir ficha → botón "En memoria" → confirmar dialog sensible.
- **Val**: flag `memorial=true`; aparece en `/en-memoria`; no en `/my-pets` activos.
- **Fallos**: copy insensible; dialog sin confirmación doble.
- **Sev**: 🟡 — flujo emocional.

---

## Módulo E · Ficha Clínica (`F-MED`) — **joya de la corona**

#### F-MED-01 — Ver ficha clínica completa · P0 · 🔴 · Fase 2
- **Ruta**: `/pet/:petId/clinical`
- **Perfil**: `returningOwner` · **Spec**: `flows/medical/view-clinical-record.spec.ts`
- **Obj**: ficha carga con secciones: datos básicos, vacunas, consultas, medicamentos, peso histórico, documentos.
- **Pre**: mascota con data médica seedeada.
- **Pasos**: `/my-pets` → click mascota → "Ver ficha clínica".
- **Val**: cada sección visible; ≥1 entry por sección; sin `pageerror`.
- **Fallos**: RLS en tablas médicas; queries lentas; secciones no renderizan por shape de data.
- **Sev**: 🔴 joya.

#### F-MED-02 — Agregar consulta · P0 · 🔴 · Fase 3
- **Spec**: `flows/medical/add-consultation.spec.ts`
- **Obj**: user agrega una consulta veterinaria.
- **Pre**: ficha abierta.
- **Pasos**: botón "Agregar consulta" → fecha + motivo + diagnóstico + tratamiento → guardar.
- **Val**: toast success; aparece en timeline; row en DB.
- **Fallos**: form no valida fecha; textarea no guarda.
- **Sev**: 🔴 valor core.

#### F-MED-03 — Agregar vacuna · P0 · 🔴 · Fase 3
- **Spec**: `flows/medical/add-vaccine.spec.ts`
- **Obj**: registrar vacuna (nombre, fecha, próxima dosis).
- **Pre**: ficha abierta.
- **Pasos**: botón "Agregar vacuna" → llenar campos → guardar.
- **Val**: vacuna en sección "Vacunas"; reminder auto-creado para próxima dosis.
- **Fallos**: edge function `reminder-cron` no crea recordatorio; trigger DB falla.
- **Sev**: 🔴.

#### F-MED-04 — Subir documento médico · P1 · 🟠 · Fase 3
- **Spec**: `flows/medical/upload-document.spec.ts`
- **Obj**: subir PDF/imagen de receta o examen.
- **Pre**: ficha abierta; bucket `medical-documents`.
- **Pasos**: botón upload → seleccionar archivo → esperar.
- **Val**: documento en lista; link download funciona.
- **Fallos**: bucket no existe; MIME; RLS.
- **Sev**: 🟠.

#### F-MED-05 — Descargar PDF ficha médica · P0 · 🔴 · Fase 2
- **Spec**: `flows/medical/download-pdf.spec.ts`
- **Obj**: generar y descargar PDF resumen.
- **Pre**: ficha con data.
- **Pasos**: botón "Descargar PDF" → `waitForEvent('download')`.
- **Val**: filename `*.pdf`; tamaño > 10 KB.
- **Fallos**: edge function `generate-medical-summary` falla; timeout > 30s; tipografías.
- **Sev**: 🔴 joya de la corona.

#### F-MED-06 — Descargar ZIP documentos · P1 · 🟠 · Fase 3
- **Spec**: `flows/medical/download-zip.spec.ts`
- **Obj**: descargar todos los documentos médicos en un zip.
- **Pre**: ficha con ≥1 documento subido.
- **Pasos**: botón "Descargar todo" → esperar download.
- **Val**: filename `*.zip`; > 1 KB.
- **Fallos**: edge `generate-medical-zip`; bucket access.
- **Sev**: 🟠.

#### F-MED-07 — Compartir ficha (generar token) · P0 · 🔴 · Fase 2
- **Spec**: `flows/medical/share-token.spec.ts`
- **Obj**: user genera link público `/medical-share/:token`.
- **Pre**: ficha abierta; feature premium si aplica.
- **Pasos**: botón "Compartir" → dialog → "Generar link" → copiar.
- **Val**: token persistido en `medical_shares`; link visible.
- **Fallos**: token no genera; RLS; clipboard falla en headless.
- **Sev**: 🔴 diferencial.

#### F-MED-08 — Ver ficha compartida sin login · P0 · 🔴 · Fase 2
- **Ruta**: `/medical-share/:token`
- **Perfil**: `publicVisitor` · **Spec**: `flows/medical/view-shared.spec.ts`
- **Obj**: externo abre link y ve ficha read-only.
- **Pre**: token válido de F-MED-07.
- **Pasos**: visitar URL.
- **Val**: ficha visible; sin botones de edición; marca "Compartida por X"; expiración visible.
- **Fallos**: token expirado; RLS bloquea read público.
- **Sev**: 🔴.

#### F-MED-09 — Revocar compartir · P1 · 🟠 · Fase 3
- **Spec**: `flows/medical/revoke-share.spec.ts`
- **Obj**: user revoca acceso; link deja de funcionar.
- **Pre**: token activo.
- **Pasos**: gestión de compartidos → revocar.
- **Val**: link público devuelve "Expirado".
- **Fallos**: cache de token; revocación no propaga.
- **Sev**: 🟠 privacidad.

---

## Módulo F · Recordatorios (`F-REM`)

#### F-REM-01 — Crear recordatorio · P0 · 🔴 · Fase 2
- **Ruta**: `/reminders`
- **Spec**: `flows/reminders/create-reminder.spec.ts`
- **Obj**: user crea recordatorio manual (ej: "Baño").
- **Pre**: mascota existente.
- **Pasos**: `/reminders` → botón "+" → título + fecha + mascota → guardar.
- **Val**: row en `reminders`; aparece en lista ordenada por fecha.
- **Fallos**: fecha en pasado bloqueada; mascota dropdown vacío.
- **Sev**: 🔴 promesa core.

#### F-REM-02 — Completar recordatorio · P0 · 🔴 · Fase 2
- **Spec**: `flows/reminders/complete-reminder.spec.ts`
- **Obj**: marcar reminder como done → desaparece de pendientes.
- **Pre**: reminder pending.
- **Pasos**: click checkbox → confirmar.
- **Val**: `status='done'`; ya no aparece en pending; badge decrementa.
- **Fallos**: optimistic update sin rollback si server falla.
- **Sev**: 🔴.

#### F-REM-03 — Badge BottomTabBar actualiza · P1 · 🟠 · Fase 3
- **Spec**: `flows/reminders/badge-updates.spec.ts`
- **Obj**: badge en tab Recordatorios refleja `overdueReminders.length + dueSoon`.
- **Pre**: 2 vencidos + 1 upcoming en 24h.
- **Pasos**: `/home` → verificar badge = 3 → completar uno → badge = 2.
- **Val**: número correcto; "9+" si > 9.
- **Fallos**: hook no actualiza; tab no re-renderiza.
- **Sev**: 🟠.

#### F-REM-04 — Recordatorio vencido visual · P1 · 🟡 · Fase 3
- **Spec**: `flows/reminders/overdue-visual.spec.ts`
- **Obj**: reminder con fecha pasada tiene badge rojo/"vencido".
- **Pre**: reminder con `due_date` < now.
- **Pasos**: `/reminders`.
- **Val**: elemento con clase/color rojo; texto "vencido".
- **Fallos**: timezone mismatch (config `America/Santiago`).
- **Sev**: 🟡.

#### F-REM-05 — Editar recordatorio · P2 · 🟡 · Fase 3
- **Spec**: `flows/reminders/edit-reminder.spec.ts`
- **Obj**: cambiar fecha o título de reminder.
- **Pre**: reminder existente.
- **Pasos**: click reminder → editar → guardar.
- **Val**: cambio persiste.
- **Fallos**: form no precarga.
- **Sev**: 🟡.

#### F-REM-06 — Eliminar recordatorio · P2 · 🟡 · Fase 3
- **Spec**: `flows/reminders/delete-reminder.spec.ts`
- **Obj**: borrar recordatorio.
- **Pre**: reminder existente.
- **Pasos**: menú → eliminar → confirmar.
- **Val**: desaparece de lista y DB.
- **Fallos**: soft-delete mal; FK.
- **Sev**: 🟡.

#### F-REM-07 — Reminder desde vacuna (auto-creado) · P1 · 🟠 · Fase 3
- **Spec**: `flows/reminders/auto-from-vaccine.spec.ts`
- **Obj**: al registrar vacuna con `next_due_date`, se crea reminder auto.
- **Pre**: F-MED-03 ejecutado.
- **Pasos**: observar reminder tras agregar vacuna.
- **Val**: row `reminders` con link a vacuna.
- **Fallos**: edge cron / trigger DB no dispara.
- **Sev**: 🟠.

---

## Módulo G · Directorio Vets (`F-VET`) — **joya pública SEO**

#### F-VET-01 — Listado vets público · P0 · 🔴 · Fase 2
- **Ruta**: `/veterinarios`
- **Perfil**: `publicVisitor` · **Spec**: `flows/vets-directory/list.spec.ts`
- **Obj**: cualquiera ve el directorio con cards.
- **Pre**: `service_providers` + `vet_profiles` seedeados.
- **Pasos**: visitar `/veterinarios`.
- **Val**: ≥1 card O empty state; buscador visible; filtros presentes.
- **Fallos**: RLS bloquea anon read; query lenta; hook `useDirectoryVets` falla.
- **Sev**: 🔴 tráfico SEO.

#### F-VET-02 — Búsqueda por texto · P0 · 🔴 · Fase 2
- **Spec**: `flows/vets-directory/search-text.spec.ts`
- **Obj**: buscador filtra cards en tiempo real.
- **Pre**: directorio con ≥2 vets.
- **Pasos**: escribir "clínica" en buscador.
- **Val**: lista se reduce; cards contienen texto.
- **Fallos**: debounce no aplicado; accent-insensitive roto.
- **Sev**: 🔴.

#### F-VET-03 — Filtrar por comuna (URL param) · P0 · 🔴 · Fase 2
- **Ruta**: `/veterinarios/comuna/providencia`
- **Spec**: `flows/vets-directory/filter-comuna.spec.ts`
- **Obj**: URL con comuna pre-carga filtro.
- **Pre**: vets en Providencia seedeados.
- **Pasos**: visitar URL directamente.
- **Val**: select muestra "Providencia"; cards filtradas; meta SEO actualizada.
- **Fallos**: `unslugify` falla; SEO tags no actualizan.
- **Sev**: 🔴.

#### F-VET-04 — Filtrar por especialidad · P1 · 🟠 · Fase 2
- **Ruta**: `/veterinarios/especialidad/oftalmologia`
- **Spec**: `flows/vets-directory/filter-specialty.spec.ts`
- **Obj**: URL con especialidad filtra.
- **Pre**: vets con especialidad seedeados.
- **Pasos**: visitar URL.
- **Val**: cards solo con esa especialidad; SEO tags.
- **Fallos**: `unslugify` + `VET_SPECIALTIES` desalineados.
- **Sev**: 🟠.

#### F-VET-05 — Filtro "Abiertos ahora" · P1 · 🟠 · Fase 1 (parcial)
- **Spec**: migrar de `smoke-navigation.spec.ts`
- **Obj**: toggle filtra vets con `isOpenNow(opening_hours)`.
- **Pre**: ≥1 vet con horario abierto ahora.
- **Pasos**: `/veterinarios` → toggle "Abiertos ahora".
- **Val**: lista filtrada; respeta `America/Santiago`.
- **Fallos**: timezone; horario en null; `isOpenNow` bug.
- **Sev**: 🟠.

#### F-VET-06 — Filtro "Atiende urgencias" · P1 · 🟠 · Fase 1 (parcial)
- **Spec**: `flows/vets-directory/filter-emergency.spec.ts`
- **Obj**: toggle filtra por `emergency_service=true`.
- **Pre**: ≥1 vet con urgencias.
- **Pasos**: toggle "Atiende urgencias".
- **Val**: lista filtrada.
- **Fallos**: campo no existe en DB.
- **Sev**: 🟠.

#### F-VET-07 — Filtro rating mínimo · P2 · 🟡 · Fase 3
- **Spec**: `flows/vets-directory/filter-rating.spec.ts`
- **Obj**: select de rating filtra.
- **Pre**: vets con rating variado.
- **Pasos**: seleccionar `>=4`.
- **Val**: cards con rating ≥ 4.
- **Fallos**: rating nullable no filtra.
- **Sev**: 🟡.

#### F-VET-08 — Paginación infinita · P1 · 🟡 · Fase 3
- **Spec**: `flows/vets-directory/infinite-scroll.spec.ts`
- **Obj**: scroll carga más cards (`useInfiniteQuery`).
- **Pre**: > 1 página de vets.
- **Pasos**: scroll a fondo.
- **Val**: antes = N cards, después = > N.
- **Fallos**: `hasNextPage` incorrecto; scroll listener no dispara.
- **Sev**: 🟡.

#### F-VET-09 — Ver perfil público vet · P0 · 🔴 · Fase 2
- **Ruta**: `/veterinarios/:slug`
- **Spec**: `flows/vets-directory/public-profile.spec.ts`
- **Obj**: user abre perfil y ve info completa.
- **Pre**: vet slug seedeado.
- **Pasos**: click card desde listado.
- **Val**: nombre, foto, comuna, horarios, precios, WhatsApp/teléfono, mini-mapa, SEO tags.
- **Fallos**: slug no encontrado; SEO tags vacíos.
- **Sev**: 🔴.

#### F-VET-10 — Abrir WhatsApp desde perfil · P1 · 🟠 · Fase 3
- **Spec**: `flows/vets-directory/open-whatsapp.spec.ts`
- **Obj**: click botón WhatsApp abre `wa.me` con número correcto.
- **Pre**: vet con phone.
- **Pasos**: click botón → esperar popup.
- **Val**: `page.waitForEvent('popup')` O `href` de `a` con `wa.me/56...`.
- **Fallos**: número formateado incorrectamente (56 vs +56); no tiene phone.
- **Sev**: 🟠 canal principal de contacto.

#### F-VET-11 — Estimador de precios por comuna · P1 · 🟠 · Fase 2
- **Ruta**: `/precios-veterinarios` y `/precios-veterinarios/comuna/:comuna`
- **Spec**: `flows/vets-directory/price-estimator.spec.ts`
- **Obj**: user estima precio por comuna y servicio.
- **Pre**: datos de precios seedeados.
- **Pasos**: seleccionar comuna → seleccionar servicio → ver rango.
- **Val**: rango CLP visible; formato `formatCLP`; SEO tags actualizados.
- **Fallos**: datos faltan; formato incorrecto.
- **Sev**: 🟠 diferencial SEO.

---

## Módulo H · Servicios & Reservas (`F-SVC`)

#### F-SVC-01 — Listado `/servicios` con tabs · P1 · 🟠 · Fase 3
- **Ruta**: `/servicios`
- **Spec**: `flows/services/list.spec.ts`
- **Obj**: página muestra tabs de las 5 categorías.
- **Pre**: sesión.
- **Pasos**: visitar `/servicios` → verificar tabs walkers/vets/sitters/trainers/groomers.
- **Val**: 5 tabs visibles; tab default activa.
- **Fallos**: tabs sin contenido; empty states ausentes.
- **Sev**: 🟠.

#### F-SVC-02 — `/services/walkers` (Paseadores) · P1 · 🟠 · Fase 3
- **Spec**: `flows/services/walkers.spec.ts`
- **Obj**: listado de walkers con filtros avanzados.
- **Pre**: walkers seedeados.
- **Pasos**: `/services/walkers` → verificar filtros → buscar.
- **Val**: cards o empty state; filtros funcionan; no JS error.
- **Fallos**: tabla `dog_walker_profiles` vacía; RLS.
- **Sev**: 🟠.

#### F-SVC-03 — `/services/vets` (Vets a domicilio) · P1 · 🟠 · Fase 3
- **Spec**: `flows/services/vets.spec.ts`
- **Obj**: listado de vets a domicilio.
- **Pre**: `vet_profiles` seedeados.
- **Pasos**: `/services/vets` → filtros.
- **Val**: cards o empty state.
- **Fallos**: RLS; filtros rotos.
- **Sev**: 🟠.

#### F-SVC-04 — `/services/sitters` (Cuidadores) · P1 · 🟠 · Fase 3
- **Spec**: `flows/services/sitters.spec.ts`
- **Obj**: listado de sitters.
- **Pre**: `dogsitter_profiles` seedeados.
- **Pasos**: `/services/sitters` → filtros.
- **Val**: cards o empty state.
- **Fallos**: tabla vacía.
- **Sev**: 🟠.

#### F-SVC-05 — `/services/trainers` (Entrenadores) · P1 · 🟠 · Fase 3
- **Spec**: `flows/services/trainers.spec.ts`
- **Obj**: listado de trainers.
- **Pre**: `trainer_profiles` seedeados.
- **Pasos**: `/services/trainers`.
- **Val**: cards o empty state.
- **Fallos**: idem.
- **Sev**: 🟠.

#### F-SVC-06 — `/services/groomers` (Peluqueros) · P1 · 🟠 · Fase 3
- **Spec**: `flows/services/groomers.spec.ts`
- **Obj**: listado groomers funciona (post-fix del crash `ProviderProfileCard`).
- **Pre**: `groomer_profiles` seedeados.
- **Pasos**: `/services/groomers`.
- **Val**: cards o empty state; sin crash de gradient.
- **Fallos**: fue bug conocido — reintroducción del crash.
- **Sev**: 🟠.

#### F-SVC-07 — Abrir booking dialog · P1 · 🟠 · Fase 3
- **Spec**: `flows/services/booking-dialog.spec.ts`
- **Obj**: click "Reservar" abre `EnhancedBookingDialog`.
- **Pre**: provider con disponibilidad.
- **Pasos**: card → botón "Reservar".
- **Val**: dialog `role="dialog"` visible; calendario visible.
- **Fallos**: dialog no abre; calendario sin slots.
- **Sev**: 🟠.

#### F-SVC-08 — Confirmar reserva · P1 · 🟠 · Fase 3
- **Spec**: `flows/services/create-booking.spec.ts`
- **Obj**: user reserva slot.
- **Pre**: F-SVC-07.
- **Pasos**: elegir fecha+hora → confirmar.
- **Val**: row en `bookings`; toast success; aparece en `/mis-reservas`.
- **Fallos**: slot ocupado entre render y submit; RLS.
- **Sev**: 🟠.

#### F-SVC-09 — Listar `/mis-reservas` · P1 · 🟠 · Fase 3
- **Ruta**: `/mis-reservas`
- **Spec**: `flows/services/my-bookings.spec.ts`
- **Obj**: lista de reservas del user.
- **Pre**: sesión con bookings.
- **Pasos**: visitar `/mis-reservas`.
- **Val**: lista visible o empty state con CTA.
- **Fallos**: RLS; sin filtro por estado.
- **Sev**: 🟠.

#### F-SVC-10 — Cancelar reserva · P2 · 🟡 · Fase 3
- **Spec**: `flows/services/cancel-booking.spec.ts`
- **Obj**: user cancela reserva pendiente.
- **Pre**: booking pending.
- **Pasos**: abrir reserva → "Cancelar" → confirmar.
- **Val**: `status='cancelled'`; notificación al provider.
- **Fallos**: cancelación tardía bloqueada.
- **Sev**: 🟡.

---

## Módulo I · Maps (`F-MAP`)

#### F-MAP-01 — Mapa carga sin crash · P1 · 🟠 · Fase 2
- **Ruta**: `/maps`
- **Spec**: `flows/maps/load.spec.ts`
- **Obj**: `/maps` renderiza Leaflet container.
- **Pre**: sesión.
- **Pasos**: visitar `/maps` → esperar container.
- **Val**: `.leaflet-container` visible; sin `pageerror`. **Tolerar** que tiles externos no carguen.
- **Fallos**: Leaflet init; CSP bloquea tiles; viewport sin height.
- **Sev**: 🟠.

#### F-MAP-02 — Markers de servicios visibles · P2 · 🟡 · Fase 3
- **Spec**: `flows/maps/markers.spec.ts`
- **Obj**: markers de vets/servicios aparecen.
- **Pre**: data seedeada con coords.
- **Pasos**: esperar carga.
- **Val**: ≥1 marker `.leaflet-marker-icon`.
- **Fallos**: coords null; layers no se montan.
- **Sev**: 🟡.

#### F-MAP-03 — Click marker abre popup · P2 · 🟡 · Fase 3
- **Spec**: `flows/maps/marker-popup.spec.ts`
- **Obj**: click marker muestra popup con info.
- **Pre**: F-MAP-02.
- **Pasos**: click primer marker.
- **Val**: popup visible con texto.
- **Fallos**: popup no se posiciona.
- **Sev**: 🟡.

#### F-MAP-04 — Geolocation permission stub · P2 · 🟡 · Fase 3
- **Spec**: `flows/maps/geolocation.spec.ts`
- **Obj**: mapa usa geolocation para centrar.
- **Pre**: `context.grantPermissions(['geolocation'])` + coords Santiago.
- **Pasos**: `/maps`.
- **Val**: mapa se centra en Santiago; marker user visible.
- **Fallos**: permisos denegados; fallback no carga.
- **Sev**: 🟡.

---

## Módulo J · Comunidad & Social (`F-SOC`)

#### F-SOC-01 — Scroll feed · P1 · 🟠 · Fase 3
- **Ruta**: `/feed`
- **Spec**: `flows/community/feed-scroll.spec.ts`
- **Obj**: `/feed` muestra posts o empty state.
- **Pre**: sesión.
- **Pasos**: scroll down.
- **Val**: posts visibles o empty state; sin crash.
- **Fallos**: infinite scroll roto; imágenes 404.
- **Sev**: 🟠.

#### F-SOC-02 — Like post · P2 · 🟡 · Fase 3
- **Spec**: `flows/community/like-post.spec.ts`
- **Obj**: click like incrementa contador.
- **Pre**: post en feed.
- **Pasos**: click corazón.
- **Val**: contador incrementa; icon cambia estado; row `likes`.
- **Fallos**: optimistic sin rollback.
- **Sev**: 🟡.

#### F-SOC-03 — Comentar post · P2 · 🟡 · Fase 3
- **Spec**: `flows/community/comment-post.spec.ts`
- **Obj**: user agrega comentario.
- **Pre**: post en feed.
- **Pasos**: abrir post → textarea → enviar.
- **Val**: comentario aparece en lista.
- **Fallos**: form no clear tras submit.
- **Sev**: 🟡.

#### F-SOC-04 — Crear post · P1 · 🟠 · Fase 3
- **Spec**: `flows/community/create-post.spec.ts`
- **Obj**: user publica post.
- **Pre**: sesión.
- **Pasos**: botón "+" → textarea → imagen opcional → publicar.
- **Val**: post aparece en feed propio y en perfil; row en DB.
- **Fallos**: upload imagen; RLS; validación vacía.
- **Sev**: 🟠.

#### F-SOC-05 — Subir imagen a post · P2 · 🟡 · Fase 3
- **Spec**: `flows/community/upload-post-image.spec.ts`
- **Obj**: imagen se adjunta al post.
- **Pre**: F-SOC-04.
- **Pasos**: input file → preview → publicar.
- **Val**: preview visible; URL persistida; visible tras reload.
- **Fallos**: bucket; tamaño.
- **Sev**: 🟡.

#### F-SOC-06 — Eliminar post propio · P2 · 🟡 · Fase 3
- **Spec**: `flows/community/delete-post.spec.ts`
- **Obj**: autor elimina post.
- **Pre**: post creado por el user.
- **Pasos**: menú post → eliminar → confirmar.
- **Val**: desaparece del feed; row borrada.
- **Fallos**: RLS permite borrar ajenos.
- **Sev**: 🟡.

#### F-SOC-07 — Ver perfil de otro user · P2 · 🟡 · Fase 3
- **Ruta**: `/user/:userId`
- **Spec**: `flows/community/view-other-user.spec.ts`
- **Obj**: abre perfil público de otro user.
- **Pre**: otro user seedeado.
- **Pasos**: click avatar en feed.
- **Val**: username, stats, posts públicos visibles.
- **Fallos**: privacy leak.
- **Sev**: 🟡.

#### F-SOC-08 — Seguir / dejar de seguir user · P2 · 🟡 · Fase 3
- **Spec**: `flows/community/follow-user.spec.ts`
- **Obj**: toggle follow actualiza contador.
- **Pre**: F-SOC-07.
- **Pasos**: botón "Seguir" → toggle.
- **Val**: contador follows actualiza; row `follows`.
- **Fallos**: doble click crea duplicado.
- **Sev**: 🟡.

#### F-SOC-09 — Listar comunidades · P2 · 🟡 · Fase 3
- **Ruta**: `/comunidad`
- **Spec**: `flows/community/list-communities.spec.ts`
- **Obj**: grupos visibles.
- **Pre**: sesión + migración `community_groups`.
- **Pasos**: visitar `/comunidad`.
- **Val**: grupos visibles o empty state.
- **Fallos**: migración pendiente; RLS.
- **Sev**: 🟡.

#### F-SOC-10 — Unirse a comunidad · P2 · 🟡 · Fase 3
- **Spec**: `flows/community/join-community.spec.ts`
- **Obj**: user se une a un grupo.
- **Pre**: F-SOC-09.
- **Pasos**: click "Unirse".
- **Val**: membresía creada; estado del botón cambia.
- **Fallos**: RLS.
- **Sev**: 🟡.

#### F-SOC-11 — Post en comunidad específica · P2 · 🟡 · Fase 3
- **Ruta**: `/comunidad/:slug`
- **Spec**: `flows/community/post-in-community.spec.ts`
- **Obj**: post se crea en contexto de la comunidad.
- **Pre**: F-SOC-10.
- **Pasos**: entrar comunidad → crear post.
- **Val**: post con `community_id` correcto.
- **Fallos**: slug no se resuelve.
- **Sev**: 🟡.

#### F-SOC-12 — ActivityFeed widget en Home · P2 · 🟢 · Fase 3
- **Spec**: `flows/community/activity-feed-widget.spec.ts`
- **Obj**: preview de actividad reciente en `/home`.
- **Pre**: sesión con actividad.
- **Pasos**: `/home`.
- **Val**: widget con ≥1 item o empty.
- **Fallos**: widget crashea con shape inesperado.
- **Sev**: 🟢.

---

## Módulo K · Chat (`F-CHT`)

#### F-CHT-01 — Listar conversaciones · P1 · 🟠 · Fase 3
- **Ruta**: `/chat`
- **Spec**: `flows/chat/list.spec.ts`
- **Obj**: user ve lista de sus conversaciones.
- **Pre**: sesión.
- **Pasos**: visitar `/chat`.
- **Val**: lista o empty state; sin crash.
- **Fallos**: RLS; realtime subscription falla.
- **Sev**: 🟠.

#### F-CHT-02 — Abrir conversación · P1 · 🟠 · Fase 3
- **Ruta**: `/chat/:conversationId`
- **Spec**: `flows/chat/open-conversation.spec.ts`
- **Obj**: mensajes cargan e input visible.
- **Pre**: conversación con mensajes.
- **Pasos**: click primer chat.
- **Val**: mensajes visibles; textarea input visible.
- **Fallos**: orden mensajes; paginación histórica.
- **Sev**: 🟠.

#### F-CHT-03 — Enviar mensaje · P1 · 🟠 · Fase 3
- **Spec**: `flows/chat/send-message.spec.ts`
- **Obj**: user envía texto y lo ve inmediatamente.
- **Pre**: F-CHT-02.
- **Pasos**: escribir → Enter o botón.
- **Val**: mensaje aparece inmediatamente (optimistic); row en `messages`.
- **Fallos**: realtime no conecta; optimistic sin rollback.
- **Sev**: 🟠.

#### F-CHT-04 — Recibir mensaje realtime · P2 · 🟡 · Fase 5 · `@slow`
- **Spec**: `flows/chat/receive-realtime.spec.ts`
- **Obj**: con 2 pages abiertas, mensaje de A aparece en B sin reload.
- **Pre**: 2 users en conversación compartida.
- **Pasos**: A envía → B observa.
- **Val**: B ve mensaje en < 2s sin reload.
- **Fallos**: Supabase realtime subscription; WebSocket CSP.
- **Sev**: 🟡.

#### F-CHT-05 — Iniciar chat con vet/provider · P1 · 🟠 · Fase 3
- **Spec**: `flows/chat/start-with-provider.spec.ts`
- **Obj**: desde perfil provider, abrir chat crea conversación.
- **Pre**: F-VET-09.
- **Pasos**: perfil vet → botón "Mensaje".
- **Val**: crea conversación nueva; navega a `/chat/:id`.
- **Fallos**: duplicados si ya existe.
- **Sev**: 🟠.

#### F-CHT-06 — Empty state sin conversaciones · P2 · 🟢 · Fase 3
- **Spec**: `flows/chat/empty-state.spec.ts`
- **Obj**: user sin chats ve placeholder con CTA.
- **Pre**: `ownerNoPet` con 0 conversaciones.
- **Pasos**: `/chat`.
- **Val**: placeholder visible, no crash.
- **Fallos**: empty state mudo.
- **Sev**: 🟢.

---

## Módulo L · Perfil & Settings (`F-SET`)

#### F-SET-01 — Ver propio perfil · P1 · 🟠 · Fase 2
- **Ruta**: `/profile`
- **Spec**: `flows/profile-settings/view-profile.spec.ts`
- **Obj**: profile muestra avatar, displayName, tabs.
- **Pre**: sesión.
- **Pasos**: visitar `/profile`.
- **Val**: avatar, displayName, stats, tabs (posts, mascotas, reseñas, gamification) visibles.
- **Fallos**: `loadProfileData` lento.
- **Sev**: 🟠.

#### F-SET-02 — Editar display name y bio · P1 · 🟠 · Fase 3
- **Ruta**: `/settings`
- **Spec**: `flows/profile-settings/edit-profile.spec.ts`
- **Obj**: cambios persisten.
- **Pre**: sesión.
- **Pasos**: editar campos → guardar.
- **Val**: toast success; persiste tras reload; row `profiles` actualizada.
- **Fallos**: validación mínima; trimming.
- **Sev**: 🟠.

#### F-SET-03 — Cambiar avatar (Dicebear) · P2 · 🟡 · Fase 3
- **Spec**: `flows/profile-settings/change-avatar.spec.ts`
- **Obj**: elegir color + seed genera avatar.
- **Pre**: F-SET-02.
- **Pasos**: selector color → selector seed → guardar.
- **Val**: `avatar_url` actualizado en `profiles`; avatar visible en header.
- **Fallos**: URL dicebear inválida.
- **Sev**: 🟡.

#### F-SET-04 — Toggle notificaciones (3 switches) · P2 · 🟡 · Fase 3
- **Spec**: `flows/profile-settings/toggles.spec.ts`
- **Obj**: toggles `healthReminders`, `messages`, `socialActivity` persisten.
- **Pre**: sesión.
- **Pasos**: toggle los 3 → guardar → reload.
- **Val**: estado persiste; escrito en DB/profile prefs.
- **Fallos**: no persisten; bind roto.
- **Sev**: 🟡.

#### F-SET-05 — Switch de rol dueño ↔ vet · P1 · 🟠 · Fase 3
- **Spec**: `flows/profile-settings/role-switch.spec.ts`
- **Obj**: user con ambos roles cambia contexto activo.
- **Pre**: user con `is_owner=true` y `is_vet=true`.
- **Pasos**: menu role switch → seleccionar vet → redirect a `/provider/dashboard`.
- **Val**: `ActiveRoleProvider` actualiza; sidebar cambia.
- **Fallos**: UI no refleja cambio inmediato.
- **Sev**: 🟠.

#### F-SET-06 — Conectar Google Calendar · P3 · 🟡 · Fase 5 · `@external`
- **Spec**: `flows/profile-settings/google-calendar-connect.spec.ts` → `test.fixme`
- **Obj**: OAuth flow → integración activa.
- **Pre**: edge `google-calendar-oauth-init`.
- **Pasos**: botón conectar → consent → vuelve.
- **Val**: token guardado; UI muestra "conectado".
- **Fallos**: Google bloquea automation.
- **Sev**: 🟡.

#### F-SET-07 — Desconectar Google Calendar · P3 · 🟡 · Fase 5 · `@external`
- **Spec**: `flows/profile-settings/google-calendar-disconnect.spec.ts` → `test.fixme`
- **Obj**: revocar integración.
- **Pre**: F-SET-06.
- **Pasos**: botón desconectar.
- **Val**: token borrado; sync deshabilitado.
- **Fallos**: revocación parcial.
- **Sev**: 🟡.

#### F-SET-08 — Ver plan actual · P2 · 🟡 · Fase 3
- **Spec**: `flows/profile-settings/view-plan.spec.ts`
- **Obj**: settings muestra plan vigente con CTA upgrade si Gratis.
- **Pre**: sesión.
- **Pasos**: `/settings` → sección plan.
- **Val**: nombre plan; CTA "Upgrade" si Gratis.
- **Fallos**: hook `usePlan` falla.
- **Sev**: 🟡.

#### F-SET-09 — Terminar sesión desde Settings · P0 · 🔴 · Fase 2
- **Ref**: ver F-AUTH-08.

#### F-SET-10 — Eliminar cuenta · P2 · 🟠 · Fase 3
- **Spec**: `flows/profile-settings/delete-account.spec.ts`
- **Obj**: user borra su cuenta con confirmación doble.
- **Pre**: sesión.
- **Pasos**: `/settings` → "Eliminar cuenta" → confirmar doble.
- **Val**: `auth.users` row borrada; cascade de rows relacionadas; user pushed out.
- **Fallos**: copy insuficiente; no idempotente; deja datos huérfanos.
- **Sev**: 🟠 GDPR/Ley 19.628.

#### F-SET-11 — Exportar datos · P3 · 🟢 · Fase 5
- **Spec**: `flows/profile-settings/export-data.spec.ts` → `test.skip` si no implementado
- **Obj**: descargar JSON con data propia.
- **Pre**: sesión.
- **Pasos**: botón "Exportar".
- **Val**: download con JSON.
- **Fallos**: feature pendiente.
- **Sev**: 🟢.

---

## Módulo M · Provider B2B (`F-PRO`)

#### F-PRO-01 — Landing `/para-veterinarios` · P1 · 🟠 · Fase 1 (smoke ya)
- **Ruta**: `/para-veterinarios`
- **Spec**: `smoke/public-routes.spec.ts` (existente)
- **Obj**: landing B2B carga y CTA funciona.
- **Pre**: —
- **Pasos**: visitar página.
- **Val**: CTA "Registrarme" visible; link a `/registro-veterinario`.
- **Fallos**: hero image 404.
- **Sev**: 🟠.

#### F-PRO-02 — Registro vet (`/registro-veterinario`) · P1 · 🟠 · Fase 3
- **Spec**: `flows/provider/vet-signup.spec.ts`
- **Obj**: wizard de registro vet crea cuenta.
- **Pre**: email único.
- **Pasos**: llenar datos profesionales + clínica + comuna → submit.
- **Val**: cuenta creada con `is_vet=true`; redirect a onboarding.
- **Fallos**: validación RUT/MINSAL; duplicados.
- **Sev**: 🟠.

#### F-PRO-03 — Dashboard provider · P1 · 🟠 · Fase 3
- **Ruta**: `/provider/dashboard`
- **Spec**: `flows/provider/dashboard.spec.ts`
- **Obj**: dashboard muestra métricas y agenda.
- **Pre**: vet seedeado.
- **Pasos**: login como vet → `/provider/dashboard`.
- **Val**: métricas (bookings, clientes, reseñas); próximos turnos; sin crash.
- **Fallos**: queries lentas; shape inesperado.
- **Sev**: 🟠.

#### F-PRO-04 — Editar perfil público vet · P1 · 🟠 · Fase 3
- **Ruta**: `/provider/profile-edit`
- **Spec**: `flows/provider/edit-public-profile.spec.ts`
- **Obj**: cambios en perfil público son visibles en `/veterinarios/:slug`.
- **Pre**: F-PRO-03.
- **Pasos**: editar nombre, foto, bio, especialidades, comuna → guardar.
- **Val**: cambios visibles en perfil público; SEO tags actualizados.
- **Fallos**: slug no se regenera; cache.
- **Sev**: 🟠.

#### F-PRO-05 — Gestionar horarios (ProviderAvailabilityManager) · P1 · 🟠 · Fase 3
- **Spec**: `flows/provider/availability.spec.ts`
- **Obj**: vet configura horarios y afecta `isOpenNow`.
- **Pre**: F-PRO-03.
- **Pasos**: abrir manager → editar horarios → guardar.
- **Val**: horarios persisten; `isOpenNow` refleja cambio en público.
- **Fallos**: timezone.
- **Sev**: 🟠.

#### F-PRO-06 — Configurar precios · P1 · 🟡 · Fase 3
- **Spec**: `flows/provider/prices.spec.ts`
- **Obj**: vet configura precios por servicio.
- **Pre**: F-PRO-03.
- **Pasos**: sección precios → editar → guardar.
- **Val**: precios visibles en perfil público; formato CLP.
- **Fallos**: precio en 0 tratado como null.
- **Sev**: 🟡.

#### F-PRO-07 — Editar perfil groomer · P2 · 🟡 · Fase 3
- **Ruta**: `/peluquero/perfil`
- **Spec**: `flows/provider/groomer-edit.spec.ts`
- **Obj**: groomer edita su perfil.
- **Pre**: user con `groomer_profiles` row.
- **Pasos**: visitar → editar → guardar.
- **Val**: perfil guarda; visible en `/services/groomers`.
- **Fallos**: tabla separada no sincroniza.
- **Sev**: 🟡.

#### F-PRO-08 — ProDashboard (`/panel-pro`) · P2 · 🟡 · Fase 3
- **Ruta**: `/panel-pro`
- **Spec**: `flows/provider/pro-dashboard.spec.ts`
- **Obj**: dashboard profesional avanzado carga.
- **Pre**: plan Clínica.
- **Pasos**: visitar `/panel-pro`.
- **Val**: secciones avanzadas visibles.
- **Fallos**: plan gate.
- **Sev**: 🟡.

#### F-PRO-09 — Ver mis clientes · P2 · 🟡 · Fase 3
- **Spec**: `flows/provider/my-clients.spec.ts`
- **Obj**: vet ve lista de clientes atendidos.
- **Pre**: vet con bookings.
- **Pasos**: dashboard → sección clientes.
- **Val**: lista con búsqueda.
- **Fallos**: privacy leak.
- **Sev**: 🟡.

#### F-PRO-10 — Crear promoción de servicio · P2 · 🟡 · Fase 3
- **Spec**: `flows/provider/create-promotion.spec.ts`
- **Obj**: vet crea promoción (`CreateServicePromotion`).
- **Pre**: F-PRO-03.
- **Pasos**: botón "Nueva promoción" → llenar → publicar.
- **Val**: promoción creada; visible en listado; moderación vía edge `moderate-service-promotion`.
- **Fallos**: moderación lenta; promoción inmediata sin gate.
- **Sev**: 🟡.

---

## Módulo N · Reseñas (`F-REV`)

#### F-REV-01 — Dejar reseña vía token público · P1 · 🟠 · Fase 3
- **Ruta**: `/resena/:token`
- **Perfil**: `publicVisitor` · **Spec**: `flows/reviews/leave-public.spec.ts`
- **Obj**: cliente recibe link y deja reseña sin login.
- **Pre**: token válido.
- **Pasos**: visitar URL → estrellas + comentario → enviar.
- **Val**: reseña creada; rating del provider incrementa.
- **Fallos**: token consumido; expirado; rate limit.
- **Sev**: 🟠 feedback loop B2B.

#### F-REV-02 — Ver reseñas pendientes (user) · P2 · 🟡 · Fase 3
- **Spec**: `flows/reviews/pending-list.spec.ts`
- **Obj**: user ve `PendingReviewsList` con servicios por reseñar.
- **Pre**: user con bookings completadas sin reseña.
- **Pasos**: `/profile` → tab reseñas pendientes.
- **Val**: lista visible con CTA.
- **Fallos**: filtro incorrecto.
- **Sev**: 🟡.

#### F-REV-03 — Historial de reseñas propias · P2 · 🟢 · Fase 3
- **Spec**: `flows/reviews/history.spec.ts`
- **Obj**: user ve `UserReviewHistory`.
- **Pre**: reseñas publicadas.
- **Pasos**: `/profile` → tab historial.
- **Val**: lista histórica visible.
- **Fallos**: orden por fecha.
- **Sev**: 🟢.

#### F-REV-04 — Provider responde reseña · P2 · 🟡 · Fase 3
- **Spec**: `flows/reviews/provider-reply.spec.ts`
- **Obj**: vet responde a una reseña recibida.
- **Pre**: reseña sobre provider.
- **Pasos**: dashboard → reseña → "Responder" → texto → enviar.
- **Val**: respuesta visible bajo reseña en perfil público.
- **Fallos**: RLS no permite update parcial.
- **Sev**: 🟡.

---

## Módulo O · Adopción & En Memoria (`F-ADO`)

#### F-ADO-01 — Listar adopciones · P2 · 🟡 · Fase 3
- **Ruta**: `/adoption`
- **Spec**: `flows/adoption/list.spec.ts`
- **Obj**: listado de mascotas en adopción.
- **Pre**: sesión.
- **Pasos**: visitar `/adoption`.
- **Val**: cards o empty state; filtros presentes.
- **Fallos**: tabla vacía; RLS.
- **Sev**: 🟡.

#### F-ADO-02 — Ver detalle adopción · P2 · 🟡 · Fase 3
- **Spec**: `flows/adoption/view-detail.spec.ts`
- **Obj**: click card abre detalle.
- **Pre**: F-ADO-01.
- **Pasos**: click card.
- **Val**: info completa; botón "Contactar".
- **Fallos**: imágenes 404.
- **Sev**: 🟡.

#### F-ADO-03 — Contactar dueño/refugio · P2 · 🟡 · Fase 3
- **Spec**: `flows/adoption/contact.spec.ts`
- **Obj**: botón "Contactar" abre chat o WhatsApp.
- **Pre**: F-ADO-02.
- **Pasos**: click "Contactar".
- **Val**: navega a `/chat/new?recipient=...` o `wa.me`.
- **Fallos**: ambas rutas rotas.
- **Sev**: 🟡.

#### F-ADO-04 — Sección `/en-memoria` · P2 · 🟢 · Fase 3 · `@ux`
- **Ruta**: `/en-memoria`
- **Spec**: `flows/adoption/en-memoria.spec.ts`
- **Obj**: lista de mascotas "en memoria" con copy sensible.
- **Pre**: F-PET-14 ejecutado.
- **Pasos**: visitar `/en-memoria`.
- **Val**: lista visible; copy amable; sin CTA comercial.
- **Fallos**: copy insensible.
- **Sev**: 🟢.

---

## Módulo P · Gamificación (`F-GAM`)

#### F-GAM-01 — PointsWidget visible en Home/Profile · P2 · 🟡 · Fase 3
- **Spec**: `flows/gamification/points-widget.spec.ts`
- **Obj**: widget muestra puntos del user.
- **Pre**: sesión; `gamification_points` seedeado.
- **Pasos**: `/home` o `/profile`.
- **Val**: número de puntos visible; consistente entre rutas.
- **Fallos**: hook `useGamification` lento.
- **Sev**: 🟡.

#### F-GAM-02 — AchievementBadges · P2 · 🟡 · Fase 3
- **Spec**: `flows/gamification/achievements.spec.ts`
- **Obj**: achievements desbloqueados visibles.
- **Pre**: achievements seedeados.
- **Pasos**: `/profile` → sección logros.
- **Val**: badges visibles con tooltips.
- **Fallos**: achievement sin imagen.
- **Sev**: 🟡.

#### F-GAM-03 — MissionCard con progreso · P2 · 🟡 · Fase 3
- **Spec**: `flows/gamification/missions.spec.ts`
- **Obj**: misiones con barra de progreso.
- **Pre**: misiones activas.
- **Pasos**: `/profile` → sección misiones.
- **Val**: progress bar correcto.
- **Fallos**: cálculo progreso.
- **Sev**: 🟡.

#### F-GAM-04 — Paw Game mini-juego carga · P2 · 🟢 · Fase 3
- **Ruta**: `/paw-game`
- **Spec**: `flows/gamification/paw-game-load.spec.ts`
- **Obj**: juego renderiza sin crash.
- **Pre**: sesión.
- **Pasos**: visitar `/paw-game`.
- **Val**: canvas/DOM visible; sin `pageerror`.
- **Fallos**: animaciones; performance.
- **Sev**: 🟢.

#### F-GAM-05 — Completar misión → puntos suben · P2 · 🟡 · Fase 5
- **Spec**: `flows/gamification/mission-complete.spec.ts`
- **Obj**: puntos incrementan tras completar misión.
- **Pre**: misión "crear reminder" activa.
- **Pasos**: ejecutar F-REM-01 → observar puntos.
- **Val**: puntos incrementan.
- **Fallos**: trigger no dispara.
- **Sev**: 🟡.

---

## Módulo Q · QR y Compartir Público (`F-SHR`)

#### F-SHR-01 — Landing QR (`/qr/:token`) · P1 · 🟠 · Fase 3
- **Ruta**: `/qr/:token`
- **Perfil**: `publicVisitor` · **Spec**: `flows/public-share/qr-landing.spec.ts`
- **Obj**: escanear QR de la mascota lleva a landing con info de contacto.
- **Pre**: token válido.
- **Pasos**: visitar URL.
- **Val**: datos mínimos de mascota; botón llamar dueño; no requiere login.
- **Fallos**: token inválido; RLS lectura.
- **Sev**: 🟠 core de "perdido/encontrado".

#### F-SHR-02 — Landing QR token inválido · P2 · 🟡 · Fase 3
- **Spec**: `flows/public-share/qr-invalid.spec.ts`
- **Obj**: token inválido muestra mensaje amable.
- **Pre**: token random.
- **Pasos**: visitar `/qr/token-inexistente`.
- **Val**: mensaje "QR no válido" + link a home.
- **Fallos**: pantalla blanca.
- **Sev**: 🟡.

#### F-SHR-03 — Medical share público · Ref: F-MED-08

#### F-SHR-04 — SEO tags en landing pública · P1 · 🟡 · Fase 3
- **Spec**: `flows/public-share/seo-tags.spec.ts`
- **Obj**: meta tags OG/Twitter presentes en rutas públicas.
- **Pre**: —
- **Pasos**: visitar `/veterinarios/:slug`, `/qr/:token`, `/medical-share/:token`.
- **Val**: `<meta property="og:*">`, `<meta name="twitter:*">` presentes.
- **Fallos**: `react-helmet-async` no inyecta.
- **Sev**: 🟡.

---

## Módulo R · Admin (`F-ADM`)

#### F-ADM-01 — Admin ruta bloquea no-admin · Ref: F-AUTH-10

#### F-ADM-02 — Admin panel carga para admin · P2 · 🟡 · Fase 3 · `@auth`
- **Ruta**: `/admin`
- **Spec**: `flows/admin/panel-load.spec.ts`
- **Obj**: panel admin renderiza con tabs.
- **Pre**: user con rol admin seedeado.
- **Pasos**: login admin → `/admin`.
- **Val**: panel con tabs: moderación, users, promos.
- **Fallos**: no hay user admin seedeado.
- **Sev**: 🟡.

#### F-ADM-03 — Moderar promoción · P3 · 🟢 · Fase 5
- **Spec**: `flows/admin/moderate-promotion.spec.ts`
- **Obj**: admin aprueba/rechaza promoción pendiente.
- **Pre**: promoción pending.
- **Pasos**: `/admin` → promos → aprobar/rechazar.
- **Val**: estado cambia; edge `moderate-service-promotion`.
- **Fallos**: moderación sin efecto.
- **Sev**: 🟢.

---

## Módulo S · Reportes & Analytics (`F-REP`)

#### F-REP-01 — `/reportes` carga · P2 · 🟡 · Fase 3
- **Ruta**: `/reportes`
- **Spec**: `flows/reports/reportes-load.spec.ts`
- **Obj**: dashboard con Recharts carga sin crash.
- **Pre**: sesión.
- **Pasos**: visitar `/reportes`.
- **Val**: charts visibles; sin `pageerror`.
- **Fallos**: Recharts sin data.
- **Sev**: 🟡.

#### F-REP-02 — `/analytics-demo` standalone · P2 · 🟢 · Fase 3
- **Ruta**: `/analytics-demo`
- **Spec**: `flows/reports/analytics-demo.spec.ts`
- **Obj**: `AnalyticsDashboard` renderiza.
- **Pre**: sesión.
- **Pasos**: visitar.
- **Val**: charts demo; sin crash.
- **Fallos**: sólo en prod build.
- **Sev**: 🟢.

#### F-REP-03 — WeeklyReportCard en Home · P2 · 🟢 · Fase 3
- **Spec**: `flows/reports/weekly-card.spec.ts`
- **Obj**: card con métricas de la semana en `/home`.
- **Pre**: sesión con mascotas.
- **Pasos**: `/home`.
- **Val**: `WeeklyReportCard` visible con data.
- **Fallos**: data missing.
- **Sev**: 🟢.

---

## Módulo T · Upgrade & Pagos Flow.cl (`F-PAY`)

#### F-PAY-01 — Página `/upgrade` muestra planes · P1 · 🟠 · Fase 3
- **Ruta**: `/upgrade`
- **Spec**: `flows/payments/upgrade-page.spec.ts`
- **Obj**: planes Gratis/Premium visibles con CTA.
- **Pre**: sesión.
- **Pasos**: visitar `/upgrade`.
- **Val**: plan actual destacado; precios `$3.990`, `$39.900`; botones "Suscribirse".
- **Fallos**: precios hardcoded desalineados con `plans.ts`.
- **Sev**: 🟠.

#### F-PAY-02 — Click "Suscribirse Premium" inicia Flow · P1 · 🟠 · Fase 3 · `@external`
- **Spec**: `flows/payments/flow-initiate.spec.ts`
- **Obj**: abre Flow.cl en nueva tab.
- **Pre**: edge `flow-create-subscription` viva + credenciales Flow.
- **Pasos**: click "Suscribirse" → esperar popup.
- **Val**: `page.waitForEvent('popup')` con URL `flow.cl`.
- **Fallos**: edge devuelve 500; credenciales mal; popup bloqueado.
- **Sev**: 🟠. NO completar pago real en E2E.

#### F-PAY-03 — `/upgrade/success` post-pago · P1 · 🟠 · Fase 3
- **Ruta**: `/upgrade/success`
- **Spec**: `flows/payments/upgrade-success.spec.ts`
- **Obj**: simular regreso de Flow con success.
- **Pre**: navegar directo con params O mock callback.
- **Pasos**: visitar `/upgrade/success?flow_token=fake`.
- **Val**: UI success; plan actualizado en DB (via mock); mensaje celebratorio.
- **Fallos**: webhook `flow-webhook` no procesa; UI no refleja cambio.
- **Sev**: 🟠.

#### F-PAY-04 — `/upgrade/cancel` post-pago · P1 · 🟡 · Fase 3
- **Ruta**: `/upgrade/cancel`
- **Spec**: `flows/payments/upgrade-cancel.spec.ts`
- **Obj**: mensaje de cancelación con CTA reintentar.
- **Pre**: —
- **Pasos**: visitar `/upgrade/cancel`.
- **Val**: mensaje amable + botón "Reintentar".
- **Fallos**: copy agresivo.
- **Sev**: 🟡.

#### F-PAY-05 — `/payment-result?status=...` · P1 · 🟠 · Fase 3
- **Ruta**: `/payment-result?status=success|failed`
- **Spec**: `flows/payments/payment-result.spec.ts`
- **Obj**: ruta unificada renderiza según query param.
- **Pre**: sesión.
- **Pasos**: visitar con `status=success` y `status=failed`.
- **Val**: UI diferente según estado; sin crash.
- **Fallos**: sin fallback si query param ausente.
- **Sev**: 🟠.

---

## Módulo U · Legal & Público (`F-LEG`)

#### F-LEG-01 — `/terms` carga · P1 · 🟢 · Fase 1 (ya cubierto)
- **Spec**: `smoke/public-routes.spec.ts`
- **Obj**: términos de servicio cargan.
- **Val**: body con texto legal.
- **Sev**: 🟢.

#### F-LEG-02 — `/privacy` carga · P1 · 🟢 · Fase 1 (ya cubierto)
- **Spec**: `smoke/public-routes.spec.ts`
- **Obj**: política de privacidad carga.
- **Val**: body con texto.
- **Sev**: 🟢.

#### F-LEG-03 — Footer links → legales · P2 · 🟢 · Fase 1 (ya cubierto)
- **Spec**: `smoke/navigation.spec.ts`
- **Obj**: links del footer llevan a `/terms` y `/privacy`.
- **Val**: navegación correcta.
- **Sev**: 🟢.

#### F-LEG-04 — Landing `/` CTAs · P1 · 🟠 · Fase 1 (ya cubierto)
- **Ruta**: `/`
- **Spec**: `smoke/navigation.spec.ts`
- **Obj**: hero CTAs funcionan.
- **Pre**: —
- **Pasos**: visitar `/` → click "Crear cuenta" o "Ya tengo cuenta".
- **Val**: "Crear cuenta" → `/auth`; "Ir al inicio" si ya logueado → `/home`.
- **Fallos**: CTA cambia de copy sin actualizar selector.
- **Sev**: 🟠.

---

## Módulo V · Empty States, Error y Offline (`F-ERR`)

#### F-ERR-01 — Empty state `/my-pets` · P1 · 🟠 · Fase 3 · `@ux`
- **Ruta**: `/my-pets`
- **Perfil**: `ownerNoPet` · **Spec**: `flows/error-states/my-pets-empty.spec.ts`
- **Obj**: user sin mascotas ve CTA útil.
- **Pre**: user sin pets.
- **Pasos**: `/my-pets`.
- **Val**: CTA "Crear primera mascota" visible; copy amable.
- **Fallos**: empty state mudo.
- **Sev**: 🟠.

#### F-ERR-02 — Empty state `/home` sin mascotas · P1 · 🟠 · Fase 3
- **Perfil**: `ownerNoPet` · **Spec**: `flows/error-states/home-empty.spec.ts`
- **Obj**: home muestra hints útiles sin data.
- **Pre**: user sin mascotas.
- **Pasos**: `/home`.
- **Val**: hints visibles; no crash; no `undefined is not a function`.
- **Fallos**: widgets asumen data.
- **Sev**: 🟠.

#### F-ERR-03 — Empty state `/feed` · P2 · 🟡 · Fase 3
- **Spec**: `flows/error-states/feed-empty.spec.ts`
- **Obj**: feed sin posts muestra estado amable.
- **Pre**: user sin follows.
- **Pasos**: `/feed`.
- **Val**: estado vacío con CTA "seguir a alguien".
- **Fallos**: infinite spinner.
- **Sev**: 🟡.

#### F-ERR-04 — Empty state `/chat` · P2 · 🟡 · Fase 3
- **Ref**: F-CHT-06.

#### F-ERR-05 — Empty state `/mis-reservas` · P2 · 🟡 · Fase 3
- **Spec**: `flows/error-states/bookings-empty.spec.ts`
- **Obj**: sin reservas muestra CTA "Reservar servicio".
- **Pre**: user sin bookings.
- **Pasos**: `/mis-reservas`.
- **Val**: empty state con CTA a `/servicios`.
- **Fallos**: CTA rota.
- **Sev**: 🟡.

#### F-ERR-06 — Sin errores JS en rutas críticas · P0 · 🔴 · Fase 1
- **Spec**: fixture global `consoleWatcher` (ver §12.2)
- **Obj**: en los specs de todo el módulo, no hay `pageerror`.
- **Pre**: —
- **Pasos**: auto en cada test.
- **Val**: `pageerror` count = 0 al terminar cada test.
- **Fallos**: error JS silencioso.
- **Sev**: 🔴.

#### F-ERR-07 — Rendering con Supabase caído (fallback) · P2 · 🟡 · Fase 5
- **Spec**: `flows/error-states/supabase-down.spec.ts`
- **Obj**: UI muestra error amable si Supabase responde 500.
- **Pre**: `context.route('**/rest/v1/**', r => r.fulfill({ status: 500 }))`.
- **Pasos**: visitar `/home` con mock.
- **Val**: error amable visible; no pantalla blanca; botón "Reintentar".
- **Fallos**: pantalla blanca.
- **Sev**: 🟡.

#### F-ERR-08 — Offline mode · P2 · 🟡 · Fase 5
- **Spec**: `flows/error-states/offline.spec.ts`
- **Obj**: app muestra banner offline y bloquea acciones.
- **Pre**: `context.setOffline(true)`.
- **Pasos**: intentar acción.
- **Val**: banner offline; acciones bloqueadas con mensaje.
- **Fallos**: acciones proceden y fallan feo.
- **Sev**: 🟡.

---

### 6.5. Matriz resumen por prioridad

| Prioridad | Cantidad | % | Fase objetivo |
|---|---|---|---|
| P0 (🔴 crítico) | 23 | 17% | Fase 1-2 |
| P1 (🟠 alto) | 58 | 42% | Fase 2-3 |
| P2 (🟡 medio) | 44 | 32% | Fase 3-4 |
| P3 (🟢 externo/futuro) | 12 | 9% | Fase 5 |
| **Total** | **137** | **100%** | — |

### 6.6. Cobertura objetivo por fase

| Fase | Acumulado flujos | Detalle |
|---|---|---|
| **Fase 1** — Setup | **15** | Smoke actual (F-AUTH-09, F-NAV-05/09, F-LEG-01-04, F-PET-04-07, F-VET-05/06 parcial, F-ERR-06) |
| **Fase 2** — P0 end-to-end | **37** | + F-AUTH-01/02/06/07/08/10, F-ONB-01, F-NAV-01/02, F-PET-01/02, F-MED-01/05/07/08, F-REM-01/02, F-VET-01/02/03/09/11, F-MAP-01, F-SET-01/09 |
| **Fase 3** — P1 expansión | **≈115** | + todos los P1 restantes y casi todos los P2 |
| **Fase 4** — Robustez CI | **115** | Sin specs nuevos — consolidar flaky, CI, reportería, UX findings |
| **Fase 5** — Heurísticas | **137** | + externos (F-AUTH-03/04/11, F-SET-06/07, F-NAV-07/08, F-CHT-04, F-GAM-05, F-ADM-03, F-ERR-07/08) + visual snapshots + MCP |

---

## 7. Estrategia para descubrir y probar botones / acciones

### 7.1. Jerarquía de locators

1. **`getByRole('button', { name: /regex/i })`** — primera opción. Radix/shadcn exponen roles correctos.
2. **`getByLabel(/regex/i)`** — inputs, selects, textareas.
3. **`getByText(/regex/i)`** — elementos no-form.
4. **`getByTestId('foo')`** — último recurso; registrar en `docs/testids-registry.md`.
5. ❌ **Nunca** `page.locator('div.some-class > button:nth-child(2)')`.

### 7.2. Validación "click no es éxito"

Al presionar cualquier acción, escoger **al menos un** outcome:

| Outcome | Cómo |
|---|---|
| URL cambió | `await expect(page).toHaveURL(regex)` |
| Modal/drawer abierto | `await expect(page.getByRole('dialog')).toBeVisible()` |
| Toast apareció | helper `readToast()` con regex + tono |
| DOM cambió | `await expect(locator).toBeVisible()` |
| Estado cambió | `toHaveAttribute`, `toHaveClass`, `toBeChecked`, `toBeDisabled` |
| Row en Supabase | query admin con service role (Nivel 2) |
| Archivo descargado | `page.waitForEvent('download')` + nombre/size |
| Request sucedió | `page.waitForRequest(url)` |

### 7.3. Catálogo de elementos interactivos

- [ ] Botones primarios (`getByRole('button')`)
- [ ] Links (`getByRole('link')`)
- [ ] Tabs (`getByRole('tab')`)
- [ ] Accordions (`getByRole('button')` + `aria-expanded`)
- [ ] Dropdowns / Select (`getByRole('combobox')` + `getByRole('option')`)
- [ ] Modals/Dialogs (`getByRole('dialog')`)
- [ ] Drawers/Sheets (Vaul — `[data-vaul-drawer]`)
- [ ] Popovers (`getByRole('dialog')` o `[data-state="open"]`)
- [ ] Tooltips (trigger + `role='tooltip'`)
- [ ] Cards clickeables (deben tener `role='button'` o link interno)
- [ ] Icon buttons (deben tener `aria-label` — si no, **bug a11y a reportar**)
- [ ] Menús contextuales (Radix `ContextMenu`)
- [ ] BottomTabBar mobile
- [ ] Sidebar desktop

### 7.4. Antipatrón y patrón correcto

❌ Antipatrón: `await page.click('button'); expect(true).toBe(true);`

✅ Patrón:
```ts
await user.clickCTA(/agregar mascota/i);
// No retorna hasta que:
//   a) URL cambió → OK
//   b) Toast apareció → OK (lee tipo)
//   c) Modal abrió → OK
//   d) Timeout 5s sin nada → FAIL "Click silencioso"
```

---

## 8. Formularios y validaciones

### 8.1. Matriz de validaciones por formulario

| Caso | Qué valida |
|---|---|
| **Happy path** | Campos válidos → submit → outcome esperado |
| **Requeridos vacíos** | Botón disabled O toast error |
| **Formato inválido** | Toast error + form no envía |
| **Rango inválido** | Toast error (`weight: -1`, `birth_date: 2099`) |
| **Botón disabled silencioso** | Debe tener feedback visual/tooltip |
| **Submit durante loading** | Segundo click no crea duplicado |
| **Cancelar mid-flow** | Datos no se pierden accidentalmente |
| **Persistencia** | Recargar muestra datos guardados |

### 8.2. Leer toasts (sonner + Radix)

```ts
// e2e/utils/selectors.ts
export const TOAST = {
  any: "[data-sonner-toast], li[role='status']",
  error: "[data-sonner-toast][data-type='error'], li[role='status'][data-type='error']",
  success: "[data-sonner-toast][data-type='success'], li[role='status'][data-type='success']",
};

export async function assertToast(page: Page, text: RegExp, type?: 'success' | 'error') {
  const selector = type ? TOAST[type] : TOAST.any;
  await expect(page.locator(selector).filter({ hasText: text })).toBeVisible({ timeout: 5_000 });
}
```

### 8.3. Crear mascota — cobertura ampliada

Ver flujos F-PET-01 a F-PET-13. Este flujo ya tuvo fricción real (commit `490b29b`), merece matrix exhaustiva: minimal, full, species-matrix, personality, plan-limit, upload-photo, vaccination-card-ocr, validaciones (nombre, peso, fecha, microchip).

---

## 9. Uploads, downloads y archivos

### 9.1. Fixtures files

| Archivo | Propósito |
|---|---|
| `pet-photo-small.jpg` | 200 KB, 800×800, válido |
| `pet-photo-large.jpg` | 8 MB, 4000×4000, límite |
| `pet-photo-tiny.jpg` | 20 KB, 100×100 |
| `vaccination-card.jpg` | OCR |
| `invalid.txt` | Formato no permitido |
| `oversized.pdf` | 15 MB, rechazo |

### 9.2. Patrón upload

```ts
const fileInput = page.locator('input[type="file"]');
await fileInput.setInputFiles('e2e/fixtures/files/pet-photo-small.jpg');
await expect(page.locator('img[alt*="preview"], [data-testid="pet-photo-preview"]')).toBeVisible();
```

### 9.3. Qué validar en uploads

- [ ] Preview renderiza post-selección
- [ ] Tamaño/tipo inválido → toast específico
- [ ] > límite → toast claro (no "Internal error")
- [ ] URL post-submit no es placeholder (`!/placeholder|default/`)
- [ ] Reeditar muestra foto precargada
- [ ] Reemplazar → persiste
- [ ] Eliminar → vuelve a estado sin foto

### 9.4. Patrón download (PDF ficha médica)

```ts
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 30_000 }),
  page.getByRole('button', { name: /descargar (pdf|ficha)/i }).click(),
]);
expect(download.suggestedFilename()).toMatch(/\.pdf$/);
const size = fs.statSync(await download.path()).size;
expect(size).toBeGreaterThan(10_000);
```

### 9.5. Qué NO hacer

- ❌ No subir archivos reales a Storage en CI sin limpiar. Bucket dedicado `e2e-temp` + TTL.
- ❌ No validar bytes del PDF. Solo filename + size > 0.
- ❌ No testear imágenes de terceros (Gravatar, etc.).

---

## 10. Auth, sesión y datos de prueba

### 10.1. Cuentas de testing

| Email | Rol | Perfiles |
|---|---|---|
| `playwright+owner@demo.pawfriend.cl` | Dueño con 1 mascota | `returningOwner`, `editorOwner` |
| `playwright+poweruser@demo.pawfriend.cl` | 3 mascotas | `powerOwner` |
| `playwright+empty@demo.pawfriend.cl` | Sin mascotas | `ownerNoPet` |
| `playwright+vet@demo.pawfriend.cl` | Vet verificado | `existingVet` |
| `playwright+newuser@demo.pawfriend.cl` | Se recrea en cada run | `newOwner`, `newVet` |

Todas con password `Demo1234!`, flag `profiles.is_demo = true`.

### 10.2. Datos realistas (`fixtures/test-data.ts`)

```ts
export const PET_PAYLOADS = {
  mimi: {
    name: 'Mimi',
    species: 'Gato',
    breed: 'Siamés',
    birth_date: '2022-03-15',
    weight: '4.2',
    microchip_number: '981000123456789',
    personality: ['Juguetón', 'Curioso'],
  },
  rocky: { /* ... */ },
  invalidWeight: { name: 'X', weight: '-5' },
  invalidMicrochip: { microchip_number: '123' },
};
```

Fakes determinísticos, no random. Reproducibles.

### 10.3. Limpieza de estado (3 estrategias)

1. **E2E_RUN_ID** — cada corrida inyecta UUID en `test_metadata.run_id`. `globalTeardown` borra por run_id.
2. **Por email demo** — `afterEach` borra rows de emails `playwright+*`. Script `e2e/utils/supabase-cleanup.ts` con service role.
3. **Base separada** — proyecto Supabase paralelo solo para E2E (ideal).

**Fase 1:** estrategia #2.

### 10.4. Seguridad credenciales

- ❌ Nunca commitear `E2E_USER_PASSWORD` ni `SUPABASE_SERVICE_ROLE_KEY`.
- ✅ `.env.test.local` (gitignored).
- ✅ CI: `secrets.E2E_USER_PASSWORD`.
- ✅ Rotar si se filtran (regla en `memory/feedback_secrets_in_chat.md`).

### 10.5. storageState cacheado

```
e2e/.auth/               # gitignored
├── owner.json
├── vet.json
└── power.json
```

Login una vez en `auth.setup.ts`, no en cada test.

---

## 11. Ambientes y estrategia de ejecución

### 11.1. Matriz de ambientes

| Ambiente | `baseURL` | Uso | Comando |
|---|---|---|---|
| Local dev | `http://localhost:8080` | Desarrollo diario | `npm run test:e2e` |
| Local headed | idem | Debug flaky | `npm run test:e2e:headed` |
| Local UI | idem | Exploración | `npm run test:e2e:ui` |
| Preview deploy | preview URL | PR verification | `E2E_BASE_URL=... npm run test:e2e` |
| Staging | staging URL | Nightly + pre-release | `E2E_BASE_URL=... npm run test:e2e:full` |
| Producción (smoke) | `https://pawfriend.cl` | Post-deploy solo P0 público | `npm run test:e2e -- --grep @smoke-prod` |

### 11.2. Niveles de corrida

| Nivel | Qué corre | Cuándo | Duración |
|---|---|---|---|
| **L0 Smoke** | `smoke/*` + F-AUTH-01 + F-PET-01 | Pre-commit, PR | < 2 min |
| **L1 Core** | P0 completo (23 flujos) | Pre-merge | < 5 min |
| **L2 Full** | P0 + P1 (81 flujos), matriz 5 engines | Nightly, release | < 25 min |
| **L3 Regression** | Todo + visual snapshots | Manual, pre-release | < 45 min |

### 11.3. CI/CD (GitHub Actions, Fase 4)

```yaml
# .github/workflows/e2e.yml
name: E2E
on:
  pull_request:
  push:
    branches: [main]
  schedule:
    - cron: '0 6 * * *'  # 03:00 Santiago → nightly
jobs:
  smoke:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps chromium webkit
      - run: npm run test:e2e
        env:
          E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
          E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: e2e/reports/
  full:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    # ... npm run test:e2e:full
```

---

## 12. Observabilidad y evidencia

### 12.1. Artefactos por test

| Artefacto | Cuándo | Dónde |
|---|---|---|
| Screenshot | `only-on-failure`, `fullPage: true` | `e2e/reports/test-results/*/test-failed-*.png` |
| Video | `retain-on-failure` | idem |
| Trace | `retain-on-failure` | `npx playwright show-trace <path>` |
| HTML report | Siempre | `e2e/reports/html/` |
| JSON report | Siempre | `e2e/reports/results.json` (consumible por IA) |
| JUnit | Siempre | `e2e/reports/junit.xml` (CI) |
| Console logs | En fallo | `testInfo.attach()` |
| Network HAR | Opt-in | `recordHar` en context |

### 12.2. Captura consola global (`consoleWatcher`)

```ts
// e2e/utils/console-watcher.ts
export const test = base.extend<{ consoleWatch: void }>({
  consoleWatch: [async ({ page }, use, testInfo) => {
    const jsErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(`${err.name}: ${err.message}\n${err.stack}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await use();
    if (jsErrors.length) {
      await testInfo.attach('js-errors', { body: jsErrors.join('\n---\n'), contentType: 'text/plain' });
      throw new Error(`[js-error] ${jsErrors[0]}`);
    }
    if (consoleErrors.length) {
      await testInfo.attach('console-errors', { body: consoleErrors.join('\n'), contentType: 'text/plain' });
    }
  }, { auto: true }],
});
```

### 12.3. Reporte para agentes IA (`summary.json`)

```json
{
  "runId": "uuid",
  "timestamp": "2026-04-11T14:30:00Z",
  "baseURL": "http://localhost:8080",
  "totals": { "passed": 42, "failed": 2, "skipped": 1 },
  "failures": [
    {
      "flowId": "F-PET-01",
      "spec": "flows/pets/create-pet.spec.ts",
      "title": "[F-PET-01] happy path mínimo",
      "project": "Desktop Chrome",
      "error": "Click silencioso en 'Agregar Mascota'",
      "screenshot": "reports/.../test-failed-1.png",
      "trace": "reports/.../trace.zip",
      "lastUrl": "/add-pet"
    }
  ],
  "uxWarnings": [
    { "flowId": "F-PET-09", "message": "Botón 'Eliminar' sin aria-label", "severity": "medium" }
  ]
}
```

---

## 13. Detección de UX además de bugs técnicos

### 13.1. Señales automatizables

| Señal | Cómo detectarla |
|---|---|
| Icon button sin aria-label | `button:not([aria-label]):has(svg):not(:has(text))` |
| Disabled sin feedback | `button:disabled` sin `title` ni tooltip |
| Click silencioso | click → 5s sin URL/toast/modal/DOM diff |
| Form con error invisible | Submit inválido → sin toast **y** sin inline error |
| Loading infinito | spinner visible > 15s |
| Pantalla en blanco | `body.textContent.trim().length === 0` post-navegación |
| Doble click genera duplicado | `create` en paralelo → 2 rows |
| >N clicks para tarea simple | target crear mascota ≤ 7 clicks |
| Tab inalcanzable con teclado | `page.keyboard.press('Tab')` no llega |
| Redirect loop | navegación infinita |
| 404 silencioso | click → NotFound sin error |

### 13.2. Reporte separado

Fallos técnicos → rompen build. UX warnings → `e2e/reports/ux-findings.md`, no rompen build, se publican como comentario en PR.

```md
## UX Finding #12 — F-PET-01
- **Severidad:** media
- **Categoría:** feedback invisible
- **Pantalla:** /add-pet
- **Selector:** `button:has-text("Agregar Mascota")`
- **Descripción:** Click con form válido no muestra feedback inmediato. Toast llega recién tras ~2s.
- **Evidencia:** reports/screenshots/ux-12.png
- **Sugerencia:** añadir estado `loading` al botón.
```

### 13.3. Límite

El agente detecta señales **mecánicas**. NO detecta "el copy confunde". Eso requiere QA manual. Findings del agente son input para QA, no reemplazo.

---

## 14. Plan de implementación por fases

### Fase 1 — Setup mínimo y estabilización (semana 1) — **15 flujos**

- [ ] Estructura `e2e/flows/`, `e2e/fixtures/files/`, `e2e/utils/`, `e2e/pages/`.
- [ ] Migrar `smoke-*.spec.ts` → `e2e/smoke/`.
- [ ] `.env.test.local` gitignored; `.env.test.example` creado.
- [ ] `e2e/utils/console-watcher.ts` (fixture auto).
- [ ] `e2e/utils/selectors.ts` (TOAST, DIALOG).
- [ ] `e2e/utils/outcome-assertions.ts`.
- [ ] `e2e/fixtures/test-data.ts` con `PET_PAYLOADS`, `USER_PROFILES`.
- [ ] Archivos reales en `e2e/fixtures/files/`.
- [ ] `e2e/README.md` con convenciones.
- [ ] `npm run test:e2e` verde.
- **Cobertura:** F-AUTH-09, F-NAV-05/09, F-LEG-01/02/03/04, F-PET-04/05/06/07, F-ERR-06, F-VET-05/06 (parcial).

### Fase 2 — Flujos P0 end-to-end (semana 2-3) — **37 flujos acumulados**

- [ ] Seed users `playwright+*` ejecutado.
- [ ] `e2e/auth.setup.ts` con `storageState` por perfil.
- [ ] `playwright.config.ts` con `projects: setup` + `dependencies: ['setup']`.
- [ ] `VirtualUser` (`e2e/utils/virtual-user.ts`).
- [ ] Specs P0: F-AUTH-01/02/06/07/08/10, F-ONB-01, F-NAV-01/02, F-PET-01/02, F-MED-01/05/07/08, F-REM-01/02, F-VET-01/02/03/09/11, F-MAP-01, F-SET-01/09.
- [ ] `e2e/utils/supabase-cleanup.ts`.
- [ ] L1 estable (<5% flaky).

### Fase 3 — P1 completo + P2 parcial (semana 4-6) — **≈115 flujos**

- [ ] Resto de P1: F-ONB-02, F-NAV-03/04/06/10, F-PET-03/08-14, F-MED-02/03/04/06/09, F-REM-03-07, F-VET-04/05/06/07/08/10, F-SVC-01-09, F-MAP-02, F-SOC-01/04, F-CHT-01/02/03/05, F-SET-02/03/04/05/08/10, F-PRO-01-10, F-REV-01, F-SHR-01/04, F-PAY-01-05, F-ERR-01/02.
- [ ] P2 relevantes (gamification, adoption, reports, admin, community secondary).
- [ ] `docs/testids-registry.md` creado.
- [ ] `data-testid` agregados donde locator semántico no alcance.
- [ ] Tags consistentes (`@smoke`, `@auth`, `@slow`, `@flaky`, `@external`, `@ux`).
- [ ] Perfiles de usuario virtual con setup individual.

### Fase 4 — Robustez, reportería y CI (semana 7-8) — **115 flujos**

- [ ] `.github/workflows/e2e.yml` con `smoke` (PR) y `full` (nightly).
- [ ] Reporter JSON custom + `summary.json` con `flowId`.
- [ ] HTML report como artifact GH Actions.
- [ ] Comentario PR con link y UX findings.
- [ ] `globalSetup` + `globalTeardown`.
- [ ] Visual snapshots: `/`, `/auth`, `/my-pets`.
- [ ] Política flaky: auto-tag + watchlist.
- [ ] `docs/flaky-watchlist.md` creado.

### Fase 5 — Heurísticas avanzadas y MCP (semana 9+) — **137 flujos**

- [ ] Fixture `uxWatcher` con las 11 señales de §13.1.
- [ ] Specs externos desbloqueados (F-AUTH-03/04/11, F-SET-06/07, F-NAV-07/08 via mobile, F-CHT-04, F-GAM-05, F-ADM-03, F-ERR-07/08).
- [ ] `@playwright/mcp` integrado con Claude Code para exploración/generación.
- [ ] Chaos light: red lenta (`context.route slowDown`).
- [ ] Benchmark P0 por engine.
- [ ] Generador de smoke tests desde rutas de `App.tsx`.

---

## 15. Estructura de archivos sugerida

Ver [§4.1](#41-árbol-de-archivos-objetivo). Todo dentro de `e2e/`.

Nuevos archivos en raíz:
- `.env.test.example`
- `.github/workflows/e2e.yml` (Fase 4)
- `docs/testids-registry.md` (Fase 3) — `docs/` es output Vite pero este archivo se agrega **al source**, no al build
- `docs/flaky-watchlist.md` (Fase 4) — idem

> **Nota sobre `docs/`**: como `docs/` es output de Vite, los archivos `testids-registry.md` y `flaky-watchlist.md` deben vivir fuera de ese directorio. Opción más segura: `_pending/testing-docs/` o raíz-level como `TESTIDS_REGISTRY.md` y `FLAKY_WATCHLIST.md`.

Modificar:
- `.gitignore` → añadir `e2e/.auth/`, `e2e/reports/`, `e2e/fixtures/files/*.generated.*`, `.env.test.local`
- `playwright.config.ts` → `outputDir`, reporters extra, fixtures globales
- `package.json` → `test:e2e:smoke`, `test:e2e:core`, `test:e2e:report`, `test:e2e:install`

---

## 16. Checklist de configuración

### Dependencias (ya instaladas)
- [x] `@playwright/test` 1.59.1
- [x] `@playwright/mcp` 0.0.70
- [x] `vitest`, `@testing-library/*`, `jsdom`

### Scripts nuevos `package.json`
```jsonc
"test:e2e:smoke": "playwright test e2e/smoke --project=\"Desktop Chrome\"",
"test:e2e:core":  "playwright test e2e/flows --project=\"Desktop Chrome\" --project=\"Mobile Safari (iPhone 13)\"",
"test:e2e:report": "playwright show-report e2e/reports/html",
"test:e2e:install": "playwright install --with-deps"
```

### Variables de entorno
- [ ] `.env.test.example` creado
- [ ] `.env.test.local` generado por dev (gitignored)
- [ ] GitHub secrets: `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_VET_EMAIL`, `E2E_VET_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`

### Users de prueba Supabase
- [ ] Migración `99999999000000_demo_seed_flag.sql` aplicada
- [ ] `scripts/seed-demo.mjs` ejecutado
- [ ] 5 users `playwright+*@demo.pawfriend.cl` con `Demo1234!`
- [ ] `profiles.is_demo = true` en cada uno

### Archivos de prueba
- [ ] `e2e/fixtures/files/pet-photo-{small,large,tiny}.jpg`
- [ ] `e2e/fixtures/files/vaccination-card.jpg`
- [ ] `e2e/fixtures/files/invalid.txt`
- [ ] `e2e/fixtures/files/oversized.pdf`

### Playwright config
- [x] `baseURL`, `webServer`, `projects`
- [ ] `outputDir` explícito
- [ ] Reporters JSON + JUnit
- [ ] `globalSetup`/`globalTeardown`
- [ ] `actionTimeout`, `navigationTimeout`

### Timeouts, retries, trace
- [x] `timeout: 30_000`, `expect.timeout: 10_000`, `retries CI:2/local:1`
- [ ] `actionTimeout: 10_000`, `navigationTimeout: 20_000`
- [ ] `trace/video/screenshot: retain-on-failure`

### Cleanup
- [ ] `e2e/utils/supabase-cleanup.ts`
- [ ] `test.afterEach` llama cleanup con emails demo
- [ ] `globalTeardown` como red de seguridad

---

## 17. Riesgos y decisiones

### Técnicos

| Riesgo | Mitigación |
|---|---|
| Puerto 8080 ocupado | `webServer.reuseExistingServer: true` ya configurado |
| Lazy loading → race conditions | `waitUntil: 'networkidle'`, `waitForFunction` |
| Animaciones Radix/Tailwind | Esperar `aria-expanded="true"` / `data-state="open"` |
| Cross-engine flakiness WebKit | Matriz completa en nightly, no solo PR |
| React Query cache viejo | `clearCookies` + `clearLocalStorage` en `beforeEach` |
| Sesión expira mid-test | `expires_at ≥ 1h` futuro |
| Upload a Storage sin limpieza | Bucket `e2e-temp` + TTL + cleanup |

### De datos

| Riesgo | Mitigación |
|---|---|
| Tests tocan data real de prod | Nunca correr contra prod con auth real — solo `@smoke-prod` |
| Rows sin limpiar | `afterEach` + `globalTeardown` + `is_demo` filter |
| Seed desactualizado | Versión del seed + re-run automático |
| RLS bloquea inserts silenciosamente | Asserts duales: UI + query admin |

### De falso éxito

| Riesgo | Mitigación |
|---|---|
| Click sin outcome = verde | `VirtualUser.clickCTA` fuerza outcome |
| Toast success sin row | Asserts duales |
| 200 con body vacío | `body.textContent.length > 0` |
| Screenshot muestra error pero test pasa | `consoleWatch` auto-fail |

### Zonas difíciles

| Zona | Estrategia |
|---|---|
| Google Maps / Leaflet | Test presencia, no render |
| OCR cartilla | Mock o imagen conocida + tolerancia |
| Flow.cl pagos | Stub a nivel de callback |
| Google OAuth | `@external`, `test.fixme`, QA manual |
| Push Capacitor | Fuera de scope, QA device |
| WhatsApp Meta | `@external` hasta verificación |
| PDFs generados | Validar download + size, no contenido |
| Geolocation | `grantPermissions` + coords fake |

### Fragilidad general

- ❌ `waitForTimeout` prohibido.
- ❌ Locators por clase CSS.
- ✅ `getByRole` > `getByLabel` > `getByText` > `getByTestId`.
- ✅ Test que necesita 3 reintentos → `@flaky` + issue.

---

## 18. Recomendación final

### 18.1. Mejor estrategia

**Construir el agente virtual SOBRE el Playwright ya configurado**, en 5 fases graduales, priorizando **flujos end-to-end reales con auth y outcomes verificados en DB**.

Ventaja doble:
1. **Ya hay base funcionando** (config + 4 specs + matriz + fixture).
2. **`@playwright/mcp` instalado** → Claude Code puede generar specs interactivamente en Fase 5.

### 18.2. Qué implementaría primero

1. **Semana 1 — consolidar base.** Estructura, migrar smoke, fixtures, utils. NO specs nuevos — dejar lo existente verde.
2. **Semana 2 — `VirtualUser` + storageState real.** `auth.setup.ts` con user seedeado. Reescribir `create-pet` end-to-end.
3. **Semana 3 — los otros P0.** 23 flujos totales cubiertos.
4. **Semana 4 — CI verde.** GH Actions con job `smoke` en PR.
5. **Semana 5+ — P1 completo + P2 relevante + UX heurísticas.**

### 18.3. Top 5 flujos críticos

1. 🥇 **F-AUTH-01** — Login email/password. Sin login no hay app.
2. 🥈 **F-PET-01/02** — Crear mascota end-to-end. Puerta al valor, ya tuvo fricción real.
3. 🥉 **F-MED-01/05** — Ver ficha clínica + descargar PDF. Joya de la corona.
4. 🏅 **F-VET-01/02/03/09** — Directorio público + filtros comuna + perfil público. Segunda joya, tráfico SEO.
5. 🏅 **F-AUTH-09 + F-ERR-01/02** — Redirect protected + empty states en `/my-pets`, `/home`. Red de seguridad.

### 18.4. Qué NO automatizar al principio

- ❌ Pagos Flow.cl reales (externo, caro, frágil).
- ❌ Google OAuth (Google bloquea automation).
- ❌ WhatsApp reminders (pendiente Meta).
- ❌ Push Capacitor (device only).
- ❌ Admin panel (bajo tráfico).
- ❌ Validación píxel-perfect (Percy en Fase 4+).
- ❌ Paw Game (entretenimiento, bajo valor de regresión).

### 18.5. Evolución

| Horizonte | Evolución |
|---|---|
| **Corto (1-2 meses)** | L1 verde en PR + P0 completo + cleanup limpio |
| **Medio (3-4 meses)** | P1 completo + nightly L2 + UX findings en PR |
| **Largo (6+ meses)** | Visual regression + MCP generando specs desde exploración + chaos light + benchmarks de performance por engine |

### 18.6. Métricas de éxito

- [ ] **> 90%** de bugs de regresión en P0 detectados **antes** del usuario.
- [ ] **< 5%** de tests son `@flaky`.
- [ ] **< 5 min** para L1 en CI.
- [ ] **100%** de P0 y P1 con spec.
- [ ] **Cada PR** en `main` pasó L1 antes del merge.
- [ ] **≥ 3** findings de UX por mes que no son bugs técnicos.

---

**Fin del blueprint.**

Este documento es **vivo**. Actualizarlo cada vez que:
- Se agregue una ruta protegida nueva en `src/App.tsx` → §1.5 y §6.
- Se agregue un formulario con validaciones → §8.1.
- Se cambie la matriz cross-engine en `playwright.config.ts` → §1.3.
- Se agregue un perfil de usuario virtual → §5.2.
- Se detecte un nuevo antipatrón de UX → §13.1.
- Se cierre la implementación completa de un módulo → mover el checklist correspondiente a "done" en §14.

Mantenedor: el equipo que implemente el agente virtual + revisión cruzada con [CLAUDE.md](../CLAUDE.md).
