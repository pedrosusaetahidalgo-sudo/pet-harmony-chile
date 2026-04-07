import { StarRating } from "./StarRating";

interface Props {
  avgRating: number;
  totalReviews: number;
  distribution: number[]; // [1star, 2star, 3star, 4star, 5star]
}

export function ReviewSummary({ avgRating, totalReviews, distribution }: Props) {
  const maxCount = Math.max(...distribution, 1);

  return (
    <div className="flex gap-6 items-start">
      <div className="text-center">
        <p className="text-3xl font-bold">{avgRating.toFixed(1)}</p>
        <StarRating rating={Math.round(avgRating)} size="sm" />
        <p className="text-xs text-muted-foreground mt-1">{totalReviews} reseñas</p>
      </div>
      <div className="flex-1 space-y-1">
        {[5, 4, 3, 2, 1].map((star) => (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-right">{star}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(distribution[star - 1] / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right text-muted-foreground">{distribution[star - 1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
