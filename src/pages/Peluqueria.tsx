import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Scissors,
  ArrowLeft,
  Bell,
  MapPin,
  Star,
  Loader2,
} from "@/lib/icons";
import { LINKS } from "@/lib/links";
import { supabase } from "@/integrations/supabase/client";

// Tipo no regenerado todavía (tabla nueva). Eliminar el cast cuando se corra
// `npx supabase gen types typescript`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface GroomerRow {
  id: string;
  user_id: string;
  business_name: string | null;
  bio: string | null;
  experience_years: number | null;
  base_price_clp: number | null;
  services_offered: string[] | null;
  accepts_cats: boolean | null;
  accepts_dogs: boolean | null;
  mobile_service: boolean | null;
  commune: string | null;
  avg_rating: number | null;
  total_reviews: number | null;
}

function formatCLP(amount: number | null | undefined): string {
  if (!amount) return "Consultar";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Peluqueria() {
  const navigate = useNavigate();

  const { data: groomers, isLoading } = useQuery<GroomerRow[]>({
    queryKey: ["groomer-profiles-approved"],
    queryFn: async () => {
      const { data, error } = await sb
        .from("groomer_profiles")
        .select("*")
        .eq("status", "approved")
        .order("avg_rating", { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) {
        // Si la tabla no existe todavía (migración no aplicada), devolver vacío
        console.warn("groomer_profiles query failed:", error.message);
        return [];
      }
      return (data ?? []) as GroomerRow[];
    },
  });

  const hasResults = (groomers?.length ?? 0) > 0;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 md:py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(LINKS.servicios())}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a servicios
      </Button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-full bg-pink-100 p-3">
          <Scissors className="h-7 w-7 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Peluquería para mascotas</h1>
          <p className="text-sm text-muted-foreground">
            Baño, corte y arreglo profesional para perros y gatos
          </p>
        </div>
      </div>

      {/* Banner: ¿eres peluquero? */}
      <div className="mb-6 p-3 bg-pink-50 border border-pink-200 rounded-lg flex items-center justify-between gap-3">
        <p className="text-sm text-pink-900">
          ¿Eres peluquero canino? Crea tu perfil y aparece en este directorio.
        </p>
        <Button
          size="sm"
          onClick={() => navigate(LINKS.groomerProfileEdit())}
          className="bg-pink-600 hover:bg-pink-700 flex-shrink-0"
        >
          Crear perfil
        </Button>
      </div>

      {/* Lista o estado vacío */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : hasResults ? (
        <div className="grid gap-3 md:grid-cols-2">
          {groomers!.map((g) => (
            <Card key={g.id} className="hover:shadow-md transition border-pink-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarFallback className="bg-pink-100 text-pink-700">
                      <Scissors className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {g.business_name ?? "Peluquero"}
                    </h3>
                    {g.commune && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {g.commune}
                        {g.mobile_service && (
                          <Badge variant="secondary" className="ml-1 text-[10px]">
                            A domicilio
                          </Badge>
                        )}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      {Number(g.avg_rating ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <strong>{Number(g.avg_rating).toFixed(1)}</strong>
                          <span className="text-muted-foreground">
                            ({g.total_reviews ?? 0})
                          </span>
                        </span>
                      )}
                      {g.base_price_clp && (
                        <span className="text-pink-700 font-medium">
                          Desde {formatCLP(g.base_price_clp)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Estado vacío "Próximamente"
        <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
          <CardContent className="p-8 md:p-12 text-center space-y-5">
            <div className="inline-flex p-4 rounded-full bg-pink-100">
              <Loader2 className="h-10 w-10 text-pink-600 animate-spin-slow" />
            </div>

            <h2 className="text-xl md:text-2xl font-bold">Estamos sumando peluqueros</h2>

            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Aún no hay peluqueros registrados en tu zona. Estamos contactando a profesionales para sumarse al directorio.
            </p>

            <div className="bg-white rounded-lg p-4 border border-pink-200 max-w-md mx-auto">
              <div className="flex items-start gap-3 text-left">
                <Bell className="h-5 w-5 text-pink-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">¿Eres peluquero canino?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Súmate al directorio escribiendo a{" "}
                    <a
                      href="mailto:hola@pawfriend.cl"
                      className="text-pink-700 hover:underline font-medium"
                    >
                      hola@pawfriend.cl
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button onClick={() => navigate(LINKS.servicios())} variant="outline">
                Ver otros servicios
              </Button>
              <Button
                onClick={() => navigate(LINKS.vets())}
                className="bg-amber-500 hover:bg-amber-600"
              >
                Buscar veterinario
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
