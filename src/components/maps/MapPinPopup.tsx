import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, Calendar, MessageCircle, Eye, Star, 
  Navigation, Award, Heart, Briefcase, Share2 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStartConversation } from "@/hooks/useStartConversation";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ICONS, type ServiceProvider } from "@/hooks/useServiceProviders";

interface MapPinPopupProps {
  type: "service" | "lost" | "adoption" | "shelter";
  data: any;
  distance?: number; // Distance in km
  userLocation?: { lat: number; lng: number };
  onClose?: () => void;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
};

const MapPinPopup = ({ type, data, distance, userLocation, onClose }: MapPinPopupProps) => {
  const navigate = useNavigate();
  const { startConversation, loading } = useStartConversation();

  // Calculate distance if not provided but we have coordinates
  let displayDistance = distance;
  if (!displayDistance && userLocation && data.latitude && data.longitude) {
    displayDistance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      data.latitude,
      data.longitude
    );
  }

  const handleContact = async () => {
    const userId = data.user_id || data.reporter_id;
    if (userId) {
      await startConversation(userId);
    }
  };

  const handleViewDetails = () => {
    if (type === "service") {
      navigate(`/user/${data.user_id}`);
    } else if (type === "lost") {
      navigate("/lost-pets");
    } else if (type === "adoption") {
      navigate("/adoption");
    } else if (type === "shelter") {
      navigate("/adoption");
    }
    onClose?.();
  };

  const handleBook = () => {
    if (type === "service" && data.services?.[0]) {
      const firstService = data.services[0];
      const routes: Record<string, string> = {
        dog_walker: "/dog-walkers",
        dogsitter: "/dog-sitters",
        veterinarian: "/home-vets",
        trainer: "/dog-trainers",
      };
      navigate(routes[firstService.service_type] || "/places");
      onClose?.();
    }
  };

  const handleShare = () => {
    const shareData = {
      title: type === "lost" 
        ? `${data.report_type === "lost" ? "Mascota Perdida" : "Mascota Encontrada"}: ${data.pet_name}`
        : type === "adoption"
        ? `Adopta a ${data.pet_name}`
        : `Servicio: ${data.display_name}`,
      text: data.description || data.bio || "",
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Service Provider Popup
  if (type === "service") {
    const provider = data as ServiceProvider;
    const primaryService = provider.services?.[0];
    const serviceColors: Record<string, string> = {
      dog_walker: "bg-blue-500",
      dogsitter: "bg-purple-500",
      veterinarian: "bg-green-500",
      trainer: "bg-amber-500",
      grooming: "bg-pink-500",
    };

    return (
      <Card className="w-[320px] overflow-hidden shadow-lg">
        <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600">
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
            <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
              <AvatarImage src={provider.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-lg">
                {provider.display_name?.charAt(0) || "P"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardContent className="pt-12 pb-4 px-4 space-y-3">
          <div className="text-center">
            <h3 className="font-bold text-lg truncate">{provider.display_name || "Proveedor"}</h3>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{provider.rating?.toFixed(1) || "0.0"}</span>
              <span className="text-xs text-muted-foreground">({provider.total_reviews || 0})</span>
            </div>
          </div>

          {primaryService && (
            <div className="text-center">
              <p className="text-sm font-medium text-primary">
                Desde ${primaryService.price_base.toLocaleString("es-CL")} / {primaryService.price_unit}
              </p>
            </div>
          )}

          {displayDistance !== undefined && (
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Navigation className="h-4 w-4" />
              <span>{displayDistance} km de distancia</span>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-1">
            {provider.services?.slice(0, 3).map((service) => (
              <Badge 
                key={service.id}
                className={`text-xs ${serviceColors[service.service_type]} text-white`}
              >
                {SERVICE_TYPE_ICONS[service.service_type as keyof typeof SERVICE_TYPE_ICONS]}
                {SERVICE_TYPE_LABELS[service.service_type as keyof typeof SERVICE_TYPE_LABELS]?.split(" ")[0]}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              className="flex-1 h-9 text-xs bg-warm-gradient hover:opacity-90" 
              onClick={handleBook}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Reservar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 px-3" 
              onClick={handleContact}
              disabled={loading}
            >
              <MessageCircle className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 px-3" 
              onClick={handleViewDetails}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Lost Pet Popup
  if (type === "lost") {
    const isLost = data.report_type === "lost";

    return (
      <Card className="w-[320px] overflow-hidden shadow-lg">
        {data.photo_url ? (
          <div className="relative h-40">
            <img
              src={data.photo_url}
              alt={data.pet_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2">
              <Badge 
                className={isLost ? "bg-red-500" : "bg-green-500"}
              >
                {isLost ? "🔍 Perdida" : "✅ Encontrada"}
              </Badge>
            </div>
            {data.reward_offered && (
              <Badge className="absolute top-2 right-2 bg-yellow-500 gap-1">
                <Award className="h-3 w-3" />
                ${data.reward_amount?.toLocaleString()}
              </Badge>
            )}
          </div>
        ) : (
          <div className="relative h-32 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
            <div className="text-4xl">{isLost ? "🔍" : "✅"}</div>
            <Badge className="absolute top-2 left-2 bg-red-500">
              {isLost ? "Perdida" : "Encontrada"}
            </Badge>
          </div>
        )}

        <CardContent className="p-4 space-y-2">
          <div>
            <h3 className="font-bold text-lg">{data.pet_name || "Mascota sin identificar"}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{data.species}</Badge>
              {data.breed && <Badge variant="secondary" className="text-xs">{data.breed}</Badge>}
            </div>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>

          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{data.last_seen_location}</span>
            </div>
            {displayDistance !== undefined && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Navigation className="h-3 w-3" />
                <span>{displayDistance} km de distancia</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              className="flex-1 h-9 text-xs bg-warm-gradient hover:opacity-90" 
              onClick={handleContact}
              disabled={loading}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Contactar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 px-3" 
              onClick={handleViewDetails}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 px-3" 
              onClick={handleShare}
            >
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Adoption Post Popup
  if (type === "adoption") {
    const photoUrl = data.photos?.[0];

    return (
      <Card className="w-[320px] overflow-hidden shadow-lg">
        {photoUrl ? (
          <div className="relative h-40">
            <img
              src={photoUrl}
              alt={data.pet_name}
              className="w-full h-full object-cover"
            />
            <Badge className="absolute top-2 left-2 bg-orange-500">
              🧡 En Adopción
            </Badge>
          </div>
        ) : (
          <div className="relative h-32 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
            <Heart className="h-12 w-12 text-orange-400" />
            <Badge className="absolute top-2 left-2 bg-orange-500">
              🧡 En Adopción
            </Badge>
          </div>
        )}

        <CardContent className="p-4 space-y-2">
          <div>
            <h3 className="font-bold text-lg">{data.pet_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{data.species}</Badge>
              {data.breed && <Badge variant="secondary" className="text-xs">{data.breed}</Badge>}
              {data.size && <Badge variant="outline" className="text-xs">{data.size}</Badge>}
            </div>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>

          <div className="space-y-1 text-xs">
            {data.location && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{data.location}</span>
              </div>
            )}
            {displayDistance !== undefined && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Navigation className="h-3 w-3" />
                <span>{displayDistance} km de distancia</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              className="flex-1 h-9 text-xs bg-orange-500 hover:bg-orange-600" 
              onClick={handleContact}
              disabled={loading}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Contactar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 px-3" 
              onClick={handleViewDetails}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 px-3" 
              onClick={handleShare}
            >
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Shelter Popup
  if (type === "shelter") {
    return (
      <Card className="w-[320px] overflow-hidden shadow-lg">
        <div className="relative h-32 bg-gradient-to-br from-purple-500 to-purple-600">
          <div className="absolute inset-0 flex items-center justify-center">
            <Briefcase className="h-12 w-12 text-white/80" />
          </div>
          <Badge className="absolute top-2 left-2 bg-purple-600">
            🏠 Refugio
          </Badge>
        </div>

        <CardContent className="p-4 space-y-2">
          <div>
            <h3 className="font-bold text-lg">{data.name || "Refugio"}</h3>
            {data.type && (
              <Badge variant="outline" className="text-xs mt-1">{data.type}</Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>

          <div className="space-y-1 text-xs">
            {data.address && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{data.address}</span>
              </div>
            )}
            {displayDistance !== undefined && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Navigation className="h-3 w-3" />
                <span>{displayDistance} km de distancia</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              className="flex-1 h-9 text-xs bg-purple-500 hover:bg-purple-600" 
              onClick={handleViewDetails}
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver Detalles
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 px-3" 
              onClick={handleShare}
            >
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default MapPinPopup;

