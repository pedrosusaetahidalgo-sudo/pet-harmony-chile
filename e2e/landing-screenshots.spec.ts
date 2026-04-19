import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Captura screenshots reales del landing v3 (Immersive) para integrarlos
 * después como assets visuales (preview en redes, README, pitch deck).
 *
 * Uso:
 *   npm run dev            # en otra terminal
 *   npx playwright test landing-screenshots --project="Desktop Chrome"
 *
 * Output:
 *   public/landing/screenshots/landing-desktop-full.png
 *   public/landing/screenshots/landing-desktop-hero.png
 *   public/landing/screenshots/landing-mobile-full.png
 *   public/landing/screenshots/landing-mobile-hero.png
 *   public/landing/screenshots/faq-desktop.png
 */

const OUT_DIR = resolve(process.cwd(), 'public/landing/screenshots');

function ensureDir(file: string) {
  mkdirSync(dirname(file), { recursive: true });
}

test.describe('Landing v3 — captura de screenshots', () => {
  // Limpiar storage antes de cada test para evitar redirect a /home si hay sesion vieja
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('desktop hero + full', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Solo capturar con Chromium');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    // Esperar a que hidrate (sticky header visible)
    await page.waitForSelector('header', { state: 'visible', timeout: 15_000 });
    await page.waitForTimeout(2000);

    const heroPath = `${OUT_DIR}/landing-desktop-hero.png`;
    ensureDir(heroPath);
    await page.screenshot({
      path: heroPath,
      clip: { x: 0, y: 0, width: 1440, height: 900 },
    });

    const fullPath = `${OUT_DIR}/landing-desktop-full.png`;
    await page.screenshot({ path: fullPath, fullPage: true });

    // Captura específica de la sección Problema (dark)
    await page.locator('#problema').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `${OUT_DIR}/landing-desktop-problem.png`,
      clip: { x: 0, y: 0, width: 1440, height: 900 },
    });

    // Sección ecosistema
    await page.locator('#ecosistema').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `${OUT_DIR}/landing-desktop-ecosystem.png`,
      clip: { x: 0, y: 0, width: 1440, height: 900 },
    });

    // Sección alma
    await page.locator('#alma').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `${OUT_DIR}/landing-desktop-alma.png`,
      clip: { x: 0, y: 0, width: 1440, height: 900 },
    });
  });

  test('mobile hero + full', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Solo capturar con Chromium');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('header', { state: 'visible', timeout: 15_000 });
    await page.waitForTimeout(2000);

    const heroPath = `${OUT_DIR}/landing-mobile-hero.png`;
    ensureDir(heroPath);
    await page.screenshot({
      path: heroPath,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });

    const fullPath = `${OUT_DIR}/landing-mobile-full.png`;
    await page.screenshot({ path: fullPath, fullPage: true });
  });

  test('faq desktop', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Solo capturar con Chromium');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/faq', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(800);

    const path = `${OUT_DIR}/faq-desktop.png`;
    ensureDir(path);
    await page.screenshot({ path, fullPage: true });
  });
});
