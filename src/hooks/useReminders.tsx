import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { describeSupabaseError } from '@/lib/supabaseErrors';
import { usePlan } from '@/hooks/usePlan';
import { awardPoints } from '@/lib/points';

function nextDueDate(current: string, interval: string): string {
  const d = new Date(current);
  switch (interval) {
    case 'weekly':
      return addWeeks(d, 1).toISOString();
    case 'monthly':
      return addMonths(d, 1).toISOString();
    case 'quarterly':
      return addMonths(d, 3).toISOString();
    case 'biannual':
      return addMonths(d, 6).toISOString();
    case 'yearly':
      return addYears(d, 1).toISOString();
    default:
      return addMonths(d, 1).toISOString();
  }
}

export interface Reminder {
  id: string;
  pet_id: string;
  owner_id: string;
  type: string;
  title: string;
  description: string | null;
  due_date: string;
  is_recurring: boolean;
  recurrence_interval: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  pets?: { name: string; species: string } | null;
}

export const useReminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkAccess } = usePlan();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['pet-reminders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Only fetch pending + recently completed (last 30 days) to avoid
      // downloading entire reminder history for long-time users
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('pet_reminders')
        .select('*, pets(name, species)')
        .eq('owner_id', user.id)
        .or(`is_completed.eq.false,completed_at.gte.${thirtyDaysAgo.toISOString()}`)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return (data || []) as Reminder[];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const upcomingReminders = reminders.filter(
    (r) => !r.is_completed && new Date(r.due_date) >= new Date(new Date().toDateString())
  );

  const overdueReminders = reminders.filter(
    (r) => !r.is_completed && new Date(r.due_date) < new Date(new Date().toDateString())
  );

  const addReminder = useMutation({
    mutationFn: async (reminder: {
      pet_id: string;
      type: string;
      title: string;
      description?: string;
      due_date: string;
      is_recurring?: boolean;
      recurrence_interval?: string;
    }) => {
      // Enforcement: check plan limit for active reminders
      const activeCount = reminders.filter((r) => !r.is_completed).length;
      const access = checkAccess('max_reminders', activeCount);
      if (!access.allowed) {
        throw new Error(access.reason || 'Llegaste al límite de recordatorios de tu plan');
      }

      const { error } = await supabase.from('pet_reminders').insert({
        ...reminder,
        owner_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-reminders'] });
      toast({ title: 'Recordatorio creado' });
      // Auto-sync con Google Calendar en background si esta conectado.
      // No bloquea la UI ni muestra errores - es best effort.
      supabase.functions.invoke('google-calendar-sync').catch(() => {
        /* silent fail: el user puede sincronizar manual desde Settings */
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Algo salió mal',
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
        variant: 'destructive',
      });
    },
  });

  const snoozeReminder = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      const reminder = reminders.find((r) => r.id === id);
      if (!reminder) throw new Error('Recordatorio no encontrado');
      const newDate = addDays(new Date(reminder.due_date), days);
      const { error } = await supabase
        .from('pet_reminders')
        .update({ due_date: newDate.toISOString() })
        .eq('id', id);
      if (error) throw error;
      return newDate;
    },
    onSuccess: (newDate) => {
      queryClient.invalidateQueries({ queryKey: ['pet-reminders'] });
      toast({ title: `Pospuesto hasta ${format(newDate, "d 'de' MMMM", { locale: es })}` });
    },
    onError: (error: Error) => {
      toast({
        title: 'No se pudo posponer',
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
        variant: 'destructive',
      });
    },
  });

  const completeReminder = useMutation({
    mutationFn: async (id: string) => {
      const reminder = reminders.find((r) => r.id === id);
      const { error } = await supabase
        .from('pet_reminders')
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;

      // P6: si es recurrente, crear el proximo automaticamente
      if (reminder?.is_recurring && reminder.recurrence_interval) {
        const newDue = nextDueDate(reminder.due_date, reminder.recurrence_interval);
        const { error: insertError } = await supabase.from('pet_reminders').insert({
          pet_id: reminder.pet_id,
          owner_id: reminder.owner_id,
          type: reminder.type,
          title: reminder.title,
          description: reminder.description,
          due_date: newDue,
          is_recurring: true,
          recurrence_interval: reminder.recurrence_interval,
        });
        return { wasRecurring: true, nextDate: new Date(newDue), insertError };
      }
      // Award gamification points (fire-and-forget)
      if (user?.id && reminder) {
        const isOverdue = new Date(reminder.due_date) < new Date();
        awardPoints(user.id, isOverdue ? 'complete_reminder_late' : 'complete_reminder_ontime', {
          reminder_type: reminder.type,
          pet_id: reminder.pet_id,
        }).catch(() => {});
      }

      return { wasRecurring: false, nextDate: null };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pet-reminders'] });
      if (result?.wasRecurring && result.nextDate) {
        if (result.insertError) {
          toast({
            title: 'Recordatorio completado, pero el siguiente no se pudo crear.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: `Completado — proximo recordatorio creado para ${format(result.nextDate, "d 'de' MMMM", { locale: es })}`,
          });
        }
      } else {
        toast({ title: 'Recordatorio completado' });
      }
    },
  });

  const deleteReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pet_reminders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-reminders'] });
    },
  });

  const activeCount = reminders.filter((r) => !r.is_completed).length;
  const reminderAccess = checkAccess('max_reminders', activeCount);

  return {
    reminders,
    upcomingReminders,
    overdueReminders,
    isLoading,
    addReminder,
    completeReminder,
    snoozeReminder,
    deleteReminder,
    reminderLimitReached: !reminderAccess.allowed,
    reminderLimitReason: reminderAccess.reason,
  };
};
