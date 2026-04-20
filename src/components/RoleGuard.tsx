/**
 * Guard de rutas por rol activo (dueño / profesional / refugio).
 *
 * - provider: si no es provider, redirect. Si es provider pero en otro modo, auto-switch.
 * - shelter:  si no es shelter, redirect. Si es shelter pero en otro modo, auto-switch.
 * - owner:    si esta en otro modo, auto-switch a owner.
 *
 * El guard NO bloquea innecesariamente: si puedes ver la pagina, te la muestra.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveRole } from '@/hooks/useActiveRole';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

type ActiveRole = 'owner' | 'provider' | 'shelter';

interface RoleGuardProps {
  requiredRole: ActiveRole;
  children: ReactNode;
  fallback?: string;
}

export function RoleGuard({ requiredRole, children, fallback = '/home' }: RoleGuardProps) {
  const { role, isProvider, isProviderLoading, isShelter, isShelterLoading, setRole } =
    useActiveRole();
  const navigate = useNavigate();

  const anyLoading =
    (requiredRole === 'provider' && isProviderLoading) ||
    (requiredRole === 'shelter' && isShelterLoading);

  useEffect(() => {
    if (anyLoading) return;

    if (requiredRole === 'provider' && !isProvider) {
      toast.info('No tienes un perfil profesional');
      navigate(fallback, { replace: true });
      return;
    }

    if (requiredRole === 'shelter' && !isShelter) {
      toast.info('No tienes una cuenta de refugio de adopcion');
      navigate(fallback, { replace: true });
      return;
    }

    if (requiredRole === 'provider' && isProvider && role !== 'provider') {
      setRole('provider');
      toast('Cambiaste a modo profesional');
    }

    if (requiredRole === 'shelter' && isShelter && role !== 'shelter') {
      setRole('shelter');
      toast('Cambiaste a modo refugio');
    }

    if (requiredRole === 'owner' && role !== 'owner') {
      setRole('owner');
    }
  }, [requiredRole, isProvider, isShelter, anyLoading, role, setRole, navigate, fallback]);

  if (anyLoading) {
    return null;
  }

  if (requiredRole === 'provider' && !isProvider) {
    return null;
  }

  if (requiredRole === 'shelter' && !isShelter) {
    return null;
  }

  return <>{children}</>;
}
