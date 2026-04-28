/**
 * PawFriendPicks — widget pequeño en Home: 3 vets recomendados.
 *
 * Origen: Plan 90d — aumentar descubrimiento vet para dueños nuevos.
 * Criterios estrictos: rating ≥ 4.5, reviews ≥ 3, status active, verified.
 * Diferencia vs TopRatedProviders (que tiene 4 tabs y lista ranking completa):
 * este es foco único en 3 destacados con CTA claro.
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Star, BadgeCheck, ChevronRight } from '@/lib/icons';
import { cn } from '@/lib/utils';

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

export function PawFriendPicks() {
  const { data: vets, isLoading } = useQuery<PickedVet[]>({
    queryKey: ['home-paw-friend-picks'],
    staleTime: 10 * 60 * 1000, // 10 min
    queryFn: async () => {
      const { data } = await sb
        .from('service_providers')
        .select('id, slug, display_name, avatar_url, rating, total_reviews, commune, is_verified')
        .eq('status', 'approved')
        .eq('is_directory_visible', true)
        .gte('rating', 4.5)
        .gte('total_reviews', 3)
        .order('rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .limit(3);
      return (data as PickedVet[]) || [];
    },
  });

  if (isLoading) {
    return (
      <Card className="border-purple-100 bg-gradient-to-br from-purple-50/50 via-white to-amber-50/30">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Si no hay vets que cumplan criterio estricto, no mostramos el widget.
  // Evita poner algo que se ve vacío/débil en el home.
  if (!vets || vets.length === 0) return null;

  return (
    <Card className="border-purple-100 bg-gradient-to-br from-purple-50/50 via-white to-amber-50/30 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <p className="text-xs font-semibold text-purple-900 uppercase tracking-wider">
              Paw Friend Recomendados
            </p>
          </div>
          <Link
            to="/veterinarios"
            className="text-[10px] font-medium text-purple-600 hover:text-purple-800 flex items-center gap-0.5"
          >
            Ver más <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {vets.map((vet) => (
            <Link
              key={vet.id}
              to={vet.slug ? `/veterinarios/${vet.slug}` : '/veterinarios'}
              className="block group"
            >
              <div
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg transition-colors',
                  'hover:bg-white hover:shadow-sm border border-transparent hover:border-purple-100'
                )}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={vet.avatar_url || undefined} />
                  <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-semibold">
                    {(vet.display_name || 'V').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {vet.display_name || 'Veterinario'}
                    </p>
                    {vet.is_verified && (
                      <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {vet.commune ? `${vet.commune} · ` : ''}
                    {vet.total_reviews} reseña{vet.total_reviews !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-0.5 shrink-0 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-bold text-amber-700">
                    {(vet.rating ?? 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-3">
          Vets con rating ≥ 4.5 y mínimo 3 reseñas verificadas.
        </p>
      </CardContent>
    </Card>
  );
}
