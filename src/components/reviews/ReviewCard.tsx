import { StarRating } from "./StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MessageCircle } from "lucide-react";

interface Props {
  review: {
    id: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
    created_at: string;
    provider_response?: string | null;
    provider_responded_at?: string | null;
    reviewer?: {
      display_name?: string;
      avatar_url?: string;
    };
  };
}

export function ReviewCard({ review }: Props) {
  return (
    <div className="py-4 border-b last:border-0">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={review.reviewer?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {review.reviewer?.display_name?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>
          <p className="text-xs font-medium">{review.reviewer?.display_name || "Usuario"}</p>
          {review.title && <p className="text-sm font-medium mt-1">{review.title}</p>}
          {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}

          {review.provider_response && (
            <div className="mt-3 ml-4 pl-3 border-l-2 border-primary/20">
              <div className="flex items-center gap-1 mb-1">
                <MessageCircle className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">Respuesta del proveedor</span>
              </div>
              <p className="text-xs text-muted-foreground">{review.provider_response}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
