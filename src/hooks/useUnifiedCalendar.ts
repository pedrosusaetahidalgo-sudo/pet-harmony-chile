/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isPast, startOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRole } from '@/hooks/useActiveRole';
import { useRoutines, RoutineCompletion, ROUTINE_CATEGORIES } from '@/hooks/useRoutines';
import { useReminders } from '@/hooks/useReminders';

export interface CalendarEvent {
  id: string;
  type: 'routine' | 'reminder' | 'booking' | 'followup' | 'vet_booking';
  title: string;
  description: string | null;
  pet_name: string;
  pet_id: string;
  date: string;
  time: string | null;
  duration_minutes: number | null;
  status: 'pending' | 'completed' | 'skipped' | 'overdue';
  category: string;
  color: string;
  source_id: string;
  is_recurring: boolean;
}

const REMINDER_COLORS: Record<string, string> = {
  vaccine: '#f59e0b',
  deworming: '#f97316',
  checkup: '#6366f1',
  medication: '#ef4444',
  grooming: '#ec4899',
  other: '#6b7280',
};

export const useUnifiedCalendar = (year: number, month: number, filterPetId?: string) => {
  const { user } = useAuth();
  const { isProvider } = useActiveRole();
  const { routines, completions: routineCompletions } = useRoutines(filterPetId);
  const { reminders } = useReminders();

  const monthStart = format(startOfMonth(new Date(year, month)), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date(year, month)), 'yyyy-MM-dd');

  // Fetch routine completions for the month
  const { data: monthCompletions = [] } = useQuery({
    queryKey: ['routine-completions-month', routines.map((r) => r.id), monthStart, monthEnd],
    queryFn: async () => {
      const ids = routines.map((r) => r.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('routine_completions')
        .select('*')
        .in('routine_id', ids)
        .gte('completed_date', monthStart)
        .lte('completed_date', monthEnd);
      if (error) throw error;
      return (data || []) as RoutineCompletion[];
    },
    enabled: routines.length > 0,
    staleTime: 60 * 1000,
  });

  // ── Vet-specific data: follow-ups from clinical notes ──
  const { data: vetFollowups = [] } = useQuery({
    queryKey: ['vet-followups-calendar', user?.id, monthStart, monthEnd],
    queryFn: async () => {
      if (!user?.id) return [];
      // Get provider id
      const { data: provider } = await (supabase as any)
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!provider) return [];

      const { data, error } = await (supabase as any)
        .from('vet_clinical_notes')
        .select('id, pet_id, title, followup_date, followup_reason, note_type, pets(name)')
        .eq('provider_id', provider.id)
        .eq('followup_required', true)
        .not('followup_date', 'is', null)
        .gte('followup_date', monthStart)
        .lte('followup_date', monthEnd);
      if (error) return [];
      return (data || []) as Array<{
        id: string;
        pet_id: string;
        title: string;
        followup_date: string;
        followup_reason: string | null;
        note_type: string;
        pets: { name: string } | null;
      }>;
    },
    enabled: !!user?.id && isProvider,
    staleTime: 2 * 60 * 1000,
  });

  // ── Vet-specific data: bookings/appointments ──
  const { data: vetBookings = [] } = useQuery({
    queryKey: ['vet-bookings-calendar', user?.id, monthStart, monthEnd],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: provider } = await (supabase as any)
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!provider) return [];

      const { data, error } = await (supabase as any)
        .from('order_items')
        .select('id, service_type, scheduled_date, pet_ids, orders!inner(payment_status)')
        .eq('provider_id', provider.id)
        .gte('scheduled_date', monthStart)
        .lte('scheduled_date', monthEnd);
      if (error) return [];
      const completed = ((data || []) as any[]).filter(
        (item: any) => item.orders?.payment_status === 'completed'
      );
      // Fetch pet names for display
      const allPetIds = [...new Set(completed.flatMap((item: any) => item.pet_ids || []))];
      let petMap = new Map<string, string>();
      if (allPetIds.length > 0) {
        const { data: pets } = await supabase.from('pets').select('id, name').in('id', allPetIds);
        petMap = new Map((pets || []).map((p) => [p.id, p.name]));
      }
      return completed.map((item: any) => ({
        ...item,
        pets: item.pet_ids?.[0]
          ? { name: petMap.get(item.pet_ids[0]) || 'Paciente', id: item.pet_ids[0] }
          : null,
      }));
    },
    enabled: !!user?.id && isProvider,
    staleTime: 2 * 60 * 1000,
  });

  const events = useMemo(() => {
    const result: CalendarEvent[] = [];
    const from = startOfMonth(new Date(year, month));
    const to = endOfMonth(new Date(year, month));
    const days = eachDayOfInterval({ start: from, end: to });
    const todayStart = startOfDay(new Date());

    // ── Owner events ──

    // 1. Expand routines across the month
    if (!isProvider) {
      const activeRoutines = routines.filter((r) => r.is_active);
      for (const routine of activeRoutines) {
        if (filterPetId && routine.pet_id !== filterPetId) continue;

        for (const d of days) {
          const dow = d.getDay();
          if (!routine.days_of_week.includes(dow)) continue;
          if (d < new Date(routine.starts_on)) continue;
          if (routine.ends_on && d > new Date(routine.ends_on)) continue;

          const dateStr = format(d, 'yyyy-MM-dd');
          const completion = monthCompletions.find(
            (c) => c.routine_id === routine.id && c.completed_date === dateStr
          );

          const cat = ROUTINE_CATEGORIES[routine.category as keyof typeof ROUTINE_CATEGORIES];

          result.push({
            id: `routine-${routine.id}-${dateStr}`,
            type: 'routine',
            title: routine.title,
            description: routine.description,
            pet_name: routine.pets?.name ?? '',
            pet_id: routine.pet_id,
            date: dateStr,
            time: routine.time_of_day.slice(0, 5),
            duration_minutes: routine.duration_minutes,
            status: completion
              ? completion.skipped
                ? 'skipped'
                : 'completed'
              : d < todayStart
                ? 'overdue'
                : 'pending',
            category: routine.category,
            color: cat?.color || '#6b7280',
            source_id: routine.id,
            is_recurring: true,
          });
        }
      }

      // 2. Reminders
      for (const r of reminders) {
        if (filterPetId && r.pet_id !== filterPetId) continue;
        const dueDate = r.due_date.slice(0, 10);
        if (dueDate < monthStart || dueDate > monthEnd) continue;

        result.push({
          id: `reminder-${r.id}`,
          type: 'reminder',
          title: r.title,
          description: r.description,
          pet_name: r.pets?.name ?? '',
          pet_id: r.pet_id,
          date: dueDate,
          time: null,
          duration_minutes: null,
          status: r.is_completed
            ? 'completed'
            : isPast(new Date(r.due_date))
              ? 'overdue'
              : 'pending',
          category: r.type,
          color: REMINDER_COLORS[r.type] || '#6b7280',
          source_id: r.id,
          is_recurring: r.is_recurring || false,
        });
      }
    }

    // ── Vet events ──
    if (isProvider) {
      // Follow-ups from clinical notes
      for (const fu of vetFollowups) {
        const dateStr = fu.followup_date.slice(0, 10);
        result.push({
          id: `followup-${fu.id}`,
          type: 'followup',
          title: `Seguimiento: ${fu.title}`,
          description: fu.followup_reason,
          pet_name: fu.pets?.name ?? '',
          pet_id: fu.pet_id,
          date: dateStr,
          time: null,
          duration_minutes: null,
          status: isPast(new Date(dateStr + 'T23:59:59')) ? 'overdue' : 'pending',
          category: fu.note_type,
          color: '#f59e0b', // amber for follow-ups
          source_id: fu.id,
          is_recurring: false,
        });
      }

      // Booked appointments
      for (const b of vetBookings) {
        const dateStr = (b.scheduled_date ?? '').slice(0, 10);
        if (!dateStr) continue;
        const serviceLabel =
          {
            consultation: 'Consulta',
            vaccination: 'Vacunación',
            surgery: 'Cirugía',
            grooming: 'Peluquería',
            dental: 'Dental',
            emergency: 'Urgencia',
          }[b.service_type as string] ||
          b.service_type ||
          'Cita';

        result.push({
          id: `vet-booking-${b.id}`,
          type: 'vet_booking',
          title: `${serviceLabel} — ${b.pets?.name ?? 'Paciente'}`,
          description: null,
          pet_name: b.pets?.name ?? '',
          pet_id: b.pets?.id ?? '',
          date: dateStr,
          time: null,
          duration_minutes: null,
          status: isPast(new Date(dateStr + 'T23:59:59')) ? 'completed' : 'pending',
          category: b.service_type || 'consultation',
          color: '#0d9488', // teal for vet bookings
          source_id: b.id,
          is_recurring: false,
        });
      }
    }

    // Sort by date then time
    result.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      if (cmp !== 0) return cmp;
      return (a.time ?? '23:59').localeCompare(b.time ?? '23:59');
    });

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- monthStart/monthEnd se derivan de year+month; redundantes
  }, [
    routines,
    monthCompletions,
    reminders,
    vetFollowups,
    vetBookings,
    isProvider,
    year,
    month,
    filterPetId,
  ]);

  const eventsForDate = (date: string) => events.filter((e) => e.date === date);

  const datesWithEvents = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const e of events) {
      if (!map[e.date]) map[e.date] = new Set();
      map[e.date].add(e.type);
    }
    return map;
  }, [events]);

  return {
    events,
    isLoading: false,
    eventsForDate,
    datesWithEvents,
  };
};
