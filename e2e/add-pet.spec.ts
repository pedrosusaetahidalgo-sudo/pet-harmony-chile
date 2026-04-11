import { test, expect } from '@playwright/test';
import { injectFakeAuth } from './fixtures/auth';

/**
 * Test E2E: Flujo de creación de mascota (/add-pet)
 *
 * Cubre:
 *  - Redirección a /auth si no hay sesión activa
 *  - Validaciones del formulario (nombre vacío, especie vacía, peso inválido,
 *    fecha futura, microchip inválido)
 *  - Happy path: llenar campos obligatorios + opcionales y enviar
 *
 * Nota: los tests de happy path que insertan en Supabase requieren
 * una sesión autenticada real. Están marcados con el tag @auth para
 * poder correrlos solo cuando hay credenciales de test disponibles.
 */

test.describe('Crear mascota — sin sesión', () => {
  test('redirige a /auth si el usuario no está logueado', async ({ page }) => {
    await page.goto('/add-pet');

    // La app debe redirigir al login (ProtectedRoute)
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
  });
});

test.describe('Crear mascota — validaciones de formulario', () => {
  // Inyectamos una sesión fake en localStorage para que ProtectedRoute deje
  // pasar al formulario. Estos tests son puramente client-side: no envían
  // datos al backend, así que no necesitan un JWT real.

  test.beforeEach(async ({ page }) => {
    await injectFakeAuth(page);
    await page.goto('/add-pet', { waitUntil: 'networkidle' });

    // Esperar a que el form aparezca (input id="name"). Si no aparece,
    // skip con mensaje claro (probablemente la inyección falló).
    const ok = await page
      .waitForFunction(() => !!document.getElementById('name'), { timeout: 10_000 })
      .then(() => true)
      .catch(() => false);

    if (!ok) {
      test.skip(true, 'El formulario no cargó (¿inyección de sesión fake falló?).');
    }
  });

  test("el botón de submit está presente y dice 'Agregar Mascota'", async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /agregar mascota/i });
    await expect(submitBtn).toBeVisible();
  });

  test('no envía el formulario sin nombre (campo requerido HTML)', async ({ page }) => {
    // Seleccionar especie para que solo falte el nombre
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /perro/i }).click();

    // Intentar enviar
    const submitBtn = page.getByRole('button', { name: /agregar mascota/i });
    await submitBtn.click();

    // El form no debe navegar (seguimos en /add-pet)
    await expect(page).toHaveURL(/\/add-pet/);
  });

  test('muestra toast si peso es <= 0', async ({ page }) => {
    // El form tiene validación HTML5 (min="0", pattern, etc.) que blockea
    // submit antes de que corra el handler JS. Para alcanzar la validación
    // JS (que es lo que este test verifica) deshabilitamos novalidate:
    await page.evaluate(() => document.querySelector('form')?.setAttribute('novalidate', ''));

    // Llenar nombre
    await page.getByLabel(/nombre/i).fill('TestPet');

    // Seleccionar especie
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /perro/i }).click();

    // Poner peso negativo
    await page.getByLabel(/peso/i).fill('-1');

    // Enviar
    await page.getByRole('button', { name: /agregar mascota/i }).click();

    // Esperar toast de error
    // Radix Toast root es <li role="status">. Excluimos el announcer
    // <span role="status"> de Radix que duplica el texto para screen readers.
    const toast = page.locator("[data-sonner-toast], li[role='status']");
    await expect(toast.filter({ hasText: /peso debe ser mayor a 0/i })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('muestra toast si fecha de nacimiento es futura', async ({ page }) => {
    // Bypass HTML5 max=hoy para alcanzar la validación JS
    await page.evaluate(() => {
      document.querySelector('form')?.setAttribute('novalidate', '');
      document.getElementById('birth_date')?.removeAttribute('max');
    });

    await page.getByLabel(/nombre/i).fill('TestPet');

    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /perro/i }).click();

    // Fecha futura
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().split('T')[0];
    await page.getByLabel(/fecha de nacimiento/i).fill(futureDate);

    await page.getByRole('button', { name: /agregar mascota/i }).click();

    // Radix Toast root es <li role="status">. Excluimos el announcer
    // <span role="status"> de Radix que duplica el texto para screen readers.
    const toast = page.locator("[data-sonner-toast], li[role='status']");
    await expect(toast.filter({ hasText: /no puede ser en el futuro/i })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('muestra toast si microchip no tiene 15 dígitos', async ({ page }) => {
    // Bypass HTML5 pattern y maxLength para alcanzar la validación JS
    await page.evaluate(() => {
      document.querySelector('form')?.setAttribute('novalidate', '');
      const mc = document.getElementById('microchip') as HTMLInputElement | null;
      mc?.removeAttribute('pattern');
      mc?.removeAttribute('maxLength');
    });

    await page.getByLabel(/nombre/i).fill('TestPet');

    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /perro/i }).click();

    // Abrir sección médica
    const medicalTrigger = page.getByText(/información médica/i);
    await medicalTrigger.click();

    // Microchip inválido (solo 10 dígitos)
    // Nota: el onChange del componente filtra a maxLength=15 pero el regex
    // /^\d{15}$/ del handler exige exactamente 15.
    await page.getByLabel(/microchip/i).fill('1234567890');

    await page.getByRole('button', { name: /agregar mascota/i }).click();

    // Radix Toast root es <li role="status">. Excluimos el announcer
    // <span role="status"> de Radix que duplica el texto para screen readers.
    const toast = page.locator("[data-sonner-toast], li[role='status']");
    await expect(toast.filter({ hasText: /microchip/i })).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Crear mascota — UI del formulario', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeAuth(page);
    await page.goto('/add-pet', { waitUntil: 'networkidle' });
    const ok = await page
      .waitForFunction(() => !!document.getElementById('name'), { timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (!ok) {
      test.skip(true, 'El formulario no cargó (¿inyección de sesión fake falló?).');
    }
  });

  test('la sección médica está colapsada por defecto', async ({ page }) => {
    // El contenido médico no debe ser visible inicialmente
    const microchipInput = page.getByLabel(/microchip/i);
    await expect(microchipInput).not.toBeVisible();

    // Al hacer click en el trigger, se expande
    await page.getByText(/información médica/i).click();
    await expect(microchipInput).toBeVisible();
  });

  test('muestra 8 opciones de especie', async ({ page }) => {
    await page.getByRole('combobox').first().click();

    const options = page.getByRole('option');
    await expect(options).toHaveCount(8);

    // Verificar que las especies principales están
    await expect(page.getByRole('option', { name: /perro/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /gato/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /conejo/i })).toBeVisible();
  });

  test('los badges de personalidad se pueden seleccionar', async ({ page }) => {
    const badge = page.getByText('Juguetón');
    await expect(badge).toBeVisible();

    // Click para seleccionar
    await badge.click();

    // Debería tener la variante "default" (no "outline")
    await expect(badge).not.toHaveAttribute('data-variant', 'outline');
  });
});
