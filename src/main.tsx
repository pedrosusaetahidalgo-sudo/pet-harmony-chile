import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from 'next-themes';
import { initSentry } from './lib/sentry';
import { initAnalytics } from './lib/analytics';
import { initConsoleInterceptor } from './lib/consoleInterceptor';
import { logger } from './lib/logger';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';
import './lib/leafletConfig';

initSentry();
initAnalytics();
initConsoleInterceptor();

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection:', event.reason);
});

// Auto-reload si un chunk dinámico ya no existe (deploy nuevo + HTML stale en cache).
// Solo recarga una vez por sesión para evitar loops.
const CHUNK_KEY = 'chunk-reload';
function handleChunkError() {
  if (sessionStorage.getItem(CHUNK_KEY) === '1') return;
  sessionStorage.setItem(CHUNK_KEY, '1');
  window.location.reload();
}
window.addEventListener('vite:preloadError', handleChunkError);
window.addEventListener('error', (e) => {
  if (
    e.message?.includes('Failed to fetch dynamically imported module') ||
    e.message?.includes('Importing a module script failed')
  ) {
    handleChunkError();
  }
});

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    {/* defaultTheme="light": el dark mode es opt-in via ThemeToggle en
        Header. NO respetamos automáticamente la preferencia del OS
        (prefers-color-scheme) porque muchos users tienen iOS en dark
        auto y abrir la app en dark sin haber elegido rompe expectativa
        (reporte Pedro 2026-04-20). enableSystem queda en false por lo
        mismo — si el user elige "system" desde Settings, respetará OS,
        pero no arranca ahí. */}
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="pf_theme"
    >
      <App />
    </ThemeProvider>
  </HelmetProvider>
);
