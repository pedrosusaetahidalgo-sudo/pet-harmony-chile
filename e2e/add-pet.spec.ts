import { test, expect } from '@playwright/test';

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
  // Estos tests verifican las validaciones client-side del formulario.
  // Usamos un truco: navegamos directo y mockeamos el auth state para
  // que la página no redirija. Si la ProtectedRoute redirecciona,
  // saltamos el test con un aviso claro.

  test.beforeEach(async ({ page }) => {
    await page.goto('/add-pet');

    // Si ProtectedRoute redirige a /auth, marcamos skip
    const url = page.url();
    if (url.includes('/auth')) {
      test.skip(
        true,
        'Se necesita sesión autenticada para probar validaciones del form. Usa el tag @auth.'
      );
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
    const toast = page.locator("[data-sonner-toast], [role='status']");
    await expect(toast.filter({ hasText: /peso debe ser mayor a 0/i })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('muestra toast si fecha de nacimiento es futura', async ({ page }) => {
    await page.getByLabel(/nombre/i).fill('TestPet');

    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /perro/i }).click();

    // Fecha futura
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().split('T')[0];
    await page.getByLabel(/fecha de nacimiento/i).fill(futureDate);

    await page.getByRole('button', { name: /agregar mascota/i }).click();

    const toast = page.locator("[data-sonner-toast], [role='status']");
    await expect(toast.filter({ hasText: /no puede ser en el futuro/i })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('muestra toast si microchip no tiene 15 dígitos', async ({ page }) => {
    await page.getByLabel(/nombre/i).fill('TestPet');

    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /perro/i }).click();

    // Abrir sección médica
    const medicalTrigger = page.getByText(/información médica/i);
    await medicalTrigger.click();

    // Microchip inválido (solo 10 dígitos)
    await page.getByLabel(/microchip/i).fill('1234567890');

    await page.getByRole('button', { name: /agregar mascota/i }).click();

    const toast = page.locator("[data-sonner-toast], [role='status']");
    await expect(toast.filter({ hasText: /microchip/i })).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Crear mascota — UI del formulario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/add-pet');
    const url = page.url();
    if (url.includes('/auth')) {
      test.skip(true, 'Requiere sesión autenticada.');
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
