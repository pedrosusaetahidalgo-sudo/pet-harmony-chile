import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReviewCard } from "./ReviewCard";
import { ReviewSummary } from "./ReviewSummary";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  providerId: string;
}

export function ReviewsList({ providerId }: Props) {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["provider-reviews", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_reviews")
        .select(
          "*, reviewer:profiles!service_reviews_reviewer_id_profiles_fkey(display_name, avatar_url)"
        )
        .eq("provider_id", providerId)
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      // types.ts aún no refleja la FK service_reviews_reviewer_id_profiles_fkey
      // (regla del proyecto: no regenerar). El embed funciona en runtime una
      // vez aplicada la migración 20260409000000.
      type ReviewWithReviewer = {
        id: string;
        rating: number;
        title?: string;
        comment?: string;
        created_at: string;
        provider_response?: string;
        provider_responded_at?: string;
        reviewer?: { display_name?: string; avatar_url?: string };
      };
      return ((data ?? []) as unknown) as ReviewWithReviewer[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!reviews?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Este proveedor aún no tiene reseñas.</p>
      </div>
    );
  }

  // Calculate distribution
  const distribution = [0, 0, 0, 0, 0];
  let totalRating = 0;
  reviews.forEach((r) => {
    distribution[r.rating - 1]++;
    totalRating += r.rating;
  });
  const avgRating = totalRating / reviews.length;

  return (
    <div className="space-y-4">
      <ReviewSummary
        avgRating={avgRating}
        totalReviews={reviews.length}
        distribution={distribution}
      />
      <div className="divide-y">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
