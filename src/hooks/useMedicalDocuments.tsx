/**
 * Hook for managing medical documents
 * Handles upload, list, delete, and download operations
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { describeSupabaseError } from '@/lib/supabaseErrors';

export type MedicalDocumentType =
  | 'vaccine_card'
  | 'id_card'
  | 'lab_result'
  | 'xray'
  | 'prescription'
  | 'other';

export interface MedicalDocument {
  id: string;
  pet_id: string;
  owner_id: string;
  type: MedicalDocumentType;
  title: string;
  file_url: string;
  mime_type: string;
  file_size: number | null;
  issued_at: string | null;
  notes: string | null;
  uploaded_by_role: 'owner' | 'vet' | null;
  created_at: string;
  updated_at: string;
}

export interface UploadDocumentParams {
  petId: string;
  file: File;
  type: MedicalDocumentType;
  title: string;
  issuedAt?: string;
  notes?: string;
  uploadedByRole?: 'owner' | 'vet';
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'application/pdf',
];

/**
 * Hook for managing medical documents
 */
export const useMedicalDocuments = (petId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // List documents for a pet
  const {
    data: documents,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['medical-documents', petId],
    queryFn: async () => {
      if (!petId) return [];

      // PERF-003: select explicito alineado con MedicalDocument.
      const { data, error } = await supabase
        .from('medical_documents')
        .select(
          'id, pet_id, owner_id, type, title, file_url, mime_type, file_size, issued_at, notes, uploaded_by_role, created_at, updated_at'
        )
        .eq('pet_id', petId)
        .order('issued_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MedicalDocument[];
    },
    enabled: !!petId,
  });

  // Group documents by type
  const documentsByType =
    documents?.reduce(
      (acc, doc) => {
        if (!acc[doc.type]) {
          acc[doc.type] = [];
        }
        acc[doc.type].push(doc);
        return acc;
      },
      {} as Record<MedicalDocumentType, MedicalDocument[]>
    ) || {};

  // Upload document
  const uploadDocument = useMutation({
    mutationFn: async (params: UploadDocumentParams) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Validate file
      if (params.file.size > MAX_FILE_SIZE) {
        throw new Error(`El archivo es demasiado grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      if (!ALLOWED_MIME_TYPES.includes(params.file.type)) {
        throw new Error('Tipo de archivo no permitido. Use JPG, PNG, HEIC o PDF');
      }

      // Generate file path: medical-documents/{owner_id}/{pet_id}/{uuid}.{ext}
      const fileExt = params.file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${params.petId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medical-documents')
        .upload(filePath, params.file, {
          contentType: params.file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL (will be signed URL)
      const { data: urlData } = supabase.storage.from('medical-documents').getPublicUrl(filePath);

      // Insert record in database
      const { data, error } = await supabase
        .from('medical_documents')
        .insert({
          pet_id: params.petId,
          owner_id: user.id,
          type: params.type,
          title: params.title,
          file_url: filePath, // Store path, not full URL
          mime_type: params.file.type,
          file_size: params.file.size,
          issued_at: params.issuedAt || null,
          notes: params.notes || null,
          uploaded_by_role: params.uploadedByRole || 'owner',
        })
        .select()
        .maybeSingle();

      if (error) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('medical-documents').remove([filePath]);
        throw error;
      }

      return data as MedicalDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-documents', petId] });
      toast.success('Documento médico subido correctamente');
    },
    onError: (error: unknown) => {
      toast.error('Error al subir documento', {
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
      });
      logger.error('Upload error:', error);
    },
  });

  // Delete document — allowed for the uploader (owner_id) or the pet owner
  const deleteDocument = useMutation({
    mutationFn: async ({ documentId, petOwnerId }: { documentId: string; petOwnerId?: string }) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Get document to find file path — fetch without owner_id filter so
      // the pet owner can also delete vet-uploaded docs
      const { data: document, error: fetchError } = await supabase
        .from('medical_documents')
        .select('file_url, owner_id')
        .eq('id', documentId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Verify permission: uploader OR pet owner
      const isUploader = document?.owner_id === user.id;
      const isPetOwner = petOwnerId === user.id;
      if (!isUploader && !isPetOwner) {
        throw new Error('No tienes permiso para eliminar este documento');
      }

      // Delete from database first — if this fails the file is preserved
      const { error } = await supabase.from('medical_documents').delete().eq('id', documentId);

      if (error) throw error;

      // Delete from storage after DB record is gone — if this fails it's just
      // a harmless orphan file and won't affect the user
      if (document?.file_url) {
        const { error: storageError } = await supabase.storage
          .from('medical-documents')
          .remove([document.file_url]);

        if (storageError) {
          logger.error('Storage delete error (orphan file):', storageError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-documents', petId] });
      toast.success('Documento eliminado correctamente');
    },
    onError: (error: unknown) => {
      toast.error('Error al eliminar documento', {
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
      });
      logger.error('Delete error:', error);
    },
  });

  // Get signed URL for download
  const getDownloadUrl = useCallback(async (document: MedicalDocument): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('medical-documents')
      .createSignedUrl(document.file_url, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  }, []);

  // Download all documents as ZIP (will be implemented in Edge Function)
  const downloadAllAsZip = useMutation({
    mutationFn: async () => {
      if (!petId) throw new Error('No se especificó una mascota');

      const { data, error } = await supabase.functions.invoke('generate-medical-zip', {
        body: { pet_id: petId },
      });

      if (error) throw error;
      return data;
    },
    onError: (error: unknown) => {
      toast.error('Error al generar ZIP', {
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
      });
    },
  });

  return {
    documents,
    documentsByType,
    isLoading,
    error: queryError,
    uploadDocument: uploadDocument.mutateAsync,
    isUploading: uploadDocument.isPending,
    deleteDocument: (documentId: string, petOwnerId?: string) =>
      deleteDocument.mutateAsync({ documentId, petOwnerId }),
    isDeleting: deleteDocument.isPending,
    getDownloadUrl,
    downloadAllAsZip: downloadAllAsZip.mutateAsync,
    isGeneratingZip: downloadAllAsZip.isPending,
  };
};
