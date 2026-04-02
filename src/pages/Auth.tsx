import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Dog, Mail } from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import { LegalFooter } from "@/components/LegalFooter";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useFacebookAuth } from "@/hooks/useFacebookAuth";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithFacebook, loading: facebookLoading } = useFacebookAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);

      if (hashParams.has('access_token') || queryParams.has('code')) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('OAuth callback error:', error);
            toast({
              title: "Error de autenticación",
              description: error.message,
              variant: "destructive",
            });
          }

          window.history.replaceState({}, document.title, window.location.pathname);

          if (session) {
            navigate("/home");
          }
        } catch (err) {
          console.error('Error processing OAuth callback:', err);
        }
      }
    };

    handleOAuthCallback();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/home");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate("/home");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

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
        toast({
          title: "¡Cuenta creada!",
          description: "Bienvenido a Paw Friend",
        });
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión exitosamente",
      });
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
