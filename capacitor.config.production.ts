/**
 * Paw Friend - Capacitor Configuration for PRODUCTION
 * 
 * INSTRUCCIONES:
 * 1. Renombra este archivo a capacitor.config.ts antes de generar el build de producción
 * 2. O copia su contenido a capacitor.config.ts
 * 3. Ejecuta: npm run build && npx cap sync android
 */

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.pawfriend.app',
  appName: 'Paw Friend',
  webDir: 'dist',
  // NO server URL - la app usará los archivos locales empaquetados
  android: {
    buildOptions: {
      keystorePath: 'pawfriend-release-key.keystore',
      keystoreAlias: 'pawfriend',
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#8B5CF6',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#8B5CF6',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '707954104528-87df2bmt6jeaqe9s6h3tjpdrqth3v03r.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
