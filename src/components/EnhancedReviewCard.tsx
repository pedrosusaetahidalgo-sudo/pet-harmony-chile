import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, CheckCircle, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface EnhancedReviewCardProps {
  reviewType: "walk" | "dogsitter" | "vet";
  review: {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    updated_at?: string;
    photos?: string[];
    is_verified?: boolean;
    helpful_count?: number;
    provider_response?: string;
    provider_response_date?: string;
    owner?: {
      id: string;
      display_name?: string;
      avatar_url?: string;
    };
  };
  providerId?: string;
  isProvider?: boolean;
}

const EnhancedReviewCard = ({ reviewType, review, providerId, isProvider }: EnhancedReviewCardProps) => {
  const { user } = useAuth();
  const [isResponding, setIsResponding] = useState(false);
  const [response, setResponse] = useState("");
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);

  const handleHelpfulVote = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para marcar como útil");
      return;
    }

    try {
      if (isHelpful) {
        // Remove vote
        await supabase
          .from("review_helpful_votes")
          .delete()
          .eq("review_type", reviewType)
          .eq("review_id", review.id)
          .eq("user_id", user.id);
        
        setIsHelpful(false);
        setHelpfulCount(prev => Math.max(0, prev - 1));
      } else {
        // Add vote
        await supabase
          .from("review_helpful_votes")
          .insert({
            review_type: reviewType,
            review_id: review.id,
            user_id: user.id
          });
        
        setIsHelpful(true);
        setHelpfulCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Error al votar");
    }
  };

  const handleSubmitResponse = async () => {
    if (!response.trim()) return;

    try {
      const tableName = reviewType === "walk" 
        ? "walk_reviews" 
        : reviewType === "dogsitter" 
        ? "dogsitter_reviews" 
        : "vet_reviews";

      await supabase
        .from(tableName as any)
        .update({
          provider_response: response,
          provider_response_date: new Date().toISOString()
        })
        .eq("id", review.id);

      toast.success("Respuesta publicada exitosamente");
      setIsResponding(false);
      setResponse("");
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Error al publicar respuesta");
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={review.owner?.avatar_url} />
            <AvatarFallback>{review.owner?.display_name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{review.owner?.display_name || "Usuario"}</p>
              {review.is_verified && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Verificado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(review.created_at), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {review.comment && (
        <p className="text-foreground leading-relaxed">{review.comment}</p>
      )}

      {review.photos && review.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {review.photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Foto ${index + 1}`}
              className="rounded-lg w-full h-24 object-cover"
            />
          ))}
        </div>
      )}

      {review.provider_response && (
        <Card className="bg-muted/50 p-4 space-y-2 border-l-4 border-primary">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <p className="font-semibold text-sm">Respuesta del proveedor</p>
          </div>
          <p className="text-sm text-foreground">{review.provider_response}</p>
          {review.provider_response_date && (
            <p className="text-xs text-muted-foreground">
              {format(new Date(review.provider_response_date), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          )}
        </Card>
      )}

      <div className="flex items-center justify-between pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHelpfulVote}
          className="gap-2"
        >
          <ThumbsUp className={`h-4 w-4 ${isHelpful ? "fill-primary text-primary" : ""}`} />
          <span>Útil ({helpfulCount})</span>
        </Button>

        {isProvider && !review.provider_response && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsResponding(!isResponding)}
          >
            Responder
          </Button>
        )}
      </div>

      {isResponding && (
        <div className="space-y-3 pt-3 border-t">
          <Textarea
            placeholder="Escribe tu respuesta a esta reseña..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmitResponse} size="sm">
              Publicar respuesta
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsResponding(false);
                setResponse("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default EnhancedReviewCard;
