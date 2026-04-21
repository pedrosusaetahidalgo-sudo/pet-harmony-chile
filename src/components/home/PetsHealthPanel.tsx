/**
 * PetsHealthPanel — panel con health score de cada mascota del usuario.
 *
 * Origen: Plan 90d — dueños con múltiples mascotas ven de un vistazo cuál
 * tiene pendientes y cuál está al día. Si hay 1 sola mascota, esto
 * complementa al StatusCard existente.
 *
 * Lee rpc_pet_health_summary (mig 20260709000000) y calcula health score
 * con computeHealthScore (src/lib/health-score.ts) — reutiliza lógica existente.
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ChevronRight, CheckCircle2, AlertCircle, AlertTriangle } from '@/lib/icons';
import { computeHealthScore } from '@/lib/health-score';
import { cn } from '@/lib/utils';

interface PetHealthRow {
  pet_id: string;
  pet_name: string;
  species: string;
  photo_url: string | null;
  holo_pattern: string | null;
  overdue_count: number;
  upcoming_count: number;
  last_vet_visit: string | null;
  vaccines_up_to_date: boolean;
  has_weight: boolean;
  has_photo: boolean;
  has_microchip: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export function PetsHealthPanel() {
  const { user } = useAuth();

  const { data: pets, isLoading } = useQuery<PetHealthRow[]>({
    queryKey: ['home-pets-health', user?.id],
    enabled: !!user?.id,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await sb.rpc('rpc_pet_health_summary');
      if (error) {
        console.warn('[PetsHealthPanel] RPC error', error);
        return [];
      }
      return (data || []) as PetHealthRow[];
    },
  });

  if (isLoading) {
    return (
      <Card className="border-rose-100">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-40 mb-3" />
          <Skeleton className="h-16 w-full mb-2" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Solo mostrar si hay 2+ mascotas (para 1 sola ya hay StatusCards)
  if (!pets || pets.length < 2) return null;

  return (
    <Card className="border-rose-100 bg-gradient-to-br from-rose-50/40 via-white to-purple-50/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Heart className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
                Salud de tus mascotas
              </p>
              <p className="text-[10px] text-muted-foreground">
                {pets.length} mascota{pets.length !== 1 ? 's' : ''} · tap para abrir ficha
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {pets.map((pet) => {
            const health = computeHealthScore({
              overdueCount: pet.overdue_count,
              upcomingCount: pet.upcoming_count,
              vaccinesUpToDate: pet.vaccines_up_to_date,
              lastVetVisit: pet.last_vet_visit,
              hasWeight: pet.has_weight,
              hasPhoto: pet.has_photo,
              hasMicrochip: pet.has_microchip,
            });

            const statusIcon =
              health.status === 'good'
                ? CheckCircle2
                : health.status === 'pending'
                  ? AlertCircle
                  : AlertTriangle;
            const StatusIcon = statusIcon;

            const topIssue = health.issues[0];

            return (
              <Link key={pet.pet_id} to={`/ficha/${pet.pet_id}`} className="block group">
                <div
                  className={cn(
                    'flex items-center gap-3 p-2.5 rounded-lg transition-colors',
                    'hover:bg-white hover:shadow-sm border border-transparent hover:border-rose-100'
                  )}
                >
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarImage src={pet.photo_url || undefined} />
                    <AvatarFallback className="bg-rose-100 text-rose-700 text-sm font-semibold">
                      {pet.pet_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {pet.pet_name}
                      </p>
                      <StatusIcon className={cn('h-3.5 w-3.5 shrink-0', health.color)} />
                    </div>
                    <p className={cn('text-[11px] font-medium', health.color)}>
                      {topIssue || health.label}
                    </p>
                    {pet.overdue_count > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {pet.overdue_count} vencido{pet.overdue_count !== 1 ? 's' : ''}
                        {pet.upcoming_count > 0 && ` · ${pet.upcoming_count} esta semana`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={cn(
                        'flex flex-col items-center rounded-lg px-2 py-1 border',
                        health.bgColor,
                        'border-transparent'
                      )}
                    >
                      <span className={cn('font-mono text-sm font-bold', health.color)}>
                        {health.score}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider text-muted-foreground">
                        score
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
