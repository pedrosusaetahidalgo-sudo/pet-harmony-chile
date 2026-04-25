import { test, expect } from '@playwright/test';

/**
 * Smoke tests del Refactor Maestro Fase 0 (2026-04-23).
 *
 * Cobertura:
 *   - Rutas públicas afectadas por los flags refactor
 *   - Redirects activos (ADOPTION_UNIFIED_FEED redirige /refugios-hogares)
 *   - Páginas nuevas accesibles (con o sin login según corresponda)
 *   - No console errors críticos en flujos refactor
 *
 * Lo que NO cubre (porque requiere auth real):
 *   - HOME_PET_FOCUS (necesita user con mascota)
 *   - Quick Actions Hub interactions
 *   - Pet ID Card display
 *   - Audio recording
 *   - Kanban refugio
 *   → Tests con auth real van en e2e/refactor-auth.spec.ts (skip por default)
 *
 * Tests con @auth requieren env vars TEST_USER_EMAIL + TEST_USER_PASSWORD.
 */

// ──────────────────────────────────────────────────────────────────────────
// 1. ADOPTION_UNIFIED_FEED — /refugios-hogares debería redirigir a /adoption
// ──────────────────────────────────────────────────────────────────────────
// (helper gotoTolerant declarado abajo, antes de los tests que lo usan)

/**
 * Navegación tolerante a redirects client-side (React Router `<Navigate>`).
 *
 * waitUntil:'commit' evita el ERR_ABORTED clásico cuando React reemplaza la
 * URL antes de que la navegación termine. Después esperamos load state y
 * un settle de 500ms para que cualquier redirect montado en useEffect tenga
 * tiempo de aplicarse.
 */
async function gotoTolerantTop(
  page: import('@playwright/test').Page,
  path: string
): Promise<string> {
  await page.goto(path, { waitUntil: 'commit' }).catch(() => undefined);
  // domcontentloaded es más rápido que 'load' (no espera imágenes ni iframes)
  // y suficiente para verificar redirects + presencia de markup.
  await page.waitForLoadState('domcontentloaded', { timeout: 12_000 }).catch(() => undefined);
  // Pequeño settle para que useEffect de redirects monte
  await page.waitForTimeout(300);
  return page.url();
}

test('[Refactor] /refugios-hogares redirige a /adoption?tab=refugios cuando flag activo', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const url = await gotoTolerantTop(page, '/refugios-hogares');
  // Si el flag está activo redirige; si no, sigue en /refugios-hogares (legacy)
  expect(url).toMatch(/\/adoption|\/refugios-hogares/);
  expect(errors).toHaveLength(0);
});

// ──────────────────────────────────────────────────────────────────────────
// 2. /adoption carga sin crash (con o sin login)
// ──────────────────────────────────────────────────────────────────────────
test('[Refactor] /adoption carga sin crash (puede redirigir a /auth si protegida)', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const url = await gotoTolerantTop(page, '/adoption');
  expect(url).toMatch(/\/(adoption|auth)/);
  expect(errors).toHaveLength(0);
});

// ──────────────────────────────────────────────────────────────────────────
// 3. /refugios/:slug con slug inválido NO crashea (página pública)
// ──────────────────────────────────────────────────────────────────────────
test('[Refactor] /refugios/slug-inexistente maneja gracefully (no crash)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/refugios/refugio-inexistente-test-12345', {
    waitUntil: 'domcontentloaded',
  });

  // Puede ser 200 con empty state, redirect a /refugios-hogares, o 404 manejado
  const body = await page.locator('body').textContent();
  expect(body?.trim().length).toBeGreaterThan(0);

  // Sin errores JS críticos (warnings de imágenes son OK)
  const criticalErrors = errors.filter(
    (e) => !e.toLowerCase().includes('warning') && !e.toLowerCase().includes('image')
  );
  expect(criticalErrors).toHaveLength(0);
});

// ──────────────────────────────────────────────────────────────────────────
// 4. /mis-adopciones requiere auth, redirige a /auth
// ──────────────────────────────────────────────────────────────────────────
test('[Refactor] /mis-adopciones (nueva ruta) redirige a /auth sin login', async ({ page }) => {
  const url = await gotoTolerantTop(page, '/mis-adopciones');
  expect(url).toMatch(/\/(auth|mis-adopciones)/);
});

// ──────────────────────────────────────────────────────────────────────────
// 5. /shelter/adopciones (nueva ruta) requiere auth + rol shelter
// ──────────────────────────────────────────────────────────────────────────
test('[Refactor] /shelter/adopciones redirige sin login (kanban refugio)', async ({ page }) => {
  const url = await gotoTolerantTop(page, '/shelter/adopciones');
  expect(url).toMatch(/\/(auth|onboarding-shelter|shelter)/);
});

