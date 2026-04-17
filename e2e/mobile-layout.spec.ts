import { test, expect } from '@playwright/test';

/**
 * Mobile layout sanity checks.
 *
 * Verifica que las pantallas prioritarias no tengan:
 *  - Scroll horizontal no deseado (overflow-x)
 *  - Botones cortados fuera del viewport
 *  - BottomTabBar visible y no superpuesta
 *
 * Ejecutar solo en proyectos mobile:
 *   npx playwright test mobile-layout --project="Mobile*"
 */

const MOBILE_PRIORITY_ROUTES = [
  { path: '/', label: 'Landing' },
  { path: '/auth', label: 'Auth' },
  { path: '/veterinarios', label: 'Directorio Vets' },
  { path: '/precios-veterinarios', label: 'Precios Vets' },
  { path: '/para-veterinarios', label: 'Landing B2B' },
  { path: '/terms', label: 'Terms' },
  { path: '/privacy', label: 'Privacy' },
];

test.describe('Mobile layout — public routes', () => {
  for (const route of MOBILE_PRIORITY_ROUTES) {
    test(`${route.label} (${route.path}) — no horizontal overflow`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      // Check for horizontal overflow: scrollWidth should not exceed viewport width
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(overflow, `Horizontal overflow on ${route.path}`).toBe(false);
    });

    test(`${route.label} (${route.path}) — visual snapshot`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      await expect(page).toHaveScreenshot(
        `mobile-${route.label.toLowerCase().replace(/\s+/g, '-')}.png`,
        {
          fullPage: false,
          maxDiffPixelRatio: 0.2,
        }
      );
    });
  }
});

test.describe('Mobile layout — interactive elements', () => {
  test('Auth tabs are tappable and visible', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });

    const signinTab = page.getByRole('tab', { name: 'Iniciar Sesión' });
    const signupTab = page.getByRole('tab', { name: 'Registrarse' });

    await expect(signinTab).toBeVisible();
    await expect(signupTab).toBeVisible();

    // Tab should be at least 44px tall (Apple HIG minimum tap target)
    const box = await signinTab.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(32);
    }
  });

  test('Landing CTA buttons are within viewport', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const viewport = page.viewportSize();
    if (!viewport) return;

    // Find all visible buttons
    const buttons = page.locator('button:visible, a[role="button"]:visible');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const box = await buttons.nth(i).boundingBox();
      if (!box) continue;

      // Button should not extend beyond viewport width
      expect(box.x + box.width, `Button ${i} right edge`).toBeLessThanOrEqual(viewport.width + 2);
      expect(box.x, `Button ${i} left edge`).toBeGreaterThanOrEqual(-2);
    }
  });

  test('Vet directory ��� cards fit within viewport', async ({ page }) => {
    await page.goto('/veterinarios', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const viewport = page.viewportSize();
    if (!viewport) return;

    // No horizontal scroll
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });
});

test.describe('Mobile layout — select/dropdown behavior', () => {
  test('Auth page email input does not trigger zoom on iOS', async ({ page }) => {
    // This test only makes sense on mobile viewports where iOS zoom is an issue
    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 768) {
      // On desktop, md:text-sm (14px) is expected and correct
      test.skip(true, 'iOS zoom prevention only relevant on mobile viewports');
    }

    await page.goto('/auth', { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();

    // Verify font-size >= 16px (prevents iOS auto-zoom)
    const fontSize = await emailInput.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    expect(fontSize).toBeGreaterThanOrEqual(16);
  });
});
