import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { errorMessageForUser } from '@/lib/errors';

export interface DiagnosticoItem {
  condicion: string;
  apariciones: number;
  estado: 'activo' | 'resuelto' | 'en_tratamiento';
  ultima_fecha: string;
}

export interface TratamientoItem {
  medicamento: string;
  dosis: string;
  frecuencia: string;
  desde: string;
}

export interface VacunaItem {
  nombre: string;
  fecha: string;
  estado: 'al_dia' | 'proxima' | 'vencida';
  proxima: string | null;
}

export interface AlertaItem {
  tipo: 'alergia' | 'interaccion' | 'tendencia' | 'cronico';
  descripcion: string;
  severidad: 'alta' | 'media' | 'baja';
}

export interface SeguimientoItem {
  fecha: string;
  razon: string;
}

export interface PatientConsolidatedSummary {
  diagnosticos: DiagnosticoItem[];
  tratamientos: TratamientoItem[];
  vacunas: VacunaItem[];
  alertas: AlertaItem[];
  seguimientos: SeguimientoItem[];
  resumen_general: string;
  total_sesiones: number;
  rango_fechas: string | null;
}

export function useVetPatientSummary() {
  const [data, setData] = useState<PatientConsolidatedSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const generate = useCallback(async (petId: string) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    setIsCached(false);

    try {
      // 2026-04-21: fix 401 — forzar refresh del token si esta por expirar.
      // Supabase JWT default expires_in=3600s. En sesiones largas el token
      // caduca antes de invocar la edge fn y nos tira 401 "User not
      // authenticated". getSession() refresca automaticamente si corresponde.
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
      }

      const { data: responseData, error: fnError } = await supabase.functions.invoke(
        'generate-vet-patient-summary',
        { body: { petId } }
      );

      if (fnError) {
        throw new Error(fnError.message || 'Error al generar el consolidado');
      }

      if (responseData?.error) {
        throw new Error(responseData.error);
      }

      const summary = responseData?.summary as PatientConsolidatedSummary | undefined;
      if (!summary) {
        throw new Error('Respuesta vacía del servidor');
      }

      setData(summary);
      setIsCached(!!responseData.cached);
      return summary;
    } catch (err) {
      const message = errorMessageForUser(err);
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsCached(false);
  }, []);

  return { data, isLoading, error, isCached, generate, reset };
}
