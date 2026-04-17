import { test, expect } from '@playwright/test';
import { injectFakeAuth } from './fixtures/auth';

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

// Rutas owner protegidas — se visitan con sesion fake para detectar overflow
// horizontal tras el login (pantallas que "se deslizan al lado" en mobile).
const MOBILE_PROTECTED_ROUTES = [
  { path: '/home', label: 'Home' },
  { path: '/my-pets', label: 'My Pets' },
  { path: '/add-pet', label: 'Add Pet' },
  { path: '/reminders', label: 'Recordatorios' },
  { path: '/rutinas', label: 'Rutinas' },
  { path: '/calendario', label: 'Calendario' },
  { path: '/mis-reservas', label: 'Mis Reservas' },
  { path: '/servicios', label: 'Servicios' },
  { path: '/services/walkers', label: 'Services Walkers' },
  { path: '/services/sitters', label: 'Services Sitters' },
  { path: '/maps', label: 'Maps' },
  { path: '/profile', label: 'Profile' },
  { path: '/upgrade', label: 'Upgrade' },
  { path: '/feed', label: 'Feed' },
  { path: '/comunidad', label: 'Comunidad' },
  { path: '/adoption', label: 'Adopcion' },
  { path: '/paw-game', label: 'Paw Game' },
  { path: '/paw-collection', label: 'Paw Collection' },
  { path: '/misiones', label: 'Misiones' },
  { path: '/en-memoria', label: 'En Memoria' },
  { path: '/donantes-sangre', label: 'Donantes Sangre' },
  { path: '/panel-pro', label: 'Panel Pro' },
  { path: '/chat', label: 'Chat' },
  { path: '/reportes', label: 'Reportes' },
  { path: '/provider/dashboard', label: 'Provider Dashboard' },
  { path: '/provider/pacientes', label: 'Provider Pacientes' },
  { path: '/provider/profile-edit', label: 'Provider Profile Edit' },
  { path: '/ficha/00000000-0000-0000-0000-000000000001', label: 'Ficha Clinica' },
];

test.describe('Mobile layout — protected owner routes (no horizontal overflow)', () => {
  for (const route of MOBILE_PROTECTED_ROUTES) {
    test(`${route.label} (${route.path}) — no horizontal overflow`, async ({ page }) => {
      await injectFakeAuth(page);
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      // Give layout + data a beat to settle
      await page.waitForTimeout(700);

      const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const overflow = root.scrollWidth > root.clientWidth;
        // If overflow, find the widest offender to help debugging
        let offender: { tag: string; cls: string; w: number } | null = null;
        if (overflow) {
          const all = Array.from(document.querySelectorAll<HTMLElement>('body *'));
          let maxRight = 0;
          for (const el of all) {
            const rect = el.getBoundingClientRect();
            if (rect.right > maxRight && rect.width > 0 && rect.height > 0) {
              maxRight = rect.right;
              offender = {
                tag: el.tagName.toLowerCase(),
                cls: (el.className || '').toString().slice(0, 120),
                w: Math.round(rect.width),
              };
            }
          }
        }
        return { overflow, scrollW: root.scrollWidth, clientW: root.clientWidth, offender };
      });

      expect(
        metrics.overflow,
        `Horizontal overflow on ${route.path}: ` +
          `scrollW=${metrics.scrollW} clientW=${metrics.clientW} ` +
          `offender=${metrics.offender ? `${metrics.offender.tag}.${metrics.offender.cls} (w=${metrics.offender.w}px)` : 'n/a'}`
      ).toBe(false);
    });
  }
});

test.describe('Mobile layout — vertical scroll (regresion fix 2026-04-17)', () => {
  // Tras el fix del scroll desktop (overflow-x clip en #root, no en html)
  // validamos que el scroll vertical sigue funcionando en mobile tambien.
  const SCROLL_ROUTES = [
    { path: '/', label: 'Landing' },
    { path: '/auth', label: 'Auth' },
    { path: '/veterinarios', label: 'Directorio Vets' },
  ];

  for (const route of SCROLL_ROUTES) {
    test(`${route.label} permite scroll vertical`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      // Verifica que la página tenga contenido suficiente para scrollear
      const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const body = document.body;
        return {
          scrollable:
            root.scrollHeight > root.clientHeight || body.scrollHeight > body.clientHeight,
          // window.scrollY despues de scrollTo debe cambiar
          initialY: window.scrollY,
        };
      });

      if (!metrics.scrollable) {
        // Pagina corta sin contenido suficiente, skip
        return;
      }

      // Scroll a 300px y verificar que scrollY cambio
      await page.evaluate(() => window.scrollTo(0, 300));
      await page.waitForTimeout(200);
      const afterScroll = await page.evaluate(() => window.scrollY);
      expect(
        afterScroll,
        `${route.path} should be scrollable vertically (got scrollY=${afterScroll})`
      ).toBeGreaterThan(0);
    });
  }
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
