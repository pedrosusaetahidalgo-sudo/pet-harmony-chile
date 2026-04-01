import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

interface FacebookAuthResult {
  success: boolean;
  error?: string;
}

export const useFacebookAuth = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Sign in with Facebook - handles both web and native platforms
   */
  const signInWithFacebook = useCallback(async (): Promise<FacebookAuthResult> => {
    setLoading(true);

    try {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // For native, use web OAuth flow (Facebook SDK integration can be added later)
        return await handleWebFacebookAuth();
      } else {
        // Web flow using Supabase OAuth
        return await handleWebFacebookAuth();
      }
    } catch (error: any) {
      console.error('Facebook Sign-In error:', error);
      
      const errorMessage = getErrorMessage(error);
      toast({
        title: "Error al iniciar sesión con Facebook",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Handle Facebook Auth on web platform
   */
  const handleWebFacebookAuth = async (): Promise<FacebookAuthResult> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth`,
        scopes: 'email',
      },
    });

    if (error) throw error;

    // OAuth redirect will happen, return success
    // Actual auth state change will be handled by onAuthStateChange
    return { success: true };
  };

  return {
    signInWithFacebook,
    loading,
  };
};

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: any): string {
  const message = error?.message || error?.toString() || '';
  
  if (message.includes('popup_closed') || message.includes('cancelled')) {
    return 'Inicio de sesión cancelado por el usuario';
  }
  if (message.includes('network')) {
    return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
  }
  if (message.includes('provider is not enabled')) {
    return 'Facebook Sign-In no está habilitado. Contacta al administrador.';
  }
  if (message.includes('invalid_grant')) {
    return 'La sesión de Facebook expiró. Intenta de nuevo.';
  }
  
  return 'No se pudo iniciar sesión con Facebook. Intenta de nuevo.';
}