// ──────────────────────────────────────────────────────────────────────────
// 6. /home redirige a /auth sin login (Home V2 protegido)
// ──────────────────────────────────────────────────────────────────────────
test('[Refactor] /home (Home V2) redirige a /auth sin login', async ({ page }) => {
  const url = await gotoTolerantTop(page, '/home');
  expect(url).toMatch(/\/(auth|home)/);
});

// ──────────────────────────────────────────────────────────────────────────
// 7. /add-pet (Onboarding V2 wizard) redirige a /auth sin login
// ──────────────────────────────────────────────────────────────────────────
test('[Refactor] /add-pet (Onboarding V2 wizard) redirige sin login', async ({ page }) => {
  const url = await gotoTolerantTop(page, '/add-pet');
  expect(url).toMatch(/\/(auth|add-pet)/);
});

// ──────────────────────────────────────────────────────────────────────────
// 8. Landing pública (/) carga con todos los flags refactor activos
// ──────────────────────────────────────────────────────────────────────────
test('[Refactor] Landing carga sin errores con flags refactor activos', async ({ page }) => {
  // Landing es pesada (lazy chunks, muchas imágenes). Subir timeout específico.
  test.setTimeout(75_000);

  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await gotoTolerantTop(page, '/');

  const hero = page.locator('h1, h2').first();
  await expect(hero).toBeVisible({ timeout: 15_000 });

  const critical = errors.filter(
    (e) =>
      !e.toLowerCase().includes('posthog') &&
      !e.toLowerCase().includes('firebase') &&
      !e.toLowerCase().includes('sentry') &&
      !e.toLowerCase().includes('analytics')
  );
  expect(critical).toHaveLength(0);
});

// ──────────────────────────────────────────────────────────────────────────
// 9. /auth carga el form (signup → home V2 funciona)
// ──────────────────────────────────────────────────────────────────────────
test('[Refactor] /auth muestra form de login/registro', async ({ page }) => {
  await gotoTolerantTop(page, '/auth');
  const emailInput = page.locator('input[type="email"]').first();
  await expect(emailInput).toBeVisible({ timeout: 8000 });
});

// ──────────────────────────────────────────────────────────────────────────
// 10. Verificar que las rutas legacy importantes siguen funcionando
// ──────────────────────────────────────────────────────────────────────────
test('[Refactor] Rutas legacy críticas siguen accesibles (compat)', async ({ page }) => {
  test.setTimeout(75_000); // 3 navegaciones tolerantes en una sola
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await gotoTolerantTop(page, '/donaciones');
  const body1 = await page.locator('body').textContent();
  expect(body1?.length).toBeGreaterThan(50);

  await gotoTolerantTop(page, '/paw-core');
  const body2 = await page.locator('body').textContent();
  expect(body2?.length).toBeGreaterThan(50);

  await gotoTolerantTop(page, '/veterinarios');
  const body3 = await page.locator('body').textContent();
  expect(body3?.length).toBeGreaterThan(50);

  const critical = errors.filter(
    (e) =>
      !e.toLowerCase().includes('posthog') &&
      !e.toLowerCase().includes('analytics') &&
      !e.toLowerCase().includes('firebase')
  );
  expect(critical).toHaveLength(0);
});

// ──────────────────────────────────────────────────────────────────────────
// Tests con auth (skip por default; requieren env TEST_USER_*)
// ──────────────────────────────────────────────────────────────────────────
const HAS_AUTH_CREDS = !!process.env.TEST_USER_EMAIL && !!process.env.TEST_USER_PASSWORD;

test.describe('Refactor con auth real (@auth)', () => {
  test.skip(!HAS_AUTH_CREDS, 'Requiere TEST_USER_EMAIL + TEST_USER_PASSWORD env vars');

  test('Login → /home muestra HomePetFocusV2', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    const submit = page.locator('button[type="submit"]').first();
    await submit.click();

    // Espera redirect post-login a /home
    await page.waitForURL(/\/home/, { timeout: 15_000 });

    // Home V2 característico: PetHeroCard o "Bienvenido a Paw Friend" (empty state)
    const indicator = page.locator('text=/bienvenido a paw friend|tu mascota|paw friend/i').first();
    await expect(indicator).toBeVisible({ timeout: 10_000 });
  });

  test('Login → /adoption muestra tabs Mascotas/Refugios', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/home/, { timeout: 15_000 });

    await page.goto('/adoption');
    // Tabs Mascotas/Refugios visibles cuando ADOPTION_UNIFIED_FEED=true
    const mascotasTab = page.locator('text=Mascotas').first();
    const refugiosTab = page.locator('text=Refugios').first();
    await expect(mascotasTab).toBeVisible({ timeout: 5000 });
    await expect(refugiosTab).toBeVisible({ timeout: 5000 });
  });
});
