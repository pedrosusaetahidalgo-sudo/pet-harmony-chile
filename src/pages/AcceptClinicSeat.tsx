/**
 * AcceptClinicSeat — el vet invitado acepta una invitación a un seat clínica.
 *
 * Ruta: /provider/accept-seat?token=<uuid>
 * Origen: Lote C.6 auditoría E2E pre-launch 2026-04-20.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Check, AlertCircle, Loader2 } from '@/lib/icons';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export default function AcceptClinicSeat() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'accepting' | 'accepted' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setStatus('error');
      setErrorMsg('Link inválido. Falta el código de invitación.');
    }
  }, [token, authLoading]);

  const handleAccept = async () => {
    if (!token || !user) return;
    setAccepting(true);
    try {
      const { data, error } = await sb.rpc('accept_clinic_seat_invitation', {
        p_token: token,
      });
      if (error) {
        setStatus('error');
        setErrorMsg(error.message || 'No se pudo aceptar la invitación');
        toast.error(error.message);
        return;
      }
      setStatus('accepted');
      toast.success('¡Bienvenido a la clínica!');
      setTimeout(() => navigate('/provider/dashboard'), 2000);
      void data;
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-5 space-y-3 text-sm">
            <h2 className="text-lg font-semibold">Inicia sesión para aceptar</h2>
            <p className="text-muted-foreground">
              Para aceptar la invitación a la clínica, debes iniciar sesión o crear una cuenta de
              veterinario.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button asChild>
                <Link to={`/auth?next=/provider/accept-seat?token=${token ?? ''}`}>
                  Iniciar sesión
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/registro-veterinario">Registrarme como vet</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card>
        <CardContent className="p-5 space-y-4">
          {status === 'idle' && (
            <>
              <h2 className="text-lg font-semibold">Aceptar invitación</h2>
              <p className="text-sm text-muted-foreground">
                Te invitaron a unirte a una cuenta clínica en Paw Friend. Al aceptar, los pacientes
                de la clínica aparecerán también en tu dashboard.
              </p>
              <Button onClick={handleAccept} disabled={accepting} className="w-full">
                {accepting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Aceptando...
                  </>
                ) : (
                  'Aceptar invitación'
                )}
              </Button>
            </>
          )}
          {status === 'accepted' && (
            <div className="text-center space-y-2 py-6">
              <Check className="h-12 w-12 text-emerald-600 mx-auto" />
              <h2 className="text-lg font-semibold">¡Listo!</h2>
              <p className="text-sm text-muted-foreground">
                Te redirigimos al dashboard en unos segundos.
              </p>
            </div>
          )}
          {status === 'error' && (
            <div className="text-center space-y-2 py-6">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-lg font-semibold">No se pudo aceptar</h2>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
              <Button asChild variant="outline">
                <Link to="/home">Ir al inicio</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
