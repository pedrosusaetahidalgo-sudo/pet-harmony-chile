import { test, expect } from '@playwright/test';
import { injectFakeAuth } from './fixtures/auth';

/**
 * Payment callbacks E2E — INIT-27 Plan 90d.
 *
 * Verifica que los callbacks de Flow (pago exitoso / fallido / cancelado)
 * renderizan UI correcta y ofrecen navegación clara al usuario.
 *
 * No prueba transacciones reales — usa fake auth y query params.
 * Objetivo: prevenir regresiones donde el usuario queda atorado después
 * de un pago (caso real reportado en auditoria UX).
 */

test.describe('Flow payment success callback', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeAuth(page);
  });

  test('/payment-result?status=success muestra estado positivo', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/payment-result?status=success', { waitUntil: 'domcontentloaded' });

    // No JS errors en load
    expect(errors, 'JavaScript errors en load').toHaveLength(0);

    // Debe haber un mensaje de éxito visible (el copy puede variar, buscamos palabras clave)
    const body = (await page.textContent('body')) ?? '';
    expect(body.toLowerCase(), 'Copy de éxito visible').toMatch(
      /exito|completado|confirmad|recibido|gracias/
    );
  });

  test('/payment-result?status=success ofrece CTA para seguir navegando', async ({ page }) => {
    await page.goto('/payment-result?status=success', { waitUntil: 'domcontentloaded' });

    // Debe existir al menos 1 link de acción (a /home, /mis-reservas, /profile, etc.)
    // que permita al user continuar después del pago.
    const actionableLinks = await page
      .locator('a[href^="/"], button:visible')
      .filter({ hasText: /home|inicio|mis reservas|ver|volver|continuar|perfil/i })
      .count();

    expect(actionableLinks, 'Debe haber al menos 1 CTA post-pago').toBeGreaterThan(0);
  });
});

test.describe('Flow payment failed callback', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeAuth(page);
  });

  test('/payment-result?status=failed muestra estado error sin crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/payment-result?status=failed', { waitUntil: 'domcontentloaded' });

    expect(errors, 'JavaScript errors en load').toHaveLength(0);

    const body = (await page.textContent('body')) ?? '';
    // Debe reconocer el estado fallido con copy claro
    expect(body.toLowerCase(), 'Copy de fallo/error visible').toMatch(
      /error|fall|no se|problema|intenta|canceld|cancelad/
    );
  });

  test('/payment-result?status=failed ofrece CTA para reintentar o volver', async ({ page }) => {
    await page.goto('/payment-result?status=failed', { waitUntil: 'domcontentloaded' });

    const retryLinks = await page
      .locator('a, button:visible')
      .filter({ hasText: /reintent|intenta|volver|inicio|home|mis reservas|soporte/i })
      .count();

    expect(retryLinks, 'Debe haber CTA de reintentar o volver').toBeGreaterThan(0);
  });
});

test.describe('Upgrade (Paw Member) callbacks', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeAuth(page);
  });

  test('/upgrade/success carga sin crash y confirma suscripción', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/upgrade/success', { waitUntil: 'domcontentloaded' });

    expect(errors).toHaveLength(0);

    const body = (await page.textContent('body')) ?? '';
    expect(body.toLowerCase()).toMatch(/paw|member|miembro|exito|gracias|bienvenid/);
  });

  test('/upgrade/cancel carga sin crash y permite volver', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/upgrade/cancel', { waitUntil: 'domcontentloaded' });

    expect(errors).toHaveLength(0);

    const body = (await page.textContent('body')) ?? '';
    expect(body.toLowerCase()).toMatch(/cancel|volver|inicio|home|no se completo|intenta/);
  });
});

test.describe('Booking flow - UI sin auth real', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeAuth(page);
  });

  test('/mis-reservas carga sin crash para user autenticado (fake)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/mis-reservas', { waitUntil: 'domcontentloaded' });

    // Con fake auth, la página debería renderizar el shell aunque las queries
    // Supabase fallen silenciosamente (React Query retry off en tests).
    expect(errors.filter((e) => !e.includes('supabase') && !e.includes('fetch'))).toEqual([]);

    // El body debe tener contenido (no blanco)
    const bodyText = (await page.textContent('body')) ?? '';
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('/calendario carga sin crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/calendario', { waitUntil: 'domcontentloaded' });
    expect(errors.filter((e) => !e.includes('supabase') && !e.includes('fetch'))).toEqual([]);
  });

  test('/perfil-vet-publico con slug dummy no crashea', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/veterinarios/dr-prueba-no-existe', { waitUntil: 'domcontentloaded' });
    expect(errors).toHaveLength(0);

    // Debe mostrar estado de "no encontrado" o redirigir, no pantalla blanca
    const bodyText = (await page.textContent('body')) ?? '';
    expect(bodyText.length).toBeGreaterThan(50);
  });
});
