import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { describeSupabaseError } from '@/lib/supabaseErrors';
import { usePlan } from '@/hooks/usePlan';

export type RoutineCategory =
  | 'paseo'
  | 'comida'
  | 'medicacion'
  | 'higiene'
  | 'entrenamiento'
  | 'juego'
  | 'suplemento'
  | 'otro';

export interface Routine {
  id: string;
  pet_id: string;
  owner_id: string;
  category: RoutineCategory;
  title: string;
  description: string | null;
  icon: string | null;
  days_of_week: number[];
  time_of_day: string;
  duration_minutes: number | null;
  notify_before_minutes: number;
  notify_channels: string[];
  is_active: boolean;
  starts_on: string;
  ends_on: string | null;
  created_at: string;
  updated_at: string;
  pets?: { name: string; species: string; photo_url: string | null } | null;
}

export interface RoutineCompletion {
  id: string;
  routine_id: string;
  completed_date: string;
  completed_at: string;
  notes: string | null;
  skipped: boolean;
  skip_reason: string | null;
}

export const ROUTINE_CATEGORIES: Record<
  RoutineCategory,
  { label: string; icon: string; color: string }
> = {
  paseo: { label: 'Paseo', icon: 'Footprints', color: '#22c55e' },
  comida: { label: 'Comida', icon: 'UtensilsCrossed', color: '#f59e0b' },
  medicacion: { label: 'Medicacion', icon: 'Pill', color: '#ef4444' },
  higiene: { label: 'Higiene', icon: 'Droplets', color: '#06b6d4' },
  entrenamiento: { label: 'Entrenamiento', icon: 'Dumbbell', color: '#8b5cf6' },
  juego: { label: 'Juego', icon: 'Gamepad2', color: '#ec4899' },
  suplemento: { label: 'Suplemento', icon: 'Leaf', color: '#10b981' },
  otro: { label: 'Otro', icon: 'MoreHorizontal', color: '#6b7280' },
};

export interface RoutineInput {
  pet_id: string;
  category: RoutineCategory;
  title: string;
  description?: string;
  icon?: string;
  days_of_week: number[];
  time_of_day: string;
  duration_minutes?: number;
  notify_before_minutes?: number;
  notify_channels?: string[];
  starts_on?: string;
  ends_on?: string;
}

export const useRoutines = (filterPetId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkAccess } = usePlan();

  // Fetch routines
  const { data: routines = [], isLoading } = useQuery({
    queryKey: ['pet-routines', user?.id, filterPetId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('pet_routines')
        .select('*, pets(name, species, photo_url)')
        .eq('owner_id', user.id)
        .order('time_of_day', { ascending: true });

      if (filterPetId) {
        query = query.eq('pet_id', filterPetId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Routine[];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch completions for this week
  const routineIds = routines.map((r) => r.id);
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data: completions = [] } = useQuery({
    queryKey: ['routine-completions', routineIds, weekStart, weekEnd],
    queryFn: async () => {
      if (routineIds.length === 0) return [];
      const { data, error } = await supabase
        .from('routine_completions')
        .select('*')
        .in('routine_id', routineIds)
        .gte('completed_date', weekStart)
        .lte('completed_date', weekEnd);
      if (error) throw error;
      return (data || []) as RoutineCompletion[];
    },
    enabled: routineIds.length > 0,
    staleTime: 60 * 1000,
  });

  const activeRoutines = routines.filter((r) => r.is_active);

  const addRoutine = useMutation({
    mutationFn: async (input: RoutineInput) => {
      const petRoutineCount = routines.filter(
        (r) => r.pet_id === input.pet_id && r.is_active
      ).length;
      const access = checkAccess('max_routines_per_pet', petRoutineCount);
      if (!access.allowed) {
        throw new Error(access.reason || 'Llegaste al limite de rutinas por mascota en tu plan');
      }

      const { error } = await supabase.from('pet_routines').insert({
        ...input,
        owner_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-routines'] });
      queryClient.invalidateQueries({ queryKey: ['unified-calendar'] });
      toast({ title: 'Rutina creada' });
    },
    onError: (error: Error) => {
      toast({
        title: 'No se pudo crear la rutina',
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
        variant: 'destructive',
      });
    },
  });

  const updateRoutine = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RoutineInput> & { id: string }) => {
      const { error } = await supabase
        .from('pet_routines')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-routines'] });
      queryClient.invalidateQueries({ queryKey: ['unified-calendar'] });
      toast({ title: 'Rutina actualizada' });
    },
    onError: (error: Error) => {
      toast({
        title: 'No se pudo actualizar',
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
        variant: 'destructive',
      });
    },
  });

  const deleteRoutine = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pet_routines').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-routines'] });
      queryClient.invalidateQueries({ queryKey: ['unified-calendar'] });
      toast({ title: 'Rutina eliminada' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('pet_routines')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-routines'] });
      queryClient.invalidateQueries({ queryKey: ['unified-calendar'] });
    },
  });

  const completeToday = useMutation({
    mutationFn: async ({ routineId, notes }: { routineId: string; notes?: string }) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { error } = await supabase.from('routine_completions').upsert(
        {
          routine_id: routineId,
          completed_date: today,
          skipped: false,
          notes: notes || null,
        },
        { onConflict: 'routine_id,completed_date' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routine-completions'] });
      queryClient.invalidateQueries({ queryKey: ['unified-calendar'] });
      toast({ title: 'Rutina completada' });
    },
  });

  const skipToday = useMutation({
    mutationFn: async ({ routineId, reason }: { routineId: string; reason?: string }) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { error } = await supabase.from('routine_completions').upsert(
        {
          routine_id: routineId,
          completed_date: today,
          skipped: true,
          skip_reason: reason || null,
        },
        { onConflict: 'routine_id,completed_date' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routine-completions'] });
      queryClient.invalidateQueries({ queryKey: ['unified-calendar'] });
    },
  });

  const getCompletionForDate = (routineId: string, date: string): RoutineCompletion | undefined => {
    return completions.find((c) => c.routine_id === routineId && c.completed_date === date);
  };

  const completionRate = (routineId: string, days: number): number => {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return 0;

    const end = new Date();
    const start = subDays(end, days - 1);
    const allDays = eachDayOfInterval({ start, end });
    const scheduledDays = allDays.filter((d) => routine.days_of_week.includes(d.getDay()));
    if (scheduledDays.length === 0) return 100;

    const completedCount = scheduledDays.filter((d) => {
      const dateStr = format(d, 'yyyy-MM-dd');
      return completions.some(
        (c) => c.routine_id === routineId && c.completed_date === dateStr && !c.skipped
      );
    }).length;

    return Math.round((completedCount / scheduledDays.length) * 100);
  };

  // Today's routines
  const today = new Date();
  const dow = today.getDay();
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayRoutines = activeRoutines
    .filter((r) => r.days_of_week.includes(dow))
    .map((r) => ({
      ...r,
      todayCompletion: getCompletionForDate(r.id, todayStr),
    }));

  return {
    routines,
    activeRoutines,
    isLoading,
    completions,
    todayRoutines,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    toggleActive,
    completeToday,
    skipToday,
    getCompletionForDate,
    completionRate,
  };
};
