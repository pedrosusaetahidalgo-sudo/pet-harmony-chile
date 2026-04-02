import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  rating: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "lg";
  showLabel?: boolean;
}

const labels = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

export function StarRating({ rating, onChange, size = "sm", showLabel = false }: Props) {
  const interactive = !!onChange;
  const starSize = size === "lg" ? "h-8 w-8" : "h-4 w-4";

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            interactive && "cursor-pointer hover:scale-110",
            !interactive && "cursor-default"
          )}
        >
          <Star
            className={cn(
              starSize,
              star <= rating
                ? "fill-primary text-primary"
                : "fill-none text-muted-foreground/30"
            )}
          />
        </button>
      ))}
      {showLabel && rating > 0 && (
        <span className="text-sm text-muted-foreground ml-2">{labels[rating]}</span>
      )}
    </div>
  );
}
