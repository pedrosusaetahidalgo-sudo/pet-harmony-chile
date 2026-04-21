import { useState } from 'react';
import { Inbox, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { buildCsv, downloadCsv } from '@/lib/export/csv';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  BookingCard,
  type BookingAction,
  type BookingCardData,
} from '@/components/booking/BookingCard';
import { CancelBookingDialog } from '@/components/booking/CancelBookingDialog';
import { BookingDetailDrawer } from '@/components/booking/BookingDetailDrawer';
import { FollowUpDialog } from '@/components/booking/FollowUpDialog';
import { RescheduleDialog } from '@/components/booking/RescheduleDialog';
import { useProviderBookingsInbox } from '@/hooks/useProviderBookingsInbox';
import {
  useConfirmBooking,
  useStartBooking,
  useMarkCompleted,
  useMarkNoShow,
} from '@/hooks/useBookingMutations';
import type { BookingStatus } from '@/lib/bookingStateMachine';
import { InboxFiltersBar, EMPTY_INBOX_FILTERS, type InboxFilters } from './InboxFiltersBar';

interface ProviderBookingsInboxProps {
  providerId: string | undefined;
}

export function ProviderBookingsInbox({ providerId }: ProviderBookingsInboxProps) {
  const [tab, setTab] = useState('pending');
  const [cancelTarget, setCancelTarget] = useState<BookingCardData | null>(null);
  const [detailTarget, setDetailTarget] = useState<BookingCardData | null>(null);
  const [followUpTarget, setFollowUpTarget] = useState<BookingCardData | null>(null);
  // CC-26: provider puede reprogramar (antes solo owner).
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingCardData | null>(null);
  const [filters, setFilters] = useState<InboxFilters>(EMPTY_INBOX_FILTERS);

  const statusFilter: Record<string, BookingStatus | BookingStatus[]> = {
    pending: 'pendiente',
    today: ['confirmado', 'en_curso', 'en_camino'],
    upcoming: 'confirmado',
    past: ['completado', 'cancelado', 'no_show'],
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Extrae los filtros aplicables a cada query (sin status + sin date exacto).
  // El `date` exacto solo lo usa el tab "today". Los rangos fromDate/toDate
  // si aplican cross-tab.
  const sharedFilter = {
    serviceType: filters.serviceType !== 'all' ? filters.serviceType : undefined,
    searchQuery: filters.searchQuery || undefined,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
  };

  const pendingQuery = useProviderBookingsInbox(providerId, {
    status: 'pendiente',
    ...sharedFilter,
  });
  const todayQuery = useProviderBookingsInbox(providerId, {
    status: statusFilter.today as BookingStatus[],
    date: todayStr,
    ...sharedFilter,
    // fromDate/toDate se ignoran cuando `date` exacto esta presente
  });
  const upcomingQuery = useProviderBookingsInbox(providerId, {
    status: 'confirmado',
    ...sharedFilter,
  });
  const pastQuery = useProviderBookingsInbox(providerId, {
    status: statusFilter.past as BookingStatus[],
    ...sharedFilter,
  });

  const confirmBooking = useConfirmBooking();
  const startBooking = useStartBooking();
  const markCompleted = useMarkCompleted();
  const markNoShow = useMarkNoShow();

  const pendingCount = pendingQuery.data?.length ?? 0;

  const handleAction = (action: BookingAction, booking: BookingCardData) => {
    switch (action) {
      case 'confirm':
        confirmBooking.mutate({ bookingId: booking.id, bookingType: booking.booking_type });
        break;
      case 'start':
        startBooking.mutate({ bookingId: booking.id, bookingType: booking.booking_type });
        break;
      case 'complete':
        markCompleted.mutate(
          { bookingId: booking.id, bookingType: booking.booking_type },
          {
            onSuccess: () => {
              // Ofrecer seguimiento solo para citas vet (walk/dogsitter/training
              // no requieren follow-up clinico).
              if (booking.booking_type === 'vet') {
                setFollowUpTarget(booking);
              }
            },
          }
        );
        break;
      case 'no_show':
        markNoShow.mutate({ bookingId: booking.id, bookingType: booking.booking_type });
        break;
      case 'cancel':
        setCancelTarget(booking);
        break;
      case 'reschedule':
        setRescheduleTarget(booking);
        break;
      case 'detail':
        setDetailTarget(booking);
        break;
    }
  };

  const confirmAllPending = () => {
    if (!pendingQuery.data) return;
    for (const b of pendingQuery.data) {
      confirmBooking.mutate({ bookingId: b.id, bookingType: b.booking_type });
    }
  };

  const renderEmpty = (variant: 'pending' | 'today' | 'upcoming' | 'past') => {
    const copy = {
      pending: {
        icon: CheckCircle2,
        title: 'Sin pendientes por revisar',
        text: 'Todo al dia. Las nuevas reservas aparecen aca cuando los duenos piden cita.',
      },
      today: {
        icon: Inbox,
        title: 'Sin citas para hoy',
        text: 'No tienes nada agendado hoy. Revisa la pestana Proximos para ver las siguientes.',
      },
      upcoming: {
        icon: Inbox,
        title: 'Sin citas proximas',
        text: 'Cuando alguien reserve, aparecera aca. Revisa tu disponibilidad para recibir mas.',
      },
      past: {
        icon: Inbox,
        title: 'Sin historial todavia',
        text: 'Las citas completadas, canceladas o no presentadas quedan registradas aca.',
      },
    }[variant];
    const Icon = copy.icon;
    return (
      <div className="text-center py-10 space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium">{copy.title}</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">{copy.text}</p>
      </div>
    );
  };

  const renderBookings = (
    data: typeof pendingQuery.data,
    isLoading: boolean,
    variant: 'pending' | 'today' | 'upcoming' | 'past'
  ) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      );
    }

    if (!data || data.length === 0) {
      return renderEmpty(variant);
    }

    return (
      <div className="space-y-3">
        {data.map((b) => (
          <BookingCard
            key={b.id}
            // eslint-disable-next-line jsx-a11y/aria-role -- `role` es prop custom de BookingCard, no atributo ARIA
            role="provider"
            booking={{
              id: b.id,
              booking_type: b.booking_type,
              scheduled_date: b.scheduled_date,
              start_time: b.start_time,
              end_time: b.end_time,
              service_type: b.service_type,
              status: b.status,
              is_emergency: b.is_emergency,
              total_price: b.total_price,
              owner_name: b.owner_name,
              owner_avatar: b.owner_avatar,
              pet_name: b.pet_name,
              pet_species: b.pet_species,
              pet_photo: b.pet_photo,
              owner_id: b.owner_id,
              pet_id: b.pet_id,
              provider_id: providerId,
            }}
            onAction={handleAction}
          />
        ))}
      </div>
    );
  };

  // CC-33: exportar bookings visibles del tab actual a CSV.
  const exportVisibleToCsv = () => {
    const currentData =
      tab === 'pending'
        ? pendingQuery.data
        : tab === 'today'
          ? todayQuery.data
          : tab === 'upcoming'
            ? upcomingQuery.data
            : pastQuery.data;
    if (!currentData || currentData.length === 0) {
      return;
    }
    const rows = currentData.map((b) => ({
      fecha: b.scheduled_date?.split('T')[0] ?? '',
      hora: b.start_time?.slice(0, 5) ?? '',
      estado: b.status,
      tipo_servicio: b.service_type,
      mascota: b.pet_name ?? '',
      dueno: b.owner_name ?? '',
      precio_clp: b.total_price ?? '',
      urgencia: b.is_emergency ? 'sí' : 'no',
      id: b.id,
    }));
    const csv = buildCsv(rows, [
      { key: 'fecha', label: 'Fecha' },
      { key: 'hora', label: 'Hora' },
      { key: 'estado', label: 'Estado' },
      { key: 'tipo_servicio', label: 'Servicio' },
      { key: 'mascota', label: 'Mascota' },
      { key: 'dueno', label: 'Dueño' },
      { key: 'precio_clp', label: 'Precio CLP' },
      { key: 'urgencia', label: 'Urgencia' },
      { key: 'id', label: 'Booking ID' },
    ]);
    const ts = new Date().toISOString().split('T')[0];
    downloadCsv(csv, `paw-friend-reservas-${tab}-${ts}`);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="h-4 w-4" aria-hidden="true" />
            Bandeja de reservas
            {pendingCount > 0 && (
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                {pendingCount} requiere{pendingCount === 1 ? '' : 'n'} tu accion
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 text-xs gap-1"
              onClick={exportVisibleToCsv}
              aria-label="Exportar bookings visibles a CSV"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InboxFiltersBar value={filters} onChange={setFilters} />
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="pending" className="text-xs">
                Pendientes
                {pendingCount > 0 && (
                  <span
                    aria-label={`${pendingCount} pendientes`}
                    className="ml-1 bg-amber-500 text-white rounded-full px-1.5 text-[10px] font-semibold"
                  >
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="today" className="text-xs">
                Hoy
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="text-xs">
                Proximos
              </TabsTrigger>
              <TabsTrigger value="past" className="text-xs">
                Pasados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-3 space-y-3">
              {pendingCount > 1 && (
                <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-xs text-amber-900">
                    Tienes {pendingCount} reservas esperando tu confirmacion.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-100"
                    disabled={confirmBooking.isPending}
                    onClick={confirmAllPending}
                  >
                    Confirmar todas
                  </Button>
                </div>
              )}
              {renderBookings(pendingQuery.data, pendingQuery.isLoading, 'pending')}
            </TabsContent>
            <TabsContent value="today" className="mt-3">
              {renderBookings(todayQuery.data, todayQuery.isLoading, 'today')}
            </TabsContent>
            <TabsContent value="upcoming" className="mt-3">
              {renderBookings(upcomingQuery.data, upcomingQuery.isLoading, 'upcoming')}
            </TabsContent>
            <TabsContent value="past" className="mt-3">
              {renderBookings(pastQuery.data, pastQuery.isLoading, 'past')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {cancelTarget && (
        <CancelBookingDialog
          open={!!cancelTarget}
          onOpenChange={(open) => !open && setCancelTarget(null)}
          bookingId={cancelTarget.id}
          bookingType={cancelTarget.booking_type}
          currentStatus={cancelTarget.status}
          scheduledAt={
            cancelTarget.start_time
              ? `${cancelTarget.scheduled_date}T${cancelTarget.start_time.slice(0, 5)}`
              : cancelTarget.scheduled_date
          }
          // eslint-disable-next-line jsx-a11y/aria-role -- `role` es prop custom de CancelBookingDialog, no atributo ARIA
          role="provider"
        />
      )}

      {detailTarget && (
        <BookingDetailDrawer
          open={!!detailTarget}
          onOpenChange={(open) => !open && setDetailTarget(null)}
          bookingId={detailTarget.id}
          bookingType={detailTarget.booking_type}
          viewerRole="provider"
        />
      )}

      {followUpTarget && providerId && followUpTarget.owner_id && followUpTarget.pet_id && (
        <FollowUpDialog
          open={!!followUpTarget}
          onOpenChange={(open) => !open && setFollowUpTarget(null)}
          originalBookingId={followUpTarget.id}
          providerId={providerId}
          ownerId={followUpTarget.owner_id}
          petId={followUpTarget.pet_id}
          serviceType={followUpTarget.service_type || 'consulta_general'}
          defaultStartTime={followUpTarget.start_time?.slice(0, 5) || '10:00'}
        />
      )}

      {/* CC-26: RescheduleDialog con role='provider' → grace 12h (vs 24h del owner).
          Usa rpc_reschedule_booking (CC-19) si está desplegada, fallback a UPDATE. */}
      {rescheduleTarget && providerId && (
        <RescheduleDialog
          open={!!rescheduleTarget}
          onOpenChange={(open) => !open && setRescheduleTarget(null)}
          bookingId={rescheduleTarget.id}
          bookingType={rescheduleTarget.booking_type}
          providerId={providerId}
          serviceType={rescheduleTarget.service_type}
          currentScheduledAt={rescheduleTarget.scheduled_date}
          role="provider"
          onSuccess={() => setRescheduleTarget(null)}
        />
      )}
    </>
  );
}
