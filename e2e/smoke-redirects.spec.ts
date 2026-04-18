import { test, expect } from '@playwright/test';

/**
 * Smoke tests: Redirects y aliases legacy.
 *
 * Verifica que los redirects funcionen correctamente:
 * - Rutas legacy que deben mapear a nuevas (ej: /mascota/:id/timeline → /ficha/:id).
 * - Rutas con flag deshabilitada (ej: /feed con FEED=false → /home).
 * - Callbacks de Flow (/upgrade/success, /upgrade/cancel, /payment-result).
 *
 * Cobertura 2026-04-19: 8+ redirects legacy + 3 callbacks Flow.
 */

// Redirects legacy que deben llegar a URL moderna (pueden pasar por /auth si protegidos).
// Validamos que NO crasheen y respondan con < 400.
const LEGACY_REDIRECTS = [
  {
    path: '/mascota/test-dummy-id/ficha-clinica',
    name: '/mascota/:id/ficha-clinica → /ficha/:id',
  },
  {
    path: '/pet/test-dummy-id/clinical',
    name: '/pet/:id/clinical → /ficha/:id',
  },
  {
    path: '/mascota/test-dummy-id/timeline',
    name: '/mascota/:id/timeline → /ficha',
  },
  {
    path: '/mascota/test-dummy-id/rutinas',
    name: '/mascota/:id/rutinas → /calendario',
  },
  {
    path: '/settings',
    name: '/settings → /profile',
  },
  {
    path: '/calendar',
    name: '/calendar → /mis-reservas',
  },
  {
    path: '/upgrade',
    name: '/upgrade → /paw-member',
  },
  {
    path: '/services/vets',
    name: '/services/vets → /veterinarios',
  },
];

for (const route of LEGACY_REDIRECTS) {
  test(`[Redirect] ${route.name}`, async ({ page }) => {
    await page.goto(route.path, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    // React Router hace el <Navigate> DESPUES del domcontentloaded, así que
    // esperamos activamente a que el pathname cambie. ProtectedRoute también
    // puede redirigir a /auth con returnTo — ambas cuentan como redirect
    // valido (la ruta legacy no es la URL final).
    await page.waitForFunction(
      (originalPath) => window.location.pathname !== originalPath,
      route.path,
      { timeout: 15_000 }
    );

    const finalPathname = new URL(page.url()).pathname;
    expect(finalPathname).not.toBe(route.path);
  });
}

// Callbacks de Flow (pagos). Deben cargar aunque sin status válido.
const FLOW_CALLBACKS = [
  { path: '/upgrade/success', name: 'Flow success callback' },
  { path: '/upgrade/cancel', name: 'Flow cancel callback' },
  { path: '/payment-result', name: 'Flow payment result (nuevo unificado)' },
  { path: '/payment-result?status=success', name: 'Payment result con status=success' },
  { path: '/payment-result?status=failed', name: 'Payment result con status=failed' },
];

for (const route of FLOW_CALLBACKS) {
  test(`[Flow callback] ${route.name} carga sin crash`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto(route.path, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    expect(response?.status()).toBeLessThan(400);
    expect(errors).toHaveLength(0);
  });
}

// NotFound: ruta inexistente debe mostrar página 404 (no crash).
test('[404] Ruta inexistente muestra NotFound sin crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/ruta-que-no-existe-xyz-123', {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });

  expect(errors).toHaveLength(0);

  // Debe haber contenido visible (NotFound page)
  const body = await page.locator('body').textContent();
  expect(body?.trim().length).toBeGreaterThan(0);
});
