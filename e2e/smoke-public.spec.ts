import { test, expect } from '@playwright/test';

/**
 * Smoke tests: Rutas públicas (sin login)
 * Verifica que cada página pública cargue sin crash (HTTP 200, sin errores JS).
 *
 * Cobertura 2026-04-19: 16 rutas públicas + 5 landings con token dummy.
 */

const PUBLIC_ROUTES = [
  { path: '/', name: 'Landing' },
  { path: '/auth', name: 'Login / Registro' },
  { path: '/veterinarios', name: 'Directorio vets' },
  { path: '/veterinarios/comuna/las-condes', name: 'Directorio por comuna' },
  {
    path: '/veterinarios/especialidad/medicina-general',
    name: 'Directorio por especialidad',
  },
  { path: '/precios-veterinarios', name: 'Estimador precios' },
  { path: '/precios-veterinarios/comuna/vitacura', name: 'Precios por comuna' },
  { path: '/para-veterinarios', name: 'Landing B2B' },
  { path: '/registro-veterinario', name: 'Registro vet' },
  { path: '/registro-proveedor', name: 'Registro proveedor' },
  { path: '/registro-partner', name: 'Registro partner' },
  { path: '/paw-voices', name: 'Landing Paw Voices' },
  { path: '/paw-companys', name: 'Landing Paw Companys' },
  { path: '/terms', name: 'Términos de servicio' },
  { path: '/privacy', name: 'Política de privacidad' },
  { path: '/delete-account', name: 'Eliminar cuenta' },
];

for (const route of PUBLIC_ROUTES) {
  test(`[Pública] ${route.name} (${route.path}) carga sin crash`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto(route.path, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

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
  await page.goto('/veterinarios', { waitUntil: 'domcontentloaded' });
  const cardOrEmpty = page.locator(
    "[class*='Card'], [class*='card'], :text-matches('sin resultados|no hay', 'i')"
  );
  await expect(cardOrEmpty.first()).toBeVisible({ timeout: 15_000 });
});

test('[Pública] Estimador de precios muestra selector de comuna', async ({ page }) => {
  await page.goto('/precios-veterinarios', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/comuna|selecciona/i).first()).toBeVisible({ timeout: 10_000 });
});

test('[Pública] Paw Voices tiene hero + form de aplicación', async ({ page }) => {
  await page.goto('/paw-voices', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/voz peluda|paw voice/i).first()).toBeVisible({ timeout: 10_000 });
});

test('[Pública] Paw Companys tiene tiers Bronze/Silver/Gold', async ({ page }) => {
  await page.goto('/paw-companys', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/bronze|silver|gold/i).first()).toBeVisible({ timeout: 10_000 });
});

test('[Pública] /services/vets redirige a /veterinarios (fuente única)', async ({ page }) => {
  await page.goto('/services/vets', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/veterinarios$/, { timeout: 10_000 });
});

// Landings con token (deeplinks). Usamos un token dummy — la página debe cargar
// aunque después muestre "token inválido" u "expirado". Solo validamos no-crash.
const TOKEN_LANDINGS = [
  { path: '/qr/test-dummy-token', name: 'Landing QR mascota' },
  { path: '/paw-card/test-dummy-id', name: 'Landing Paw Card' },
  { path: '/medical-share/test-dummy-token', name: 'Landing ficha compartida' },
  { path: '/resena/test-dummy-token', name: 'Landing dejar reseña' },
];

for (const route of TOKEN_LANDINGS) {
  test(`[Pública deeplink] ${route.name} carga sin crash (token dummy)`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto(route.path, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    expect(response?.status()).toBeLessThan(400);
    expect(errors).toHaveLength(0);

    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(0);
  });
}
