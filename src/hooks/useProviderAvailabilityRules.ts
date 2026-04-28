import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AvailabilityRule, AvailabilityException } from '@/lib/availabilitySlots';

interface UpsertRuleInput {
  id?: string;
  provider_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  service_type?: string | null;
  slot_duration_minutes?: number;
  buffer_minutes?: number;
  capacity?: number;
  is_active?: boolean;
}

interface ExceptionInput {
  provider_id: string;
  exception_date: string;
  exception_type: 'block' | 'override';
  start_time?: string | null;
  end_time?: string | null;
  reason?: string | null;
}

export function useProviderAvailabilityRules(providerId: string | undefined) {
  const queryClient = useQueryClient();

  const rulesQuery = useQuery({
    queryKey: ['availability-rules', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const { data, error } = await supabase
        .from('provider_availability_rules')
        .select('*')
        .eq('provider_id', providerId)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return (data ?? []) as AvailabilityRule[];
    },
    enabled: !!providerId,
    staleTime: 120_000,
  });

  const exceptionsQuery = useQuery({
    queryKey: ['availability-exceptions', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const { data, error } = await supabase
        .from('provider_availability_exceptions')
        .select('*')
        .eq('provider_id', providerId)
        .gte('exception_date', new Date().toISOString().split('T')[0])
        .order('exception_date');
      if (error) throw error;
      return (data ?? []) as AvailabilityException[];
    },
    enabled: !!providerId,
    staleTime: 120_000,
  });

  const upsertRule = useMutation({
    mutationFn: async (input: UpsertRuleInput) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase
          .from('provider_availability_rules')
          .update(rest)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('provider_availability_rules').insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-rules', providerId] });
      queryClient.invalidateQueries({ queryKey: ['available-slots', providerId] });
      toast.success('Horario actualizado');
    },
    onError: () => {
      toast.error('Error al guardar horario');
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from('provider_availability_rules')
        .delete()
        .eq('id', ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-rules', providerId] });
      queryClient.invalidateQueries({ queryKey: ['available-slots', providerId] });
      toast.success('Horario eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar horario');
    },
  });

  const addException = useMutation({
    mutationFn: async (input: ExceptionInput) => {
      const { error } = await supabase.from('provider_availability_exceptions').insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-exceptions', providerId] });
      queryClient.invalidateQueries({ queryKey: ['available-slots', providerId] });
      toast.success('Excepcion agregada');
    },
    onError: () => {
      toast.error('Error al agregar excepcion');
    },
  });

  const deleteException = useMutation({
    mutationFn: async (exceptionId: string) => {
      const { error } = await supabase
        .from('provider_availability_exceptions')
        .delete()
        .eq('id', exceptionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-exceptions', providerId] });
      queryClient.invalidateQueries({ queryKey: ['available-slots', providerId] });
      toast.success('Excepcion eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar excepcion');
    },
  });

  return {
    rules: rulesQuery.data ?? [],
    exceptions: exceptionsQuery.data ?? [],
    isLoadingRules: rulesQuery.isLoading,
    isLoadingExceptions: exceptionsQuery.isLoading,
    upsertRule,
    deleteRule,
    addException,
    deleteException,
  };
}
