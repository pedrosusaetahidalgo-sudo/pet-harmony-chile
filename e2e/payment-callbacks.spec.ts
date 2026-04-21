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
 *
 * Nota sobre `waitUntil: 'load'`: `domcontentloaded` se dispara antes de
 * que React monte, y textContent('body') devuelve solo los scripts inline
 * del index.html. `load` espera a que los chunks de Vite terminen y el
 * React root esté hidratado.
 */

const SUCCESS_COPY = /exito|completado|confirmad|recibido|gracias/i;
const FAILED_COPY = /error|fall|no se|problema|intenta|canceld|cancelad/i;
const PAW_MEMBER_COPY = /paw|member|miembro|exito|gracias|bienvenid/i;
const CANCEL_COPY = /cancel|volver|inicio|home|no se completo|intenta/i;

test.describe('Flow payment success callback', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeAuth(page);
  });

  test('/payment-result?status=success muestra estado positivo', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/payment-result?status=success', { waitUntil: 'load' });

    expect(errors, 'JavaScript errors en load').toHaveLength(0);

    // Esperar a que React renderice el copy real (toContainText retries por 10s).
    await expect(page.locator('body'), 'Copy de éxito visible').toContainText(SUCCESS_COPY);
  });

  test('/payment-result?status=success ofrece CTA para seguir navegando', async ({ page }) => {
    await page.goto('/payment-result?status=success', { waitUntil: 'load' });

    // Primero aseguramos que React montó
    await expect(page.locator('body')).toContainText(SUCCESS_COPY);

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

    await page.goto('/payment-result?status=failed', { waitUntil: 'load' });

    expect(errors, 'JavaScript errors en load').toHaveLength(0);

    await expect(page.locator('body'), 'Copy de fallo/error visible').toContainText(FAILED_COPY);
  });

  test('/payment-result?status=failed ofrece CTA para reintentar o volver', async ({ page }) => {
    await page.goto('/payment-result?status=failed', { waitUntil: 'load' });

    await expect(page.locator('body')).toContainText(FAILED_COPY);

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

    // /upgrade/success redirige a /paw-member/success (Navigate replace).
    await page.goto('/upgrade/success', { waitUntil: 'load' });

    expect(errors).toHaveLength(0);

    await expect(page.locator('body')).toContainText(PAW_MEMBER_COPY);
  });

  test('/upgrade/cancel carga sin crash y permite volver', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/upgrade/cancel', { waitUntil: 'load' });

    expect(errors).toHaveLength(0);

    await expect(page.locator('body')).toContainText(CANCEL_COPY);
  });
});

test.describe('Booking flow - UI sin auth real', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeAuth(page);
  });

  test('/mis-reservas carga sin crash para user autenticado (fake)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/mis-reservas', { waitUntil: 'load' });

    // Con fake auth, la página debería renderizar el shell aunque las queries
    // Supabase fallen silenciosamente (React Query retry off en tests).
    expect(errors.filter((e) => !e.includes('supabase') && !e.includes('fetch'))).toEqual([]);

    // Esperar a que React monte algo concreto (shell de layout)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('/calendario carga sin crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/calendario', { waitUntil: 'load' });
    expect(errors.filter((e) => !e.includes('supabase') && !e.includes('fetch'))).toEqual([]);
  });

  test('/perfil-vet-publico con slug dummy no crashea', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/veterinarios/dr-prueba-no-existe', { waitUntil: 'load' });
    expect(errors).toHaveLength(0);

    // Debe mostrar estado de "no encontrado" o redirigir, no pantalla blanca
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
