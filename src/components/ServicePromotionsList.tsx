import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, Home, Stethoscope } from "lucide-react";

interface ServicePromotionsListProps {
  serviceType?: string;
}

export const ServicePromotionsList = ({ serviceType }: ServicePromotionsListProps) => {
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['service-promotions', serviceType],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      let query = supabase
        .from('service_promotions')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }

      const { data: promotionsData, error: promotionsError } = await query;
      if (promotionsError) throw promotionsError;

      // Fetch profiles separately
      if (!promotionsData || promotionsData.length === 0) {
        return [];
      }

      const userIds = [...new Set(promotionsData.map(p => p.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      return promotionsData.map(promo => ({
        ...promo,
        profile: profilesMap.get(promo.user_id)
      }));
    }
  });

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'dog_walker':
        return <Briefcase className="h-5 w-5" />;
      case 'dogsitter':
        return <Home className="h-5 w-5" />;
      case 'veterinarian':
        return <Stethoscope className="h-5 w-5" />;
      default:
        return <Briefcase className="h-5 w-5" />;
    }
  };

  const getServiceLabel = (type: string) => {
    switch (type) {
      case 'dog_walker':
        return 'Paseador';
      case 'dogsitter':
        return 'Cuidador';
      case 'veterinarian':
        return 'Veterinario';
      default:
        return type;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!promotions || promotions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay promociones disponibles
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {promotions.map((promotion) => (
        <Card key={promotion.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Avatar>
                  <AvatarImage src={promotion.profile?.avatar_url} />
                  <AvatarFallback>
                    {promotion.profile?.display_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {promotion.profile?.display_name || 'Usuario'}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    {getServiceIcon(promotion.service_type)}
                    <span className="ml-1">{getServiceLabel(promotion.service_type)}</span>
                  </Badge>
                </div>
              </div>
            </div>
            <CardTitle className="mt-4 line-clamp-2">{promotion.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="line-clamp-3">
              {promotion.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};