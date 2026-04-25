/* eslint-disable @typescript-eslint/no-explicit-any */
// CC-22 (Booking V3 Master Plan): tab "Buscar disponibilidad" retirado.
// Ahora hay una sola vista — mis reservas + CTAs claros a /veterinarios
// (canonical entry point). La búsqueda vive en el directorio, no acá.
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { GoogleCalendarStatusBanner } from '@/components/GoogleCalendarStatusBanner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMyBookingsV2 } from '@/hooks/useMyBookingsV2';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { formatBookingDate, formatTimeRange } from '@/lib/format';
import { Calendar, CalendarDays, CheckCircle2, Inbox, Star, Plus, Stethoscope } from '@/lib/icons';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { buildIcs, downloadIcs, bookingToIcsEvent } from '@/lib/calendar/ics';
import { BookServiceSheet } from '@/components/bookings/BookServiceSheet';

export default function MyBookings() {
  const { user } = useAuth();
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [bookSheetOpen, setBookSheetOpen] = useState(false);

  const handleSubmitReview = async () => {
    if (!user || !reviewBooking || reviewRating === 0) return;
    const providerId = reviewBooking.service_slots?.provider_id;
    if (!providerId) return;
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('service_reviews').insert({
        provider_id: providerId,
        reviewer_id: user.id,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
        service_type: reviewBooking.service_slots?.service_type || 'veterinarian',
        is_visible: true,
        verification_type: 'booking',
      });
      if (error) throw error;
      toast.success('¡Reseña enviada! Gracias por tu opinión');
      setReviewBooking(null);
      setReviewRating(0);
      setReviewComment('');
    } catch {
      toast.error('No se pudo enviar la reseña');
    } finally {
      setSubmittingReview(false);
    }
  };

  // ---- MY BOOKINGS (user's actual reservations) ----
  // V2 bookings from type-specific tables (vet_bookings, walk_bookings, etc.)
  const { data: v2Bookings, isLoading: loadingV2 } = useMyBookingsV2();

  // V1 bookings from legacy `bookings` table (created via service_slots flow)
  const { data: v1Bookings, isLoading: loadingV1 } = useQuery({
    queryKey: ['my-bookings-v1', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select(
          'id, payment_status, booked_at, service_slots(id, slot_date, start_time, end_time, service_type, provider_id)'
        )
        .eq('user_id', user.id)
        .order('booked_at', { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Enrich with provider info
      const providerIds = Array.from(
        new Set(data.map((b: any) => b.service_slots?.provider_id).filter(Boolean))
      );
      if (providerIds.length === 0) return data;

      const { data: providers } = await supabase
        .from('service_providers')
        .select('id, user_id, avg_rating, total_reviews')
        .in('id', providerIds);

      const userIds = Array.from(
        new Set((providers || []).map((p: any) => p.user_id).filter(Boolean))
      );
      const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', userIds)
        : { data: [] as any[] };

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const providerMap = new Map(
        (providers || []).map((p: any) => [
          p.id,
          { ...p, profiles: profileMap.get(p.user_id) || null },
        ])
      );

      return data.map((b: any) => ({
        ...b,
        provider: providerMap.get(b.service_slots?.provider_id) || null,
      }));
    },
    enabled: !!user?.id,
  });

  const loadingMyBookings = loadingV1 || loadingV2;

  // Merge V1 and V2 bookings into a unified list, sorted by date descending
  const myBookings = useMemo(() => {
    const unified: any[] = [];

    // Add V2 bookings (already in BookingView format)
    if (v2Bookings) {
      for (const b of v2Bookings) {
        unified.push({
          id: b.id,
          _source: 'v2' as const,
          payment_status: b.payment_status ?? b.status,
          service_slots: {
            slot_date: b.scheduled_date,
            start_time: b.start_time,
            end_time: b.end_time,
            service_type: b.service_type,
            provider_id: b.provider_id,
          },
          provider: {
            profiles: {
              display_name: b.provider_name ?? null,
              avatar_url: b.provider_avatar ?? null,
            },
          },
          pet_name: b.pet_name,
          booking_type: b.booking_type,
          status: b.status,
        });
      }
    }

    // Add V1 bookings (legacy bookings table)
    if (v1Bookings) {
      // Avoid duplicates: V1 bookings use a different id space so no collision expected,
      // but guard with a Set just in case
      const v2Ids = new Set(unified.map((u) => u.id));
      for (const b of v1Bookings) {
        if (!v2Ids.has(b.id)) {
          unified.push({ ...b, _source: 'v1' as const });
        }
      }
    }

    // Sort by date descending
    unified.sort((a, b) => {
      const dateA = a.service_slots?.slot_date || '';
      const dateB = b.service_slots?.slot_date || '';
      return dateB.localeCompare(dateA);
    });

    return unified;
  }, [v1Bookings, v2Bookings]);

  // My bookings metrics
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const myTodayCount = useMemo(() => {
    if (!myBookings) return 0;
    return myBookings.filter((b: any) => b.service_slots?.slot_date === todayStr).length;
  }, [myBookings, todayStr]);

  const myWeekCount = useMemo(() => {
    if (!myBookings) return 0;
    return myBookings.filter((b: any) => {
      const d = b.service_slots?.slot_date;
      if (!d) return false;
      const date = parseISO(d);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    }).length;
  }, [myBookings, weekStart, weekEnd]);

  const myTotalCount = myBookings?.length ?? 0;

  return (
    <>
      <PageHeader title="Mis reservas" />
      <div className="container max-w-6xl mx-auto p-4 space-y-4">
        <GoogleCalendarStatusBanner settingsHref="/profile" />

        {/* Mini métricas de MIS reservas */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="py-3 px-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  Hoy
                </span>
              </div>
              <p className="text-xl font-bold">{myTodayCount}</p>
              <p className="text-[11px] text-muted-foreground">mis citas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-3">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  Semana
                </span>
              </div>
              <p className="text-xl font-bold">{myWeekCount}</p>
              <p className="text-[11px] text-muted-foreground">mis citas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  Total
                </span>
              </div>
              <p className="text-xl font-bold">{myTotalCount}</p>
              <p className="text-[11px] text-muted-foreground">reservas</p>
            </CardContent>
          </Card>
        </div>

        {/* CC-22: Vista única de "Mis reservas". La búsqueda vive en /veterinarios. */}
        <div className="mt-4">
          {/* CTA primaria para agendar una cita nueva + ICS export opcional */}
          {myBookings && myBookings.length > 0 && (
            <div className="mb-3 flex flex-wrap justify-end gap-2">
              {FEATURE_FLAGS.ICS_EXPORT && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    // CC-32: export .ics para Apple/Outlook. Incluye todas las
                    // citas futuras no canceladas.
                    const future = myBookings.filter(
                      (b: any) =>
                        (b.service_slots?.slot_date ?? b.scheduled_date?.split('T')[0]) >=
                          todayStr && !['cancelado', 'no_show'].includes(b.status ?? '')
                    );
                    if (future.length === 0) {
                      toast.info('No hay citas futuras para exportar');
                      return;
                    }
                    const events = future.map((b: any) =>
                      bookingToIcsEvent({
                        id: b.id,
                        kind: b.booking_type ?? 'vet',
                        scheduled_date:
                          b.scheduled_date ?? `${b.service_slots?.slot_date}T00:00:00`,
                        start_time: b.start_time ?? b.service_slots?.start_time ?? null,
                        end_time: b.end_time ?? b.service_slots?.end_time ?? null,
                        service_type: b.service_type ?? b.service_slots?.service_type ?? 'Cita',
                        status: b.status ?? 'confirmado',
                        pet_name: b.pet_name ?? null,
                        provider_name: b.provider?.profiles?.display_name ?? null,
                      })
                    );
                    const ics = buildIcs(events, 'Paw Friend · Mis reservas');
                    downloadIcs(ics, `paw-friend-reservas-${todayStr}.ics`);
                    toast.success('Calendario descargado');
                  }}
                >
                  <CalendarDays className="h-4 w-4" />
                  Descargar calendario
                </Button>
              )}
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 gap-1.5"
                onClick={() => setBookSheetOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Reservar
              </Button>
            </div>
          )}
          {loadingMyBookings ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : !myBookings || myBookings.length === 0 ? (
            <Card>
              <CardContent className="py-10 px-4 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 mb-4">
                  <Inbox className="h-7 w-7 text-purple-500" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Aún no tienes reservas</h3>
                <p className="text-muted-foreground text-sm mb-5 max-w-sm mx-auto">
                  Agenda con un veterinario, paseador, cuidador o peluquero de Paw Friend. Sólo toma
                  un minuto.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                    onClick={() => setBookSheetOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Reservar servicio
                  </Button>
                </div>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left max-w-lg mx-auto">
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs font-medium mb-0.5">1. Elige fecha</p>
                    <p className="text-[11px] text-muted-foreground">
                      Abre el calendario y selecciona el día.
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs font-medium mb-0.5">2. Escoge el horario</p>
                    <p className="text-[11px] text-muted-foreground">
                      Filtra por tipo de servicio y proveedor.
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs font-medium mb-0.5">3. Reserva en 1 click</p>
                    <p className="text-[11px] text-muted-foreground">
                      Tu cita queda en el calendario al instante.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myBookings.map((booking: any) => {
                const slot = booking.service_slots;
                const provider = booking.provider;
                const profile = provider?.profiles;
                const slotDate = slot?.slot_date;
                const isPast = slotDate && slotDate < todayStr;
                const isBookingToday = slotDate === todayStr;

                // Status display for V2 bookings
                const displayStatus =
                  booking._source === 'v2' ? booking.status : booking.payment_status;

                const statusLabel =
                  displayStatus === 'paid' || displayStatus === 'confirmado'
                    ? 'Confirmada'
                    : displayStatus === 'pending' || displayStatus === 'pendiente'
                      ? 'Pendiente'
                      : displayStatus === 'completado'
                        ? 'Completada'
                        : displayStatus === 'cancelado'
                          ? 'Cancelada'
                          : displayStatus === 'en_curso'
                            ? 'En curso'
                            : displayStatus === 'no_show'
                              ? 'No se presentó'
                              : displayStatus || 'Sin estado';

                const statusVariant =
                  displayStatus === 'paid' ||
                  displayStatus === 'confirmado' ||
                  displayStatus === 'completado'
                    ? 'default'
                    : displayStatus === 'pending' ||
                        displayStatus === 'pendiente' ||
                        displayStatus === 'en_curso'
                      ? 'secondary'
                      : 'outline';

                return (
                  <Card key={booking.id} className={isPast ? 'opacity-60' : ''}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {profile?.display_name || 'Proveedor'}
                            </span>
                            {isBookingToday && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                Hoy
                              </Badge>
                            )}
                            {isPast && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Pasada
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">
                            {slotDate ? formatBookingDate(slotDate) : '—'}
                            {slot?.start_time &&
                              ` · ${formatTimeRange(slot.start_time, slot.end_time)}`}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {slot?.service_type && (
                              <p className="text-xs text-muted-foreground capitalize">
                                {slot.service_type}
                              </p>
                            )}
                            {booking.pet_name && (
                              <p className="text-xs text-muted-foreground">· {booking.pet_name}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <Badge variant={statusVariant as any} className="text-[10px]">
                            {statusLabel}
                          </Badge>
                          {isPast && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-purple-600 h-7 px-2"
                              onClick={() => setReviewBooking(booking)}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Reseña
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Review dialog */}
        <ResponsiveModal
          open={!!reviewBooking}
          onOpenChange={(open) => !open && setReviewBooking(null)}
          title="Dejar reseña"
          maxWidth="max-w-sm"
        >
          <div className="space-y-4">
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  onMouseEnter={() => setReviewHover(star)}
                  onMouseLeave={() => setReviewHover(0)}
                  className="p-1"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (reviewHover || reviewRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="¿Cómo fue tu experiencia?"
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setReviewBooking(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleSubmitReview}
                disabled={reviewRating === 0 || submittingReview}
              >
                {submittingReview ? 'Enviando...' : 'Enviar reseña'}
              </Button>
            </div>
          </div>
        </ResponsiveModal>

        {/* FAB mobile-friendly: tap target grande para reservar (refactor 2026-04-25) */}
        <div className="fixed bottom-20 right-4 z-30 sm:hidden">
          <Button
            onClick={() => setBookSheetOpen(true)}
            size="lg"
            className="h-14 rounded-full shadow-lg gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-5 w-5" />
            Reservar
          </Button>
        </div>

        {/* Bottom sheet con 4 cards de servicios — punto de entrada unico */}
        <BookServiceSheet open={bookSheetOpen} onOpenChange={setBookSheetOpen} />
      </div>
    </>
  );
}
