import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Loader2, PawPrint, QrCode, ShieldAlert, Stethoscope } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';
import { PublicHeader, PublicFooter } from './DirectorioVets';

/**
 * QR Landing — /qr/:token
 *
 * Cuando un veterinario escanea el QR de una mascota:
 * 1. Busca la mascota por qr_token
 * 2. Si no existe → "QR inválido"
 * 3. Si el usuario no está logueado → CTA de login con returnTo
 * 4. Si está logueado:
 *    a. Es vet (service_provider) → redirige a ficha clínica
 *    b. Es el dueño de la mascota → redirige a ficha clínica
 *    c. Otro → mensaje "solo veterinarios verificados"
 */
export default function QRLanding() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [pet, setPet] = useState<{ id: string; owner_id: string; name: string } | null>(null);
  const [petLoading, setPetLoading] = useState(true);
  const [petError, setPetError] = useState(false);

  // 1. Buscar mascota por qr_token
  useEffect(() => {
    if (!token) {
      setPetError(true);
      setPetLoading(false);
      return;
    }

    (supabase as any)
      .from('pets')
      .select('id, owner_id, name')
      .eq('qr_token', token)
      .maybeSingle()
      .then(({ data, error }: { data: any; error: any }) => {
        if (error || !data) {
          setPetError(true);
        } else {
          setPet(data);
        }
        setPetLoading(false);
      });
  }, [token]);

  // Loading state
  if (petLoading || authLoading) {
    return (
      <div className="min-h-screen bg-purple-50">
        <PublicHeader />
        <main className="container mx-auto px-4 py-10 max-w-md">
          <Card>
            <CardContent className="py-8 space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // 2. QR inválido
  if (petError || !pet) {
    return (
      <div className="min-h-screen bg-purple-50">
        <PublicHeader />
        <main className="container mx-auto px-4 py-10 md:py-16 max-w-md text-center">
          <div className="inline-flex p-4 rounded-full bg-amber-100 mb-4">
            <AlertCircle className="h-12 w-12 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">QR inválido</h1>
          <p className="text-muted-foreground mb-6">
            Este código QR no corresponde a ninguna mascota registrada en Paw Friend.
            Verifica que el código no esté dañado o expirado.
          </p>
          <Link to="/">
            <Button>Ir al inicio</Button>
          </Link>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // 3. No logueado → CTA login
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <PublicHeader />
        <main className="container mx-auto px-4 py-8 max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3">
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                  <QrCode className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              <CardTitle>Ficha clínica de {pet.name}</CardTitle>
              <CardDescription>
                Para acceder a la ficha clínica de esta mascota necesitas iniciar sesión
                como veterinario verificado en Paw Friend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => navigate(LINKS.authReturn(`/qr/${token}`))}
              >
                Iniciar sesión / Registrarme
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Después de iniciar sesión volverás aquí automáticamente.
              </p>
            </CardContent>
          </Card>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // 4. Logueado → verificar rol
  return <AuthenticatedQRHandler pet={pet} userId={user.id} />;
}

/**
 * Componente interno: verifica si el usuario logueado es vet o dueño
 * y redirige o muestra mensaje de acceso denegado.
 */
function AuthenticatedQRHandler({
  pet,
  userId,
}: {
  pet: { id: string; owner_id: string; name: string };
  userId: string;
}) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // El dueño siempre puede ver la ficha de su propia mascota
    if (pet.owner_id === userId) {
      navigate(`/pet/${pet.id}/clinical`, { replace: true });
      return;
    }

    // Verificar si es service_provider (vet)
    (supabase as any)
      .from('service_providers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }: { data: any }) => {
        if (data) {
          setIsAuthorized(true);
          navigate(`/pet/${pet.id}/clinical`, { replace: true });
        } else {
          setChecking(false);
        }
      });
  }, [pet, userId, navigate]);

  if (checking && !isAuthorized) {
    return (
      <div className="min-h-screen bg-purple-50">
        <PublicHeader />
        <main className="container mx-auto px-4 py-10 max-w-md">
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-3" />
              <p className="text-muted-foreground">Verificando acceso...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // No es vet ni dueño → acceso denegado
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <PublicHeader />
      <main className="container mx-auto px-4 py-10 md:py-16 max-w-md text-center">
        <div className="inline-flex p-4 rounded-full bg-red-100 mb-4">
          <ShieldAlert className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Acceso restringido</h1>
        <p className="text-muted-foreground mb-6">
          Solo veterinarios verificados o el dueño de la mascota pueden acceder
          a la ficha clínica mediante código QR.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Si eres veterinario,{' '}
          <Link to="/registro-veterinario" className="text-purple-600 underline">
            regístrate como profesional
          </Link>{' '}
          para poder atender pacientes en Paw Friend.
        </p>
        <Link to="/home">
          <Button>Ir al inicio</Button>
        </Link>
      </main>
      <PublicFooter />
    </div>
  );
}
