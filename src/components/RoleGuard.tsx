/**
 * Guard de rutas por rol activo (dueño vs profesional).
 *
 * - Si requiredRole === "provider" y el usuario NO es proveedor → redirect a /home
 * - Si requiredRole === "provider" y el usuario ES proveedor pero está en modo dueño → auto-cambia a provider
 * - Si requiredRole === "owner" y el usuario está en modo provider → auto-cambia a owner
 *
 * El guard NO bloquea innecesariamente: si puedes ver la página, te la muestra.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveRole } from '@/hooks/useActiveRole';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

type ActiveRole = 'owner' | 'provider';

interface RoleGuardProps {
  requiredRole: ActiveRole;
  children: ReactNode;
  fallback?: string;
}

export function RoleGuard({ requiredRole, children, fallback = '/home' }: RoleGuardProps) {
  const { role, isProvider, isProviderLoading, setRole } = useActiveRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't evaluate until the provider query has resolved
    if (isProviderLoading) return;

    if (requiredRole === 'provider' && !isProvider) {
      toast.info('No tienes un perfil profesional');
      navigate(fallback, { replace: true });
      return;
    }

    if (requiredRole === 'provider' && isProvider && role !== 'provider') {
      setRole('provider');
      toast('Cambiaste a modo profesional');
    }

    if (requiredRole === 'owner' && role !== 'owner') {
      setRole('owner');
    }
  }, [requiredRole, isProvider, isProviderLoading, role, setRole, navigate, fallback]);

  // While still loading, show nothing (prevents flash-redirect)
  if (isProviderLoading) {
    return null;
  }

  // Block render if user isn't a provider but tries to access provider routes
  if (requiredRole === 'provider' && !isProvider) {
    return null;
  }

  return <>{children}</>;
}
