import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Dog, Mail, Shield, Stethoscope, Heart } from '@/lib/icons';
import { FaFacebook } from 'react-icons/fa';
import { LegalFooter } from '@/components/LegalFooter';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { AppleSignInButton } from '@/components/AppleSignInButton';
import { useFacebookAuth } from '@/hooks/useFacebookAuth';
import { track, EVENTS } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { describeSupabaseError } from '@/lib/supabaseErrors';
import { useScrollOnFocus } from '@/hooks/useScrollOnFocus';

// Feature flags: solo mostrar botones de social login si el provider está configurado
const FACEBOOK_ENABLED = Boolean(import.meta.env.VITE_FACEBOOK_APP_ID);
const APPLE_ENABLED = Boolean(import.meta.env.VITE_APPLE_SERVICE_ID);
import { loginSchema, registerSchema } from '@/lib/schemas';
import { generateDefaultName } from '@/lib/format';

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
  const rawReturnTo = searchParams.get('returnTo');
  // Prevent open redirect — only allow internal paths
  const returnTo =
    rawReturnTo?.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : null;
  // Forward ?invitation=TOKEN through redirects so useClaimPetInvitation can process it
  const invitationToken = searchParams.get('invitation');
  const buildRedirectUrl = useCallback(
    (base: string) => {
      if (!invitationToken) return base;
      const sep = base.includes('?') ? '&' : '?';
      return `${base}${sep}invitation=${encodeURIComponent(invitationToken)}`;
    },
    [invitationToken]
  );
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
        navigate(buildRedirectUrl(returnTo || '/home'), { replace: true });
      }
    });
  }, [navigate, returnTo, buildRedirectUrl]);

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
        window.location.href = buildRedirectUrl(returnTo || '/home');
      }
    });

    // Si ya hay sesión activa al montar (sin hash), redirigir directo
    if (!hasOAuthHash) {
      supabase.auth
        .getSession()
        .then(({ data: { session: existingSession } }) => {
          if (existingSession && !hasRedirected.current) {
            hasRedirected.current = true;
            window.location.href = buildRedirectUrl(returnTo || '/home');
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
            window.location.href = buildRedirectUrl(returnTo || '/home');
          } else if (!session) {
            toast.error('Error en autenticación con Google', {
              description: 'No pudimos completar el login. Intenta nuevamente.',
            });
          }
        }, 5000)
      : null;

    return () => {
      subscription.unsubscribe();
      if (oauthTimeout) clearTimeout(oauthTimeout);
    };
  }, [navigate, returnTo, buildRedirectUrl]);

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
            display_name: displayName.trim() || generateDefaultName(),
          },
        },
      });

      if (error) throw error;

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // User created but no session = email confirmation required
        setConfirmationSent(true);
        toast('¡Revisa tu correo!', { description: 'Te enviamos un enlace de confirmación a ' });
      } else if (data.session) {
        // Email confirmation disabled, user is logged in directly.
        // Hard reload para evitar race condition con useAuth + ProtectedRoute.
        track({ event: EVENTS.SIGNUP_COMPLETED, userId: data.user?.id });
        toast('¡Cuenta creada!', { description: 'Bienvenido a Paw Friend' });
        window.location.href = buildRedirectUrl(returnTo || '/home');
        return;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      let description = message;
      if (message.includes('already registered')) {
        description = 'Este email ya está registrado. Intenta iniciar sesión.';
      } else if (message.includes('password')) {
        description = 'La contraseña debe tener al menos 6 caracteres.';
      }
      toast.error('Error al crear cuenta');
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
      toast('¡Bienvenido de vuelta!', { description: 'Has iniciado sesión exitosamente' });

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      let description = message;
      if (message.includes('Invalid login credentials')) {
        description = 'Email o contraseña incorrectos.';
      } else if (message.includes('Email not confirmed')) {
        description =
          'Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.';
      }
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Ingresa tu email', {
        description: "Escribe tu email arriba y luego haz clic en '¿Olvidaste tu contraseña?'",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast('Revisa tu correo', {
        description: 'Te enviamos un enlace para restablecer tu contraseña.',
      });
    } catch (error: unknown) {
      toast.error('Algo salió mal', {
        description:
          describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]) ||
          'No se pudo enviar el correo de recuperación.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast.error('Ingresa tu email', {
        description: 'Escribe tu email para recibir un enlace de acceso directo.',
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
      toast('¡Revisa tu correo!', {
        description: 'Te enviamos un enlace para entrar sin contraseña.',
      });
    } catch (error: unknown) {
      toast.error('Error', {
        description:
          describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]) ||
          'No se pudo enviar el enlace.',
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
      toast.error('Contraseña muy corta', { description: 'Mínimo 6 caracteres.' });
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast.error('Las contraseñas no coinciden', {
        description: 'Verifica que ambas sean iguales.',
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast('Contraseña actualizada', { description: 'Ya puedes usar tu nueva contraseña.' });
      setIsPasswordReset(false);
      hasRedirected.current = false;
      navigate('/home', { replace: true });
    } catch (error: unknown) {
      toast.error('Error', {
        description:
          (error instanceof Error ? error.message : null) || 'No se pudo actualizar la contraseña.',
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
            <CardTitle className="font-display font-semibold text-3xl tracking-tight text-center">
              Nueva contraseña
            </CardTitle>
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
            <CardTitle className="font-display font-semibold text-3xl tracking-tight text-center">
              ¡Revisa tu correo!
            </CardTitle>
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
            <CardTitle className="font-display font-semibold text-3xl tracking-tight text-center">
              ¡Revisa tu correo!
            </CardTitle>
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
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-purple-50/60 via-white to-pink-50/40 relative overflow-hidden">
      {/* Decorative blobs (izquierda, sutiles) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-30 bg-purple-200"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/4 w-[320px] h-[320px] rounded-full blur-3xl opacity-30 bg-pink-200"
      />

      {/* Left side: Auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
        <Card className="w-full max-w-md animate-fade-in shadow-xl border-border/40 rounded-2xl backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-2 flex flex-col items-center pt-8 pb-4">
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- fallback: si v2 aun no esta desplegado, cargamos el icono anterior */}
            <img
              src="/paw-friend-assets-v2/logo/app_icon_ios_1024.svg"
              alt="Paw Friend"
              className="w-16 h-16 mb-2 drop-shadow-md"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  '/paw-friend-assets-v2/logo/paw_friend_icon_principal.svg';
              }}
            />
            <CardTitle className="font-display font-semibold text-3xl md:text-4xl tracking-tight text-center bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
              Bienvenido
            </CardTitle>
            <CardDescription className="text-center text-sm max-w-xs">
              Entra o crea tu cuenta para que la ficha medica de tu peludo viva siempre contigo.
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
                    {FACEBOOK_ENABLED && (
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
                    )}
                    {APPLE_ENABLED && <AppleSignInButton mode="signin" />}
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
                    {FACEBOOK_ENABLED && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleFacebookLogin}
                      >
                        <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
                        Registrarse con Facebook
                      </Button>
                    )}
                    {APPLE_ENABLED && <AppleSignInButton mode="signup" />}
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

      {/* Right side: Hero emocional (hidden en mobile) */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 text-white">
        {/* Blobs decorativos animados */}
        <div
          aria-hidden
          className="absolute -top-32 -right-20 w-[500px] h-[500px] rounded-full bg-pink-400/30 blur-3xl animate-pulse"
          style={{ animationDuration: '6s' }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 -left-24 w-[400px] h-[400px] rounded-full bg-amber-400/20 blur-3xl"
        />

        {/* Paw prints flotantes decorativos */}
        <div aria-hidden className="absolute inset-0 opacity-10 pointer-events-none">
          <span className="absolute top-[12%] left-[15%] text-5xl rotate-12">🐾</span>
          <span className="absolute top-[28%] right-[18%] text-4xl -rotate-12">🐾</span>
          <span className="absolute bottom-[22%] left-[20%] text-3xl rotate-45">🐾</span>
          <span className="absolute top-[55%] right-[12%] text-3xl">🐾</span>
          <span className="absolute bottom-[10%] right-[25%] text-4xl -rotate-6">🐾</span>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          {/* Wordmark */}
          <div className="mb-4">
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- fallback: ocultar img si el archivo aun no esta disponible */}
            <img
              src="/paw-friend-assets-v2/logo/wordmark_horizontal_darkmode.svg"
              alt="Paw Friend"
              className="h-12 w-auto"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {/* Contenido central */}
          <div className="max-w-md space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold tracking-wide uppercase">
              <span>🇨🇱 Hecho en Chile</span>
            </div>
            <h2 className="font-display font-semibold text-4xl xl:text-5xl leading-[1.05] tracking-tight">
              La ficha medica de tu peludo,{' '}
              <span className="bg-gradient-to-r from-pink-200 to-amber-200 bg-clip-text text-transparent">
                en tu bolsillo
              </span>
            </h2>
            <p className="text-lg text-purple-100/90 leading-relaxed">
              Ficha clinica completa, directorio de veterinarios verificados y cuidado diario.
              Gratis para todos los dueños.
            </p>

            {/* Trust strip: 3 beneficios destacados */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 p-3 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-white/15 flex items-center justify-center mb-2">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold">Vets verificados</div>
                <div className="text-[10px] text-purple-200/80 mt-0.5">Colmevet</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 p-3 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-white/15 flex items-center justify-center mb-2">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold">Tus datos</div>
                <div className="text-[10px] text-purple-200/80 mt-0.5">Protegidos</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 p-3 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-white/15 flex items-center justify-center mb-2">
                  <Heart className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold">Gratis</div>
                <div className="text-[10px] text-purple-200/80 mt-0.5">Para siempre</div>
              </div>
            </div>

            {/* Quote emocional */}
            <div className="mt-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-5">
              <p className="text-sm leading-relaxed italic text-purple-50">
                "Por fin todas las vacunas de mis perros en un solo lugar. Me ahorro los cuadernos y
                los PDFs sueltos."
              </p>
              <p className="text-xs text-purple-200/80 mt-2 font-semibold">
                — Sofia R., vet beta tester
              </p>
            </div>
          </div>

          {/* Footer mini */}
          <div className="flex items-center justify-between text-xs text-purple-200/70 pt-6">
            <a href="/refugios-hogares" className="hover:text-white transition">
              Hogares de adopcion
            </a>
            <span>·</span>
            <a href="/veterinarios" className="hover:text-white transition">
              Directorio vets
            </a>
            <span>·</span>
            <a href="/para-veterinarios" className="hover:text-white transition">
              Eres veterinario?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
