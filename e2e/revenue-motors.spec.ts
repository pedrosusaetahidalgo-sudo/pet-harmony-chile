import { test, expect } from '@playwright/test';

/**
 * Smoke tests: 7 motores Revenue Master Plan (2026-04-29/30)
 *
 * Cubre las rutas publicas + form-based de los 7 motores B2B sin login.
 *
 * Motor 1: Pharma B2B → /b2b portal + /aplicar?tipo=b2b_api
 * Motor 2: Aseguradoras → /cotizar-seguro/:petId (protegida, redirige auth)
 * Motor 3: Retail → /tienda/:petId/:partnerSlug (protegida, redirige auth)
 * Motor 4: Gobierno → /aplicar?tipo=gobierno_municipio
 * Motor 5: Banca → /aplicar?tipo=banca
 * Motor 6: Edificios → /aplicar?tipo=edificios
 * Motor 7: Long-tail → /aplicar?tipo=longtail
 */

const APLICAR_KINDS = [
  { tipo: 'b2b_api', name: '#1 Pharma B2B API' },
  { tipo: 'gobierno_municipio', name: '#4 Gobierno municipios' },
  { tipo: 'banca', name: '#5 Banca' },
  { tipo: 'edificios', name: '#6 Edificios inmobiliarias' },
  { tipo: 'longtail', name: '#7 Long-tail aerolineas/academia' },
];

for (const route of APLICAR_KINDS) {
  test(`[Motor inbound] ${route.name} carga form sin crash`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto(`/aplicar?tipo=${route.tipo}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    expect(response?.status()).toBeLessThan(400);
    expect(errors).toHaveLength(0);

    // Debe haber un form visible (no 404 ni pantalla vacia)
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(100);
  });
}

test('[Motor #1] Portal B2B publico carga (tiers + endpoints)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const response = await page.goto('/b2b', {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });

  expect(response?.status()).toBeLessThan(400);
  expect(errors).toHaveLength(0);

  // Debe mencionar API B2B o Pharma
  await expect(page.getByText(/api|pharma|b2b|endpoint/i).first()).toBeVisible({ timeout: 10_000 });
});

test('[Motor #2] /cotizar-seguro sin login redirige a /auth', async ({ page }) => {
  await page.goto('/cotizar-seguro/test-dummy-pet-id', {
    waitUntil: 'commit',
    timeout: 30_000,
  });
  await expect(page).toHaveURL(/\/auth/, { timeout: 20_000 });
});

test('[Motor #3] /tienda sin login redirige a /auth', async ({ page }) => {
  await page.goto('/tienda/test-dummy-pet-id/master-dog', {
    waitUntil: 'commit',
    timeout: 30_000,
  });
  await expect(page).toHaveURL(/\/auth/, { timeout: 20_000 });
});

test('[Motor #1] Form b2b_api no tiene errores JS al cambiar tipo', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/aplicar?tipo=b2b_api', {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });

  // Probar todos los tipos via query param (sin reload completo)
  for (const kind of APLICAR_KINDS) {
    await page.goto(`/aplicar?tipo=${kind.tipo}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });
    await page.waitForTimeout(200);
  }

  expect(errors).toHaveLength(0);
});
