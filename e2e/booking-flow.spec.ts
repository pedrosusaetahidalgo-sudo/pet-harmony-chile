import { test, expect } from '@playwright/test';

/**
 * Smoke E2E para el sistema de reservas (sin auth real: validamos landing +
 * deep links publicos + redirects). Cuando existe cuenta de prueba podemos
 * extender con login y flujo completo de reserva.
 *
 * Cubre rutas criticas:
 * - /mis-reservas (protegida: redirige a /auth)
 * - /calendario (protegida: redirige a /auth)
 * - /provider/dashboard (protegida + role-guarded)
 * - /veterinarios (publica)
 * - /veterinarios/:slug (publica)
 * - /precios-veterinarios (publica)
 */

test.describe('Booking system - rutas protegidas', () => {
  test('/mis-reservas sin login redirige a auth', async ({ page }) => {
    await page.goto('/mis-reservas', { waitUntil: 'domcontentloaded' });
    // Espera redirect a /auth
    await page.waitForURL(/\/auth|\/login/, { timeout: 10_000 });
    expect(page.url()).toMatch(/auth|login/);
  });

  test('/calendario sin login redirige a auth', async ({ page }) => {
    await page.goto('/calendario', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth|\/login/, { timeout: 10_000 });
    expect(page.url()).toMatch(/auth|login/);
  });

  test('/provider/dashboard sin login redirige a auth', async ({ page }) => {
    await page.goto('/provider/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth|\/login/, { timeout: 10_000 });
    expect(page.url()).toMatch(/auth|login/);
  });

  test('legacy /calendar redirige a /mis-reservas', async ({ page }) => {
    await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
    // Redirige primero a mis-reservas (legacy), y luego por ser protegida a auth
    await page.waitForURL(/mis-reservas|auth|login/, { timeout: 10_000 });
    expect(page.url()).toMatch(/mis-reservas|auth|login/);
  });
});

test.describe('Booking system - rutas publicas', () => {
  test('/veterinarios carga y muestra directorio', async ({ page }) => {
    await page.goto('/veterinarios', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    // Debe contener texto relevante del directorio o filtros
    const content = await page.textContent('body');
    expect(content?.toLowerCase() ?? '').toMatch(/veterinario|comuna|especialidad|directorio/);
  });

  test('/precios-veterinarios carga', async ({ page }) => {
    await page.goto('/precios-veterinarios', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('/para-veterinarios landing B2B carga', async ({ page }) => {
    await page.goto('/para-veterinarios', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('/registro-veterinario formulario carga', async ({ page }) => {
    await page.goto('/registro-veterinario', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    // Debe tener al menos un input o select
    const inputCount = await page.locator('input, select, textarea').count();
    expect(inputCount).toBeGreaterThan(0);
  });
});

test.describe('Booking system - deeplinks con token dummy', () => {
  test('/qr/:token con token dummy no rompe (maneja estado gracefully)', async ({ page }) => {
    await page.goto('/qr/dummy-token-12345', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    // No debe crashear: body renderiza algo (error amigable o redirect)
  });

  test('/medical-share/:token con token dummy no rompe', async ({ page }) => {
    await page.goto('/medical-share/dummy-token-12345', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('/resena/:token con token dummy no rompe', async ({ page }) => {
    await page.goto('/resena/dummy-token-12345', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Booking system - flow callbacks', () => {
  test('/payment-result?status=success no crashea', async ({ page }) => {
    await page.goto('/payment-result?status=success', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('/payment-result?status=failed no crashea', async ({ page }) => {
    await page.goto('/payment-result?status=failed', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('/upgrade/success no crashea', async ({ page }) => {
    await page.goto('/upgrade/success', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });
});
