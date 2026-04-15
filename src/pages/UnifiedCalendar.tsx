import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { UnifiedDayView } from '@/components/calendar/UnifiedDayView';
import { CalendarFilters } from '@/components/calendar/CalendarFilters';
import { CalendarEvent, useUnifiedCalendar } from '@/hooks/useUnifiedCalendar';
import { useRoutines } from '@/hooks/useRoutines';
import { useActiveRole } from '@/hooks/useActiveRole';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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

  if (filterType !== 'all') {
    dayEvents = dayEvents.filter((e) => e.type === filterType);
  }

  const handleEventTap = (event: CalendarEvent) => {
    if (event.type === 'routine') {
      if (event.status === 'pending') {
        completeToday.mutate({ routineId: event.source_id });
      }
    } else if (event.type === 'reminder') {
      navigate('/reminders');
    } else if (event.type === 'booking') {
      navigate('/mis-reservas');
    } else if (event.type === 'followup' && event.pet_id) {
      navigate(`/ficha/${event.pet_id}`);
    } else if (event.type === 'vet_booking') {
      navigate('/mis-reservas');
    }
  };

  return (
    <>
      <PageHeader title={isProvider ? 'Agenda' : 'Calendario'} back={false} />

      <main className="container max-w-2xl mx-auto px-3 py-4 space-y-4 pb-24">
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

        <Card>
          <CardContent className="p-3">
            <CalendarGrid
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onChangeMonth={setCurrentMonth}
              slotsPerDay={{}}
              eventDotsPerDay={datesWithEvents}
            />
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex items-center gap-4 justify-center flex-wrap">
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

        <UnifiedDayView date={selectedDate} events={dayEvents} onEventTap={handleEventTap} />
      </main>
    </>
  );
}
