import { test, expect } from '@playwright/test';

/**
 * Smoke tests: Rutas protegidas (requieren auth)
 * Sin sesión → deben redirigir a /auth.
 * Con sesión → deben cargar sin crash.
 *
 * Cobertura 2026-04-19: 30+ rutas protegidas (dueño + provider + admin).
 * No prueban lógica de negocio, solo que ProtectedRoute funciona y no crashean.
 */

const PROTECTED_ROUTES = [
  // Core dueño
  { path: '/home', name: 'Dashboard principal' },
  { path: '/my-pets', name: 'Mis mascotas' },
  { path: '/add-pet', name: 'Agregar mascota' },
  { path: '/edit-pet/test-dummy-id', name: 'Editar mascota' },
  { path: '/ficha/test-dummy-id', name: 'Ficha clínica' },
  { path: '/medical-records', name: 'Registros médicos (legacy redirect)' },
  // Ficha clinica
  { path: '/reminders', name: 'Recordatorios' },
  { path: '/rutinas', name: 'Rutinas' },
  { path: '/calendario', name: 'Calendario unificado' },
  // Causas
  { path: '/adoption', name: 'Adopción' },
  { path: '/donantes-sangre', name: 'Donantes de sangre' },
  { path: '/en-memoria', name: 'En memoria (memorial)' },
  // Social (hoy con FeatureGuard redirect)
  { path: '/feed', name: 'Feed social' },
  { path: '/comunidad', name: 'Comunidad / Grupos' },
  { path: '/chat', name: 'Mensajes' },
  // Servicios
  { path: '/servicios', name: 'Directorio servicios' },
  { path: '/services/walkers', name: 'Paseadores' },
  { path: '/services/sitters', name: 'Cuidadores' },
  { path: '/services/trainers', name: 'Entrenadores' },
  { path: '/services/groomers', name: 'Peluqueros' },
  { path: '/peluquero/perfil', name: 'Perfil peluquero' },
  { path: '/maps', name: 'Mapa de servicios' },
  // Perfil y cuenta
  { path: '/profile', name: 'Mi perfil' },
  { path: '/user/test-dummy-id', name: 'Perfil de otro usuario' },
  { path: '/settings', name: 'Configuración (redirect)' },
  // Monetizacion (/donaciones y /paw-core son publicas desde 2026-04-19)
  { path: '/paw-member', name: 'Paw Member (aporte personal)' },
  { path: '/upgrade', name: 'Upgrade (redirect a paw-member)' },
  // Gamificacion
  { path: '/paw-game', name: 'Paw Game' },
  { path: '/paw-collection', name: 'Paw Collection' },
  { path: '/misiones', name: 'Misiones' },
  // Reservas + reportes
  { path: '/mis-reservas', name: 'Mis reservas' },
  { path: '/reportes', name: 'Reportes' },
  { path: '/panel-pro', name: 'Panel Pro (analytics)' },
  // Onboarding (huerfanos intencionalmente)
  { path: '/onboarding-mascota', name: 'Onboarding dueño minimal' },
  { path: '/onboarding-vet', name: 'Onboarding vet minimal' },
  // Provider
  { path: '/provider/dashboard', name: 'Dashboard proveedor' },
  { path: '/provider/pacientes', name: 'Pacientes proveedor' },
  { path: '/provider/profile-edit', name: 'Editar perfil proveedor' },
  // Admin only
  { path: '/admin', name: 'Panel admin' },
  { path: '/analytics-demo', name: 'Analytics demo (admin)' },
  { path: '/demo', name: 'Demo admin' },
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
