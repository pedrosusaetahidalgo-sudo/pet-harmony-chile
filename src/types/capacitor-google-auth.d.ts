// Type shim for @codetrix-studio/capacitor-google-auth.
// The plugin does not ship its own types in our installed version, so we
// declare the minimal surface we use in src/hooks/useGoogleAuth.tsx.
declare module '@codetrix-studio/capacitor-google-auth' {
  export interface GoogleAuthUser {
    authentication: {
      idToken: string;
      accessToken: string;
    };
    email: string;
    name?: string;
    imageUrl?: string;
  }

  export interface GoogleAuthInitOptions {
    clientId?: string;
    scopes?: string[];
    grantOfflineAccess?: boolean;
  }

  export const GoogleAuth: {
    initialize(options?: GoogleAuthInitOptions): Promise<void>;
    signIn(): Promise<GoogleAuthUser>;
    signOut(): Promise<void>;
    refresh(): Promise<{
      idToken: string;
      accessToken: string;
      authentication?: { idToken: string; accessToken: string };
    }>;
  };
}
