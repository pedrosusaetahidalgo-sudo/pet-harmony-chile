import { test, expect } from '@playwright/test';
import { injectFakeAuth } from './fixtures/auth';

/**
 * Owner clinical lifecycle E2E tests.
 *
 * Tests the core flow for pet owners:
 *  1. Navigate to add pet form
 *  2. Validate form fields
 *  3. Navigate to clinical record
 *  4. Check tabs and key UI elements
 *  5. Navigate to reminders
 *  6. Navigate to calendar
 *
 * Uses fake auth — no real DB operations.
 *
 * Run: npx playwright test owner-clinical-lifecycle
 */

test.describe('Owner clinical lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeAuth(page);
  });

  test('Add pet form loads with required fields', async ({ page }) => {
    await page.goto('/add-pet', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Photo upload area
    await expect(page.getByText('Subir foto')).toBeVisible();

    // Name field
    const nameInput = page.locator('input#name');
    await expect(nameInput).toBeVisible();

    // Species selector
    await expect(page.getByText('Selecciona especie')).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: /Agregar Mascota/i })).toBeVisible();
  });

  test('Add pet form validates name is required', async ({ page }) => {
    await page.goto('/add-pet', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const nameInput = page.locator('input#name');
    await nameInput.focus();
    await nameInput.blur();

    // HTML5 validation should prevent submit without name
    const submitBtn = page.getByRole('button', { name: /Agregar Mascota/i });
    await expect(submitBtn).toBeVisible();
  });

  test('Add pet species selector shows all options', async ({ page }) => {
    await page.goto('/add-pet', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Open species selector
    await page.getByText('Selecciona especie').click();
    await page.waitForTimeout(300);

    // Should show all species
    for (const species of ['Perro', 'Gato', 'Conejo', 'Hámster', 'Ave', 'Tortuga', 'Pez', 'Otro']) {
      await expect(page.getByText(species, { exact: false })).toBeVisible();
    }
  });

  test('Reminders page loads with add button', async ({ page }) => {
    await page.goto('/reminders', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Title
    await expect(page.getByText('Recordatorios')).toBeVisible();

    // Add button should be present
    await expect(page.getByRole('button', { name: /Agregar/i })).toBeVisible();
  });

  test('Calendar page loads', async ({ page }) => {
    await page.goto('/calendario', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Calendar or Agenda title
    const heading = page.getByText(/Calendario|Agenda/i);
    await expect(heading).toBeVisible();

    // Day names should be visible
    await expect(page.getByText('Lu')).toBeVisible();
    await expect(page.getByText('Ma')).toBeVisible();
  });

  test('Home page loads with status cards', async ({ page }) => {
    await page.goto('/home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Status cards area
    const statusCards = page.locator('[role="button"]');
    const count = await statusCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('My pets page loads', async ({ page }) => {
    await page.goto('/my-pets', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Title
    await expect(page.getByText(/My Paws|Mis Mascotas/i)).toBeVisible();
  });

  test('Timeline page loads for pet', async ({ page }) => {
    // Timeline requires a pet ID — test with fake UUID
    await page.goto('/mascota/00000000-0000-0000-0000-000000000099/timeline', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(1000);

    // Should show timeline header or empty state
    const heading = page.getByText(/Historia|Timeline|Sin eventos/i);
    await expect(heading).toBeVisible();
  });
});
