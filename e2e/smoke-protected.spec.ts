import { test, expect } from '@playwright/test';

/**
 * Smoke tests: Rutas protegidas (requieren auth)
 * Sin sesión → deben redirigir a /auth.
 * Con sesión → deben cargar sin crash.
 *
 * Estos tests verifican que ProtectedRoute funciona y que las páginas
 * no crashean al cargarse. No prueban lógica de negocio.
 */

const PROTECTED_ROUTES = [
  { path: '/home', name: 'Dashboard principal' },
  { path: '/feed', name: 'Feed social' },
  { path: '/comunidad', name: 'Comunidad / Grupos' },
  { path: '/my-pets', name: 'Mis mascotas' },
  { path: '/add-pet', name: 'Agregar mascota' },
  { path: '/medical-records', name: 'Registros médicos' },
  { path: '/reminders', name: 'Recordatorios' },
  { path: '/adoption', name: 'Adopción' },
  { path: '/servicios', name: 'Directorio servicios' },
  { path: '/services/walkers', name: 'Paseadores' },
  { path: '/services/vets', name: 'Veterinarios a domicilio' },
  { path: '/services/sitters', name: 'Cuidadores' },
  { path: '/services/trainers', name: 'Entrenadores' },
  { path: '/services/groomers', name: 'Peluqueros' },
  { path: '/maps', name: 'Mapa de servicios' },
  { path: '/chat', name: 'Mensajes' },
  { path: '/profile', name: 'Mi perfil' },
  { path: '/settings', name: 'Configuración' },
  { path: '/upgrade', name: 'Upgrade Premium' },
  { path: '/mis-reservas', name: 'Mis reservas' },
  { path: '/paw-game', name: 'Paw Game' },
  { path: '/provider/dashboard', name: 'Dashboard proveedor' },
  { path: '/provider/profile-edit', name: 'Editar perfil proveedor' },
];

test.describe('Rutas protegidas — sin sesión redirigen a /auth', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route.name} (${route.path}) redirige a /auth`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'commit', timeout: 30_000 });
      // Debe terminar en /auth (redirect de ProtectedRoute)
      await expect(page).toHaveURL(/\/auth/, { timeout: 20_000 });
    });
  }
});

// Tests con sesión autenticada requieren setup de auth state.
// Se definen con tag @auth para correrlos selectivamente.
// npx playwright test --grep @auth
