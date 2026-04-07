import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Dog, Mail } from "@/lib/icons";
import { FaFacebook } from "react-icons/fa";
import { LegalFooter } from "@/components/LegalFooter";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useFacebookAuth } from "@/hooks/useFacebookAuth";
import { track, EVENTS } from "@/lib/analytics";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { toast } = useToast();
  const { signInWithFacebook, loading: facebookLoading } = useFacebookAuth();
  const hasRedirected = useRef(false);

  // Redirect post-login:
  //   1. Si vino con ?returnTo=... → ahí
  //   2. Si es provider (vet/groomer) → /provider/dashboard
  //   3. Si tiene mascotas → /home
  //   4. Si no tiene mascotas → /add-pet (onboarding)
  //
  // NOTA: las queries van envueltas en try/catch y con timeout porque si RLS
  // o la red fallan, antes la función quedaba colgada y el usuario nunca se
  // movía de /auth (bug detectado en mobile simulator + browser PC).
  const redirectUser = async (userId: string) => {
    if (hasRedirected.current) return;

    if (returnTo) {
      hasRedirected.current = true;
      navigate(returnTo);
      return;
    }

    // Helper: timeout para queries que podrían colgarse
    const withTimeout = <T,>(p: Promise<T>, ms = 2500): Promise<T | null> =>
      Promise.race<T | null>([
        p,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
      ]);

    // 1. Provider check (vet del directorio) — si falla, asumimos que no es provider
    let isProvider = false;
    try {
      const result = await withTimeout(
        supabase.from("service_providers").select("id").eq("user_id", userId).maybeSingle()
      );
      isProvider = !!result?.data;
    } catch (err) {
      console.warn("[Auth] provider check failed, fallback owner flow:", err);
    }

    if (hasRedirected.current) return;
    if (isProvider) {
      hasRedirected.current = true;
      navigate("/provider/dashboard");
      return;
    }

    // 2. Owner: con o sin mascotas
    let hasPets = false;
    try {
      const result = await withTimeout(
        supabase.from("pets").select("id").eq("owner_id", userId).limit(1)
      );
      hasPets = !!(result?.data && result.data.length > 0);
    } catch (err) {
      console.warn("[Auth] pets check failed, fallback /home:", err);
    }

    if (hasRedirected.current) return;
    hasRedirected.current = true;
    // Fallback final: si todo falla, mandar a /home (es seguro, ProtectedRoute
    // lo deja pasar si hay sesión).
    navigate(hasPets ? "/home" : "/add-pet");
  };

  useEffect(() => {
    const hasOAuthHash =
      window.location.hash.includes("access_token") ||
      window.location.search.includes("code=");

    // Listener: cuando supabase procesa el hash y emite SIGNED_IN, redirigimos
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === "SIGNED_IN" && newSession && !hasRedirected.current) {
          hasRedirected.current = true;
          window.history.replaceState({}, document.title, window.location.pathname);
          // Hard reload para evitar race con ProtectedRoute
          window.location.href = returnTo || "/home";
        }
      }
    );

    // Si ya hay sesión activa al montar (sin hash), redirigir directo
    if (!hasOAuthHash) {
      supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
        if (existingSession && !hasRedirected.current) {
          hasRedirected.current = true;
          window.location.href = returnTo || "/home";
        }
      }).catch(() => { /* silent */ });
    }

    // Si hay hash OAuth pero supabase tarda mucho en procesarlo, fallback a 5s
    const oauthTimeout = hasOAuthHash
      ? setTimeout(async () => {
          if (hasRedirected.current) return;
          const { data: { session } } = await supabase.auth.getSession();
          if (session && !hasRedirected.current) {
            hasRedirected.current = true;
            window.history.replaceState({}, document.title, window.location.pathname);
            window.location.href = returnTo || "/home";
          } else if (!session) {
            toast({
              title: "Error en autenticación con Google",
              description: "No pudimos completar el login. Intenta nuevamente.",
              variant: "destructive",
            });
          }
        }, 5000)
      : null;

    return () => {
      subscription.unsubscribe();
      if (oauthTimeout) clearTimeout(oauthTimeout);
    };
  }, [navigate, toast, returnTo]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || email.split("@")[0]
          }
        }
      });

      if (error) throw error;

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // User created but no session = email confirmation required
        setConfirmationSent(true);
        toast({
          title: "¡Revisa tu correo!",
          description: "Te enviamos un enlace de confirmación a " + email,
        });
      } else if (data.session) {
        // Email confirmation disabled, user is logged in directly
        track({ event: EVENTS.SIGNUP_COMPLETED, userId: data.user?.id });
        toast({
          title: "¡Cuenta creada!",
          description: "Bienvenido a Paw Friend",
        });
        // Hard reload para evitar race condition con useAuth + ProtectedRoute.
        // Usuario nuevo siempre va a /add-pet (onboarding).
        window.location.href = returnTo || "/add-pet";
        return;
      }
    } catch (error: any) {
      let message = error.message;
      if (message.includes("already registered")) {
        message = "Este email ya está registrado. Intenta iniciar sesión.";
      } else if (message.includes("password")) {
        message = "La contraseña debe tener al menos 6 caracteres.";
      }
      toast({
        title: "Error al crear cuenta",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      track({ event: EVENTS.LOGIN_COMPLETED });
      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión exitosamente",
      });

      // CRÍTICO: usar window.location.href en vez de navigate() para forzar
      // un page reload completo. Esto evita la race condition entre el listener
      // de useAuth (que actualiza el user state) y ProtectedRoute (que chequea
      // ese user state). Con reload, useAuth lee la sesión fresca de
      // localStorage al montar, y ProtectedRoute la encuentra.
      if (data.session?.user?.id) {
        // Decidir destino: returnTo > provider dashboard > home
        let dest = returnTo || "/home";
        try {
          // Quick check provider (con timeout corto para no demorar)
          const result = await Promise.race<{ data: { id: string } | null } | null>([
            supabase
              .from("service_providers")
              .select("id")
              .eq("user_id", data.session.user.id)
              .maybeSingle(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
          ]);
          if (!returnTo && result?.data) dest = "/provider/dashboard";
        } catch {
          /* ignore */
        }
        window.location.href = dest;
        return;
      }
    } catch (error: any) {
      let message = error.message;
      if (message.includes("Invalid login credentials")) {
        message = "Email o contraseña incorrectos.";
      } else if (message.includes("Email not confirmed")) {
        message = "Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.";
      }
      toast({
        title: "Error al iniciar sesión",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Ingresa tu email",
        description: "Escribe tu email arriba y luego haz clic en '¿Olvidaste tu contraseña?'",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast({
        title: "Revisa tu correo",
        description: "Te enviamos un enlace para restablecer tu contraseña.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el correo de recuperación.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    const result = await signInWithFacebook();
    if (!result.success && result.error) {
      console.error('Facebook login error:', result.error);
    }
  };

  // Show confirmation screen after signup
  if (confirmationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">¡Revisa tu correo!</CardTitle>
            <CardDescription className="text-center text-base">
              Enviamos un enlace de confirmación a <strong>{email}</strong>.
              <br /><br />
              Haz clic en el enlace del correo para activar tu cuenta y luego vuelve aquí para iniciar sesión.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setConfirmationSent(false)}
            >
              Volver a Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 relative overflow-hidden">
      <Card className="w-full max-w-md animate-fade-in relative z-10 shadow-lg border-border/50">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Dog className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Paw Friend</CardTitle>
          <CardDescription className="text-center">
            Red social para amantes de las mascotas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Social Login Buttons */}
                <div className="space-y-3">
                  <GoogleSignInButton mode="signin" />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleFacebookLogin}
                    disabled={facebookLoading}
                  >
                    <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
                    {facebookLoading ? "Conectando..." : "Continuar con Facebook"}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      O continúa con email
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Contraseña</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors pt-2"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Social Login Buttons */}
                <div className="space-y-3">
                  <GoogleSignInButton mode="signup" />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleFacebookLogin}
                  >
                    <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
                    Registrarse con Facebook
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      O regístrate con email
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nombre de usuario</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Tu nombre"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div className="mt-8">
        <LegalFooter />
      </div>
    </div>
  );
};

export default Auth;
