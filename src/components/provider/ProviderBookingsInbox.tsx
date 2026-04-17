import { useState } from 'react';
import { Inbox, CalendarDays, Clock, History } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookingCard,
  type BookingAction,
  type BookingCardData,
} from '@/components/booking/BookingCard';
import { CancelBookingDialog } from '@/components/booking/CancelBookingDialog';
import { useProviderBookingsInbox } from '@/hooks/useProviderBookingsInbox';
import {
  useConfirmBooking,
  useStartBooking,
  useMarkCompleted,
  useMarkNoShow,
} from '@/hooks/useBookingMutations';
import type { BookingStatus } from '@/lib/bookingStateMachine';

interface ProviderBookingsInboxProps {
  providerId: string | undefined;
}

export function ProviderBookingsInbox({ providerId }: ProviderBookingsInboxProps) {
  const [tab, setTab] = useState('pending');
  const [cancelTarget, setCancelTarget] = useState<BookingCardData | null>(null);

  const statusFilter: Record<string, BookingStatus | BookingStatus[]> = {
    pending: 'pendiente',
    today: ['confirmado', 'en_curso', 'en_camino'],
    upcoming: 'confirmado',
    past: ['completado', 'cancelado', 'no_show'],
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const pendingQuery = useProviderBookingsInbox(providerId, { status: 'pendiente' });
  const todayQuery = useProviderBookingsInbox(providerId, {
    status: statusFilter.today as BookingStatus[],
    date: todayStr,
  });
  const upcomingQuery = useProviderBookingsInbox(providerId, { status: 'confirmado' });
  const pastQuery = useProviderBookingsInbox(providerId, {
    status: statusFilter.past as BookingStatus[],
  });

  const confirmBooking = useConfirmBooking();
  const startBooking = useStartBooking();
  const markCompleted = useMarkCompleted();
  const markNoShow = useMarkNoShow();

  const handleAction = (action: BookingAction, booking: BookingCardData) => {
    switch (action) {
      case 'confirm':
        confirmBooking.mutate({ bookingId: booking.id, bookingType: booking.booking_type });
        break;
      case 'start':
        startBooking.mutate({ bookingId: booking.id, bookingType: booking.booking_type });
        break;
      case 'complete':
        markCompleted.mutate({ bookingId: booking.id, bookingType: booking.booking_type });
        break;
      case 'no_show':
        markNoShow.mutate({ bookingId: booking.id, bookingType: booking.booking_type });
        break;
      case 'cancel':
        setCancelTarget(booking);
        break;
      case 'detail':
        // TODO: open detail drawer
        break;
    }
  };

  const renderBookings = (data: typeof pendingQuery.data, isLoading: boolean) => {
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
      return (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
          Sin reservas en esta seccion
        </div>
      );
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
            }}
            onAction={handleAction}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Bandeja de reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="pending" className="text-xs">
                Pendientes
                {(pendingQuery.data?.length ?? 0) > 0 && (
                  <span className="ml-1 bg-amber-500 text-white rounded-full px-1.5 text-[10px]">
                    {pendingQuery.data?.length}
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

            <TabsContent value="pending" className="mt-3">
              {renderBookings(pendingQuery.data, pendingQuery.isLoading)}
            </TabsContent>
            <TabsContent value="today" className="mt-3">
              {renderBookings(todayQuery.data, todayQuery.isLoading)}
            </TabsContent>
            <TabsContent value="upcoming" className="mt-3">
              {renderBookings(upcomingQuery.data, upcomingQuery.isLoading)}
            </TabsContent>
            <TabsContent value="past" className="mt-3">
              {renderBookings(pastQuery.data, pastQuery.isLoading)}
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
          // eslint-disable-next-line jsx-a11y/aria-role -- `role` es prop custom de CancelBookingDialog, no atributo ARIA
          role="provider"
        />
      )}
    </>
  );
}
