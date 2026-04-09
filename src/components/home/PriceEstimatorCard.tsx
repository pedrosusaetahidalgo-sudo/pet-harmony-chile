import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, MapPin, ChevronRight } from "@/lib/icons";
import type { VetServiceType, VetPriceStats } from "@/hooks/useVetPriceEstimator";
import { VET_SERVICE_LABELS } from "@/hooks/useVetPriceEstimator";

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);

/** Services to highlight in the home card */
const HOME_SERVICES: VetServiceType[] = [
  "consulta_general",
  "vacuna",
  "control_sano",
];

interface PriceEstimatorCardProps {
  /** Active pet name to personalise the title */
  petName?: string | null;
}

/**
 * Compact price estimator card for the Home dashboard.
 * Shows median prices for 3 key services in the user's commune.
 * Falls back to a banner prompting the user to set their commune.
 */
export function PriceEstimatorCard({ petName }: PriceEstimatorCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user's commune from profile
  const { data: profileComuna, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile-comuna", user?.id],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("location")
        .eq("id", user!.id)
        .maybeSingle();
      return (data?.location as string) || null;
    },
  });

  // Fetch prices for that commune
  const { data: prices, isLoading: loadingPrices } = useQuery({
    queryKey: ["vet-price-estimator", profileComuna ?? "none"],
    enabled: !!profileComuna,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<VetPriceStats[]> => {
      const { data, error } = await supabase
        .from("vet_prices_by_comuna")
        .select("*")
        .eq("comuna", profileComuna!);
      if (error) {
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          return [];
        }
        throw error;
      }
      return (data ?? []) as VetPriceStats[];
    },
  });

  const byService = useMemo(() => {
    const map = new Map<VetServiceType, VetPriceStats>();
    for (const row of prices ?? []) {
      if (!map.has(row.service_type)) {
        map.set(row.service_type, row);
      }
    }
    return map;
  }, [prices]);

  const isLoading = loadingProfile || (!!profileComuna && loadingPrices);

  if (isLoading) {
    return (
      <Card className="border-l-4 border-l-amber-400">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  // No commune set -- prompt user
  if (!profileComuna) {
    return (
      <Card className="border-l-4 border-l-amber-400 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 p-2 flex-shrink-0">
              <MapPin className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 mb-1">
                Agrega tu comuna para estimaciones precisas
              </p>
              <p className="text-xs text-amber-800 mb-2">
                Podremos mostrarte cuánto cuesta una consulta veterinaria cerca de ti.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={() => navigate("/settings")}
              >
                Ir a configuración
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Has commune but no price data available
  const availableServices = HOME_SERVICES.filter((s) => byService.has(s));
  if (availableServices.length === 0) {
    return null; // Don't render anything if no data
  }

  const title = petName
    ? `¿Cuánto cuesta la próxima visita de ${petName}?`
    : "¿Cuánto cuesta la próxima visita al vet?";

  return (
    <Card className="border-l-4 border-l-purple-600 bg-purple-50/30">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="rounded-full bg-purple-100 p-1.5 flex-shrink-0">
            <DollarSign className="h-4 w-4 text-purple-700" />
          </div>
          <span className="text-purple-900">{title}</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground ml-9">
          Precios en {profileComuna}
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="grid gap-2 mb-3">
          {availableServices.map((svc) => {
            const stats = byService.get(svc)!;
            return (
              <div
                key={svc}
                className="flex items-center justify-between py-1.5 border-b last:border-0"
              >
                <span className="text-sm text-foreground">
                  {VET_SERVICE_LABELS[svc]}
                </span>
                <span className="text-sm font-bold text-purple-700">
                  {formatPrice(stats.median_price)}
                </span>
              </div>
            );
          })}
        </div>
        <Button
          variant="link"
          size="sm"
          className="w-full text-xs h-8 text-purple-700 hover:text-purple-900 p-0"
          onClick={() => navigate("/precios-veterinarios")}
        >
          Ver todos los precios en tu comuna
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default PriceEstimatorCard;
