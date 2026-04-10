/**
 * Button component to generate and download medical summary PDF
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "@/lib/icons";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { describeSupabaseError } from "@/lib/supabaseErrors";
import { downloadFile } from "@/lib/nativeDownload";

interface MedicalSummaryButtonProps {
  petId: string;
  petName?: string;
}

export const MedicalSummaryButton = ({ petId, petName }: MedicalSummaryButtonProps) => {
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
          title: "Resumen médico generado",
          description: `El resumen médico de ${petName || 'tu mascota'} está listo para descargar`,
        });
      } else {
        throw new Error('No se recibió URL de descarga');
      }
    } catch (error: any) {
      logger.error('Error generating medical summary:', error);
      toast({
        variant: "destructive",
        title: "Algo salió mal",
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]) || "No se pudo generar el resumen médico",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerateSummary}
      disabled={isGenerating}
      variant="outline"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4 mr-2" />
          Descargar Resumen Médico (PDF)
        </>
      )}
    </Button>
  );
};

