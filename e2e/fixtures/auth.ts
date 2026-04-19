import { Page } from '@playwright/test';

/**
 * Inyecta una sesión fake de Supabase en localStorage ANTES de cualquier
 * navegación. Útil para tests de UI/validaciones del formulario que solo
 * necesitan engañar a `ProtectedRoute` (no van a hacer queries reales).
 *
 * Cómo funciona:
 *   - El cliente Supabase del repo configura `storageKey: 'pf-auth-v1'`
 *     (ver src/integrations/supabase/client.ts). Esa es la key real
 *     donde supabase-js busca la sesión persistida.
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
  opts: { storageKey?: string; userId?: string; email?: string } = {}
): Promise<void> {
  // Storage key debe coincidir con la del cliente Supabase real
  // (src/integrations/supabase/client.ts → storageKey: 'pf-auth-v1').
  const storageKey = opts.storageKey ?? 'pf-auth-v1';
  const userId = opts.userId ?? '00000000-0000-0000-0000-000000000001';
  const email = opts.email ?? 'playwright@pawfriend.local';

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
        window.localStorage.setItem('pf_cookie_consent', 'accepted');
      } catch {
        // localStorage puede no estar disponible aún en about:blank;
        // se vuelve a llamar al cargar la página real.
      }
    },
    { key: storageKey, session: fakeSession }
  );
}
