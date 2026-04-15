/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Dog, Mail, Shield, Stethoscope, Heart } from '@/lib/icons';
import { FaFacebook } from 'react-icons/fa';
import { LegalFooter } from '@/components/LegalFooter';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { useFacebookAuth } from '@/hooks/useFacebookAuth';
import { track, EVENTS } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { describeSupabaseError } from '@/lib/supabaseErrors';
import { useScrollOnFocus } from '@/hooks/useScrollOnFocus';
import { loginSchema, registerSchema } from '@/lib/schemas';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { toast } = useToast();
  const { signInWithFacebook, loading: facebookLoading } = useFacebookAuth();
  const hasRedirected = useRef(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  useScrollOnFocus();

  // Detect PASSWORD_RECOVERY event from Supabase reset link
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordReset(true);
        hasRedirected.current = true; // prevent auto-redirect
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Si el usuario ya está logueado, no tiene sentido mostrar el form de auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !hasRedirected.current) {
        hasRedirected.current = true;
        navigate(returnTo || '/home', { replace: true });
      }
    });
  }, [navigate, returnTo]);

  // redirectUser was removed — all auth redirects now use onAuthStateChange with window.location.href

  useEffect(() => {
    const hasOAuthHash =
      window.location.hash.includes('access_token') || window.location.search.includes('code=');

    // Listener: cuando supabase procesa el hash y emite SIGNED_IN, redirigimos
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_IN' && newSession && !hasRedirected.current) {
        hasRedirected.current = true;
        window.history.replaceState({}, document.title, window.location.pathname);
        // Hard reload para evitar race con ProtectedRoute
        window.location.href = returnTo || '/home';
      }
    });

    // Si ya hay sesión activa al montar (sin hash), redirigir directo
    if (!hasOAuthHash) {
      supabase.auth
        .getSession()
        .then(({ data: { session: existingSession } }) => {
          if (existingSession && !hasRedirected.current) {
            hasRedirected.current = true;
            window.location.href = returnTo || '/home';
          }
        })
        .catch(() => {
          /* silent */
        });
    }

    // Si hay hash OAuth pero supabase tarda mucho en procesarlo, fallback a 5s
    const oauthTimeout = hasOAuthHash
      ? setTimeout(async () => {
          if (hasRedirected.current) return;
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session && !hasRedirected.current) {
            hasRedirected.current = true;
            window.history.replaceState({}, document.title, window.location.pathname);
            window.location.href = returnTo || '/home';
          } else if (!session) {
            toast({
              title: 'Error en autenticación con Google',
              description: 'No pudimos completar el login. Intenta nuevamente.',
              variant: 'destructive',
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
    setFieldErrors({});

    const result = registerSchema.safeParse({ email, password, fullName: displayName });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) throw error;

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // User created but no session = email confirmation required
        setConfirmationSent(true);
        toast({
          title: '¡Revisa tu correo!',
          description: 'Te enviamos un enlace de confirmación a ' + email,
        });
      } else if (data.session) {
        // Email confirmation disabled, user is logged in directly
        track({ event: EVENTS.SIGNUP_COMPLETED, userId: data.user?.id });
        toast({
          title: '¡Cuenta creada!',
          description: 'Bienvenido a Paw Friend',
        });
        // Hard reload para evitar race condition con useAuth + ProtectedRoute.
        // Usuario nuevo siempre va a /add-pet (onboarding).
        window.location.href = returnTo || '/add-pet';
        return;
      }
    } catch (error: any) {
      let message = error.message;
      if (message.includes('already registered')) {
        message = 'Este email ya está registrado. Intenta iniciar sesión.';
      } else if (message.includes('password')) {
        message = 'La contraseña debe tener al menos 6 caracteres.';
      }
      toast({
        title: 'Error al crear cuenta',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      track({ event: EVENTS.LOGIN_COMPLETED });
      toast({
        title: '¡Bienvenido de vuelta!',
        description: 'Has iniciado sesión exitosamente',
      });

      // CRÍTICO: usar window.location.href en vez de navigate() para forzar
      // un page reload completo. Esto evita la race condition entre el listener
      // de useAuth (que actualiza el user state) y ProtectedRoute (que chequea
      // ese user state). Con reload, useAuth lee la sesión fresca de
      // localStorage al montar, y ProtectedRoute la encuentra.
      if (data.session?.user?.id) {
        // Decidir destino: returnTo > provider dashboard > home
        let dest = returnTo || '/home';
        try {
          // Check provider status — timeout 3s para cubrir latencia real de Supabase
          const result = await Promise.race<{ data: { id: string } | null } | null>([
            supabase
              .from('service_providers')
              .select('id')
              .eq('user_id', data.session.user.id)
              .maybeSingle(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
          ]);
          if (!returnTo && result?.data) dest = '/provider/dashboard';
        } catch {
          /* ignore */
        }
        window.location.href = dest;
        return;
      }
    } catch (error: any) {
      let message = error.message;
      if (message.includes('Invalid login credentials')) {
        message = 'Email o contraseña incorrectos.';
      } else if (message.includes('Email not confirmed')) {
        message = 'Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.';
      }
      toast({
        title: 'Error al iniciar sesión',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: 'Ingresa tu email',
        description: "Escribe tu email arriba y luego haz clic en '¿Olvidaste tu contraseña?'",
        variant: 'destructive',
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
        title: 'Revisa tu correo',
        description: 'Te enviamos un enlace para restablecer tu contraseña.',
      });
    } catch (error: any) {
      toast({
        title: 'Algo salió mal',
        description:
          describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]) ||
          'No se pudo enviar el correo de recuperación.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast({
        title: 'Ingresa tu email',
        description: 'Escribe tu email para recibir un enlace de acceso directo.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
      setMagicLinkSent(true);
      toast({
        title: '¡Revisa tu correo!',
        description: 'Te enviamos un enlace para entrar sin contraseña.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: describeSupabaseError(error) || 'No se pudo enviar el enlace.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    const result = await signInWithFacebook();
    if (!result.success && result.error) {
      logger.error('Facebook login error:', result.error);
    }
  };

  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({
        title: 'Contraseña muy corta',
        description: 'Mínimo 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast({
        title: 'Las contraseñas no coinciden',
        description: 'Verifica que ambas sean iguales.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({
        title: 'Contraseña actualizada',
        description: 'Ya puedes usar tu nueva contraseña.',
      });
      setIsPasswordReset(false);
      hasRedirected.current = false;
      navigate('/home', { replace: true });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la contraseña.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show password reset form (user arrived via Supabase reset email link)
  if (isPasswordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Nueva contraseña</CardTitle>
            <CardDescription className="text-center text-base">
              Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show magic link sent screen
  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">¡Revisa tu correo!</CardTitle>
            <CardDescription className="text-center text-base">
              Enviamos un enlace de acceso a <strong>{email}</strong>.
              <br />
              <br />
              Haz clic en el enlace del correo para entrar directamente, sin contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" onClick={() => setMagicLinkSent(false)}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <br />
              <br />
              Haz clic en el enlace del correo para activar tu cuenta y luego vuelve aquí para
              iniciar sesión.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" onClick={() => setConfirmationSent(false)}>
              Volver a Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
      {/* Left side: Auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fade-in relative z-10 shadow-lg border-border/50">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <img src="/paw_friend_icon_principal.svg" alt="Paw Friend" className="w-16 h-16 mb-4" />
            <CardTitle className="text-2xl font-bold text-center">Paw Friend</CardTitle>
            <CardDescription className="text-center">
              Cuida la salud de tu mascota con veterinarios verificados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <div className="space-y-4">
                  {/* Magic Link - método prioritario */}
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      required
                    />
                    {fieldErrors.email && (
                      <p className="text-sm text-destructive">{fieldErrors.email}</p>
                    )}
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    variant="default"
                    onClick={handleMagicLink}
                    disabled={loading || !email}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {loading ? 'Enviando...' : 'Enviar enlace al email'}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
                    </div>
                  </div>

                  {/* Social Login Buttons */}
                  <div className="space-y-3">
                    <GoogleSignInButton mode="signin" />
                    <p className="text-xs text-muted-foreground text-center px-2">
                      Si aparece una advertencia de Google, es porque estamos en proceso de
                      verificación oficial. Continúa con tranquilidad — tu cuenta es segura.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleFacebookLogin}
                      disabled={facebookLoading}
                    >
                      <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
                      {facebookLoading ? 'Conectando...' : 'Continuar con Facebook'}
                    </Button>
                  </div>

                  {!showEmailPassword ? (
                    <button
                      type="button"
                      className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => setShowEmailPassword(true)}
                    >
                      Entrar con contraseña
                    </button>
                  ) : (
                    <form onSubmit={handleSignIn} className="space-y-3 border-t pt-3">
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Contraseña</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setFieldErrors((prev) => ({ ...prev, password: '' }));
                          }}
                          required
                        />
                        {fieldErrors.password && (
                          <p className="text-sm text-destructive">{fieldErrors.password}</p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        variant="secondary"
                        disabled={loading}
                      >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                      </Button>
                      <button
                        type="button"
                        className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                        onClick={handleForgotPassword}
                        disabled={loading}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </form>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Social Login Buttons */}
                  <div className="space-y-3">
                    <GoogleSignInButton mode="signup" />
                    <p className="text-xs text-muted-foreground text-center px-2">
                      Si aparece una advertencia de Google, es porque estamos en proceso de
                      verificación oficial. Continúa con tranquilidad — tu cuenta es segura.
                    </p>
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
                      autoComplete="name"
                      placeholder="Tu nombre"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                      }}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-sm text-destructive">{fieldErrors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      required
                    />
                    {fieldErrors.email && (
                      <p className="text-sm text-destructive">{fieldErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      required
                      minLength={6}
                    />
                    {fieldErrors.password && (
                      <p className="text-sm text-destructive">{fieldErrors.password}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
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

      {/* Right side: Hero visual (hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-purple-600 to-purple-800 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md text-center space-y-6">
          <img
            src="/paw_friend_icon_principal.svg"
            alt="Paw Friend"
            className="w-20 h-20 mx-auto mb-2 brightness-0 invert"
          />
          <h2 className="text-3xl font-bold leading-tight">
            Cuida la salud de tu mascota como nunca antes
          </h2>
          <p className="text-lg text-purple-100">
            Únete a dueños chilenos que ya confían su mascota a veterinarios verificados en Paw
            Friend.
          </p>
          <div className="flex justify-center gap-6 pt-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">Datos protegidos</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">Vets verificados</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">Hecho en Chile 🇨🇱</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
