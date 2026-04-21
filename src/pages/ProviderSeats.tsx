/**
 * ProviderSeats — gestión de seats (multi-vet) para cuentas clínica.
 *
 * Solo accesible si el provider tiene plan clinic_starter o pro_max.
 * Permite invitar vets adicionales por email. Cada invitación crea row en
 * clinic_vet_seats con invited_token UUID. El vet invitado acepta vía link
 * /provider/accept-seat?token=<uuid> → RPC accept_clinic_seat_invitation.
 *
 * Origen: Lote C.6 auditoría E2E pre-launch 2026-04-20.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProviderPlan } from '@/hooks/useProviderPlan';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/PageHeader';
import { toast } from 'sonner';
import { UserPlus, Mail, Check, Trash2, Copy, AlertCircle, Users } from '@/lib/icons';

interface Seat {
  id: string;
  seat_user_id: string | null;
  invited_email: string | null;
  invited_token: string;
  role: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  seat_display_name?: string | null;
  seat_email?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export default function ProviderSeats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: planCtx, isLoading: planLoading } = useProviderPlan();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Fetch provider propio
  const { data: provider } = useQuery({
    queryKey: ['provider-self-for-seats', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await sb
        .from('service_providers')
        .select('id, provider_plan, display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      return data as { id: string; provider_plan: string; display_name: string } | null;
    },
  });

  // Fetch seats activos/invitados
  const {
    data: seats,
    isLoading: seatsLoading,
    refetch,
  } = useQuery<Seat[]>({
    queryKey: ['clinic-seats', provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { data } = await sb
        .from('clinic_vet_seats')
        .select('*')
        .eq('parent_provider_id', provider!.id)
        .neq('status', 'removed')
        .order('invited_at', { ascending: false });
      return (data ?? []) as Seat[];
    },
  });

  if (planLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  // Gate: solo planes clínica
  const eligible =
    planCtx?.plan === 'provider_clinic_starter' || planCtx?.plan === 'provider_pro_max';

  if (!eligible) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <PageHeader title="Seats de clínica" />
        <Card className="border-amber-300 bg-amber-50/40">
          <CardContent className="p-5 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold">Feature de planes Clínica y Pro Max</h3>
            </div>
            <p className="text-muted-foreground">
              Los seats (invitar más vets bajo una misma cuenta) se desbloquean con el plan{' '}
              <strong>Clínica</strong> ($19.900/mes, 3 seats) o <strong>Pro Max</strong>{' '}
              ($29.900/mes, ilimitado).
            </p>
            <Button asChild size="sm">
              <Link to="/provider/upgrade">Ver planes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxSeats = planCtx?.plan === 'provider_pro_max' ? Infinity : 3;
  const activeSeats = (seats ?? []).filter((s) => s.status === 'active').length;
  const invitedSeats = (seats ?? []).filter((s) => s.status === 'invited').length;
  const remainingSeats = Math.max(0, maxSeats - activeSeats - invitedSeats);

  const handleInvite = async () => {
    if (!provider?.id) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Ingresa un email válido');
      return;
    }
    if (remainingSeats <= 0) {
      toast.error('Llegaste al límite de seats del plan. Actualiza a Pro Max.');
      return;
    }
    setInviting(true);
    try {
      const { error } = await sb.from('clinic_vet_seats').insert({
        parent_provider_id: provider.id,
        invited_email: email,
        invited_by: user?.id,
        role: 'vet',
        status: 'invited',
      });
      if (error) {
        toast.error(error.message || 'Error al crear invitación');
        return;
      }
      setInviteEmail('');
      toast.success(
        'Invitación creada. Copia el link desde la lista y envíalo al vet por WhatsApp o email.'
      );
      queryClient.invalidateQueries({ queryKey: ['clinic-seats', provider.id] });
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const url = `${window.location.origin}/provider/accept-seat?token=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const handleRemove = async (seatId: string) => {
    if (!confirm('¿Quitar este seat?')) return;
    const { error } = await sb
      .from('clinic_vet_seats')
      .update({ status: 'removed', removed_at: new Date().toISOString() })
      .eq('id', seatId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Seat removido');
    refetch();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <Helmet>
        <title>Seats de clínica — Paw Friend</title>
      </Helmet>

      <PageHeader
        title="Seats de clínica"
        subtitle={`${provider?.display_name ?? 'Mi clínica'} · plan ${planCtx?.planName}`}
      />

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Capacidad del plan</h3>
            <Badge variant="outline" className="ml-auto">
              {activeSeats} activo{activeSeats !== 1 ? 's' : ''} · {invitedSeats} pendiente
              {invitedSeats !== 1 ? 's' : ''}
              {maxSeats === Infinity
                ? ''
                : ` · ${remainingSeats} disponible${remainingSeats !== 1 ? 's' : ''}`}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {maxSeats === Infinity
              ? 'Tu plan Pro Max permite seats ilimitados.'
              : `Tu plan permite hasta ${maxSeats} seats. Para ilimitados, actualiza a Pro Max.`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invitar un vet a tu cuenta
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="invite-email" className="text-xs">
                Email del vet
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="doctor@ejemplo.cl"
                disabled={remainingSeats <= 0}
              />
            </div>
            <Button
              onClick={handleInvite}
              disabled={inviting || remainingSeats <= 0 || !inviteEmail.trim()}
              className="sm:mt-[22px] shrink-0"
            >
              {inviting ? 'Creando...' : 'Invitar'}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Creamos una invitación. Copias el link y se lo envías tú por WhatsApp o email. El vet la
            acepta ingresando con su cuenta.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Seats</h3>
        {seatsLoading ? (
          <Skeleton className="h-24" />
        ) : !seats || seats.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Aún no hay seats invitados ni activos.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {seats.map((seat) => (
              <Card key={seat.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      {seat.status === 'active' ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Mail className="h-4 w-4 text-amber-600" />
                      )}
                      <span className="font-medium text-sm truncate">
                        {seat.seat_display_name ?? seat.seat_email ?? seat.invited_email ?? '—'}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          seat.status === 'active'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 text-[10px]'
                            : 'bg-amber-50 border-amber-300 text-amber-700 text-[10px]'
                        }
                      >
                        {seat.status === 'active' ? 'Activo' : 'Pendiente'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Invitado {new Date(seat.invited_at).toLocaleDateString('es-CL')}
                      {seat.accepted_at &&
                        ` · aceptado ${new Date(seat.accepted_at).toLocaleDateString('es-CL')}`}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {seat.status === 'invited' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(seat.invited_token)}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copiar link
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(seat.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <Button asChild variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <span>Volver</span>
        </Button>
      </div>
    </div>
  );
}
