/**
 * ============================================================================
 * Hook: useAuditExports
 * ============================================================================
 *
 * Maneja el ciclo completo de exports de auditoria:
 * - Crear job en export_jobs
 * - Generar Excel client-side
 * - Subir a Storage (con fallback a descarga directa)
 * - Historial de exports
 * - Rate limiting (MAX_EXPORTS_PER_DAY)
 *
 * ## Guia para agentes IA
 *
 * - Para cambiar el limite diario: editar MAX_EXPORTS_PER_DAY en auditExport.ts
 * - Para cambiar el bucket de Storage: editar STORAGE_BUCKET abajo
 * - Para cambiar la duracion del signed URL: editar SIGNED_URL_SECONDS
 * - El hook expone `canGenerate` que ya incluye validacion de rate limit
 * ============================================================================
 */
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  generateAuditExport,
  MAX_EXPORTS_PER_DAY,
  type ExportType,
  type ExportFilters,
  type ExportProgress,
} from '@/lib/auditExport';
import { toast } from 'sonner';

// ── Config (EDITABLE por agente) ───────────────────────────
const STORAGE_BUCKET = 'audit-exports';
const SIGNED_URL_SECONDS = 3600; // 1 hora
const HISTORY_LIMIT = 50;

// ── Types ──────────────────────────────────────────────────
export interface ExportJob {
  id: string;
  requested_by: string;
  export_type: ExportType;
  filters: ExportFilters;
  status: 'queued' | 'processing' | 'ready' | 'failed' | 'expired';
  progress_pct: number;
  error_message: string | null;
  file_path: string | null;
  file_size_bytes: number | null;
  file_hash_sha256: string | null;
  rows_total: number | null;
  sheets_count: number | null;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  download_count: number;
}

// ── Hook ───────────────────────────────────────────────────

export function useAuditExports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch export history
  const { data: exports = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['audit-exports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('export_jobs')
        .select('*')
        .order('requested_at', { ascending: false })
        .limit(HISTORY_LIMIT);
      if (error) throw error;
      return data as ExportJob[];
    },
    staleTime: 30_000,
  });

  // Rate limit: count exports today
  const exportsToday = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return exports.filter((e) => new Date(e.requested_at) >= todayStart).length;
  }, [exports]);

  const rateLimitReached = exportsToday >= MAX_EXPORTS_PER_DAY;
  const remainingToday = MAX_EXPORTS_PER_DAY - exportsToday;

  // Generate export mutation
  const generateMutation = useMutation({
    mutationFn: async ({
      exportType,
      filters,
    }: {
      exportType: ExportType;
      filters: ExportFilters;
    }) => {
      if (!user?.email) throw new Error('Usuario no autenticado');
      if (rateLimitReached)
        throw new Error(`Limite de ${MAX_EXPORTS_PER_DAY} exports diarios alcanzado`);

      setIsGenerating(true);
      setProgress({ step: 'Iniciando...', pct: 0 });

      // 1. Create job record
      const { data: job, error: jobError } = await supabase
        .from('export_jobs')
        .insert({
          requested_by: user.id,
          export_type: exportType,
          filters,
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) throw new Error(`Error creando job: ${jobError.message}`);

      try {
        // 2. Generate Excel
        const { blob, totalRows, sheetsCount } = await generateAuditExport(
          exportType,
          filters,
          user.email,
          setProgress
        );

        // 3. Compute SHA-256 hash
        const arrayBuffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        // 4. Upload to Storage
        const filePath = `${user.id}/${new Date().toISOString().slice(0, 7)}/${job.id}.xlsx`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, blob, {
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            upsert: false,
          });

        if (uploadError) {
          console.warn('Storage upload failed:', uploadError.message);
          // Fallback: update job sin file_path, descarga directa
          await supabase
            .from('export_jobs')
            .update({
              status: 'ready',
              rows_total: totalRows,
              sheets_count: sheetsCount,
              file_size_bytes: blob.size,
              file_hash_sha256: hash,
              completed_at: new Date().toISOString(),
              progress_pct: 100,
              error_message: 'Descarga directa (Storage upload fallo)',
            })
            .eq('id', job.id);
        } else {
          // 5. Update job as ready with file_path
          await supabase
            .from('export_jobs')
            .update({
              status: 'ready',
              file_path: filePath,
              file_size_bytes: blob.size,
              file_hash_sha256: hash,
              rows_total: totalRows,
              sheets_count: sheetsCount,
              completed_at: new Date().toISOString(),
              progress_pct: 100,
            })
            .eq('id', job.id);
        }

        // Always trigger direct download
        const filename = `paw-friend-audit-${exportType}-${new Date().toISOString().slice(0, 10)}.xlsx`;
        downloadBlob(blob, filename);

        return { jobId: job.id };
      } catch (err) {
        await supabase
          .from('export_jobs')
          .update({
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'Error desconocido',
            progress_pct: 0,
          })
          .eq('id', job.id);
        throw err;
      }
    },
    onSuccess: () => {
      toast.success('Export generado y descargado');
      queryClient.invalidateQueries({ queryKey: ['audit-exports'] });
    },
    onError: (err: Error) => {
      toast.error(`Error generando export: ${err.message}`);
    },
    onSettled: () => {
      setIsGenerating(false);
      setProgress(null);
    },
  });

  // Download from Storage (for historical exports)
  const downloadExport = useCallback(
    async (job: ExportJob) => {
      if (!job.file_path) {
        toast.error('Este export no tiene archivo en Storage');
        return;
      }

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(job.file_path, SIGNED_URL_SECONDS);

      if (error || !data?.signedUrl) {
        toast.error('Error generando URL de descarga');
        return;
      }

      await supabase
        .from('export_jobs')
        .update({
          download_count: (job.download_count ?? 0) + 1,
          last_downloaded_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      window.open(data.signedUrl, '_blank');
      queryClient.invalidateQueries({ queryKey: ['audit-exports'] });
    },
    [queryClient]
  );

  return {
    exports,
    isLoadingHistory,
    isGenerating,
    progress,
    generateExport: generateMutation.mutate,
    downloadExport,
    // Rate limit info
    rateLimitReached,
    exportsToday,
    remainingToday,
    maxPerDay: MAX_EXPORTS_PER_DAY,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
