import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.pawfriend.app',
  appName: 'Paw Friend',
  // OJO: Vite buildea a `docs/` (config para GitHub Pages en vite.config.ts).
  // Capacitor debe leer desde el mismo directorio que el web build.
  webDir: 'docs',
  // For development with live reload, uncomment the server section:
  // server: {
  //   url: 'https://9c3ef547-1a05-4427-a6e6-d3f86a6365e3.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  android: {
    buildOptions: {
      keystorePath: 'pawfriend-release-key.keystore',
      keystoreAlias: 'pawfriend',
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#8B5CF6',
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
      serverClientId: '811742672720-riinj9cddioietprfcb2jfuq9njenkg6.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
