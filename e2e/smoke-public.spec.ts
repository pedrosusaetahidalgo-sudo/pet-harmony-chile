import { test, expect } from '@playwright/test';

/**
 * Smoke tests: Rutas públicas (sin login)
 * Verifica que cada página pública cargue sin crash (HTTP 200, sin errores JS).
 */

const PUBLIC_ROUTES = [
  { path: '/', name: 'Landing' },
  { path: '/auth', name: 'Login / Registro' },
  { path: '/veterinarios', name: 'Directorio vets' },
  { path: '/precios-veterinarios', name: 'Estimador precios' },
  { path: '/para-veterinarios', name: 'Landing B2B' },
  { path: '/registro-veterinario', name: 'Registro vet' },
  { path: '/registro-proveedor', name: 'Registro proveedor' },
  { path: '/terms', name: 'Términos de servicio' },
  { path: '/privacy', name: 'Política de privacidad' },
];

for (const route of PUBLIC_ROUTES) {
  test(`[Pública] ${route.name} (${route.path}) carga sin crash`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto(route.path, { waitUntil: 'networkidle', timeout: 15_000 });

    // No debe ser 404 ni 500
    expect(response?.status()).toBeLessThan(400);

    // No debe haber errores JS en consola
    expect(errors).toHaveLength(0);

    // Debe tener contenido visible (no pantalla en blanco)
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(0);
  });
}

test('[Pública] Directorio vets muestra al menos un card o empty state', async ({ page }) => {
  await page.goto('/veterinarios', { waitUntil: 'networkidle' });
  const hasCards = await page.locator("[class*='Card'], [class*='card']").count();
  const hasEmpty = await page.getByText(/sin resultados|no hay/i).count();
  expect(hasCards + hasEmpty).toBeGreaterThan(0);
});

test('[Pública] Estimador de precios muestra selector de comuna', async ({ page }) => {
  await page.goto('/precios-veterinarios', { waitUntil: 'networkidle' });
  await expect(page.getByText(/comuna|selecciona/i).first()).toBeVisible({ timeout: 10_000 });
});
