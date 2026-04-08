import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, CheckCircle } from "@/lib/icons";
import { useQueryClient } from "@tanstack/react-query";
import { LINKS } from "@/lib/links";

export default function UpgradeSuccess() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalida el cache del paywall así cuando vuelva a /add-pet ya está premium
    queryClient.invalidateQueries({ queryKey: ["can-add-pet"] });
  }, [queryClient]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(45 100% 90% / 0.7), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 100%, hsl(42 90% 85% / 0.5), transparent 70%)",
        }}
      />
      <div className="container px-4 py-16 max-w-md mx-auto animate-fade-in">
        <Card className="border-2 border-premium/40 bg-premium-gradient-soft shadow-premium overflow-hidden">
          <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-premium-gradient" />
          <CardHeader className="text-center pt-10">
            <div className="mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full bg-premium-gradient blur-2xl opacity-60 animate-premium-shimmer" />
              <div className="relative h-20 w-20 mx-auto rounded-full bg-premium-gradient flex items-center justify-center shadow-premium">
                <Crown className="h-10 w-10 text-premium-foreground" strokeWidth={2.5} />
              </div>
            </div>
            <CardTitle className="text-3xl">
              ¡Bienvenido a{" "}
              <span className="bg-premium-gradient bg-clip-text text-transparent">Premium</span>!
            </CardTitle>
            <CardDescription className="mt-3 text-base leading-relaxed">
              Tu cuenta está activa. Ya puedes agregar todas tus mascotas y desbloqueas el historial médico completo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-8">
            <div className="rounded-lg bg-card/70 backdrop-blur-sm border border-premium/20 p-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-premium-dark shrink-0" strokeWidth={3} />
                <span>Pago confirmado por Flow</span>
              </div>
            </div>
            <Button
              className="w-full h-12 bg-premium-gradient hover:opacity-90 text-premium-foreground border-0 shadow-premium font-semibold"
              onClick={() => navigate(LINKS.myPets())}
            >
              <Crown className="h-4 w-4 mr-2" />
              Ir a mis mascotas
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate("/add-pet")}>
              Agregar una mascota ahora
            </Button>
          </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground mt-4">
          Si el plan no se activa en unos segundos, refresca la página. El procesamiento de Flow puede tardar unos instantes.
        </p>
      </div>
    </div>
  );
}
