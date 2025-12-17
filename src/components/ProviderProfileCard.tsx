import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerificationBadge } from "@/components/VerificationBadge";
import { 
  Star, 
  CheckCircle2, 
  Award, 
  Clock, 
  DollarSign,
  Users,
  Calendar,
  MessageCircle,
  ChevronRight,
  Shield,
  MapPin
} from "lucide-react";

interface ProviderProfileCardProps {
  provider: {
    id: string;
    user_id: string;
    profiles?: {
      display_name: string;
      avatar_url: string | null;
    };
    bio?: string;
    rating?: number;
    total_reviews?: number;
    is_verified?: boolean;
    experience_years?: number;
    price_per_walk?: number;
    price_per_hour?: number;
    price_per_day?: number;
    price_per_night?: number;
    price_per_session?: number;
    consultation_fee?: number;
    max_dogs?: number;
    total_walks?: number;
    total_bookings?: number;
    total_visits?: number;
    total_sessions?: number;
    services?: Record<string, boolean>;
    specialties?: Record<string, boolean>;
    coverage_zones?: string[];
    emergency_available?: boolean;
  };
  providerType: "dog_walker" | "dogsitter" | "veterinarian" | "trainer";
  onViewProfile: () => void;
  onBook: () => void;
  onMessage?: () => void;
  className?: string;
}

const providerTypeConfig = {
  dog_walker: {
    title: "Paseador",
    priceLabel: "paseo",
    totalLabel: "paseos",
    gradient: "from-blue-600 to-cyan-500",
    ringColor: "ring-blue-500/20",
    badgeColor: "bg-blue-500/10 text-blue-700"
  },
  dogsitter: {
    title: "Cuidador",
    priceLabel: "día",
    totalLabel: "reservas",
    gradient: "from-purple-600 to-pink-500",
    ringColor: "ring-purple-500/20",
    badgeColor: "bg-purple-500/10 text-purple-700"
  },
  veterinarian: {
    title: "Veterinario",
    priceLabel: "consulta",
    totalLabel: "visitas",
    gradient: "from-teal-600 to-emerald-500",
    ringColor: "ring-teal-500/20",
    badgeColor: "bg-teal-500/10 text-teal-700"
  },
  trainer: {
    title: "Entrenador",
    priceLabel: "sesión",
    totalLabel: "sesiones",
    gradient: "from-orange-600 to-amber-500",
    ringColor: "ring-orange-500/20",
    badgeColor: "bg-orange-500/10 text-orange-700"
  }
};

export const ProviderProfileCard = ({
  provider,
  providerType,
  onViewProfile,
  onBook,
  onMessage,
  className = ""
}: ProviderProfileCardProps) => {
  const config = providerTypeConfig[providerType];

  const getPrice = () => {
    if (providerType === 'dog_walker') return provider.price_per_walk;
    if (providerType === 'dogsitter') return provider.price_per_day;
    if (providerType === 'veterinarian') return provider.consultation_fee;
    if (providerType === 'trainer') return provider.price_per_session;
    return 0;
  };

  const getTotalCount = () => {
    if (providerType === 'dog_walker') return provider.total_walks || 0;
    if (providerType === 'dogsitter') return provider.total_bookings || 0;
    if (providerType === 'veterinarian') return provider.total_visits || 0;
    if (providerType === 'trainer') return provider.total_sessions || 0;
    return 0;
  };

  const price = getPrice();
  const totalCount = getTotalCount();

  return (
    <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 group ${className}`}>
      <CardContent className="p-0">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${config.gradient} h-2`} />
        
        <div className="p-5">
          {/* Top Section */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <Avatar className={`h-16 w-16 ring-2 ${config.ringColor}`}>
                <AvatarImage src={provider.profiles?.avatar_url || ""} />
                <AvatarFallback className={`bg-gradient-to-r ${config.gradient} text-white font-bold text-xl`}>
                  {provider.profiles?.display_name?.[0] || 'P'}
                </AvatarFallback>
              </Avatar>
              {provider.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                  <CheckCircle2 className="h-5 w-5 text-primary fill-primary/20" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-lg truncate">
                    {providerType === 'veterinarian' ? 'Dr(a). ' : ''}
                    {provider.profiles?.display_name || `${config.title} Profesional`}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                      <span className="font-semibold">{provider.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({provider.total_reviews || 0} reseñas)
                    </span>
                  </div>
                  {provider.is_verified && (
                    <VerificationBadge 
                      isVerified={true}
                      type="compact"
                      totalReviews={provider.total_reviews || 0}
                      totalServices={totalCount}
                      className="mt-1"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-primary">${price?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">/{config.priceLabel}</p>
            </div>
          </div>

          {/* Bio */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {provider.bio || `${config.title} profesional con experiencia en el cuidado de mascotas`}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex items-center gap-1.5 text-sm bg-muted/50 rounded-lg p-2">
              <Award className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="truncate">{provider.experience_years || 0} años</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm bg-muted/50 rounded-lg p-2">
              <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="truncate">{totalCount} {config.totalLabel}</span>
            </div>
            {provider.max_dogs && (
              <div className="flex items-center gap-1.5 text-sm bg-muted/50 rounded-lg p-2">
                <Users className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="truncate">Max {provider.max_dogs}</span>
              </div>
            )}
            {provider.emergency_available && (
              <div className="flex items-center gap-1.5 text-sm bg-red-50 text-red-700 rounded-lg p-2 col-span-3 justify-center">
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span>Emergencias 24/7</span>
              </div>
            )}
          </div>

          {/* Services/Specialties Tags */}
          {(provider.services || provider.specialties) && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {Object.entries(provider.services || provider.specialties || {})
                .filter(([_, value]) => value)
                .slice(0, 3)
                .map(([key]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}
                  </Badge>
                ))}
              {Object.entries(provider.services || provider.specialties || {}).filter(([_, v]) => v).length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{Object.entries(provider.services || provider.specialties || {}).filter(([_, v]) => v).length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              className={`flex-1 bg-gradient-to-r ${config.gradient} hover:opacity-90 transition-opacity`}
              onClick={onBook}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Reservar
            </Button>
            <Button 
              variant="outline"
              onClick={onViewProfile}
              className="px-3"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {onMessage && (
              <Button 
                variant="outline"
                onClick={onMessage}
                className="px-3"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderProfileCard;
