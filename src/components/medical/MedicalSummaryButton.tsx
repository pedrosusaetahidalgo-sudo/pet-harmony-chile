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
import { isNative } from '@/lib/platform';
import { PremiumGate } from '@/components/PremiumGate';

/** Download a Blob directly — no external URL needed */
async function downloadBlob(blob: Blob, fileName: string) {
  if (isNative()) {
    // On native Capacitor: delegate to downloadFile with an object URL
    const url = URL.createObjectURL(blob);
    try {
      await downloadFile(url, fileName);
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }
  // Web: create a temporary <a> to trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

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
      const fileName = `ficha_clinica_${(petName || 'mascota').replace(/\s+/g, '_')}.pdf`;

      const { data, error } = await supabase.functions.invoke('generate-medical-summary', {
        body: { pet_id: petId },
        // Tell supabase-js not to parse JSON — we expect raw PDF bytes
        headers: { Accept: 'application/pdf' },
      });

      if (error) throw error;

      // The edge function returns raw PDF bytes (Blob)
      if (data instanceof Blob) {
        await downloadBlob(data, fileName);
        toast({
          title: 'Ficha clínica lista',
          description: `La ficha de ${petName || 'tu mascota'} se descargó correctamente`,
        });
      } else if (data?.download_url) {
        // Fallback: legacy signed-URL response (store=true)
        await downloadFile(data.download_url, fileName);
        toast({
          title: 'Ficha clínica lista',
          description: `La ficha de ${petName || 'tu mascota'} se descargó correctamente`,
        });
      } else {
        throw new Error('No se recibió la ficha');
      }
    } catch (error) {
      logger.error('Error generating medical summary:', error);
      toast({
        variant: 'destructive',
        title: 'Algo salió mal',
        description:
          describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]) ||
          'No se pudo generar la ficha clínica',
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
    <PremiumGate
      feature="export_pdf"
      title="Ficha clínica en PDF"
      description="Genera un PDF profesional con toda la ficha clínica de tu mascota"
    >
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
    </PremiumGate>
  );
};
