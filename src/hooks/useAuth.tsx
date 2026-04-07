import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Subscribe primero (best practice supabase)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    // Get session existente
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      logger.warn("[useAuth] getSession failed:", err);
      if (mounted) setLoading(false);
    });

    // CRÍTICO: timeout de seguridad. Si getSession se cuelga (red lenta,
    // mobile WebView, etc.), forzar loading=false a los 3s para que
    // ProtectedRoute deje de mostrar spinner. Si no hay sesión, va a /auth.
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading((current) => {
          if (current) {
            logger.warn("[useAuth] timeout — forcing loading=false");
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
      logger.error("Error signing out:", error);
    }
  };

  return { user, session, loading, signOut };
};
