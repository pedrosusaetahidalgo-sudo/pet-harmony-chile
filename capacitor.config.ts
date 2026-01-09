import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.pawfriend.app',
  appName: 'Paw Friend',
  webDir: 'dist',
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
