import { test, expect } from '@playwright/test';

/**
 * Smoke tests: Navegación y componentes globales
 * Verifica que el layout, sidebar, header y bottom tabs funcionan.
 */

test.describe('Landing page', () => {
  test('muestra el logo y CTA de registro', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByText(/paw.*friend/i).first()).toBeVisible();
    // Debe haber al menos un botón de acción
    const cta = page.getByRole('link', { name: /empezar|registrar|ingresar|entrar/i }).first();
    await expect(cta).toBeVisible({ timeout: 10_000 });
  });

  test('los links del footer cargan', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const termsLink = page.getByRole('link', { name: /términos|condiciones/i }).first();
    if (await termsLink.isVisible()) {
      await termsLink.click();
      await expect(page).toHaveURL(/\/terms/);
    }
  });
});

test.describe('Auth page', () => {
  test('muestra formulario de login/registro', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' });
    // Debe tener campo de email
    await expect(page.getByLabel(/email|correo/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('muestra tagline unificado', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' });
    await expect(page.getByText(/cuida la salud|veterinarios verificados/i).first()).toBeVisible();
  });
});

test.describe('Directorio vets', () => {
  test('tiene barra de búsqueda y filtros', async ({ page }) => {
    await page.goto('/veterinarios', { waitUntil: 'networkidle' });
    await expect(page.getByPlaceholder(/buscar/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('los filtros de emergencia están presentes', async ({ page }) => {
    await page.goto('/veterinarios', { waitUntil: 'networkidle' });
    await expect(page.getByText(/abiertos ahora/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/atiende urgencias/i).first()).toBeVisible();
  });
});

test.describe('404', () => {
  test('ruta inexistente muestra página de error', async ({ page }) => {
    await page.goto('/ruta-que-no-existe', { waitUntil: 'networkidle' });
    const body = await page.locator('body').textContent();
    // Debe mostrar algo (no pantalla blanca)
    expect(body?.trim().length).toBeGreaterThan(0);
  });
});
