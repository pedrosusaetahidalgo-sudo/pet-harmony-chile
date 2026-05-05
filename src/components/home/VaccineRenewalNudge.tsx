/**
 * VaccineRenewalNudge — alerta proactiva 30 dias antes de vencer vacuna.
 *
 * #13 RICE 162 (docs-raiz/PAW_SHIELD_IDEAS_BANK.md):
 *   30 dias antes de vencimiento, push: "antirrabica de Kai vence el 15
 *   mayo. ¿Reservas con Dra. Sofia?".
 *
 * MVP: lee `pet_reminders` de tipo `vaccine` con due_date entre NOW y
 * NOW+30d. Muestra card con CTA a `/servicios` (directorio vets) o
 * `/maps`. Auto-esconde si no hay reminders en ventana.
 *
 * Future: crear cron + push notification real (requiere infra FCM activa).
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Syringe, Calendar, ArrowRight } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface UpcomingVaccine {
  id: string;
  pet_id: string;
  pet_name: string;
  title: string;
  due_date: string;
}

interface VaccineRenewalNudgeProps {
  /** ID del pet actualmente seleccionado en /home. */
  petId: string;
  /** Nombre del pet, para fallback en el title. */
  petName: string;
}

export function VaccineRenewalNudge({ petId, petName }: VaccineRenewalNudgeProps) {
  const navigate = useNavigate();

  const { data: upcoming } = useQuery({
    queryKey: ['vaccine-renewal-nudge', petId],
    enabled: !!petId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<UpcomingVaccine[]> => {
      const today = new Date().toISOString().slice(0, 10);
      const in30 = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('pet_reminders')
        .select('id, pet_id, title, due_date')
        .eq('pet_id', petId)
        .eq('type', 'vaccine')
        .eq('is_completed', false)
        .gte('due_date', today)
        .lte('due_date', in30)
        .order('due_date', { ascending: true })
        .limit(3);

      if (error) return [];
      return (data ?? []).map(
        (r: { id: string; pet_id: string; title: string; due_date: string }) => ({
          ...r,
          pet_name: petName,
        })
      );
    },
  });

  if (!upcoming || upcoming.length === 0) return null;

  const next = upcoming[0];
  const dueDate = parseISO(next.due_date);
  const distance = formatDistanceToNow(dueDate, { locale: es, addSuffix: true });
  const formatted = format(dueDate, "d 'de' MMMM", { locale: es });

  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Syringe className="h-4 w-4 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-amber-900">
              {next.title} vence {distance}
            </p>
            <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatted}
              {upcoming.length > 1 && (
                <span className="ml-1 text-amber-600">· +{upcoming.length - 1} mas en 30 dias</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/servicios?type=vet')}
            size="sm"
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            Reservar con vet
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
          <Button
            onClick={() => navigate(`/ficha/${petId}?tab=cuidados`)}
            size="sm"
            variant="outline"
            className="flex-1 border-amber-300 text-amber-900 hover:bg-amber-100"
          >
            Ver ficha
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
