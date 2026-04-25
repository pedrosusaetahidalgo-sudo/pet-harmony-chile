/**
 * PawPassportSection — botón para generar y descargar el Paw Passport (PDF).
 *
 * Refactor Maestro Fase 1 §6.3.
 *
 * Flujo:
 *   1. User toca "Generar Paw Passport".
 *   2. POST a edge fn generate-paw-passport con auth + pet_id.
 *   3. Recibimos PDF binario (application/pdf).
 *   4. Trigger download como `paw-passport-${petName}.pdf`.
 *   5. Toast con "Pasaporte de [nombre] descargado".
 *
 * El passport tiene 8 paginas (tapa + datos + biometria + vacunas + antipara
 * + medicos + contactos + validaciones). Estilo pasaporte chileno real.
 *
 * Uso real: viajes (aerolineas), vets externos, hoteles caninos, refugios.
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Download } from 'lucide-react';
import { toast } from 'sonner';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';

interface PawPassportSectionProps {
  petId: string;
  petName: string;
}

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  'https://gwailbjlvevkhwcrovfd.supabase.co';

export function PawPassportSection({ petId, petName }: PawPassportSectionProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        throw new Error('No autenticado');
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-paw-passport`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pet_id: petId }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `paw-passport-${petName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      trackRefactor(RefactorEvent.petIdCardGenerated, { kind: 'passport', pet_id: petId });
      toast.success(`Pasaporte de ${petName} descargado`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`No pudimos generar el pasaporte: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50/40 to-white">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 inline-flex h-12 w-12 rounded-2xl bg-amber-100 items-center justify-center">
            <BookOpen className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Paw Passport de {petName}</h3>
            <p className="text-sm text-muted-foreground">
              PDF con la historia completa estilo pasaporte: identidad biométrica, vacunas,
              antiparasitarios, datos médicos, contactos. Útil para viajes, vets externos o
              transferir a un nuevo dueño.
            </p>
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={generating} className="w-full gap-2">
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando 8 páginas…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Generar y descargar
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
