import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, CheckCircle, ThumbsUp, MessageCircle, Dog, Stethoscope, Home, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useUserReviews, UserReview } from "@/hooks/useUserReviews";

const getServiceIcon = (type: UserReview["type"]) => {
  switch (type) {
    case "walk":
      return <Dog className="h-4 w-4" />;
    case "dogsitter":
      return <Home className="h-4 w-4" />;
    case "vet":
      return <Stethoscope className="h-4 w-4" />;
    case "training":
      return <GraduationCap className="h-4 w-4" />;
  }
};

const getServiceLabel = (type: UserReview["type"]) => {
  switch (type) {
    case "walk":
      return "Paseo";
    case "dogsitter":
      return "Cuidado";
    case "vet":
      return "Veterinario";
    case "training":
      return "Entrenamiento";
  }
};

const getServiceColor = (type: UserReview["type"]) => {
  switch (type) {
    case "walk":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "dogsitter":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
    case "vet":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
    case "training":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
  }
};

const UserReviewHistory = () => {
  const { reviews, loading } = useUserReviews();

  if (loading) {
    return (
      <div className="text-center py-12">
        <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground">Cargando reseñas...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground mb-2">No has dejado reseñas aún</p>
        <p className="text-xs text-muted-foreground">
          Después de usar un servicio, podrás calificarlo aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Mis Reseñas ({reviews.length})</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span>
            Promedio: {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
          </span>
        </div>
      </div>

      {reviews.map((review) => (
        <Card key={`${review.type}-${review.id}`} className="overflow-hidden">
          <CardContent className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.provider?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {review.provider?.display_name?.[0] || "P"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">
                      {review.provider?.display_name || "Proveedor"}
                    </p>
                    <Badge 
                      variant="secondary" 
                      className={`${getServiceColor(review.type)} flex items-center gap-1 text-xs`}
                    >
                      {getServiceIcon(review.type)}
                      {getServiceLabel(review.type)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
            )}

            {/* Photos */}
            {review.photos && review.photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {review.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
                  />
                ))}
              </div>
            )}

            {/* Provider Response */}
            {review.provider_response && (
              <Card className="bg-muted/50 p-3 space-y-1 border-l-4 border-primary">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-3 w-3 text-primary" />
                  <p className="font-medium text-xs">Respuesta del proveedor</p>
                </div>
                <p className="text-xs text-muted-foreground">{review.provider_response}</p>
              </Card>
            )}

            {/* Footer */}
            <div className="flex items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
              {review.is_verified && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>Verificado</span>
                </div>
              )}
              {review.helpful_count > 0 && (
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  <span>{review.helpful_count} útil</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UserReviewHistory;
