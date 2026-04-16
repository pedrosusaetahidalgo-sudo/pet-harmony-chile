/**
 * Hook for managing structured medical records (visits, treatments, etc.)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePlan } from './usePlan';
import { toast } from 'sonner';
import { describeSupabaseError } from '@/lib/supabaseErrors';

export interface MedicalRecord {
  id: string;
  pet_id: string;
  record_type: string;
  title: string;
  description: string | null;
  veterinarian_name: string | null;
  clinic_name: string | null;
  date: string;
  next_date: string | null;
  document_url: string | null;
  notes: string | null;
  batch_number: string | null;
  serial_number: string | null;
  antiparasitic_type: string | null;
  product_brand: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMedicalRecordParams {
  petId: string;
  recordType: string;
  title: string;
  description?: string;
  veterinarianName?: string;
  clinicName?: string;
  date: string;
  nextDate?: string;
  notes?: string;
}

/**
 * Hook for managing medical records
 */
export const useMedicalRecords = (petId?: string) => {
  const { user } = useAuth();
  const { planId } = usePlan();
  const queryClient = useQueryClient();

  // List records for a pet (filtered by plan's medical_history window)
  const { data: records, isLoading } = useQuery({
    queryKey: ['medical-records', petId, planId],
    queryFn: async () => {
      if (!petId) return [];

      let query = supabase
        .from('medical_records')
        .select('*')
        .eq('pet_id', petId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      // Enforce medical_history plan limit
      if (planId === 'free') {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - 6);
        query = query.gte('date', cutoff.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MedicalRecord[];
    },
    enabled: !!petId,
  });

  const isHistoryLimited = planId === 'free';

  // Create record
  const createRecord = useMutation({
    mutationFn: async (params: CreateMedicalRecordParams) => {
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          pet_id: params.petId,
          owner_id: user.id,
          record_type: params.recordType,
          title: params.title,
          description: params.description || null,
          veterinarian_name: params.veterinarianName || null,
          clinic_name: params.clinicName || null,
          date: params.date,
          next_date: params.nextDate || null,
          notes: params.notes || null,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as MedicalRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records', petId] });
      toast.success('Registro médico creado correctamente');
    },
    onError: (error: unknown) => {
      toast.error('Error al crear registro', {
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
      });
    },
  });

  // Update record
  const updateRecord = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MedicalRecord> & { id: string }) => {
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('medical_records')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as MedicalRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records', petId] });
      toast.success('Registro médico actualizado correctamente');
    },
    onError: (error: unknown) => {
      toast.error('Error al actualizar registro', {
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
      });
    },
  });

  // Delete record
  const deleteRecord = useMutation({
    mutationFn: async (recordId: string) => {
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase.from('medical_records').delete().eq('id', recordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records', petId] });
      toast.success('Registro médico eliminado correctamente');
    },
    onError: (error: unknown) => {
      toast.error('Error al eliminar registro', {
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
      });
    },
  });

  return {
    records,
    isLoading,
    isHistoryLimited,
    createRecord: createRecord.mutateAsync,
    isCreating: createRecord.isPending,
    updateRecord: updateRecord.mutateAsync,
    isUpdating: updateRecord.isPending,
    deleteRecord: deleteRecord.mutateAsync,
    isDeleting: deleteRecord.isPending,
  };
};
