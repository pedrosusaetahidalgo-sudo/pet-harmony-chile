/**
 * Hook for managing structured medical records (visits, treatments, etc.)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface MedicalRecord {
  id: string;
  pet_id: string;
  owner_id: string;
  record_type: string;
  title: string;
  description: string | null;
  veterinarian_name: string | null;
  clinic_name: string | null;
  date: string;
  visit_date: string | null;
  vet_name: string | null;
  reason: string | null;
  diagnosis: string | null;
  treatment: any; // JSONB
  next_date: string | null;
  next_checkup_date: string | null;
  document_url: string | null;
  notes: string | null;
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
  visitDate?: string;
  vetName?: string;
  reason?: string;
  diagnosis?: string;
  treatment?: any;
  nextDate?: string;
  nextCheckupDate?: string;
  notes?: string;
}

/**
 * Hook for managing medical records
 */
export const useMedicalRecords = (petId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // List records for a pet
  const { data: records, isLoading } = useQuery({
    queryKey: ['medical-records', petId],
    queryFn: async () => {
      if (!petId) return [];

      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('pet_id', petId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MedicalRecord[];
    },
    enabled: !!petId,
  });

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
          visit_date: params.visitDate || null,
          vet_name: params.vetName || null,
          reason: params.reason || null,
          diagnosis: params.diagnosis || null,
          treatment: params.treatment || null,
          next_date: params.nextDate || null,
          next_checkup_date: params.nextCheckupDate || null,
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
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear registro');
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
        .eq('owner_id', user.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data as MedicalRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records', petId] });
      toast.success('Registro médico actualizado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar registro');
    },
  });

  // Delete record
  const deleteRecord = useMutation({
    mutationFn: async (recordId: string) => {
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordId)
        .eq('owner_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records', petId] });
      toast.success('Registro médico eliminado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar registro');
    },
  });

  return {
    records,
    isLoading,
    createRecord: createRecord.mutateAsync,
    isCreating: createRecord.isPending,
    updateRecord: updateRecord.mutateAsync,
    isUpdating: updateRecord.isPending,
    deleteRecord: deleteRecord.mutateAsync,
    isDeleting: deleteRecord.isPending,
  };
};

