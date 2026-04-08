import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "@/lib/icons";
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
    <div className="container px-4 py-12 max-w-md mx-auto animate-fade-in">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <CheckCircle className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">¡Pago confirmado!</CardTitle>
          <CardDescription className="mt-2">
            Tu cuenta Premium está activa. Ya podés agregar todas tus mascotas y desbloquear el historial médico completo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full h-12" onClick={() => navigate(LINKS.myPets())}>
            Ir a mis mascotas
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate("/add-pet")}>
            Agregar una mascota ahora
          </Button>
        </CardContent>
      </Card>
      <p className="text-xs text-center text-muted-foreground mt-4">
        Si el plan no se activa en unos segundos, refrescá la página. El procesamiento de Flow puede tardar unos instantes.
      </p>
    </div>
  );
}
