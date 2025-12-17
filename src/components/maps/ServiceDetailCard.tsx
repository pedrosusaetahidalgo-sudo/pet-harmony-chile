import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Briefcase, Calendar, ShieldCheck, MessageCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStartConversation } from "@/hooks/useStartConversation";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ICONS, type ServiceProvider } from "@/hooks/useServiceProviders";

interface ServiceDetailCardProps {
  provider: ServiceProvider;
  compact?: boolean;
}

const ServiceDetailCard = ({ provider, compact = false }: ServiceDetailCardProps) => {
  const navigate = useNavigate();
  const { startConversation, loading } = useStartConversation();

  const handleContact = async () => {
    if (provider.user_id) {
      await startConversation(provider.user_id);
    }
  };

  const handleViewProfile = () => {
    navigate(`/user/${provider.user_id}`);
  };

  const handleBook = () => {
    // Navigate to appropriate service page based on first service type
    const firstService = provider.services?.[0];
    if (firstService) {
      const routes: Record<string, string> = {
        dog_walker: "/dog-walkers",
        dogsitter: "/dog-sitters",
        veterinarian: "/home-vets",
        trainer: "/dog-trainers",
      };
      navigate(routes[firstService.service_type] || "/places");
    }
  };

  // Get primary service
  const primaryService = provider.services?.[0];

  // Service type color
  const serviceColors: Record<string, string> = {
    dog_walker: "bg-blue-500",
    dogsitter: "bg-purple-500",
    veterinarian: "bg-green-500",
    trainer: "bg-amber-500",
    grooming: "bg-pink-500",
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14 border-2 border-white shadow">
            <AvatarImage src={provider.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
              {provider.display_name?.charAt(0) || "P"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <h3 className="font-semibold truncate">{provider.display_name || "Proveedor"}</h3>
              {provider.is_verified && (
                <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{provider.rating?.toFixed(1) || "0.0"}</span>
              <span className="text-muted-foreground">({provider.total_reviews || 0})</span>
            </div>
          </div>
        </div>

        {/* Services offered */}
        <div className="flex flex-wrap gap-1">
          {provider.services?.slice(0, 3).map((service) => (
            <Badge 
              key={service.id} 
              variant="secondary"
              className={`text-xs ${serviceColors[service.service_type]} text-white`}
            >
              {SERVICE_TYPE_ICONS[service.service_type as keyof typeof SERVICE_TYPE_ICONS]} 
              {SERVICE_TYPE_LABELS[service.service_type as keyof typeof SERVICE_TYPE_LABELS]?.split(" ")[0]}
            </Badge>
          ))}
        </div>

        {/* Price */}
        {primaryService && (
          <p className="text-sm font-medium text-primary">
            Desde ${primaryService.price_base.toLocaleString("es-CL")} / {primaryService.price_unit}
          </p>
        )}

        {provider.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2">{provider.bio}</p>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1 h-8 text-xs bg-warm-gradient hover:opacity-90" 
            onClick={handleBook}
          >
            <Calendar className="h-3 w-3 mr-1" />
            Reservar
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={handleViewProfile}>
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        
        {/* Avatar centered */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
          <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
            <AvatarImage src={provider.avatar_url || undefined} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-400 to-purple-500 text-white">
              {provider.display_name?.charAt(0) || "P"}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Verified badge */}
        {provider.is_verified && (
          <Badge className="absolute top-3 right-3 bg-white/90 text-blue-600 gap-1">
            <ShieldCheck className="h-3 w-3" />
            Verificado
          </Badge>
        )}
      </div>

      <CardContent className="pt-14 p-4 space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold">{provider.display_name || "Proveedor"}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{provider.rating?.toFixed(1) || "0.0"}</span>
            <span className="text-muted-foreground">({provider.total_reviews || 0} reseñas)</span>
          </div>
        </div>

        {/* Services */}
        <div className="flex flex-wrap justify-center gap-2">
          {provider.services?.map((service) => (
            <Badge 
              key={service.id}
              className={`${serviceColors[service.service_type]} text-white`}
            >
              {SERVICE_TYPE_ICONS[service.service_type as keyof typeof SERVICE_TYPE_ICONS]}{" "}
              {SERVICE_TYPE_LABELS[service.service_type as keyof typeof SERVICE_TYPE_LABELS]}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="font-bold text-lg">{provider.experience_years || 0}</p>
            <p className="text-xs text-muted-foreground">Años exp.</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="font-bold text-lg">{provider.total_services_completed || 0}</p>
            <p className="text-xs text-muted-foreground">Servicios</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="font-bold text-lg">{provider.coverage_radius_km || 10}</p>
            <p className="text-xs text-muted-foreground">km radio</p>
          </div>
        </div>

        {provider.bio && (
          <p className="text-sm text-muted-foreground text-center">{provider.bio}</p>
        )}

        {/* Prices */}
        {provider.services && provider.services.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Precios desde:</p>
            {provider.services.slice(0, 2).map((service) => (
              <div key={service.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {SERVICE_TYPE_LABELS[service.service_type as keyof typeof SERVICE_TYPE_LABELS]}
                </span>
                <span className="font-medium text-primary">
                  ${service.price_base.toLocaleString("es-CL")} / {service.price_unit}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Location */}
        {(provider.commune || provider.city) && (
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{provider.commune || provider.city}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button className="flex-1 bg-warm-gradient hover:opacity-90" onClick={handleBook}>
            <Calendar className="h-4 w-4 mr-2" />
            Reservar
          </Button>
          <Button variant="outline" onClick={handleContact} disabled={loading}>
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleViewProfile}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceDetailCard;
