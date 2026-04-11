/**
 * CTA para generar y descargar el PDF de la ficha clinica completa.
 *
 * Esta es la "joya de la corona" segun CLAUDE.md: la ficha clinica PDF
 * descargable. Hasta 2026-04-11 el componente existia pero estaba importado
 * sin renderizar en MedicalDocumentsTab, y el CTA pasaba desapercibido.
 *
 * Variantes:
 * - "hero" (default): boton grande, solid primary, icono, para posiciones
 *   destacadas (card al tope del tab de documentos).
 * - "inline": boton compacto outline, para usos secundarios.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { describeSupabaseError } from '@/lib/supabaseErrors';
import { downloadFile } from '@/lib/nativeDownload';

interface MedicalSummaryButtonProps {
  petId: string;
  petName?: string;
  variant?: 'hero' | 'inline';
}

export const MedicalSummaryButton = ({
  petId,
  petName,
  variant = 'hero',
}: MedicalSummaryButtonProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSummary = async () => {
    try {
      setIsGenerating(true);

      const { data, error } = await supabase.functions.invoke('generate-medical-summary', {
        body: { pet_id: petId },
      });

      if (error) throw error;

      if (data?.download_url) {
        await downloadFile(data.download_url, `resumen_medico_${petName || 'mascota'}.pdf`);
        toast({
          title: 'Resumen médico generado',
          description: `El resumen médico de ${petName || 'tu mascota'} está listo para descargar`,
        });
      } else {
        throw new Error('No se recibió URL de descarga');
      }
    } catch (error) {
      logger.error('Error generating medical summary:', error);
      toast({
        variant: 'destructive',
        title: 'Algo salió mal',
        description:
          describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]) ||
          'No se pudo generar el resumen médico',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (variant === 'inline') {
    return (
      <Button onClick={handleGenerateSummary} disabled={isGenerating} variant="outline">
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4 mr-2" />
            Descargar ficha clínica (PDF)
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      onClick={handleGenerateSummary}
      disabled={isGenerating}
      className="h-14 w-full rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-rose-500 px-6 text-base font-semibold text-white shadow-[0_20px_40px_-18px_rgba(168,85,247,0.55)] transition-all hover:scale-[1.01] hover:opacity-95 active:scale-[0.99] sm:w-auto"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Generando tu ficha...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-5 w-5" />
          Descargar ficha clínica (PDF)
        </>
      )}
    </Button>
  );
};
