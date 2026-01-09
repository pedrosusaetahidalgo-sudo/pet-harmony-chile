/**
 * Hook for managing medical documents
 * Handles upload, list, delete, and download operations
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type MedicalDocumentType = 'vaccine_card' | 'id_card' | 'lab_result' | 'xray' | 'prescription' | 'other';

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
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'application/pdf'
];

/**
 * Hook for managing medical documents
 */
export const useMedicalDocuments = (petId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // List documents for a pet
  const { data: documents, isLoading } = useQuery({
    queryKey: ['medical-documents', petId],
    queryFn: async () => {
      if (!petId) return [];

      const { data, error } = await supabase
        .from('medical_documents')
        .select('*')
        .eq('pet_id', petId)
        .order('issued_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MedicalDocument[];
    },
    enabled: !!petId,
  });

  // Group documents by type
  const documentsByType = documents?.reduce((acc, doc) => {
    if (!acc[doc.type]) {
      acc[doc.type] = [];
    }
    acc[doc.type].push(doc);
    return acc;
  }, {} as Record<MedicalDocumentType, MedicalDocument[]>) || {};

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
      const { data: urlData } = supabase.storage
        .from('medical-documents')
        .getPublicUrl(filePath);

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
        })
        .select()
        .single();

      if (error) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('medical-documents')
          .remove([filePath]);
        throw error;
      }

      return data as MedicalDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-documents', petId] });
      toast.success('Documento médico subido correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al subir documento');
      console.error('Upload error:', error);
    },
  });

  // Delete document
  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Get document to find file path
      const { data: document, error: fetchError } = await supabase
        .from('medical_documents')
        .select('file_url')
        .eq('id', documentId)
        .eq('owner_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      if (document?.file_url) {
        const { error: storageError } = await supabase.storage
          .from('medical-documents')
          .remove([document.file_url]);

        if (storageError) {
          console.error('Storage delete error:', storageError);
          // Continue with database delete even if storage delete fails
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('medical_documents')
        .delete()
        .eq('id', documentId)
        .eq('owner_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-documents', petId] });
      toast.success('Documento eliminado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar documento');
      console.error('Delete error:', error);
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
    onError: (error: any) => {
      toast.error(error.message || 'Error al generar ZIP');
    },
  });

  return {
    documents,
    documentsByType,
    isLoading,
    uploadDocument: uploadDocument.mutateAsync,
    isUploading: uploadDocument.isPending,
    deleteDocument: deleteDocument.mutateAsync,
    isDeleting: deleteDocument.isPending,
    getDownloadUrl,
    downloadAllAsZip: downloadAllAsZip.mutateAsync,
    isGeneratingZip: downloadAllAsZip.isPending,
  };
};

