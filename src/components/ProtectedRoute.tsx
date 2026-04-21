import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRole } from '@/hooks/useActiveRole';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Rutas que NUNCA deben forzar el gate de onboarding aunque el user
 * esté logueado y aún no lo haya completado. Incluye:
 *  - Los propios flows de onboarding (para no crear loop)
 *  - Rutas de pago / success / cancel (user puede entrar via email externo)
 *  - Reclamar mascota (post-vet-invitation)
 */
const ONBOARDING_BYPASS_PREFIXES = [
  '/onboarding-',
  '/paw-member/success',
  '/paw-member/cancel',
  '/provider/upgrade/success',
  '/provider/upgrade/cancel',
  '/payment-result',
  '/post-adoption/',
];

function shouldBypassOnboardingGate(pathname: string) {
  return ONBOARDING_BYPASS_PREFIXES.some((p) => pathname.startsWith(p));
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { role, isProvider, isProviderLoading, isShelter, isShelterLoading } = useActiveRole();
  const location = useLocation();

  // El hook interno usa `enabled: !!user?.id` así que no dispara query
  // sin user autenticado. El gate solo aplica a owners reales — providers
  // y shelters usan sus wizards inline (BecomeProviderDialog /
  // BecomeShelterDialog) y no deben caer al onboarding de dueño.
  const { data: onboardingStatus, isLoading: onboardingLoading } = useOnboardingStatus();

  if (loading) {
    // Skeleton de app shell completo: evita la pantalla en blanco con
    // spinner diminuto que veía el usuario en /medical-records y /profile.
    return (
      <div className="min-h-screen flex bg-background">
        {/* Sidebar skeleton (solo md+) */}
        <aside className="hidden md:block w-[200px] border-r border-border/40 p-3 space-y-3">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="space-y-1.5 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 w-full bg-muted/60 rounded animate-pulse" />
            ))}
          </div>
          <div className="space-y-1.5 pt-3 border-t">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-7 w-full bg-muted/60 rounded animate-pulse" />
            ))}
          </div>
        </aside>

        {/* Main content skeleton */}
        <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted/60 rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="space-y-3 pt-4">
            <div className="h-32 bg-muted rounded-lg animate-pulse" />
            <div className="h-32 bg-muted rounded-lg animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    // Preservar la URL original como returnTo para que post-login el usuario
    // vuelva a donde quería ir (deep link friendly).
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?returnTo=${returnTo}`} replace />;
  }

  // Gate de onboarding (épica B.1): solo aplica a owners reales — un user
  // registrado como vet/refugio no va a caer al onboarding de mascotas.
  // El gate espera a que TODAS las queries (provider, shelter, onboarding)
  // resuelvan antes de decidir — así un vet recién logueado no ve flash
  // al /onboarding-mascota mientras carga su service_providers row.
  const rolesReady = !isProviderLoading && !isShelterLoading;
  const isOwnerOnly = role === 'owner' && !isProvider && !isShelter;
  const gateReady = rolesReady && !onboardingLoading && onboardingStatus !== undefined;
  const needsOnboarding = gateReady && !onboardingStatus?.completed;
  const bypass = shouldBypassOnboardingGate(location.pathname);

  if (isOwnerOnly && needsOnboarding && !bypass) {
    return <Navigate to="/onboarding-mascota" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
