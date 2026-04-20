/**
 * Panel de metricas del refugio en /shelter/dashboard.
 *
 * Muestra stats operativas (no solo los contadores simples de la tabla
 * `adoption_centers`):
 *   - Tasa de adopcion (adopted / (adopted + in_care))
 *   - Tiempo promedio en cuidado (dias entre intake y adopted)
 *   - Adopciones en los ultimos 30 dias
 *   - Tasa de ocupacion vs capacidad
 *
 * Se calcula client-side a partir de la lista de pets del refugio.
 * Para refugios grandes (> 500 mascotas) convendra migrar a RPC
 * server-side en el futuro.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Clock, Home as HomeIcon, Heart } from 'lucide-react';
import type { AdoptionCenter } from '@/hooks/useShelter';

interface ShelterPetStat {
  id: string;
  shelter_intake_at: string | null;
  shelter_adopted_at: string | null;
  created_at: string;
}

interface Props {
  shelter: AdoptionCenter;
}

export function ShelterMetricsPanel({ shelter }: Props) {
  const { data: pets, isLoading } = useQuery<ShelterPetStat[]>({
    queryKey: ['shelter-metrics-pets', shelter.id],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('pets') as any)
        .select('id, shelter_intake_at, shelter_adopted_at, created_at')
        .eq('created_by_shelter_id', shelter.id);
      return (data as ShelterPetStat[]) || [];
    },
  });

  const metrics = useMemo(() => {
    if (!pets) return null;
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const adopted = pets.filter((p) => p.shelter_adopted_at);
    const inCare = pets.filter((p) => !p.shelter_adopted_at);

    // Adopciones ultimos 30d
    const adoptedLast30 = adopted.filter(
      (p) => p.shelter_adopted_at && new Date(p.shelter_adopted_at).getTime() >= thirtyDaysAgo
    ).length;

    // Tiempo promedio en cuidado (dias entre intake y adoption)
    const durations = adopted
      .map((p) => {
        if (!p.shelter_intake_at || !p.shelter_adopted_at) return null;
        const intake = new Date(p.shelter_intake_at).getTime();
        const out = new Date(p.shelter_adopted_at).getTime();
        return (out - intake) / (1000 * 60 * 60 * 24);
      })
      .filter((d): d is number => d !== null && d >= 0);

    const avgDays = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

    // Tasa adopcion = adoptados / total (si total > 0)
    const total = pets.length;
    const adoptionRate = total > 0 ? Math.round((adopted.length / total) * 100) : 0;

    // Ocupacion vs capacidad
    const capacityUsage = shelter.capacity
      ? Math.round((inCare.length / shelter.capacity) * 100)
      : null;

    return {
      total,
      adopted: adopted.length,
      inCare: inCare.length,
      adoptedLast30,
      avgDays,
      adoptionRate,
      capacityUsage,
    };
  }, [pets, shelter.capacity]);

  if (isLoading || !metrics) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (metrics.total === 0) {
    // Sin data no mostramos panel vacio
    return null;
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Metricas operativas
          </h2>
          <Badge variant="outline" className="text-[10px]">
            Ultimos {metrics.total} animales
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCell
            icon={<TrendingUp className="h-4 w-4" />}
            color="purple"
            label="Tasa adopcion"
            value={`${metrics.adoptionRate}%`}
            hint={`${metrics.adopted} de ${metrics.total}`}
          />
          <MetricCell
            icon={<Clock className="h-4 w-4" />}
            color="pink"
            label="Dias en cuidado"
            value={metrics.avgDays !== null ? `${metrics.avgDays} d` : '—'}
            hint="Promedio"
          />
          <MetricCell
            icon={<Heart className="h-4 w-4" />}
            color="teal"
            label="Ultimos 30 dias"
            value={metrics.adoptedLast30.toString()}
            hint="Adopciones"
          />
          <MetricCell
            icon={<HomeIcon className="h-4 w-4" />}
            color="amber"
            label="Ocupacion"
            value={
              metrics.capacityUsage !== null
                ? `${metrics.capacityUsage}%`
                : metrics.inCare.toString()
            }
            hint={
              shelter.capacity
                ? `${metrics.inCare} / ${shelter.capacity}`
                : 'Sin capacidad definida'
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCell({
  icon,
  color,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  color: 'purple' | 'pink' | 'teal' | 'amber';
  label: string;
  value: string;
  hint: string;
}) {
  const colorMap = {
    purple: 'bg-purple-100 text-purple-700',
    pink: 'bg-pink-100 text-pink-700',
    teal: 'bg-teal-100 text-teal-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/40">
      <div
        className={`h-7 w-7 rounded-full ${colorMap[color]} flex items-center justify-center mb-2`}
      >
        {icon}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{hint}</div>
    </div>
  );
}
