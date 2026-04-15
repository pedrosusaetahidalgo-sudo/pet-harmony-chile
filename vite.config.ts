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
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-accordion',
            '@radix-ui/react-avatar',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-toast',
            '@radix-ui/react-switch',
          ],
          // Sacar lucide del bundle principal: las ~150 keb de íconos viven
          // en su propio chunk y se cachean independientemente.
          'icons-vendor': ['lucide-react'],
          // date-fns es pesado y se usa transversalmente.
          'date-vendor': ['date-fns'],
          // Supabase client + auth listener.
          'supabase-vendor': ['@supabase/supabase-js'],
          // Leaflet solo se usa en /maps (lazy). Chunk separado para no inflar index.
          'leaflet-vendor': ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
}));
