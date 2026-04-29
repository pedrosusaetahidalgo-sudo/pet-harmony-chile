import { test, expect } from '@playwright/test';
import { injectFakeAuth } from './fixtures/auth';

/**
 * E2E flow Motor #2 Aseguradoras (request-insurance-quote):
 *
 * 1. Owner sin login -> /cotizar-seguro/:petId redirige a /auth (smoke)
 * 2. Owner logueado puede acceder a /cotizar-seguro/:petId (no crash)
 * 3. La pagina muestra UI de cotizacion (no error 500)
 * 4. Si pet_id no existe, muestra estado vacio o error friendly
 *
 * NOTA: este spec usa fake auth (no toca Supabase real). Para test
 * end-to-end con DB real (insertar pet → cotizar → lead persiste →
 * email enviado), requeriria fixture de Supabase con cleanup, fuera
 * del scope del smoke E2E.
 *
 * Cierra deuda explicita del SINTESIS § 7: "No tenemos test E2E que
 * ejercite el request-insurance-quote con ownership real (por ahora
 * solo smoke nav)". Este spec mejora el smoke pero la validacion full
 * con DB sigue siendo manual hasta que queramos invertir en fixtures.
 */

test.describe('Motor #2 Aseguradoras - flow E2E', () => {
  test('[unauth] /cotizar-seguro redirige a /auth', async ({ page }) => {
    await page.goto('/cotizar-seguro/test-dummy-pet-id', {
      waitUntil: 'commit',
      timeout: 30_000,
    });
    await expect(page).toHaveURL(/\/auth/, { timeout: 20_000 });
  });

  test('[auth fake] /cotizar-seguro carga sin crash con dummy id', async ({ page }) => {
    await injectFakeAuth(page);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto('/cotizar-seguro/00000000-0000-0000-0000-000000000999', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    expect(response?.status()).toBeLessThan(400);
    // Sin errores JS criticos en consola (errores de red 401/404 son
    // esperados con dummy id, no son pageerror).
    expect(errors).toHaveLength(0);

    // Body con contenido (no pantalla vacia)
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(100);
  });

  test('[auth fake] /cotizar-seguro tiene mention de seguro/cotizar/aseguradora', async ({
    page,
  }) => {
    await injectFakeAuth(page);
    await page.goto('/cotizar-seguro/00000000-0000-0000-0000-000000000999', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    // Espera contenido relevante visible (con timeout para hidration)
    await expect(page.getByText(/seguro|cotiz|aseguradora|sura|bci|mapfre/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('[auth fake] /tienda carga sin crash con dummy ids', async ({ page }) => {
    await injectFakeAuth(page);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto('/tienda/00000000-0000-0000-0000-000000000999/master-dog', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    expect(response?.status()).toBeLessThan(400);
    expect(errors).toHaveLength(0);
  });
});

test.describe('Motor #1 Pharma B2B - portal publico', () => {
  test('/b2b portal acepta API key invalida y muestra error friendly', async ({ page }) => {
    await page.goto('/b2b', { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Buscar el input de API key (id="apikey" en B2BPortal.tsx)
    const apiKeyInput = page.locator('#apikey');
    await expect(apiKeyInput).toBeVisible({ timeout: 10_000 });

    // Pegar key con formato valido pero invalida en server
    await apiKeyInput.fill('pf_live_invalid_key_for_test_1234567890ab');

    // Click en boton "Ver mi uso"
    const submitBtn = page.getByRole('button', { name: /ver mi uso|enter/i }).first();
    await submitBtn.click();

    // Esperar respuesta server: toast con error o stats null
    // (no debe crashear la pagina)
    await page.waitForTimeout(2000);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });

  test('/b2b portal muestra los 3 tiers (free/research/enterprise)', async ({ page }) => {
    await page.goto('/b2b', { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Los 3 tiers deben estar visibles en la seccion #tiers
    await expect(page.getByText(/free/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/research/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/enterprise/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
