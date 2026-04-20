/**
 * ComunaPicksCard — top 3 vets verificados de una comuna específica.
 *
 * Origen: Plan 90d — descubrimiento vet en landings de comuna (SEO key).
 * Criterios: rating ≥ 4.3, reviews ≥ 2 (más laxo que PawFriendPicks home,
 * para tener datos reales incluso con N pequeño por comuna).
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Star, BadgeCheck, ChevronRight } from '@/lib/icons';

interface PickedVet {
  id: string;
  slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
  rating: number | null;
  total_reviews: number | null;
  commune: string | null;
  is_verified: boolean | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface Props {
  comuna: string;
}

export function ComunaPicksCard({ comuna }: Props) {
  const { data: vets, isLoading } = useQuery<PickedVet[]>({
    queryKey: ['comuna-picks', comuna],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await sb
        .from('service_providers')
        .select('id, slug, display_name, avatar_url, rating, total_reviews, commune, is_verified')
        .eq('status', 'approved')
        .eq('is_directory_visible', true)
        .ilike('commune', comuna)
        .gte('rating', 4.3)
        .gte('total_reviews', 2)
        .order('rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .limit(3);
      return (data as PickedVet[]) || [];
    },
    enabled: !!comuna && comuna !== 'all',
  });

  if (isLoading) {
    return (
      <Card className="border-purple-100 bg-gradient-to-br from-purple-50/50 via-white to-amber-50/30">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-48 mb-3" />
          <Skeleton className="h-14 w-full mb-2" />
          <Skeleton className="h-14 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!vets || vets.length === 0) return null;

  return (
    <Card className="border-purple-100 bg-gradient-to-br from-purple-50/60 via-white to-amber-50/40 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-900 uppercase tracking-wider">
                Recomendados en {comuna}
              </p>
              <p className="text-[10px] text-muted-foreground">Vets verificados con mejor rating</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {vets.map((vet) => (
            <Link
              key={vet.id}
              to={vet.slug ? `/veterinarios/${vet.slug}` : '/veterinarios'}
              className="block group"
            >
              <div className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-sm transition-all">
                <Avatar className="h-14 w-14 ring-2 ring-purple-100 group-hover:ring-purple-200">
                  <AvatarImage src={vet.avatar_url || undefined} />
                  <AvatarFallback className="bg-purple-100 text-purple-700 text-base font-semibold">
                    {(vet.display_name || 'V').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 w-full">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {vet.display_name || 'Veterinario'}
                    </p>
                    {vet.is_verified && (
                      <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span className="text-xs font-bold text-amber-700">
                      {(vet.rating ?? 0).toFixed(1)}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ({vet.total_reviews})
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-purple-600 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Ver perfil <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
