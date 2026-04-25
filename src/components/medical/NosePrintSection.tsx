/**
 * Tab "Identidad" de la ficha clinica — seccion de Huella Nasal.
 *
 * Pilar 1 de la Trinidad del Corazon (Refactor Maestro Fase 1 §6.2).
 * Solo se monta cuando NOSE_PRINT_ENABLED esta activo.
 *
 * Estado:
 *   - Si la mascota no tiene nose_print primary → ofrecer capturar
 *   - Si tiene → mostrar fecha + boton "Recapturar"
 *
 * El componente NosePrintCapture es reutilizable y maneja el flujo
 * completo (camara, captura, upload, error).
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Fingerprint, RotateCw, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { NosePrintCapture } from '@/components/onboarding/NosePrintCapture';

interface NosePrintSectionProps {
  petId: string;
  petName: string;
}

interface NosePrintRow {
  id: string;
  captured_at: string;
  is_primary: boolean;
  provider: string;
  model_id: string;
  quality_score: number | null;
}

export function NosePrintSection({ petId, petName }: NosePrintSectionProps) {
  const queryClient = useQueryClient();
  const [showCapture, setShowCapture] = useState(false);

  const { data: primaryNosePrint, isLoading } = useQuery<NosePrintRow | null>({
    queryKey: ['nose-print-primary', petId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nose_prints')
        .select('id, captured_at, is_primary, provider, model_id, quality_score')
        .eq('pet_id', petId)
        .eq('is_primary', true)
        .maybeSingle();
      if (error) throw error;
      return (data as NosePrintRow | null) ?? null;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (showCapture) {
    return (
      <NosePrintCapture
        petId={petId}
        petName={petName}
        allowSkip={true}
        onCancel={() => setShowCapture(false)}
        onSuccess={() => {
          setShowCapture(false);
          queryClient.invalidateQueries({ queryKey: ['nose-print-primary', petId] });
        }}
      />
    );
  }

  // Sin nose print: ofrecer captura
  if (!primaryNosePrint) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/40 to-white">
        <CardContent className="p-6 text-center space-y-4">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-blue-100 items-center justify-center">
            <Fingerprint className="h-8 w-8 text-blue-600" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">Huella nasal de {petName}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Cada mascota tiene una huella nasal única, como una huella digital. La usamos para
              identificarla si alguna vez se pierde — alguien que la encuentre puede sacarle una
              foto y nuestro sistema te avisa.
            </p>
          </div>
          <Button onClick={() => setShowCapture(true)} className="bg-blue-600 hover:bg-blue-700">
            <Fingerprint className="h-4 w-4 mr-1" /> Capturar huella
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Con nose print: mostrar estado + boton recapturar
  const captureDate = parseISO(primaryNosePrint.captured_at);
  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50/40 to-white">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 inline-flex h-12 w-12 rounded-2xl bg-green-100 items-center justify-center">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Huella nasal registrada</h3>
            <p className="text-sm text-muted-foreground">
              Capturada el {format(captureDate, "d 'de' MMMM 'de' yyyy", { locale: es })}.
            </p>
            {primaryNosePrint.quality_score !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                Calidad de la captura: {Math.round(primaryNosePrint.quality_score * 100)}%
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCapture(true)}
            className="gap-2"
          >
            <RotateCw className="h-4 w-4" />
            Recapturar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
