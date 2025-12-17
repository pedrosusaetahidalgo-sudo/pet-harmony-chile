import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useGoogleMapsKey() {
  return useQuery({
    queryKey: ["google-maps-key"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-google-maps-key");
      
      if (error) {
        console.error("Error fetching Google Maps key:", error);
        return null;
      }
      
      return data?.apiKey || null;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
