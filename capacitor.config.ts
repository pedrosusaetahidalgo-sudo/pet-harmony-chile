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
      // Web Client ID — must match the one in Supabase Dashboard > Auth > Google provider
      // Android & iOS use their own Client IDs via google-services.json / GoogleService-Info.plist
      serverClientId: '1007342168950-ouurre5dhhaup6cb1nfthff587ifo0h4.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    FacebookLogin: {
      // Permissions to request from the user
      permissions: ['email', 'public_profile'],
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    FirebaseAnalytics: {
      // Automatic screen tracking disabled — we handle it manually
      collectionEnabled: true,
      sessionTimeoutDuration: 1800, // 30 minutes
    },
  },
};

export default config;
