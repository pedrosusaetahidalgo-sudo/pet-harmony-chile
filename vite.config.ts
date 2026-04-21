import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: '/', // Custom domain pawfriend.cl — no subdirectory needed
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [react(), visualizer({ filename: 'stats.html', gzipSize: true, brotliSize: true })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'docs',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendors: agrupaciones por librería.
          if (id.includes('node_modules')) {
            if (
              id.includes('react-router-dom') ||
              id.includes('react-dom') ||
              /react\/[^/]+$/.test(id) ||
              id.includes('node_modules/react/')
            ) {
              return 'react-vendor';
            }
            if (id.includes('@tanstack/react-query')) return 'query-vendor';
            if (id.includes('@radix-ui/')) return 'ui-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
            if (id.includes('date-fns')) return 'date-vendor';
            if (id.includes('@supabase/supabase-js')) return 'supabase-vendor';
            if (id.includes('leaflet')) return 'leaflet-vendor';
            if (id.includes('recharts')) return 'recharts-vendor';
            if (id.includes('@sentry/')) return 'sentry-vendor';
            // Resto de vendors: un chunk "misc" para no fragmentar demasiado.
            return 'vendor-misc';
          }

          // Role-based code splitting (H.4 auditoría top-tier 2026-04-20):
          // owners no descargan chunks de admin/provider/shelter hasta
          // que navegan a esas rutas.
          if (id.includes('/src/components/admin/') || id.includes('/src/pages/Admin.')) {
            return 'app-admin';
          }
          if (
            id.includes('/src/components/provider/') ||
            id.includes('/src/pages/Provider') ||
            id.includes('/src/pages/PerfilVetPublico') ||
            id.includes('/src/pages/RegistroVeterinario') ||
            id.includes('/src/pages/ParaVeterinarios') ||
            id.includes('/src/pages/PreciosVeterinarios') ||
            id.includes('/src/pages/DirectorioVets')
          ) {
            return 'app-provider';
          }
          if (
            id.includes('/src/pages/shelter/') ||
            id.includes('/src/pages/RefugiosHogares') ||
            id.includes('/src/pages/RefugioPublico') ||
            id.includes('/src/pages/OnboardingShelter')
          ) {
            return 'app-shelter';
          }
          // Pitch / aplicar / transparencia / paw-companys / paw-voices:
          // páginas "institucionales" que pocos users abren regularmente.
          if (
            id.includes('/src/pages/Aplicar') ||
            id.includes('/src/pages/Transparencia') ||
            id.includes('/src/pages/PawCore') ||
            id.includes('/src/pages/PawCompanysPage') ||
            id.includes('/src/pages/PawVoices') ||
            id.includes('/src/pages/PawPartners')
          ) {
            return 'app-institutional';
          }

          return undefined; // resto queda en index/lazy chunks por defecto.
        },
      },
    },
  },
}));
