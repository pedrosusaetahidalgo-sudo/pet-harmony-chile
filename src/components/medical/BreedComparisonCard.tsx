/**
 * BreedComparisonCard — comparación social temprana del pet vs su raza.
 *
 * Refactor Maestro §14.bis.3 Tensión 3 (mitigación 2):
 *   "Otros Golden Retriever de 2 años en Chile pesan entre X-Y kg, tu
 *    mascota está en Z kg" — desde el día 1 si hay suficiente data.
 *
 * Solo se renderiza si:
 *   - El pet tiene breed conocido + birth_date + weight
 *   - public_breed_stats tiene esa raza con pet_count >= 50 (privacy)
 *
 * Si no hay match, no renderiza (no contamina UI con "no hay datos").
 *
 * El componente lee de la vista materializada public_breed_stats que ya
 * computa avg_weight_kg, min/max y avg_age_years. Cero lógica de privacy
 * adicional aquí — la vista filtra k-anonymity.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { differenceInYears, parseISO } from 'date-fns';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface Props {
  petId: string;
  petName: string;
}

interface BreedStatsRow {
  breed: string;
  pet_count: number;
  avg_weight_kg: number;
  min_weight_kg: number;
  max_weight_kg: number;
  avg_age_years: number;
}

interface PetData {
  breed: string | null;
  weight: number | null;
  birth_date: string | null;
}

export function BreedComparisonCard({ petId, petName }: Props) {
  // Query 1: data del pet (breed + weight + birth_date)
  const { data: pet } = useQuery<PetData | null>({
    queryKey: ['pet-breed-comparison-data', petId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await sb
        .from('pets')
        .select('breed, weight, birth_date')
        .eq('id', petId)
        .maybeSingle();
      if (error) return null;
      return data as PetData | null;
    },
  });

  const petBreed = pet?.breed ?? null;
  const petWeight = pet?.weight ?? null;
  const petBirthDate = pet?.birth_date ?? null;

  // Query 2: stats de la raza (solo si hay breed)
  const { data, isLoading } = useQuery<BreedStatsRow | null>({
    queryKey: ['breed-comparison', petBreed],
    enabled: !!petBreed,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      if (!petBreed) return null;
      const { data, error } = await sb
        .from('public_breed_stats')
        .select('breed, pet_count, avg_weight_kg, min_weight_kg, max_weight_kg, avg_age_years')
        .ilike('breed', petBreed)
        .gte('pet_count', 50)
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn('[BreedComparisonCard] error', error);
        return null;
      }
      return data as BreedStatsRow | null;
    },
  });

  if (!petBreed) return null;
  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (!data) return null;

  // Calcular comparacion del pet
  const ageYears = petBirthDate ? differenceInYears(new Date(), parseISO(petBirthDate)) : null;

  // Diferencia de peso vs avg de la raza
  let weightTrend: 'above' | 'below' | 'normal' | 'unknown' = 'unknown';
  let weightDiffPct: number | null = null;
  if (petWeight && data.avg_weight_kg) {
    weightDiffPct = Math.round(((petWeight - data.avg_weight_kg) / data.avg_weight_kg) * 100);
    if (weightDiffPct > 15) weightTrend = 'above';
    else if (weightDiffPct < -15) weightTrend = 'below';
    else weightTrend = 'normal';
  }

  const trendIcon =
    weightTrend === 'above' ? TrendingUp : weightTrend === 'below' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor =
    weightTrend === 'above'
      ? 'text-amber-700'
      : weightTrend === 'below'
        ? 'text-blue-700'
        : 'text-emerald-700';

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/40 to-blue-50/40">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <p className="text-sm font-semibold">
                {petName} comparado con otros {data.breed}
              </p>
              <Badge variant="outline" className="text-[10px]">
                {data.pet_count} mascotas en Chile
              </Badge>
            </div>

            {petWeight && weightDiffPct !== null && (
              <div className="flex items-center gap-3 mb-2">
                <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                <p className="text-sm">
                  <span className="font-semibold">{petWeight} kg</span>
                  {weightTrend === 'normal' && (
                    <span className="text-muted-foreground">
                      {' '}
                      — en rango promedio ({data.avg_weight_kg} kg)
                    </span>
                  )}
                  {weightTrend === 'above' && (
                    <span className={trendColor}>
                      {' '}
                      — {Math.abs(weightDiffPct)}% sobre el promedio ({data.avg_weight_kg} kg)
                    </span>
                  )}
                  {weightTrend === 'below' && (
                    <span className={trendColor}>
                      {' '}
                      — {Math.abs(weightDiffPct)}% bajo el promedio ({data.avg_weight_kg} kg)
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span>
                Rango raza: {data.min_weight_kg}–{data.max_weight_kg} kg
              </span>
              <span>•</span>
              <span>Edad promedio: {data.avg_age_years} años</span>
              {ageYears !== null && (
                <>
                  <span>•</span>
                  <span>
                    {petName}: {ageYears} {ageYears === 1 ? 'año' : 'años'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
