import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { isNative } from '@/lib/platform';
import { logger } from '@/lib/logger';

interface AppleAuthResult {
  success: boolean;
  error?: string;
}

export const useAppleAuth = () => {
  const [loading, setLoading] = useState(false);

  const signInWithApple = useCallback(async (): Promise<AppleAuthResult> => {
    setLoading(true);

    try {
      if (Capacitor.isNativePlatform()) {
        return await handleNativeAppleAuth();
      } else {
        return await handleWebAppleAuth();
      }
    } catch (error: unknown) {
      logger.error('Apple Sign-In error:', error);
      const errorMessage = getErrorMessage(error);
      toast.error('Error al iniciar sesión con Apple', { description: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Native flow: uses Apple Sign-In plugin on iOS (and Android if supported)
   */
  const handleNativeAppleAuth = async (): Promise<AppleAuthResult> => {
    try {
      const module = await import('@capacitor-community/apple-sign-in');
      const SignInWithApple = module.SignInWithApple;

      const result = await SignInWithApple.authorize({
        clientId: 'cl.pawfriend.app',
        redirectURI: 'https://gwailbjlvevkhwcrovfd.supabase.co/auth/v1/callback',
        scopes: 'email name',
      });

      if (!result.response?.identityToken) {
        return { success: false, error: 'No se pudo obtener el token de Apple' };
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: result.response.identityToken,
        nonce: (result.response as Record<string, string>).nonce || undefined,
      });

      if (error) throw error;

      if (data.session) {
        toast('¡Bienvenido!', { description: 'Has iniciado sesión con Apple' });
        return { success: true };
      }

      throw new Error('No se pudo crear la sesión');
    } catch (error: unknown) {
      const err = error as { message?: string; code?: number };
      if (err.code === 1001 || err.message?.includes('cancel')) {
        return { success: false, error: 'Inicio de sesión cancelado' };
      }
      throw error;
    }
  };

  /**
   * Web flow: uses Supabase OAuth redirect (requires Apple configured in Supabase)
   */
  const handleWebAppleAuth = async (): Promise<AppleAuthResult> => {
    const redirectTo = isNative()
      ? 'cl.pawfriend.app://auth/callback'
      : `${window.location.origin}/auth`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
      },
    });

    if (error) throw error;
    return { success: true };
  };

  return {
    signInWithApple,
    loading,
  };
};

function getErrorMessage(error: unknown): string {
  const message = (error instanceof Error ? error.message : String(error)) || '';

  if (message.includes('cancel') || message.includes('1001')) {
    return 'Inicio de sesión cancelado por el usuario';
  }
  if (message.includes('network')) {
    return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
  }
  if (message.includes('provider is not enabled')) {
    return 'Apple Sign-In no está habilitado. Contacta al administrador.';
  }

  return 'No se pudo iniciar sesión con Apple. Intenta de nuevo.';
}
