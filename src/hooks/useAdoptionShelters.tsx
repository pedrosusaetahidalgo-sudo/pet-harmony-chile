import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdoptionShelter {
  id: string;
  name: string;
  type: string;
  description?: string;
  ai_description?: string;
  address?: string;
  commune?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  social_media?: { instagram?: string; facebook?: string };
  animal_types?: string[];
  pet_sizes?: string[];
  specialties?: string[];
  formality_level?: string;
  is_verified?: boolean;
  is_active?: boolean;
  ai_processed_at?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}

export const useAdoptionShelters = () => {
  const queryClient = useQueryClient();

  // Fetch all active shelters
  const { data: shelters, isLoading, error, refetch } = useQuery({
    queryKey: ["adoption-shelters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("adoption_shelters")
        .select("*")
        .eq("is_active", true)
        .order("is_verified", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as AdoptionShelter[];
    },
  });

  // Generate shelters using edge function
  const generateShelters = useMutation({
    mutationFn: async (count: number = 15) => {
      const { data, error } = await supabase.functions.invoke("generate-shelters", {
        body: { action: "generate", count },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adoption-shelters"] });
      toast.success("Refugios generados exitosamente");
    },
    onError: (error: Error) => {
      console.error("Error generating shelters:", error);
      toast.error("Error al generar refugios");
    },
  });

  // Filter shelters by criteria
  const filterShelters = (
    shelterList: AdoptionShelter[] | undefined,
    filters: {
      type?: string;
      animalType?: string;
      commune?: string;
      searchRadius?: number;
      userLat?: number;
      userLng?: number;
    }
  ) => {
    if (!shelterList) return [];

    return shelterList.filter((shelter) => {
      // Filter by type
      if (filters.type && filters.type !== "all" && shelter.type !== filters.type) {
        return false;
      }

      // Filter by animal type
      if (filters.animalType && filters.animalType !== "all") {
        if (!shelter.animal_types?.includes(filters.animalType)) {
          return false;
        }
      }

      // Filter by commune
      if (filters.commune && filters.commune !== "all" && shelter.commune !== filters.commune) {
        return false;
      }

      // Filter by distance
      if (
        filters.searchRadius &&
        filters.searchRadius < 100 &&
        filters.userLat &&
        filters.userLng &&
        shelter.latitude &&
        shelter.longitude
      ) {
        const distance = calculateDistance(
          filters.userLat,
          filters.userLng,
          shelter.latitude,
          shelter.longitude
        );
        if (distance > filters.searchRadius) {
          return false;
        }
      }

      return true;
    });
  };

  // Get unique communes from shelters
  const getCommunes = () => {
    if (!shelters) return [];
    const communes = new Set(shelters.map((s) => s.commune).filter(Boolean));
    return Array.from(communes).sort();
  };

  return {
    shelters,
    isLoading,
    error,
    refetch,
    generateShelters,
    filterShelters,
    getCommunes,
    hasNoShelters: !isLoading && (!shelters || shelters.length === 0),
  };
};

// Utility function for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default useAdoptionShelters;
