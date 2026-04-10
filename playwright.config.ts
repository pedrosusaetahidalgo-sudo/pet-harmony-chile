import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E para Paw Friend.
 *
 * Suite de tests:
 *   e2e/smoke-public.spec.ts     — 11 rutas públicas (sin login)
 *   e2e/smoke-protected.spec.ts  — 23 rutas protegidas (redirect a /auth)
 *   e2e/smoke-navigation.spec.ts — Navegación, landing, auth, directorio
 *   e2e/add-pet.spec.ts          — Formulario de crear mascota
 *
 * Comandos:
 *   npx playwright test                    — Correr todos
 *   npx playwright test smoke-public       — Solo rutas públicas
 *   npx playwright test --grep @auth       — Solo tests que necesitan sesión
 *   npx playwright test --ui               — UI interactiva
 *   npx playwright show-report             — Ver último reporte
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'], // Output legible en terminal
  ],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
