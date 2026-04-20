/**
 * Reglas centralizadas de routing y redirecciones de Paw Friend.
 *
 * Este archivo es documental + helper. Las rutas reales viven en `App.tsx`,
 * pero las reglas de a quien dejar entrar y a donde mandarlo cuando algo
 * sale "raro" se concentran aca para evitar inconsistencias.
 *
 * Si modificas estas reglas, actualiza tambien:
 *  - `App.tsx` (donde se aplica `<ProtectedRoute>` / `<PublicWithLayoutIfAuth>`)
 *  - `ProtectedRoute.tsx` (redirige no-auth a `/auth?returnTo=...`)
 *  - `Auth.tsx` (consume `returnTo` post-login)
 *  - `Index.tsx` (redirige usuarios logueados a `/home`)
 */

/**
 * Rutas publicas: cualquiera (con o sin sesion) puede entrar.
 * El layout de app (sidebar + bottom nav) NO se aplica si el user no tiene
 * sesion; si la tiene, algunas rutas igual envuelven con `AppLayout` para
 * sentirse parte de la app.
 */
export const PUBLIC_ROUTES = [
  '/', // Landing (redirige a /home si user logueado)
  '/auth', // Login / signup
  '/terms',
  '/privacy',
  '/para-veterinarios', // Pitch B2B
  '/registro-veterinario', // Onboarding vet
  '/veterinarios', // Directorio publico (SEO)
  '/veterinarios/comuna/:comuna',
  '/veterinarios/especialidad/:especialidad',
  '/veterinarios/:slug', // Perfil publico vet
  '/resena/:token', // Dejar resena via link temporal
  '/demo', // Demo interna
] as const;

/**
 * Rutas protegidas: requieren sesion. Si el user no esta logueado,
 * `<ProtectedRoute>` lo redirige a `/auth?returnTo=<ruta-original>`.
 */
export const PROTECTED_ROUTES = [
  '/home',
  '/feed',
  '/my-pets',
  '/add-pet',
  '/edit-pet/:petId',
  '/ficha/:petId',
  '/medical-records',
  '/adoption',
  '/paw-game',
  '/servicios',
  '/services/:type',
  '/maps',
  '/chat',
  '/chat/:conversationId',
  '/profile',
  '/user/:userId',
  '/settings',
  '/upgrade',
  '/upgrade/success',
  '/upgrade/cancel',
  '/payment-result',
  '/mis-reservas',
  '/peluquero/perfil',
  '/provider/dashboard',
  '/provider/profile-edit',
] as const;

/**
 * Rutas que requieren rol admin (`<AdminRoute>`).
 */
export const ADMIN_ROUTES = ['/admin'] as const;

/**
 * Reglas de redireccion: cuando un user en cierto estado entra a cierta ruta,
 * a donde lo mandamos. Estas reglas se aplican en los componentes destino
 * (no en un middleware central) porque dependen de hooks de React.
 *
 * | Estado          | Ruta entrada       | Destino                       |
 * |-----------------|--------------------|-------------------------------|
 * | NO logueado     | `/`                | (mostrar landing publica)     |
 * | SI logueado     | `/`                | `/home` (Index.tsx redirect)  |
 * | NO logueado     | cualquier protegida| `/auth?returnTo=<original>`   |
 * | NO logueado     | `/auth`            | (mostrar form)                |
 * | SI logueado     | `/auth`            | Muestra form (permite re-auth) |
 * | post-login      | -                  | `returnTo` || rol-default     |
 * | post-logout     | -                  | `/auth`                       |
 * | 404 real        | cualquier sin match| `<NotFound>` con CTAs         |
 */
/**
 * Rutas exclusivas para dueños (owner). Un provider que intente acceder
 * via URL directa sera redirigido a `/provider/dashboard` por RoleGuard.
 */
export const OWNER_ONLY_ROUTES = ['/paw-collection', '/misiones', '/paw-game'] as const;

/**
 * Rutas exclusivas para proveedores. Un owner que intente acceder
 * sera redirigido a `/home` por RoleGuard.
 */
export const PROVIDER_ONLY_ROUTES = [
  '/provider/dashboard',
  '/provider/pacientes',
  '/provider/profile-edit',
  '/panel-pro',
] as const;

/**
 * Rutas exclusivas de refugios/hogares de adopcion. Un owner que intente
 * acceder sera redirigido a /home por ShelterRoute / RoleGuard.
 */
export const SHELTER_ONLY_ROUTES = [
  '/shelter/dashboard',
  '/shelter/pets',
  '/shelter/bulk-import',
  '/shelter/profile',
  '/shelter/donations',
  '/shelter/transfer',
] as const;

/** Check if a path is an owner-only route */
export function isOwnerRoute(path: string): boolean {
  return OWNER_ONLY_ROUTES.some((r) => path.startsWith(r));
}

/** Check if a path is a provider-only route */
export function isProviderRoute(path: string): boolean {
  return PROVIDER_ONLY_ROUTES.some((r) => path.startsWith(r));
}

/** Check if a path is a shelter-only route */
export function isShelterRoute(path: string): boolean {
  return SHELTER_ONLY_ROUTES.some((r) => path.startsWith(r));
}

export const AUTH_REDIRECTS = {
  /** Usuario logueado entra a la landing */
  loggedInOnLanding: '/home',
  /** Default post-login para owners con mascotas */
  ownerWithPets: '/home',
  /** Default post-login para owners sin mascotas */
  ownerWithoutPets: '/add-pet',
  /** Default post-login para vets/providers */
  provider: '/provider/dashboard',
  /** Default post-login para refugios/hogares */
  shelter: '/shelter/dashboard',
  /** Post-logout */
  afterLogout: '/auth',
} as const;
