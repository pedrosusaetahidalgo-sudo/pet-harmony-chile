import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle } from "@/lib/icons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LINKS } from "@/lib/links";

type Plan = "monthly" | "yearly";

const FEATURES = [
  "Mascotas ilimitadas",
  "Historial médico completo y descargable",
  "Recordatorios de vacunas y controles ilimitados",
  "Exportación de ficha clínica en PDF",
  "Soporte prioritario",
];

export default function Upgrade() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<Plan | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoading(plan);
    try {
      const { data, error } = await supabase.functions.invoke("flow-create-subscription", {
        body: { plan },
      });
      if (error) throw error;
      const url = (data as { url?: string })?.url;
      if (!url) throw new Error("Respuesta inválida del servidor de pagos");
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "No se pudo iniciar el pago",
        description: msg,
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  return (
    <div className="container px-4 py-8 max-w-3xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Paw Friend Premium</h1>
        <p className="text-muted-foreground">
          Cuidá a todas tus mascotas con la ficha médica completa, recordatorios ilimitados y todo el directorio de vets.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Mensual */}
        <Card>
          <CardHeader>
            <CardTitle>Mensual</CardTitle>
            <CardDescription>Pago mes a mes, cancelás cuando quieras</CardDescription>
            <div className="pt-2">
              <span className="text-3xl font-bold">$2.990</span>
              <span className="text-muted-foreground"> / mes</span>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full h-12"
              variant="outline"
              onClick={() => handleSubscribe("monthly")}
              disabled={loading !== null}
            >
              {loading === "monthly" ? "Redirigiendo a Flow…" : "Suscribirme mensual"}
            </Button>
          </CardContent>
        </Card>

        {/* Anual */}
        <Card className="border-primary relative">
          <Badge className="absolute -top-2 right-4">Ahorrá 30%</Badge>
          <CardHeader>
            <CardTitle>Anual</CardTitle>
            <CardDescription>2 meses gratis vs el plan mensual</CardDescription>
            <div className="pt-2">
              <span className="text-3xl font-bold">$24.990</span>
              <span className="text-muted-foreground"> / año</span>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full h-12"
              onClick={() => handleSubscribe("yearly")}
              disabled={loading !== null}
            >
              {loading === "yearly" ? "Redirigiendo a Flow…" : "Suscribirme anual"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Qué incluye</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="text-center mt-6">
        <Button variant="ghost" onClick={() => navigate(LINKS.myPets())}>
          Volver a mis mascotas
        </Button>
      </div>
    </div>
  );
}
