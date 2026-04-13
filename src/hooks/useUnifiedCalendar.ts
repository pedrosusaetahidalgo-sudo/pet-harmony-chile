import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  addDays,
  eachDayOfInterval,
  isPast,
  startOfDay,
} from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoutines, Routine, RoutineCompletion, ROUTINE_CATEGORIES } from '@/hooks/useRoutines';
import { useReminders, Reminder } from '@/hooks/useReminders';

export interface CalendarEvent {
  id: string;
  type: 'routine' | 'reminder' | 'booking';
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
  const { routines, completions: routineCompletions } = useRoutines(filterPetId);
  const { reminders } = useReminders();

  // Fetch completions for the full month
  const monthStart = format(startOfMonth(new Date(year, month)), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date(year, month)), 'yyyy-MM-dd');

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

  const events = useMemo(() => {
    const result: CalendarEvent[] = [];
    const from = startOfMonth(new Date(year, month));
    const to = endOfMonth(new Date(year, month));
    const days = eachDayOfInterval({ start: from, end: to });
    const todayStart = startOfDay(new Date());

    // 1. Expand routines across the month
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
        status: r.is_completed ? 'completed' : isPast(new Date(r.due_date)) ? 'overdue' : 'pending',
        category: r.type,
        color: REMINDER_COLORS[r.type] || '#6b7280',
        source_id: r.id,
        is_recurring: r.is_recurring || false,
      });
    }

    // Sort by date then time
    result.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      if (cmp !== 0) return cmp;
      return (a.time ?? '23:59').localeCompare(b.time ?? '23:59');
    });

    return result;
  }, [routines, monthCompletions, reminders, year, month, filterPetId]);

  const eventsForDate = (date: string) => events.filter((e) => e.date === date);

  const datesWithEvents = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const e of events) {
      if (!map[e.date]) map[e.date] = new Set();
      map[e.date].add(e.type);
    }
    return map;
  }, [events]);

  const isLoading = false; // Derived from already-loaded hooks

  return {
    events,
    isLoading,
    eventsForDate,
    datesWithEvents,
  };
};
