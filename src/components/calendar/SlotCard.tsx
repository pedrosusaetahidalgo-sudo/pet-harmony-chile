import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/reviews/StarRating";
import { Clock, Users } from "lucide-react";

const typeLabels: Record<string, string> = {
  vet: "Veterinaria",
  walk: "Paseo",
  dogsitter: "Cuidador",
  training: "Entrenamiento",
  grooming: "Peluqueria",
};

interface Props {
  slot: any;
  onBook: () => void;
}

export function SlotCard({ slot, onBook }: Props) {
  const provider = slot.provider;
  const profile = provider?.profiles;
  const isFull = slot.current_bookings >= slot.max_capacity;
  const spotsLeft = slot.max_capacity - slot.current_bookings;
  const price = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(slot.price);

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>{profile?.display_name?.[0] || "P"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">{profile?.display_name || "Proveedor"}</p>
              <Badge variant="secondary" className="text-[10px] px-1.5">
                {typeLabels[slot.service_type] || slot.service_type}
              </Badge>
            </div>
            {slot.title && <p className="text-xs text-muted-foreground mt-0.5">{slot.title}</p>}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
              </span>
              {provider?.avg_rating > 0 && (
                <span className="flex items-center gap-1">
                  <StarRating rating={Math.round(provider.avg_rating)} size="sm" />
                  <span>({provider.total_reviews})</span>
                </span>
              )}
              {slot.max_capacity > 1 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {spotsLeft}/{slot.max_capacity} cupos
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-primary">{price}</p>
            <Button
              size="sm"
              className="mt-2 h-8 text-xs"
              onClick={onBook}
              disabled={isFull}
            >
              {isFull ? "Lleno" : "Reservar"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
