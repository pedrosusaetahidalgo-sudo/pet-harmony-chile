import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, Crown } from "@/lib/icons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LINKS } from "@/lib/links";
import { PageHeader } from "@/components/PageHeader";

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
    <div className="relative min-h-screen overflow-hidden">
      <PageHeader title="Plan Premium" onBack={() => navigate(LINKS.profile())} />
      {/* Fondo dorado sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(45 100% 92% / 0.6), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, hsl(42 90% 88% / 0.4), transparent 70%)",
        }}
      />

      <div className="container px-4 py-12 max-w-4xl mx-auto animate-fade-in">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-premium-gradient blur-xl opacity-50" />
              <div className="relative h-16 w-16 rounded-full bg-premium-gradient flex items-center justify-center shadow-premium">
                <Crown className="h-8 w-8 text-premium-foreground" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight">
            Paw Friend{" "}
            <span className="bg-premium-gradient bg-clip-text text-transparent">Premium</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Cuida a todas tus mascotas con la ficha médica completa, recordatorios ilimitados y todo el directorio de vets.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {/* Mensual */}
          <Card className="border-2 hover:border-premium/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-xl">Mensual</CardTitle>
              <CardDescription>Pago mes a mes, cancelas cuando quieras</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold tracking-tight">$2.990</span>
                <span className="text-muted-foreground text-base"> / mes</span>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full h-12 text-base"
                variant="outline"
                onClick={() => handleSubscribe("monthly")}
                disabled={loading !== null}
              >
                {loading === "monthly" ? "Redirigiendo a Flow…" : "Suscribirme mensual"}
              </Button>
            </CardContent>
          </Card>

          {/* Anual — destacado */}
          <Card className="border-2 border-premium/60 relative overflow-hidden bg-premium-gradient-soft animate-premium-shimmer">
            {/* Highlight stripe */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1 bg-premium-gradient"
            />
            <Badge
              className="absolute -top-0 right-4 translate-y-3 bg-premium-gradient text-premium-foreground border-0 shadow-premium-sm font-semibold tracking-wide"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AHORRA 30%
            </Badge>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                Anual
                <Crown className="h-4 w-4 text-premium" />
              </CardTitle>
              <CardDescription>2 meses gratis vs el plan mensual</CardDescription>
              <div className="pt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight bg-premium-gradient bg-clip-text text-transparent">
                  $24.990
                </span>
                <span className="text-muted-foreground text-base">/ año</span>
              </div>
              <p className="text-xs text-premium-dark/80 font-medium">
                Equivale a $2.082 por mes
              </p>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full h-12 text-base font-semibold bg-premium-gradient hover:opacity-90 text-premium-foreground shadow-premium border-0"
                onClick={() => handleSubscribe("yearly")}
                disabled={loading !== null}
              >
                {loading === "yearly" ? "Redirigiendo a Flow…" : "Suscribirme anual"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card className="border-premium/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-premium" />
              Qué incluye Premium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-premium-light flex items-center justify-center shrink-0">
                    <CheckCircle className="h-3.5 w-3.5 text-premium-dark" strokeWidth={3} />
                  </div>
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="text-center mt-8 space-y-2">
          <p className="text-xs text-muted-foreground">
            Pago seguro procesado por Flow. Puedes cancelar tu suscripción cuando quieras.
          </p>
          <Button variant="ghost" size="sm" onClick={() => navigate(LINKS.myPets())}>
            Volver a mis mascotas
          </Button>
        </div>
      </div>
    </div>
  );
}
