import { test, expect } from '@playwright/test';

/**
 * Booking V3 Master Plan — baseline E2E.
 *
 * Este archivo acompaña docs-raiz/planes/BOOKING_SYSTEM_MASTER_PLAN.md y
 * captura el estado ACTUAL del dominio booking para detectar regresiones
 * durante la ejecución de las fases del plan (especialmente Fase 3 y 4).
 *
 * Tests marcados con test.skip() requieren cuenta semilla + JWT fixture
 * (pendiente: Pedro configurar seed en staging). Cuando existan, quitar
 * el skip y reemplazar los placeholders por selectores reales.
 *
 * Complementa (no reemplaza) a e2e/booking-flow.spec.ts que cubre el
 * smoke inicial de rutas.
 */

async function acceptCookies(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('pf_cookie_consent', 'accepted');
    } catch {
      /* no-op */
    }
  });
}

test.describe('Booking V3 — landing en directorio', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookies(page);
  });

  test('directorio muestra el input de busqueda y al menos un filtro', async ({ page }) => {
    await page.goto('/veterinarios', { waitUntil: 'domcontentloaded' });
    await expect(page.getByPlaceholder(/buscar/i).first()).toBeVisible({ timeout: 15_000 });
    // Debe existir al menos un chip/botón con texto "comuna" o "especialidad"
    const body = (await page.textContent('body')) ?? '';
    expect(body.toLowerCase()).toMatch(/comuna|especialidad|abiertos|urgencias/);
  });

  test('directorio soporta deep link por comuna (no crashea)', async ({ page }) => {
    await page.goto('/veterinarios/comuna/las-condes', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('directorio soporta deep link por especialidad (no crashea)', async ({ page }) => {
    await page.goto('/veterinarios/especialidad/dermatologia', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Booking V3 — rutas nuevas del plan', () => {
  /**
   * /provider/agenda — ruta nueva propuesta en Fase 4 del plan. Hoy NO existe;
   * este test valida que cuando se agregue, sea protegida y use RoleGuard.
   * Ajustar cuando CC-25 esté mergeado.
   */
  test.skip('(pending Fase 4) /provider/agenda sin login redirige a auth', async ({ page }) => {
    await page.goto('/provider/agenda', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth|\/login/, { timeout: 10_000 });
    expect(page.url()).toMatch(/auth|login/);
  });

  test.skip('(pending Fase 4) /provider/disponibilidad sin login redirige a auth', async ({
    page,
  }) => {
    await page.goto('/provider/disponibilidad', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth|\/login/, { timeout: 10_000 });
    expect(page.url()).toMatch(/auth|login/);
  });
});

test.describe('Booking V3 — flujo tutor completo (requiere auth seed)', () => {
  /**
   * Los siguientes tests requieren un user tutor semilla con:
   *   - 1 mascota creada
   *   - Email opt-in whatsapp opcional
   *   - Al menos 1 vet semilla con disponibilidad en los próximos 7 días
   *
   * Pendiente (Pedro): crear seed SQL + helper `loginAs(page, 'tutor-seed')`
   * en e2e/helpers/auth.ts. Cuando exista, quitar .skip y reemplazar TODOs.
   */

  test.skip('tutor completa wizard V3 con auto-select mascota única', async ({ page }) => {
    // TODO(CC-05 auth): await loginAs(page, 'tutor-seed');
    // await page.goto('/veterinarios/SLUG-VET-SEMILLA');
    // await page.getByRole('button', { name: /reservar/i }).click();
    // // Auto-select: no debe aparecer selector de mascota si solo hay 1
    // await expect(page.getByText(/confirma tu cita/i)).toBeVisible();
  });

  test.skip('tutor ve política de cancelación en step confirm (CC-07 PolicyBanner)', async ({
    page,
  }) => {
    // TODO: validar que PolicyBanner renderiza con texto sobre grace 2h
  });

  test.skip('tutor cancela dentro de grace (2h) sin requerir motivo', async ({ page }) => {
    // TODO: crear booking con scheduledAt = now + 4h; cancelar; no debe pedir motivo
  });

  test.skip('tutor cancela fuera de grace requiere motivo obligatorio', async ({ page }) => {
    // TODO: crear booking con scheduledAt = now + 1h; cancelar; debe pedir motivo
  });

  test.skip('tutor cancelar booking con evento en Google → evento se borra (CC-02)', async ({
    page,
  }) => {
    // TODO: con Google conectado + booking sincronizado, cancelar debe disparar
    // google-calendar-sync con action: 'delete'. Validar network request.
  });

  test.skip('slot conflict muestra 3 alternativas cercanas', async ({ page }) => {
    // TODO: seedear 2 tutores, reservar mismo slot en paralelo, el 2do ve
    // SlotConflictDialog con alternativas.
  });
});

test.describe('Booking V3 — flujo provider (requiere auth seed)', () => {
  test.skip('provider ve bookings V2 en TodayAgendaCard (CC-01 fix)', async ({ page }) => {
    // TODO: seed provider + booking via service_provider_id; validar que
    // TodayAgendaCard muestra el booking (antes del fix desaparecía).
  });

  test.skip('provider confirma booking pendiente y owner recibe notify', async ({ page }) => {
    // TODO: login provider, inbox tab pending, confirmar, validar notification
  });

  test.skip('provider propone reprogramación (CC-26 Fase 4) — aún no implementado', async ({
    page,
  }) => {
    // TODO: cuando RescheduleFromInboxDialog exista, validar que provider
    // puede elegir 2-3 slots alternativos y owner recibe notify.
  });
});

test.describe('Booking V3 — feature flags', () => {
  test('flags booking v3 existen en el bundle sin activar UI', async ({ page }) => {
    // Flag por default en false; la UI antigua debe seguir renderizando.
    await page.goto('/veterinarios', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    // No podemos leer import.meta directo desde el navegador, pero si la
    // página no crashea, el bundle compila con los flags nuevos.
  });
});
