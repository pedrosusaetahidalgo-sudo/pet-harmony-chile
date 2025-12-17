import { Star, CheckCircle, MessageSquare, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ProviderRatingSummaryProps {
  rating: number;
  totalReviews: number;
  isVerified?: boolean;
  compact?: boolean;
  ratingDistribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

const ProviderRatingSummary = ({ 
  rating, 
  totalReviews, 
  isVerified = false,
  compact = false,
  ratingDistribution
}: ProviderRatingSummaryProps) => {
  const totalDistribution = ratingDistribution 
    ? Object.values(ratingDistribution).reduce((a, b) => a + b, 0)
    : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold text-sm">{rating.toFixed(1)}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          ({totalReviews} {totalReviews === 1 ? "reseña" : "reseñas"})
        </span>
        {isVerified && (
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
            <CheckCircle className="h-3 w-3" />
            Verificado
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Rating */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold">{rating.toFixed(1)}</div>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalReviews} {totalReviews === 1 ? "reseña" : "reseñas"}
          </p>
        </div>

        {/* Distribution bars */}
        {ratingDistribution && totalDistribution > 0 && (
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingDistribution[stars as keyof typeof ratingDistribution];
              const percentage = (count / totalDistribution) * 100;
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-xs w-3 text-muted-foreground">{stars}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="text-xs w-6 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {isVerified && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
            <CheckCircle className="h-3 w-3" />
            Proveedor Verificado
          </Badge>
        )}
        {totalReviews >= 10 && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
            <MessageSquare className="h-3 w-3" />
            +10 Reseñas
          </Badge>
        )}
        {rating >= 4.5 && totalReviews >= 5 && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 gap-1">
            <TrendingUp className="h-3 w-3" />
            Top Calificado
          </Badge>
        )}
      </div>
    </div>
  );
};

export default ProviderRatingSummary;
