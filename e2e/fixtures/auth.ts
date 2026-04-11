import { Page } from '@playwright/test';

/**
 * Inyecta una sesión fake de Supabase en localStorage ANTES de cualquier
 * navegación. Útil para tests de UI/validaciones del formulario que solo
 * necesitan engañar a `ProtectedRoute` (no van a hacer queries reales).
 *
 * Cómo funciona:
 *   - supabase-js v2 lee la sesión desde `localStorage` con la clave
 *     `sb-<project-ref>-auth-token`. La clave se calcula a partir del
 *     subdominio de VITE_SUPABASE_URL.
 *   - Si la sesión existe y `expires_at` está en el futuro, getSession()
 *     la devuelve sin tocar la red. Eso satisface a `useAuth().user`.
 *   - El access_token es un string cualquiera porque estos tests NO van
 *     a llamar a la API. Si un test intenta INSERT/SELECT, fallará y hay
 *     que dejarlo así (no es un test de UI puro).
 *
 * Uso desde un test:
 *
 *   import { injectFakeAuth } from './fixtures/auth';
 *
 *   test.beforeEach(async ({ page }) => {
 *     await injectFakeAuth(page);
 *     await page.goto('/add-pet');
 *   });
 */
export async function injectFakeAuth(
  page: Page,
  opts: { projectRef?: string; userId?: string; email?: string } = {}
): Promise<void> {
  // Project ref del .env del repo (gwailbjlvevkhwcrovfd). Si en CI cambia
  // el supabase URL, hay que pasar `projectRef` por parámetro.
  const projectRef = opts.projectRef ?? 'gwailbjlvevkhwcrovfd';
  const userId = opts.userId ?? '00000000-0000-0000-0000-000000000001';
  const email = opts.email ?? 'playwright@pawfriend.local';

  const storageKey = `sb-${projectRef}-auth-token`;

  // Sesión válida por 1 hora
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;

  const fakeSession = {
    access_token: 'fake-playwright-access-token',
    refresh_token: 'fake-playwright-refresh-token',
    expires_in: 3600,
    expires_at: expiresAt,
    token_type: 'bearer',
    user: {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  await page.addInitScript(
    ({ key, session }) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(session));
      } catch {
        // localStorage puede no estar disponible aún en about:blank;
        // se vuelve a llamar al cargar la página real.
      }
    },
    { key: storageKey, session: fakeSession }
  );
}
