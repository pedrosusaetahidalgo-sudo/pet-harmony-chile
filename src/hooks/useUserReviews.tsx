import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserReview {
  id: string;
  type: "walk" | "dogsitter" | "vet" | "training";
  rating: number;
  comment: string | null;
  created_at: string;
  photos: string[];
  is_verified: boolean;
  helpful_count: number;
  provider_response: string | null;
  provider_response_date: string | null;
  provider: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  booking_id: string;
  pet_ids?: string[];
}

export const useUserReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserReviews();
    }
  }, [user]);

  const loadUserReviews = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load walk reviews
      const { data: walkReviews } = await supabase
        .from("walk_reviews")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      // Load dogsitter reviews
      const { data: dogsitterReviews } = await supabase
        .from("dogsitter_reviews")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      // Load vet reviews
      const { data: vetReviews } = await supabase
        .from("vet_reviews")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      // Load training reviews
      const { data: trainingReviews } = await supabase
        .from("training_reviews")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      // Helper to get provider profile
      const getProfile = async (userId: string) => {
        const { data } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .eq("id", userId)
          .maybeSingle();
        return data;
      };

      // Combine and format all reviews
      const allReviews: UserReview[] = [];

      for (const r of walkReviews || []) {
        const provider = await getProfile(r.walker_id);
        allReviews.push({
          id: r.id,
          type: "walk",
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          photos: r.photos || [],
          is_verified: r.is_verified || false,
          helpful_count: r.helpful_count || 0,
          provider_response: r.provider_response,
          provider_response_date: r.provider_response_date,
          provider: provider ? {
            id: provider.id,
            display_name: provider.display_name || "Paseador",
            avatar_url: provider.avatar_url
          } : null,
          booking_id: r.booking_id
        });
      }

      for (const r of dogsitterReviews || []) {
        const provider = await getProfile(r.dogsitter_id);
        allReviews.push({
          id: r.id,
          type: "dogsitter",
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          photos: r.photos || [],
          is_verified: r.is_verified || false,
          helpful_count: r.helpful_count || 0,
          provider_response: r.provider_response,
          provider_response_date: r.provider_response_date,
          provider: provider ? {
            id: provider.id,
            display_name: provider.display_name || "Cuidador",
            avatar_url: provider.avatar_url
          } : null,
          booking_id: r.booking_id
        });
      }

      for (const r of vetReviews || []) {
        const provider = await getProfile(r.vet_id);
        allReviews.push({
          id: r.id,
          type: "vet",
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          photos: r.photos || [],
          is_verified: r.is_verified || false,
          helpful_count: r.helpful_count || 0,
          provider_response: r.provider_response,
          provider_response_date: r.provider_response_date,
          provider: provider ? {
            id: provider.id,
            display_name: provider.display_name || "Veterinario",
            avatar_url: provider.avatar_url
          } : null,
          booking_id: r.booking_id
        });
      }

      for (const r of trainingReviews || []) {
        const provider = await getProfile(r.trainer_id);
        allReviews.push({
          id: r.id,
          type: "training",
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          photos: r.photos || [],
          is_verified: r.is_verified || false,
          helpful_count: r.helpful_count || 0,
          provider_response: r.provider_response,
          provider_response_date: r.provider_response_date,
          provider: provider ? {
            id: provider.id,
            display_name: provider.display_name || "Entrenador",
            avatar_url: provider.avatar_url
          } : null,
          booking_id: r.booking_id
        });
      }

      // Sort by date
      allReviews.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setReviews(allReviews);
    } catch (error) {
      console.error("Error loading user reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  return { reviews, loading, refetch: loadUserReviews };
};
