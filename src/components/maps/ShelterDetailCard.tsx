import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, MapPin, Globe, Phone, Mail, Instagram, Facebook, 
  Dog, Cat, Sparkles, ExternalLink, MessageCircle, Building2 
} from "lucide-react";

interface ShelterDetailCardProps {
  shelter: {
    id: string;
    name: string;
    type: string;
    description?: string;
    ai_description?: string;
    address?: string;
    commune?: string;
    city?: string;
    contact_email?: string;
    contact_phone?: string;
    website?: string;
    social_media?: { instagram?: string; facebook?: string };
    animal_types?: string[];
    pet_sizes?: string[];
    specialties?: string[];
    formality_level?: string;
    is_verified?: boolean;
  };
  compact?: boolean;
}

const typeLabels: Record<string, string> = {
  ong: "ONG",
  fundacion: "Fundación",
  refugio: "Refugio",
  independiente: "Casa de Acogida",
};

const typeColors: Record<string, string> = {
  ong: "bg-green-500",
  fundacion: "bg-blue-500",
  refugio: "bg-purple-500",
  independiente: "bg-amber-500",
};

const ShelterDetailCard = ({ shelter, compact = false }: ShelterDetailCardProps) => {
  const handleContact = () => {
    if (shelter.contact_email) {
      window.location.href = `mailto:${shelter.contact_email}`;
    } else if (shelter.website) {
      window.open(shelter.website, "_blank");
    }
  };

  const handleWebsite = () => {
    if (shelter.website) {
      window.open(shelter.website, "_blank");
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className={`p-2 rounded-lg ${typeColors[shelter.type] || "bg-primary"}`}>
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <Badge className={`text-xs mb-1 ${typeColors[shelter.type] || "bg-primary"}`}>
              {typeLabels[shelter.type] || shelter.type}
            </Badge>
            <h3 className="font-semibold text-sm truncate">{shelter.name}</h3>
            {shelter.is_verified && (
              <Badge variant="outline" className="text-xs gap-1">
                <Sparkles className="h-2 w-2" /> Verificado
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {shelter.animal_types?.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              {type === "perro" ? <Dog className="h-2 w-2 mr-1" /> : <Cat className="h-2 w-2 mr-1" />}
              {type}
            </Badge>
          ))}
        </div>

        {shelter.ai_description && (
          <p className="text-xs text-muted-foreground line-clamp-2 flex items-start gap-1">
            <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
            {shelter.ai_description}
          </p>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{shelter.commune}, {shelter.city}</span>
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleContact}>
            <MessageCircle className="h-3 w-3 mr-1" />
            Contactar
          </Button>
          {shelter.website && (
            <Button size="sm" variant="outline" className="h-7 px-2" onClick={handleWebsite}>
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className={`p-4 ${typeColors[shelter.type] || "bg-primary"} text-white`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <Badge className="bg-white/20 text-white mb-1">
              {typeLabels[shelter.type] || shelter.type}
            </Badge>
            <h3 className="text-lg font-bold">{shelter.name}</h3>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* AI Description */}
        {shelter.ai_description && (
          <div className="flex gap-2 p-3 bg-primary/5 rounded-lg">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm">{shelter.ai_description}</p>
          </div>
        )}

        {/* Animal Types & Sizes */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Animales que acogen:</p>
          <div className="flex flex-wrap gap-2">
            {shelter.animal_types?.map((type) => (
              <Badge key={type} variant="secondary" className="gap-1">
                {type === "perro" ? <Dog className="h-3 w-3" /> : <Cat className="h-3 w-3" />}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Badge>
            ))}
          </div>
          {shelter.pet_sizes && shelter.pet_sizes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {shelter.pet_sizes.map((size) => (
                <Badge key={size} variant="outline" className="text-xs">
                  {size}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Specialties */}
        {shelter.specialties && shelter.specialties.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Especialidades:</p>
            <div className="flex flex-wrap gap-1">
              {shelter.specialties.map((spec) => (
                <Badge key={spec} variant="outline" className="text-xs bg-primary/5">
                  {spec}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary mt-0.5" />
          <div>
            <p>{shelter.address}</p>
            <p className="text-muted-foreground">{shelter.commune}, {shelter.city}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 text-sm">
          {shelter.contact_email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <a href={`mailto:${shelter.contact_email}`} className="hover:underline">
                {shelter.contact_email}
              </a>
            </div>
          )}
          {shelter.contact_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <a href={`tel:${shelter.contact_phone}`} className="hover:underline">
                {shelter.contact_phone}
              </a>
            </div>
          )}
          {shelter.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <a href={shelter.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {shelter.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </div>

        {/* Social Media */}
        {shelter.social_media && (shelter.social_media.instagram || shelter.social_media.facebook) && (
          <div className="flex gap-2">
            {shelter.social_media.instagram && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://instagram.com/${shelter.social_media.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  Instagram
                </a>
              </Button>
            )}
            {shelter.social_media.facebook && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://facebook.com/${shelter.social_media.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={handleContact}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Contactar
          </Button>
          {shelter.website && (
            <Button variant="outline" onClick={handleWebsite}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShelterDetailCard;
