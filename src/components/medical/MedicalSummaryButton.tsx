/**
 * CTA para generar y descargar el PDF de la ficha clinica.
 *
 * Variantes:
 * - "hero" (default): dropdown con dos opciones (medica / completa)
 * - "inline": boton compacto outline, para usos secundarios.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileDown, Loader2, Stethoscope, ClipboardList } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { describeSupabaseError } from '@/lib/supabaseErrors';
import { downloadFile } from '@/lib/nativeDownload';
import { isNative } from '@/lib/platform';
import { PremiumGate } from '@/components/PremiumGate';

/** Download a Blob directly — no external URL needed */
async function downloadBlob(blob: Blob, fileName: string) {
  if (isNative()) {
    const url = URL.createObjectURL(blob);
    try {
      await downloadFile(url, fileName);
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }
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
  /** Skip PremiumGate (e.g. for linked vets who should always have access) */
  bypassGate?: boolean;
}

export const MedicalSummaryButton = ({
  petId,
  petName,
  variant = 'hero',
  bypassGate = false,
}: MedicalSummaryButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (mode: 'medical' | 'complete') => {
    try {
      setIsGenerating(true);
      const suffix = mode === 'complete' ? 'completa' : 'clinica';
      const fileName = `ficha_${suffix}_${(petName || 'mascota').replace(/\s+/g, '_')}.pdf`;

      const { data, error } = await supabase.functions.invoke('generate-medical-summary', {
        body: { pet_id: petId, mode },
        headers: { Accept: 'application/pdf' },
      });

      if (error) throw error;

      if (data instanceof Blob) {
        await downloadBlob(data, fileName);
        toast(mode === 'complete' ? 'Ficha completa lista' : 'Ficha clínica lista', {
          description: `La ficha de ${petName || 'tu mascota'} se descargó correctamente`,
        });
      } else if (data?.download_url) {
        await downloadFile(data.download_url, fileName);
        toast('Ficha clínica lista', {
          description: `La ficha de ${petName || 'tu mascota'} se descargó correctamente`,
        });
      } else {
        throw new Error('No se recibió la ficha');
      }
    } catch (error) {
      logger.error('Error generating medical summary:', error);
      toast.error('Algo salió mal', {
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
      <Button onClick={() => handleGenerate('medical')} disabled={isGenerating} variant="outline">
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

  const heroContent = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="lg"
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
              Descargar PDF
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={() => handleGenerate('medical')} className="cursor-pointer py-3">
          <Stethoscope className="h-4 w-4 mr-3 text-purple-600" />
          <div>
            <p className="font-medium text-sm">Ficha médica</p>
            <p className="text-xs text-muted-foreground">Solo historial clínico y vacunas</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleGenerate('complete')}
          className="cursor-pointer py-3"
        >
          <ClipboardList className="h-4 w-4 mr-3 text-green-600" />
          <div>
            <p className="font-medium text-sm">Ficha completa</p>
            <p className="text-xs text-muted-foreground">Médica + rutinas + hábitos + todo</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (bypassGate) return heroContent;

  return (
    <PremiumGate
      feature="export_pdf"
      title="Ficha clínica en PDF"
      description="Genera un PDF profesional con toda la ficha clínica de tu mascota"
    >
      {heroContent}
    </PremiumGate>
  );
};
