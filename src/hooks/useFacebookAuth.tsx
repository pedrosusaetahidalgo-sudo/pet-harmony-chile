import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { isNative } from '@/lib/platform';
import { logger } from '@/lib/logger';

interface FacebookAuthResult {
  success: boolean;
  error?: string;
}

// Dynamic import for native Facebook SDK (only available on native)
let FacebookLogin: typeof import('@capacitor-community/facebook-login').FacebookLogin | null = null;

const initFacebookAuth = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const module = await import('@capacitor-community/facebook-login');
      FacebookLogin = module.FacebookLogin;
      await FacebookLogin.initialize({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
      });
    } catch (error) {
      logger.debug('Facebook Login plugin not available:', error);
    }
  }
};

initFacebookAuth();

export const useFacebookAuth = () => {
  const [loading, setLoading] = useState(false);

  const signInWithFacebook = useCallback(async (): Promise<FacebookAuthResult> => {
    setLoading(true);

    try {
      if (Capacitor.isNativePlatform() && FacebookLogin) {
        return await handleNativeFacebookAuth();
      } else {
        return await handleWebFacebookAuth();
      }
    } catch (error: unknown) {
      logger.error('Facebook Sign-In error:', error);
      const errorMessage = getErrorMessage(error);
      toast.error('Error al iniciar sesión con Facebook', { description: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Native flow: uses Facebook SDK on Android/iOS and passes token to Supabase
   */
  const handleNativeFacebookAuth = async (): Promise<FacebookAuthResult> => {
    try {
      const result = await FacebookLogin!.login({ permissions: ['email', 'public_profile'] });

      if (!result.accessToken?.token) {
        return { success: false, error: 'Inicio de sesión cancelado' };
      }

      // Sign in to Supabase with the Facebook access token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'facebook',
        token: result.accessToken.token,
      });

      if (error) throw error;

      if (data.session) {
        toast('¡Bienvenido!', { description: 'Has iniciado sesión con Facebook' });
        return { success: true };
      }

      throw new Error('No se pudo crear la sesión');
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message?.includes('cancel') || err.message?.includes('USER_CANCELLATION')) {
        return { success: false, error: 'Inicio de sesión cancelado' };
      }
      throw error;
    }
  };

  /**
   * Web flow: uses Supabase OAuth redirect
   */
  const handleWebFacebookAuth = async (): Promise<FacebookAuthResult> => {
    const redirectTo = isNative()
      ? 'cl.pawfriend.app://auth/callback'
      : `${window.location.origin}/auth`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo,
        scopes: 'email',
      },
    });

    if (error) throw error;
    return { success: true };
  };

  return {
    signInWithFacebook,
    loading,
  };
};

function getErrorMessage(error: unknown): string {
  const message = (error instanceof Error ? error.message : String(error)) || '';

  if (
    message.includes('popup_closed') ||
    message.includes('cancelled') ||
    message.includes('cancel')
  ) {
    return 'Inicio de sesión cancelado por el usuario';
  }
  if (message.includes('network')) {
    return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
  }
  if (message.includes('provider is not enabled')) {
    return 'Facebook Sign-In no está habilitado. Contacta al administrador.';
  }

  return 'No se pudo iniciar sesión con Facebook. Intenta de nuevo.';
}
