import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import { logger } from "@/lib/logger";

// Dynamic import for Capacitor Google Auth (only available on native)
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic plugin with no shared type
let GoogleAuth: Record<string, (...args: unknown[]) => Promise<unknown>> | null = null;

// Check if we're on a native platform and load the plugin
const initGoogleAuth = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const module = await import("@codetrix-studio/capacitor-google-auth");
      GoogleAuth = module.GoogleAuth;
      
      // Initialize with configuration
      await GoogleAuth.initialize({
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID_WEB || '',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    } catch (error) {
      logger.debug('Google Auth plugin not available:', error);
    }
  }
};

// Initialize on module load
initGoogleAuth();

interface GoogleAuthResult {
  success: boolean;
  error?: string;
}

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Sign in with Google - handles both web and native platforms
   */
  const signInWithGoogle = useCallback(async (): Promise<GoogleAuthResult> => {
    setLoading(true);

    try {
      // TEMPORARY: Force web OAuth flow for testing (no SHA-1 required)
      // TODO: Re-enable native flow after adding SHA-1 to Google Cloud Console
      const FORCE_WEB_OAUTH = true; // Set to false to use native flow when SHA-1 is configured
      
      const isNative = Capacitor.isNativePlatform();

      if (isNative && GoogleAuth && !FORCE_WEB_OAUTH) {
        // Native flow using Capacitor plugin (requires SHA-1 fingerprint)
        return await handleNativeGoogleAuth();
      } else {
        // Web flow using Supabase OAuth (works without SHA-1)
        return await handleWebGoogleAuth();
      }
    } catch (error: unknown) {
      console.error('Google Sign-In error:', error);

      const errorMessage = getErrorMessage(error);
      toast({
        title: "Error al iniciar sesión con Google",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Handle Google Auth on native platforms (Android/iOS)
   */
  const handleNativeGoogleAuth = async (): Promise<GoogleAuthResult> => {
    try {
      // Sign in with Google native SDK
      const googleUser = await GoogleAuth.signIn();
      
      if (!googleUser?.authentication?.idToken) {
        throw new Error('No se pudo obtener el token de Google');
      }

      // Sign in to Supabase with the Google ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: googleUser.authentication.idToken,
        access_token: googleUser.authentication.accessToken,
      });

      if (error) throw error;

      if (data.session) {
        toast({
          title: "¡Bienvenido!",
          description: `Has iniciado sesión como ${googleUser.email}`,
        });
        return { success: true };
      }

      throw new Error('No se pudo crear la sesión');
    } catch (error: unknown) {
      // Handle user cancellation gracefully
      const err = error as { message?: string; code?: string };
      if (err.message?.includes('popup_closed') ||
          err.message?.includes('cancelled') ||
          err.code === '12501') {
        return { success: false, error: 'Inicio de sesión cancelado' };
      }
      throw error;
    }
  };

  /**
   * Handle Google Auth on web platform
   */
  const handleWebGoogleAuth = async (): Promise<GoogleAuthResult> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;

    // OAuth redirect will happen, return success
    // Actual auth state change will be handled by onAuthStateChange
    return { success: true };
  };

  /**
   * Sign out from Google (native only)
   */
  const signOutGoogle = useCallback(async () => {
    if (Capacitor.isNativePlatform() && GoogleAuth) {
      try {
        await GoogleAuth.signOut();
      } catch (error) {
        logger.warn('Google sign out error:', error);
      }
    }
  }, []);

  /**
   * Refresh Google tokens (native only)
   */
  const refreshGoogleToken = useCallback(async () => {
    if (Capacitor.isNativePlatform() && GoogleAuth) {
      try {
        const result = await GoogleAuth.refresh();
        return result?.authentication?.idToken;
      } catch (error) {
        logger.warn('Token refresh error:', error);
        return null;
      }
    }
    return null;
  }, []);

  return {
    signInWithGoogle,
    signOutGoogle,
    refreshGoogleToken,
    loading,
  };
};

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: unknown): string {
  const err = error as { message?: string };
  const message = err?.message || String(error) || '';
  
  if (message.includes('popup_closed') || message.includes('cancelled')) {
    return 'Inicio de sesión cancelado por el usuario';
  }
  if (message.includes('network')) {
    return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
  }
  if (message.includes('provider is not enabled')) {
    return 'Google Sign-In no está habilitado. Contacta al administrador.';
  }
  if (message.includes('invalid_grant')) {
    return 'La sesión de Google expiró. Intenta de nuevo.';
  }
  
  return 'No se pudo iniciar sesión con Google. Intenta de nuevo.';
}
