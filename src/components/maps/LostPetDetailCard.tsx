import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Phone, Mail, Calendar, Award, MessageCircle, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useStartConversation } from "@/hooks/useStartConversation";

interface LostPetDetailCardProps {
  pet: any;
  compact?: boolean;
}

const LostPetDetailCard = ({ pet, compact = false }: LostPetDetailCardProps) => {
  const navigate = useNavigate();
  const { startConversation, loading } = useStartConversation();
  
  const isLost = pet.report_type === "lost";

  const handleContact = async () => {
    if (pet.reporter_id) {
      await startConversation(pet.reporter_id);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${isLost ? "Mascota Perdida" : "Mascota Encontrada"}: ${pet.pet_name}`,
        text: pet.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          {pet.photo_url && (
            <img
              src={pet.photo_url}
              alt={pet.pet_name}
              loading="lazy"
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge 
                variant={isLost ? "destructive" : "default"}
                className={isLost ? "bg-red-500" : "bg-green-500"}
              >
                {isLost ? "Perdida" : "Encontrada"}
              </Badge>
              {pet.reward_offered && (
                <Badge className="bg-yellow-500 gap-1">
                  <Award className="h-3 w-3" />
                  ${pet.reward_amount?.toLocaleString()}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold truncate">{pet.pet_name || "Sin nombre"}</h3>
            <p className="text-xs text-muted-foreground">
              {pet.species} {pet.breed && `• ${pet.breed}`}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{pet.description}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{pet.last_seen_location}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {formatDistanceToNow(new Date(pet.last_seen_date), { addSuffix: true, locale: es })}
          </span>
        </div>
        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleContact} disabled={loading}>
            <MessageCircle className="h-3 w-3 mr-1" />
            Contactar
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={handleShare}>
            <Share2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      {pet.photo_url && (
        <div className="relative h-48">
          <img
            src={pet.photo_url}
            alt={pet.pet_name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge 
              variant={isLost ? "destructive" : "default"}
              className={`${isLost ? "bg-red-500" : "bg-green-500"} shadow-lg`}
            >
              {isLost ? "🔍 Perdida" : "✅ Encontrada"}
            </Badge>
          </div>
          {pet.reward_offered && (
            <Badge className="absolute top-3 right-3 bg-yellow-500 shadow-lg gap-1">
              <Award className="h-3 w-3" />
              ${pet.reward_amount?.toLocaleString()}
            </Badge>
          )}
        </div>
      )}
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="text-xl font-bold">{pet.pet_name || "Mascota sin identificar"}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{pet.species}</Badge>
            {pet.breed && <Badge variant="secondary">{pet.breed}</Badge>}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{pet.description}</p>

        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary mt-0.5" />
            <span>{pet.last_seen_location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              {isLost ? "Vista por última vez" : "Encontrada"}: {" "}
              {formatDistanceToNow(new Date(pet.last_seen_date), { addSuffix: true, locale: es })}
            </span>
          </div>
          {pet.contact_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <a href={`tel:${pet.contact_phone}`} className="text-primary hover:underline">
                {pet.contact_phone}
              </a>
            </div>
          )}
          {pet.contact_email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <a href={`mailto:${pet.contact_email}`} className="text-primary hover:underline">
                {pet.contact_email}
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1 bg-warm-gradient hover:opacity-90" onClick={handleContact} disabled={loading}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Contactar
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LostPetDetailCard;
