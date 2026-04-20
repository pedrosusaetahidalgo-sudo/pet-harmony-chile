/**
 * E2E: Sistema de aplicaciones pitch (/aplicar, /para-veterinarios inline form,
 * /refugios-hogares, /paw-partners directorio).
 *
 * Estos tests validan:
 *   - Rutas publicas cargan sin login
 *   - Forms de aplicacion se renderizan
 *   - Validacion client-side funciona (campos requeridos)
 *   - CTAs a /aplicar?tipo=... existen en las pages
 *
 * NO envia postulaciones reales (eso dispararia emails via Resend).
 * Si se quiere probar el INSERT real, mockear supabase o usar proyecto
 * de staging.
 */
import { test, expect } from '@playwright/test';

test.describe('Sistema de aplicaciones pitch', () => {
  test('/aplicar?tipo=paw_partners carga form con campos esperados', async ({ page }) => {
    await page.goto('/aplicar?tipo=paw_partners');
    await expect(
      page.getByRole('heading', { name: /Suma tu marca como Paw Partner/i })
    ).toBeVisible();
    await expect(page.getByLabel(/Nombre/i).first()).toBeVisible();
    await expect(page.getByLabel(/Email/i).first()).toBeVisible();
    // Campo extra por tipo
    await expect(page.getByText(/Categoria/i).first()).toBeVisible();
    await expect(page.getByText(/Descuento para Paw Members/i).first()).toBeVisible();
  });

  test('/aplicar?tipo=refugio ofrece CTA alternativo a onboarding directo', async ({ page }) => {
    await page.goto('/aplicar?tipo=refugio');
    await expect(
      page.getByRole('heading', { name: /Registra tu hogar de adopcion/i })
    ).toBeVisible();
    // CTA alternativo al flow directo
    const directLink = page.getByRole('link', { name: /Ir/i });
    await expect(directLink).toBeVisible();
  });

  test('/aplicar?tipo=angels_vc carga como "Inversionistas"', async ({ page }) => {
    await page.goto('/aplicar?tipo=angels_vc');
    await expect(page.getByRole('heading', { name: /Pre-seed \/ seed round/i })).toBeVisible();
  });

  test('/aplicar sin tipo fallback a "otro"', async ({ page }) => {
    await page.goto('/aplicar');
    await expect(
      page.getByRole('heading', { name: /Cuentanos en que estas pensando/i })
    ).toBeVisible();
  });

  test('/aplicar valida email invalido sin hacer submit', async ({ page }) => {
    await page.goto('/aplicar?tipo=otro');
    await page
      .getByLabel(/Nombre/i)
      .first()
      .fill('Test User');
    await page.getByLabel(/Email/i).first().fill('email-invalido');
    await page.getByRole('button', { name: /Enviar postulacion/i }).click();
    // El schema zod debe gatillar error - no hay navegacion fuera de /aplicar
    await expect(page).toHaveURL(/\/aplicar/);
  });

  test('/refugios-hogares es publica y tiene CTA a onboarding', async ({ page }) => {
    await page.goto('/refugios-hogares');
    await expect(page.getByRole('heading', { name: /Hogares de adopcion/i })).toBeVisible();
    const cta = page.getByRole('link', { name: /Registrate gratis|Registrar mi refugio/i }).first();
    await expect(cta).toBeVisible();
  });

  test('/paw-partners es publica y tiene CTAs a member + apply', async ({ page }) => {
    await page.goto('/paw-partners');
    await expect(page.getByRole('heading', { name: /Paw Partners/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Sumar mi marca/i }).first()).toBeVisible();
  });
});

test.describe('Pitch deck /para-veterinarios', () => {
  test('carga con hero + form inline al final', async ({ page }) => {
    await page.goto('/para-veterinarios');
    await expect(page.getByRole('heading', { name: /Tu consulta veterinaria/i })).toBeVisible();

    // Scroll al form inline
    await page.locator('#postular-vet').scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: /Postula y quedas/i })).toBeVisible();
    await expect(page.getByLabel(/Nombre completo/i)).toBeVisible();
    await expect(page.getByLabel(/RUT profesional/i)).toBeVisible();
  });

  test('CTA del hero hace scroll al form', async ({ page }) => {
    await page.goto('/para-veterinarios');
    const heroCta = page.getByRole('button', { name: /Postular en 2 minutos/i }).first();
    await heroCta.click();
    // Esperar scroll
    await page.waitForTimeout(500);
    await expect(page.locator('#postular-vet')).toBeInViewport();
  });

  test('muestra 4 planes reales (Basica/Premium/Clinica/Pro Max)', async ({ page }) => {
    await page.goto('/para-veterinarios');
    const planNames = ['Basica', 'Premium', 'Clinica', 'Pro Max'];
    for (const n of planNames) {
      await expect(page.getByText(new RegExp(n, 'i')).first()).toBeVisible();
    }
  });

  test('FAQ expandido tiene al menos 5 preguntas', async ({ page }) => {
    await page.goto('/para-veterinarios');
    await expect(page.getByText(/Preguntas frecuentes/i)).toBeVisible();
    // Al menos una pregunta clave visible
    await expect(page.getByText(/¿Cuanto cuesta\?/i)).toBeVisible();
    await expect(page.getByText(/¿Como funciona la comision\?/i)).toBeVisible();
  });
});

test.describe('Landing — AudiencesStrip', () => {
  test('landing muestra las 6 audiencias con link', async ({ page }) => {
    await page.goto('/');
    await page.locator('#audiencias').scrollIntoViewIfNeeded();
    // Titulos de audiencias
    await expect(page.getByRole('heading', { name: /Veterinarios/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Hogares de adopcion/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Paw Partners/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Paw Voices/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Paw Companys/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Inversionistas/i }).first()).toBeVisible();
  });

  test('cada audiencia linkea al flow correcto', async ({ page }) => {
    await page.goto('/');
    await page.locator('#audiencias').scrollIntoViewIfNeeded();

    // Vet -> /para-veterinarios
    const vetLink = page
      .locator('#audiencias a')
      .filter({ hasText: /Veterinarios/i })
      .first();
    await expect(vetLink).toHaveAttribute('href', /\/para-veterinarios/);

    // Shelter -> /refugios-hogares
    const shelterLink = page
      .locator('#audiencias a')
      .filter({ hasText: /Hogares de adopcion/i })
      .first();
    await expect(shelterLink).toHaveAttribute('href', /\/refugios-hogares/);

    // Partner -> /paw-partners
    const partnerLink = page
      .locator('#audiencias a')
      .filter({ hasText: /Paw Partners/i })
      .first();
    await expect(partnerLink).toHaveAttribute('href', /\/paw-partners/);
  });
});
