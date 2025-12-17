import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PetProfileCardProps {
  id: string;
  name: string;
  species: string;
  breed?: string;
  photoUrl?: string;
  ownerName: string;
  ownerAvatar?: string;
  ownerId: string;
  personality?: string[];
  bio?: string;
}

export function PetProfileCard({
  id,
  name,
  species,
  breed,
  photoUrl,
  ownerName,
  ownerAvatar,
  ownerId,
  personality = [],
  bio,
}: PetProfileCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 rounded-2xl bg-card cursor-pointer"
      onClick={() => navigate(`/user/${ownerId}`)}
    >
      <CardContent className="p-0">
        {/* Pet Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <User className="h-20 w-20 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Pet Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-lg truncate">{name}</h3>
              <p className="text-sm text-muted-foreground">
                {breed || species}
              </p>
            </div>
          </div>

          {/* Owner Info */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b">
            <Avatar className="h-8 w-8 border">
              <AvatarImage src={ownerAvatar} alt={ownerName} />
              <AvatarFallback className="bg-warm-gradient text-white text-xs">
                {ownerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                Dueño: {ownerName}
              </p>
            </div>
          </div>

          {/* Bio */}
          {bio && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {bio}
            </p>
          )}

          {/* Personality Tags */}
          {personality.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {personality.slice(0, 3).map((trait, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                >
                  {trait}
                </Badge>
              ))}
              {personality.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{personality.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
