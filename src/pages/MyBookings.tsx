/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { DaySlotsList } from '@/components/calendar/DaySlotsList';
import { BookingModal } from '@/components/calendar/BookingModal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, CalendarDays, Clock, CheckCircle2, Inbox, Star } from '@/lib/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const SERVICE_TYPES = [
  { value: 'all', label: 'Todos' },
  { value: 'vet', label: 'Veterinaria' },
  { value: 'walk', label: 'Paseo' },
  { value: 'dogsitter', label: 'Cuidador' },
  { value: 'training', label: 'Entrenamiento' },
  { value: 'grooming', label: 'Peluquería' },
];

export default function MyBookings() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterType, setFilterType] = useState('all');
  const [bookingSlot, setBookingSlot] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'my-bookings' | 'available'>('my-bookings');
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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
  const { data: myBookings, isLoading: loadingMyBookings } = useQuery({
    queryKey: ['my-bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select(
          'id, payment_status, created_at, service_slots(id, slot_date, start_time, end_time, service_type, provider_id)'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
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

  // ---- AVAILABLE SLOTS (browse & book) ----
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: slots, isLoading } = useQuery({
    queryKey: ['service-slots', dateStr, filterType],
    queryFn: async () => {
      let query = supabase
        .from('service_slots')
        .select(
          'id, slot_date, start_time, end_time, service_type, provider_id, price, max_capacity, current_bookings, title, is_active'
        )
        .eq('slot_date', dateStr)
        .eq('is_active', true)
        .order('start_time');

      if (filterType !== 'all') {
        query = query.eq('service_type', filterType);
      }

      const { data: rawSlots, error } = await query;
      if (error) throw error;
      if (!rawSlots || rawSlots.length === 0) return [];

      const providerIds = Array.from(
        new Set(rawSlots.map((s: any) => s.provider_id).filter(Boolean))
      );
      if (providerIds.length === 0) {
        return rawSlots.map((s: any) => ({ ...s, provider: null }));
      }

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

      return rawSlots.map((s: any) => ({
        ...s,
        provider: providerMap.get(s.provider_id) || null,
      }));
    },
    enabled: activeTab === 'available',
  });

  // Fetch slots count per day for the month (for calendar dots)
  const monthStart = format(
    new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
    'yyyy-MM-dd'
  );
  const monthEnd = format(
    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0),
    'yyyy-MM-dd'
  );

  const { data: monthSlots } = useQuery({
    queryKey: ['month-slots', monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_slots')
        .select('slot_date')
        .eq('is_active', true)
        .gte('slot_date', monthStart)
        .lte('slot_date', monthEnd);
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((s) => {
        counts[s.slot_date] = (counts[s.slot_date] || 0) + 1;
      });
      return counts;
    },
    enabled: activeTab === 'available',
  });

  return (
    <>
      <PageHeader title="Mis reservas" />
      <div className="container max-w-6xl mx-auto p-4 space-y-4">
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

        {/* Tabs: Mis Reservas vs Buscar disponibilidad */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-bookings">
              <Inbox className="h-4 w-4 mr-2" />
              Mis reservas
            </TabsTrigger>
            <TabsTrigger value="available">
              <Calendar className="h-4 w-4 mr-2" />
              Buscar disponibilidad
            </TabsTrigger>
          </TabsList>

          {/* Tab: Mis reservas */}
          <TabsContent value="my-bookings" className="mt-4">
            {loadingMyBookings ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : !myBookings || myBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Inbox className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                  <h3 className="font-semibold text-lg mb-1">Sin reservas aún</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Busca disponibilidad en la pestaña "Buscar disponibilidad" para agendar tu
                    primera cita.
                  </p>
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
                            <p className="text-xs text-muted-foreground">
                              {slotDate
                                ? format(parseISO(slotDate), "EEEE d 'de' MMMM", { locale: es })
                                : '—'}
                              {slot?.start_time && ` · ${slot.start_time.slice(0, 5)}`}
                              {slot?.end_time && `–${slot.end_time.slice(0, 5)}`}
                            </p>
                            {slot?.service_type && (
                              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                {slot.service_type}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <Badge
                              variant={
                                booking.payment_status === 'paid'
                                  ? 'default'
                                  : booking.payment_status === 'pending'
                                    ? 'secondary'
                                    : 'outline'
                              }
                              className="text-[10px]"
                            >
                              {booking.payment_status === 'paid'
                                ? 'Confirmada'
                                : booking.payment_status === 'pending'
                                  ? 'Pendiente'
                                  : booking.payment_status || 'Sin estado'}
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
          </TabsContent>

          {/* Tab: Buscar disponibilidad */}
          <TabsContent value="available" className="mt-4 space-y-4">
            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filterType === type.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Grid: Calendario + Slots del día */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3">
                <Card className="border-0 shadow-md">
                  <CardContent className="pt-4">
                    <CalendarGrid
                      currentMonth={currentMonth}
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                      onChangeMonth={setCurrentMonth}
                      slotsPerDay={monthSlots || {}}
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardContent className="pt-4">
                    <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-500" />
                      {format(selectedDate, 'EEEE d MMMM', { locale: es })}
                    </h2>
                    <DaySlotsList
                      slots={slots || []}
                      isLoading={isLoading}
                      onBook={setBookingSlot}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Booking modal */}
        {bookingSlot && (
          <BookingModal
            slot={bookingSlot}
            open={!!bookingSlot}
            onClose={() => setBookingSlot(null)}
          />
        )}

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
      </div>
    </>
  );
}
