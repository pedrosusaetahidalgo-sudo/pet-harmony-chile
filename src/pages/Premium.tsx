import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, X, Sparkles, Shield, Zap } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/hooks/useAuth";
import { PLANS, FEATURE_LABELS, formatCLP, PlanId } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Premium() {
  const { user } = useAuth();
  const { planId, plan, expiresAt } = usePlan();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (targetPlan: PlanId) => {
    if (!user || targetPlan === "free") return;
    setLoading(targetPlan);

    try {
      const { data, error } = await supabase.functions.invoke("payment-create", {
        body: {
          payment_type: "subscription",
          plan_id: targetPlan,
          billing_cycle: billing,
          return_url: `${window.location.origin}/payment-result`,
        },
      });

      if (error || !data?.payment_id) throw new Error("Payment creation failed");

      // Simulate: confirm immediately
      const { data: confirm, error: confirmErr } = await supabase.functions.invoke("payment-confirm", {
        body: { payment_id: data.payment_id, token: data.token },
      });

      if (confirmErr || !confirm?.success) throw new Error("Payment confirmation failed");

      queryClient.invalidateQueries({ queryKey: ["user-plan"] });
      queryClient.invalidateQueries({ queryKey: ["user-premium-status"] });
      toast({ title: "¡Bienvenido a " + PLANS[targetPlan].name + "!", description: "+50 puntos ganados" });
    } catch {
      toast({ title: "Error", description: "No se pudo procesar el pago. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const planOrder: PlanId[] = ["free", "premium", "premium_plus"];
  const planIcons = { free: Shield, premium: Crown, premium_plus: Sparkles };
  const planColors = {
    free: "border-muted",
    premium: "border-amber-300 shadow-amber-100",
    premium_plus: "border-purple-400 shadow-purple-100",
  };

  const featureKeys = [
    "max_pets", "max_reminders", "ai_behavior_analysis", "ai_vet_assistant",
    "export_pdf", "share_clinical", "medical_history", "weekly_summary",
    "booking_user_fee", "priority_support", "ad_free",
  ];

  const renderValue = (value: string | number | boolean) => {
    if (typeof value === "boolean") {
      return value
        ? <Check className="h-4 w-4 text-green-600" />
        : <X className="h-4 w-4 text-muted-foreground/30" />;
    }
    if (typeof value === "number") {
      if (value === -1) return <span className="text-xs font-medium">Ilimitado</span>;
      if (value === 0) return <X className="h-4 w-4 text-muted-foreground/30" />;
      return <span className="text-xs font-medium">{value}/mes</span>;
    }
    if (value === "all") return <span className="text-xs font-medium">Completo</span>;
    if (value === "1_year") return <span className="text-xs font-medium">Último año</span>;
    return <span className="text-xs">{value}</span>;
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3 py-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-purple-500 flex items-center justify-center mx-auto shadow-lg">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Elige tu plan</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Desbloquea todo el potencial de Paw Friend para ti y tus mascotas
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center">
          <div className="bg-muted rounded-full p-1 flex gap-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                billing === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                billing === "yearly" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              Anual — ahorra 17%
            </button>
          </div>
        </div>

        {/* Current plan info */}
        {planId !== "free" && expiresAt && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Plan actual: {plan.name} {plan.badge}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Renueva: {new Date(expiresAt).toLocaleDateString("es-CL")}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planOrder.map((id) => {
            const p = PLANS[id];
            const Icon = planIcons[id];
            const isCurrentPlan = id === planId;
            const price = billing === "monthly" ? p.monthlyPrice : p.yearlyMonthly;
            const isRecommended = id === "premium";

            return (
              <Card
                key={id}
                className={`relative ${planColors[id]} ${isRecommended ? "shadow-lg ring-2 ring-amber-300" : "shadow-sm"}`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-500 text-white text-[10px]">Más popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-2 text-center">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{p.name} {p.badge}</CardTitle>
                  <div className="mt-2">
                    {id === "free" ? (
                      <span className="text-2xl font-bold">Gratis</span>
                    ) : (
                      <>
                        <span className="text-2xl font-bold">{formatCLP(price)}</span>
                        <span className="text-xs text-muted-foreground">/mes</span>
                        {billing === "yearly" && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatCLP(p.yearlyPrice)} facturado anual
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {featureKeys.slice(0, 6).map((key) => {
                    const val = p.features[key];
                    return (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{FEATURE_LABELS[key]}</span>
                        <span>{renderValue(val)}</span>
                      </div>
                    );
                  })}

                  <div className="pt-3">
                    {isCurrentPlan ? (
                      <Button variant="outline" className="w-full" disabled>
                        Plan actual
                      </Button>
                    ) : id === "free" ? (
                      <Button variant="outline" className="w-full" disabled>
                        Incluido
                      </Button>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        variant={isRecommended ? "default" : "outline"}
                        disabled={!!loading}
                        onClick={() => handleSubscribe(id)}
                      >
                        {loading === id ? "Procesando..." : planId === "free" ? "Comenzar" : "Mejorar"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Full comparison table */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Comparación completa</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Función</th>
                    {planOrder.map((id) => (
                      <th key={id} className="text-center p-3 font-medium">{PLANS[id].name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureKeys.map((key) => (
                    <tr key={key} className="border-b">
                      <td className="p-3 text-muted-foreground">{FEATURE_LABELS[key]}</td>
                      {planOrder.map((id) => (
                        <td key={id} className="text-center p-3">
                          {renderValue(PLANS[id].features[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2 py-4 text-xs text-muted-foreground">
          <p>Cancela cuando quieras -- tu plan sigue activo hasta el final del periodo</p>
          <p>Pago seguro con Webpay</p>
        </div>
      </div>
    </AppLayout>
  );
}
