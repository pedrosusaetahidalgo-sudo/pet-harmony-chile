/**
 * AdminSheltersGeocodeButton — geocoding masivo de refugios sin coordenadas.
 *
 * Origen: INIT-23 Plan 90d. Cuando un refugio no editó su perfil después
 * del hotfix, sus coords siguen NULL y no aparece en el mapa. Este botón
 * admin geocodea en batch todos los pendientes.
 *
 * Rate limit: 1 req/seg a Nominatim (política OSM). Para 100 refugios
 * tarda ~2 min.
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from '@/lib/icons';

interface PendingShelter {
  id: string;
  legal_name: string;
  commune: string;
  address: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export default function AdminSheltersGeocodeButton() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; failed: number } | null>(
    null
  );

  const { data: pending } = useQuery<PendingShelter[]>({
    queryKey: ['admin-shelters-without-coords'],
    queryFn: async () => {
      const { data } = await sb
        .from('adoption_centers')
        .select('id, legal_name, commune, address')
        .is('latitude', null)
        .not('address', 'is', null);
      return (data as PendingShelter[]) || [];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const count = pending?.length ?? 0;

  const runBatch = async () => {
    if (!pending || pending.length === 0) {
      toast.info('No hay refugios pendientes de geocodificar');
      return;
    }
    setRunning(true);
    setProgress({ done: 0, total: pending.length, failed: 0 });

    let done = 0;
    let failed = 0;

    for (const shelter of pending) {
      try {
        const { data: geo, error } = await supabase.functions.invoke('geocode-address', {
          body: { address: shelter.address, commune: shelter.commune },
        });
        if (error || !geo?.lat || !geo?.lng) {
          failed += 1;
        } else {
          const { error: updErr } = await sb
            .from('adoption_centers')
            .update({ latitude: geo.lat, longitude: geo.lng })
            .eq('id', shelter.id);
          if (updErr) failed += 1;
          else done += 1;
        }
      } catch {
        failed += 1;
      }

      setProgress({ done, total: pending.length, failed });

      // Nominatim política: max 1 request/segundo.
      await new Promise((r) => setTimeout(r, 1_100));
    }

    setRunning(false);
    toast.success(`Geocoding completo: ${done} OK · ${failed} fallaron`);
    await queryClient.invalidateQueries({ queryKey: ['admin-shelters-without-coords'] });
    await queryClient.invalidateQueries({ queryKey: ['admin-shelters'] });
  };

  if (count === 0 && !progress) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/60">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <MapPin className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900 mb-0.5">
              {count} refugio{count !== 1 ? 's' : ''} sin coordenadas en el mapa
            </p>
            <p className="text-xs text-amber-700 mb-3">
              Tienen dirección pero no aparecen en el mapa de adopción porque falta geocoding. El
              batch respeta el rate limit de Nominatim (~2 min por 100 refugios).
            </p>

            {progress && (
              <div className="mb-3 text-xs">
                <div className="flex items-center gap-2 text-amber-800 mb-1">
                  <span className="font-mono">
                    {progress.done + progress.failed}/{progress.total}
                  </span>
                  <span>
                    · {progress.done} OK · {progress.failed} fallaron
                  </span>
                </div>
                <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 transition-all"
                    style={{
                      width: `${Math.min(100, ((progress.done + progress.failed) / progress.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <Button
              variant="default"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={runBatch}
              disabled={running || count === 0}
            >
              {running ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Geocodificando...
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5 mr-2" />
                  Geocodificar {count} refugio{count !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
