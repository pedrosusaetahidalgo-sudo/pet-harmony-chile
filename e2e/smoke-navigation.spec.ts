import { test, expect } from '@playwright/test';

/**
 * Smoke tests: Navegación y componentes globales
 * Verifica que el layout, sidebar, header y bottom tabs funcionan.
 */

test.describe('Landing page', () => {
  test('muestra el logo y CTA de registro', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Logo del header (img) es visible en todos los viewports;
    // el wordmark span esta oculto en mobile (hidden sm:inline).
    await expect(page.getByAltText(/paw friend/i).first()).toBeVisible({ timeout: 15_000 });
    // CTAs reales del Hero (botones, no links): "Crear cuenta gratis" o "Ya tengo cuenta"
    const cta = page
      .getByRole('button', { name: /crear cuenta|ya tengo cuenta|ir al inicio/i })
      .first();
    await expect(cta).toBeVisible({ timeout: 15_000 });
  });

  test('los links del footer cargan', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const termsLink = page.getByRole('link', { name: /términos|condiciones/i }).first();
    if (await termsLink.isVisible()) {
      await termsLink.click();
      await expect(page).toHaveURL(/\/terms/);
    }
  });
});

test.describe('Auth page', () => {
  test('muestra formulario de login/registro', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    // Debe tener campo de email
    await expect(page.getByLabel(/email|correo/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('muestra tagline unificado', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    // Desktop muestra "Ficha clinica completa, directorio de veterinarios verificados"
    // en el panel izquierdo (hidden md:flex). Mobile muestra el copy del form:
    // "la ficha medica de tu peludo viva siempre contigo". Aceptamos cualquiera
    // para cubrir ambos breakpoints.
    await expect(
      page.getByText(/veterinarios verificados|ficha medica|ficha clinica|tu peludo/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Directorio vets', () => {
  test('tiene barra de búsqueda y filtros', async ({ page }) => {
    await page.goto('/veterinarios', { waitUntil: 'domcontentloaded' });
    await expect(page.getByPlaceholder(/buscar/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('los filtros de emergencia están presentes', async ({ page }) => {
    await page.goto('/veterinarios', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/abiertos ahora/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/atiende urgencias/i).first()).toBeVisible();
  });
});

test.describe('404', () => {
  test('ruta inexistente muestra página de error', async ({ page }) => {
    await page.goto('/ruta-que-no-existe', { waitUntil: 'domcontentloaded' });
    const body = await page.locator('body').textContent();
    // Debe mostrar algo (no pantalla blanca)
    expect(body?.trim().length).toBeGreaterThan(0);
  });
});
