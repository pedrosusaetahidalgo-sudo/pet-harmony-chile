import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Captura screenshots de los 4 HTML mejorados (post §5.2/§2.4/§3.4/§4.4 + motion).
 * Sirve via http-server en puerto 8765.
 *
 * Output: public/landing/screenshots/decks/<nombre>-<slide>.png
 */

const OUT = resolve(process.cwd(), 'public/landing/screenshots/decks');
const BASE = 'http://localhost:8765';

const TARGETS: Array<{ file: string; slug: string; slides: Array<{ id: string; name: string }> }> =
  [
    {
      file: 'PRESENTACION.html',
      slug: 'inversionistas',
      slides: [
        { id: 's8', name: 'alianzas-cards-link' },
        { id: 's14', name: 'cta-final-decks-grid' },
      ],
    },
    {
      file: 'PRESENTACION_COMPANYS.html',
      slug: 'companys',
      slides: [
        { id: 's1', name: 'cover' },
        { id: 's5', name: 'logos-slot' },
        { id: 's10', name: 'cta-founders-counter' },
      ],
    },
    {
      file: 'PRESENTACION_VOICES.html',
      slug: 'voices',
      slides: [
        { id: 's1', name: 'cover' },
        { id: 's3', name: 'gallery-fundadores' },
        { id: 's8', name: 'faq-accordion' },
      ],
    },
    {
      file: 'PRESENTACION_PARTNERS.html',
      slug: 'partners',
      slides: [
        { id: 's1', name: 'cover' },
        { id: 's4', name: 'mapa-chile' },
        { id: 's9', name: 'cta-founders-counter' },
      ],
    },
  ];

function ensureDir(p: string) {
  mkdirSync(dirname(p), { recursive: true });
}

test.describe('Decks mejorados — capturas', () => {
  for (const target of TARGETS) {
    for (const slide of target.slides) {
      test(`${target.slug} · ${slide.name}`, async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'Solo Chromium');
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(`${BASE}/${target.file}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await page.locator(`#${slide.id}`).scrollIntoViewIfNeeded();
        await page.waitForTimeout(1200); // dar tiempo a fade-in animations
        const out = `${OUT}/${target.slug}-${slide.name}.png`;
        ensureDir(out);
        await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1440, height: 900 } });
      });
    }
  }
});
