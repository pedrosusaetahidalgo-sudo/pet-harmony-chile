import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MapPin, Calendar, User, MessageCircle, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useStartConversation } from "@/hooks/useStartConversation";

interface AdoptionDetailCardProps {
  post: any;
  compact?: boolean;
}

const AdoptionDetailCard = ({ post, compact = false }: AdoptionDetailCardProps) => {
  const navigate = useNavigate();
  const { startConversation, loading } = useStartConversation();

  const handleContact = async () => {
    if (post.user_id) {
      await startConversation(post.user_id);
    }
  };

  const handleViewDetails = () => {
    navigate("/adoption");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Adopta a ${post.pet_name}`,
        text: post.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Get first photo or placeholder
  const photoUrl = post.photos?.[0];

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={post.pet_name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center">
              <Heart className="h-6 w-6 text-orange-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Badge className="bg-orange-500 mb-1">En Adopción</Badge>
            <h3 className="font-semibold truncate">{post.pet_name}</h3>
            <p className="text-xs text-muted-foreground">
              {post.species} {post.breed && `• ${post.breed}`}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {post.age_years != null && (
            <Badge variant="outline" className="text-xs">
              {post.age_years > 0 ? `${post.age_years} años` : `${post.age_months} meses`}
            </Badge>
          )}
          {post.size && <Badge variant="outline" className="text-xs">{post.size}</Badge>}
          {post.gender && <Badge variant="outline" className="text-xs capitalize">{post.gender}</Badge>}
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2">{post.description}</p>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{post.location}</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <Avatar className="h-5 w-5">
            <AvatarImage src={post.profiles?.avatar_url} />
            <AvatarFallback>{post.profiles?.display_name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground truncate">
            {post.profiles?.display_name || "Usuario"}
          </span>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1 h-8 text-xs bg-orange-500 hover:bg-orange-600" onClick={handleContact} disabled={loading}>
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
      {photoUrl ? (
        <div className="relative h-48">
          <img
            src={photoUrl}
            alt={post.pet_name}
            className="w-full h-full object-cover"
          />
          <Badge className="absolute top-3 left-3 bg-orange-500 shadow-lg">
            🧡 En Adopción
          </Badge>
        </div>
      ) : (
        <div className="relative h-32 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
          <Heart className="h-12 w-12 text-orange-400" />
          <Badge className="absolute top-3 left-3 bg-orange-500 shadow-lg">
            🧡 En Adopción
          </Badge>
        </div>
      )}
      
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="text-xl font-bold">{post.pet_name}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="outline">{post.species}</Badge>
            {post.breed && <Badge variant="secondary">{post.breed}</Badge>}
            {post.gender && <Badge variant="outline" className="capitalize">{post.gender}</Badge>}
          </div>
        </div>

        {/* Age & Size */}
        <div className="flex gap-4 text-sm">
          {post.age_years != null && (
            <div>
              <span className="text-muted-foreground">Edad: </span>
              <span className="font-medium">
                {post.age_years > 0 
                  ? `${post.age_years} año${post.age_years > 1 ? "s" : ""}` 
                  : `${post.age_months} meses`}
              </span>
            </div>
          )}
          {post.size && (
            <div>
              <span className="text-muted-foreground">Tamaño: </span>
              <span className="font-medium">{post.size}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{post.description}</p>

        {/* Compatibility badges */}
        <div className="flex flex-wrap gap-2">
          {post.good_with_kids && (
            <Badge variant="secondary" className="text-xs">👶 Bueno con niños</Badge>
          )}
          {post.good_with_dogs && (
            <Badge variant="secondary" className="text-xs">🐕 Bueno con perros</Badge>
          )}
          {post.good_with_cats && (
            <Badge variant="secondary" className="text-xs">🐱 Bueno con gatos</Badge>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary mt-0.5" />
            <span>{post.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              Publicado {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={post.profiles?.avatar_url} />
              <AvatarFallback>{post.profiles?.display_name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <span>{post.profiles?.display_name || "Usuario"}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleContact} disabled={loading}>
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

export default AdoptionDetailCard;
