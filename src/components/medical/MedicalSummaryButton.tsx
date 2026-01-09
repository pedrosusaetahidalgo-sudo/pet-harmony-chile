/**
 * Button component to generate and download medical summary PDF
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
        // Open download URL in new tab
        window.open(data.download_url, '_blank');
        toast({
          title: "Resumen médico generado",
          description: `El resumen médico de ${petName || 'tu mascota'} está listo para descargar`,
        });
      } else {
        throw new Error('No se recibió URL de descarga');
      }
    } catch (error: any) {
      console.error('Error generating medical summary:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo generar el resumen médico",
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

