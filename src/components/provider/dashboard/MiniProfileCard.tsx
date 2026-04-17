import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, UserCog, CheckCircle, AlertCircle, ExternalLink } from '@/lib/icons';

interface MiniProfileCardProps {
  slug: string | null;
  avgRating: number | null;
  totalReviews: number;
  isDirectoryVisible: boolean;
  profileViews: number;
}

export function MiniProfileCard({
  slug,
  avgRating,
  totalReviews,
  isDirectoryVisible,
  profileViews,
}: MiniProfileCardProps) {
  const { user } = useAuth();

  const { data: provider } = useQuery({
    queryKey: ['mini-profile-card', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('service_providers')
        .select('business_name, photo_url, specialty, comunas_atendidas, base_price')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Completeness: simple heuristic
  const fields = [
    provider?.business_name,
    provider?.photo_url,
    provider?.specialty?.length,
    provider?.comunas_atendidas?.length,
    provider?.base_price,
    slug,
  ];
  const filled = fields.filter(Boolean).length;
  const completeness = Math.round((filled / fields.length) * 100);

  const displayName = provider?.business_name || user?.email?.split('@')[0] || 'Profesional';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join('');

  return (
    <Card className="border-teal-100">
      <CardContent className="p-3 space-y-2.5">
        {/* Avatar + name + rating */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-teal-100 flex-shrink-0">
            <AvatarImage src={provider?.photo_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-teal-50 text-teal-700 text-sm font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {avgRating ? (
                <>
                  <span className="text-amber-500">★</span>
                  <span className="font-medium">{avgRating.toFixed(1)}</span>
                  <span>({totalReviews})</span>
                </>
              ) : (
                <span>Sin resenas aun</span>
              )}
            </div>
          </div>
        </div>

        {/* Completeness bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>Completitud del perfil</span>
            <span className="font-semibold">{completeness}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${completeness >= 80 ? 'bg-green-500' : completeness >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>

        {/* Visibility + views */}
        <div className="flex items-center justify-between text-[10px]">
          <Badge
            variant="outline"
            className={`text-[9px] gap-1 ${isDirectoryVisible ? 'border-green-200 text-green-700 bg-green-50' : 'border-amber-200 text-amber-700 bg-amber-50'}`}
          >
            {isDirectoryVisible ? (
              <>
                <CheckCircle className="h-2.5 w-2.5" /> Visible
              </>
            ) : (
              <>
                <AlertCircle className="h-2.5 w-2.5" /> Oculto
              </>
            )}
          </Badge>
          <span className="text-muted-foreground">
            {profileViews} vista{profileViews !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Actions — diferenciador Paw Friend: "ver como me ven los dueños" */}
        <div className="flex flex-col gap-1.5">
          {slug ? (
            <a
              href={`/veterinarios/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                size="sm"
                className="w-full text-[11px] gap-1.5 h-8 bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Eye className="h-3.5 w-3.5" />
                Ver cómo me ven los dueños
                <ExternalLink className="h-3 w-3 ml-auto opacity-70" />
              </Button>
            </a>
          ) : (
            <Link to="/provider/profile-edit" className="block">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-[10px] gap-1 h-8 border-dashed"
              >
                <AlertCircle className="h-3 w-3" /> Genera tu perfil público
              </Button>
            </Link>
          )}
          <Link to="/provider/profile-edit" className="block">
            <Button variant="outline" size="sm" className="w-full text-[10px] gap-1 h-7">
              <UserCog className="h-3 w-3" /> Editar perfil
            </Button>
          </Link>
        </div>

        {/* Public URL */}
        {slug && (
          <p className="text-[9px] text-muted-foreground text-center truncate">
            pawfriend.cl/veterinarios/{slug}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
