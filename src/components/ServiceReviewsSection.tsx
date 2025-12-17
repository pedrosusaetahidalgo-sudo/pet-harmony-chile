import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MessageSquare, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import EnhancedReviewCard from "./EnhancedReviewCard";
import ProviderRatingSummary from "./ProviderRatingSummary";

interface ServiceReviewsSectionProps {
  providerId: string;
  providerType: "walk" | "dogsitter" | "vet" | "training";
  rating: number;
  totalReviews: number;
  isVerified?: boolean;
  isProvider?: boolean;
}

const ServiceReviewsSection = ({
  providerId,
  providerType,
  rating,
  totalReviews,
  isVerified = false,
  isProvider = false
}: ServiceReviewsSectionProps) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"recent" | "highest" | "lowest" | "helpful">("recent");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });

  useEffect(() => {
    loadReviews();
  }, [providerId, providerType, sortBy, filterRating]);

  const getTableName = () => {
    switch (providerType) {
      case "walk":
        return "walk_reviews";
      case "dogsitter":
        return "dogsitter_reviews";
      case "vet":
        return "vet_reviews";
      case "training":
        return "training_reviews";
    }
  };

  const getProviderColumn = () => {
    switch (providerType) {
      case "walk":
        return "walker_id";
      case "dogsitter":
        return "dogsitter_id";
      case "vet":
        return "vet_id";
      case "training":
        return "trainer_id";
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const tableName = getTableName();
      const providerColumn = getProviderColumn();

      let query = supabase
        .from(tableName as any)
        .select(`
          *,
          owner:owner_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq(providerColumn, providerId);

      // Apply rating filter
      if (filterRating !== "all") {
        query = query.eq("rating", parseInt(filterRating));
      }

      // Apply sorting
      switch (sortBy) {
        case "recent":
          query = query.order("created_at", { ascending: false });
          break;
        case "highest":
          query = query.order("rating", { ascending: false });
          break;
        case "lowest":
          query = query.order("rating", { ascending: true });
          break;
        case "helpful":
          query = query.order("helpful_count", { ascending: false });
          break;
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setReviews(data || []);

      // Calculate distribution
      const allReviews = await supabase
        .from(tableName as any)
        .select("rating")
        .eq(providerColumn, providerId);

      if (allReviews.data) {
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        allReviews.data.forEach((r: any) => {
          if (r.rating >= 1 && r.rating <= 5) {
            dist[r.rating as keyof typeof dist]++;
          }
        });
        setRatingDistribution(dist);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const getReviewType = (): "walk" | "dogsitter" | "vet" => {
    if (providerType === "training") return "vet";
    return providerType;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Reseñas y Calificaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Summary */}
        <ProviderRatingSummary
          rating={rating}
          totalReviews={totalReviews}
          isVerified={isVerified}
          ratingDistribution={ratingDistribution}
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="highest">Mayor calificación</SelectItem>
                <SelectItem value="lowest">Menor calificación</SelectItem>
                <SelectItem value="helpful">Más útiles</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Filtrar estrellas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="5">5 estrellas</SelectItem>
              <SelectItem value="4">4 estrellas</SelectItem>
              <SelectItem value="3">3 estrellas</SelectItem>
              <SelectItem value="2">2 estrellas</SelectItem>
              <SelectItem value="1">1 estrella</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-8">
            <Star className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground">Cargando reseñas...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-1">No hay reseñas aún</p>
            <p className="text-xs text-muted-foreground">
              Las reseñas aparecerán aquí después de servicios completados
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <EnhancedReviewCard
                key={review.id}
                reviewType={getReviewType()}
                review={review}
                providerId={providerId}
                isProvider={isProvider}
              />
            ))}
          </div>
        )}

        {reviews.length >= 20 && (
          <Button variant="outline" className="w-full">
            Cargar más reseñas
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceReviewsSection;
