import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface PartnerAdProps {
  placement: "home" | "services" | "map" | "content" | "feed";
  category?: "food" | "insurance" | "clinic" | "store" | "adoption" | "general";
  className?: string;
}

export const PartnerAd = ({ placement, category, className }: PartnerAdProps) => {
  const [adShown, setAdShown] = useState(false);

  const { data: partner } = useQuery({
    queryKey: ["partner-ad", placement, category],
    queryFn: async () => {
      let query = supabase
        .from("partners")
        .select("*")
        .eq("placement", placement)
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(1);

      if (category) {
        query = query.eq("category", category);
      }

      // Check date range if specified
      const now = new Date().toISOString();
      query = query.or(
        `start_date.is.null,end_date.is.null,start_date.lte.${now},end_date.gte.${now}`
      );

      const { data, error } = await query.maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching partner ad:", error);
        return null;
      }

      return data;
    },
  });

  // Track impression when ad is shown
  useEffect(() => {
    if (partner && !adShown) {
      setAdShown(true);
      // Increment impression count
      supabase.rpc("increment_partner_impressions", {
        partner_id: partner.id,
      }).catch((error) => {
        console.error("Error tracking impression:", error);
      });
    }
  }, [partner, adShown]);

  const handleClick = () => {
    if (!partner) return;

    // Track click
    supabase.rpc("increment_partner_clicks", {
      partner_id: partner.id,
    }).catch((error) => {
      console.error("Error tracking click:", error);
    });

    // Open link
    if (partner.ad_link) {
      window.open(partner.ad_link, "_blank", "noopener,noreferrer");
    }
  };

  if (!partner) {
    return null;
  }

  const getCategoryBadge = () => {
    const categoryLabels: Record<string, string> = {
      food: "Alimentos",
      insurance: "Seguros",
      clinic: "Clínicas",
      store: "Tiendas",
      adoption: "Adopción",
      general: "Patrocinado",
    };
    return categoryLabels[partner.category] || "Patrocinado";
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <div className="relative">
          {partner.ad_image_url && (
            <img
              src={partner.ad_image_url}
              alt={partner.brand_name}
              className="w-full h-32 object-cover"
            />
          )}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              {getCategoryBadge()}
            </Badge>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">{partner.brand_name}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {partner.ad_text}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleClick}
          >
            Ver más
            <ExternalLink className="h-3 w-3 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

