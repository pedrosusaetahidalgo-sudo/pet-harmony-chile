import { test, expect } from '@playwright/test';

/**
 * Smoke: gate B.1 de onboarding (auditoría top-tier 2026-04-20).
 *
 * Comportamiento esperado:
 *  - Sin sesión → /onboarding-mascota redirige a /auth (ProtectedRoute).
 *  - Con sesión + owner puro sin onboarding_completed_at → gate redirige
 *    a /onboarding-mascota desde cualquier ruta protegida no-bypass.
 *  - Rutas bypass (/paw-member/success, /payment-result, /post-adoption/*)
 *    NO disparan el gate aunque falte onboarding.
 *
 * Los tests que requieren auth viva están marcados con @auth. Sin ese
 * tag solo corren los smoke de carga + redirect unauth.
 */

test.describe('Onboarding gate — rutas bypass cargan aunque el user no tenga sesión', () => {
  const BYPASS_ROUTES = [
    { path: '/paw-member/success', name: 'Paw Member success' },
    { path: '/paw-member/cancel', name: 'Paw Member cancel' },
    { path: '/provider/upgrade/success', name: 'Provider upgrade success' },
    { path: '/provider/upgrade/cancel', name: 'Provider upgrade cancel' },
    { path: '/payment-result?status=success', name: 'Payment result success' },
    { path: '/payment-result?status=failed', name: 'Payment result failed' },
    { path: '/post-adoption/test-id', name: 'Post-adoption check-in' },
  ];

  for (const route of BYPASS_ROUTES) {
    test(`${route.name} sin sesión redirige a /auth (no a /onboarding-mascota)`, async ({
      page,
    }) => {
      await page.goto(route.path, { waitUntil: 'commit', timeout: 30_000 });
      // Si no hay sesión, ProtectedRoute manda a /auth — no al onboarding
      await expect(page).toHaveURL(/\/auth/, { timeout: 20_000 });
    });
  }
});

test.describe('Onboarding dueño — landing carga sin errores JS', () => {
  test('/onboarding-mascota sin sesión redirige a /auth', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/onboarding-mascota', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await expect(page).toHaveURL(/\/auth/, { timeout: 20_000 });

    // No debe haber errores JS al cargar el redirect
    expect(errors.filter((e) => !/ResizeObserver|Non-Error promise|Script error/i.test(e))).toEqual(
      []
    );
  });
});
