import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VetNoteType } from './useVetClinicalNotes';

export interface ConsultationSummary {
  noteType: VetNoteType;
  title: string;
  description: string;
  alternativeOffered: boolean;
  alternativesDiscussed: string | null;
  followupRequired: boolean;
  followupDate: string | null;
  followupReason: string | null;
}

interface ProcessTranscriptArgs {
  transcript: string;
  petName?: string;
  petSpecies?: string;
}

export function useProcessTranscript() {
  const [data, setData] = useState<ConsultationSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const process = useCallback(async (args: ProcessTranscriptArgs) => {
    setIsProcessing(true);
    setError(null);
    setData(null);

    try {
      const { data: responseData, error: fnError } = await supabase.functions.invoke(
        'process-consultation-transcript',
        {
          body: {
            transcript: args.transcript,
            petName: args.petName,
            petSpecies: args.petSpecies,
          },
        }
      );

      if (fnError) {
        throw new Error(fnError.message || 'Error al procesar la transcripción');
      }

      if (responseData?.error) {
        throw new Error(responseData.error);
      }

      const summary = responseData?.summary as ConsultationSummary | undefined;
      if (!summary) {
        throw new Error('Respuesta vacía del servidor');
      }

      setData(summary);
      return summary;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  return { data, isProcessing, error, process, reset };
}
