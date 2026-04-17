import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { UnifiedDayView } from '@/components/calendar/UnifiedDayView';
import { CalendarFilters } from '@/components/calendar/CalendarFilters';
import { CalendarEvent, useUnifiedCalendar } from '@/hooks/useUnifiedCalendar';
import { useRoutines } from '@/hooks/useRoutines';
import { useActiveRole } from '@/hooks/useActiveRole';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Plus, Stethoscope, Bell, PawPrint } from '@/lib/icons';
import { LINKS } from '@/lib/links';

export default function UnifiedCalendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isProvider } = useActiveRole();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterPetId, setFilterPetId] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const { data: pets = [] } = useQuery({
    queryKey: ['my-pets-calendar', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('pets')
        .select('id, name, photo_url')
        .eq('owner_id', user.id)
        .eq('lifecycle_status', 'active')
        .order('name');
      return data || [];
    },
    enabled: !!user && !isProvider,
    staleTime: 5 * 60 * 1000,
  });

  const petId = filterPetId === 'all' ? undefined : filterPetId;

  const { events, eventsForDate, datesWithEvents } = useUnifiedCalendar(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    petId
  );

  const { completeToday, skipToday } = useRoutines();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  let dayEvents = eventsForDate(dateStr);

  // Provider: filter out routines — only show bookings, followups, vet_bookings
  if (isProvider) {
    dayEvents = dayEvents.filter((e) => e.type !== 'routine');
  }

  if (filterType !== 'all') {
    dayEvents = dayEvents.filter((e) => e.type === filterType);
  }

  const handleEventTap = (event: CalendarEvent) => {
    if (event.type === 'routine') {
      if (event.status === 'pending') {
        completeToday.mutate({ routineId: event.source_id });
      }
    } else if (event.type === 'reminder') {
      navigate(LINKS.remindersTab());
    } else if (event.type === 'booking' || event.type === 'vet_booking') {
      navigate(LINKS.bookingsTab());
    } else if (event.type === 'followup' && event.pet_id) {
      navigate(LINKS.petClinical(event.pet_id));
    }
  };

  // Summary counts for today
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayEvents = eventsForDate(todayStr).filter((e) =>
    isProvider ? e.type !== 'routine' : true
  );
  const todayBookings = todayEvents.filter(
    (e) => e.type === 'booking' || e.type === 'vet_booking'
  ).length;
  const todayReminders = todayEvents.filter((e) => e.type === 'reminder').length;
  const todayRoutines = isProvider ? 0 : todayEvents.filter((e) => e.type === 'routine').length;

  // Selected date label
  const selectedLabel = isToday(selectedDate)
    ? 'Hoy'
    : isTomorrow(selectedDate)
      ? 'Manana'
      : format(selectedDate, "EEEE d 'de' MMMM", { locale: es });

  return (
    <>
      <PageHeader
        title={isProvider ? 'Agenda' : 'Calendario'}
        subtitle={isProvider ? 'Reservas y citas con pacientes' : 'Rutinas, recordatorios y citas'}
        back={false}
      />

      <main className="container max-w-3xl mx-auto px-3 py-4 space-y-4 pb-24">
        {/* Today summary strip */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <Badge
            variant="outline"
            className="shrink-0 h-8 px-3 gap-1.5 text-xs font-medium bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10"
            onClick={() => {
              setSelectedDate(new Date());
              setCurrentMonth(new Date());
            }}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Hoy
          </Badge>
          {todayBookings > 0 && (
            <Badge
              variant="outline"
              className="shrink-0 h-8 px-3 gap-1 text-xs bg-violet-50 border-violet-200 text-violet-700"
            >
              <Stethoscope className="h-3 w-3" />
              {todayBookings} {todayBookings === 1 ? 'cita' : 'citas'}
            </Badge>
          )}
          {todayReminders > 0 && (
            <Badge
              variant="outline"
              className="shrink-0 h-8 px-3 gap-1 text-xs bg-amber-50 border-amber-200 text-amber-700"
            >
              <Bell className="h-3 w-3" />
              {todayReminders} {todayReminders === 1 ? 'recordatorio' : 'recordatorios'}
            </Badge>
          )}
          {todayRoutines > 0 && (
            <Badge
              variant="outline"
              className="shrink-0 h-8 px-3 gap-1 text-xs bg-blue-50 border-blue-200 text-blue-700"
            >
              <PawPrint className="h-3 w-3" />
              {todayRoutines} {todayRoutines === 1 ? 'rutina' : 'rutinas'}
            </Badge>
          )}
          {todayBookings === 0 && todayReminders === 0 && todayRoutines === 0 && (
            <span className="text-xs text-muted-foreground shrink-0">Sin actividades hoy</span>
          )}
        </div>

        {/* Filters: only show pet filter for owners */}
        {!isProvider && (
          <CalendarFilters
            pets={pets}
            selectedPetId={filterPetId}
            onPetChange={setFilterPetId}
            selectedType={filterType}
            onTypeChange={setFilterType}
          />
        )}

        {/* Calendar + Day view side by side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Calendar grid */}
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <CalendarGrid
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onChangeMonth={setCurrentMonth}
                slotsPerDay={{}}
                eventDotsPerDay={datesWithEvents}
              />
              {/* Legend inline below calendar */}
              <div className="flex items-center gap-3 justify-center mt-3 pt-3 border-t">
                {isProvider ? (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-teal-500" />
                      <span className="text-[10px] text-muted-foreground">Citas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-[10px] text-muted-foreground">Seguimientos</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-[10px] text-muted-foreground">Rutinas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-[10px] text-muted-foreground">Recordatorios</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-violet-500" />
                      <span className="text-[10px] text-muted-foreground">Citas</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Day view */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold capitalize">{selectedLabel}</h3>
              <span className="text-[10px] text-muted-foreground">
                {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
              </span>
            </div>
            <UnifiedDayView date={selectedDate} events={dayEvents} onEventTap={handleEventTap} />
            {/* Quick add buttons */}
            {!isProvider && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-8 gap-1"
                  onClick={() => navigate(LINKS.remindersTab())}
                >
                  <Plus className="h-3 w-3" /> Recordatorio
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-8 gap-1"
                  onClick={() => navigate(LINKS.routinesTab())}
                >
                  <Plus className="h-3 w-3" /> Rutina
                </Button>
              </div>
            )}
            {isProvider && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 gap-1 mt-2"
                onClick={() => navigate(LINKS.bookingsTab())}
              >
                Ver todas las reservas
              </Button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
