import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { identify, resetAnalytics } from '@/lib/analytics';

function identifyFromSession(session: Session | null): void {
  const u = session?.user;
  if (!u) {
    resetAnalytics();
    return;
  }
  identify(u.id, {
    email: u.email ?? undefined,
    created_at: u.created_at,
    provider: u.app_metadata?.provider,
  });
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Subscribe primero (best practice supabase)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
      if (event === 'SIGNED_OUT') {
        resetAnalytics();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        identifyFromSession(newSession);
      }
    });

    // Get session existente
    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession } }) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        identifyFromSession(currentSession);
      })
      .catch((err) => {
        logger.warn('[useAuth] getSession failed:', err);
        if (mounted) setLoading(false);
      });

    // CRÍTICO: timeout de seguridad. Si getSession se cuelga (red lenta,
    // mobile WebView, etc.), forzar loading=false a los 3s para que
    // ProtectedRoute deje de mostrar spinner. Si no hay sesión, va a /auth.
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading((current) => {
          if (current) {
            logger.warn('[useAuth] timeout — forcing loading=false');
          }
          return false;
        });
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      logger.error('Error signing out:', error);
    }
  };

  return { user, session, loading, signOut };
};
